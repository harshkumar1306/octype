/**
 * MetronomeEngine — lookahead-scheduled click track.
 *
 * Shares the singleton AudioContext with AudioEngine but maintains its own
 * independent signal chain. Never enters VoicePool, NoteVoice, or the piano
 * reverb/master/limiter path.
 *
 * Scheduling architecture (Wilson "A Tale of Two Clocks" pattern):
 *   - A 25ms setInterval pump calls scheduleAudio(), which looks ahead
 *     LOOKAHEAD_S (100ms) on the AudioContext timeline and pre-schedules beat
 *     OscillatorNodes. Audio timing is entirely AudioContext.currentTime — the
 *     setInterval is only the wakeup mechanism, not the time source.
 *   - A requestAnimationFrame loop checks which pre-scheduled beats have
 *     arrived (by comparing ctx.currentTime) and notifies UI subscribers.
 *     rAF may throttle in background tabs; audio continues unaffected because
 *     beats are already locked into the Web Audio timeline.
 *
 * No accumulated drift: nextBeatTime advances monotonically in ctx-time units
 * independent of wall-clock jitter. BPM changes take effect on the first beat
 * not yet scheduled (within one LOOKAHEAD window).
 *
 * Signal chain (bypasses piano chain entirely):
 *   OscillatorNode (per beat, ephemeral)
 *     → MetronomeGainNode (metronome volume)
 *       → ctx.destination          (always)
 *       → AnalyserNode (optional)  (when recordMetronome is enabled)
 */

import { logger } from "@/lib/logger";
import { useMetronomeStore } from "@/stores/metronomeStore";
import type { TimeSignature } from "@/stores/metronomeStore";

/** How far ahead to schedule beats into the Web Audio timeline (seconds). */
const LOOKAHEAD_S = 0.1;

/** setInterval wake-up interval for the scheduling pump (ms). */
const PUMP_INTERVAL_MS = 25;

/** Accent beat (beat 0 of each measure): higher pitch, higher gain. */
const ACCENT_HZ = 880;
const ACCENT_GAIN = 0.55;

/** Sub-beat: lower pitch, lower gain. */
const BEAT_HZ = 660;
const BEAT_GAIN = 0.3;

/** Duration of the click envelope (seconds). */
const CLICK_DURATION_S = 0.025;

type BeatListener = (beat: number) => void;

interface ScheduledBeat {
  /** AudioContext time at which this beat fires. */
  time: number;
  /** 0-based index within the measure. */
  beatIndex: number;
}

function getBeatsPerMeasure(sig: TimeSignature): number {
  if (sig === "2/4") return 2;
  if (sig === "3/4") return 3;
  if (sig === "6/8") return 6;
  return 4; // "4/4"
}

class MetronomeEngineImpl {
  private ctx: AudioContext | null = null;
  private outputGain: GainNode | null = null;

  /** True between start() and stop() calls. Also true while ctx is suspended. */
  private running = false;

  /** Interval handle for the scheduling pump. */
  private pumpHandle: ReturnType<typeof setInterval> | null = null;
  /** rAF handle for the visual notification loop. */
  private rafId: number | null = null;

  /** Next beat's scheduled AudioContext time. */
  private nextBeatTime = 0;
  /** 0-based index of the next beat within the current measure. */
  private currentBeat = 0;
  /** Beats that have been audio-scheduled but not yet visually fired. */
  private pendingVisual: ScheduledBeat[] = [];

  /** Oscillator nodes that are currently active or pre-scheduled. */
  private activeOscillators = new Set<OscillatorNode>();

  /**
   * Last stable snapshot returned from getBeatSnapshot().
   * Identity only changes when beat, beats, or playing changes.
   */
  private beatSnapshot: Readonly<{ beat: number; beats: number; playing: boolean }> = {
    beat: 0,
    beats: 4,
    playing: false,
  };

  private beatListeners = new Set<BeatListener>();
  private unsubStore: (() => void) | null = null;
  private removeStateChangeListener: (() => void) | null = null;

  // ─── Public API ────────────────────────────────────────────────────────────

  /**
   * Subscribe to beat-tick events. The callback fires each time the engine
   * visually confirms a beat (based on AudioContext.currentTime).
   * Used by the useMetronomeBeat() hook via useSyncExternalStore.
   */
  subscribe(fn: BeatListener): () => void {
    this.beatListeners.add(fn);
    return () => {
      this.beatListeners.delete(fn);
    };
  }

  /**
   * Returns the current beat snapshot. Referentially stable — only a new
   * object identity is returned when beat, beats, or playing actually changes.
   * Safe to pass directly to useSyncExternalStore getSnapshot.
   */
  getBeatSnapshot(): Readonly<{ beat: number; beats: number; playing: boolean }> {
    return this.beatSnapshot;
  }

  /**
   * Initialize with the shared AudioContext. Must be called after the
   * AudioEngine has started (which creates the context via a user gesture).
   * Idempotent — safe to call multiple times with the same context.
   */
  init(ctx: AudioContext): void {
    if (this.ctx === ctx) return; // Already initialized with this context.
    this.teardown(); // Clean up any previous context.

    this.ctx = ctx;

    // Build the metronome output gain node — separate from the piano chain.
    const gain = ctx.createGain();
    gain.gain.value = useMetronomeStore.getState().volume;
    gain.connect(ctx.destination);
    this.outputGain = gain;

    // Live-sync settings imperatively (no React in the hot path).
    this.unsubStore = useMetronomeStore.subscribe((s, prev) => {
      if (!this.ctx || !this.outputGain) return;

      // Volume: smooth ramp.
      if (s.volume !== prev.volume) {
        this.outputGain.gain.setTargetAtTime(s.volume, this.ctx.currentTime, 0.02);
      }

      // BPM change: dynamically adjust nextBeatTime to avoid transition lag.
      if (s.bpm !== prev.bpm && this.running && this.ctx) {
        const oldInterval = 60 / prev.bpm;
        const newInterval = 60 / s.bpm;
        const lastBeat = this.nextBeatTime - oldInterval;
        this.nextBeatTime = lastBeat + newInterval;
        if (this.nextBeatTime < this.ctx.currentTime) {
          this.nextBeatTime = this.ctx.currentTime;
        }
      }

      // Time-signature change: reset beat counter and flush pending visual queue
      // so the next scheduled beat is correctly beat 0 of the new measure.
      if (s.timeSignature !== prev.timeSignature && this.running && this.ctx) {
        this.currentBeat = 0;
        this.pendingVisual = [];
        // Re-anchor nextBeatTime to prevent scheduling a burst of missed beats.
        this.nextBeatTime = this.ctx.currentTime;
      }
    });

    // Re-start the scheduler when the AudioContext resumes from suspension
    // (e.g. after a tab switch, mobile lock screen, or policy-forced suspend).
    const onStateChange = (): void => {
      if (this.ctx?.state === "running" && this.running && this.pumpHandle === null) {
        // Re-anchor so we don't try to schedule a backlog of missed beats.
        this.nextBeatTime = this.ctx.currentTime;
        this.pendingVisual = [];
        this.startScheduler();
      }
    };
    ctx.addEventListener("statechange", onStateChange);
    this.removeStateChangeListener = () =>
      ctx.removeEventListener("statechange", onStateChange);

    logger.debug("MetronomeEngine: initialized");
  }

  /**
   * Connect (or disconnect) the metronome output to an AnalyserNode so beats
   * are captured in recordings. Call with null to remove the recording tap.
   *
   * The metronome always routes to ctx.destination. When analyser is non-null,
   * it is additionally routed there (dry, no reverb — standard for click tracks).
   */
  setRecordingAnalyser(analyser: AnalyserNode | null): void {
    if (!this.outputGain || !this.ctx) return;
    // Disconnect everything, then reconnect selectively.
    try {
      this.outputGain.disconnect();
    } catch {
      // Ignore if already disconnected.
    }
    this.outputGain.connect(this.ctx.destination);
    if (analyser) {
      this.outputGain.connect(analyser);
    }
  }

  /**
   * Start the metronome. If the AudioContext is currently suspended, the
   * running intent is recorded and the scheduler starts automatically when
   * the context resumes (via the statechange listener installed in init()).
   */
  start(): void {
    if (this.running) return;
    if (!this.ctx) return;

    this.running = true;
    this.currentBeat = 0;
    this.pendingVisual = [];

    if (this.ctx.state === "running") {
      this.nextBeatTime = this.ctx.currentTime;
      this.startScheduler();
    }
    // If ctx is suspended, statechange handler calls startScheduler() on resume.

    this.updateSnapshot(0, true);
    logger.debug("MetronomeEngine: started");
  }

  /** Stop the metronome and clean up the scheduling loops. */
  stop(): void {
    if (!this.running) return;
    this.running = false;
    this.stopScheduler();
    
    // Immediately stop any pre-scheduled oscillators to prevent trailing clicks.
    const now = this.ctx ? this.ctx.currentTime : 0;
    for (const osc of this.activeOscillators) {
      try {
        osc.stop(now);
        osc.disconnect();
      } catch {
        // Ignore.
      }
    }
    this.activeOscillators.clear();

    this.pendingVisual = [];
    this.currentBeat = 0;
    this.updateSnapshot(0, false);
    logger.debug("MetronomeEngine: stopped");
  }

  /** Dispose — call on application shutdown. */
  dispose(): void {
    this.teardown();
  }

  // ─── Private ───────────────────────────────────────────────────────────────

  private teardown(): void {
    this.stop();
    this.unsubStore?.();
    this.unsubStore = null;
    this.removeStateChangeListener?.();
    this.removeStateChangeListener = null;
    try {
      this.outputGain?.disconnect();
    } catch {
      // Ignore.
    }
    this.outputGain = null;
    this.ctx = null;
  }

  private startScheduler(): void {
    if (this.pumpHandle !== null) return; // Already running.

    // Audio scheduling pump — wakes every 25ms to pre-fill the lookahead window.
    // setInterval is the PUMP, not the timer. Actual beat timing is ctx.currentTime.
    this.pumpHandle = setInterval(() => {
      this.scheduleAudio();
    }, PUMP_INTERVAL_MS);

    // rAF loop for visual beat notification.
    this.startRaf();
  }

  private stopScheduler(): void {
    if (this.pumpHandle !== null) {
      clearInterval(this.pumpHandle);
      this.pumpHandle = null;
    }
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /**
   * Called every PUMP_INTERVAL_MS. Schedules any beats that fall within the
   * next LOOKAHEAD_S seconds of the AudioContext timeline.
   */
  private scheduleAudio(): void {
    if (!this.ctx || !this.running || !this.outputGain) return;
    if (this.ctx.state !== "running") return;

    const now = this.ctx.currentTime;
    const { bpm, timeSignature } = useMetronomeStore.getState();
    const beatsPerMeasure = getBeatsPerMeasure(timeSignature);
    const secondsPerBeat = 60 / bpm;

    // Clamp in case time signature changed (reduces beatsPerMeasure).
    if (this.currentBeat >= beatsPerMeasure) {
      this.currentBeat = this.currentBeat % beatsPerMeasure;
    }

    while (this.nextBeatTime < now + LOOKAHEAD_S) {
      const isAccent = this.currentBeat === 0;
      this.scheduleClick(this.nextBeatTime, isAccent);
      this.pendingVisual.push({
        time: this.nextBeatTime,
        beatIndex: this.currentBeat,
      });
      this.currentBeat = (this.currentBeat + 1) % beatsPerMeasure;
      this.nextBeatTime += secondsPerBeat;
    }
  }

  /**
   * rAF loop: checks AudioContext.currentTime against pendingVisual, fires
   * visual notifications for beats whose time has arrived. When the tab
   * returns from the background, multiple stale beats may be present — only
   * the most recent one fires to avoid visual flicker.
   */
  private startRaf(): void {
    const tick = (): void => {
      if (!this.running || !this.ctx) return;
      const now = this.ctx.currentTime;

      // Drain all past beats; only notify on the final (most recent) one.
      let lastFired: ScheduledBeat | undefined;
      while (this.pendingVisual.length > 0) {
        const next = this.pendingVisual[0];
        if (next === undefined) break;
        if (now >= next.time) {
          lastFired = next;
          this.pendingVisual.shift();
        } else {
          break;
        }
      }
      if (lastFired !== undefined) {
        this.updateSnapshot(lastFired.beatIndex, true);
      }

      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  /**
   * Creates a single OscillatorNode click at the given AudioContext time.
   * Nodes are ephemeral — created per beat, self-disconnect on ended.
   */
  private scheduleClick(when: number, isAccent: boolean): void {
    if (!this.ctx || !this.outputGain) return;
    const ctx = this.ctx;
    const out = this.outputGain;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.value = isAccent ? ACCENT_HZ : BEAT_HZ;

    // Short linear attack + exponential decay — clean click with no pop.
    gain.gain.setValueAtTime(0, when);
    gain.gain.linearRampToValueAtTime(isAccent ? ACCENT_GAIN : BEAT_GAIN, when + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.001, when + CLICK_DURATION_S);

    osc.connect(gain);
    gain.connect(out);

    osc.start(when);
    osc.stop(when + CLICK_DURATION_S + 0.005);

    this.activeOscillators.add(osc);

    // Self-clean on ended — nodes are never reused (Web Audio best practice).
    osc.onended = () => {
      this.activeOscillators.delete(osc);
      try {
        osc.disconnect();
      } catch {
        // Ignore.
      }
      try {
        gain.disconnect();
      } catch {
        // Ignore.
      }
    };
  }

  /**
   * Updates the beat snapshot and notifies all subscribers.
   * Referentially stable: a new object is only created when values change.
   */
  private updateSnapshot(beat: number, playing = true): void {
    const { timeSignature } = useMetronomeStore.getState();
    const beats = getBeatsPerMeasure(timeSignature);
    if (
      this.beatSnapshot.beat !== beat ||
      this.beatSnapshot.beats !== beats ||
      this.beatSnapshot.playing !== playing
    ) {
      this.beatSnapshot = { beat, beats, playing };
      for (const fn of this.beatListeners) fn(beat);
    }
  }
}

export const metronomeEngine = new MetronomeEngineImpl();
export type MetronomeEngine = MetronomeEngineImpl;
