"use client";

/**
 * Visualizer — a horizontal waveform line that oscillates in response to
 * the audio output. Highest amplitude in the center, tapering at edges.
 */

import { useEffect, useRef } from "react";

import { audioEngine } from "@/audio/engine/AudioEngine";
import { useAudioEngineStatus } from "@/hooks/useAudioEngine";

export function Visualizer(): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const status = useAudioEngineStatus();

  useEffect(() => {
    const analyser = audioEngine.getAnalyser();
    if (!analyser) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const draw = (): void => {
      animRef.current = requestAnimationFrame(draw);
      const c = canvas.getContext("2d");
      if (!c) return;

      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
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
      const mid = w / 2;

      for (let i = 0; i < points; i += 1) {
        const x = (i / points) * w;
        const sample = (dataArray[i * step] ?? 128) / 128.0;
        const deviation = (sample - 1.0) * (h / 2);

        // Window function: highest in center, tapering at edges.
        const t = i / points;
        const window = Math.sin(t * Math.PI); // 0 at edges, 1 at center
        const y = h / 2 + deviation * window;

        if (i === 0) c.moveTo(x, y);
        else c.lineTo(x, y);
      }
      c.stroke();
    };

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [status]);

  return (
    <canvas
      ref={canvasRef}
      className="mb-2 h-10 w-full"
      aria-hidden="true"
    />
  );
}
