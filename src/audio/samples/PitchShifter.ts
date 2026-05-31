/**
 * PitchShifter — pure helper for converting semitone offsets into
 * `AudioBufferSourceNode.playbackRate` values.
 *
 * playbackRate = 2^(semitoneOffset / 12)
 *
 * Per the spec we never pitch-shift more than ±2 semitones. Salamander's
 * 3-semitone recording spacing means our largest offset is ±1 in practice,
 * but we clamp defensively.
 */

const MAX_ABS_SEMITONES = 2;

/** Returns the playbackRate for the given semitone offset. */
export function playbackRateFor(semitoneOffset: number): number {
  const clamped = Math.max(
    -MAX_ABS_SEMITONES,
    Math.min(MAX_ABS_SEMITONES, semitoneOffset),
  );
  return 2 ** (clamped / 12);
}
