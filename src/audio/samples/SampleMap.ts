/**
 * SampleMap — pure mapping of MIDI notes to recorded sample files.
 *
 * The Salamander Grand Piano records every 3 semitones starting at A0 (MIDI 21).
 * That gives 30 base notes between A0 and C8 (MIDI 21..108). For any other
 * MIDI note, we pitch-shift from the nearest recorded note (max ±1 semitone
 * thanks to the 3-semitone spacing — well within the spec's ±2 limit).
 */

import { midiToName } from "@/lib/noteUtils";

/** Lowest recorded note (A0 = MIDI 21). */
export const SAMPLE_LOW = 21;
/** Highest recorded note (C8 = MIDI 108). */
export const SAMPLE_HIGH = 108;

/** All recorded MIDI notes, derived: every multiple of 3 in [21, 108]. */
export const RECORDED_MIDI_NOTES: readonly number[] = (() => {
  const arr: number[] = [];
  for (let m = SAMPLE_LOW; m <= SAMPLE_HIGH; m += 3) arr.push(m);
  return arr;
})();

/** A reference to a specific recorded sample. */
export interface SampleRef {
  /** MIDI note number of the recorded sample. */
  recordedMidi: number;
  /** Velocity layer 1..16. */
  velocityLayer: number;
}

/** Where to play a given MIDI note from. */
export interface PlaybackTarget {
  /** Sample to use. */
  ref: SampleRef;
  /** How many semitones to shift the sample (positive = up). */
  semitoneOffset: number;
}

/** Number of velocity layers Salamander provides. */
export const VELOCITY_LAYERS = 16;

/** Returns the nearest recorded MIDI note for the given playback note. */
export function nearestRecordedMidi(midi: number): number {
  const clamped = Math.max(SAMPLE_LOW, Math.min(SAMPLE_HIGH, midi));
  // Round to nearest multiple of 3 inside [21, 108]. Recorded notes are
  // multiples of 3.
  const rounded = Math.round(clamped / 3) * 3;
  if (rounded < SAMPLE_LOW) return SAMPLE_LOW;
  if (rounded > SAMPLE_HIGH) return SAMPLE_HIGH;
  return rounded;
}

/**
 * Maps MIDI velocity (0..127) to a velocity layer (1..VELOCITY_LAYERS),
 * clamped. velocity sensitivity 0..1 controls how much velocity actually
 * varies the layer (0 = always default layer; 1 = full dynamic range).
 */
export function velocityToLayer(
  velocity: number,
  sensitivity: number,
  defaultVelocity: number,
): number {
  const v = clamp(velocity, 0, 127);
  const sens = clamp(sensitivity, 0, 1);
  const def = clamp(defaultVelocity, 0, 127);
  // Blend between defaultVelocity and the actual velocity by sensitivity.
  const effective = def + (v - def) * sens;
  const layer = Math.ceil((effective / 127) * VELOCITY_LAYERS);
  return clamp(layer, 1, VELOCITY_LAYERS);
}

/** Returns the playback target for a given MIDI note. */
export function targetForMidi(
  midi: number,
  velocityLayer: number,
): PlaybackTarget {
  const recordedMidi = nearestRecordedMidi(midi);
  return {
    ref: { recordedMidi, velocityLayer: clamp(velocityLayer, 1, VELOCITY_LAYERS) },
    semitoneOffset: midi - recordedMidi,
  };
}

/**
 * Returns the canonical filename for a recorded sample.
 * E.g. (60, 8) -> "C4v8.ogg".
 *
 * Salamander ships OGG Vorbis (`.ogg`) samples; Web Audio's `decodeAudioData`
 * decodes them on every modern desktop browser.
 */
export function sampleFilename(ref: SampleRef): string {
  return `${midiToName(ref.recordedMidi)}v${ref.velocityLayer}.ogg`;
}

/**
 * Returns alternative filenames to try when the canonical filename is missing.
 *
 * Some Salamander distributions only ship a subset of velocity layers, or
 * use a single-velocity convention (e.g. `C4.wav`). The loader probes these
 * fallbacks in order.
 */
export function fallbackFilenames(ref: SampleRef): string[] {
  const noteName = midiToName(ref.recordedMidi);
  // Try other velocity layers near the requested one, then a no-velocity
  // single-layer fallback (`C4.ogg`).
  const layerOrder = nearbyVelocityLayers(ref.velocityLayer);
  const filenames = layerOrder
    .filter((l) => l !== ref.velocityLayer)
    .map((l) => `${noteName}v${l}.ogg`);
  filenames.push(`${noteName}.ogg`);
  return filenames;
}

/** Returns layers ordered by closeness to `target`, e.g. 8 -> [8,7,9,6,10,...]. */
function nearbyVelocityLayers(target: number): number[] {
  const order: number[] = [];
  for (let d = 0; d < VELOCITY_LAYERS; d += 1) {
    const up = target + d;
    const down = target - d;
    if (d === 0) {
      order.push(target);
    } else {
      if (up <= VELOCITY_LAYERS) order.push(up);
      if (down >= 1) order.push(down);
    }
  }
  return order;
}

function clamp(n: number, lo: number, hi: number): number {
  if (!Number.isFinite(n)) return lo;
  return Math.max(lo, Math.min(hi, n));
}
