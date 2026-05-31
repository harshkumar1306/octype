"use client";

/**
 * Recorder — captures the audio output and downloads as a WebM file.
 *
 * Connects a MediaStreamDestinationNode to the engine's analyser node
 * (which carries the full mixed signal). MediaRecorder captures the stream.
 */

import { useCallback, useRef, useState } from "react";

import { audioEngine } from "@/audio/engine/AudioEngine";
import { getAudioContext } from "@/audio/engine/AudioContext";
import { useAudioEngineStatus } from "@/hooks/useAudioEngine";

export function Recorder(): JSX.Element {
  const status = useAudioEngineStatus();
  const [recording, setRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const destRef = useRef<MediaStreamAudioDestinationNode | null>(null);

  const isReady = status === "ready" || status === "loading-samples";

  const startRecording = useCallback(() => {
    if (!isReady) return;
    const analyser = audioEngine.getAnalyser();
    if (!analyser) return;

    try {
      const ctx = getAudioContext().ctx;
      const dest = ctx.createMediaStreamDestination();
      analyser.connect(dest);
      destRef.current = dest;

      // Try opus first, fall back to default.
      let mimeType = "audio/webm;codecs=opus";
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = "audio/webm";
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = "";
      }

      const recorder = mimeType
        ? new MediaRecorder(dest.stream, { mimeType })
        : new MediaRecorder(dest.stream);

      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `octype-${Date.now()}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        try {
          analyser.disconnect(dest);
        } catch {
          // Ignore.
        }
        destRef.current = null;
      };

      // Request data every 250ms so we don't lose anything.
      recorder.start(250);
      recorderRef.current = recorder;
      setRecording(true);
    } catch {
      // Recording not supported.
    }
  }, [isReady]);

  const stopRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state === "recording") {
      recorder.stop();
    }
    recorderRef.current = null;
    setRecording(false);
  }, []);

  if (!isReady) return <></>;

  return (
    <button
      type="button"
      onClick={recording ? stopRecording : startRecording}
      className={[
        "rounded-md border px-2.5 py-1 font-mono text-xs transition-colors",
        recording
          ? "border-red-400/60 bg-red-400/10 text-red-400"
          : "border-bg-subtle bg-bg-elevated text-fg-muted hover:border-accent/30 hover:text-fg",
      ].join(" ")}
      title={recording ? "Stop recording and download" : "Start recording"}
    >
      {recording ? "⏹ stop & save" : "⏺ record"}
    </button>
  );
}
