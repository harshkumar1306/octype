/**
 * Pre-computed frequency table for MIDI notes 0..127.
 *
 * frequency = 440 * 2^((midi - 69) / 12)
 * MIDI 69 = A4 = 440 Hz.
 */

const TABLE: readonly number[] = (() => {
  const arr = new Array<number>(128);
  for (let m = 0; m < 128; m += 1) {
    arr[m] = 440 * 2 ** ((m - 69) / 12);
  }
  return arr;
})();

/** Returns the frequency in Hz for the given MIDI note (0..127). */
export function midiToFrequency(midi: number): number {
  if (midi < 0 || midi > 127) {
    return 440 * 2 ** ((midi - 69) / 12);
  }
  return TABLE[midi] ?? 440;
}
