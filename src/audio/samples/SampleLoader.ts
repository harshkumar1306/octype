/**
 * SampleLoader — orchestrates fetching, decoding, and caching of samples.
 *
 * Priority order (per spec):
 *   1. Core: middle octave samples (C3..C5 recorded notes, layer 8) load
 *      immediately during initial init.
 *   2. Background: remaining recorded notes at layer 8 fill in next.
 *   3. Background: additional velocity layers fill in last.
 *   4. On-demand: requestSample(midi, layer) bumps a sample to the front
 *      of the queue if a key is pressed and the buffer isn't loaded yet.
 *
 * IndexedDB caching is handled in SampleCache; on a second visit the
 * fetches resolve from the cache instantly.
 */

import { logger } from "@/lib/logger";
import { sampleBank } from "@/audio/samples/SampleBank";
import { loadSampleBytes } from "@/audio/samples/SampleCache";
import {
  RECORDED_MIDI_NOTES,
  VELOCITY_LAYERS,
  fallbackFilenames,
  sampleFilename,
  type SampleRef,
} from "@/audio/samples/SampleMap";

/**
 * Base URL for sample files.
 *
 * In production we serve samples from Cloudflare R2 (or any CDN) via the
 * NEXT_PUBLIC_SAMPLES_BASE_URL env var. The bucket layout has a `notes/`
 * folder (alongside harmonics/, pedal/, release/), so we append `/notes`.
 *
 * For local dev with files in public/, the var is unset and we fall back to
 * the local path.
 *
 * NOTE: when fetching cross-origin, the R2 bucket must allow CORS for the
 * app's origin (and http://localhost:3000 for local testing).
 */
const SAMPLES_BASE_URL = process.env.NEXT_PUBLIC_SAMPLES_BASE_URL
  ? `${process.env.NEXT_PUBLIC_SAMPLES_BASE_URL.replace(/\/+$/, "")}/notes`
  : "/samples/salamander/notes";

/** Velocity layers we treat as "good enough" before going wider. */
const PRIMARY_LAYERS = [8, 12, 4, 16, 1] as const;

interface LoadJob {
  ref: SampleRef;
  /** Lower number = higher priority. */
  priority: number;
  /** Resolves once the sample is in SampleBank (or proven missing). */
  resolve: () => void;
}

/** Coarse loading state. */
export type LoaderStatus = "idle" | "loading" | "core-ready" | "ready" | "error";

export interface LoaderProgress {
  loaded: number;
  total: number;
  status: LoaderStatus;
  /** Last error message, if any. */
  error: string | null;
}

type ProgressListener = (p: LoaderProgress) => void;

class SampleLoaderImpl {
  private ctx: BaseAudioContext | null = null;
  private status: LoaderStatus = "idle";
  private listeners = new Set<ProgressListener>();

  // Track total work and progress for the visible progress bar (core phase).
  private corePlanned = 0;
  private coreLoaded = 0;

  // Pending in-flight loads keyed by filename so multiple callers dedupe.
  private inflight = new Map<string, Promise<void>>();
  private lastError: string | null = null;
  private cachedSnapshot: LoaderProgress = {
    loaded: 0,
    total: 0,
    status: "idle",
    error: null,
  };

  /** Sets the AudioContext used for decoding. Must be called before load(). */
  attachContext(ctx: BaseAudioContext): void {
    this.ctx = ctx;
  }

  subscribe(fn: ProgressListener): () => void {
    this.listeners.add(fn);
    fn(this.snapshot());
    return () => {
      this.listeners.delete(fn);
    };
  }

  snapshot(): LoaderProgress {
    return this.cachedSnapshot;
  }

  private rebuildSnapshot(): void {
    const prev = this.cachedSnapshot;
    if (
      prev.loaded === this.coreLoaded &&
      prev.total === this.corePlanned &&
      prev.status === this.status &&
      prev.error === this.lastError
    ) {
      return;
    }
    this.cachedSnapshot = {
      loaded: this.coreLoaded,
      total: this.corePlanned,
      status: this.status,
      error: this.lastError,
    };
  }

  /**
   * Kicks off the full progressive load.
   *
   * Returns a promise that resolves once the CORE samples (middle octave at
   * layer 8) are ready, so the UI can transition out of the loading screen.
   * Background loading continues in the background after that.
   */
  async loadAll(): Promise<void> {
    if (!this.ctx) throw new Error("SampleLoader: AudioContext not attached.");
    if (this.status === "ready" || this.status === "core-ready") return;

    this.status = "loading";
    this.lastError = null;
    this.coreLoaded = 0;
    this.emit();

    // Phase A — core notes (C3..C5 recorded notes) at layer 8.
    const coreNotes = RECORDED_MIDI_NOTES.filter((m) => m >= 48 && m <= 72);
    this.corePlanned = coreNotes.length;
    this.emit();

    try {
      await this.runBatch(
        coreNotes.map((m) => ({ ref: { recordedMidi: m, velocityLayer: 8 }, priority: 0 })),
        () => {
          this.coreLoaded += 1;
          this.emit();
        },
        4,
      );
    } catch (err) {
      this.lastError = err instanceof Error ? err.message : String(err);
      this.status = "error";
      this.emit();
      throw err;
    }

    this.status = "core-ready";
    this.emit();

    // Phase B — remaining recorded notes at primary layers, in the
    // background. We don't await; key presses still work via on-demand.
    void this.loadBackground();
  }

  private async loadBackground(): Promise<void> {
    if (!this.ctx) return;

    const remaining = RECORDED_MIDI_NOTES.filter((m) => !(m >= 48 && m <= 72));
    // Layer 8 across the whole range first.
    const wave1 = remaining.map<LoadJob>((m) => ({
      ref: { recordedMidi: m, velocityLayer: 8 },
      priority: 1,
      resolve: () => undefined,
    }));

    // Then a few more layers across the whole range.
    const wave2: LoadJob[] = [];
    for (const layer of PRIMARY_LAYERS.slice(1)) {
      for (const m of RECORDED_MIDI_NOTES) {
        wave2.push({
          ref: { recordedMidi: m, velocityLayer: layer },
          priority: 2,
          resolve: () => undefined,
        });
      }
    }

    // Then everything else.
    const wave3: LoadJob[] = [];
    for (let layer = 1; layer <= VELOCITY_LAYERS; layer += 1) {
      if (PRIMARY_LAYERS.includes(layer as (typeof PRIMARY_LAYERS)[number])) continue;
      for (const m of RECORDED_MIDI_NOTES) {
        wave3.push({
          ref: { recordedMidi: m, velocityLayer: layer },
          priority: 3,
          resolve: () => undefined,
        });
      }
    }

    try {
      await this.runBatch(wave1, () => undefined, 3);
      await this.runBatch(wave2, () => undefined, 3);
      await this.runBatch(wave3, () => undefined, 2);
      this.status = "ready";
      this.emit();
    } catch (err) {
      // Background errors don't fail the engine — we keep going.
      logger.warn("background sample load error:", err);
    }
  }

  /**
   * On-demand load: ensures the requested ref is in the bank.
   * Returns when the sample is decoded and in the bank, or throws if missing.
   */
  async requestSample(ref: SampleRef): Promise<void> {
    if (sampleBank.getExact(ref)) return;
    await this.loadOne(ref);
  }

  private async runBatch(
    jobs: Array<Pick<LoadJob, "ref" | "priority">>,
    onProgress: () => void,
    concurrency: number,
  ): Promise<void> {
    let cursor = 0;
    const workers: Promise<void>[] = [];
    for (let i = 0; i < concurrency; i += 1) {
      workers.push(
        (async () => {
          while (cursor < jobs.length) {
            const idx = cursor;
            cursor += 1;
            const job = jobs[idx];
            if (!job) return;
            try {
              await this.loadOne(job.ref);
            } catch (err) {
              logger.warn("sample load failed:", err);
            }
            onProgress();
          }
        })(),
      );
    }
    await Promise.all(workers);
  }

  private async loadOne(ref: SampleRef): Promise<void> {
    if (!this.ctx) throw new Error("SampleLoader: AudioContext not attached.");
    if (sampleBank.getExact(ref)) return;

    const candidates = [sampleFilename(ref), ...fallbackFilenames(ref)];

    for (const filename of candidates) {
      if (sampleBank.isMissing(filename)) continue;
      const dedupeKey = filename;
      const existing = this.inflight.get(dedupeKey);
      if (existing) {
        await existing;
        if (sampleBank.getExact(ref)) return;
        continue;
      }

      const promise = this.fetchDecodeStore(ref, filename);
      this.inflight.set(dedupeKey, promise);
      try {
        await promise;
      } finally {
        this.inflight.delete(dedupeKey);
      }
      if (sampleBank.getExact(ref)) return;
      // If the canonical filename wasn't there but a fallback succeeded
      // for a *different* layer, the bank now has *something* for this
      // recorded note; that's good enough to play. Stop probing.
      if (sampleBank.hasAnyLayer(ref.recordedMidi)) return;
    }
  }

  private async fetchDecodeStore(
    ref: SampleRef,
    filename: string,
  ): Promise<void> {
    if (!this.ctx) return;
    // Encode `#` (and any other reserved chars) so the URL doesn't get
    // truncated at a fragment. The cache key stays as the raw filename.
    const url = `${SAMPLES_BASE_URL}/${encodeURIComponent(filename)}`;
    let bytes: ArrayBuffer;
    try {
      bytes = await loadSampleBytes(url, filename);
    } catch (err) {
      sampleBank.markMissing(filename);
      logger.debug(`sample missing: ${filename}`, err);
      return;
    }

    let decoded: AudioBuffer;
    try {
      decoded = await this.ctx.decodeAudioData(bytes.slice(0));
    } catch (err) {
      sampleBank.markMissing(filename);
      logger.warn(`decode failed: ${filename}`, err);
      return;
    }

    // The actual recorded layer is whatever's in the filename. We extract it
    // from the filename so a fallback can populate the right slot.
    const layer = parseLayerFromFilename(filename) ?? ref.velocityLayer;
    sampleBank.set(ref.recordedMidi, layer, decoded);
  }

  private emit(): void {
    this.rebuildSnapshot();
    const snap = this.cachedSnapshot;
    for (const fn of this.listeners) fn(snap);
  }
}

/** "C4v8.ogg" -> 8, "C4.ogg" -> null. */
function parseLayerFromFilename(filename: string): number | null {
  const match = /v(\d+)\.ogg$/i.exec(filename);
  if (!match) return null;
  const n = Number.parseInt(match[1] ?? "", 10);
  return Number.isFinite(n) ? n : null;
}

export const sampleLoader = new SampleLoaderImpl();
export type SampleLoader = SampleLoaderImpl;
