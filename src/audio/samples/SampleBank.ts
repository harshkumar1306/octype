/**
 * SampleBank — in-memory registry of decoded AudioBuffers.
 *
 * Indexed by recordedMidi -> velocityLayer -> AudioBuffer. The bank also
 * tracks known-missing files (so we don't keep retrying them every press)
 * and provides a "best available" lookup that falls back to a nearby
 * velocity layer if the requested one isn't loaded yet.
 */

import type { SampleRef } from "@/audio/samples/SampleMap";
import { VELOCITY_LAYERS } from "@/audio/samples/SampleMap";

interface BankEntry {
  /** AudioBuffers indexed [1..VELOCITY_LAYERS]. Sparse. */
  layers: Map<number, AudioBuffer>;
}

class SampleBankImpl {
  private buffers = new Map<number, BankEntry>();
  private missing = new Set<string>();

  /** Adds a decoded buffer to the bank. */
  set(recordedMidi: number, velocityLayer: number, buffer: AudioBuffer): void {
    let entry = this.buffers.get(recordedMidi);
    if (!entry) {
      entry = { layers: new Map() };
      this.buffers.set(recordedMidi, entry);
    }
    entry.layers.set(velocityLayer, buffer);
  }

  /** Returns the exact buffer if loaded, else null. */
  getExact(ref: SampleRef): AudioBuffer | null {
    const entry = this.buffers.get(ref.recordedMidi);
    if (!entry) return null;
    return entry.layers.get(ref.velocityLayer) ?? null;
  }

  /**
   * Returns the closest available velocity layer for the given recorded note.
   * Returns null if no layers for that note are loaded yet.
   */
  getClosest(ref: SampleRef): { buffer: AudioBuffer; layer: number } | null {
    const entry = this.buffers.get(ref.recordedMidi);
    if (!entry || entry.layers.size === 0) return null;
    const target = ref.velocityLayer;
    let best: { buffer: AudioBuffer; layer: number } | null = null;
    let bestDist = Number.POSITIVE_INFINITY;
    for (const [layer, buffer] of entry.layers) {
      const d = Math.abs(layer - target);
      if (d < bestDist) {
        best = { buffer, layer };
        bestDist = d;
      }
    }
    return best;
  }

  /** Marks a filename as known-missing on the server. */
  markMissing(filename: string): void {
    this.missing.add(filename);
  }

  isMissing(filename: string): boolean {
    return this.missing.has(filename);
  }

  /** Total decoded buffers currently held in memory. */
  size(): number {
    let n = 0;
    for (const entry of this.buffers.values()) n += entry.layers.size;
    return n;
  }

  /** Returns true if any layer for the given recorded note is loaded. */
  hasAnyLayer(recordedMidi: number): boolean {
    const entry = this.buffers.get(recordedMidi);
    if (!entry) return false;
    return entry.layers.size > 0;
  }

  /** Returns true if every layer 1..N is loaded (used for completeness checks). */
  hasAllLayers(recordedMidi: number): boolean {
    const entry = this.buffers.get(recordedMidi);
    if (!entry) return false;
    return entry.layers.size >= VELOCITY_LAYERS;
  }
}

export const sampleBank = new SampleBankImpl();
export type SampleBank = SampleBankImpl;
