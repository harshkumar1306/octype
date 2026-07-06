import type { Metadata } from "next";
import Link from "next/link";
import { InfoPageLayout } from "@/components/ui/InfoPageLayout";

export const metadata: Metadata = {
  title: "Online MIDI Piano — Play Your MIDI Keyboard in Browser",
  description:
    "Connect your MIDI keyboard controller directly to your browser. Read about browser MIDI permission, velocity levels, sustain pedal support (CC64), and troubleshooting.",
  alternates: {
    canonical: "/midi-piano",
  },
};

export default function MidiPianoPage(): JSX.Element {
  return (
    <InfoPageLayout>
      <article className="prose prose-invert max-w-none">
        <h1 className="font-mono text-3xl font-semibold tracking-tight text-fg mb-6">
          Play Piano Online With a MIDI Keyboard
        </h1>

        <p className="font-sans text-sm leading-relaxed text-fg-muted mb-6">
          For the ultimate virtual piano experience, Octype supports plug-and-play connection for external MIDI 
          keyboards and controller devices. When you connect a physical MIDI controller, Octype leverages the 
          <strong>Web MIDI API</strong> to receive and parse live MIDI streams, translating mechanical strokes 
          into responsive, authentic acoustic grand piano sounds.
        </p>

        <section className="mb-8">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.22em] text-accent-soft mb-3">
            Connecting a MIDI Controller
          </h2>
          <p className="font-sans text-sm leading-relaxed text-fg-muted mb-4">
            Octype makes connecting your hardware simple:
          </p>
          <ol className="list-decimal pl-5 font-sans text-sm text-fg-muted space-y-2 mb-4">
            <li>Connect your MIDI keyboard, synthesizer, or digital piano to your computer via USB (or MIDI-to-USB interface).</li>
            <li>Turn on your MIDI device.</li>
            <li>Open Octype in a compatible web browser.</li>
            <li>Click <strong>▶ start piano</strong>. When the browser requests MIDI access, grant the permission.</li>
          </ol>
        </section>

        <section className="mb-8">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.22em] text-accent-soft mb-3">
            Web MIDI Permissions
          </h2>
          <p className="font-sans text-sm leading-relaxed text-fg-muted mb-4">
            To query connected hardware, web browsers enforce security permissions. When you first enter the piano view, 
            the browser will display a prompt asking to <strong>&ldquo;Use MIDI devices&rdquo;</strong>. Select 
            <strong>Allow</strong>. If you accidentally deny access, you can click the lock/settings icon in the browser 
            address bar to reset permissions.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.22em] text-accent-soft mb-3">
            Velocity Sensitivity
          </h2>
          <p className="font-sans text-sm leading-relaxed text-fg-muted mb-4">
            Unlike standard computer keys, MIDI controllers capture the force of your physical play (known as 
            <strong>velocity</strong>). Octype fully parses these velocity bytes (0 to 127) and dynamically maps 
            them to one of its 16 high-resolution audio layers. Soft strokes play quiet, warm sample layers, 
            while hard hits trigger aggressive, bright fortissimo layers — reproducing the natural dynamic range 
            of a concert acoustic grand.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.22em] text-accent-soft mb-3">
            Sustain Pedal (CC64) Support
          </h2>
          <p className="font-sans text-sm leading-relaxed text-fg-muted mb-4">
            Octype&apos;s central input router processes standard Control Change (CC) messages. A physical sustain 
            pedal plugged into your MIDI controller typically transmits CC64 messages. Octype automatically maps 
            CC64 values (≥ 64 as engaged, &lt; 64 as released) to drive its internal sustain system. 
            This allows you to play naturally, blending chords and notes exactly like a physical piano.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.22em] text-accent-soft mb-3">
            Browser Compatibility & Hot-Plug Support
          </h2>
          <p className="font-sans text-sm leading-relaxed text-fg-muted mb-4">
            The Web MIDI standard is currently fully supported in Chromium-based browsers:
          </p>
          <ul className="list-disc pl-5 font-sans text-sm text-fg-muted space-y-2 mb-4">
            <li><strong>Supported:</strong> Google Chrome, Microsoft Edge, Opera, Vivaldi, Brave (desktop versions).</li>
            <li><strong>Not Supported:</strong> Apple Safari and Mozilla Firefox do not natively support Web MIDI. In these browsers, Octype degrades gracefully, allowing full playback via computer keyboard, mouse, and touch inputs.</li>
          </ul>
          <p className="font-sans text-sm leading-relaxed text-fg-muted mb-4">
            Octype supports <strong>MIDI hot-plugging</strong>. You can connect or disconnect devices while 
            the piano is open, and the manager will update and list available devices instantly without requiring 
            a page refresh. Select active devices by opening the Settings panel.
          </p>
        </section>

        <section className="mb-8 border-t border-bg-subtle pt-6">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.22em] text-accent-soft mb-3">
            Troubleshooting MIDI Connections
          </h2>
          <p className="font-sans text-sm leading-relaxed text-fg-muted mb-4">
            If your controller isn&apos;t producing sound, verify:
          </p>
          <ul className="list-disc pl-5 font-sans text-sm text-fg-muted space-y-2 mb-6">
            <li><strong>Browser permissions:</strong> Check the lock icon in the URL bar to ensure MIDI is allowed.</li>
            <li><strong>MIDI status in Settings:</strong> Open the Octype Settings drawer and verify that &ldquo;Enable MIDI&rdquo; is checked and your device is listed under MIDI inputs.</li>
            <li><strong>Device selection:</strong> Try disconnecting and reconnecting the USB cable.</li>
            <li><strong>Chrome/Edge:</strong> Make sure you are using a compatible browser (Safari and Firefox will not work for MIDI).</li>
          </ul>
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
