# AGENTS.md — AI Context & Working Rules for Octype

> Read this first. For full system detail, read `ARCHITECTURE.md`. This file tells you HOW to work in this codebase correctly and what NOT to break.

---

## Project in one paragraph

Octype is a production-grade browser virtual piano (Next.js 14 App Router + TypeScript strict + Tailwind + Framer Motion + Zustand). It plays the **Salamander Grand Piano** OGG samples via the **Web Audio API**. The defining architectural rule: **the audio engine is fully decoupled from React.** React handles visuals and settings only; audio timing/scheduling/playback never run through React's render cycle. Input (keyboard/mouse/touch/MIDI) → `InputRouter` (singleton) → `AudioEngine` (singleton). UI state lives in Zustand stores.

---

## Commands

```bash
npm run dev         # dev server at http://localhost:3000
npm run build       # production build — ALSO typechecks + lints. Run before declaring done.
npm run typecheck   # tsc --noEmit
npm run start       # serve prod build (REQUIRED to test offline Service Worker)
```

- Windows environment (cmd/PowerShell). Use `;` not `&&` in PowerShell.
- Always run `npm run build` after changes; it is the source of truth for "does it compile".
- Dev server cannot test offline; use `build` + `start`.

---

## The 10 hard rules (do not violate)

1. **Audio engine never imports React/Zustand reactively.** It may read settings imperatively via `useSettingsStore.getState()`. It must never subscribe through React or call hooks.
2. **React components never call `audioEngine.*` directly.** All note/sustain actions go through `inputRouter`. (UI may read engine *status* via hooks.)
3. **All audio scheduling uses `AudioContext.currentTime`.** Never `Date.now()`, `setTimeout`, or `setInterval` for timing.
4. **Web Audio nodes are created per-note and never reused** (`NoteVoice` makes fresh `BufferSourceNode` + `GainNode` each time).
5. **TypeScript strict, `noUncheckedIndexedAccess` on. No `any`.** Index access returns `T | undefined` — handle it (`?? fallback`).
6. **No raw `console.*`.** Use `@/lib/logger` (`logger.debug/info/warn/error`). debug/info are suppressed in production.
7. **`useSyncExternalStore` snapshots MUST be referentially stable.** Return a cached object that only changes identity when values change. A fresh object every call = infinite render loop. (This already bit us once in `SampleLoader`.)
8. **Sample filenames with `#` must be URL-encoded** when fetched (`encodeURIComponent`), but the IndexedDB cache key uses the RAW filename. `D#3v8.ogg` → fetch `D%233v8.ogg`.
9. **Keyboard input is document-level**, not React synthetic events. Ignore `event.repeat`, Ctrl/Meta/Alt combos, and input/textarea/contentEditable targets.
10. **`activeNotes` in pianoStore is visual feedback only.** Never use it for audio timing or as the source of truth for what's playing — the VoicePool is.

---

## Where things live (quick map)

| I want to change… | Go to |
|---|---|
| How a note becomes sound | `systems/input/InputRouter.ts` → `audio/engine/AudioEngine.ts` |
| Pitch/velocity/sample selection | `audio/samples/SampleMap.ts` (pure) |
| Polyphony / voice stealing | `audio/nodes/VoicePool.ts` |
| One note's envelope/pitch | `audio/nodes/NoteVoice.ts` |
| Sustain behavior | `audio/nodes/SustainPedal.ts` + InputRouter sustain mux |
| Reverb / limiter | `audio/effects/Reverb.ts`, `audio/effects/DynamicsProcessor.ts` |
| Sample loading order / caching | `audio/samples/SampleLoader.ts`, `SampleCache.ts`, `lib/db.ts` |
| Key→note mapping logic | `systems/mapping/KeyMapping.ts` (pure) |
| Default/Max preset bindings | `systems/mapping/MappingDefaults.ts` |
| Custom mapping editor UI | `components/settings/CustomMappingModal.tsx` |
| Visible vs mapped octave logic | `stores/pianoStore.ts` |
| Keyboard listener | `systems/input/KeyboardInput.ts` |
| Mouse/touch/glissando | `components/piano/PianoKeyboard.tsx` (container pointer events) + `systems/input/MouseInput.ts` |
| MIDI | `audio/midi/MidiManager.ts`, `MidiParser.ts` |
| Settings UI | `components/settings/SettingsPanel.tsx` + `AudioSettings.tsx` |
| User preferences state | `stores/settingsStore.ts` |
| Note math (MIDI↔name) | `lib/noteUtils.ts` (pure) |

PURE modules (no side effects, safe to unit test / refactor freely): `SampleMap`, `PitchShifter`, `MidiParser`, `KeyMapping`, `noteUtils`, `frequencyTable`, `SustainPedal`.

---

## Critical data flow (memorize this)

```
KeyboardInput / MouseInput / MidiManager / PianoKeyboard(pointer)
   → inputRouter.noteOn(midi, velocity, source)
       → applyTranspose() → pianoStore.setNoteActive() [visual]
       → audioEngine.noteOn(midi, velocity)
           → velocityToLayer() → targetForMidi() → SampleBank.getExact/getClosest
           → velocityToGain() → scheduleAt(ctx.currentTime)
           → VoicePool.start() → new NoteVoice (BufferSource→Gain→reverb→master→limiter→analyser→destination)
```
noteOff mirrors this; if sustain engaged, `SustainPedal.shouldReleaseNow()` defers the release.

Velocity/gain are FIXED at attack (real hammer behavior). Don't add mid-note volume changes.

---

## Two range concepts (easy to confuse — see ARCHITECTURE §9)

- **Mapped region** (`pianoStore.mappingBaseMidi` + `mappingOctaves`): octaves the keyboard keys play. Moves only on `shiftOctave`.
- **Visible window** (`pianoStore.startMidi` + `octaves`): what's drawn.
- Invariants enforced in `pianoStore`: `octaves >= mappingOctaves`; mapped region always fully visible; bounds C1–C8.
- `KeyboardInput` resolves notes against `mappingBaseMidi` (the live anchor), NOT the visible start and NOT the profile's static start octave.

---

## Conventions

- **Imports:** use `@/` alias (maps to `src/`). Order: external libs, then `@/` modules.
- **Every module gets a header JSDoc** explaining its role. Public methods/classes get JSDoc.
- **Components are visual-only**; subscribe to stores via selectors. Keep business logic out of components and hooks.
- **Hooks** are for subscriptions only (no logic).
- **Singletons** (`audioEngine`, `inputRouter`, `sampleLoader`, `sampleBank`, `midiManager`, `keyboardInput`, `mouseInput`) are exported as lowercase instances with an exported `type` alias.
- **Zustand actions** live inside the store; clamp/validate inputs there.
- **Styling:** Tailwind only, dark theme. Accent is purple (`accent` / `accent-soft`). Monospace for labels/UI text. No always-visible help text — use hover tooltips on labels.
- **Toggle switches:** use absolute `left-[3px]`/`left-[22px]` positioning with `overflow-hidden` (translate-based caused overflow glitch — don't reintroduce it).

---

## Gotchas that will waste your time if you forget

- **NKRO / key rollover:** laptops drop simultaneous keys in the same matrix row (e.g. A S D F G). Not a bug. Sustain toggle is the workaround.
- **First press of an unloaded sample is silent** (loads on demand, next press plays). Intentional — do not add retroactive late playback.
- **IndexedDB version bump wipes the sample store** (see `lib/db.ts` `onupgradeneeded`). Bump it if cache format changes.
- **MIDI** only works in Chrome/Edge. Code must degrade gracefully (`navigator.requestMIDIAccess` may be undefined — `webmidi.d.ts` declares it optional).
- **Engine/caching must NOT start until the user clicks "start piano"** (`page.tsx`). Don't re-add auto-init on page load or first arbitrary gesture.
- **Samples live in** `public/samples/salamander/notes/<Note>v<1-16>.ogg`. 30 recorded notes × 16 layers.

---

## Definition of done for any change

1. `npm run build` passes (compiles, typechecks, lints) — no new warnings.
2. No `any`, no raw `console.*`, no React in the audio path.
3. If you touched audio: verified no clicks/glitches and the React-decoupling rule holds.
4. If you touched stores/`useSyncExternalStore`: snapshot is referentially stable.
5. Update `ARCHITECTURE.md` if you changed structure, data flow, or added a feature.

---

## Not yet implemented (valid next tasks)
- Sympathetic resonance (held-note harmonic excitation)
- Round-robin sample variation per note
- Key-noise / mechanical click samples
- Per-register EQ enhancement (currently relies on natural sample character)
