import type { Metadata } from "next";
import Link from "next/link";
import { InfoPageLayout } from "@/components/ui/InfoPageLayout";

export const metadata: Metadata = {
  title: "Computer Keyboard Piano — Play Piano With Your Keyboard",
  description:
    "Learn how to use your computer keyboard as a virtual piano. Read about the Default & Max key mappings, custom configurations, playing chords, and hardware rollover limits.",
  alternates: {
    canonical: "/computer-keyboard-piano",
  },
};

export default function ComputerKeyboardPianoPage(): JSX.Element {
  return (
    <InfoPageLayout>
      <article className="prose prose-invert max-w-none">
        <h1 className="font-mono text-3xl font-semibold tracking-tight text-fg mb-6">
          Play Piano With Your Computer Keyboard
        </h1>

        <p className="font-sans text-sm leading-relaxed text-fg-muted mb-6">
          Did you know you can play a fully sampled grand piano using nothing more than your standard 
          computer keyboard? Octype maps physical computer keys directly to notes on the piano, 
          giving you a highly responsive, zero-install musical instrument directly inside your web browser.
        </p>

        <section className="mb-8">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.22em] text-accent-soft mb-3">
            How Keyboard Input Works
          </h2>
          <p className="font-sans text-sm leading-relaxed text-fg-muted mb-4">
            Octype listens to document-level key events. When you press a key on your computer keyboard, 
            the engine instantly translates the key code into a MIDI note number, matches it to the 
            corresponding concert grand sample layer, and triggers playback using the Web Audio API. 
            Because the audio scheduling runs independently from the React render cycles, latency is kept 
            under 10 milliseconds, making it feel like a real physical instrument.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.22em] text-accent-soft mb-3">
            Octype Key Mappings
          </h2>
          <p className="font-sans text-sm leading-relaxed text-fg-muted mb-4">
            Octype offers two default presets and a fully custom editor to map keys according to your comfort:
          </p>
          <ul className="list-disc pl-5 font-sans text-sm text-fg-muted space-y-2 mb-4">
            <li>
              <strong>Default Mapping (3 Octaves):</strong> Covers middle range C4 to C6. White keys are mapped 
              to QWERTY, UIOP, and ZXC rows. Black keys map to number row digits and home-row keys. Ideal for 
              two-handed melodies and simple harmonies.
            </li>
            <li>
              <strong>Max Mapping (5 Octaves):</strong> Spans from bass C2 all the way to treble C7. It utilizes 
              the <code>Shift</code> key to play accidental/black keys, allowing you to access a massive range 
              without run-out space constraints.
            </li>
            <li>
              <strong>Custom Mappings:</strong> Create your own layout. Open Settings, click Custom Mapping, 
              and select your preferred octave count. Arm any key and press the physical button to bind it.
            </li>
          </ul>
          <div className="mt-4">
            <Link
              href="/keyboard-mapping"
              className="font-mono text-xs text-accent-soft hover:underline"
            >
              → View complete keyboard layout maps
            </Link>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.22em] text-accent-soft mb-3">
            Playing Chords
          </h2>
          <p className="font-sans text-sm leading-relaxed text-fg-muted mb-4">
            You can play multiple keys simultaneously to sound chords (such as major/minor triads). 
            Since Octype has unlimited polyphony (capped only by your browser capabilities, with a default 
            cap of 24 voices), you can build complex harmonic layers.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.22em] text-accent-soft mb-3">
            Keyboard Rollover (NKRO) Limitations
          </h2>
          <p className="font-sans text-sm leading-relaxed text-fg-muted mb-4">
            If you try to play certain complex chords and notice some notes fail to register, you are likely 
            experiencing a hardware limitation known as <strong>keyboard ghosting or rollover</strong>. 
            Most standard laptop and office keyboards share electrical traces between keys. If you hold down 3 or 
            more keys in the same matrix row/column, the keyboard controller blockages the signal.
          </p>
          <p className="font-sans text-sm leading-relaxed text-fg-muted mb-4">
            To work around this hardware limitation, Octype provides a <strong>sustain pedal</strong> feature. 
            By holding <code>Space</code> or toggling sustain on, you can let played notes ring out naturally, 
            allowing you to layer complex chords one note at a time without bottlenecking keyboard matrix limitations.
          </p>
        </section>

        <section className="mb-8 border-t border-bg-subtle pt-6">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.22em] text-accent-soft mb-3">
            How to Start Playing
          </h2>
          <ol className="list-decimal pl-5 font-sans text-sm text-fg-muted space-y-2 mb-6">
            <li>Open the Octype homepage.</li>
            <li>Click the <strong>▶ start piano</strong> button to warm up the browser AudioContext.</li>
            <li>Make sure your browser window is focused.</li>
            <li>Press keys on your computer keyboard to play notes, and hold <code>Space</code> for sustain.</li>
          </ol>
          <div className="flex flex-wrap gap-4 mt-6">
            <Link
              href="/"
              className="rounded-md border border-accent/50 bg-accent/10 px-5 py-2 font-mono text-sm text-accent-soft transition-colors hover:border-accent hover:bg-accent/20"
            >
              🎹 Launch Playable Piano
            </Link>
            <Link
              href="/how-to-play"
              className="rounded-md border border-bg-subtle bg-bg-elevated px-5 py-2 font-mono text-sm text-fg-muted transition-colors hover:border-accent/40 hover:text-fg"
            >
              How to Play Guide
            </Link>
          </div>
        </section>
      </article>
    </InfoPageLayout>
  );
}
