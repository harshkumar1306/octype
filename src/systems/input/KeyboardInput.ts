/**
 * KeyboardInput — document-level keyboard listener.
 *
 * Updated for the new mapping system:
 *   - Passes `event.shiftKey` to the resolver so Max mapping's
 *     Shift-for-black-keys works.
 *   - In Max mode, Shift is NOT treated as a modifier that blocks input
 *     (unlike Ctrl/Alt/Meta which still block).
 */

import { resolveCodeToMidi } from "@/systems/mapping/KeyMapping";
import { useMappingStore } from "@/stores/mappingStore";
import { usePianoStore } from "@/stores/pianoStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { inputRouter } from "@/systems/input/InputRouter";

class KeyboardInputImpl {
  private installed = false;
  private heldKeys = new Map<string, number>();

  install(): void {
    if (this.installed) return;
    if (typeof document === "undefined") return;
    document.addEventListener("keydown", this.onKeyDown);
    document.addEventListener("keyup", this.onKeyUp);
    document.addEventListener("visibilitychange", this.onVisibilityChange);
    window.addEventListener("blur", this.onBlur);
    this.installed = true;
  }

  uninstall(): void {
    if (!this.installed) return;
    document.removeEventListener("keydown", this.onKeyDown);
    document.removeEventListener("keyup", this.onKeyUp);
    document.removeEventListener("visibilitychange", this.onVisibilityChange);
    window.removeEventListener("blur", this.onBlur);
    this.releaseAllHeld();
    inputRouter.releaseAll();
    this.installed = false;
  }

  private onKeyDown = (event: KeyboardEvent): void => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (this.shouldIgnoreTarget(event.target)) return;

    const profile = useMappingStore.getState().getActiveProfile();
    // The mapping base is the LIVE anchor in the piano store, which moves
    // when the user shifts the octave range but is independent of how many
    // octaves are visible.
    const baseMidi = usePianoStore.getState().mappingBaseMidi;
    const midi = resolveCodeToMidi(
      event.code,
      event.shiftKey,
      baseMidi,
      profile.bindings,
    );
    if (midi === null) return;

    // Prevent the browser's default action for ANY bound key — including
    // auto-repeat events. This is critical for keys like Tab/Space which
    // would otherwise move focus or scroll while held.
    event.preventDefault();

    // Don't retrigger the note on auto-repeat; just keep swallowing the key.
    if (event.repeat) return;

    const holdKey = event.shiftKey ? `shift:${event.code}` : event.code;
    if (this.heldKeys.has(holdKey)) return;

    this.heldKeys.set(holdKey, midi);
    const velocity = this.computeTypingVelocity();
    inputRouter.noteOn(midi, velocity, "keyboard");
  };

  private onKeyUp = (event: KeyboardEvent): void => {
    // Try both shift and non-shift variants since the user might release
    // Shift before releasing the note key.
    const holdKey = `shift:${event.code}`;
    const plainKey = event.code;

    const midiShift = this.heldKeys.get(holdKey);
    if (midiShift !== undefined) {
      this.heldKeys.delete(holdKey);
      inputRouter.noteOff(midiShift, "keyboard");
    }

    const midiPlain = this.heldKeys.get(plainKey);
    if (midiPlain !== undefined) {
      this.heldKeys.delete(plainKey);
      inputRouter.noteOff(midiPlain, "keyboard");
    }
  };

  private onBlur = (): void => {
    this.releaseAllHeld();
    inputRouter.releaseAll();
  };

  private onVisibilityChange = (): void => {
    if (document.hidden) {
      this.releaseAllHeld();
      inputRouter.releaseAll();
    }
  };

  private releaseAllHeld(): void {
    if (this.heldKeys.size === 0) return;
    for (const midi of this.heldKeys.values()) {
      inputRouter.noteOff(midi, "keyboard");
    }
    this.heldKeys.clear();
  }

  private shouldIgnoreTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false;
    const tag = target.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
    if (target.isContentEditable) return true;
    return false;
  }

  private computeTypingVelocity(): number {
    const base = useSettingsStore.getState().defaultVelocity;
    const v = base + Math.floor(Math.random() * 5) - 2;
    return Math.max(1, Math.min(127, v));
  }
}

export const keyboardInput = new KeyboardInputImpl();
export type KeyboardInput = KeyboardInputImpl;
