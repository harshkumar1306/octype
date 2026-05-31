/**
 * SustainPedal — tracks held-but-released notes while the pedal is engaged.
 *
 * Behavior (matches a real piano):
 *   - When sustain is OFF: noteOff releases the voice immediately.
 *   - When sustain is ON: noteOff is *deferred* — we remember the MIDI note,
 *     but the voice keeps ringing. Re-pressing the same note while sustained
 *     simply removes it from the deferred set (any new attack will be a
 *     separate voice).
 *   - When sustain is RELEASED: every deferred note is released at once.
 *
 * The pedal owns no audio nodes; it tells the AudioEngine what to release
 * via the supplied callback. Keeping it pure makes it easy to test.
 */

export class SustainPedal {
  private engaged = false;
  private deferred = new Set<number>();
  private readonly releaseFn: (midi: number) => void;

  /** @param releaseFn Called with each MIDI note that should now be released. */
  constructor(releaseFn: (midi: number) => void) {
    this.releaseFn = releaseFn;
  }

  isEngaged(): boolean {
    return this.engaged;
  }

  /**
   * Should be called by the engine on every noteOff.
   * Returns true if the engine should release the voice immediately,
   * false if the pedal absorbed the release.
   */
  shouldReleaseNow(midi: number): boolean {
    if (!this.engaged) return true;
    this.deferred.add(midi);
    return false;
  }

  /**
   * Should be called by the engine on every noteOn.
   * If a note was deferred and is being re-pressed, drop the deferral so
   * the next noteOff (or pedal lift) cleanly handles the new voice.
   */
  noteRepressed(midi: number): void {
    this.deferred.delete(midi);
  }

  /** Engage the pedal. Notes lifted while engaged will be deferred. */
  engage(): void {
    this.engaged = true;
  }

  /** Release the pedal. Every deferred note is released via the callback. */
  release(): void {
    if (!this.engaged) return;
    this.engaged = false;
    const notes = Array.from(this.deferred);
    this.deferred.clear();
    for (const m of notes) this.releaseFn(m);
  }

  /** Resets internal state. Used on dispose / panic. */
  reset(): void {
    this.engaged = false;
    this.deferred.clear();
  }
}
