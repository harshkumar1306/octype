import type { Metadata } from "next";
import Link from "next/link";
import { InfoPageLayout } from "@/components/ui/InfoPageLayout";

export const metadata: Metadata = {
  title: "About Octype — Virtual Piano Architecture & Philosophy",
  description:
    "Learn about Octype's decoupled web audio architecture, zero-latency rendering design, and browser Grand Piano synthesis philosophy.",
  alternates: {
    canonical: "/about",
  },
};

export default function AboutPage(): JSX.Element {
  return (
    <InfoPageLayout>
      <article className="prose prose-invert max-w-none">
        <h1 className="font-mono text-3xl font-semibold tracking-tight text-fg mb-6">
          About Octype
        </h1>

        <section className="mb-8">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.22em] text-accent-soft mb-3">
            Product Philosophy
          </h2>
          <p className="font-sans text-sm leading-relaxed text-fg-muted mb-4">
            Octype was created to address a common problem in browser-based virtual pianos: latency. 
            Many online pianos are built as standard React or JavaScript applications where audio events are bound 
            to rendering cycles. This creates audible gaps, clicks, and timing jitters, rendering the instrument 
            frustrating for musical play.
          </p>
          <p className="font-sans text-sm leading-relaxed text-fg-muted mb-4">
            Octype&apos;s core philosophy is simple: <strong>performance comes first</strong>. By structuring the 
            application as a dedicated audio engine that merely communicates status to a React visual shell, 
            we achieve highly precise timing that feels responsive and alive, just like a real instrument.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.22em] text-accent-soft mb-3">
            Decoupled Web Audio Architecture
          </h2>
          <p className="font-sans text-sm leading-relaxed text-fg-muted mb-4">
            The fundamental design pattern in Octype is the separation of audio synthesis from React. 
            All keyboard inputs, touch movements, and incoming MIDI streams route through a central 
            singletone dispatcher (<code>InputRouter</code>) directly into a standalone <code>AudioEngine</code>. 
            This bypasses React&apos;s diffing algorithms, rendering loops, and Zustand store updates.
          </p>
          <p className="font-sans text-sm leading-relaxed text-fg-muted mb-4">
            This architectural separation ensures that even if the UI experiences performance stutters (such as 
            complex visual transitions or background tasks), the audio playback thread runs uninterrupted.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.22em] text-accent-soft mb-3">
            Salamander Grand Sound Synthesis
          </h2>
          <p className="font-sans text-sm leading-relaxed text-fg-muted mb-4">
            Rather than relying on flat synthetic oscillators, Octype uses Alexander Holm&apos;s 
            <strong>Salamander Grand Piano</strong>, a high-quality open-source sampled Yamaha C5 grand piano. 
            The sample library records physical notes at 16 velocity layers.
          </p>
          <p className="font-sans text-sm leading-relaxed text-fg-muted mb-4">
            Octype loads these samples progressively:
          </p>
          <ol className="list-decimal pl-5 font-sans text-sm text-fg-muted space-y-1.5 mb-4">
            <li><strong>Core Stage:</strong> Loads the middle octaves at medium velocity (layer 8) so the piano can start playing instantly.</li>
            <li><strong>Background Stage:</strong> Streams and decodes the remaining octaves and velocity layers silently in the background.</li>
            <li><strong>On-Demand Upgrade:</strong> If you strike a note that has not loaded yet, the engine queries it, plays a nearby fallback layer, and upgrades that note cache for subsequent strikes.</li>
          </ol>
        </section>

        <section className="mb-8 border-t border-bg-subtle pt-6 flex flex-wrap gap-4">
          <Link
            href="/"
            className="rounded-md border border-accent/50 bg-accent/10 px-5 py-2 font-mono text-sm text-accent-soft transition-colors hover:border-accent hover:bg-accent/20"
          >
            🎹 Launch Playable Piano
          </Link>
          <Link
            href="/credits"
            className="rounded-md border border-bg-subtle bg-bg-elevated px-5 py-2 font-mono text-sm text-fg-muted transition-colors hover:border-accent/40 hover:text-fg"
          >
            Credits & Licensing
          </Link>
        </section>
      </article>
    </InfoPageLayout>
  );
}
