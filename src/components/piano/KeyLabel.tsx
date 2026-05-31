"use client";

/**
 * KeyLabel — small toggle for the labels overlay on top of the keyboard.
 * Phase 1 keeps this simple. Phase 3 may move toggles into the Settings panel.
 */

import { SustainToggle } from "@/components/piano/SustainToggle";
import { usePianoStore } from "@/stores/pianoStore";

export function KeyLabelToggle(): JSX.Element {
  const showKeyLabels = usePianoStore((s) => s.showKeyLabels);
  const showNoteNames = usePianoStore((s) => s.showNoteNames);
  const toggleKeyLabels = usePianoStore((s) => s.toggleKeyLabels);
  const toggleNoteNames = usePianoStore((s) => s.toggleNoteNames);

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <Toggle
        active={showKeyLabels}
        onClick={toggleKeyLabels}
        label="key labels"
      />
      <Toggle
        active={showNoteNames}
        onClick={toggleNoteNames}
        label="note names"
      />
      <SustainToggle />
    </div>
  );
}

interface ToggleProps {
  active: boolean;
  onClick: () => void;
  label: string;
}

function Toggle({ active, onClick, label }: ToggleProps): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-md border px-2.5 py-1 font-mono transition-colors",
        active
          ? "border-accent/40 bg-accent/10 text-accent-soft"
          : "border-bg-subtle bg-bg-elevated text-fg-muted hover:border-accent/30 hover:text-fg",
      ].join(" ")}
      aria-pressed={active}
    >
      {label}
    </button>
  );
}
