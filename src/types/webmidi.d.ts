/**
 * Minimal ambient types for the Web MIDI API.
 *
 * TypeScript's bundled DOM lib doesn't include Web MIDI. We declare just
 * enough of the surface to type our MidiManager safely. If we ever need
 * sysex / output / port-by-id, expand here.
 */

interface MIDIMessageEvent extends Event {
  readonly data: Uint8Array | null;
}

interface MIDIPort extends EventTarget {
  readonly id: string;
  readonly manufacturer?: string | null;
  readonly name?: string | null;
  readonly type: "input" | "output";
  readonly version?: string | null;
  readonly state: "connected" | "disconnected";
  readonly connection: "open" | "closed" | "pending";
}

interface MIDIInput extends MIDIPort {
  readonly type: "input";
  onmidimessage:
    | ((this: MIDIInput, ev: MIDIMessageEvent) => void)
    | null;
}

interface MIDIInputMap {
  values(): IterableIterator<MIDIInput>;
  forEach(callback: (input: MIDIInput) => void): void;
  readonly size: number;
}

interface MIDIOutputMap {
  values(): IterableIterator<MIDIPort>;
  readonly size: number;
}

interface MIDIAccess extends EventTarget {
  readonly inputs: MIDIInputMap;
  readonly outputs: MIDIOutputMap;
  readonly sysexEnabled: boolean;
  onstatechange: ((this: MIDIAccess, ev: Event) => void) | null;
}

interface MIDIOptions {
  sysex?: boolean;
  software?: boolean;
}

interface Navigator {
  requestMIDIAccess?: (options?: MIDIOptions) => Promise<MIDIAccess>;
}
