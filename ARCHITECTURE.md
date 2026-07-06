# Octype — Architecture & Complete Context

> A production-grade, browser-based virtual piano using the **Salamander Grand Piano** sample library. This document is the single source of truth for understanding the system end-to-end. It is written so that another developer or AI model can pick up the project with full context.

---

## 1. What Octype Is

Octype is a real-time audio instrument with a React interface — **not** a React app that happens to play audio. The guiding principle:

> The audio engine is completely decoupled from React rendering. React is used only for visual feedback and settings UI. Audio timing, scheduling, and playback never pass through React's render cycle.

Three subsystems communicate through a central dispatcher and shared stores, but are never directly coupled:

1. **Input** (keyboard / mouse / touch / MIDI)
2. **Audio** (Web Audio API engine, sample playback, effects)
3. **UI** (React components, Zustand stores)

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   INPUT     │────▶│ InputRouter  │────▶│  AUDIO      │
│ kbd/mouse/  │     │ (singleton)  │     │  ENGINE     │
│ touch/MIDI  │     └──────┬───────┘     │ (singleton) │
└─────────────┘            │             └─────────────┘
                           ▼
                    ┌──────────────┐     ┌─────────────┐
                    │ Zustand      │◀───▶│   UI        │
                    │ stores       │     │ (React)     │
                    └──────────────┘     └─────────────┘
```

---

## 2. Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 14.2.35 |
| UI | React + TypeScript (strict) | 18.3.1 / 5.6.3 |
| Styling | Tailwind CSS | 3.4.x |
| Animation | Framer Motion | 11.x |
| State | Zustand | 4.5.x |
| Audio | Web Audio API (native) | — |
| MIDI | Web MIDI API (native) | — |
| Caching | IndexedDB + Service Worker | — |
| Samples | Salamander Grand Piano (OGG Vorbis) | — |

**Platform:** Desktop browsers (Chrome/Edge recommended for MIDI). Touch supported. Node 18+ to build.

---

## 3. Directory Structure

```
src/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout, SW registration, favicon, viewport
│   ├── page.tsx                  # Main page: start screen, loading, piano, arrow-key controls
│   └── globals.css               # Tailwind + base theme
│
├── audio/                        # AUDIO ENGINE — never imports React or Zustand*
│   ├── engine/
│   │   ├── AudioContext.ts       # Singleton AudioContext creation + resume
│   │   ├── AudioEngine.ts        # Main engine singleton: noteOn/off, master chain, sustain
│   │   └── Scheduler.ts          # Latency-offset scheduling helper
│   ├── samples/
│   │   ├── SampleMap.ts          # MIDI→sample mapping, velocity layers, pitch offsets (PURE)
│   │   ├── PitchShifter.ts       # semitone offset → playbackRate (PURE)
│   │   ├── SampleLoader.ts       # fetch + decode + progressive priority loading
│   │   ├── SampleBank.ts         # in-memory decoded AudioBuffer registry
│   │   └── SampleCache.ts        # IndexedDB raw-bytes cache wrapper
│   ├── nodes/
│   │   ├── NoteVoice.ts          # One playing note: BufferSource → Gain (ADSR)
│   │   ├── VoicePool.ts          # Polyphony + voice stealing
│   │   └── SustainPedal.ts       # Deferred-release sustain logic (PURE)
│   ├── effects/
│   │   ├── Reverb.ts             # Synthetic concert-hall convolution reverb
│   │   └── DynamicsProcessor.ts  # Master limiter (DynamicsCompressorNode)
│   └── midi/
│       ├── MidiManager.ts        # Web MIDI access, device discovery, hot-plug, routing
│       └── MidiParser.ts         # Raw MIDI bytes → typed messages (PURE)
│   └── metronome/
│       └── MetronomeEngine.ts    # Lookahead-scheduled click track (singleton)
│
├── systems/                      # App-level logic — no audio nodes, no React
│   ├── input/
│   │   ├── InputRouter.ts        # CENTRAL dispatch: all input → store + engine; sustain mux
│   │   ├── KeyboardInput.ts      # document-level keydown/keyup listener
│   │   └── MouseInput.ts         # pointer press/release with Y-velocity
│   └── mapping/
│       ├── KeyMapping.ts         # resolve code→MIDI, conflict detection (PURE)
│       ├── MappingDefaults.ts    # Default (3-oct) & Max (5-oct) preset bindings
│       └── MappingProfiles.ts    # localStorage persistence + import/export
│
├── components/                   # React UI (visual only)
│   ├── piano/
│   │   ├── PianoKeyboard.tsx     # Keyboard renderer + pointer/glissando handling
│   │   ├── PianoKey.tsx          # Single key (visual only, memoized)
│   │   ├── OctaveRange.tsx       # Mapped-range shift + visible-octaves controls
│   │   ├── KeyLabel.tsx          # Toolbar toggles (labels, note names) + SustainToggle
│   │   ├── SustainToggle.tsx     # On-screen sustain pedal button
│   │   ├── Visualizer.tsx        # Canvas waveform (reads AnalyserNode)
│   │   ├── Recorder.tsx          # MediaRecorder capture + download
│   │   └── MetronomeWidget.tsx   # Collapsed ♩ BPM pill + expandable controls
│   ├── ui/
│   │   ├── Header.tsx            # App title, fullscreen toggle, settings button
│   │   ├── StatusBar.tsx         # Active notes, engine status, load progress
│   │   └── LoadingScreen.tsx     # Inline sample-load progress
│   └── settings/
│       ├── SettingsPanel.tsx     # Slide-in drawer; all sections
│       ├── AudioSettings.tsx     # Volume, velocity, reverb, voice limit + hover tooltips
│       ├── CustomMappingModal.tsx# Full custom mapping editor (3-5 octaves, save/rename/delete)
│       └── MidiDeviceSelector.tsx# MIDI enable, device list, sustain CC
│
├── stores/                       # Zustand (UI/state only — NO audio timing)
│   ├── pianoStore.ts             # Visible window + mapping anchor + active notes
│   ├── settingsStore.ts          # All user preferences
│   ├── metronomeStore.ts         # Metronome prefs (bpm, sig, vol, recordMetronome)
│   └── mappingStore.ts           # Profiles + active profile + binding lookup
│
├── hooks/                        # React subscription hooks (no business logic)
│   ├── useAudioEngine.ts         # Engine status + sample progress via useSyncExternalStore
│   ├── useKeyboardInput.ts       # Installs KeyboardInput listener
│   ├── useKeyMapping.ts          # Bindings-by-offset for label rendering
│   ├── useMidi.ts                # MIDI state subscription + request/disable
│   ├── useNoteVisuals.ts         # Per-key active-state subscription
│   ├── useSustainKey.ts          # Installs sustain-key document listener
│   └── useMetronome.ts           # Beat-tick subscription via useSyncExternalStore
│
├── lib/
│   ├── noteUtils.ts              # MIDI↔name, key colors, range building (PURE)
│   ├── frequencyTable.ts         # Precomputed MIDI→Hz (PURE)
│   ├── db.ts                     # IndexedDB open/read/write
│   └── logger.ts                 # Leveled logger (suppresses debug/info in prod)
│
└── types/
    ├── piano.ts                  # MidiNote, PianoKeyDescriptor, NoteSource, etc.
    ├── mapping.ts                # KeyBinding, MappingProfile, MappingMode
    ├── audio.ts                  # AudioEngineStatus, AudioSettings, etc.
    ├── midi.ts                   # MidiDeviceInfo, MidiMessage, MidiAvailability
    └── webmidi.d.ts              # Ambient Web MIDI API declarations

public/
├── samples/salamander/notes/     # 480 OGG files: <Note>v<1-16>.ogg
├── sw.js                         # Service Worker (app shell + sample caching)
└── favicon.svg                   # Piano-key icon
```

\* The audio engine reads the settings store via `useSettingsStore.getState()` (imperative, non-reactive) to live-sync params. It never subscribes through React.

---

## 4. The Critical Data Flow (noteOn)

This is the single most important path to understand. When any input triggers a note:

```
1. INPUT SOURCE fires (e.g. KeyboardInput.onKeyDown)
       │
       │  resolveCodeToMidi(code, shiftHeld, mappingBaseMidi, bindings)
       │  → MIDI note number
       ▼
2. inputRouter.noteOn(midi, velocity, source)
       │
       ├─▶ applyTranspose(midi)                 # + settingsStore.transposeSemitones
       ├─▶ pianoStore.setNoteActive(...)        # VISUAL feedback only
       ├─▶ ensureEngineStarted()                # idempotent lazy init
       └─▶ audioEngine.noteOn(midi, velocity)
              │
              ├─▶ velocityToLayer(vel, sensitivity, defaultVel)   # → 1..16
              ├─▶ targetForMidi(midi, layer)
              │       → { ref:{recordedMidi, velocityLayer}, semitoneOffset }
              ├─▶ findBestBuffer(ref)
              │       exact → SampleBank.getExact
              │       else  → SampleBank.getClosest (nearest velocity layer)
              │       else  → sampleLoader.requestSample (background) & skip
              ├─▶ velocityToGain(vel, sensitivity)               # linear gain
              ├─▶ scheduleAt(ctx.currentTime, latencyOffsetMs)   # AudioContext clock
              ├─▶ sustain.noteRepressed(midi)                    # clears deferred release
              └─▶ voicePool.start({ buffer, semitoneOffset, gain, midi, when, ... })
                     │
                     └─▶ new NoteVoice:
                            BufferSourceNode (playbackRate = 2^(semitone/12))
                              → GainNode (ADSR attack ramp)
                              → reverb.input → ... → masterGain → limiter
                              → analyser → ctx.destination
```

**noteOff** path:
```
inputRouter.noteOff(midi, source)
  → pianoStore.setNoteInactive(midi)        # visual
  → audioEngine.noteOff(midi)
       → if sustain.shouldReleaseNow(midi) == false: defer (pedal absorbs it)
       → else voicePool.releaseNote(midi)   # release envelope ramp to 0
```

**Key insight:** velocity/gain are fixed at attack time (like a real hammer strike). Dragging within a key does not change its loudness.

---

## 5. Audio Engine Deep Dive

### 5.1 Master Signal Chain

```
NoteVoice(s) → reverb.input
                  ├─ dry → reverb.output
                  └─ convolver(wet) → reverb.output
                          → masterGain (0..1) → limiter (DynamicsCompressor)
                          → analyser (AnalyserNode, fftSize 2048)
                          → ctx.destination
```

- **masterGain**: linear 0–1, smoothed via `setTargetAtTime` on settings change.
- **limiter**: threshold −1 dB, ratio 12:1, knee 6, attack 2ms, release 180ms — a gentle brick wall preventing clipping when many voices stack.
- **analyser**: tapped for the Visualizer; passes signal through unchanged.

### 5.2 AudioContext (`engine/AudioContext.ts`)
- Singleton, created lazily with `latencyHint: "interactive"`.
- Handles webkit prefix fallback.
- `ensureRunning()` calls `resume()` — must be invoked from a user gesture (the "start piano" button).

### 5.3 AudioEngine (`engine/AudioEngine.ts`)
Singleton with status: `idle → initializing → loading-samples → ready` (or `error`).

- `init()`: idempotent; builds master chain, creates VoicePool + SustainPedal, subscribes to settings store for live param updates (master volume, reverb on/amount, voice limit), then kicks off `sampleLoader.loadAll()`.
- `noteOn(midi, velocity)`, `noteOff(midi)`, `setSustain(engaged)`, `releaseAll()`, `dispose()`.
- `getAnalyser()`: exposes the AnalyserNode for the Visualizer & Recorder.
- Settings are read imperatively (`useSettingsStore.getState()`) — never via React subscription.

### 5.4 NoteVoice (`nodes/NoteVoice.ts`)
One voice = one note sounding. **Nodes are never reused** (Web Audio best practice).

- Chain: `AudioBufferSourceNode → GainNode → destination`.
- `playbackRate = 2^(semitoneOffset/12)` for pitch shifting.
- **ADSR**: Attack 4ms linear ramp to target gain. Release 320ms ramp to ~0. `hardStop` = 8ms fade (for voice stealing, click-free).
- Auto-disconnects on `onended`, notifies pool to remove itself.

### 5.5 VoicePool (`nodes/VoicePool.ts`)
- Default cap 32 voices (configurable 8–64).
- **Re-attack**: pressing a held note releases the old voice first (no infinite stacking).
- **Voice stealing** when at cap: scores each voice by `releasedBias (released preferred) + currentGain + age`; steals the lowest score (quietest, oldest, already-releasing).
- `releaseNote` searches from newest to oldest.

### 5.6 SustainPedal (`nodes/SustainPedal.ts`) — PURE
- Multi-source aware via InputRouter (see §7.3).
- `shouldReleaseNow(midi)`: returns false (defer) if engaged, recording the note in a `deferred` set.
- `noteRepressed(midi)`: removes from deferred set on re-press.
- `release()`: lifts pedal, releases all deferred notes via callback.

### 5.7 Effects
- **Reverb** (`effects/Reverb.ts`): synthetic concert-hall impulse response generated at runtime (3.2s, early reflections in first 80ms, exponential decay + HF damping, stereo decorrelation). Wet/dry mix via two gain nodes. No external IR file shipped.
- **DynamicsProcessor** (`effects/DynamicsProcessor.ts`): `createMasterLimiter()`.

### 5.8 MetronomeEngine (`audio/metronome/MetronomeEngine.ts`)
A peer singleton to `AudioEngine`, sharing the same `AudioContext` but with its own independent signal chain.

**Signal chain** (bypasses the piano chain entirely):
```
OscillatorNode (ephemeral, per-beat)
  → MetronomeGain (volume)
    → ctx.destination          (always)
    → AnalyserNode (optional)  (when "record metronome" is enabled)
```

**Scheduling** (Wilson "A Tale of Two Clocks" pattern):
- A `setInterval` pump (25ms) calls `scheduleAudio()`, which pre-schedules beats into a 100ms lookahead window on the AudioContext timeline. `setInterval` is the *wakeup mechanism* — actual beat timing is `AudioContext.currentTime`. No drift.
- A `requestAnimationFrame` loop reads `ctx.currentTime` and fires beat notifications to UI subscribers when a pre-scheduled beat's time has arrived (no `setTimeout` for visual sync).
- BPM changes take effect within one lookahead window (≤100ms) — no burst of missed beats, no gap.
- AudioContext suspension (tab switch, lock screen): `statechange` listener re-anchors `nextBeatTime` and restarts the loops on resume.
- Clicks are `OscillatorNode` (880 Hz accent / 660 Hz sub-beat, 25ms, exponential decay) — created per beat, self-dispose on `onended`. Never enters `VoicePool`.

**Recording integration**: when the `recordMetronome` setting is on, `MetronomeWidget` connects the metronome's output gain to `AudioEngine.getAnalyser()`, so clicks appear dry in recordings (standard click-track behavior — no reverb).

**Beat visual sync**: `MetronomeEngine` maintains a stable `beatSnapshot` object (only changes identity when `beat/beats/playing` changes). `useMetronomeBeat()` hook wraps this in `useSyncExternalStore` — re-renders only once per beat (≤5×/sec at 300 BPM max).

---

## 6. Sample System

### 6.1 Source Material
Salamander Grand Piano, OGG Vorbis. **30 recorded notes** at every 3 semitones from A0 (MIDI 21) to C8 (108): `A0, C1, D#1, F#1, A1, C2, ... A7, C8`. **16 velocity layers** each (`v1` softest … `v16` loudest). Total 480 files.

File location & naming:
```
public/samples/salamander/notes/<NoteName>v<Layer>.ogg
e.g. C4v8.ogg, D#3v12.ogg
```
**Critical gotcha:** sharp note names contain `#`, which is a URL fragment delimiter. The loader URL-encodes filenames (`encodeURIComponent`) so `D#3v8.ogg` → `D%233v8.ogg`. The IndexedDB cache key uses the raw filename.

### 6.2 SampleMap.ts (PURE)
- `nearestRecordedMidi(midi)`: rounds to nearest multiple of 3 (max ±1 semitone shift needed).
- `targetForMidi(midi, layer)`: returns `{ ref, semitoneOffset }`.
- `velocityToLayer(velocity, sensitivity, defaultVelocity)`: blends actual velocity toward `defaultVelocity` by `(1 - sensitivity)`, maps to layer 1–16.
- `sampleFilename(ref)` + `fallbackFilenames(ref)` (probes nearby layers, then `<Note>.ogg`).

### 6.3 SampleLoader.ts — Progressive Priority Loading
Loading order:
1. **Core** (awaited, gates the loading screen): middle octave recorded notes C3–C5, layer 8.
2. **Background wave 1**: all remaining recorded notes at layer 8.
3. **Background wave 2**: primary layers [12, 4, 16, 1] across all notes.
4. **Background wave 3**: all remaining layers.
5. **On-demand**: `requestSample(ref)` bumps a specific sample when pressed before loaded.

- Concurrency-limited batches (3–4 parallel fetches).
- Dedup via in-flight promise map.
- Snapshot is referentially stable (cached) — required for `useSyncExternalStore` to avoid infinite render loops.
- Marks missing files so it doesn't retry endlessly.

### 6.4 SampleBank.ts
In-memory registry: `recordedMidi → (velocityLayer → AudioBuffer)`. Provides `getExact`, `getClosest` (nearest available velocity layer), and missing-file tracking.

### 6.5 Caching (two layers)
1. **IndexedDB** (`lib/db.ts` + `SampleCache.ts`): stores **raw ArrayBuffer** WAV/OGG bytes keyed by filename. Decoded once per session into AudioBuffers. DB version 2; upgrade wipes the sample store (invalidates pre-URL-encoding-fix cache).
2. **Service Worker** (`public/sw.js`): caches sample HTTP responses (cache-first) AND the app shell (network-first with cache fallback) for full offline use.

---

## 7. Input System

### 7.1 InputRouter (`systems/input/InputRouter.ts`) — the hub
Singleton. Every input source funnels through it. Responsibilities:
- `noteOn/noteOff`: applies transpose, updates pianoStore (visual), calls audioEngine.
- `ensureEngineStarted()`: lazy idempotent engine init.
- **Sustain multiplexing**: tracks a `Set<SustainSource>`. Pedal is ON if ANY source is engaged. Sources: `keyboard-hold`, `keyboard-toggle`, `ui-toggle`, `midi`, `mouse`. Notifies subscribers (the on-screen toggle button) on state change.

### 7.2 KeyboardInput (`systems/input/KeyboardInput.ts`)
- Document-level `keydown`/`keyup` (NOT React synthetic events).
- Ignores `repeat`, Ctrl/Meta/Alt combos, and input/textarea/contentEditable targets.
- Resolves via `resolveCodeToMidi(code, shiftKey, mappingBaseMidi, bindings)`. **Shift matters** — Max mapping uses Shift for black keys.
- `mappingBaseMidi` comes from `pianoStore.mappingBaseMidi` (the live anchor — moves when user shifts octaves, independent of visible octaves).
- Composite held-key tracking (`shift:Code` vs `Code`) so shifted and unshifted bindings coexist.
- Typing velocity: fixed `defaultVelocity` setting ± small humanization.

### 7.3 MouseInput (`systems/input/MouseInput.ts`)
- `press(midi, relativeY)`: velocity derived from Y position on the key (top = soft ~35, bottom = loud ~120, eased).
- Actual pointer handling is at the **PianoKeyboard container level** (for glissando), not per-key.

### 7.4 Touch / Glissando (in `PianoKeyboard.tsx`)
- Container-level pointer events with `setPointerCapture` and `touch-action: none`.
- `hitTest(x, y)` figures out which key the pointer is over (black keys checked first, then white).
- Dragging across boundaries releases the old note and presses the new one (glissando).

### 7.5 MIDI (`audio/midi/`)
- `MidiManager`: `requestMIDIAccess({ sysex:false })`, discovers inputs, hot-plug via `onstatechange`, subscribes each input's `midimessage`.
- `MidiParser`: decodes Note On (0x90, vel 0 = Note Off), Note Off (0x80), Control Change (0xB0).
- Routes Note On/Off → `inputRouter`; CC matching `midiSustainCC` (default 64) → `inputRouter.setSustain(value>=64, "midi")`.
- MIDI bypasses key mappings entirely — raw MIDI note numbers go straight to the engine. Respects `midiEnabled` setting.
- React access via `useMidi.ts` (`useSyncExternalStore`).

---

## 8. Mapping System

### 8.1 Three Modes
| Mode | Octaves | Black keys | Editable |
|---|---|---|---|
| **Default** | 3 (C4–C6) | dedicated keys | no (builtin) |
| **Max** | 5 (C2–C6 + C7) | Shift + key | no (builtin) |
| **Custom** | 3–5 (anchored C3) | user choice (Shift optional) | yes |

### 8.2 Default Mapping Layout
```
C4 white: Tab Q W E R T Y    C4 black: 1 2 4 5 6
C5 white: U I O P [ ] \       C5 black: 8 9 - = Backspace
C6 white: Z X C V B N M       C6 black: S D G H J
```

### 8.3 Max Mapping Layout
36 white keys across number row + QWERTY + home + bottom row (`1..0 Q..P A..L Z..M`) covering C2–C7. Black keys = **Shift + key** (25 blacks across C2–C6).

### 8.4 KeyBinding Model
```ts
interface KeyBinding {
  code: string;           // KeyboardEvent.code, layout-independent
  semitoneOffset: number; // relative to mappingBaseMidi (NOT absolute)
  label: string;          // display label on key
  shift?: boolean;        // only fires when Shift held (Max black keys)
}
```
Bindings are **relative offsets** from the mapping anchor, so shifting octaves recalculates actual notes without rewriting the mapping.

### 8.5 mappingStore.ts
- Holds `profiles` (Default + Max + custom), `activeProfileId`, `bindingMap`.
- `setActiveProfile(id)`: syncs pianoStore anchor + visible window via `syncToMapping(startMidi, octaveCount)`.
- CRUD: `addProfile`, `renameProfile`, `deleteProfile`, `duplicateActive`, `replaceProfiles`.
- Custom profiles persisted to localStorage (`MappingProfiles.ts`, key `octype:mapping-profiles:v2`).

### 8.6 CustomMappingModal.tsx
Full-screen modal: pick 3–5 octaves, click a piano key to arm, press a physical key (with optional Shift) to bind, mapping optional. Save-as-new (named), update existing, clear, rename, delete.

---

## 9. The Visible vs. Mapped Range Model (pianoStore.ts)

This is subtle and important. Two independent concepts:

- **Mapped region** = `mappingBaseMidi` + `mappingOctaves`. The octaves your keyboard keys play. Anchored; moves only on `shiftOctave`.
- **Visible window** = `startMidi` + `octaves`. What's drawn.

**Invariants (always enforced):**
1. `octaves >= mappingOctaves` (can't show fewer than mapped).
2. Mapped region fully contained in the visible window.
3. Visible window stays within piano bounds C1–C8.

**Controls:**
- `setOctaves(n)`: changes visible count; recenters window around the anchored mapped region (`deriveVisibleStart` adds equal padding on both sides when room).
- `shiftOctave(±1)`: moves the **mapped region** up/down; window scrolls to keep it centered.
- `syncToMapping(base, octaves)`: called on profile switch.

**Visual indicator:** mapped keys show their key labels; visible-but-unmapped keys don't. The OctaveRange control reads `mapped C4–C6` (purple) and a separate `visible` octaves counter (with `−` disabled at the mapping size).

---

## 10. State Stores (Zustand)

### pianoStore
`startMidi, octaves, mappingBaseMidi, mappingOctaves, showKeyLabels, showNoteNames, activeNotes(Map)` + range/visual actions. `activeNotes` is **visual feedback only** — never used for audio timing.

### settingsStore
`masterVolume(0-1), velocitySensitivity(0-1), defaultVelocity(1-127, "typing velocity"), reverb{enabled,amount}, voiceLimit(8-64), latencyOffsetMs, transposeSemitones(-24..24), settingsOpen, sustainKey(default "Space"), midiEnabled, midiSustainCC(default 64)`.

### mappingStore
See §8.5.

---

## 11. UI Components

- **page.tsx**: Start screen (dedicated "start piano" button — engine/caching does NOT begin until clicked) → inline loading → piano. Arrow keys: ←→ shift mapped octave, ↑↓ resize visible octaves.
- **PianoKeyboard.tsx**: ResizeObserver-based responsive layout. White keys edge-to-edge, black keys overlaid at correct positions/proportions. Container-level pointer events for glissando. Each `PianoKey` subscribes only to its own active state (no cross-key rerenders).
- **PianoKey.tsx**: Visual only, memoized. Framer Motion press animation. White/black gradients, active = purple tint.
- **Visualizer.tsx**: Canvas waveform from AnalyserNode time-domain data, windowed (sin envelope) so amplitude peaks in center, tapers at edges. Runs in `requestAnimationFrame`, no React rerenders.
- **Recorder.tsx**: `MediaStreamDestinationNode` off the analyser → `MediaRecorder` (opus/webm) → downloads `.webm`. Chunked (`start(250)`).
- **Header.tsx**: title, fullscreen toggle (Fullscreen API), settings button.
- **SettingsPanel.tsx**: slide-in drawer. Sections: Keyboard (octaves, transpose, sustain-key picker with conflict warning), Display (toggles), Mapping (Default/Max/Custom + modal), Audio, MIDI. Esc closes.
- **AudioSettings.tsx**: sliders/steppers with hover-label tooltips (no icons). Custom toggle switches (overflow-fixed).
- **MidiDeviceSelector.tsx**: enable toggle, request button, device list with connection state, sustain CC stepper.

---

## 12. Hooks (subscription only — no business logic)
- `useAudioEngine`: `useAudioEngineStatus()`, `useSampleProgress()` (both via `useSyncExternalStore`).
- `useKeyboardInput`: installs/uninstalls KeyboardInput on mount.
- `useSustainKey`: installs the sustain-key listener (engage on keydown, release on keyup, release on blur).
- `useKeyMapping`: `useBindingsByOffset()` for label rendering.
- `useMidi`: `useMidiState()`, `requestMidi()`, `disableMidi()`.
- `useNoteVisuals`: `useIsNoteActive(midi)` per-key.

---

## 13. Engineering Rules (enforced)
1. TypeScript strict, `noUncheckedIndexedAccess`. No `any`.
2. Audio engine never imports React/Zustand reactively (only `getState()`).
3. React components never call AudioEngine directly — always via InputRouter.
4. All scheduling uses `AudioContext.currentTime` — never `Date.now()`/`setTimeout`.
5. Samples decoded once → AudioBuffer in memory + raw bytes in IndexedDB.
6. No raw `console.log` — use `lib/logger.ts` (debug/info suppressed in prod).
7. `useSyncExternalStore` snapshots must be referentially stable (caching) to avoid infinite loops.
8. Web Audio nodes are created per-note, never reused.

---

## 14. Build, Run, Verify

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # production build (also typechecks + lints)
npm run start        # serve production build (required to test offline SW)
npm run typecheck    # tsc --noEmit
```

**Offline testing** requires `npm run build && npm run start` (dev server can't go offline). After loading once, the SW serves app shell + samples from cache.

---

## 15. Known Constraints & Gotchas
- **Laptop key rollover (NKRO):** physical keyboards often can't register >~4-6 simultaneous keys in the same matrix row (e.g. A S D F G). This is a hardware limit; the sustain toggle is the workaround. External/mechanical keyboards or MIDI don't have this issue.
- **`#` in filenames** must be URL-encoded (see §6.1).
- **First press of an unloaded sample** is silent (loads on demand, next press plays) — intentional, avoids surprise-late notes.
- **MIDI** requires Chrome/Edge; Safari/Firefox have limited/no Web MIDI.
- **Velocity on laptop typing** is fixed (binary keys can't express velocity) — `defaultVelocity` setting. Real velocity comes from mouse-Y or MIDI.
- **Sympathetic resonance** is NOT implemented (noted as a possible future enhancement).
- **Octave character** (dark bass / bright treble) comes naturally from the real Salamander recordings — no artificial EQ.

---

## 16. Feature Checklist (current state)
- [x] Salamander sample playback, 16 velocity layers, pitch-shift ±1
- [x] 32-voice polyphony with voice stealing
- [x] ADSR envelope, natural release fade
- [x] Sustain: hold-key, on-screen toggle, MIDI CC64 (multi-source mux)
- [x] Velocity: mouse-Y, MIDI, fixed typing velocity; sensitivity control
- [x] Progressive loading + IndexedDB + Service Worker offline
- [x] MIDI input: multi-device, hot-plug, sustain pedal
- [x] Mapping: Default / Max / Custom with modal editor, save/rename/delete, import/export
- [x] Separated visible-window vs mapped-region with invariants
- [x] Reverb (synthetic IR), master limiter, master volume
- [x] Touch + glissando
- [x] Fullscreen, recording (download .webm), waveform visualizer
- [x] Dark Monkeytype-style UI, Framer Motion
- [x] Metronome: BPM 30–300, tap tempo, time signatures 2/4 3/4 4/4 6/8, volume,
      accented beat, persistent prefs, beat-dot visual sync, record-metronome option
- [ ] Sympathetic resonance (future)
- [ ] Round-robin sample variation (future)
- [ ] Key-noise mechanical samples (future)
```
```

---

*This document reflects the actual implemented state of the codebase. For per-file detail, read the source — every module has a header JSDoc explaining its role.*
