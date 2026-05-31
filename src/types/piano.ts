/**
 * Core piano-related types.
 *
 * MIDI note numbers follow the standard convention:
 *   - 0   = C-1
 *   - 21  = A0  (lowest note on a standard 88-key piano)
 *   - 60  = C4  (middle C)
 *   - 108 = C8  (highest note on a standard 88-key piano)
 */

/** A MIDI note number in the piano range. Branded for clarity, but is just a number at runtime. */
export type MidiNote = number;

/** Note letter without accidental. */
export type NoteLetter = "C" | "D" | "E" | "F" | "G" | "A" | "B";

/** A musical pitch class index 0..11 where 0 = C. */
export type PitchClass = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;

/** Whether a piano key is white or black. */
export type KeyColor = "white" | "black";

/**
 * A descriptor for a single piano key, derived from a MIDI note number.
 * Used by the renderer to position and label keys.
 */
export interface PianoKeyDescriptor {
  /** MIDI note number (e.g. 60 = C4). */
  midi: MidiNote;
  /** Display name including octave (e.g. "C4", "F#3"). */
  name: string;
  /** Pitch class 0..11. */
  pitchClass: PitchClass;
  /** Octave number using scientific pitch notation (C4 = octave 4). */
  octave: number;
  /** White or black key. */
  color: KeyColor;
  /**
   * Index in the white-key sequence of the visible keyboard.
   * White keys: 0, 1, 2, ...
   * Black keys: -1 (not used for layout — black keys are positioned relative to neighbors).
   */
  whiteIndex: number;
}

/**
 * The visible range of the keyboard, expressed as a starting MIDI note
 * and a count of octaves displayed.
 */
export interface OctaveRange {
  /** MIDI note number of the lowest key shown (must be a C). */
  startMidi: MidiNote;
  /** Number of full octaves displayed. */
  octaves: number;
}

/** A note that is currently active (pressed or sustained). */
export interface ActiveNote {
  midi: MidiNote;
  /** 0..127 MIDI velocity. */
  velocity: number;
  /** Source that triggered the note. */
  source: NoteSource;
  /** Monotonic timestamp from performance.now() at noteOn. */
  timestamp: number;
}

/** Where a note originated from. */
export type NoteSource = "keyboard" | "mouse" | "midi" | "touch";
