/**
 * useNoteVisuals — subscribes to active-note state for visual feedback only.
 */

import { usePianoStore } from "@/stores/pianoStore";
import type { MidiNote } from "@/types/piano";

/** Returns true if the given MIDI note is currently active. */
export function useIsNoteActive(midi: MidiNote): boolean {
  return usePianoStore((s) => s.activeNotes.has(midi));
}
