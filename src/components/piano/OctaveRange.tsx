"use client";

/**
 * OctaveRange — two distinct controls:
 *   - "octave range" (◂ / ▸): slides the MAPPED region up/down. This is what
 *     your keyboard keys play.
 *   - "visible" (− / +): how many octaves are drawn on screen. Always >= the
 *     mapped octaves so the mapped region is fully visible.
 */

import { midiToName } from "@/lib/noteUtils";
import { usePianoStore } from "@/stores/pianoStore";

export function OctaveRange(): JSX.Element {
  const octaves = usePianoStore((s) => s.octaves);
  const mappingBaseMidi = usePianoStore((s) => s.mappingBaseMidi);
  const mappingOctaves = usePianoStore((s) => s.mappingOctaves);
  const shiftOctave = usePianoStore((s) => s.shiftOctave);
  const setOctaves = usePianoStore((s) => s.setOctaves);

  const mappingEnd = mappingBaseMidi + mappingOctaves * 12;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-1 py-3 text-sm">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => shiftOctave(-1)}
          className="rounded-md border border-bg-subtle bg-bg-elevated px-3 py-1.5 font-mono text-fg-muted transition-colors hover:border-accent/40 hover:text-fg"
          aria-label="Move mapped octaves down"
        >
          ◂ oct
        </button>
        <button
          type="button"
          onClick={() => shiftOctave(1)}
          className="rounded-md border border-bg-subtle bg-bg-elevated px-3 py-1.5 font-mono text-fg-muted transition-colors hover:border-accent/40 hover:text-fg"
          aria-label="Move mapped octaves up"
        >
          oct ▸
        </button>
        <div className="ml-2 font-mono text-xs text-fg-subtle">
          mapped&nbsp;
          <span className="text-accent-soft">{midiToName(mappingBaseMidi)}</span>
          <span className="mx-1 text-fg-subtle">–</span>
          <span className="text-accent-soft">{midiToName(mappingEnd)}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="font-mono text-xs text-fg-subtle">visible</span>
        <button
          type="button"
          onClick={() => setOctaves(octaves - 1)}
          disabled={octaves <= mappingOctaves}
          className="rounded-md border border-bg-subtle bg-bg-elevated px-2 py-1 font-mono text-fg-muted hover:border-accent/40 hover:text-fg disabled:opacity-40"
          aria-label="Show fewer octaves"
        >
          −
        </button>
        <span className="w-6 text-center font-mono text-fg">{octaves}</span>
        <button
          type="button"
          onClick={() => setOctaves(octaves + 1)}
          className="rounded-md border border-bg-subtle bg-bg-elevated px-2 py-1 font-mono text-fg-muted hover:border-accent/40 hover:text-fg"
          aria-label="Show more octaves"
        >
          +
        </button>
      </div>
    </div>
  );
}
