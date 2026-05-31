"use client";

/**
 * Visualizer — a horizontal waveform line that oscillates in response to
 * the audio output. Highest amplitude in the center, tapering at edges.
 *
 * Mobile/perf considerations:
 *   - Pauses the rAF loop when the tab is hidden (saves battery).
 *   - Throttles to ~30fps and caps device-pixel-ratio on low-power devices
 *     so the canvas redraw doesn't compete with audio for CPU.
 */

import { useEffect, useRef } from "react";

import { audioEngine } from "@/audio/engine/AudioEngine";
import { useAudioEngineStatus } from "@/hooks/useAudioEngine";
import { isLowPowerDevice } from "@/lib/device";

export function Visualizer(): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const status = useAudioEngineStatus();

  useEffect(() => {
    const analyser = audioEngine.getAnalyser();
    if (!analyser) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const lowPower = isLowPowerDevice();
    const maxDpr = lowPower ? 1 : 2;
    const frameInterval = lowPower ? 1000 / 30 : 0; // throttle to 30fps on mobile
    let lastFrame = 0;
    let running = true;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const draw = (now: number): void => {
      if (!running) return;
      animRef.current = requestAnimationFrame(draw);

      // Throttle on low-power devices.
      if (frameInterval > 0 && now - lastFrame < frameInterval) return;
      lastFrame = now;

      const c = canvas.getContext("2d");
      if (!c) return;

      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
      const w = Math.floor(rect.width * dpr);
      const h = Math.floor(rect.height * dpr);

      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }

      c.clearRect(0, 0, w, h);
      analyser.getByteTimeDomainData(dataArray);

      c.lineWidth = 1.5 * dpr;
      c.strokeStyle = "rgba(167, 139, 250, 0.6)";
      c.beginPath();

      const points = Math.min(dataArray.length, Math.floor(w / 2));
      const step = Math.max(1, Math.floor(dataArray.length / points));

      for (let i = 0; i < points; i += 1) {
        const x = (i / points) * w;
        const sample = (dataArray[i * step] ?? 128) / 128.0;
        const deviation = (sample - 1.0) * (h / 2);

        // Window function: highest in center, tapering at edges.
        const t = i / points;
        const windowAmp = Math.sin(t * Math.PI);
        const y = h / 2 + deviation * windowAmp;

        if (i === 0) c.moveTo(x, y);
        else c.lineTo(x, y);
      }
      c.stroke();
    };

    const onVisibility = (): void => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(animRef.current);
      } else if (!running) {
        running = true;
        animRef.current = requestAnimationFrame(draw);
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    animRef.current = requestAnimationFrame(draw);

    return () => {
      running = false;
      cancelAnimationFrame(animRef.current);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [status]);

  return (
    <canvas
      ref={canvasRef}
      className="mb-2 h-8 w-full sm:h-10"
      aria-hidden="true"
    />
  );
}
