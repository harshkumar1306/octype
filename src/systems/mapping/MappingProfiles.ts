/**
 * Mapping profile persistence — localStorage.
 * Only custom (non-builtin) profiles are stored.
 */

import type { MappingProfile } from "@/types/mapping";

const STORAGE_KEY = "octype:mapping-profiles:v2";

function isMappingProfile(value: unknown): value is MappingProfile {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    typeof v.name === "string" &&
    Array.isArray(v.bindings) &&
    typeof v.mode === "string" &&
    typeof v.startOctave === "number" &&
    typeof v.octaveCount === "number"
  );
}

/** Loads user-defined profiles from localStorage. */
export function loadProfiles(): MappingProfile[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isMappingProfile);
  } catch {
    return [];
  }
}

/** Persists user-defined profiles. */
export function saveProfiles(profiles: readonly MappingProfile[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
}

/** Serializes a profile as JSON for export. */
export function exportProfile(profile: MappingProfile): string {
  return JSON.stringify(profile, null, 2);
}

/** Parses an imported JSON string. */
export function importProfile(json: string): MappingProfile {
  const parsed: unknown = JSON.parse(json);
  if (!isMappingProfile(parsed)) {
    throw new Error("Invalid mapping profile JSON.");
  }
  return { ...parsed, builtin: false };
}
