import type { Metadata } from "next";
import Link from "next/link";
import { InfoPageLayout } from "@/components/ui/InfoPageLayout";

export const metadata: Metadata = {
  title: "Computer Keyboard Piano Layout & Key Mapping",
  description:
    "View complete documentation for the Default and Max key mapping presets in Octype. Learn about Shift-based black keys and custom layout definitions.",
  alternates: {
    canonical: "/keyboard-mapping",
  },
};

export default function KeyboardMappingPage(): JSX.Element {
  return (
    <InfoPageLayout>
      <article className="prose prose-invert max-w-none">
        <h1 className="font-mono text-3xl font-semibold tracking-tight text-fg mb-6">
          Computer Keyboard Piano Layout & Mappings
        </h1>

        <p className="font-sans text-sm leading-relaxed text-fg-muted mb-6">
          Octype maps your physical computer keys directly to piano note frequencies. Understanding the layouts 
          allows you to play complex chords and melodies cleanly. The application includes two built-in mappings: 
          <strong>Default (3 octaves)</strong> and <strong>Max (5 octaves)</strong>.
        </p>

        {/* ─── Default Mapping ─── */}
        <section className="mb-10">
          <h2 className="font-mono text-lg font-semibold tracking-tight text-fg mb-3">
            1. Default Mapping (3-Octave Range)
          </h2>
          <p className="font-sans text-sm leading-relaxed text-fg-muted mb-4">
            The Default mapping spans <strong>C4 to C6</strong>. This layout places white keys on your physical 
            letter rows and black keys on the row directly above them, similar to traditional virtual keyboards.
          </p>

          <h3 className="font-mono text-[11px] uppercase tracking-[0.22em] text-accent-soft mt-4 mb-2">
            Octave 1 (C4 to B4)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="border-b border-bg-subtle text-fg-subtle">
                  <th className="py-2">Note</th>
                  <th className="py-2">Computer Key</th>
                  <th className="py-2">Type</th>
                </tr>
              </thead>
              <tbody className="text-fg-muted">
                <tr className="border-b border-bg-subtle/50">
                  <td className="py-2 font-sans font-medium text-fg">C4</td>
                  <td className="py-2 font-bold text-accent-soft">Tab</td>
                  <td className="py-2">White Key</td>
                </tr>
                <tr className="border-b border-bg-subtle/50">
                  <td className="py-2 font-sans font-medium text-fg">C#4</td>
                  <td className="py-2 font-bold text-accent-soft">1</td>
                  <td className="py-2">Black Key</td>
                </tr>
                <tr className="border-b border-bg-subtle/50">
                  <td className="py-2 font-sans font-medium text-fg">D4</td>
                  <td className="py-2 font-bold text-accent-soft">Q</td>
                  <td className="py-2">White Key</td>
                </tr>
                <tr className="border-b border-bg-subtle/50">
                  <td className="py-2 font-sans font-medium text-fg">D#4</td>
                  <td className="py-2 font-bold text-accent-soft">2</td>
                  <td className="py-2">Black Key</td>
                </tr>
                <tr className="border-b border-bg-subtle/50">
                  <td className="py-2 font-sans font-medium text-fg">E4</td>
                  <td className="py-2 font-bold text-accent-soft">W</td>
                  <td className="py-2">White Key</td>
                </tr>
                <tr className="border-b border-bg-subtle/50">
                  <td className="py-2 font-sans font-medium text-fg">F4</td>
                  <td className="py-2 font-bold text-accent-soft">E</td>
                  <td className="py-2">White Key (Gap)</td>
                </tr>
                <tr className="border-b border-bg-subtle/50">
                  <td className="py-2 font-sans font-medium text-fg">F#4</td>
                  <td className="py-2 font-bold text-accent-soft">4</td>
                  <td className="py-2">Black Key</td>
                </tr>
                <tr className="border-b border-bg-subtle/50">
                  <td className="py-2 font-sans font-medium text-fg">G4</td>
                  <td className="py-2 font-bold text-accent-soft">R</td>
                  <td className="py-2">White Key</td>
                </tr>
                <tr className="border-b border-bg-subtle/50">
                  <td className="py-2 font-sans font-medium text-fg">G#4</td>
                  <td className="py-2 font-bold text-accent-soft">5</td>
                  <td className="py-2">Black Key</td>
                </tr>
                <tr className="border-b border-bg-subtle/50">
                  <td className="py-2 font-sans font-medium text-fg">A4</td>
                  <td className="py-2 font-bold text-accent-soft">T</td>
                  <td className="py-2">White Key</td>
                </tr>
                <tr className="border-b border-bg-subtle/50">
                  <td className="py-2 font-sans font-medium text-fg">A#4</td>
                  <td className="py-2 font-bold text-accent-soft">6</td>
                  <td className="py-2">Black Key</td>
                </tr>
                <tr className="border-b border-bg-subtle/50">
                  <td className="py-2 font-sans font-medium text-fg">B4</td>
                  <td className="py-2 font-bold text-accent-soft">Y</td>
                  <td className="py-2">White Key</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className="font-mono text-[11px] uppercase tracking-[0.22em] text-accent-soft mt-6 mb-2">
            Octave 2 (C5 to B5)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="border-b border-bg-subtle text-fg-subtle">
                  <th className="py-2">Note</th>
                  <th className="py-2">Computer Key</th>
                  <th className="py-2">Type</th>
                </tr>
              </thead>
              <tbody className="text-fg-muted">
                <tr className="border-b border-bg-subtle/50">
                  <td className="py-2 font-sans font-medium text-fg">C5</td>
                  <td className="py-2 font-bold text-accent-soft">U</td>
                  <td className="py-2">White Key</td>
                </tr>
                <tr className="border-b border-bg-subtle/50">
                  <td className="py-2 font-sans font-medium text-fg">C#5</td>
                  <td className="py-2 font-bold text-accent-soft">8</td>
                  <td className="py-2">Black Key</td>
                </tr>
                <tr className="border-b border-bg-subtle/50">
                  <td className="py-2 font-sans font-medium text-fg">D5</td>
                  <td className="py-2 font-bold text-accent-soft">I</td>
                  <td className="py-2">White Key</td>
                </tr>
                <tr className="border-b border-bg-subtle/50">
                  <td className="py-2 font-sans font-medium text-fg">D#5</td>
                  <td className="py-2 font-bold text-accent-soft">9</td>
                  <td className="py-2">Black Key</td>
                </tr>
                <tr className="border-b border-bg-subtle/50">
                  <td className="py-2 font-sans font-medium text-fg">E5</td>
                  <td className="py-2 font-bold text-accent-soft">O</td>
                  <td className="py-2">White Key</td>
                </tr>
                <tr className="border-b border-bg-subtle/50">
                  <td className="py-2 font-sans font-medium text-fg">F5</td>
                  <td className="py-2 font-bold text-accent-soft">P</td>
                  <td className="py-2">White Key (Gap)</td>
                </tr>
                <tr className="border-b border-bg-subtle/50">
                  <td className="py-2 font-sans font-medium text-fg">F#5</td>
                  <td className="py-2 font-bold text-accent-soft">-</td>
                  <td className="py-2">Black Key</td>
                </tr>
                <tr className="border-b border-bg-subtle/50">
                  <td className="py-2 font-sans font-medium text-fg">G5</td>
                  <td className="py-2 font-bold text-accent-soft">[</td>
                  <td className="py-2">White Key</td>
                </tr>
                <tr className="border-b border-bg-subtle/50">
                  <td className="py-2 font-sans font-medium text-fg">G#5</td>
                  <td className="py-2 font-bold text-accent-soft">=</td>
                  <td className="py-2">Black Key</td>
                </tr>
                <tr className="border-b border-bg-subtle/50">
                  <td className="py-2 font-sans font-medium text-fg">A5</td>
                  <td className="py-2 font-bold text-accent-soft">]</td>
                  <td className="py-2">White Key</td>
                </tr>
                <tr className="border-b border-bg-subtle/50">
                  <td className="py-2 font-sans font-medium text-fg">A#5</td>
                  <td className="py-2 font-bold text-accent-soft">Backspace</td>
                  <td className="py-2">Black Key</td>
                </tr>
                <tr className="border-b border-bg-subtle/50">
                  <td className="py-2 font-sans font-medium text-fg">B5</td>
                  <td className="py-2 font-bold text-accent-soft">\</td>
                  <td className="py-2">White Key</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className="font-mono text-[11px] uppercase tracking-[0.22em] text-accent-soft mt-6 mb-2">
            Octave 3 (C6 to B6)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="border-b border-bg-subtle text-fg-subtle">
                  <th className="py-2">Note</th>
                  <th className="py-2">Computer Key</th>
                  <th className="py-2">Type</th>
                </tr>
              </thead>
              <tbody className="text-fg-muted">
                <tr className="border-b border-bg-subtle/50">
                  <td className="py-2 font-sans font-medium text-fg">C6</td>
                  <td className="py-2 font-bold text-accent-soft">Z</td>
                  <td className="py-2">White Key</td>
                </tr>
                <tr className="border-b border-bg-subtle/50">
                  <td className="py-2 font-sans font-medium text-fg">C#6</td>
                  <td className="py-2 font-bold text-accent-soft">S</td>
                  <td className="py-2">Black Key</td>
                </tr>
                <tr className="border-b border-bg-subtle/50">
                  <td className="py-2 font-sans font-medium text-fg">D6</td>
                  <td className="py-2 font-bold text-accent-soft">X</td>
                  <td className="py-2">White Key</td>
                </tr>
                <tr className="border-b border-bg-subtle/50">
                  <td className="py-2 font-sans font-medium text-fg">D#6</td>
                  <td className="py-2 font-bold text-accent-soft">D</td>
                  <td className="py-2">Black Key</td>
                </tr>
                <tr className="border-b border-bg-subtle/50">
                  <td className="py-2 font-sans font-medium text-fg">E6</td>
                  <td className="py-2 font-bold text-accent-soft">C</td>
                  <td className="py-2">White Key</td>
                </tr>
                <tr className="border-b border-bg-subtle/50">
                  <td className="py-2 font-sans font-medium text-fg">F6</td>
                  <td className="py-2 font-bold text-accent-soft">V</td>
                  <td className="py-2">White Key (Gap)</td>
                </tr>
                <tr className="border-b border-bg-subtle/50">
                  <td className="py-2 font-sans font-medium text-fg">F#6</td>
                  <td className="py-2 font-bold text-accent-soft">G</td>
                  <td className="py-2">Black Key</td>
                </tr>
                <tr className="border-b border-bg-subtle/50">
                  <td className="py-2 font-sans font-medium text-fg">G6</td>
                  <td className="py-2 font-bold text-accent-soft">B</td>
                  <td className="py-2">White Key</td>
                </tr>
                <tr className="border-b border-bg-subtle/50">
                  <td className="py-2 font-sans font-medium text-fg">G#6</td>
                  <td className="py-2 font-bold text-accent-soft">H</td>
                  <td className="py-2">Black Key</td>
                </tr>
                <tr className="border-b border-bg-subtle/50">
                  <td className="py-2 font-sans font-medium text-fg">A6</td>
                  <td className="py-2 font-bold text-accent-soft">N</td>
                  <td className="py-2">White Key</td>
                </tr>
                <tr className="border-b border-bg-subtle/50">
                  <td className="py-2 font-sans font-medium text-fg">A#6</td>
                  <td className="py-2 font-bold text-accent-soft">J</td>
                  <td className="py-2">Black Key</td>
                </tr>
                <tr className="border-b border-bg-subtle/50">
                  <td className="py-2 font-sans font-medium text-fg">B6</td>
                  <td className="py-2 font-bold text-accent-soft">M</td>
                  <td className="py-2">White Key</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ─── Max Mapping ─── */}
        <section className="mb-10">
          <h2 className="font-mono text-lg font-semibold tracking-tight text-fg mb-3">
            2. Max Mapping (5-Octave Range)
          </h2>
          <p className="font-sans text-sm leading-relaxed text-fg-muted mb-4">
            The Max mapping covers <strong>C2 to C6 plus an extra C7 note</strong> (36 white keys total). 
            To fit 5 octaves onto a standard typing keyboard, this mode uses a <strong>continuous sequence 
            for white keys</strong> and requires holding down the <code>Shift</code> key to play black keys.
          </p>

          <h3 className="font-mono text-[11px] uppercase tracking-[0.22em] text-accent-soft mt-4 mb-2">
            White Key Layout Sequence (Bass to Treble)
          </h3>
          <div className="font-mono text-xs text-fg-muted bg-bg-elevated/40 p-4 rounded-lg border border-bg-subtle leading-relaxed">
            <span className="text-accent-soft font-semibold">C2 Octave:</span> 1, 2, 3, 4, 5, 6, 7 <br />
            <span className="text-accent-soft font-semibold">C3 Octave:</span> 8, 9, 0, Q, W, E, R <br />
            <span className="text-accent-soft font-semibold">C4 Octave:</span> T, Y, U, I, O, P, A <br />
            <span className="text-accent-soft font-semibold">C5 Octave:</span> S, D, F, G, H, J, K <br />
            <span className="text-accent-soft font-semibold">C6 Octave:</span> L, Z, X, C, V, B, N <br />
            <span className="text-accent-soft font-semibold">C7 Note:</span> M
          </div>

          <h3 className="font-mono text-[11px] uppercase tracking-[0.22em] text-accent-soft mt-6 mb-2">
            Shift-Based Black Key Accidentals
          </h3>
          <p className="font-sans text-sm leading-relaxed text-fg-muted mb-4">
            Holding <code>Shift</code> while pressing any white key trigger transforms it into its respective black key 
            accidental offset (if one exists for that pitch class).
          </p>
          <div className="font-mono text-xs text-fg-muted bg-bg-elevated/40 p-4 rounded-lg border border-bg-subtle leading-relaxed">
            <span className="text-accent-soft font-semibold">C2 Blacks:</span> Shift+1 (C#2), Shift+2 (D#2), Shift+4 (F#2), Shift+5 (G#2), Shift+6 (A#2) <br />
            <span className="text-accent-soft font-semibold">C3 Blacks:</span> Shift+8 (C#3), Shift+9 (D#3), Shift+Q (F#3), Shift+W (G#3), Shift+E (A#3) <br />
            <span className="text-accent-soft font-semibold">C4 Blacks:</span> Shift+T (C#4), Shift+Y (D#4), Shift+I (F#4), Shift+O (G#4), Shift+P (A#4) <br />
            <span className="text-accent-soft font-semibold">C5 Blacks:</span> Shift+S (C#5), Shift+D (D#5), Shift+G (F#5), Shift+H (G#5), Shift+J (A#5) <br />
            <span className="text-accent-soft font-semibold">C6 Blacks:</span> Shift+L (C#6), Shift+Z (D#6), Shift+C (F#6), Shift+V (G#6), Shift+B (A#6)
          </div>
        </section>

        {/* ─── Ranges, Rollover, Custom ─── */}
        <section className="mb-10 border-t border-bg-subtle pt-6">
          <h2 className="font-mono text-lg font-semibold tracking-tight text-fg mb-3">
            Mapped Range vs. Visible Range
          </h2>
          <p className="font-sans text-sm leading-relaxed text-fg-muted mb-4">
            It is important to distinguish the <strong>Mapped Range</strong> (the actual frequencies bound to your 
            physical keyboard keys) from the <strong>Visible Range</strong> (the visual keys displayed on your monitor).
          </p>
          <ul className="list-disc pl-5 font-sans text-sm text-fg-muted space-y-2 mb-4">
            <li>
              <strong>Mapped Range:</strong> Statically bound to your keyboard rows. It anchors around a specific base pitch 
              (e.g., C4 for Default mapping; C2 for Max mapping). Shifting the mapped range up/down shifts the pitch of your physical keys.
            </li>
            <li>
              <strong>Visible Range:</strong> The visual keyboard displayed on screen. You can change how many octaves are drawn, 
              or slide the scroll window left/right using on-screen sliders or arrow keys, without changing the notes played by typing.
            </li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="font-mono text-lg font-semibold tracking-tight text-fg mb-3">
            Custom Layout Editor
          </h2>
          <p className="font-sans text-sm leading-relaxed text-fg-muted mb-4">
            If neither preset suits your style, you can map individual notes manually. Open the <strong>Settings</strong> 
            drawer, select <strong>Custom Mapping</strong>, pick your octave range, and build a custom layout by clicking keys and 
            pressing the physical buttons to bind them. Custom configurations are stored in your browser&apos;s 
            <code>localStorage</code> so they remain loaded on subsequent visits.
          </p>
        </section>

        <section className="mb-8 border-t border-bg-subtle pt-6 flex flex-wrap gap-4">
          <Link
            href="/"
            className="rounded-md border border-accent/50 bg-accent/10 px-5 py-2 font-mono text-sm text-accent-soft transition-colors hover:border-accent hover:bg-accent/20"
          >
            🎹 Launch Playable Piano
          </Link>
          <Link
            href="/computer-keyboard-piano"
            className="rounded-md border border-bg-subtle bg-bg-elevated px-5 py-2 font-mono text-sm text-fg-muted transition-colors hover:border-accent/40 hover:text-fg"
          >
            Computer Keyboard Input Guide
          </Link>
        </section>
      </article>
    </InfoPageLayout>
  );
}
