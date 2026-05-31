/**
 * Mapping store — manages active profile + custom profiles.
 *
 * Three modes: default, max, custom.
 * Default and Max are built-in and cannot be edited.
 * Custom profiles are user-created and persisted to localStorage.
 */

import { create } from "zustand";

import { buildBindingMap, setBinding } from "@/systems/mapping/KeyMapping";
import {
  DEFAULT_PROFILE,
  MAX_PROFILE,
} from "@/systems/mapping/MappingDefaults";
import {
  loadProfiles,
  saveProfiles,
} from "@/systems/mapping/MappingProfiles";
import type { KeyBinding, MappingProfile } from "@/types/mapping";
import { nameToMidi } from "@/lib/noteUtils";

interface MappingState {
  profiles: MappingProfile[];
  activeProfileId: string;
  bindingMap: ReadonlyMap<string, KeyBinding[]>;

  getActiveProfile: () => MappingProfile;
  setActiveProfile: (id: string) => void;
  setBindingOnActive: (code: string, semitoneOffset: number, label: string, shift?: boolean) => void;
  resetActiveToDefault: () => void;
  addProfile: (profile: MappingProfile) => void;
  renameProfile: (id: string, name: string) => void;
  deleteProfile: (id: string) => void;
  duplicateActive: (name: string) => void;
  replaceProfiles: (profiles: MappingProfile[]) => void;
}

export const useMappingStore = create<MappingState>((set, get) => {
  const customProfiles = loadProfiles();
  const allProfiles = [DEFAULT_PROFILE, MAX_PROFILE, ...customProfiles];
  const initial = DEFAULT_PROFILE;

  return {
    profiles: allProfiles,
    activeProfileId: initial.id,
    bindingMap: buildBindingMap(initial.bindings),

    getActiveProfile: () => {
      const { profiles, activeProfileId } = get();
      return profiles.find((p) => p.id === activeProfileId) ?? DEFAULT_PROFILE;
    },

    setActiveProfile: (id) => {
      const profile = get().profiles.find((p) => p.id === id);
      if (!profile) return;
      // Sync the piano store's mapping anchor + visible window to the profile.
      const { usePianoStore } = require("@/stores/pianoStore") as {
        usePianoStore: typeof import("@/stores/pianoStore").usePianoStore;
      };
      const startMidi = nameToMidi(`C${profile.startOctave}`);
      usePianoStore.getState().syncToMapping(startMidi, profile.octaveCount);

      set({
        activeProfileId: profile.id,
        bindingMap: buildBindingMap(profile.bindings),
      });
    },

    setBindingOnActive: (code, semitoneOffset, label, shift) => {
      const active = get().getActiveProfile();
      if (active.builtin) return; // Can't edit built-in profiles
      const newBindings = setBinding(active.bindings, code, semitoneOffset, label, shift);
      const updated = { ...active, bindings: newBindings };
      const nextProfiles = get().profiles.map((p) =>
        p.id === updated.id ? updated : p,
      );
      saveProfiles(nextProfiles.filter((p) => !p.builtin));
      set({
        profiles: nextProfiles,
        bindingMap: buildBindingMap(newBindings),
      });
    },

    resetActiveToDefault: () => {
      const active = get().getActiveProfile();
      if (active.builtin) return;
      const reset = { ...active, bindings: [] };
      const nextProfiles = get().profiles.map((p) =>
        p.id === reset.id ? reset : p,
      );
      saveProfiles(nextProfiles.filter((p) => !p.builtin));
      set({
        profiles: nextProfiles,
        bindingMap: buildBindingMap(reset.bindings),
      });
    },

    addProfile: (profile) => {
      const next = [...get().profiles, profile];
      saveProfiles(next.filter((p) => !p.builtin));
      set({
        profiles: next,
        activeProfileId: profile.id,
        bindingMap: buildBindingMap(profile.bindings),
      });
    },

    renameProfile: (id, name) => {
      const next = get().profiles.map((p) =>
        p.id === id && !p.builtin ? { ...p, name } : p,
      );
      saveProfiles(next.filter((p) => !p.builtin));
      set({ profiles: next });
    },

    deleteProfile: (id) => {
      const target = get().profiles.find((p) => p.id === id);
      if (!target || target.builtin) return;
      const next = get().profiles.filter((p) => p.id !== id);
      saveProfiles(next.filter((p) => !p.builtin));
      set({
        profiles: next,
        activeProfileId: DEFAULT_PROFILE.id,
        bindingMap: buildBindingMap(DEFAULT_PROFILE.bindings),
      });
    },

    duplicateActive: (name) => {
      const active = get().getActiveProfile();
      const copy: MappingProfile = {
        id: `custom-${Date.now()}`,
        name,
        bindings: [...active.bindings],
        description: `Custom mapping based on ${active.name}`,
        builtin: false,
        mode: "custom",
        startOctave: active.startOctave,
        octaveCount: active.octaveCount,
      };
      const next = [...get().profiles, copy];
      saveProfiles(next.filter((p) => !p.builtin));
      set({
        profiles: next,
        activeProfileId: copy.id,
        bindingMap: buildBindingMap(copy.bindings),
      });
    },

    replaceProfiles: (profiles) => {
      saveProfiles(profiles.filter((p) => !p.builtin));
      const active =
        profiles.find((p) => p.id === get().activeProfileId) ?? DEFAULT_PROFILE;
      set({
        profiles,
        activeProfileId: active.id,
        bindingMap: buildBindingMap(active.bindings),
      });
    },
  };
});
