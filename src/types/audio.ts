/**
 * Audio engine types.
 *
 * These are stubs for Phase 1. The actual audio engine is implemented in Phase 2.
 */

/** Coarse loading state of the audio engine and its samples. */
export type AudioEngineStatus =
  | "idle"
  | "initializing"
  | "loading-samples"
  | "ready"
  | "error";

/** Progress reporting for sample loading. */
export interface SampleLoadProgress {
  loaded: number;
  total: number;
  /** Optional human-readable phase (e.g. "core notes"). */
  phase?: string;
}

/** Reverb configuration. */
export interface ReverbSettings {
  enabled: boolean;
  /** 0..1 wet level. */
  amount: number;
}

/** Master audio settings. */
export interface AudioSettings {
  /** Master gain 0..1. */
  masterVolume: number;
  /** Velocity sensitivity 0..1 (1 = fully dynamic, 0 = constant). */
  velocitySensitivity: number;
  /** Default velocity for non-velocity-sensitive sources (0..127). */
  defaultVelocity: number;
  /** Reverb settings. */
  reverb: ReverbSettings;
  /** Maximum simultaneous voices. */
  voiceLimit: number;
  /** Latency offset in milliseconds (positive = delay). */
  latencyOffsetMs: number;
}
