import React from "react";
import Link from "next/link";

interface InfoPageLayoutProps {
  children: React.ReactNode;
}

export function InfoPageLayout({ children }: InfoPageLayoutProps): JSX.Element {
  return (
    <div className="mx-auto flex min-h-screen max-w-4xl flex-col px-5 py-6">
      {/* Minimal Info Page Header */}
      <header className="flex items-center justify-between border-b border-bg-subtle pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="font-mono text-lg font-semibold tracking-tight text-fg hover:text-accent-soft"
          >
            octype
          </Link>
          <span className="hidden font-mono text-xs text-fg-subtle sm:inline">
            virtual piano
          </span>
        </div>
        <Link
          href="/"
          className="rounded-md border border-accent/50 bg-accent/10 px-4 py-1.5 font-mono text-xs text-accent-soft transition-colors hover:border-accent hover:bg-accent/20"
        >
          🎹 Play Piano
        </Link>
      </header>

      {/* Page Content */}
      <main className="flex-1 py-8 sm:py-12">{children}</main>

      {/* Minimal Footer with Internal Links */}
      <footer className="mt-12 border-t border-bg-subtle pt-6 pb-8 text-center">
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 font-mono text-xs text-fg-subtle">
          <Link href="/" className="hover:text-fg">
            Play Piano
          </Link>
          <Link href="/computer-keyboard-piano" className="hover:text-fg">
            Computer Keyboard Input
          </Link>
          <Link href="/midi-piano" className="hover:text-fg">
            MIDI Keyboard Guide
          </Link>
          <Link href="/keyboard-mapping" className="hover:text-fg">
            Key Mapping Layouts
          </Link>
          <Link href="/how-to-play" className="hover:text-fg">
            How to Play Guide
          </Link>
          <Link href="/about" className="hover:text-fg">
            About Octype
          </Link>
          <Link href="/credits" className="hover:text-fg">
            Credits
          </Link>
        </div>
        <div className="mt-6 font-mono text-[10px] text-fg-subtle/50">
          © {new Date().getFullYear()} Octype. A browser grand piano built for musical responsiveness.
        </div>
      </footer>
    </div>
  );
}
