"use client";

/**
 * MidiDeviceSelector — lists discovered MIDI inputs and exposes
 * enable/disable toggles + the sustain CC selector.
 */

import { requestMidi, useMidiState } from "@/hooks/useMidi";
import { useSettingsStore } from "@/stores/settingsStore";

export function MidiDeviceSelector(): JSX.Element {
  const state = useMidiState();
  const midiEnabled = useSettingsStore((s) => s.midiEnabled);
  const setMidiEnabled = useSettingsStore((s) => s.setMidiEnabled);
  const sustainCC = useSettingsStore((s) => s.midiSustainCC);
  const setSustainCC = useSettingsStore((s) => s.setMidiSustainCC);

  const showRequestButton =
    state.availability === "idle" ||
    state.availability === "denied" ||
    state.availability === "error";

  return (
    <div className="space-y-3">
      {state.availability === "unsupported" && (
        <p className="font-mono text-[11px] leading-relaxed text-fg-subtle">
          Web MIDI is not supported in this browser. Try Chrome or Edge.
        </p>
      )}

      {state.availability !== "unsupported" && (
        <>
          <div className="flex items-center justify-between gap-4">
            <span className="font-mono text-xs text-fg-muted">midi enabled</span>
            <Switch active={midiEnabled} onClick={() => setMidiEnabled(!midiEnabled)} />
          </div>

          {showRequestButton && (
            <button
              type="button"
              onClick={() => {
                void requestMidi();
              }}
              className="w-full rounded-md border border-accent/40 bg-accent/10 px-3 py-2 font-mono text-xs text-accent-soft transition-colors hover:bg-accent/20"
            >
              {state.availability === "denied"
                ? "request midi access again"
                : "connect midi devices"}
            </button>
          )}

          {state.availability === "requesting" && (
            <p className="font-mono text-[11px] text-fg-subtle">
              waiting for permission…
            </p>
          )}

          {state.availability === "granted" && (
            <DeviceList devices={state.devices} />
          )}

          {state.error !== null && (
            <p className="font-mono text-[11px] text-red-400/80">
              {state.error}
            </p>
          )}

          <div className="flex items-center justify-between gap-4">
            <span className="font-mono text-xs text-fg-muted">sustain cc</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSustainCC(sustainCC - 1)}
                className="rounded-md border border-bg-subtle bg-bg-elevated px-2 py-1 font-mono text-xs text-fg-muted hover:border-accent/40 hover:text-fg"
              >
                −
              </button>
              <span className="w-8 text-center font-mono text-sm text-fg">
                {sustainCC}
              </span>
              <button
                type="button"
                onClick={() => setSustainCC(sustainCC + 1)}
                className="rounded-md border border-bg-subtle bg-bg-elevated px-2 py-1 font-mono text-xs text-fg-muted hover:border-accent/40 hover:text-fg"
              >
                +
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function DeviceList({
  devices,
}: {
  devices: ReturnType<typeof useMidiState>["devices"];
}): JSX.Element {
  if (devices.length === 0) {
    return (
      <p className="font-mono text-[11px] text-fg-subtle">
        no devices connected. plug in a midi keyboard and it appears here.
      </p>
    );
  }
  return (
    <ul className="space-y-1.5">
      {devices.map((d) => (
        <li
          key={d.id}
          className="flex items-center justify-between rounded-md border border-bg-subtle bg-bg-elevated px-3 py-2"
        >
          <div className="flex flex-col">
            <span className="font-mono text-xs text-fg">{d.name}</span>
            {d.manufacturer.length > 0 && (
              <span className="font-mono text-[10px] text-fg-subtle">
                {d.manufacturer}
              </span>
            )}
          </div>
          <span
            className={[
              "font-mono text-[10px]",
              d.state === "connected" ? "text-accent-soft" : "text-fg-subtle",
            ].join(" ")}
          >
            {d.state}
          </span>
        </li>
      ))}
    </ul>
  );
}

function Switch({
  active,
  onClick,
}: {
  active: boolean;
  onClick: () => void;
}): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      role="switch"
      aria-checked={active}
      className={[
        "relative h-6 w-11 shrink-0 overflow-hidden rounded-full border transition-colors",
        active
          ? "border-accent/40 bg-accent/30"
          : "border-bg-subtle bg-bg-DEFAULT",
      ].join(" ")}
    >
      <span
        className={[
          "absolute top-[3px] h-4 w-4 rounded-full transition-all",
          active ? "left-[22px] bg-accent-soft" : "left-[3px] bg-fg-muted",
        ].join(" ")}
      />
    </button>
  );
}
