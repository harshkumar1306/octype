"use client";

/**
 * SettingsPanel — slide-in drawer from the right.
 *
 * Phase 3 wires the full set of sections:
 *   - Keyboard (octaves, transpose, sustain key picker)
 *   - Display
 *   - Mapping (profile management + visual editor)
 *   - Audio (master, velocity sensitivity, reverb, voice limit)
 *   - MIDI  (device list, sustain CC)
 */

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

import { AudioSettings } from "@/components/settings/AudioSettings";
import { CustomMappingModal } from "@/components/settings/CustomMappingModal";
import { MidiDeviceSelector } from "@/components/settings/MidiDeviceSelector";
import { useMappingStore } from "@/stores/mappingStore";
import { usePianoStore } from "@/stores/pianoStore";
import { useSettingsStore } from "@/stores/settingsStore";

export function SettingsPanel(): JSX.Element {
  const open = useSettingsStore((s) => s.settingsOpen);
  const closeSettings = useSettingsStore((s) => s.closeSettings);

  // Close on Escape (only when no captured editor is armed; the editor
  // handles Escape itself).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") closeSettings();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, closeSettings]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={closeSettings}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            aria-hidden="true"
          />
          <motion.aside
            key="drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 36 }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-bg-subtle bg-bg-elevated"
            role="dialog"
            aria-label="Settings"
          >
            <div className="flex items-center justify-between border-b border-bg-subtle px-6 py-4">
              <h2 className="font-mono text-sm uppercase tracking-widest text-fg">
                settings
              </h2>
              <button
                type="button"
                onClick={closeSettings}
                className="font-mono text-xs text-fg-muted hover:text-fg"
              >
                close
              </button>
            </div>

            <div className="flex-1 space-y-8 overflow-y-auto px-6 py-6">
              <KeyboardSection />
              <DisplaySection />
              <MappingSection />
              <AudioSection />
              <MidiSection />
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
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
    <section className="space-y-3">
      <h3 className="font-mono text-[11px] uppercase tracking-[0.18em] text-fg-subtle">
        {title}
      </h3>
      <div className="space-y-3 rounded-lg border border-bg-subtle bg-bg-DEFAULT/40 p-4">
        {children}
      </div>
    </section>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}): JSX.Element {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="font-mono text-xs text-fg-muted">{label}</span>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}

function KeyboardSection(): JSX.Element {
  const octaves = usePianoStore((s) => s.octaves);
  const setOctaves = usePianoStore((s) => s.setOctaves);
  const transposeSemitones = useSettingsStore((s) => s.transposeSemitones);
  const setTranspose = useSettingsStore((s) => s.setTranspose);
  const sustainKey = useSettingsStore((s) => s.sustainKey);
  const setSustainKey = useSettingsStore((s) => s.setSustainKey);

  return (
    <Section title="keyboard">
      <Row label="octaves visible">
        <Stepper value={octaves} onChange={setOctaves} min={1} max={7} />
      </Row>
      <Row label="transpose (semitones)">
        <Stepper
          value={transposeSemitones}
          onChange={setTranspose}
          min={-24}
          max={24}
        />
      </Row>
      <Row label="sustain key">
        <SustainKeyPicker value={sustainKey} onChange={setSustainKey} />
      </Row>
    </Section>
  );
}

function DisplaySection(): JSX.Element {
  const showKeyLabels = usePianoStore((s) => s.showKeyLabels);
  const showNoteNames = usePianoStore((s) => s.showNoteNames);
  const toggleKeyLabels = usePianoStore((s) => s.toggleKeyLabels);
  const toggleNoteNames = usePianoStore((s) => s.toggleNoteNames);

  return (
    <Section title="display">
      <Row label="key labels">
        <Switch active={showKeyLabels} onClick={toggleKeyLabels} />
      </Row>
      <Row label="note names">
        <Switch active={showNoteNames} onClick={toggleNoteNames} />
      </Row>
    </Section>
  );
}

function MappingSection(): JSX.Element {
  const profiles = useMappingStore((s) => s.profiles);
  const activeId = useMappingStore((s) => s.activeProfileId);
  const setActive = useMappingStore((s) => s.setActiveProfile);
  const [modalOpen, setModalOpen] = useState(false);

  const defaultProfile = profiles.find((p) => p.id === "default");
  const maxProfile = profiles.find((p) => p.id === "max");
  const customProfiles = profiles.filter((p) => p.mode === "custom");
  const activeProfile = profiles.find((p) => p.id === activeId);
  const isCustomActive = activeProfile?.mode === "custom";

  return (
    <Section title="mapping">
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {defaultProfile && (
            <ModeButton
              label="Default"
              active={activeId === defaultProfile.id}
              onClick={() => setActive(defaultProfile.id)}
            />
          )}
          {maxProfile && (
            <ModeButton
              label="Max"
              active={activeId === maxProfile.id}
              onClick={() => setActive(maxProfile.id)}
            />
          )}
          <ModeButton
            label="Custom"
            active={isCustomActive}
            onClick={() => {
              // Activate the first custom profile if one exists, then open editor.
              const firstCustom = customProfiles[0];
              if (firstCustom) setActive(firstCustom.id);
              setModalOpen(true);
            }}
          />
        </div>

        <p className="font-mono text-[10px] leading-relaxed text-fg-subtle">
          {activeProfile?.description ?? ""}
        </p>

        {customProfiles.length > 0 && (
          <div className="space-y-1.5">
            <span className="font-mono text-[10px] uppercase tracking-wider text-fg-subtle">
              your mappings
            </span>
            <div className="flex flex-wrap gap-2">
              {customProfiles.map((p) => (
                <ModeButton
                  key={p.id}
                  label={p.name}
                  active={activeId === p.id}
                  onClick={() => setActive(p.id)}
                />
              ))}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="w-full rounded-md border border-bg-subtle bg-bg-elevated px-3 py-2 font-mono text-xs text-fg-muted transition-colors hover:border-accent/40 hover:text-fg"
        >
          open custom mapping editor
        </button>
      </div>

      <CustomMappingModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </Section>
  );
}

function ModeButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-md border px-3 py-1.5 font-mono text-xs transition-colors",
        active
          ? "border-accent bg-accent/20 text-accent-soft"
          : "border-bg-subtle bg-bg-elevated text-fg-muted hover:border-accent/40 hover:text-fg",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function AudioSection(): JSX.Element {
  return (
    <Section title="audio">
      <AudioSettings />
    </Section>
  );
}

function MidiSection(): JSX.Element {
  return (
    <Section title="midi">
      <MidiDeviceSelector />
    </Section>
  );
}

interface SustainKeyPickerProps {
  value: string;
  onChange: (code: string) => void;
}

function SustainKeyPicker({
  value,
  onChange,
}: SustainKeyPickerProps): JSX.Element {
  const [armed, setArmed] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);

  useEffect(() => {
    if (!armed) return;
    setWarning(null);
    const handler = (e: KeyboardEvent): void => {
      if (e.repeat) return;
      if (e.code === "Escape") {
        e.preventDefault();
        setArmed(false);
        setWarning(null);
        return;
      }
      e.preventDefault();
      e.stopPropagation();

      // Check if this key is mapped to a note in the active profile.
      const bindings = useMappingStore.getState().getActiveProfile().bindings;
      const conflict = bindings.find((b) => b.code === e.code);
      if (conflict) {
        setWarning(
          `"${displayCode(e.code)}" is mapped to a note. Pick an unmapped key.`,
        );
        return;
      }

      onChange(e.code);
      setArmed(false);
      setWarning(null);
    };
    document.addEventListener("keydown", handler, { capture: true });
    return () =>
      document.removeEventListener("keydown", handler, {
        capture: true,
      } as EventListenerOptions);
  }, [armed, onChange]);

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={() => setArmed((a) => !a)}
        className={[
          "rounded-md border px-3 py-1 font-mono text-xs",
          armed
            ? "border-accent bg-accent/20 text-accent-soft"
            : "border-bg-subtle bg-bg-elevated text-fg hover:border-accent/40",
        ].join(" ")}
      >
        {armed ? "press a key…" : displayCode(value)}
      </button>
      {warning && (
        <span className="font-mono text-[10px] text-red-400/90">
          {warning}
        </span>
      )}
    </div>
  );
}

function displayCode(code: string): string {
  if (code === "Space") return "Space";
  if (code.startsWith("Key") && code.length === 4) return code.slice(3);
  return code;
}

function Stepper({
  value,
  onChange,
  min,
  max,
}: {
  value: number;
  onChange: (n: number) => void;
  min: number;
  max: number;
}): JSX.Element {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        disabled={value <= min}
        className="rounded-md border border-bg-subtle bg-bg-elevated px-2 py-1 font-mono text-xs text-fg-muted hover:border-accent/40 hover:text-fg disabled:opacity-40"
      >
        −
      </button>
      <span className="w-8 text-center font-mono text-sm text-fg">{value}</span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        className="rounded-md border border-bg-subtle bg-bg-elevated px-2 py-1 font-mono text-xs text-fg-muted hover:border-accent/40 hover:text-fg disabled:opacity-40"
      >
        +
      </button>
    </div>
  );
}

function Switch({
  active,
  onClick,
}: {
  active: boolean;
  onClick: () => void;
}): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      role="switch"
      aria-checked={active}
      className={[
        "relative h-6 w-11 overflow-hidden rounded-full border transition-colors",
        active
          ? "border-accent/40 bg-accent/30"
          : "border-bg-subtle bg-bg-DEFAULT",
      ].join(" ")}
    >
      <span
        className={[
          "absolute top-[3px] h-4 w-4 rounded-full bg-fg-muted transition-transform",
          active ? "left-[22px] bg-accent-soft" : "left-[3px]",
        ].join(" ")}
      />
    </button>
  );
}
