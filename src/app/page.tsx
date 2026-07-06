import type { Metadata } from "next";
import Link from "next/link";
import { PianoPageClient } from "@/app/PianoPageClient";

export const metadata: Metadata = {
  alternates: {
    canonical: "https://octype.app",
  },
};

export default function HomePage(): JSX.Element {
  // WebApplication JSON-LD schema
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Octype",
    "url": "https://octype.app",
    "applicationCategory": "MultimediaApplication",
    "operatingSystem": "All",
    "browserRequirements": "Requires HTML5, Web Audio API, and optionally Web MIDI API support.",
    "offers": {
      "@type": "Offer",
      "price": "0.00",
      "priceCurrency": "USD"
    },
    "description": "A premium browser-based virtual piano. Play a sampled acoustic grand piano online using your computer keyboard, MIDI keyboard, mouse, or touchscreen."
  };

  return (
    <main className="relative flex min-h-screen flex-col justify-between">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* The main playable piano app */}
      <PianoPageClient />

      {/* Concise, server-rendered crawlable SEO footer */}
      <div className="mx-auto w-full max-w-4xl px-5 pb-8 pt-4 border-t border-bg-subtle/30 font-sans text-xs text-fg-subtle">
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between items-center text-center sm:text-left">
          <div className="max-w-xl">
            <h1 className="font-mono text-sm font-semibold tracking-wider text-fg uppercase mb-2">
              Play Piano Online
            </h1>
            <p className="leading-relaxed">
              Welcome to <strong>Octype</strong>, a free browser-based <strong>virtual piano</strong> keyboard.
              Octype recreates the rich acoustics of a sampled grand piano with high-resolution velocity layers, 
              playable with a computer keyboard, mouse, touchscreen, or MIDI keyboard. Includes a built-in metronome, 
              audio recorder, and visualizer.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 font-mono text-[11px] sm:justify-end">
            <Link href="/computer-keyboard-piano" className="hover:text-fg underline">
              Computer Piano
            </Link>
            <Link href="/midi-piano" className="hover:text-fg underline">
              MIDI Keyboard Guide
            </Link>
            <Link href="/keyboard-mapping" className="hover:text-fg underline">
              Keyboard Mappings
            </Link>
            <Link href="/how-to-play" className="hover:text-fg underline">
              How to Play
            </Link>
            <Link href="/about" className="hover:text-fg underline">
              About
            </Link>
            <Link href="/credits" className="hover:text-fg underline">
              Credits
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
