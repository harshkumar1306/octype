/**
 * useSustainKey — installs a document-level keyboard listener that drives
 * the sustain pedal from a single configurable key (default Space).
 *
 * Behavior:
 *   - keydown on sustain key -> engage sustain
 *   - keyup   on sustain key -> release sustain
 *   - event.repeat is ignored so sustain doesn't bounce when key is held
 *   - browser scroll on Space is suppressed while the keyboard input is
 *     focused on the piano
 */

import { useEffect } from "react";

import { useSettingsStore } from "@/stores/settingsStore";
import { inputRouter } from "@/systems/input/InputRouter";

export function useSustainKey(): void {
  useEffect(() => {
    const onDown = (event: KeyboardEvent): void => {
      if (event.repeat) return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (shouldIgnore(event.target)) return;
      const code = useSettingsStore.getState().sustainKey;
      if (event.code !== code) return;
      event.preventDefault();
      inputRouter.setSustain(true, "keyboard-hold");
    };

    const onUp = (event: KeyboardEvent): void => {
      if (shouldIgnore(event.target)) return;
      const code = useSettingsStore.getState().sustainKey;
      if (event.code !== code) return;
      event.preventDefault();
      inputRouter.setSustain(false, "keyboard-hold");
    };

    const onBlur = (): void => {
      inputRouter.setSustain(false, "keyboard-hold");
      inputRouter.setSustain(false, "keyboard-toggle");
    };

    const onVisibilityChange = (): void => {
      if (document.hidden) {
        inputRouter.setSustain(false, "keyboard-hold");
        inputRouter.setSustain(false, "keyboard-toggle");
      }
    };

    document.addEventListener("keydown", onDown);
    document.addEventListener("keyup", onUp);
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("blur", onBlur);
    return () => {
      document.removeEventListener("keydown", onDown);
      document.removeEventListener("keyup", onUp);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur", onBlur);
    };
  }, []);
}

function shouldIgnore(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;
  return false;
}
