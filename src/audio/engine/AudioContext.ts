/**
 * AudioContext lifecycle.
 *
 * Browsers require a user gesture to actually start audio. We lazily create
 * the context on first request, then call `resume()` from within the gesture
 * handler so future schedule operations work at the lowest available latency.
 */

export interface AudioContextHandle {
  ctx: AudioContext;
  /** Calls ctx.resume() if the context isn't running yet. */
  ensureRunning: () => Promise<void>;
}

let cached: AudioContextHandle | null = null;

interface AudioContextLike {
  new (options?: AudioContextOptions): AudioContext;
}

interface WindowWithLegacyAudioContext extends Window {
  webkitAudioContext?: AudioContextLike;
}

/**
 * Returns the singleton AudioContext, creating it on first call.
 * Must be invoked from a user gesture for `ensureRunning()` to succeed.
 */
export function getAudioContext(): AudioContextHandle {
  if (cached) return cached;
  if (typeof window === "undefined") {
    throw new Error("AudioContext can only be created in the browser.");
  }

  const Ctor: AudioContextLike | undefined =
    window.AudioContext ??
    (window as WindowWithLegacyAudioContext).webkitAudioContext;
  if (!Ctor) throw new Error("Web Audio API not supported in this browser.");

  const ctx = new Ctor({ latencyHint: "interactive" });

  cached = {
    ctx,
    ensureRunning: async () => {
      if (ctx.state !== "running") {
        await ctx.resume();
      }
    },
  };
  return cached;
}
