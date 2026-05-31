/**
 * MIDI types — used by MidiManager and the settings UI.
 */

/** Connection state of a MIDI device. */
export type MidiConnectionState = "connected" | "disconnected";

/** Coarse availability state of the Web MIDI subsystem. */
export type MidiAvailability =
  | "unsupported" // navigator.requestMIDIAccess is missing
  | "idle" // not yet requested
  | "requesting" // permission prompt visible
  | "granted" // we have access
  | "denied" // user denied permission
  | "error"; // any other failure

/** Public-safe info about a discovered MIDI input. */
export interface MidiDeviceInfo {
  id: string;
  name: string;
  manufacturer: string;
  state: MidiConnectionState;
}

/** A parsed MIDI message. Only the channel-voice messages we care about. */
export type MidiMessage =
  | { type: "noteOn"; note: number; velocity: number; channel: number }
  | { type: "noteOff"; note: number; velocity: number; channel: number }
  | {
      type: "controlChange";
      controller: number;
      value: number;
      channel: number;
    };
