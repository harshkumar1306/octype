"use client";

/**
 * AudioSettings — controls for the audio engine.
 */

import { useSettingsStore } from "@/stores/settingsStore";

export function AudioSettings(): JSX.Element {
  const masterVolume = useSettingsStore((s) => s.masterVolume);
  const setMasterVolume = useSettingsStore((s) => s.setMasterVolume);
  const velocitySensitivity = useSettingsStore((s) => s.velocitySensitivity);
  const setVelocitySensitivity = useSettingsStore(
    (s) => s.setVelocitySensitivity,
  );
  const typingVelocity = useSettingsStore((s) => s.defaultVelocity);
  const setTypingVelocity = useSettingsStore((s) => s.setTypingVelocity);
  const reverbEnabled = useSettingsStore((s) => s.reverb.enabled);
  const reverbAmount = useSettingsStore((s) => s.reverb.amount);
  const setReverbEnabled = useSettingsStore((s) => s.setReverbEnabled);
  const setReverbAmount = useSettingsStore((s) => s.setReverbAmount);
  const voiceLimit = useSettingsStore((s) => s.voiceLimit);
  const setVoiceLimit = useSettingsStore((s) => s.setVoiceLimit);

  return (
    <div className="space-y-3">
      <Slider
        label="master volume"
        hint="overall output loudness"
        value={masterVolume}
        onChange={setMasterVolume}
        max={1}
        unitLabel={(v) => `${Math.round(v * 100)}%`}
      />
      <Slider
        label="velocity sensitivity"
        hint="how much velocity affects loudness (mouse Y / MIDI)"
        value={velocitySensitivity}
        onChange={setVelocitySensitivity}
      />
      <Slider
        label="typing velocity"
        hint="fixed loudness for keyboard presses (1 = soft, 127 = loud)"
        value={typingVelocity}
        onChange={setTypingVelocity}
        max={127}
        unitLabel={(v) => `${Math.round(v)}`}
      />
      <ToggleRow
        label="reverb"
        hint="adds room ambience to the sound"
        active={reverbEnabled}
        onClick={() => setReverbEnabled(!reverbEnabled)}
      />
      <Slider
        label="reverb amount"
        value={reverbAmount}
        onChange={setReverbAmount}
        disabled={!reverbEnabled}
      />
      <NumberStepper
        label="voice limit"
        hint="max simultaneous notes — lower saves CPU, higher sounds richer"
        value={voiceLimit}
        min={8}
        max={64}
        step={8}
        onChange={setVoiceLimit}
      />
    </div>
  );
}

interface SliderProps {
  label: string;
  hint?: string;
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
  max?: number;
  unitLabel?: (v: number) => string;
}

function Slider({
  label,
  hint,
  value,
  onChange,
  disabled,
  max = 1,
  unitLabel,
}: SliderProps): JSX.Element {
  const display = unitLabel
    ? unitLabel(value)
    : `${Math.round((value / max) * 100)}%`;
  return (
    <div className={disabled ? "opacity-40" : ""}>
      <div className="flex items-center justify-between gap-4">
        <LabelWithHint label={label} hint={hint} />
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={max}
            step={max > 1 ? 1 : 0.01}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            disabled={disabled}
            className="h-1 w-32 appearance-none rounded-full bg-bg-DEFAULT accent-accent"
          />
          <span className="w-12 text-right font-mono text-xs text-fg">
            {display}
          </span>
        </div>
      </div>
    </div>
  );
}

interface ToggleRowProps {
  label: string;
  hint?: string;
  active: boolean;
  onClick: () => void;
}

function ToggleRow({ label, hint, active, onClick }: ToggleRowProps): JSX.Element {
  return (
    <div className="flex items-center justify-between gap-4">
      <LabelWithHint label={label} hint={hint} />
      <button
        type="button"
        onClick={onClick}
        role="switch"
        aria-checked={active}
        className={[
          "relative h-6 w-11 shrink-0 overflow-hidden rounded-full border transition-colors",
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
    </div>
  );
}

interface NumberStepperProps {
  label: string;
  hint?: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (n: number) => void;
}

function NumberStepper({
  label,
  hint,
  value,
  min,
  max,
  step,
  onChange,
}: NumberStepperProps): JSX.Element {
  return (
    <div className="flex items-center justify-between gap-4">
      <LabelWithHint label={label} hint={hint} />
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - step))}
          className="rounded-md border border-bg-subtle bg-bg-elevated px-2 py-1 font-mono text-xs text-fg-muted hover:border-accent/40 hover:text-fg"
        >
          −
        </button>
        <span className="w-8 text-center font-mono text-sm text-fg">
          {value}
        </span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + step))}
          className="rounded-md border border-bg-subtle bg-bg-elevated px-2 py-1 font-mono text-xs text-fg-muted hover:border-accent/40 hover:text-fg"
        >
          +
        </button>
      </div>
    </div>
  );
}

/** Label with tooltip on hover — no icon, just hover the text. */
function LabelWithHint({
  label,
  hint,
}: {
  label: string;
  hint?: string;
}): JSX.Element {
  if (!hint) {
    return <span className="font-mono text-xs text-fg-muted">{label}</span>;
  }
  return (
    <span className="group relative font-mono text-xs text-fg-muted cursor-default">
      {label}
      <span className="pointer-events-none absolute bottom-full left-0 z-50 mb-1.5 w-48 rounded-md border border-bg-subtle bg-bg-elevated px-2.5 py-1.5 font-mono text-[10px] leading-snug text-fg-muted opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
        {hint}
      </span>
    </span>
  );
}
