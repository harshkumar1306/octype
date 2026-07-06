/**
 * metronomeStore — Zustand store for metronome user preferences.
 *
 * State is split between:
 *   - Persistent fields (bpm, timeSignature, volume, recordMetronome):
 *     saved to localStorage so preferences survive page reloads.
 *   - Ephemeral fields (enabled): always starts as false so the metronome
 *     never auto-starts on reload.
 *
 * The MetronomeEngine reads this store imperatively via getState() — never
 * through React hooks. React components subscribe reactively.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

/** Supported time signatures. */
export type TimeSignature = "2/4" | "3/4" | "4/4" | "6/8";

interface MetronomeState {
  /** Whether the metronome is currently running. NOT persisted. */
  enabled: boolean;
  /** Tempo in beats per minute (30–300). Persisted. */
  bpm: number;
  /** Time signature. Persisted. */
  timeSignature: TimeSignature;
  /** Metronome output volume 0–1. Persisted. */
  volume: number;
  /**
   * When true, metronome clicks are routed to the recording analyser so they
   * appear in downloaded recordings. Persisted. Default: false.
   */
  recordMetronome: boolean;

  setEnabled: (v: boolean) => void;
  setBpm: (v: number) => void;
  setTimeSignature: (ts: TimeSignature) => void;
  setVolume: (v: number) => void;
  setRecordMetronome: (v: boolean) => void;
}

export const useMetronomeStore = create<MetronomeState>()(
  persist(
    (set) => ({
      enabled: false,
      bpm: 120,
      timeSignature: "4/4",
      volume: 0.5,
      recordMetronome: false,

      setEnabled: (enabled) => set({ enabled }),
      setBpm: (bpm) =>
        set({ bpm: Math.max(30, Math.min(300, Math.round(bpm))) }),
      setTimeSignature: (timeSignature) => set({ timeSignature }),
      setVolume: (volume) =>
        set({ volume: Math.max(0, Math.min(1, volume)) }),
      setRecordMetronome: (recordMetronome) => set({ recordMetronome }),
    }),
    {
      name: "octype:metronome:v1",
      // Only persist preferences, not the running state.
      partialize: (state) => ({
        bpm: state.bpm,
        timeSignature: state.timeSignature,
        volume: state.volume,
        recordMetronome: state.recordMetronome,
      }),
    },
  ),
);
