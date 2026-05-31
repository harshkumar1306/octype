/**
 * Piano UI state — visible window + mapping anchor.
 *
 * Two distinct concepts that must coexist cleanly:
 *
 *   1. MAPPED REGION — the octaves your keyboard keys actually play.
 *      Defined by `mappingBaseMidi` (lowest C of the mapping) and
 *      `mappingOctaves` (how many octaves the active profile spans).
 *
 *   2. VISIBLE WINDOW — what's drawn on screen. Defined by `startMidi`
 *      (lowest visible C) and `octaves` (how many octaves shown).
 *
 * Invariants (always enforced):
 *   - octaves >= mappingOctaves          (can't show fewer than mapped)
 *   - startMidi <= mappingBaseMidi       (mapped region's bottom is visible)
 *   - mappingEnd <= startMidi + octaves  (mapped region's top is visible)
 *
 * Controls:
 *   - setOctaves(n): change how many octaves are drawn. The mapped region
 *     stays anchored and the window is recentred around it.
 *   - shiftOctave(±1): slide the MAPPED region up/down. The visible window
 *     scrolls to keep it centred, showing context on both sides when room.
 */

import { create } from "zustand";

import { nameToMidi, snapToCBelow } from "@/lib/noteUtils";
import type { MidiNote, NoteSource } from "@/types/piano";

const MAX_OCTAVES = 7;

/** Piano bounds: C1 (24) .. C8 (108). */
const PIANO_LOW = nameToMidi("C1"); // 24
const PIANO_HIGH = nameToMidi("C8"); // 108

interface ActiveNoteEntry {
  velocity: number;
  source: NoteSource;
}

interface PianoState {
  /** MIDI note of the lowest visible key (always a C). */
  startMidi: MidiNote;
  /** Number of octaves visible. */
  octaves: number;
  /** MIDI note of the lowest mapped key (always a C). */
  mappingBaseMidi: MidiNote;
  /** Number of octaves the active mapping spans. */
  mappingOctaves: number;

  showKeyLabels: boolean;
  showNoteNames: boolean;
  activeNotes: ReadonlyMap<MidiNote, ActiveNoteEntry>;

  // Visible-window + mapping controls
  setOctaves: (count: number) => void;
  shiftOctave: (deltaOctaves: number) => void;
  setStartMidi: (midi: MidiNote) => void;
  /** Called when the active mapping profile changes. */
  syncToMapping: (mappingBaseMidi: MidiNote, mappingOctaves: number) => void;

  toggleKeyLabels: () => void;
  toggleNoteNames: () => void;

  setNoteActive: (midi: MidiNote, velocity: number, source: NoteSource) => void;
  setNoteInactive: (midi: MidiNote) => void;
  clearActiveNotes: () => void;
}

/** Clamp the mapped region's base so the mapping stays on the piano. */
function clampMappingBase(base: number, mappingOctaves: number): number {
  const snapped = snapToCBelow(base);
  const maxBase = PIANO_HIGH - mappingOctaves * 12;
  if (snapped < PIANO_LOW) return PIANO_LOW;
  if (snapped > maxBase) return snapToCBelow(maxBase);
  return snapped;
}

/**
 * Derives the visible window start so the mapped region is centred within
 * the visible octaves, then clamps to piano bounds while keeping the mapped
 * region fully contained.
 */
function deriveVisibleStart(
  mappingBaseMidi: number,
  mappingOctaves: number,
  visibleOctaves: number,
): number {
  const extra = Math.max(0, visibleOctaves - mappingOctaves);
  const leftPad = Math.floor(extra / 2);
  let start = mappingBaseMidi - leftPad * 12;

  // Keep within piano bounds.
  const maxStart = PIANO_HIGH - visibleOctaves * 12;
  if (start < PIANO_LOW) start = PIANO_LOW;
  if (start > maxStart) start = snapToCBelow(maxStart);

  // Guarantee the mapped region stays fully contained.
  const mappingEnd = mappingBaseMidi + mappingOctaves * 12;
  const visibleEnd = start + visibleOctaves * 12;
  if (start > mappingBaseMidi) start = mappingBaseMidi;
  if (visibleEnd < mappingEnd) start = mappingEnd - visibleOctaves * 12;

  return snapToCBelow(Math.max(PIANO_LOW, start));
}

function clampVisibleOctaves(n: number, mappingOctaves: number): number {
  if (!Number.isFinite(n)) return mappingOctaves;
  const min = mappingOctaves;
  return Math.max(min, Math.min(MAX_OCTAVES, Math.round(n)));
}

const INITIAL_MAPPING_BASE = nameToMidi("C4");
const INITIAL_MAPPING_OCTAVES = 3;

export const usePianoStore = create<PianoState>((set, get) => ({
  mappingBaseMidi: INITIAL_MAPPING_BASE,
  mappingOctaves: INITIAL_MAPPING_OCTAVES,
  startMidi: INITIAL_MAPPING_BASE,
  octaves: INITIAL_MAPPING_OCTAVES,
  showKeyLabels: true,
  showNoteNames: true,
  activeNotes: new Map(),

  setOctaves: (count) => {
    const { mappingBaseMidi, mappingOctaves } = get();
    const octaves = clampVisibleOctaves(count, mappingOctaves);
    const startMidi = deriveVisibleStart(
      mappingBaseMidi,
      mappingOctaves,
      octaves,
    );
    set({ octaves, startMidi });
  },

  shiftOctave: (deltaOctaves) => {
    const { mappingBaseMidi, mappingOctaves, octaves } = get();
    const nextBase = clampMappingBase(
      mappingBaseMidi + deltaOctaves * 12,
      mappingOctaves,
    );
    const startMidi = deriveVisibleStart(nextBase, mappingOctaves, octaves);
    set({ mappingBaseMidi: nextBase, startMidi });
  },

  setStartMidi: (midi) => {
    // Treated as setting the mapping base (used by profile sync / legacy calls).
    const { mappingOctaves, octaves } = get();
    const nextBase = clampMappingBase(midi, mappingOctaves);
    const startMidi = deriveVisibleStart(nextBase, mappingOctaves, octaves);
    set({ mappingBaseMidi: nextBase, startMidi });
  },

  syncToMapping: (mappingBaseMidi, mappingOctaves) => {
    const base = clampMappingBase(mappingBaseMidi, mappingOctaves);
    // Visible octaves: keep current if it's >= mapping, else match mapping.
    const octaves = clampVisibleOctaves(get().octaves, mappingOctaves);
    const startMidi = deriveVisibleStart(base, mappingOctaves, octaves);
    set({ mappingBaseMidi: base, mappingOctaves, octaves, startMidi });
  },

  toggleKeyLabels: () => set((s) => ({ showKeyLabels: !s.showKeyLabels })),
  toggleNoteNames: () => set((s) => ({ showNoteNames: !s.showNoteNames })),

  setNoteActive: (midi, velocity, source) => {
    const next = new Map(get().activeNotes);
    next.set(midi, { velocity, source });
    set({ activeNotes: next });
  },

  setNoteInactive: (midi) => {
    const current = get().activeNotes;
    if (!current.has(midi)) return;
    const next = new Map(current);
    next.delete(midi);
    set({ activeNotes: next });
  },

  clearActiveNotes: () => set({ activeNotes: new Map() }),
}));
