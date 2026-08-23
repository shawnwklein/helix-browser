import { useEffect, useMemo, useState } from "react";
import { COMMANDS } from "../lib/starters";
import { saveKey } from "../lib/client";
import { useHelix } from "../store";

export function CommandPalette() {
  const s = useHelix();
  const [q, setQ] = useState("");
  const items = useMemo(() => {
    const all = [
      { k: "new", label: "New thread", run: () => s.newTab() },
      {
        k: "outlook",
        label: "Add work Outlook Face",
        run: () => s.addOutlook("outlook-work"),
      },
      {
        k: "outlook-personal",
        label: "Add personal Microsoft Outlook",
        run: () => s.addOutlook("outlook-personal"),
      },
      { k: "face", label: "New Face", run: () => s.addFace() },
      { k: "continuum", label: "Toggle Continuum", run: s.toggleContinuum },
      { k: "mind", label: "Toggle Split Mind", run: s.toggleMind },
      { k: "settings", label: "Settings / API key", run: () => s.setSettingsOpen(true) },
      ...COMMANDS.map((c) => ({
        k: c.cmd,
        label: `${c.cmd} — ${c.hint}`,
        run: () => s.runCommand(c.cmd.slice(1)),
      })),
    ];
    const n = q.toLowerCase();
    return n ? all.filter((i) => i.label.toLowerCase().includes(n) || i.k.includes(n)) : all;
  }, [q, s]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" && items[0]) {
        e.preventDefault();
        items[0].run();
        s.setCommandOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [items, s]);

  if (!s.commandOpen) return null;
  return (
    <div className="modal-back" onClick={() => s.setCommandOpen(false)}>
      <div className="palette" onClick={(e) => e.stopPropagation()}>
        <input
          autoFocus
          placeholder="Command Helix…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {items.map((i, n) => (
          <button
            key={i.k}
            className={`pal-item${n === 0 ? " active" : ""}`}
            onClick={() => {
              i.run();
              s.setCommandOpen(false);
            }}
          >
            {i.label}
            <kbd>{i.k}</kbd>
          </button>
        ))}
      </div>
    </div>
  );
}

export function SettingsModal() {
  const s = useHelix();
  const [key, setKey] = useState(() => localStorage.getItem("helix:key") || "");
  if (!s.settingsOpen) return null;
  return (
    <div className="modal-back" onClick={() => s.setSettingsOpen(false)}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="pane-kicker">SpaceXAI</div>
        <h2>Give Helix a Grok key</h2>
        <p>
          Helix talks only to xAI — model {s.model} — with live web search and X
          search. The key stays on this machine (environment, or this session).
          It is never shipped into page worlds.
        </p>
        <input
          type="password"
          placeholder="xai-…"
          value={key}
          onChange={(e) => setKey(e.target.value)}
        />
        <p style={{ fontSize: 12 }}>
          Create a key at console.x.ai. Without one, Helix stays in demo orbit:
          the chrome is real, the fusion starter is canned, and no invented
          citations are presented as live.
        </p>
        <div className="row">
          <button className="btn" onClick={() => s.setSettingsOpen(false)}>
            Close
          </button>
          <button
            className="btn primary"
            onClick={async () => {
              await saveKey(key.trim());
              await s.refreshStatus();
              s.setSettingsOpen(false);
            }}
          >
            Use this key
          </button>
        </div>
      </div>
    </div>
  );
}
