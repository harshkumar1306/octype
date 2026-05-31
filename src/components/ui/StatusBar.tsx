"use client";

/**
 * StatusBar — small, always-visible footer showing audio state, active note
 * count, and (during background sample loading) a subtle progress hint.
 */

import {
  useAudioEngineStatus,
  useSampleProgress,
} from "@/hooks/useAudioEngine";
import { usePianoStore } from "@/stores/pianoStore";

export function StatusBar(): JSX.Element {
  const activeCount = usePianoStore((s) => s.activeNotes.size);
  const engineStatus = useAudioEngineStatus();
  const progress = useSampleProgress();

  const engineLabel = describeEngine(engineStatus);

  return (
    <div className="flex items-center justify-between px-6 py-3 font-mono text-[11px] text-fg-subtle">
      <div className="flex items-center gap-4">
        <span>
          active <span className="text-fg-muted">{activeCount}</span>
        </span>
        <span className="text-fg-subtle/70">
          audio: <span className="text-fg-muted">{engineLabel}</span>
        </span>
        {progress.status === "core-ready" && (
          <span className="text-fg-subtle/60">streaming more samples…</span>
        )}
        {progress.status === "ready" && (
          <span className="text-fg-subtle/50">all samples cached</span>
        )}
        {progress.error !== null && (
          <span className="text-red-400/80">{progress.error}</span>
        )}
      </div>
      <div className="text-fg-subtle/60">
        click anywhere or press a key to start audio
      </div>
    </div>
  );
}

function describeEngine(status: ReturnType<typeof useAudioEngineStatus>): string {
  switch (status) {
    case "idle":
      return "idle";
    case "initializing":
      return "starting…";
    case "loading-samples":
      return "loading samples…";
    case "ready":
      return "ready";
    case "error":
      return "error";
    default:
      return status;
  }
}
