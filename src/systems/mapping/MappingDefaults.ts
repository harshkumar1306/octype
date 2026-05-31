/**
 * Default and Max key mapping presets.
 *
 * Three mapping modes:
 *   1. Default — 3 octaves (C4-C6), comfortable for casual play.
 *   2. Max — 5 octaves (C2-C6 + extra C7), uses Shift for black keys.
 *   3. Custom — user-defined via modal editor.
 */

import type { KeyBinding, MappingProfile } from "@/types/mapping";

/**
 * DEFAULT MAPPING — 3 octaves (C4, C5, C6)
 *
 * C4 white: Tab Q W E R T Y
 * C4 black: 1 2 4 5 6
 * C5 white: U I O P [ ] \
 * C5 black: 8 9 - = Backspace
 * C6 white: Z X C V B N M
 * C6 black: S D G H J
 */
export const DEFAULT_BINDINGS: readonly KeyBinding[] = [
  // C4 white keys (semitone offsets 0,2,4,5,7,9,11 from C4)
  { code: "Tab", semitoneOffset: 0, label: "↹" },       // C4
  { code: "KeyQ", semitoneOffset: 2, label: "Q" },      // D4
  { code: "KeyW", semitoneOffset: 4, label: "W" },      // E4
  { code: "KeyE", semitoneOffset: 5, label: "E" },      // F4
  { code: "KeyR", semitoneOffset: 7, label: "R" },      // G4
  { code: "KeyT", semitoneOffset: 9, label: "T" },      // A4
  { code: "KeyY", semitoneOffset: 11, label: "Y" },     // B4

  // C4 black keys
  { code: "Digit1", semitoneOffset: 1, label: "1" },    // C#4
  { code: "Digit2", semitoneOffset: 3, label: "2" },    // D#4
  { code: "Digit4", semitoneOffset: 6, label: "4" },    // F#4
  { code: "Digit5", semitoneOffset: 8, label: "5" },    // G#4
  { code: "Digit6", semitoneOffset: 10, label: "6" },   // A#4

  // C5 white keys (offsets 12..23)
  { code: "KeyU", semitoneOffset: 12, label: "U" },     // C5
  { code: "KeyI", semitoneOffset: 14, label: "I" },     // D5
  { code: "KeyO", semitoneOffset: 16, label: "O" },     // E5
  { code: "KeyP", semitoneOffset: 17, label: "P" },     // F5
  { code: "BracketLeft", semitoneOffset: 19, label: "[" },  // G5
  { code: "BracketRight", semitoneOffset: 21, label: "]" }, // A5
  { code: "Backslash", semitoneOffset: 23, label: "\\" },   // B5

  // C5 black keys
  { code: "Digit8", semitoneOffset: 13, label: "8" },   // C#5
  { code: "Digit9", semitoneOffset: 15, label: "9" },   // D#5
  { code: "Minus", semitoneOffset: 18, label: "-" },    // F#5
  { code: "Equal", semitoneOffset: 20, label: "=" },    // G#5
  { code: "Backspace", semitoneOffset: 22, label: "⌫" }, // A#5

  // C6 white keys (offsets 24..35)
  { code: "KeyZ", semitoneOffset: 24, label: "Z" },     // C6
  { code: "KeyX", semitoneOffset: 26, label: "X" },     // D6
  { code: "KeyC", semitoneOffset: 28, label: "C" },     // E6
  { code: "KeyV", semitoneOffset: 29, label: "V" },     // F6
  { code: "KeyB", semitoneOffset: 31, label: "B" },     // G6
  { code: "KeyN", semitoneOffset: 33, label: "N" },     // A6
  { code: "KeyM", semitoneOffset: 35, label: "M" },     // B6

  // C6 black keys
  { code: "KeyS", semitoneOffset: 25, label: "S" },     // C#6
  { code: "KeyD", semitoneOffset: 27, label: "D" },     // D#6
  { code: "KeyG", semitoneOffset: 30, label: "G" },     // F#6
  { code: "KeyH", semitoneOffset: 32, label: "H" },     // G#6
  { code: "KeyJ", semitoneOffset: 34, label: "J" },     // A#6
] as const;

/**
 * MAX MAPPING — 5 octaves (C2-C6) + extra C7
 *
 * White keys: number row (1-0) + QWERTY row (Q-P) + home row (A-L) + bottom row (Z-M) + extra
 * Black keys: same physical keys but with Shift held
 *
 * White keys layout (36 keys = 5 octaves + 1):
 *   C2 octave: 1 2 3 4 5 6 7 (7 whites)
 *   C3 octave: 8 9 0 Q W E R (7 whites)
 *   C4 octave: T Y U I O P A (7 whites)
 *   C5 octave: S D F G H J K (7 whites)
 *   C6 octave: L Z X C V B N (7 whites)
 *   C7:        M (1 white)
 *
 * Black keys (Shift + key):
 *   C2 blacks: Shift+1, Shift+2, Shift+4, Shift+5, Shift+6
 *   C3 blacks: Shift+8, Shift+9, Shift+Q, Shift+W, Shift+E
 *   C4 blacks: Shift+T, Shift+Y, Shift+I, Shift+O, Shift+P
 *   C5 blacks: Shift+S, Shift+D, Shift+G, Shift+H, Shift+J
 *   C6 blacks: Shift+L, Shift+Z, Shift+C, Shift+V, Shift+B
 */

function whiteOffsets(octaveStart: number): number[] {
  return [0, 2, 4, 5, 7, 9, 11].map((s) => s + octaveStart);
}

function blackOffsets(octaveStart: number): number[] {
  return [1, 3, 6, 8, 10].map((s) => s + octaveStart);
}

const MAX_WHITE_CODES = [
  "Digit1", "Digit2", "Digit3", "Digit4", "Digit5", "Digit6", "Digit7",
  "Digit8", "Digit9", "Digit0", "KeyQ", "KeyW", "KeyE", "KeyR",
  "KeyT", "KeyY", "KeyU", "KeyI", "KeyO", "KeyP", "KeyA",
  "KeyS", "KeyD", "KeyF", "KeyG", "KeyH", "KeyJ", "KeyK",
  "KeyL", "KeyZ", "KeyX", "KeyC", "KeyV", "KeyB", "KeyN",
  "KeyM",
];

const MAX_WHITE_LABELS = [
  "1", "2", "3", "4", "5", "6", "7",
  "8", "9", "0", "Q", "W", "E", "R",
  "T", "Y", "U", "I", "O", "P", "A",
  "S", "D", "F", "G", "H", "J", "K",
  "L", "Z", "X", "C", "V", "B", "N",
  "M",
];

const MAX_BLACK_CODES = [
  "Digit1", "Digit2", "Digit4", "Digit5", "Digit6",
  "Digit8", "Digit9", "KeyQ", "KeyW", "KeyE",
  "KeyT", "KeyY", "KeyI", "KeyO", "KeyP",
  "KeyS", "KeyD", "KeyG", "KeyH", "KeyJ",
  "KeyL", "KeyZ", "KeyC", "KeyV", "KeyB",
];

const MAX_BLACK_LABELS = [
  "⇧1", "⇧2", "⇧4", "⇧5", "⇧6",
  "⇧8", "⇧9", "⇧Q", "⇧W", "⇧E",
  "⇧T", "⇧Y", "⇧I", "⇧O", "⇧P",
  "⇧S", "⇧D", "⇧G", "⇧H", "⇧J",
  "⇧L", "⇧Z", "⇧C", "⇧V", "⇧B",
];

function buildMaxBindings(): KeyBinding[] {
  const bindings: KeyBinding[] = [];

  // White keys: 5 octaves (0..59 semitones) + C7 (60)
  const allWhiteOffsets = [
    ...whiteOffsets(0),   // C2
    ...whiteOffsets(12),  // C3
    ...whiteOffsets(24),  // C4
    ...whiteOffsets(36),  // C5
    ...whiteOffsets(48),  // C6
    60,                   // C7
  ];

  for (let i = 0; i < allWhiteOffsets.length && i < MAX_WHITE_CODES.length; i++) {
    const code = MAX_WHITE_CODES[i];
    const label = MAX_WHITE_LABELS[i];
    const offset = allWhiteOffsets[i];
    if (code !== undefined && label !== undefined && offset !== undefined) {
      bindings.push({ code, semitoneOffset: offset, label, shift: false });
    }
  }

  // Black keys: 5 octaves (5 blacks each = 25)
  const allBlackOffsets = [
    ...blackOffsets(0),   // C2
    ...blackOffsets(12),  // C3
    ...blackOffsets(24),  // C4
    ...blackOffsets(36),  // C5
    ...blackOffsets(48),  // C6
  ];

  for (let i = 0; i < allBlackOffsets.length && i < MAX_BLACK_CODES.length; i++) {
    const code = MAX_BLACK_CODES[i];
    const label = MAX_BLACK_LABELS[i];
    const offset = allBlackOffsets[i];
    if (code !== undefined && label !== undefined && offset !== undefined) {
      bindings.push({ code, semitoneOffset: offset, label, shift: true });
    }
  }

  return bindings;
}

export const MAX_BINDINGS: readonly KeyBinding[] = buildMaxBindings();

/** Default profile — 3 octaves starting at C4. */
export const DEFAULT_PROFILE: MappingProfile = {
  id: "default",
  name: "Default",
  description: "3 octaves (C4-C6). Comfortable for casual play.",
  bindings: [...DEFAULT_BINDINGS],
  builtin: true,
  mode: "default",
  startOctave: 4,
  octaveCount: 3,
};

/** Max profile — 5 octaves starting at C2. */
export const MAX_PROFILE: MappingProfile = {
  id: "max",
  name: "Max",
  description: "5 octaves (C2-C6 + C7). Shift for black keys.",
  bindings: [...MAX_BINDINGS],
  builtin: true,
  mode: "max",
  startOctave: 2,
  octaveCount: 5,
};
