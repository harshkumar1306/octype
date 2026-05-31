"use client";

/**
 * CustomMappingModal — full-screen modal for creating custom key mappings.
 *
 * Workflow:
 *   1. User picks octave count (3-5).
 *   2. A piano keyboard for that range is shown.
 *   3. User clicks a piano key to "arm" it, then presses a physical key
 *      to bind. Bindings are optional — not every key must be mapped.
 *   4. Save (with a name), rename, or delete custom mappings.
 *
 * Custom profiles always anchor at C3 (a comfortable middle range). The
 * octave count determines how many octaves the mapping spans.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import {
  buildKeyRange,
  countWhiteKeys,
  isBlackKey,
  midiToName,
  nameToMidi,
} from "@/lib/noteUtils";
import { setBinding } from "@/systems/mapping/KeyMapping";
import { useMappingStore } from "@/stores/mappingStore";
import type { KeyBinding, MappingProfile } from "@/types/mapping";

interface CustomMappingModalProps {
  open: boolean;
  onClose: () => void;
}

const CUSTOM_START_OCTAVE = 3;

export function CustomMappingModal({
  open,
  onClose,
}: CustomMappingModalProps): JSX.Element {
  const profiles = useMappingStore((s) => s.profiles);
  const activeId = useMappingStore((s) => s.activeProfileId);
  const setActive = useMappingStore((s) => s.setActiveProfile);
  const addProfile = useMappingStore((s) => s.addProfile);
  const renameProfile = useMappingStore((s) => s.renameProfile);
  const deleteProfile = useMappingStore((s) => s.deleteProfile);

  const customProfiles = profiles.filter((p) => p.mode === "custom");
  const activeProfile = profiles.find((p) => p.id === activeId);
  const editingCustom =
    activeProfile?.mode === "custom" ? activeProfile : null;

  // Working draft state.
  const [octaveCount, setOctaveCount] = useState(3);
  const [draftBindings, setDraftBindings] = useState<KeyBinding[]>([]);
  const [armedOffset, setArmedOffset] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Load the active custom profile into the draft when modal opens.
  useEffect(() => {
    if (!open) return;
    if (editingCustom) {
      setOctaveCount(editingCustom.octaveCount);
      setDraftBindings([...editingCustom.bindings]);
    } else {
      setOctaveCount(3);
      setDraftBindings([]);
    }
    setArmedOffset(null);
    setFeedback(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const baseMidi = nameToMidi(`C${CUSTOM_START_OCTAVE}`);
  const topMidi = baseMidi + octaveCount * 12;

  // Capture next physical key when armed.
  useEffect(() => {
    if (armedOffset === null) return;
    const handler = (e: KeyboardEvent): void => {
      if (e.repeat) return;
      if (e.code === "Escape") {
        e.preventDefault();
        setArmedOffset(null);
        setFeedback(null);
        return;
      }
      if (isPureModifier(e.code)) return;
      e.preventDefault();
      e.stopPropagation();
      const useShift = e.shiftKey;
      const label = labelForCode(e.code, e.key, useShift);
      setDraftBindings((prev) =>
        setBinding(prev, e.code, armedOffset, label, useShift),
      );
      setFeedback(
        `bound ${label} → ${midiToName(baseMidi + armedOffset)}`,
      );
      setArmedOffset(null);
    };
    document.addEventListener("keydown", handler, { capture: true });
    return () =>
      document.removeEventListener("keydown", handler, {
        capture: true,
      } as EventListenerOptions);
  }, [armedOffset, baseMidi]);

  const bindingsByOffset = useMemo(() => {
    const map = new Map<number, KeyBinding>();
    for (const b of draftBindings) {
      if (!map.has(b.semitoneOffset) || !b.shift) map.set(b.semitoneOffset, b);
    }
    return map;
  }, [draftBindings]);

  const handleSaveNew = (): void => {
    const name = window.prompt("Name this mapping", "My mapping");
    if (!name || name.trim().length === 0) return;
    const profile: MappingProfile = {
      id: `custom-${Date.now()}`,
      name: name.trim(),
      bindings: [...draftBindings],
      description: "Custom mapping",
      builtin: false,
      mode: "custom",
      startOctave: CUSTOM_START_OCTAVE,
      octaveCount,
    };
    addProfile(profile);
    setFeedback(`saved "${profile.name}"`);
  };

  const handleUpdate = (): void => {
    if (!editingCustom) return;
    // Re-save by replacing: delete + add with same id is messy; use a
    // dedicated update via addProfile overwrite semantics.
    const updated: MappingProfile = {
      ...editingCustom,
      bindings: [...draftBindings],
      octaveCount,
    };
    // Replace in store.
    useMappingStore.getState().replaceProfiles(
      useMappingStore
        .getState()
        .profiles.map((p) => (p.id === updated.id ? updated : p)),
    );
    setActive(updated.id);
    setFeedback(`updated "${updated.name}"`);
  };

  const handleClear = (): void => {
    setDraftBindings([]);
    setFeedback("cleared all bindings");
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ type: "spring", stiffness: 340, damping: 32 }}
            className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-bg-subtle bg-bg-elevated"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-bg-subtle px-6 py-4">
              <h2 className="font-mono text-sm uppercase tracking-widest text-fg">
                custom mapping
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="font-mono text-xs text-fg-muted hover:text-fg"
              >
                close
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
              {/* Saved custom mappings */}
              {customProfiles.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-mono text-[11px] uppercase tracking-[0.18em] text-fg-subtle">
                    saved mappings
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {customProfiles.map((p) => (
                      <div
                        key={p.id}
                        className={[
                          "flex items-center gap-1 rounded-md border px-2 py-1",
                          activeId === p.id
                            ? "border-accent bg-accent/20"
                            : "border-bg-subtle bg-bg-DEFAULT",
                        ].join(" ")}
                      >
                        <button
                          type="button"
                          onClick={() => setActive(p.id)}
                          className="font-mono text-xs text-fg hover:text-accent-soft"
                        >
                          {p.name}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const name = window.prompt("Rename mapping", p.name);
                            if (name && name.trim()) renameProfile(p.id, name.trim());
                          }}
                          className="px-1 font-mono text-[10px] text-fg-subtle hover:text-fg"
                          title="Rename"
                        >
                          ✎
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Delete "${p.name}"?`)) deleteProfile(p.id);
                          }}
                          className="px-1 font-mono text-[10px] text-fg-subtle hover:text-red-400"
                          title="Delete"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Octave count selector */}
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-fg-muted">octaves</span>
                {[3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setOctaveCount(n)}
                    className={[
                      "rounded-md border px-3 py-1 font-mono text-xs transition-colors",
                      octaveCount === n
                        ? "border-accent bg-accent/20 text-accent-soft"
                        : "border-bg-subtle bg-bg-DEFAULT text-fg-muted hover:border-accent/40",
                    ].join(" ")}
                  >
                    {n}
                  </button>
                ))}
                <span className="font-mono text-[10px] text-fg-subtle">
                  C{CUSTOM_START_OCTAVE} – C{CUSTOM_START_OCTAVE + octaveCount}
                </span>
              </div>

              {/* Editor keyboard */}
              <div className="rounded-lg border border-bg-subtle bg-bg-DEFAULT/40 p-3">
                <EditorKeyboard
                  baseMidi={baseMidi}
                  topMidi={topMidi}
                  armedOffset={armedOffset}
                  bindingsByOffset={bindingsByOffset}
                  onPickKey={(offset) => {
                    setArmedOffset(offset);
                    setFeedback("press a key (hold Shift for an alt binding)…");
                  }}
                />
              </div>

              <div className="font-mono text-[11px] text-fg-subtle">
                {feedback ??
                  "click a piano key, then press a keyboard key to bind it. mapping is optional — leave keys unbound if you like."}
              </div>
            </div>

            {/* Footer actions */}
            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-bg-subtle px-6 py-4">
              <button
                type="button"
                onClick={handleClear}
                className="rounded-md border border-bg-subtle bg-bg-DEFAULT px-3 py-1.5 font-mono text-xs text-fg-muted hover:border-accent/40 hover:text-fg"
              >
                clear
              </button>
              {editingCustom && (
                <button
                  type="button"
                  onClick={handleUpdate}
                  className="rounded-md border border-bg-subtle bg-bg-DEFAULT px-3 py-1.5 font-mono text-xs text-fg-muted hover:border-accent/40 hover:text-fg"
                >
                  update &quot;{editingCustom.name}&quot;
                </button>
              )}
              <button
                type="button"
                onClick={handleSaveNew}
                className="rounded-md border border-accent/50 bg-accent/15 px-3 py-1.5 font-mono text-xs text-accent-soft hover:bg-accent/25"
              >
                save as new
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface EditorKeyboardProps {
  baseMidi: number;
  topMidi: number;
  armedOffset: number | null;
  bindingsByOffset: ReadonlyMap<number, KeyBinding>;
  onPickKey: (offset: number) => void;
}

function EditorKeyboard({
  baseMidi,
  topMidi,
  armedOffset,
  bindingsByOffset,
  onPickKey,
}: EditorKeyboardProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setWidth(entry.contentRect.width);
    });
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const keys = useMemo(
    () => buildKeyRange(baseMidi, topMidi),
    [baseMidi, topMidi],
  );
  const whiteCount = useMemo(
    () => countWhiteKeys(baseMidi, topMidi),
    [baseMidi, topMidi],
  );
  const whiteWidth = whiteCount > 0 ? width / whiteCount : 0;
  const height = 130;

  const positioned = useMemo(() => {
    let lastWhite = 0;
    return keys.map((k) => {
      if (!isBlackKey(k.midi)) {
        lastWhite = k.whiteIndex;
        return { key: k, left: k.whiteIndex * whiteWidth };
      }
      return { key: k, left: lastWhite * whiteWidth };
    });
  }, [keys, whiteWidth]);

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      style={{ height }}
      role="group"
      aria-label="Custom mapping editor keyboard"
    >
      {whiteWidth > 0 &&
        positioned.map(({ key, left }) => {
          const offset = key.midi - baseMidi;
          const binding = bindingsByOffset.get(offset);
          const isArmed = armedOffset === offset;
          const isWhite = !isBlackKey(key.midi);

          if (isWhite) {
            return (
              <button
                key={key.midi}
                type="button"
                onClick={() => onPickKey(offset)}
                style={{ left, top: 0, width: whiteWidth, height }}
                className={[
                  "absolute z-0 select-none rounded-b-md border transition-colors",
                  isArmed
                    ? "border-accent bg-accent/40"
                    : "border-key-whiteEdge bg-gradient-to-b from-key-white to-[#e7e5e4] hover:from-[#ecebea]",
                ].join(" ")}
              >
                <div className="pointer-events-none flex h-full w-full flex-col items-center justify-end pb-2 font-mono text-[10px]">
                  <span className="text-fg-subtle">{midiToName(key.midi)}</span>
                  {binding && (
                    <span className="mt-0.5 text-[11px] text-fg">
                      {binding.label}
                    </span>
                  )}
                </div>
              </button>
            );
          }

          const w = whiteWidth * 0.58;
          const blackLeft = left + whiteWidth - w / 2;
          return (
            <button
              key={key.midi}
              type="button"
              onClick={() => onPickKey(offset)}
              style={{ left: blackLeft, top: 0, width: w, height: height * 0.62 }}
              className={[
                "absolute z-10 select-none rounded-b-[4px] border transition-colors",
                isArmed
                  ? "border-accent bg-accent/70"
                  : "border-key-blackEdge bg-gradient-to-b from-key-black to-[#0c0c0e] hover:from-[#262629]",
              ].join(" ")}
            >
              <div className="pointer-events-none flex h-full w-full flex-col items-center justify-end pb-1 font-mono text-[9px]">
                {binding && <span className="text-fg-muted">{binding.label}</span>}
              </div>
            </button>
          );
        })}
    </div>
  );
}

function isPureModifier(code: string): boolean {
  return [
    "ShiftLeft",
    "ShiftRight",
    "ControlLeft",
    "ControlRight",
    "AltLeft",
    "AltRight",
    "MetaLeft",
    "MetaRight",
    "CapsLock",
  ].includes(code);
}

function labelForCode(code: string, key: string, shift: boolean): string {
  let base: string;
  if (code.startsWith("Key") && code.length === 4) base = code.slice(3);
  else if (code.startsWith("Digit") && code.length === 6) base = code.slice(5);
  else if (code === "Space") base = "␣";
  else if (code === "Semicolon") base = ";";
  else if (code === "Quote") base = "'";
  else if (code === "Comma") base = ",";
  else if (code === "Period") base = ".";
  else if (code === "Slash") base = "/";
  else if (code === "Minus") base = "-";
  else if (code === "Equal") base = "=";
  else if (code === "BracketLeft") base = "[";
  else if (code === "BracketRight") base = "]";
  else if (code === "Backslash") base = "\\";
  else if (code === "Backquote") base = "`";
  else if (code === "Tab") base = "↹";
  else if (code === "Backspace") base = "⌫";
  else base = key.length > 0 ? key : code;
  return shift ? `⇧${base}` : base;
}
