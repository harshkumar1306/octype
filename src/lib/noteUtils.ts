/**
 * Note utility helpers.
 *
 * Conversions between MIDI note numbers and human-readable note names.
 * MIDI 60 = C4 (middle C). MIDI 0 = C-1.
 */

import type {
  KeyColor,
  MidiNote,
  PianoKeyDescriptor,
  PitchClass,
} from "@/types/piano";

/** Sharp-spelled pitch class names indexed by pitch class 0..11. */
const SHARP_NAMES: readonly string[] = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
] as const;

/** Pitch classes that correspond to black keys on a piano. */
const BLACK_PITCH_CLASSES: ReadonlySet<number> = new Set([1, 3, 6, 8, 10]);

/** Returns the pitch class (0..11) of the given MIDI note. */
export function pitchClassOf(midi: MidiNote): PitchClass {
  return ((midi % 12) + 12) % 12 as PitchClass;
}

/** Returns the octave (scientific pitch notation) of the given MIDI note. */
export function octaveOf(midi: MidiNote): number {
  return Math.floor(midi / 12) - 1;
}

/** Returns "C4", "F#3", etc. for the given MIDI note. */
export function midiToName(midi: MidiNote): string {
  const pc = pitchClassOf(midi);
  const oct = octaveOf(midi);
  return `${SHARP_NAMES[pc] ?? "?"}${oct}`;
}

/** Returns the MIDI note number for "C4" / "F#3" / "Eb5" style names. */
export function nameToMidi(name: string): MidiNote {
  const match = /^([A-Ga-g])([#b]?)(-?\d+)$/.exec(name.trim());
  if (!match) {
    throw new Error(`Invalid note name: ${name}`);
  }
  const letter = (match[1] ?? "").toUpperCase();
  const accidental = match[2] ?? "";
  const octaveText = match[3] ?? "0";
  const octave = Number.parseInt(octaveText, 10);
  const baseMap: Record<string, number> = {
    C: 0,
    D: 2,
    E: 4,
    F: 5,
    G: 7,
    A: 9,
    B: 11,
  };
  const base = baseMap[letter];
  if (base === undefined) {
    throw new Error(`Invalid note letter: ${letter}`);
  }
  const semitone =
    accidental === "#" ? base + 1 : accidental === "b" ? base - 1 : base;
  return (octave + 1) * 12 + semitone;
}

/** Returns true if the MIDI note corresponds to a black key. */
export function isBlackKey(midi: MidiNote): boolean {
  return BLACK_PITCH_CLASSES.has(pitchClassOf(midi));
}

/** Returns "white" or "black" for the given MIDI note. */
export function keyColorOf(midi: MidiNote): KeyColor {
  return isBlackKey(midi) ? "black" : "white";
}

/**
 * Builds an ordered list of piano-key descriptors covering [startMidi, endMidi].
 * Both ends are inclusive. Keys are returned in MIDI order (low to high).
 */
export function buildKeyRange(
  startMidi: MidiNote,
  endMidi: MidiNote,
): PianoKeyDescriptor[] {
  if (endMidi < startMidi) return [];
  const keys: PianoKeyDescriptor[] = [];
  let whiteIndex = 0;
  for (let m = startMidi; m <= endMidi; m += 1) {
    const color = keyColorOf(m);
    keys.push({
      midi: m,
      name: midiToName(m),
      pitchClass: pitchClassOf(m),
      octave: octaveOf(m),
      color,
      whiteIndex: color === "white" ? whiteIndex : -1,
    });
    if (color === "white") whiteIndex += 1;
  }
  return keys;
}

/** Counts white keys in the given inclusive MIDI range. */
export function countWhiteKeys(startMidi: MidiNote, endMidi: MidiNote): number {
  let n = 0;
  for (let m = startMidi; m <= endMidi; m += 1) {
    if (!isBlackKey(m)) n += 1;
  }
  return n;
}

/**
 * Snaps a MIDI note down to the nearest C at or below it.
 * Useful for normalizing the start of an octave range.
 */
export function snapToCBelow(midi: MidiNote): MidiNote {
  const pc = pitchClassOf(midi);
  return midi - pc;
}
