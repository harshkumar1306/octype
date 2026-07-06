/**
 * useMetronome — React subscription hooks for the metronome beat state.
 *
 * Uses useSyncExternalStore with a referentially stable snapshot to avoid
 * infinite render loops (same pattern as useAudioEngine / useSampleProgress).
 *
 * The snapshot identity only changes when beat, beats, or playing actually
 * changes — so MetronomeWidget only re-renders once per beat (≤ 5×/sec at
 * 300 BPM maximum).
 */

import { useSyncExternalStore } from "react";

import { metronomeEngine } from "@/audio/metronome/MetronomeEngine";

/** Server-side / before-init snapshot. */
const SERVER_SNAPSHOT: Readonly<{ beat: number; beats: number; playing: boolean }> =
  { beat: 0, beats: 4, playing: false };

/**
 * Returns the current metronome beat state, synchronized with the audio
 * scheduler via useSyncExternalStore.
 *
 * Re-renders the component at most once per beat.
 */
export function useMetronomeBeat(): Readonly<{
  beat: number;
  beats: number;
  playing: boolean;
}> {
  return useSyncExternalStore(
    (cb) => metronomeEngine.subscribe(() => cb()),
    () => metronomeEngine.getBeatSnapshot(),
    () => SERVER_SNAPSHOT,
  );
}
