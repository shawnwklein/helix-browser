import type { MindMode } from "../lib/types";
import { useHelix } from "../store";
import { Markdown } from "./Markdown";

const MODES: { id: MindMode; label: string }[] = [
  { id: "scout", label: "Scout" },
  { id: "skeptic", label: "Skeptic" },
  { id: "numbers", label: "Numbers" },
  { id: "compare", label: "Compare" },
];

export function MindPane() {
  const s = useHelix();
  const mine = s.mind.filter(
    (m) => m.mode === s.mindMode || s.mindMode === "compare",
  );
  const shown =
    s.mindMode === "compare" ? s.mind.filter((m) => m.mode === "compare") : mine;

  return (
    <aside className="mind">
      <div className="pane-head">
        <span className="pane-kicker">Split mind</span>
        <button className="ico" onClick={s.toggleMind} title="Close">
          ×
        </button>
      </div>
      <div className="mind-modes">
        {MODES.map((m) => (
          <button
            key={m.id}
            className={`${m.id}${s.mindMode === m.id ? " on" : ""}`}
            onClick={() => {
              s.setMindMode(m.id);
              s.runMind(m.id);
            }}
          >
            {m.label}
          </button>
        ))}
      </div>
      <div className="pane-body">
        <p className="v-text" style={{ marginBottom: 14 }}>
          {s.mindMode === "scout" &&
            "Scout extracts what is useful, novel, and connected."}
          {s.mindMode === "skeptic" &&
            "Skeptic leaves the page and checks the load-bearing claims."}
          {s.mindMode === "numbers" &&
            "Every figure, with the unit and who measured it."}
          {s.mindMode === "compare" &&
            "Where the open tabs agree, contradict, and who is closer to a primary source."}
        </p>
        {shown.length === 0 && (
          <button className="btn primary" onClick={() => s.runMind(s.mindMode)}>
            Run {s.mindMode}
          </button>
        )}
        {shown
          .slice()
          .reverse()
          .map((m) => (
            <article key={m.id} className={`mind-msg ${m.mode}`}>
              <div className="who">
                {m.mode}
                {m.streaming ? " · writing" : ""}
              </div>
              <Markdown text={m.text || (m.streaming ? "…" : "")} />
            </article>
          ))}
      </div>
    </aside>
  );
}
