/**
 * MidiManager — Web MIDI API integration.
 *
 * Responsibilities:
 *   - Request MIDI access on demand (sysex disabled).
 *   - Discover all input devices, watch for hot-plug events.
 *   - Subscribe to every input's `onmidimessage` and parse incoming bytes.
 *   - Route parsed messages to InputRouter (Note On/Off + Sustain CC).
 *
 * The manager is a singleton; React hooks subscribe to it via
 * `useSyncExternalStore` (see hooks/useMidi.ts). The audio path remains
 * decoupled from React — messages flow MidiManager -> InputRouter ->
 * AudioEngine without touching any rendering code.
 */

import { parseMidi } from "@/audio/midi/MidiParser";
import { logger } from "@/lib/logger";
import { useSettingsStore } from "@/stores/settingsStore";
import { inputRouter } from "@/systems/input/InputRouter";
import type {
  MidiAvailability,
  MidiConnectionState,
  MidiDeviceInfo,
} from "@/types/midi";

interface ManagerSnapshot {
  availability: MidiAvailability;
  devices: readonly MidiDeviceInfo[];
  error: string | null;
}

const SERVER_SNAPSHOT: ManagerSnapshot = {
  availability: "unsupported",
  devices: [],
  error: null,
};

type Listener = () => void;

class MidiManagerImpl {
  private access: MIDIAccess | null = null;
  private snapshot: ManagerSnapshot = {
    availability: "idle",
    devices: [],
    error: null,
  };
  private listeners = new Set<Listener>();
  private inputHandlers = new WeakMap<MIDIInput, (e: MIDIMessageEvent) => void>();
  private requestPromise: Promise<void> | null = null;

  /** Returns true if this browser exposes Web MIDI at all. */
  isSupported(): boolean {
    return (
      typeof navigator !== "undefined" &&
      typeof navigator.requestMIDIAccess === "function"
    );
  }

  /** Subscribe for device list / availability changes. */
  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  /** React-friendly snapshot (referentially stable until something changes). */
  getSnapshot(): ManagerSnapshot {
    return this.snapshot;
  }

  /** Server-side / pre-hydration snapshot (no MIDI on the server). */
  getServerSnapshot(): ManagerSnapshot {
    return SERVER_SNAPSHOT;
  }

  /**
   * Requests MIDI access from the browser.
   * Idempotent — calling repeatedly returns the existing access.
   * Must be called from a user gesture for the prompt to surface.
   */
  request(): Promise<void> {
    if (this.requestPromise) return this.requestPromise;
    if (!this.isSupported()) {
      this.update({
        availability: "unsupported",
        devices: [],
        error: "Web MIDI is not supported in this browser.",
      });
      return Promise.resolve();
    }

    this.update({ ...this.snapshot, availability: "requesting", error: null });

    this.requestPromise = (async () => {
      try {
        const requestFn = navigator.requestMIDIAccess;
        if (!requestFn) {
          throw new Error("Web MIDI not available.");
        }
        const access = await requestFn.call(navigator, { sysex: false });
        this.access = access;
        access.onstatechange = (event) => this.handleStateChange(event);
        this.attachAllInputs();
        this.update({
          availability: "granted",
          devices: this.listInputs(),
          error: null,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        const denied = /denied|permission/i.test(msg);
        this.update({
          availability: denied ? "denied" : "error",
          devices: [],
          error: msg,
        });
        this.requestPromise = null;
      }
    })();

    return this.requestPromise;
  }

  /** Detaches all inputs and resets state. */
  disable(): void {
    if (this.access) {
      for (const input of this.access.inputs.values()) {
        const handler = this.inputHandlers.get(input);
        if (handler) {
          input.removeEventListener("midimessage", handler as EventListener);
          this.inputHandlers.delete(input);
        }
        input.onmidimessage = null;
      }
      this.access.onstatechange = null;
      this.access = null;
    }
    this.requestPromise = null;
    this.update({
      availability: this.isSupported() ? "idle" : "unsupported",
      devices: [],
      error: null,
    });
  }

  private handleStateChange(_event: Event): void {
    if (!this.access) return;
    this.attachAllInputs();
    this.update({
      ...this.snapshot,
      devices: this.listInputs(),
    });
  }

  private attachAllInputs(): void {
    if (!this.access) return;
    for (const input of this.access.inputs.values()) {
      if (this.inputHandlers.has(input)) continue;
      const handler = (event: MIDIMessageEvent): void => {
        this.handleMessage(input, event);
      };
      input.addEventListener("midimessage", handler as EventListener);
      this.inputHandlers.set(input, handler);
    }
  }

  private handleMessage(input: MIDIInput, event: MIDIMessageEvent): void {
    if (!useSettingsStore.getState().midiEnabled) return;
    const data = event.data;
    if (!data) return;
    const msg = parseMidi(new Uint8Array(data));
    if (!msg) return;

    switch (msg.type) {
      case "noteOn":
        inputRouter.noteOn(msg.note, msg.velocity, "midi");
        break;
      case "noteOff":
        inputRouter.noteOff(msg.note, "midi");
        break;
      case "controlChange": {
        const cc = useSettingsStore.getState().midiSustainCC;
        if (msg.controller === cc) {
          // CC64: 0..63 = off, 64..127 = on (standard).
          const engaged = msg.value >= 64;
          inputRouter.setSustain(engaged, "midi");
        }
        break;
      }
      default:
        // Should not happen given parseMidi's return type.
        logger.debug("unexpected midi message", msg, input.name);
    }
  }

  private listInputs(): MidiDeviceInfo[] {
    if (!this.access) return [];
    const list: MidiDeviceInfo[] = [];
    for (const input of this.access.inputs.values()) {
      list.push({
        id: input.id,
        name: input.name ?? "(unknown)",
        manufacturer: input.manufacturer ?? "",
        state: (input.state as MidiConnectionState) ?? "connected",
      });
    }
    return list;
  }

  private update(snap: ManagerSnapshot): void {
    const prev = this.snapshot;
    if (
      prev.availability === snap.availability &&
      prev.error === snap.error &&
      sameDevices(prev.devices, snap.devices)
    ) {
      return;
    }
    this.snapshot = snap;
    for (const fn of this.listeners) fn();
  }
}

function sameDevices(
  a: readonly MidiDeviceInfo[],
  b: readonly MidiDeviceInfo[],
): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    const ai = a[i];
    const bi = b[i];
    if (!ai || !bi) return false;
    if (ai.id !== bi.id || ai.state !== bi.state || ai.name !== bi.name) {
      return false;
    }
  }
  return true;
}

export const midiManager = new MidiManagerImpl();
export type MidiManager = MidiManagerImpl;
