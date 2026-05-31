/**
 * VoicePool — manages active NoteVoice instances and enforces a polyphony cap.
 *
 * On noteOn, if we're at the limit we steal the "quietest oldest" voice
 * (released voices first, then by current gain, then by start time).
 *
 * The pool also ensures a re-attack on the same note properly retriggers:
 * the existing voice gets a quick release before the new one starts, so
 * notes don't pile up indefinitely on key chatter.
 */

import { NoteVoice, type VoiceStartOptions } from "@/audio/nodes/NoteVoice";

interface PoolStartOptions extends Omit<VoiceStartOptions, "id"> {}

export class VoicePool {
  private voices: NoteVoice[] = [];
  private nextId = 1;
  private maxVoices: number;

  constructor(maxVoices: number) {
    this.maxVoices = Math.max(8, Math.min(64, maxVoices));
  }

  setMax(maxVoices: number): void {
    this.maxVoices = Math.max(8, Math.min(64, maxVoices));
  }

  /** Returns the number of currently-tracked voices (including released). */
  size(): number {
    return this.voices.length;
  }

  /** Starts a new voice and returns it. */
  start(opts: PoolStartOptions): NoteVoice {
    // Re-attack: if there's an unreleased voice on the same midi, release it
    // quickly to avoid stacking.
    const now = opts.context.currentTime;
    for (const v of this.voices) {
      if (!v.isReleased() && v.midi === opts.midi) {
        v.release(now);
      }
    }

    if (this.voices.length >= this.maxVoices) {
      this.steal(now);
    }

    const voice = new NoteVoice({ ...opts, id: this.nextId });
    this.nextId += 1;
    this.voices.push(voice);
    voice.onEnded(() => {
      const idx = this.voices.indexOf(voice);
      if (idx >= 0) this.voices.splice(idx, 1);
    });
    return voice;
  }

  /**
   * Releases the most recent unreleased voice for the given MIDI note.
   * Returns true if a voice was released.
   */
  releaseNote(midi: number, now: number): boolean {
    // Search from the end so the most recent attack on a chord-repeat releases.
    for (let i = this.voices.length - 1; i >= 0; i -= 1) {
      const v = this.voices[i];
      if (v && !v.isReleased() && v.midi === midi) {
        v.release(now);
        return true;
      }
    }
    return false;
  }

  /** Releases ALL voices (e.g. on focus loss / panic). */
  releaseAll(now: number): void {
    for (const v of this.voices) {
      if (!v.isReleased()) v.release(now);
    }
  }

  /** Hard-stops every voice (used during teardown). */
  hardStopAll(now: number): void {
    for (const v of this.voices) v.hardStop(now);
    this.voices.length = 0;
  }

  /** Steal the quietest oldest voice. */
  private steal(now: number): void {
    let target: NoteVoice | null = null;
    let best = Number.POSITIVE_INFINITY;
    for (const v of this.voices) {
      // Released voices preferred (lowest score).
      const releasedBias = v.isReleased() ? 0 : 1_000_000;
      // Quieter voices preferred.
      const gainScore = v.currentGain() * 1000;
      // Older voices preferred (lower id = older).
      const ageScore = v.id * 0.001;
      const score = releasedBias + gainScore + ageScore;
      if (score < best) {
        best = score;
        target = v;
      }
    }
    if (target) target.hardStop(now);
  }
}
