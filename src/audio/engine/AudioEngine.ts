/**
 * AudioEngine — singleton entry point for all audio operations.
 *
 * UI never touches AudioBufferSourceNode / GainNode directly. Instead it goes:
 *   InputRouter -> audioEngine.noteOn/noteOff -> VoicePool -> NoteVoice.
 *
 * The engine reads its mutable settings (master volume, reverb, voice limit,
 * latency offset, velocity sensitivity) from the settings store via small
 * subscribe-and-mirror callbacks, NOT through React. The settings store lives
 * outside of React's render cycle, so this is safe.
 */

import { createMasterLimiter } from "@/audio/effects/DynamicsProcessor";
import { createReverb, type ReverbNodes } from "@/audio/effects/Reverb";
import { getAudioContext } from "@/audio/engine/AudioContext";
import { scheduleAt } from "@/audio/engine/Scheduler";
import { SustainPedal } from "@/audio/nodes/SustainPedal";
import { VoicePool } from "@/audio/nodes/VoicePool";
import { sampleBank } from "@/audio/samples/SampleBank";
import { sampleLoader } from "@/audio/samples/SampleLoader";
import {
  targetForMidi,
  velocityToLayer,
  type SampleRef,
} from "@/audio/samples/SampleMap";
import { logger } from "@/lib/logger";
import { useSettingsStore } from "@/stores/settingsStore";
import type { AudioEngineStatus } from "@/types/audio";

type Listener = () => void;

class AudioEngineImpl {
  private status: AudioEngineStatus = "idle";
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private reverb: ReverbNodes | null = null;
  private pool: VoicePool | null = null;
  private sustain: SustainPedal | null = null;
  private analyser: AnalyserNode | null = null;
  private listeners = new Set<Listener>();
  private unsubSettings: (() => void) | null = null;
  private initPromise: Promise<void> | null = null;

  /** Coarse status, mirrors UI loading screen state. */
  getStatus(): AudioEngineStatus {
    return this.status;
  }

  /** Returns the analyser node for visualizer use. Null before init. */
  getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  /**
   * Lazily creates the AudioContext + sample loader on first user gesture.
   * Idempotent. Awaiting this twice is safe.
   */
  async init(): Promise<void> {
    if (this.initPromise) return this.initPromise;
    this.initPromise = this.doInit();
    try {
      await this.initPromise;
    } catch (err) {
      this.initPromise = null;
      throw err;
    }
  }

  private async doInit(): Promise<void> {
    if (this.status !== "idle" && this.status !== "error") return;
    this.setStatus("initializing");

    const handle = getAudioContext();
    await handle.ensureRunning();
    this.ctx = handle.ctx;

    const settings = useSettingsStore.getState();

    // Master chain: pool -> reverb input ->  reverb output -> master gain -> limiter -> destination.
    const reverb = createReverb(this.ctx);
    reverb.setEnabled(settings.reverb.enabled);
    reverb.setAmount(settings.reverb.amount);

    const masterGain = this.ctx.createGain();
    masterGain.gain.value = settings.masterVolume;

    const limiter = createMasterLimiter(this.ctx);

    reverb.output.connect(masterGain);
    masterGain.connect(limiter);

    // Analyser for visualizer — taps the signal without affecting it.
    const analyser = this.ctx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.75;
    limiter.connect(analyser);
    analyser.connect(this.ctx.destination);
    this.analyser = analyser;

    this.reverb = reverb;
    this.masterGain = masterGain;
    this.pool = new VoicePool(settings.voiceLimit);
    this.sustain = new SustainPedal((midi) => {
      if (this.ctx && this.pool) {
        this.pool.releaseNote(midi, this.ctx.currentTime);
      }
    });

    // Live-sync settings -> nodes / pool. Avoids React in the hot path.
    this.unsubSettings = useSettingsStore.subscribe((s, prev) => {
      if (!this.ctx || !this.masterGain || !this.reverb || !this.pool) return;
      if (s.masterVolume !== prev.masterVolume) {
        this.masterGain.gain.setTargetAtTime(
          s.masterVolume,
          this.ctx.currentTime,
          0.02,
        );
      }
      if (s.reverb.enabled !== prev.reverb.enabled) {
        this.reverb.setEnabled(s.reverb.enabled);
      }
      if (s.reverb.amount !== prev.reverb.amount) {
        this.reverb.setAmount(s.reverb.amount);
      }
      if (s.voiceLimit !== prev.voiceLimit) {
        this.pool.setMax(s.voiceLimit);
      }
    });

    // Start sample loading.
    sampleLoader.attachContext(this.ctx);
    this.setStatus("loading-samples");
    try {
      await sampleLoader.loadAll();
      this.setStatus("ready");
    } catch (err) {
      logger.error("sample loader failed:", err);
      this.setStatus("error");
      throw err;
    }
  }

  /**
   * Triggers a note. Always plays *something* if any layer for the nearest
   * recorded note is loaded — falling back to the closest velocity layer
   * available. If no layer at all is loaded yet for that recorded note,
   * we kick off a background fetch and skip this press (the next press
   * will succeed once the sample lands).
   */
  noteOn(midi: number, velocity: number): void {
    if (!this.ctx || !this.pool || !this.reverb) return;
    if (midi < 21 || midi > 108) return;

    const settings = useSettingsStore.getState();
    const layer = velocityToLayer(
      velocity,
      settings.velocitySensitivity,
      settings.defaultVelocity,
    );
    const target = targetForMidi(midi, layer);

    const buffer = this.findBestBuffer(target.ref);
    if (!buffer) {
      void sampleLoader.requestSample(target.ref).catch(() => undefined);
      logger.debug(
        `noteOn waiting for sample (midi=${midi}, recordedMidi=${target.ref.recordedMidi}, layer=${layer})`,
      );
      return;
    }

    const gain = velocityToGain(velocity, settings.velocitySensitivity);
    const when = scheduleAt(this.ctx.currentTime, settings.latencyOffsetMs);
    this.sustain?.noteRepressed(midi);
    this.pool.start({
      context: this.ctx,
      destination: this.reverb.input,
      buffer,
      semitoneOffset: target.semitoneOffset,
      gain,
      midi,
      when,
    });
  }

  /** Releases the most recent unreleased voice for the given note. */
  noteOff(midi: number): void {
    if (!this.ctx || !this.pool) return;
    if (this.sustain && !this.sustain.shouldReleaseNow(midi)) return;
    this.pool.releaseNote(midi, this.ctx.currentTime);
  }

  /** Engage / release the sustain pedal. */
  setSustain(engaged: boolean): void {
    if (!this.sustain) return;
    if (engaged) this.sustain.engage();
    else this.sustain.release();
  }

  /** Releases everything (focus loss). */
  releaseAll(): void {
    if (!this.ctx || !this.pool) return;
    this.sustain?.reset();
    this.pool.releaseAll(this.ctx.currentTime);
  }

  /** Disposes the engine. Mainly used in tests / hot reloads. */
  dispose(): void {
    if (this.pool && this.ctx) this.pool.hardStopAll(this.ctx.currentTime);
    this.sustain?.reset();
    this.unsubSettings?.();
    this.unsubSettings = null;
  }

  private findBestBuffer(ref: SampleRef): AudioBuffer | null {
    const exact = sampleBank.getExact(ref);
    if (exact) return exact;
    const closest = sampleBank.getClosest(ref);
    if (closest) {
      // Background-fetch the exact layer so future presses upgrade.
      void sampleLoader.requestSample(ref).catch(() => undefined);
      return closest.buffer;
    }
    return null;
  }

  private setStatus(s: AudioEngineStatus): void {
    if (this.status === s) return;
    this.status = s;
    for (const fn of this.listeners) fn();
  }
}

/** Maps velocity 0..127 -> linear gain, with sensitivity blending. */
function velocityToGain(velocity: number, sensitivity: number): number {
  const v = Math.max(0, Math.min(127, velocity));
  const sens = Math.max(0, Math.min(1, sensitivity));
  // Constant level when sensitivity = 0, full dynamic curve when = 1.
  const flat = 0.85;
  // Stronger curve so the difference between soft (v=40) and loud (v=120)
  // is clearly audible at sensitivity = 1.
  const dynamic = 0.15 + 1.05 * (v / 127) ** 1.4;
  return flat + (dynamic - flat) * sens;
}

export const audioEngine = new AudioEngineImpl();
export type AudioEngine = AudioEngineImpl;
