"use client";

/**
 * Main page — composes the landing screen and the piano shell.
 *
 * View flow:
 *   - "home": the Landing intro (what/how/features). Engine NOT started here
 *     unless it already was — no caching/audio until the user enters.
 *   - "piano": the instrument. A home button returns to "home" without
 *     tearing down the audio engine, so re-entering is instant.
 */

import { useCallback, useEffect, useState } from "react";

import { Header } from "@/components/ui/Header";
import { Landing } from "@/components/ui/Landing";
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

type View = "home" | "piano";

export default function HomePage(): JSX.Element {
  const [view, setView] = useState<View>("home");
  const engineStatus = useAudioEngineStatus();

  useKeyboardInput();
  useSustainKey();

  // Arrow key controls for octave range (only matters on the piano view).
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
    setView("piano");
    void inputRouter.ensureEngineStarted();
    void requestMidi();
  }, []);

  const handleHome = useCallback(() => {
    // Release any held notes, but keep the engine warm for instant re-entry.
    inputRouter.releaseAll();
    setView("home");
  }, []);

  const showLoading =
    view === "piano" &&
    (engineStatus === "loading-samples" || engineStatus === "initializing");

  return (
    <main className="relative z-10 flex min-h-screen flex-col">
      <Header showHome={view === "piano"} onHome={handleHome} />

      {view === "home" ? (
        <section className="flex flex-1 items-start justify-center">
          <Landing onStart={handleStart} />
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
