/**
 * useKeyboardInput — installs the document-level keyboard listener for the
 * lifetime of the calling component.
 */

import { useEffect } from "react";

import { keyboardInput } from "@/systems/input/KeyboardInput";

/** Installs keyboard input handlers. Mount once at the app root. */
export function useKeyboardInput(): void {
  useEffect(() => {
    keyboardInput.install();
    return () => {
      keyboardInput.uninstall();
    };
  }, []);
}
