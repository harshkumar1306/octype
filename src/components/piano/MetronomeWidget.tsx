"use client";

/**
 * MetronomeWidget — compact inline metronome control.
 *
 * Collapsed (default): shows ♩ {bpm} + subtle beat dots. Accent color when
 * running. Click to expand the controls panel.
 *
 * Expanded: floating panel (dropdown below the toolbar button) containing
 * BPM stepper, tap-tempo, time signature selector, and volume slider.
 *
 * Audio lifecycle:
 *   - Calls metronomeEngine.init(ctx) once the AudioEngine is ready.
 *   - Calls metronomeEngine.start() / stop() when enabled changes.
 *   - Calls metronomeEngine.setRecordingAnalyser() when recordMetronome changes.
 *
 * React never drives audio timing — only calls engine imperatively from
 * event handlers and effects. Beat visuals come from useMetronomeBeat()
 * (useSyncExternalStore), re-rendering at most once per beat.
 */

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

import { audioEngine } from "@/audio/engine/AudioEngine";
import { getAudioContext } from "@/audio/engine/AudioContext";
import { metronomeEngine } from "@/audio/metronome/MetronomeEngine";
import { useAudioEngineStatus } from "@/hooks/useAudioEngine";
import { useMetronomeBeat } from "@/hooks/useMetronome";
import { useMetronomeStore } from "@/stores/metronomeStore";
import type { TimeSignature } from "@/stores/metronomeStore";

const TIME_SIGS: TimeSignature[] = ["2/4", "3/4", "4/4", "6/8"];

export function MetronomeWidget(): JSX.Element {
  const status = useAudioEngineStatus();
  const isEngineReady = status === "ready" || status === "loading-samples";

  // Store state — only subscribe to fields we need in the UI.
  const enabled = useMetronomeStore((s) => s.enabled);
  const bpm = useMetronomeStore((s) => s.bpm);
  const timeSignature = useMetronomeStore((s) => s.timeSignature);
  const volume = useMetronomeStore((s) => s.volume);
  const recordMetronome = useMetronomeStore((s) => s.recordMetronome);
  const setEnabled = useMetronomeStore((s) => s.setEnabled);
  const setBpm = useMetronomeStore((s) => s.setBpm);
  const setTimeSignature = useMetronomeStore((s) => s.setTimeSignature);
  const setVolume = useMetronomeStore((s) => s.setVolume);
  const setRecordMetronome = useMetronomeStore((s) => s.setRecordMetronome);

  // Beat visual state — re-renders only when beat/beats/playing changes.
  const { beat, beats, playing } = useMetronomeBeat();

  const [expanded, setExpanded] = useState(false);
  // BPM text field: null = showing live value, string = user is editing.
  const [bpmInput, setBpmInput] = useState<string | null>(null);

  const panelRef = useRef<HTMLDivElement>(null);
  const tapTimesRef = useRef<number[]>([]);

  // ── Engine lifecycle effects ──────────────────────────────────────────────

  // Initialize MetronomeEngine once the AudioEngine has the context ready.
  useEffect(() => {
    if (!isEngineReady) return;
    try {
      const ctx = getAudioContext().ctx;
      metronomeEngine.init(ctx);
    } catch {
      // AudioContext not yet available — will retry when status changes.
    }
  }, [isEngineReady]);

  // Start / stop in response to enabled flag.
  useEffect(() => {
    if (!isEngineReady) return;
    if (enabled) {
      metronomeEngine.start();
    } else {
      metronomeEngine.stop();
    }
  }, [enabled, isEngineReady]);

  // Connect / disconnect the recording analyser tap.
  useEffect(() => {
    if (!isEngineReady) return;
    const analyser = recordMetronome ? audioEngine.getAnalyser() : null;
    metronomeEngine.setRecordingAnalyser(analyser);
  }, [recordMetronome, isEngineReady]);

  // Stop engine when component unmounts (view switch, etc.).
  useEffect(() => {
    return () => {
      metronomeEngine.stop();
    };
  }, []);

  // ── Close panel on outside click ─────────────────────────────────────────

  useEffect(() => {
    if (!expanded) return;
    const handler = (e: MouseEvent): void => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setExpanded(false);
      }
    };
    // Delay to avoid catching the same click that opened the panel.
    const t = setTimeout(() => {
      document.addEventListener("mousedown", handler);
    }, 0);
    return () => {
      clearTimeout(t);
      document.removeEventListener("mousedown", handler);
    };
  }, [expanded]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleTap = useCallback((): void => {
    const now = performance.now();
    const times = tapTimesRef.current;

    // Reset if more than 2 seconds have passed since the last tap.
    if (times.length > 0 && now - (times[times.length - 1] ?? 0) > 2000) {
      tapTimesRef.current = [];
    }

    // Keep a rolling window of the last 8 taps.
    tapTimesRef.current = [...times.slice(-7), now];

    if (tapTimesRef.current.length >= 2) {
      const intervals: number[] = [];
      for (let i = 1; i < tapTimesRef.current.length; i++) {
        const prev = tapTimesRef.current[i - 1];
        const curr = tapTimesRef.current[i];
        if (prev !== undefined && curr !== undefined) {
          intervals.push(curr - prev);
        }
      }
      const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const newBpm = Math.round(60000 / avg);
      setBpm(Math.max(30, Math.min(300, newBpm)));
    }
  }, [setBpm]);

  const commitBpmInput = useCallback((): void => {
    if (bpmInput === null) return;
    const parsed = parseInt(bpmInput, 10);
    if (!isNaN(parsed)) {
      setBpm(parsed);
    }
    setBpmInput(null);
  }, [bpmInput, setBpm]);

  const handleBpmKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>): void => {
      if (e.key === "Enter") {
        (e.target as HTMLInputElement).blur();
      } else if (e.key === "Escape") {
        setBpmInput(null);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setBpm(bpm + 1);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setBpm(bpm - 1);
      }
    },
    [bpm, setBpm],
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div ref={panelRef} className="relative">
      {/* ── Collapsed trigger ── */}
      <button
        id="metronome-trigger"
        type="button"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
        aria-haspopup="dialog"
        title="Metronome"
        className={[
          "flex items-center gap-1.5 rounded-md border px-2.5 py-1 font-mono text-xs transition-colors",
          playing
            ? "border-accent/40 bg-accent/10 text-accent-soft"
            : "border-bg-subtle bg-bg-elevated text-fg-muted hover:border-accent/30 hover:text-fg",
        ].join(" ")}
      >
        {/* Quarter-note symbol — also serves as visual "on" indicator. */}
        <span className="text-[13px] leading-none">♩</span>
        <span>{bpm}</span>
        <BeatDots beat={beat} beats={beats} playing={playing} />
      </button>

      {/* ── Expanded controls panel ── */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            key="metro-panel"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
            className="absolute right-0 top-full z-20 mt-1.5 w-[228px] rounded-lg border border-bg-subtle bg-bg-elevated p-3 shadow-xl"
            role="dialog"
            aria-label="Metronome controls"
          >
            {/* Header: section label + on/off toggle */}
            <div className="mb-3 flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-fg-subtle">
                metronome
              </span>
              <ToggleSwitch
                active={enabled}
                onToggle={() => setEnabled(!enabled)}
                disabled={!isEngineReady}
                aria-label="Toggle metronome"
              />
            </div>

            {/* BPM row: decrement · editable number · increment · tap */}
            <div className="mb-2.5 flex items-center gap-1.5">
              <StepButton
                label="−"
                aria-label="Decrease BPM"
                onClick={() => setBpm(bpm - 1)}
                disabled={bpm <= 30}
              />

              <input
                id="metronome-bpm"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={bpmInput ?? bpm}
                onChange={(e) => setBpmInput(e.target.value)}
                onFocus={() => setBpmInput(String(bpm))}
                onBlur={commitBpmInput}
                onKeyDown={handleBpmKeyDown}
                className="w-12 rounded border border-bg-subtle bg-bg-DEFAULT py-1 text-center font-mono text-sm text-fg focus:border-accent/60 focus:outline-none"
                aria-label="BPM value"
              />

              <StepButton
                label="+"
                aria-label="Increase BPM"
                onClick={() => setBpm(bpm + 1)}
                disabled={bpm >= 300}
              />

              <button
                id="metronome-tap"
                type="button"
                onClick={handleTap}
                className="ml-auto rounded border border-bg-subtle bg-bg-DEFAULT px-2.5 py-1 font-mono text-xs text-fg-muted transition-colors hover:border-accent/40 hover:text-fg active:bg-accent/10"
                aria-label="Tap tempo"
              >
                tap
              </button>
            </div>

            {/* Time signature selector */}
            <div className="mb-2.5 flex gap-1.5">
              {TIME_SIGS.map((sig) => (
                <button
                  key={sig}
                  id={`metro-sig-${sig.replace("/", "-")}`}
                  type="button"
                  onClick={() => setTimeSignature(sig)}
                  aria-pressed={timeSignature === sig}
                  className={[
                    "flex-1 rounded border py-1 font-mono text-xs transition-colors",
                    timeSignature === sig
                      ? "border-accent/60 bg-accent/15 text-accent-soft"
                      : "border-bg-subtle bg-bg-DEFAULT text-fg-muted hover:border-accent/40 hover:text-fg",
                  ].join(" ")}
                >
                  {sig}
                </button>
              ))}
            </div>

            {/* Volume */}
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-fg-subtle">vol</span>
              <input
                id="metronome-volume"
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="h-1 flex-1 appearance-none rounded-full bg-bg-DEFAULT accent-accent"
                aria-label="Metronome volume"
              />
              <span className="w-8 text-right font-mono text-[10px] text-fg-muted">
                {Math.round(volume * 100)}%
              </span>
            </div>

            {/* Record metronome (convenience toggle — also in Settings) */}
            <div className="mt-2.5 border-t border-bg-subtle pt-2.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-fg-subtle">
                  record clicks
                </span>
                <ToggleSwitch
                  active={recordMetronome}
                  onToggle={() => setRecordMetronome(!recordMetronome)}
                  aria-label="Include metronome in recording"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

/** Row of dots indicating beat position within the current measure. */
function BeatDots({
  beat,
  beats,
  playing,
}: {
  beat: number;
  beats: number;
  playing: boolean;
}): JSX.Element {
  return (
    <span
      className="flex items-center gap-[3px]"
      aria-hidden="true"
    >
      {Array.from({ length: Math.min(beats, 6) }, (_, i) => (
        <span
          key={i}
          className={[
            "rounded-full transition-colors duration-75",
            // Beat 0 (accent) is slightly larger.
            i === 0 ? "h-[7px] w-[7px]" : "h-[5px] w-[5px]",
            // Active color when this beat is current and metronome is playing.
            playing && beat === i
              ? i === 0
                ? "bg-accent-soft"
                : "bg-accent/60"
              : "bg-fg-subtle/35",
          ].join(" ")}
        />
      ))}
    </span>
  );
}

/** Toggle switch that matches the existing switch style in SettingsPanel. */
function ToggleSwitch({
  active,
  onToggle,
  disabled,
  "aria-label": ariaLabel,
}: {
  active: boolean;
  onToggle: () => void;
  disabled?: boolean;
  "aria-label"?: string;
}): JSX.Element {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      aria-label={ariaLabel}
      onClick={onToggle}
      disabled={disabled}
      className={[
        "relative h-6 w-11 overflow-hidden rounded-full border transition-colors disabled:opacity-40",
        active
          ? "border-accent/40 bg-accent/30"
          : "border-bg-subtle bg-bg-DEFAULT",
      ].join(" ")}
    >
      <span
        className={[
          "absolute top-[3px] h-4 w-4 rounded-full transition-all",
          active ? "left-[22px] bg-accent-soft" : "left-[3px] bg-fg-muted",
        ].join(" ")}
      />
    </button>
  );
}

/** Small ± stepper button matching AudioSettings style. */
function StepButton({
  label,
  onClick,
  disabled,
  "aria-label": ariaLabel,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  "aria-label"?: string;
}): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className="rounded border border-bg-subtle bg-bg-DEFAULT px-2 py-1 font-mono text-xs text-fg-muted transition-colors hover:border-accent/40 hover:text-fg disabled:opacity-40"
    >
      {label}
    </button>
  );
}
