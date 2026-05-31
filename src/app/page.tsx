"use client";

/**
 * Main page — composes the piano UI shell.
 *
 * Phase 4: dedicated "Start Piano" button triggers engine init.
 * Arrow keys control octave range (left/right = shift, up/down = resize).
 */

import { useCallback, useEffect, useState } from "react";

import { Header } from "@/components/ui/Header";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { StatusBar } from "@/components/ui/StatusBar";
import { PianoKeyboard } from "@/components/piano/PianoKeyboard";
import { OctaveRange } from "@/components/piano/OctaveRange";
import { KeyLabelToggle } from "@/components/piano/KeyLabel";
import { Visualizer } from "@/components/piano/Visualizer";
import { Recorder } from "@/components/piano/Recorder";
import { SettingsPanel } from "@/components/settings/SettingsPanel";
import { useKeyboardInput } from "@/hooks/useKeyboardInput";
import { useAudioEngineStatus } from "@/hooks/useAudioEngine";
import { requestMidi } from "@/hooks/useMidi";
import { useSustainKey } from "@/hooks/useSustainKey";
import { usePianoStore } from "@/stores/pianoStore";
import { inputRouter } from "@/systems/input/InputRouter";

export default function HomePage(): JSX.Element {
  const [started, setStarted] = useState(false);
  const engineStatus = useAudioEngineStatus();

  useKeyboardInput();
  useSustainKey();

  // Arrow key controls for octave range.
  useEffect(() => {
    const handler = (e: KeyboardEvent): void => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const store = usePianoStore.getState();
      switch (e.code) {
        case "ArrowLeft":
          e.preventDefault();
          store.shiftOctave(-1);
          break;
        case "ArrowRight":
          e.preventDefault();
          store.shiftOctave(1);
          break;
        case "ArrowUp":
          e.preventDefault();
          store.setOctaves(store.octaves + 1);
          break;
        case "ArrowDown":
          e.preventDefault();
          store.setOctaves(store.octaves - 1);
          break;
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const handleStart = useCallback(() => {
    setStarted(true);
    void inputRouter.ensureEngineStarted();
    void requestMidi();
  }, []);

  const showStartScreen = !started && engineStatus === "idle";
  const showLoading = started && (engineStatus === "loading-samples" || engineStatus === "initializing");

  return (
    <main className="relative z-10 flex min-h-screen flex-col">
      <Header />

      {showStartScreen ? (
        <section className="flex flex-1 items-center justify-center px-4">
          <div className="text-center">
            <h2 className="mb-2 font-mono text-lg text-fg">octype</h2>
            <p className="mb-6 font-mono text-xs text-fg-subtle">
              browser-based virtual piano
            </p>
            <button
              type="button"
              onClick={handleStart}
              className="rounded-lg border border-accent/50 bg-accent/10 px-8 py-3 font-mono text-sm text-accent-soft transition-all hover:border-accent hover:bg-accent/20 hover:shadow-[0_0_20px_rgba(167,139,250,0.15)]"
            >
              start piano
            </button>
          </div>
        </section>
      ) : showLoading ? (
        <section className="flex flex-1 items-center justify-center px-4">
          <LoadingScreen />
        </section>
      ) : (
        <section className="flex flex-1 items-center justify-center px-2 sm:px-4">
          <div className="w-full max-w-[98vw]">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2 px-1">
              <KeyLabelToggle />
              <Recorder />
            </div>

            <div className="rounded-xl border border-bg-subtle bg-bg-elevated/60 p-2 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)] sm:p-4">
              <Visualizer />
              <PianoKeyboard />
              <OctaveRange />
            </div>
          </div>
        </section>
      )}

      <StatusBar />
      <SettingsPanel />
    </main>
  );
}
