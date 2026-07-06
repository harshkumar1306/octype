/**
 * InputRouter — central dispatch for all input sources.
 *
 * Phase 3: sustain can be engaged from multiple sources at the same time
 * (held key, on-screen toggle, MIDI CC). The router tracks each source
 * independently and engages the engine's pedal whenever ANY source is on.
 * That mirrors a real piano: the pedal is down if anything is pressing it.
 */

import { audioEngine } from "@/audio/engine/AudioEngine";
import { logger } from "@/lib/logger";
import { midiToName } from "@/lib/noteUtils";
import { usePianoStore } from "@/stores/pianoStore";
import { useSettingsStore } from "@/stores/settingsStore";
import type { MidiNote, NoteSource } from "@/types/piano";

/** Identifier for a sustain trigger source. */
export type SustainSource =
  | "keyboard-hold"
  | "keyboard-toggle"
  | "ui-toggle"
  | "midi"
  | "mouse";

type SustainListener = (engaged: boolean) => void;

class InputRouterImpl {
  private engineKickoff: Promise<void> | null = null;

  private sustainSources = new Set<SustainSource>();
  private sustainListeners = new Set<SustainListener>();

  /** Dispatches a noteOn from any input source. */
  noteOn(midi: MidiNote, velocity: number, source: NoteSource): void {
    const transposed = this.applyTranspose(midi);
    if (transposed < 0 || transposed > 127) return;

    usePianoStore.getState().setNoteActive(transposed, velocity, source);
    logger.debug(
      `noteOn  ${midiToName(transposed)} (midi=${transposed}) v=${velocity} src=${source}`,
    );

    this.ensureEngineStarted();
    audioEngine.noteOn(transposed, velocity);
  }

  /** Dispatches a noteOff from any input source. */
  noteOff(midi: MidiNote, source: NoteSource): void {
    const transposed = this.applyTranspose(midi);
    if (transposed < 0 || transposed > 127) return;

    usePianoStore.getState().setNoteInactive(transposed);
    logger.debug(
      `noteOff ${midiToName(transposed)} (midi=${transposed}) src=${source}`,
    );

    audioEngine.noteOff(transposed);
  }

  /** Releases all currently active notes (used on focus loss). */
  releaseAll(): void {
    const active = usePianoStore.getState().activeNotes;
    usePianoStore.getState().clearActiveNotes();
    
    // Clear all sustain sources to prevent stuck pedal state.
    const wasSustained = this.sustainSources.size > 0;
    this.sustainSources.clear();
    if (wasSustained) {
      audioEngine.setSustain(false);
      for (const fn of this.sustainListeners) fn(false);
    }

    audioEngine.releaseAll();
    if (active.size > 0) {
      logger.debug(`releaseAll (${active.size} notes)`);
    }
  }

  /**
   * Engage / release a sustain source. The engine pedal is "on" whenever
   * any source is engaged, "off" only when every source has lifted.
   */
  setSustain(engaged: boolean, source: SustainSource): void {
    const wasOn = this.sustainSources.size > 0;
    if (engaged) this.sustainSources.add(source);
    else this.sustainSources.delete(source);
    const isOn = this.sustainSources.size > 0;
    if (wasOn !== isOn) {
      audioEngine.setSustain(isOn);
      logger.debug(`sustain ${isOn ? "engaged" : "released"} (last=${source})`);
      for (const fn of this.sustainListeners) fn(isOn);
    }
  }

  /** Whether the engine pedal is currently engaged. */
  getSustainState(): boolean {
    return this.sustainSources.size > 0;
  }

  /** Subscribe to sustain on/off changes (useful for UI buttons). */
  subscribeSustain(fn: SustainListener): () => void {
    this.sustainListeners.add(fn);
    return () => {
      this.sustainListeners.delete(fn);
    };
  }

  /** Kick the engine off on first user interaction. Idempotent. */
  ensureEngineStarted(): Promise<void> {
    if (this.engineKickoff) return this.engineKickoff;
    this.engineKickoff = audioEngine.init().catch((err) => {
      logger.error("audio engine init failed:", err);
      this.engineKickoff = null;
      throw err;
    });
    return this.engineKickoff;
  }

  private applyTranspose(midi: MidiNote): MidiNote {
    return midi + useSettingsStore.getState().transposeSemitones;
  }
}

export const inputRouter = new InputRouterImpl();
export type InputRouter = InputRouterImpl;
