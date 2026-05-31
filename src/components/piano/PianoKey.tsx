"use client";

/**
 * PianoKey — single white or black key (visual only).
 *
 * Phase 4: pointer events are handled at the PianoKeyboard container level
 * (for glissando / touch support). PianoKey is now purely a visual component
 * that subscribes to its own active state for the press animation.
 */

import { motion } from "framer-motion";
import { memo } from "react";

import { useIsNoteActive } from "@/hooks/useNoteVisuals";
import type { PianoKeyDescriptor } from "@/types/piano";

interface PianoKeyProps {
  descriptor: PianoKeyDescriptor;
  whiteWidth: number;
  height: number;
  left: number;
  keyLabel?: string;
  showNoteName: boolean;
}

const WHITE_HEIGHT_RATIO = 1;
const BLACK_HEIGHT_RATIO = 0.62;
const BLACK_WIDTH_RATIO = 0.58;

function PianoKeyComponent({
  descriptor,
  whiteWidth,
  height,
  left,
  keyLabel,
  showNoteName,
}: PianoKeyProps): JSX.Element {
  const isActive = useIsNoteActive(descriptor.midi);
  const isWhite = descriptor.color === "white";

  if (isWhite) {
    const w = whiteWidth;
    const h = height * WHITE_HEIGHT_RATIO;
    return (
      <motion.div
        aria-label={`Piano key ${descriptor.name}`}
        animate={{ y: isActive ? 2 : 0 }}
        transition={{ type: "spring", stiffness: 1200, damping: 50, mass: 0.4 }}
        className={[
          "absolute z-0 select-none rounded-b-md border border-key-whiteEdge",
          "shadow-keyWhite",
          "transition-colors duration-75",
          isActive
            ? "bg-gradient-to-b from-key-whiteActive to-[#b9a8e6]"
            : "bg-gradient-to-b from-key-white to-[#e7e5e4]",
        ].join(" ")}
        style={{ left, top: 0, width: w, height: h }}
      >
        <KeyTextLayer
          isWhite
          label={keyLabel}
          noteName={showNoteName ? descriptor.name : undefined}
        />
      </motion.div>
    );
  }

  // Black key
  const w = whiteWidth * BLACK_WIDTH_RATIO;
  const h = height * BLACK_HEIGHT_RATIO;
  const blackLeft = left + whiteWidth - w / 2;
  return (
    <motion.div
      aria-label={`Piano key ${descriptor.name}`}
      animate={{ y: isActive ? 1.5 : 0 }}
      transition={{ type: "spring", stiffness: 1200, damping: 50, mass: 0.4 }}
      className={[
        "absolute z-10 select-none rounded-b-[4px]",
        "border border-key-blackEdge",
        "shadow-keyBlack",
        "transition-colors duration-75",
        isActive
          ? "bg-gradient-to-b from-key-blackActive to-[#39305a]"
          : "bg-gradient-to-b from-key-black to-[#0c0c0e]",
      ].join(" ")}
      style={{ left: blackLeft, top: 0, width: w, height: h }}
    >
      <KeyTextLayer
        isWhite={false}
        label={keyLabel}
        noteName={showNoteName ? descriptor.name : undefined}
      />
    </motion.div>
  );
}

interface KeyTextLayerProps {
  isWhite: boolean;
  label: string | undefined;
  noteName: string | undefined;
}

function KeyTextLayer({ isWhite, label, noteName }: KeyTextLayerProps): JSX.Element {
  return (
    <div className="pointer-events-none flex h-full w-full flex-col items-center justify-end pb-2">
      {label !== undefined && (
        <span
          className={[
            "font-mono text-[11px] font-medium tracking-wide",
            isWhite ? "text-fg-subtle" : "text-fg-muted",
          ].join(" ")}
        >
          {label}
        </span>
      )}
      {noteName !== undefined && (
        <span
          className={[
            "mt-1 font-mono text-[10px]",
            isWhite ? "text-fg-subtle" : "text-fg-muted/70",
          ].join(" ")}
        >
          {noteName}
        </span>
      )}
    </div>
  );
}

export const PianoKey = memo(PianoKeyComponent);
