/**
 * Pure mapping logic: translates physical keys to MIDI notes given a base note.
 */

import type { BindingConflict, KeyBinding } from "@/types/mapping";

/**
 * Resolves a KeyboardEvent.code + shift state to the MIDI note it should play.
 * Returns null if the key isn't bound.
 */
export function resolveCodeToMidi(
  code: string,
  shiftHeld: boolean,
  baseMidi: number,
  bindings: readonly KeyBinding[],
): number | null {
  for (const b of bindings) {
    if (b.code === code) {
      const needsShift = b.shift === true;
      if (needsShift === shiftHeld) {
        return baseMidi + b.semitoneOffset;
      }
    }
  }
  return null;
}

/**
 * Builds a fast lookup map from KeyboardEvent.code to bindings.
 * A single code can have two bindings (one with shift, one without).
 */
export function buildBindingMap(
  bindings: readonly KeyBinding[],
): ReadonlyMap<string, KeyBinding[]> {
  const map = new Map<string, KeyBinding[]>();
  for (const b of bindings) {
    const existing = map.get(b.code);
    if (existing) existing.push(b);
    else map.set(b.code, [b]);
  }
  return map;
}

/** Detects a conflict for adding a new binding. */
export function detectConflict(
  bindings: readonly KeyBinding[],
  proposed: KeyBinding,
): BindingConflict | null {
  for (const b of bindings) {
    if (b.code === proposed.code && (b.shift ?? false) === (proposed.shift ?? false)) {
      return { existingCode: b.code, existingOffset: b.semitoneOffset };
    }
    if (b.semitoneOffset === proposed.semitoneOffset && (b.shift ?? false) === (proposed.shift ?? false)) {
      return { existingCode: b.code, existingOffset: b.semitoneOffset };
    }
  }
  return null;
}

/** Sets a binding, removing conflicts. */
export function setBinding(
  bindings: readonly KeyBinding[],
  code: string,
  newOffset: number,
  label: string,
  shift?: boolean,
): KeyBinding[] {
  const s = shift ?? false;
  const next = bindings.filter(
    (b) => !(b.code === code && (b.shift ?? false) === s) &&
           !(b.semitoneOffset === newOffset && (b.shift ?? false) === s),
  );
  next.push({ code, semitoneOffset: newOffset, label, shift: s || undefined });
  return next;
}
