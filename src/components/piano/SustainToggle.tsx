"use client";

/**
 * SustainToggle — on-screen sustain pedal button.
 */

import { useSyncExternalStore } from "react";

import { inputRouter } from "@/systems/input/InputRouter";

export function SustainToggle(): JSX.Element {
  const isOn = useSyncExternalStore(
    (cb) => inputRouter.subscribeSustain(() => cb()),
    () => inputRouter.getSustainState(),
    () => false,
  );

  const toggleUi = (): void => {
    inputRouter.setSustain(!isOn, "ui-toggle");
  };

  return (
    <button
      type="button"
      onClick={toggleUi}
      aria-pressed={isOn}
      className={[
        "rounded-md border px-2.5 py-1 font-mono text-xs transition-colors",
        isOn
          ? "border-accent bg-accent/20 text-accent-soft"
          : "border-bg-subtle bg-bg-elevated text-fg-muted hover:border-accent/30 hover:text-fg",
      ].join(" ")}
      title="Toggle sustain pedal"
    >
      sustain {isOn ? "on" : "off"}
    </button>
  );
}
