# 🎹 Octype

**A premium, browser-based virtual piano powered by the Salamander Grand Piano sample library.**

Octype turns your computer keyboard, mouse, touchscreen, or MIDI controller into a richly sampled concert grand — running entirely in the browser with sub-10ms perceived latency, 32-voice polyphony, sustain, velocity sensitivity, and offline support.

It's built like real-time audio software, not a typical web app: the audio engine is fully decoupled from React so that note timing and playback never get caught in the render cycle.

---

## Table of Contents

1. [Highlights](#highlights)
2. [Quick Start](#quick-start)
3. [Sample Setup](#sample-setup)
4. [Playing the Piano](#playing-the-piano)
5. [Key Mapping Modes](#key-mapping-modes)
6. [Settings Reference](#settings-reference)
7. [Features in Depth](#features-in-depth)
8. [How It Works (Architecture)](#how-it-works-architecture)
9. [Project Structure](#project-structure)
10. [Tech Stack](#tech-stack)
11. [Development](#development)
12. [Browser Support](#browser-support)
13. [Troubleshooting](#troubleshooting)
14. [Roadmap](#roadmap)
15. [Credits & License](#credits--license)

---

## Highlights

- 🎵 **Real grand piano sound** — Salamander Grand Piano, 30 recorded notes × 16 velocity layers
- ⚡ **Instant feel** — sub-10ms perceived latency; audio engine decoupled from React
- 🎹 **32-voice polyphony** with intelligent voice stealing
- 🦶 **Sustain pedal** — hold a key, click an on-screen toggle, or use a MIDI pedal (CC64)
- 💪 **Velocity sensitivity** — mouse position on the key and MIDI velocity both control dynamics
- 🎛️ **Three mapping modes** — Default (3 octaves), Max (5 octaves), and fully Custom
- 🎼 **MIDI input** — multi-device, hot-plug, sustain pedal support
- 💾 **Works offline** — IndexedDB + Service Worker caching after first load
- 📈 **Live visualizer** — waveform that responds to what you play
- ⏺️ **Recording** — capture your playing and download it
- 🖥️ **Fullscreen mode** and **touch/glissando** support
- 🌑 **Minimal dark UI** — Monkeytype-inspired, distraction-free

---

## Quick Start

**Prerequisites:** Node.js 18+ (developed on 24.x), a modern desktop browser.

```bash
# 1. Install dependencies
npm install

# 2. Add the Salamander samples (see "Sample Setup" below)

# 3. Start the dev server
npm run dev
```

Open **http://localhost:3000** and click **"start piano"**.

> The audio engine and sample caching do **not** begin until you click "start piano". This satisfies browser autoplay rules and means nothing is downloaded or decoded until you're ready to play.

---

## Sample Setup

Octype expects the **Salamander Grand Piano** samples in OGG Vorbis format.

Place the files here:

```
public/samples/salamander/notes/
├── A0v1.ogg  …  A0v16.ogg
├── C1v1.ogg  …  C1v16.ogg
├── D#1v1.ogg …  D#1v16.ogg
├── F#1v1.ogg …  F#1v16.ogg
│   … (every 3rd semitone) …
└── C8v1.ogg  …  C8v16.ogg
```

**The recorded set** — 30 notes, every 3 semitones from A0 to C8:

```
A0, C1, D#1, F#1, A1, C2, D#2, F#2,
A2, C3, D#3, F#3, A3, C4, D#4, F#4,
A4, C5, D#5, F#5, A5, C6, D#6, F#6,
A6, C7, D#7, F#7, A7, C8
```

Each note has **16 velocity layers** (`v1` = softest … `v16` = loudest), so 30 × 16 = **480 files** total.

**Notes that aren't recorded** (the in-between semitones) are produced by pitch-shifting the nearest recorded sample by at most ±1 semitone — small enough to remain natural.

> **Filename note:** sharp notes contain `#` (e.g. `D#3v8.ogg`). Octype URL-encodes these automatically when fetching, so you don't need to rename anything. Just drop the files in as-is.

---

## Playing the Piano

### Computer keyboard

The fastest way to play. Key bindings depend on the active [mapping mode](#key-mapping-modes). In the default mode:

```
White keys (C4 octave):  Tab Q W E R T Y
Black keys (C4 octave):  1 2 4 5 6
White keys (C5 octave):  U I O P [ ] \
Black keys (C5 octave):  8 9 - = Backspace
White keys (C6 octave):  Z X C V B N M
Black keys (C6 octave):  S D G H J
```

### Mouse / touch

- **Click** a key to play it. Where you click matters: **clicking near the top of a key is soft, near the bottom is loud** (it mimics how far a hammer travels).
- **Click and drag** across keys for a glissando.
- On a touchscreen, tap and slide work the same way.

### MIDI controller

Plug in a USB MIDI keyboard (Chrome/Edge). On first interaction the browser asks for MIDI permission — allow it. Your controller's velocity and sustain pedal work fully. See [MIDI](#midi).

### Octave / range controls

- **`◂ oct` / `oct ▸` buttons** or **← / → arrow keys** — slide the *mapped* octaves up and down (the notes your keys play).
- **`−` / `+` (visible)** or **↑ / ↓ arrow keys** — change how many octaves are *drawn* on screen.

See [Visible vs. Mapped Range](#visible-vs-mapped-range) for why these are two separate things.

### On-screen toggles (above the keyboard)

- **key labels** — show/hide the keyboard-key labels on each piano key
- **note names** — show/hide note names (C4, D4, …)
- **sustain on/off** — click-to-toggle sustain pedal
- **⏺ record** — start/stop recording

---

## Key Mapping Modes

Open **Settings → mapping** and pick one of three modes.

### 1. Default (3 octaves: C4–C6)

Comfortable for casual play. White keys use the top three keyboard rows; black keys use the number row and inner letters. Built-in, not editable.

### 2. Max (5 octaves: C2–C6, plus an extra C7)

Maximizes range on a single keyboard. **White keys** span the number row, QWERTY row, home row, and bottom row (`1…0 Q…P A…L Z…M`). **Black keys are played by holding Shift** + the corresponding key. Built-in, not editable.

### 3. Custom

Build your own. Open the **custom mapping editor** modal:

1. Choose **3, 4, or 5 octaves** (anchored at C3).
2. **Click a piano key** in the editor to "arm" it.
3. **Press a keyboard key** to bind it. Hold **Shift** while pressing to create an alternate (shifted) binding for that physical key.
4. Mapping is **optional** — you don't have to assign every note.
5. **Save** the mapping with a name. You can **rename** or **delete** saved mappings anytime.

Custom mappings are stored in your browser (localStorage) and persist across visits.

---

### Visible vs. Mapped Range

Octype separates two concepts that other web pianos usually conflate:

- **Mapped region** — the octaves your keyboard keys actually play. Shown in purple as `mapped C4–C6`.
- **Visible window** — how many octaves are drawn on screen.

This means you can, for example, **see 5 octaves** while your keyboard **plays the middle 3** — giving you visual context of where you are. Rules the app always enforces:

- You can never show fewer octaves than are mapped.
- The mapped region is always fully visible (centered when there's extra room).
- Shifting the mapped octaves scrolls the visible window to follow.

---

## Settings Reference

Open with the **settings** button (top-right). Close with **Esc** or the backdrop.

### Keyboard
| Setting | Description |
|---|---|
| **octaves visible** | How many octaves are drawn (min = the mapped count). |
| **transpose (semitones)** | Shift every played note up/down by −24…+24 semitones. |
| **sustain key** | Click, then press a key to reassign the hold-to-sustain key (default **Space**). Keys already mapped to notes are rejected with a warning. |

### Display
| Setting | Description |
|---|---|
| **key labels** | Show the keyboard-key label on each piano key. |
| **note names** | Show note names (C4, D4, …). |

### Mapping
Choose **Default / Max / Custom**, manage custom mappings, and open the custom editor. See [Key Mapping Modes](#key-mapping-modes).

### Audio
*(hover any setting's name for an inline tooltip explaining it)*

| Setting | Range | Description |
|---|---|---|
| **master volume** | 0–100% | Overall output loudness. |
| **velocity sensitivity** | 0–100% | How strongly velocity (mouse-Y / MIDI) affects loudness. 0 = constant, 100 = full dynamic range. |
| **typing velocity** | 1–127 | Fixed loudness for computer-keyboard presses (keyboards can't sense how hard you press). |
| **reverb** | on/off | Adds concert-hall ambience. |
| **reverb amount** | 0–100% | Wet/dry mix when reverb is on. |
| **voice limit** | 8–64 | Max simultaneous notes. Lower saves CPU; higher sounds richer. |

### MIDI
| Setting | Description |
|---|---|
| **midi enabled** | Globally enable/disable MIDI input. |
| **connect midi devices** | Request browser MIDI access (if not already granted). |
| **device list** | Connected inputs with live connection status (hot-plug aware). |
| **sustain cc** | Which MIDI Control Change number acts as the sustain pedal (default **64**). |

---

## Features in Depth

### Sound & dynamics

- **Velocity layers:** each MIDI velocity maps to one of 16 recorded layers, so soft and hard notes are genuinely different recordings — not just volume changes.
- **Natural release:** lifting a key triggers a ~320ms release envelope, so notes fade like a real piano rather than cutting off abruptly.
- **Octave character:** because the samples are real recordings, the bass is naturally dark and powerful while the treble is bright — no artificial EQ involved.
- **Master limiter:** a gentle brick-wall limiter prevents clipping when many notes stack up.

### Sustain (multi-source)

Sustain can be engaged from several places at once — a held key, the on-screen toggle, or a MIDI pedal. The pedal is considered "down" if **any** source is engaged, exactly like a real instrument. Held-but-released notes keep ringing until the pedal lifts.

### Recording

Click **⏺ record** to capture the audio output, then **⏹ stop & save** to download a `.webm` file of your performance. Recording taps the master output, so it captures exactly what you hear (including reverb).

### Visualizer

A waveform line above the keyboard oscillates in real time with the audio. It's drawn on a canvas straight from the audio analyser — amplitude peaks in the center and tapers at the edges.

### Offline support

After your first visit, a Service Worker caches both the app and the samples. Decoded audio is also cached in IndexedDB. On later visits, the piano loads and plays with **no network requests**. (To test offline, use a production build — see [Development](#development).)

### Fullscreen

The **⛶** button in the header toggles fullscreen for a distraction-free, stage-like view.

---

## How It Works (Architecture)

> For the complete, exhaustive breakdown, see **[`ARCHITECTURE.md`](./ARCHITECTURE.md)**. For AI/agent working rules, see **[`AGENTS.md`](./AGENTS.md)**.

The guiding principle:

> **Octype is a real-time audio system that has a React interface — not a React app that plays audio.**

Three subsystems communicate through a central dispatcher and shared stores, but never couple directly:

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   INPUT     │────▶│ InputRouter  │────▶│ AUDIO       │
│ kbd/mouse/  │     │ (singleton)  │     │ ENGINE      │
│ touch/MIDI  │     └──────┬───────┘     │ (singleton) │
└─────────────┘            │             └─────────────┘
                           ▼
                    ┌──────────────┐     ┌─────────────┐
                    │ Zustand      │◀───▶│ UI (React)  │
                    │ stores       │     │             │
                    └──────────────┘     └─────────────┘
```

**The note path:** an input source resolves a key to a MIDI note → `InputRouter.noteOn()` applies transpose, updates the visual store, and calls `AudioEngine.noteOn()` → the engine picks the right sample + velocity layer, computes pitch shift and gain, and starts a `NoteVoice` (a fresh `BufferSource → Gain → reverb → master → limiter → analyser → output` chain). React is only told about the note for the press animation; it plays no part in timing.

Why this matters: React re-renders are unpredictable and can stutter. By keeping all scheduling on the Web Audio clock (`AudioContext.currentTime`) and never routing audio through component state, playback stays tight and glitch-free even while the UI animates.

---

## Project Structure

```
src/
├── app/          # Next.js App Router (layout, page, globals.css)
├── audio/        # Audio engine — never depends on React
│   ├── engine/   # AudioContext, AudioEngine singleton, Scheduler
│   ├── samples/  # SampleLoader, SampleBank, SampleMap, PitchShifter, SampleCache
│   ├── nodes/    # NoteVoice, VoicePool, SustainPedal
│   ├── effects/  # Reverb, DynamicsProcessor (limiter)
│   └── midi/     # MidiManager, MidiParser
├── systems/      # App logic (no audio nodes, no React)
│   ├── input/    # InputRouter, KeyboardInput, MouseInput
│   └── mapping/  # KeyMapping, MappingDefaults, MappingProfiles
├── components/   # React UI (visual only)
│   ├── piano/    # PianoKeyboard, PianoKey, OctaveRange, Visualizer, Recorder, …
│   ├── ui/       # Header, StatusBar, LoadingScreen
│   └── settings/ # SettingsPanel, AudioSettings, CustomMappingModal, MidiDeviceSelector
├── stores/       # Zustand: pianoStore, settingsStore, mappingStore
├── hooks/        # Subscription-only React hooks
├── lib/          # noteUtils, frequencyTable, db (IndexedDB), logger
└── types/        # TypeScript types + Web MIDI ambient declarations

public/
├── samples/salamander/notes/   # the 480 OGG sample files
├── sw.js                       # Service Worker (offline caching)
└── favicon.svg
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict mode) |
| UI | React 18 |
| Styling | Tailwind CSS |
| Animation | Framer Motion |
| State | Zustand |
| Audio | Web Audio API (native) |
| MIDI | Web MIDI API (native) |
| Caching | IndexedDB + Service Worker |

---

## Development

```bash
npm run dev         # Dev server (http://localhost:3000)
npm run build       # Production build — also typechecks and lints
npm run start       # Serve the production build
npm run typecheck   # Type-check only (tsc --noEmit)
npm run lint        # Lint only
```

**Verifying a change:** `npm run build` is the source of truth — it compiles, type-checks, and lints in one pass.

**Testing offline mode:** the dev server can't simulate offline. Build and serve the production app, load it once (let samples cache), then go offline:

```bash
npm run build
npm run start
# load http://localhost:3000, play a bit, then toggle DevTools → Network → Offline and reload
```

---

## Browser Support

| Browser | Audio | MIDI | Notes |
|---|---|---|---|
| Chrome 90+ | ✅ | ✅ | Recommended |
| Edge 90+ | ✅ | ✅ | Recommended |
| Firefox 90+ | ✅ | ❌ | No Web MIDI |
| Safari 15.4+ | ✅ | ❌ | No Web MIDI |

Touch input works on mobile browsers. MIDI requires Chrome or Edge.

---

## Troubleshooting

**Some keys don't play when I hold several at once (e.g. A S D F G).**
That's your laptop keyboard's hardware limit (N-Key Rollover) — it can only register a few simultaneous keys in the same row. It's not a bug. Workarounds: turn on the **sustain toggle** and release keys between presses, use an external/mechanical keyboard, or use a MIDI controller.

**The first time I press a note it's silent, then it works.**
That note's sample hadn't finished loading yet. Octype loads it on demand; the next press plays. Core middle-octave samples load first, the rest stream in the background.

**No sound at all.**
Make sure you clicked **"start piano"** (audio can't start without a user gesture). Check master volume isn't at 0, and that your OS/browser output device is correct.

**Sharp notes are silent / 404 in the console.**
Sample filenames with `#` must be present in `public/samples/salamander/notes/`. Octype URL-encodes them when fetching — you don't need to rename files. Verify the files exist and the folder path is exactly `notes/`.

**MIDI device doesn't appear.**
Use Chrome or Edge, allow the MIDI permission prompt, and check **Settings → MIDI**. Hot-plugging is supported, so plugging in after load should still register.

**Offline mode isn't working in dev.**
The dev server requires a live process. Use `npm run build && npm run start` to test offline.

---

## Roadmap

Implemented:
- Sample playback, velocity layers, pitch shift, 32-voice polyphony, voice stealing
- Sustain (keyboard, on-screen, MIDI), velocity (mouse-Y, MIDI, typing)
- Default / Max / Custom mappings with editor and persistence
- Visible-vs-mapped range model
- Reverb, limiter, master volume
- Progressive loading, IndexedDB + Service Worker offline
- MIDI input with hot-plug
- Touch + glissando, fullscreen, recording, visualizer

Planned / ideas:
- Sympathetic resonance (held-note harmonic excitation)
- Round-robin sample variation per note
- Key-noise / mechanical click samples
- Per-register tonal shaping

---

## Credits & License

- **Samples:** Salamander Grand Piano by **Alexander Holm**, licensed under **CC BY 3.0**. You must supply your own copy of the samples (see [Sample Setup](#sample-setup)).
- **Octype application code:** add your chosen license here.

---

*Built as a study in real-time browser audio — proving a sampled grand piano can feel immediate and expressive without leaving the browser.*
