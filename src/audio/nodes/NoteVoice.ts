/**
 * NoteVoice — a single playing note.
 *
 * Chain: AudioBufferSourceNode -> GainNode (envelope) -> destination.
 *
 * Per the spec, nodes are NOT reused — each note creates fresh nodes and
 * disposes them on stop. This is the canonical Web Audio pattern.
 */

import { playbackRateFor } from "@/audio/samples/PitchShifter";

const ATTACK_SECONDS = 0.004;
const RELEASE_SECONDS = 0.32;

export interface VoiceStartOptions {
  context: AudioContext;
  destination: AudioNode;
  buffer: AudioBuffer;
  /** Semitone offset for pitch shifting (max ±2 enforced). */
  semitoneOffset: number;
  /** Linear gain 0..1 (post-velocity). */
  gain: number;
  /** Logical MIDI note for identification. */
  midi: number;
  /** Monotonic id for tie-breaking voice stealing decisions. */
  id: number;
  /** When this voice should start (AudioContext.currentTime). */
  when: number;
}

export class NoteVoice {
  readonly midi: number;
  readonly id: number;
  readonly startTime: number;
  /** Peak gain we ramped up to — used by voice stealing to find quietest. */
  readonly peakGain: number;

  private source: AudioBufferSourceNode;
  private gainNode: GainNode;
  private released = false;
  private stopped = false;
  /** Resolves when the underlying source has fully ended. */
  private endedHandlers = new Set<() => void>();

  constructor(opts: VoiceStartOptions) {
    this.midi = opts.midi;
    this.id = opts.id;
    this.startTime = opts.when;
    this.peakGain = opts.gain;

    const ctx = opts.context;

    const source = ctx.createBufferSource();
    source.buffer = opts.buffer;
    source.playbackRate.value = playbackRateFor(opts.semitoneOffset);

    const gainNode = ctx.createGain();
    gainNode.gain.value = 0;

    source.connect(gainNode);
    gainNode.connect(opts.destination);

    // Attack envelope.
    const t0 = opts.when;
    gainNode.gain.setValueAtTime(0, t0);
    gainNode.gain.linearRampToValueAtTime(opts.gain, t0 + ATTACK_SECONDS);

    source.onended = () => {
      this.stopped = true;
      this.disconnect();
      for (const h of this.endedHandlers) h();
      this.endedHandlers.clear();
    };

    source.start(t0);
    this.source = source;
    this.gainNode = gainNode;
  }

  /** Triggers the release ramp; the voice will end and clean up automatically. */
  release(now: number): void {
    if (this.released || this.stopped) return;
    this.released = true;
    const g = this.gainNode.gain;
    // Cancel scheduled ramps but keep the current value.
    g.cancelScheduledValues(now);
    g.setValueAtTime(g.value, now);
    g.linearRampToValueAtTime(0.0001, now + RELEASE_SECONDS);
    try {
      this.source.stop(now + RELEASE_SECONDS + 0.02);
    } catch {
      // Ignore — already stopped.
    }
  }

  /** Hard-stops immediately. Used when voice stealing. */
  hardStop(now: number): void {
    if (this.stopped) return;
    const g = this.gainNode.gain;
    g.cancelScheduledValues(now);
    g.setValueAtTime(g.value, now);
    // Fast 8ms fade to avoid clicks.
    g.linearRampToValueAtTime(0, now + 0.008);
    try {
      this.source.stop(now + 0.012);
    } catch {
      // Ignore.
    }
  }

  isReleased(): boolean {
    return this.released;
  }

  isStopped(): boolean {
    return this.stopped;
  }

  /** Current scheduled gain value (approximate — used for voice stealing). */
  currentGain(): number {
    return this.gainNode.gain.value;
  }

  onEnded(fn: () => void): void {
    if (this.stopped) {
      fn();
      return;
    }
    this.endedHandlers.add(fn);
  }

  private disconnect(): void {
    try {
      this.source.disconnect();
    } catch {
      // Ignore.
    }
    try {
      this.gainNode.disconnect();
    } catch {
      // Ignore.
    }
  }
}
