"use client";

/**
 * PianoKeyboard — the main keyboard component.
 *
 * Phase 4 adds:
 *   - Touch support via pointer events (works on mobile + desktop).
 *   - Glissando: dragging a pointer across keys triggers noteOn/noteOff
 *     as the pointer crosses key boundaries.
 *   - `touch-action: none` prevents browser scroll/zoom while playing.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useBindingsByOffset } from "@/hooks/useKeyMapping";
import { buildKeyRange, isBlackKey } from "@/lib/noteUtils";
import { mouseInput } from "@/systems/input/MouseInput";
import { usePianoStore } from "@/stores/pianoStore";
import { PianoKey } from "@/components/piano/PianoKey";
import type { PianoKeyDescriptor } from "@/types/piano";

const HEIGHT_RATIO = 0.18;
const MIN_HEIGHT = 160;
const MAX_HEIGHT = 280;
const BLACK_WIDTH_RATIO = 0.58;
const BLACK_HEIGHT_RATIO = 0.62;

export function PianoKeyboard(): JSX.Element {
  const startMidi = usePianoStore((s) => s.startMidi);
  const octaves = usePianoStore((s) => s.octaves);
  const showKeyLabels = usePianoStore((s) => s.showKeyLabels);
  const showNoteNames = usePianoStore((s) => s.showNoteNames);
  const bindingsByOffset = useBindingsByOffset();

  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number>(0);

  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setWidth(entry.contentRect.width);
    });
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  // Clear active pointers on window blur / visibility change to prevent stuck keys.
  useEffect(() => {
    const handleReset = (): void => {
      activePointers.current.clear();
    };
    window.addEventListener("blur", handleReset);
    document.addEventListener("visibilitychange", handleReset);
    return () => {
      window.removeEventListener("blur", handleReset);
      document.removeEventListener("visibilitychange", handleReset);
    };
  }, []);

  const layout = useMemo(() => {
    const endMidi = startMidi + octaves * 12;
    const keys = buildKeyRange(startMidi, endMidi);
    const whiteCount = keys.filter((k) => k.color === "white").length;
    return { keys, whiteCount, startMidi, endMidi };
  }, [startMidi, octaves]);

  const whiteWidth = width > 0 && layout.whiteCount > 0 ? width / layout.whiteCount : 0;
  const height = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, width * HEIGHT_RATIO));

  const positioned = useMemo(() => {
    let lastWhiteIndex = 0;
    return layout.keys.map((k) => {
      if (k.color === "white") {
        lastWhiteIndex = k.whiteIndex;
        return { key: k, left: k.whiteIndex * whiteWidth };
      }
      return { key: k, left: lastWhiteIndex * whiteWidth };
    });
  }, [layout.keys, whiteWidth]);

  // Glissando state: track which MIDI note each pointer is currently over.
  const activePointers = useRef<Map<number, number>>(new Map());

  /** Given a pointer position relative to the container, find which key it's over. */
  const hitTest = useCallback(
    (clientX: number, clientY: number): PianoKeyDescriptor | null => {
      const el = containerRef.current;
      if (!el || whiteWidth === 0) return null;
      const rect = el.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      if (x < 0 || x > rect.width || y < 0 || y > rect.height) return null;

      // Check black keys first (they overlay white keys).
      const blackH = height * BLACK_HEIGHT_RATIO;
      if (y <= blackH) {
        for (const { key, left } of positioned) {
          if (key.color !== "black") continue;
          const bw = whiteWidth * BLACK_WIDTH_RATIO;
          const bLeft = left + whiteWidth - bw / 2;
          if (x >= bLeft && x <= bLeft + bw) return key;
        }
      }

      // White key: simple division.
      const whiteIndex = Math.floor(x / whiteWidth);
      const whiteKeys = positioned.filter((p) => p.key.color === "white");
      const hit = whiteKeys[whiteIndex];
      return hit?.key ?? null;
    },
    [positioned, whiteWidth, height],
  );

  const onPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      containerRef.current?.setPointerCapture(event.pointerId);
      const key = hitTest(event.clientX, event.clientY);
      if (!key) return;
      const rect = containerRef.current?.getBoundingClientRect();
      const relY = rect ? (event.clientY - rect.top) / height : 0.6;
      activePointers.current.set(event.pointerId, key.midi);
      mouseInput.press(key.midi, relY);
    },
    [hitTest, height],
  );

  const onPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const prevMidi = activePointers.current.get(event.pointerId);
      if (prevMidi === undefined) return; // not tracking this pointer
      const key = hitTest(event.clientX, event.clientY);
      const newMidi = key?.midi ?? null;
      if (newMidi === prevMidi) return; // still on the same key
      // Release old, press new (glissando).
      if (prevMidi !== null) mouseInput.release(prevMidi);
      if (newMidi !== null && key) {
        const rect = containerRef.current?.getBoundingClientRect();
        const relY = rect ? (event.clientY - rect.top) / height : 0.6;
        activePointers.current.set(event.pointerId, newMidi);
        mouseInput.press(newMidi, relY);
      } else {
        activePointers.current.delete(event.pointerId);
      }
    },
    [hitTest, height],
  );

  const onPointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const midi = activePointers.current.get(event.pointerId);
      activePointers.current.delete(event.pointerId);
      if (midi !== undefined) mouseInput.release(midi);
      if (containerRef.current?.hasPointerCapture(event.pointerId)) {
        containerRef.current.releasePointerCapture(event.pointerId);
      }
    },
    [],
  );

  const onPointerCancel = onPointerUp;

  // The mapping base is the live anchor in the piano store (moves with
  // shiftOctave, independent of how many octaves are visible).
  const mappingBaseMidi = usePianoStore((s) => s.mappingBaseMidi);

  return (
    <div
      ref={containerRef}
      className="relative w-full select-none"
      style={{ height, touchAction: "none" }}
      role="application"
      aria-label="Virtual piano keyboard"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      {whiteWidth > 0 &&
        positioned.map(({ key, left }) => {
          const offset = key.midi - mappingBaseMidi;
          const binding = bindingsByOffset.get(offset);
          return (
            <PianoKey
              key={key.midi}
              descriptor={key}
              whiteWidth={whiteWidth}
              height={height}
              left={left}
              keyLabel={showKeyLabels ? binding?.label : undefined}
              showNoteName={showNoteNames && !isBlackKey(key.midi)}
            />
          );
        })}
    </div>
  );
}
