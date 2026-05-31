/**
 * Keyboard mapping types.
 *
 * Three mapping modes:
 *   - "default" — 3 octaves, no modifiers needed.
 *   - "max" — 5 octaves, Shift held for black keys.
 *   - "custom" — user-defined via modal editor.
 */

export type MappingMode = "default" | "max" | "custom";

/**
 * A single mapping from a physical key to a piano key.
 */
export interface KeyBinding {
  /** Physical key code (KeyboardEvent.code). */
  code: string;
  /** Semitone offset from the lowest visible MIDI note. */
  semitoneOffset: number;
  /** Friendly label for display on the key. */
  label: string;
  /** If true, this binding only fires when Shift is held. */
  shift?: boolean;
}

/** A named, savable mapping profile. */
export interface MappingProfile {
  id: string;
  name: string;
  bindings: KeyBinding[];
  description?: string;
  builtin?: boolean;
  /** Which mode this profile uses. */
  mode: MappingMode;
  /** Starting octave (e.g. 4 for C4). */
  startOctave: number;
  /** Number of octaves covered. */
  octaveCount: number;
}

/** Result of attempting to add a binding (for conflict detection). */
export interface BindingConflict {
  existingCode: string;
  existingOffset: number;
}
