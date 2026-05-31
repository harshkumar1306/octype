/**
 * useMidi — React-friendly accessor for the MIDI manager state.
 *
 * Subscribes via useSyncExternalStore so the manager (a plain singleton)
 * stays decoupled from React's lifecycle.
 */

import { useSyncExternalStore } from "react";

import { midiManager } from "@/audio/midi/MidiManager";

export function useMidiState(): ReturnType<typeof midiManager.getSnapshot> {
  return useSyncExternalStore(
    (cb) => midiManager.subscribe(cb),
    () => midiManager.getSnapshot(),
    () => midiManager.getServerSnapshot(),
  );
}

/** Imperative request — call from within a user gesture handler. */
export function requestMidi(): Promise<void> {
  return midiManager.request();
}

export function disableMidi(): void {
  midiManager.disable();
}
