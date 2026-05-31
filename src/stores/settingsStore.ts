/**
 * User settings store.
 *
 * Phase 1: minimal — only audio + display fields used by the settings shell.
 * Phase 2/3 will wire the audio fields into the engine.
 */

import { create } from "zustand";

import { isLowPowerDevice } from "@/lib/device";
import type { AudioSettings } from "@/types/audio";

interface SettingsState extends AudioSettings {
  /** Semitones to transpose all played notes. */
  transposeSemitones: number;
  /** Whether the settings drawer is open. */
  settingsOpen: boolean;

  /** KeyboardEvent.code that toggles sustain (default Space). */
  sustainKey: string;
  /** Whether MIDI input is globally enabled. */
  midiEnabled: boolean;
  /** Which CC controller acts as sustain (default 64). */
  midiSustainCC: number;

  setMasterVolume: (v: number) => void;
  setVelocitySensitivity: (v: number) => void;
  /** Default velocity used by the typing keyboard (1..127). */
  setTypingVelocity: (v: number) => void;
  setTranspose: (semitones: number) => void;
  setReverbEnabled: (enabled: boolean) => void;
  setReverbAmount: (amount: number) => void;
  setVoiceLimit: (limit: number) => void;
  setLatencyOffset: (ms: number) => void;
  setSustainKey: (code: string) => void;
  setMidiEnabled: (enabled: boolean) => void;
  setMidiSustainCC: (cc: number) => void;
  openSettings: () => void;
  closeSettings: () => void;
  toggleSettings: () => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  masterVolume: 0.65,
  velocitySensitivity: 0.65,
  defaultVelocity: 100,
  reverb: { enabled: true, amount: 0.25 },
  voiceLimit: isLowPowerDevice() ? 16 : 24,
  latencyOffsetMs: 0,
  transposeSemitones: 0,
  settingsOpen: false,

  sustainKey: "Space",
  midiEnabled: true,
  midiSustainCC: 64,

  setMasterVolume: (masterVolume) => set({ masterVolume: clamp01(masterVolume) }),
  setVelocitySensitivity: (v) => set({ velocitySensitivity: clamp01(v) }),
  setTypingVelocity: (defaultVelocity) =>
    set({ defaultVelocity: Math.max(1, Math.min(127, Math.round(defaultVelocity))) }),
  setTranspose: (transposeSemitones) =>
    set({ transposeSemitones: Math.max(-24, Math.min(24, Math.round(transposeSemitones))) }),
  setReverbEnabled: (enabled) =>
    set((s) => ({ reverb: { ...s.reverb, enabled } })),
  setReverbAmount: (amount) =>
    set((s) => ({ reverb: { ...s.reverb, amount: clamp01(amount) } })),
  setVoiceLimit: (voiceLimit) =>
    set({ voiceLimit: Math.max(8, Math.min(64, Math.round(voiceLimit))) }),
  setLatencyOffset: (latencyOffsetMs) =>
    set({ latencyOffsetMs: Math.max(-100, Math.min(100, latencyOffsetMs)) }),
  setSustainKey: (sustainKey) => set({ sustainKey }),
  setMidiEnabled: (midiEnabled) => set({ midiEnabled }),
  setMidiSustainCC: (midiSustainCC) =>
    set({ midiSustainCC: Math.max(0, Math.min(127, Math.round(midiSustainCC))) }),
  openSettings: () => set({ settingsOpen: true }),
  closeSettings: () => set({ settingsOpen: false }),
  toggleSettings: () => set((s) => ({ settingsOpen: !s.settingsOpen })),
}));

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}
