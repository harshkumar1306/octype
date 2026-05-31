/**
 * MouseInput — pointer-based piano playback.
 *
 * Velocity is derived from where on the key the user clicks:
 *   - top of key  (y ~= 0)         -> soft  (~ MIDI 35)
 *   - bottom edge (y ~= height)    -> loud  (~ MIDI 120)
 *
 * This mimics how lifting a piano hammer higher produces a louder note
 * and gives mouse users genuine velocity control without needing a MIDI
 * controller.
 */

import { inputRouter } from "@/systems/input/InputRouter";
import type { MidiNote } from "@/types/piano";

const MIN_VELOCITY = 35;
const MAX_VELOCITY = 120;

class MouseInputImpl {
  /**
   * Press a piano key via mouse/pointer.
   * `relativeY` is 0..1 (top..bottom). If omitted (or NaN) we default to
   * a comfortable mid-velocity.
   */
  press(midi: MidiNote, relativeY: number): void {
    const velocity = this.velocityFromY(relativeY);
    inputRouter.noteOn(midi, velocity, "mouse");
  }

  /** Release a piano key via mouse/pointer. */
  release(midi: MidiNote): void {
    inputRouter.noteOff(midi, "mouse");
  }

  private velocityFromY(relativeY: number): number {
    const y = Number.isFinite(relativeY)
      ? Math.max(0, Math.min(1, relativeY))
      : 0.6;
    // Easing: linear maps loudness pretty well, but a slight curve keeps
    // the bottom half from feeling too aggressive.
    const eased = y ** 1.3;
    const v = MIN_VELOCITY + (MAX_VELOCITY - MIN_VELOCITY) * eased;
    return Math.round(v);
  }
}

export const mouseInput = new MouseInputImpl();
export type MouseInput = MouseInputImpl;
