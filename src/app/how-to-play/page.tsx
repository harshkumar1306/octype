import type { Metadata } from "next";
import Link from "next/link";
import { InfoPageLayout } from "@/components/ui/InfoPageLayout";

export const metadata: Metadata = {
  title: "How to Play Piano With Your Computer Keyboard",
  description:
    "Read the practical user guide for Octype virtual piano. Learn about start settings, key maps, sustain pedal inputs, transpose, recording, metronome, and MIDI options.",
  alternates: {
    canonical: "/how-to-play",
  },
};

export default function HowToPlayPage(): JSX.Element {
  return (
    <InfoPageLayout>
      <article className="prose prose-invert max-w-none">
        <h1 className="font-mono text-3xl font-semibold tracking-tight text-fg mb-6">
          How to Play Piano With Your Computer Keyboard
        </h1>

        <p className="font-sans text-sm leading-relaxed text-fg-muted mb-6">
          Octype is a highly responsive virtual piano instrument designed for web browsers. This guide walks 
          you through how to configure settings, connect inputs, trigger sustain, record clips, and play 
          music using your standard typing keyboard or MIDI controllers.
        </p>

        <section className="mb-8">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.22em] text-accent-soft mb-3">
            Getting Started: Start Piano
          </h2>
          <p className="font-sans text-sm leading-relaxed text-fg-muted mb-4">
            Modern browser privacy rules require an explicit user gesture before playing web audio. When you visit 
            the home page, click the <strong>▶ start piano</strong> button. This initializes the Web Audio 
            context, triggers Core sample loading, and arms the input listeners.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.22em] text-accent-soft mb-3">
            Computer Keyboard Controls
          </h2>
          <p className="font-sans text-sm leading-relaxed text-fg-muted mb-4">
            Ensure the browser window is active. Notes correspond to your typing keyboard keys.
          </p>
          <ul className="list-disc pl-5 font-sans text-sm text-fg-muted space-y-1.5 mb-4">
            <li><strong>Play Notes:</strong> Press the mapped keys (QWERTY, UIOP, number, and letter rows).</li>
            <li><strong>Sustain Pedal:</strong> Hold down the <code>Spacebar</code> to sustain notes, and release to damp them.</li>
            <li><strong>Transpose Mapped Region:</strong> Press the <code>Left Arrow (←)</code> and <code>Right Arrow (→)</code> keys to shift the mapped octave range down/up.</li>
            <li><strong>Zoom Visible Keyboard:</strong> Press the <code>Up Arrow (↑)</code> and <code>Down Arrow (↓)</code> keys to display more or fewer visible octaves.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.22em] text-accent-soft mb-3">
            Mapping Modes & Custom Mapping
          </h2>
          <p className="font-sans text-sm leading-relaxed text-fg-muted mb-4">
            Toggle between presets by opening the <strong>Settings</strong> panel:
          </p>
          <ul className="list-disc pl-5 font-sans text-sm text-fg-muted space-y-1.5 mb-4">
            <li><strong>Default Profile:</strong> Maps 3 octaves (C4-C6), using standard keys for flats/sharps.</li>
            <li><strong>Max Profile:</strong> Maps 5 octaves (C2-C7), requiring you to hold <code>Shift</code> to play black accidental keys.</li>
            <li><strong>Custom Editor:</strong> Let&apos;s you assign specific key codes to piano keys manually. Re-binds are saved to your browser cache.</li>
          </ul>
          <Link
            href="/keyboard-mapping"
            className="font-mono text-xs text-accent-soft hover:underline"
          >
            → View complete key mapping layouts
          </Link>
        </section>

        <section className="mb-8">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.22em] text-accent-soft mb-3">
            Sustain & Transposition
          </h2>
          <p className="font-sans text-sm leading-relaxed text-fg-muted mb-4">
            Sustain acts as the mechanical damper pedal. When sustain is engaged (via <code>Spacebar</code>, 
            the visual sustain button on-screen, or a MIDI sustain pedal CC64), notes will continue to ring out 
            after you release the piano keys. Releasing sustain dampens all active, un-held voices.
          </p>
          <p className="font-sans text-sm leading-relaxed text-fg-muted mb-4">
            <strong>Transpose:</strong> Shifts the internal tuning of the piano by semitone increments. 
            Adjust this in the Audio Settings drawer to match the key of a song without changing your finger patterns.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.22em] text-accent-soft mb-3">
            Metronome & Tempo Sync
          </h2>
          <p className="font-sans text-sm leading-relaxed text-fg-muted mb-4">
            The metronome offers a high-precision lookahead click track:
          </p>
          <ul className="list-disc pl-5 font-sans text-sm text-fg-muted space-y-1.5 mb-4">
            <li>Click the quarter-note <strong>♩ pill widget</strong> in the toolbar to expand metronome settings.</li>
            <li>Select time signatures (2/4, 3/4, 4/4, 6/8) and set your volume level.</li>
            <li>Use the stepper buttons, type a numeric value, or click <strong>&ldquo;tap&rdquo;</strong> to calculate tempo dynamically.</li>
            <li>Toggle <strong>&ldquo;record clicks&rdquo;</strong> if you want metronome clicks to be included in your audio recordings.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.22em] text-accent-soft mb-3">
            Recording Audio Clips
          </h2>
          <p className="font-sans text-sm leading-relaxed text-fg-muted mb-4">
            To record, click the circle <strong>Record button</strong> in the toolbar. Play your performance, 
            then click the button again to stop. Your browser will compile the stream and trigger a download 
            prompt for the recorded file (saved in high-quality <code>.webm</code> format). Record paths 
            tap directly from the synthesizer, ensuring clean audio without capturing environmental microphone noise.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.22em] text-accent-soft mb-3">
            MIDI Controllers, Mouse & Touch Inputs
          </h2>
          <p className="font-sans text-sm leading-relaxed text-fg-muted mb-4">
            Octype is built with versatile input routing:
          </p>
          <ul className="list-disc pl-5 font-sans text-sm text-fg-muted space-y-2 mb-4">
            <li><strong>MIDI Input:</strong> Connect hardware controllers for full velocity mapping and sustain pedal capture. Read our <Link href="/midi-piano" className="text-accent-soft hover:underline">MIDI guide</Link> for browser compatibility and configurations.</li>
            <li><strong>Mouse:</strong> Click individual on-screen keys. Clicking the bottom edge produces a loud velocity strike; clicking the top of the key generates a soft, quiet strike.</li>
            <li><strong>Touch & Glissando:</strong> Tap keys on touchscreen smartphones and tablets. Drag your finger across keys to play a slide (glissando). Touch interactions automatically disable browser gestures like scrolling and zooming, enabling comfortable play.</li>
          </ul>
        </section>

        <section className="mb-8 border-t border-bg-subtle pt-6 flex flex-wrap gap-4">
          <Link
            href="/"
            className="rounded-md border border-accent/50 bg-accent/10 px-5 py-2 font-mono text-sm text-accent-soft transition-colors hover:border-accent hover:bg-accent/20"
          >
            🎹 Launch Playable Piano
          </Link>
          <Link
            href="/keyboard-mapping"
            className="rounded-md border border-bg-subtle bg-bg-elevated px-5 py-2 font-mono text-sm text-fg-muted transition-colors hover:border-accent/40 hover:text-fg"
          >
            Key Mapping Layouts
          </Link>
        </section>
      </article>
    </InfoPageLayout>
  );
}
