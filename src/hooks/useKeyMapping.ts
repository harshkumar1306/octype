/**
 * useKeyMapping — provides the current bindings as an offset->binding map.
 */

import { useMemo } from "react";

import { useMappingStore } from "@/stores/mappingStore";
import type { KeyBinding } from "@/types/mapping";

/** Returns a Map keyed by semitoneOffset for rendering key labels. */
export function useBindingsByOffset(): ReadonlyMap<number, KeyBinding> {
  const bindings = useMappingStore((s) => {
    const profile = s.profiles.find((p) => p.id === s.activeProfileId);
    return profile?.bindings ?? [];
  });
  return useMemo(() => {
    const map = new Map<number, KeyBinding>();
    for (const b of bindings) {
      if (!map.has(b.semitoneOffset) || !b.shift) {
        map.set(b.semitoneOffset, b);
      }
    }
    return map;
  }, [bindings]);
}
