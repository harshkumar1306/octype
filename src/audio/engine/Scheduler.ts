/**
 * Scheduler — small helper for converting "now" + a latency offset into an
 * AudioContext schedule time.
 *
 * Phase 2 doesn't need lookahead playback (we trigger immediately on key
 * events). The full Scheduler with lookahead lands in Phase 4 if needed
 * (e.g. for arpeggiation / playback features).
 */

export function scheduleAt(ctxTime: number, latencyOffsetMs: number): number {
  const offset = Math.max(-0.05, Math.min(0.1, latencyOffsetMs / 1000));
  return ctxTime + Math.max(0, offset);
}
