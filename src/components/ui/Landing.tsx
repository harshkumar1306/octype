"use client";

/**
 * Landing — the intro / home screen.
 *
 * Explains what a virtual piano is, how Octype works, and lists its features
 * before the user enters the instrument. Styled to match the dark,
 * monospace, purple-accent theme.
 */

import { motion } from "framer-motion";

interface LandingProps {
  /** Called when the user chooses to enter the instrument. */
  onStart: () => void;
}

export function Landing({ onStart }: LandingProps): JSX.Element {
  return (
    <div className="mx-auto w-full max-w-4xl px-5 py-8 sm:py-12">
      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center"
      >
        <h1 className="font-mono text-4xl font-semibold tracking-tight text-fg sm:text-5xl">
          octype
        </h1>
        <p className="mx-auto mt-3 max-w-xl font-mono text-sm leading-relaxed text-fg-muted">
          A premium browser-based virtual piano — play a real grand piano with
          your keyboard, mouse, touchscreen, or MIDI controller.
        </p>

        <MiniKeyboard />

        <button
          type="button"
          onClick={onStart}
          className="mt-8 rounded-lg border border-accent/50 bg-accent/10 px-8 py-3 font-mono text-sm text-accent-soft transition-all hover:border-accent hover:bg-accent/20 hover:shadow-[0_0_24px_rgba(167,139,250,0.18)]"
        >
          ▶ start piano
        </button>
        <p className="mt-3 font-mono text-[11px] text-fg-subtle">
          loads instantly · works offline after first visit
        </p>
      </motion.section>

      {/* What is a virtual piano */}
      <Section title="what is a virtual piano?">
        <p>
          A virtual piano is a software instrument that recreates an acoustic
          piano inside your browser — no hardware required. Instead of hammers
          striking strings, it plays back high-quality{" "}
          <Em>recordings of a real grand piano</Em>, one for (almost) every note
          and every level of loudness. The result sounds like the real
          instrument, but lives entirely on screen.
        </p>
        <p>
          Octype uses the <Em>Salamander Grand Piano</Em> sample library: a
          concert grand recorded note by note, at sixteen different playing
          intensities, so soft passages and powerful chords each have their own
          authentic tone.
        </p>
      </Section>

      {/* How it works */}
      <Section title="how it works">
        <Steps
          steps={[
            {
              n: "01",
              t: "you play",
              d: "Press a computer key, click or tap a key on screen, or play a connected MIDI keyboard.",
            },
            {
              n: "02",
              t: "the engine responds",
              d: "A dedicated audio engine picks the matching recorded sample, sets its pitch and loudness, and plays it instantly — with sub-10ms perceived latency.",
            },
            {
              n: "03",
              t: "it sounds real",
              d: "Up to 24 notes ring at once, each fading naturally like a real piano. Sustain, reverb, and velocity bring it to life.",
            },
          ]}
        />
      </Section>

      {/* Features */}
      <Section title="features">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Feature
            title="real grand piano sound"
            desc="Salamander Grand samples — 30 recorded notes × 16 velocity layers."
          />
          <Feature
            title="instant & responsive"
            desc="Audio engine runs independently of the UI for tight, glitch-free timing."
          />
          <Feature
            title="three mapping modes"
            desc="Default (3 octaves), Max (5 octaves with Shift), or build your own custom layout."
          />
          <Feature
            title="sustain pedal"
            desc="Hold a key, tap the on-screen toggle, or use a MIDI pedal (CC64)."
          />
          <Feature
            title="velocity & dynamics"
            desc="Click higher or lower on a key for soft or loud; MIDI velocity fully supported."
          />
          <Feature
            title="midi input"
            desc="Plug in a MIDI keyboard — multi-device and hot-plug aware (Chrome/Edge)."
          />
          <Feature
            title="reverb & controls"
            desc="Concert-hall reverb, master volume, voice limit, transpose, and more."
          />
          <Feature
            title="record & visualize"
            desc="Capture your playing as audio, watch a live waveform, go fullscreen."
          />
          <Feature
            title="works offline"
            desc="After the first visit, samples are cached so it runs with no connection."
          />
          <Feature
            title="glissando & touch"
            desc="Drag across keys for a slide; full touch support on mobile."
          />
        </div>
      </Section>

      {/* Quick controls reference */}
      <Section title="quick controls">
        <div className="grid grid-cols-1 gap-x-8 gap-y-2 font-mono text-xs text-fg-muted sm:grid-cols-2">
          <ControlRow keys="A–L / Q–P rows" action="play notes" />
          <ControlRow keys="Space" action="sustain (hold)" />
          <ControlRow keys="← →" action="shift mapped octaves" />
          <ControlRow keys="↑ ↓" action="more / fewer visible octaves" />
          <ControlRow keys="click top/bottom of key" action="soft / loud" />
          <ControlRow keys="click + drag" action="glissando" />
        </div>
      </Section>

      <div className="mt-10 text-center">
        <button
          type="button"
          onClick={onStart}
          className="rounded-lg border border-accent/50 bg-accent/10 px-8 py-3 font-mono text-sm text-accent-soft transition-all hover:border-accent hover:bg-accent/20 hover:shadow-[0_0_24px_rgba(167,139,250,0.18)]"
        >
          ▶ start piano
        </button>
      </div>
    </div>
  );
}

/** A theme-styled mini piano graphic. */
function MiniKeyboard(): JSX.Element {
  // Pattern of white keys with black keys after specific indices (like a real octave).
  const whiteCount = 14; // two octaves
  const blackAfter = new Set([0, 1, 3, 4, 5, 7, 8, 10, 11, 12]); // C# D# F# G# A# pattern over 2 octaves
  return (
    <div className="mx-auto mt-8 flex h-24 max-w-md items-stretch justify-center gap-[3px] rounded-lg border border-bg-subtle bg-bg-elevated/60 p-3">
      {Array.from({ length: whiteCount }).map((_, i) => (
        <div key={i} className="relative flex-1">
          <div className="h-full w-full rounded-b-md bg-gradient-to-b from-key-white to-[#e7e5e4]" />
          {blackAfter.has(i) && (
            <div className="absolute -right-[6px] top-0 z-10 h-[62%] w-[42%] rounded-b-[3px] bg-gradient-to-b from-key-black to-[#0c0c0e]" />
          )}
        </div>
      ))}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}): JSX.Element {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.35 }}
      className="mt-12"
    >
      <h2 className="mb-4 font-mono text-[11px] uppercase tracking-[0.22em] text-accent-soft">
        {title}
      </h2>
      <div className="space-y-3 font-mono text-sm leading-relaxed text-fg-muted">
        {children}
      </div>
    </motion.section>
  );
}

function Em({ children }: { children: React.ReactNode }): JSX.Element {
  return <span className="text-fg">{children}</span>;
}

function Steps({
  steps,
}: {
  steps: { n: string; t: string; d: string }[];
}): JSX.Element {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {steps.map((s) => (
        <div
          key={s.n}
          className="rounded-lg border border-bg-subtle bg-bg-elevated/40 p-4"
        >
          <div className="font-mono text-xs text-accent-soft">{s.n}</div>
          <div className="mt-1 font-mono text-sm text-fg">{s.t}</div>
          <div className="mt-2 font-mono text-xs leading-relaxed text-fg-subtle">
            {s.d}
          </div>
        </div>
      ))}
    </div>
  );
}

function Feature({
  title,
  desc,
}: {
  title: string;
  desc: string;
}): JSX.Element {
  return (
    <div className="flex gap-3 rounded-lg border border-bg-subtle bg-bg-elevated/40 p-4">
      <span
        className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent/70"
        aria-hidden="true"
      />
      <div>
        <div className="font-mono text-sm text-fg">{title}</div>
        <div className="mt-1 font-mono text-xs leading-relaxed text-fg-subtle">
          {desc}
        </div>
      </div>
    </div>
  );
}

function ControlRow({
  keys,
  action,
}: {
  keys: string;
  action: string;
}): JSX.Element {
  return (
    <div className="flex items-center justify-between border-b border-bg-subtle/60 py-1.5">
      <span className="text-fg">{keys}</span>
      <span className="text-fg-subtle">{action}</span>
    </div>
  );
}
