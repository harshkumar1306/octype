"use client";

/**
 * Header — top bar with app name, home (back to intro), fullscreen, settings.
 */

import { useSettingsStore } from "@/stores/settingsStore";

interface HeaderProps {
  /** Whether to show the home button (only on the piano view). */
  showHome?: boolean;
  /** Called when the home button is clicked. */
  onHome?: () => void;
}

export function Header({ showHome = false, onHome }: HeaderProps): JSX.Element {
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
      <div className="flex items-center gap-3">
        {showHome && (
          <button
            type="button"
            onClick={onHome}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-bg-subtle bg-bg-elevated text-fg-muted transition-colors hover:border-accent/40 hover:text-fg"
            aria-label="Back to home"
            title="Home"
          >
            <HomeIcon />
          </button>
        )}
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

/** Simple house glyph (SVG so it renders consistently across platforms). */
function HomeIcon(): JSX.Element {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5 10v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9" />
      <path d="M9 20v-6h6v6" />
    </svg>
  );
}
