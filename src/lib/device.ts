/**
 * Device capability helpers.
 *
 * Used to scale down expensive work (reverb tail length, visualizer cost,
 * key sizing) on phones and low-power machines. All checks are SSR-safe.
 */

/** True on touch-first / mobile devices. */
export function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent ?? "";
  const coarse =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(pointer: coarse)").matches;
  return /Android|iPhone|iPad|iPod|Mobile|Tablet/i.test(ua) || coarse;
}

/** True on devices likely to struggle with heavy audio DSP. */
export function isLowPowerDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const cores = navigator.hardwareConcurrency ?? 4;
  return isMobileDevice() || cores <= 4;
}
