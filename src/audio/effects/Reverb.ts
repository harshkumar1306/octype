/**
 * Reverb — synthetic impulse-response reverb.
 *
 * Phase 4 improves the IR to sound more like a concert hall:
 *   - Longer tail (3.2s)
 *   - Early reflections (first 80ms) with distinct taps
 *   - Exponential decay with slight high-frequency damping
 *   - Stereo decorrelation (independent noise per channel)
 *
 * A real convolution IR from a recorded space would be even better, but
 * this synthetic approach avoids shipping a large binary asset and still
 * sounds convincingly "roomy" for a piano.
 */

export interface ReverbNodes {
  input: AudioNode;
  output: AudioNode;
  setEnabled: (enabled: boolean) => void;
  setAmount: (amount: number) => void;
}

/** Builds a wet/dry reverb chain with a synthetic concert-hall IR. */
export function createReverb(ctx: AudioContext): ReverbNodes {
  const input = ctx.createGain();
  const dry = ctx.createGain();
  const wet = ctx.createGain();
  const convolver = ctx.createConvolver();
  const output = ctx.createGain();

  convolver.buffer = makeConcertHallIr(ctx);

  input.connect(dry);
  input.connect(convolver);
  convolver.connect(wet);
  dry.connect(output);
  wet.connect(output);

  let enabled = true;
  let amount = 0.25;
  applyMix();

  function applyMix(): void {
    const w = enabled ? amount : 0;
    wet.gain.value = w;
    dry.gain.value = 1 - w * 0.35;
  }

  return {
    input,
    output,
    setEnabled(v) {
      enabled = v;
      applyMix();
    },
    setAmount(v) {
      amount = clamp01(v);
      applyMix();
    },
  };
}

function makeConcertHallIr(ctx: AudioContext): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const duration = 3.2;
  const length = Math.floor(sampleRate * duration);
  const buf = ctx.createBuffer(2, length, sampleRate);

  for (let ch = 0; ch < 2; ch += 1) {
    const data = buf.getChannelData(ch);

    // Early reflections: a few discrete taps in the first 80ms.
    const earlyEnd = Math.floor(sampleRate * 0.08);
    const taps = [0.012, 0.024, 0.037, 0.052, 0.068, 0.078];
    for (const tapTime of taps) {
      const idx = Math.floor(tapTime * sampleRate);
      if (idx < earlyEnd) {
        const amp = 0.4 * (1 - tapTime / 0.08);
        // Slightly different per channel for stereo width.
        data[idx] = amp * (0.7 + Math.random() * 0.3) * (ch === 0 ? 1 : -1);
      }
    }

    // Late diffuse tail: exponentially decaying noise with HF damping.
    const decay = 2.8;
    const hfDamping = 0.7; // lower = more HF loss over time
    let prev = 0;
    for (let i = earlyEnd; i < length; i += 1) {
      const t = i / length;
      const envelope = (1 - t) ** decay;
      const noise = Math.random() * 2 - 1;
      // Simple one-pole lowpass for HF damping that increases over time.
      const lpCoeff = hfDamping + (1 - hfDamping) * (1 - t);
      const filtered = prev + lpCoeff * (noise - prev);
      prev = filtered;
      data[i] = (data[i] ?? 0) + filtered * envelope * 0.35;
    }
  }

  return buf;
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}
