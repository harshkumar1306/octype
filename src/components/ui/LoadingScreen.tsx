"use client";

/**
 * LoadingScreen — shown inline while core samples load.
 */

import { motion } from "framer-motion";

import { useSampleProgress } from "@/hooks/useAudioEngine";

export function LoadingScreen(): JSX.Element {
  const progress = useSampleProgress();
  const total = progress.total > 0 ? progress.total : 1;
  const ratio = Math.max(0, Math.min(1, progress.loaded / total));
  const percent = Math.round(ratio * 100);

  return (
    <div className="w-full max-w-sm space-y-5 px-6">
      <div className="space-y-1 text-center">
        <h2 className="font-mono text-base tracking-tight text-fg">
          octype
        </h2>
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-fg-subtle">
          loading core samples
        </p>
      </div>

      <div className="h-1 w-full overflow-hidden rounded-full bg-bg-elevated">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 26 }}
          className="h-full rounded-full bg-accent/80"
        />
      </div>

      <div className="flex items-center justify-between font-mono text-[11px] text-fg-subtle">
        <span>
          {progress.loaded}
          <span className="text-fg-subtle/60"> / </span>
          {progress.total}
        </span>
        <span>{percent}%</span>
      </div>
    </div>
  );
}
