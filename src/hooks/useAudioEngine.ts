/**
 * useAudioEngine — accessor for the audio engine status (UI use only).
 *
 * Subscribes via useSyncExternalStore so we don't have to wrap the engine
 * in Zustand. Sample-loader progress lives on its own subscriber for the
 * loading screen / status bar.
 */

import { useSyncExternalStore } from "react";

import { audioEngine, type AudioEngine } from "@/audio/engine/AudioEngine";
import {
  sampleLoader,
  type LoaderProgress,
} from "@/audio/samples/SampleLoader";
import type { AudioEngineStatus } from "@/types/audio";

export function useAudioEngineStatus(): AudioEngineStatus {
  return useSyncExternalStore(
    (cb) => audioEngine.subscribe(cb),
    () => audioEngine.getStatus(),
    () => "idle",
  );
}

const SERVER_PROGRESS: LoaderProgress = {
  loaded: 0,
  total: 0,
  status: "idle",
  error: null,
};

export function useSampleProgress(): LoaderProgress {
  return useSyncExternalStore(
    (cb) =>
      sampleLoader.subscribe(() => {
        cb();
      }),
    () => sampleLoader.snapshot(),
    () => SERVER_PROGRESS,
  );
}

export function useAudioEngine(): AudioEngine {
  return audioEngine;
}
