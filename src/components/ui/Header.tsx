"use client";

/**
 * Header — minimal top bar with app name and settings trigger.
 */

import { useSettingsStore } from "@/stores/settingsStore";

export function Header(): JSX.Element {
  const toggleSettings = useSettingsStore((s) => s.toggleSettings);

  const toggleFullscreen = (): void => {
    if (!document.fullscreenElement) {
      void document.documentElement.requestFullscreen();
    } else {
      void document.exitFullscreen();
    }
  };

  return (
    <header className="flex items-center justify-between px-4 py-4 sm:px-6">
      <div className="flex items-baseline gap-3">
        <h1 className="font-mono text-lg font-semibold tracking-tight text-fg">
          octype
        </h1>
        <span className="hidden font-mono text-xs text-fg-subtle sm:inline">
          virtual piano
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={toggleFullscreen}
          className="rounded-md border border-bg-subtle bg-bg-elevated px-3 py-1.5 font-mono text-xs text-fg-muted transition-colors hover:border-accent/40 hover:text-fg"
          aria-label="Toggle fullscreen"
        >
          ⛶
        </button>
        <button
          type="button"
          onClick={toggleSettings}
          className="rounded-md border border-bg-subtle bg-bg-elevated px-3 py-1.5 font-mono text-xs text-fg-muted transition-colors hover:border-accent/40 hover:text-fg"
          aria-label="Open settings"
        >
          settings
        </button>
      </div>
    </header>
  );
}
