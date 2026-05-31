/**
 * MidiParser — pure decoder for MIDI status bytes.
 *
 * Handles the three message types we route in Phase 3:
 *   - 0x90 Note On  (Note On with velocity 0 is treated as Note Off — the
 *                    common "running status" idiom from many MIDI sources.)
 *   - 0x80 Note Off
 *   - 0xB0 Control Change  (CC64 = sustain pedal)
 *
 * Returns null for messages we don't handle (Aftertouch, Pitch Bend, SysEx,
 * etc.) so the caller can drop them.
 */

import type { MidiMessage } from "@/types/midi";

const NOTE_ON = 0x90;
const NOTE_OFF = 0x80;
const CONTROL_CHANGE = 0xb0;

/** Parses a raw MIDI message; returns null if it isn't one we route. */
export function parseMidi(data: Uint8Array): MidiMessage | null {
  if (data.length < 2) return null;
  const status = data[0] ?? 0;
  const channel = status & 0x0f;
  const type = status & 0xf0;

  switch (type) {
    case NOTE_ON: {
      const note = data[1] ?? 0;
      const velocity = data[2] ?? 0;
      // Note On with velocity 0 is conventionally a Note Off.
      if (velocity === 0) {
        return { type: "noteOff", note, velocity: 0, channel };
      }
      return { type: "noteOn", note, velocity, channel };
    }
    case NOTE_OFF: {
      const note = data[1] ?? 0;
      const velocity = data[2] ?? 0;
      return { type: "noteOff", note, velocity, channel };
    }
    case CONTROL_CHANGE: {
      const controller = data[1] ?? 0;
      const value = data[2] ?? 0;
      return { type: "controlChange", controller, value, channel };
    }
    default:
      return null;
  }
}
