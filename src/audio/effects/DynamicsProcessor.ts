/**
 * DynamicsProcessor — Phase 4 polish.
 *
 * For Phase 2 we expose a small helper that creates a gentle limiter so the
 * master bus never clips when many voices stack.
 */

export function createMasterLimiter(ctx: AudioContext): DynamicsCompressorNode {
  const comp = ctx.createDynamicsCompressor();
  // Gentle "brick wall" — leave headroom so the piano can sound loud without
  // the limiter visibly squashing transients.
  comp.threshold.value = -1;
  comp.knee.value = 6;
  comp.ratio.value = 12;
  comp.attack.value = 0.002;
  comp.release.value = 0.18;
  return comp;
}
