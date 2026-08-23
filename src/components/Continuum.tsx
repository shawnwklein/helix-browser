import { findEchoes } from "../lib/echo";
import { useHelix } from "../store";

export function Continuum() {
  const s = useHelix();
  const echoes = findEchoes(
    s.continuum.question || s.omnibox,
    s.echoes,
  );

  return (
    <aside className="continuum">
      <div className="pane-head">
        <span className="pane-kicker">The spine</span>
        <button className="ico" onClick={s.toggleContinuum} title="Close">
          ×
        </button>
      </div>
      <div className="pane-body">
        <p className="spine-q">
          {s.continuum.question ||
            "Ask something and Helix will keep the argument here while you wander."}
        </p>

        {s.continuum.findings.length > 0 && (
          <>
            <div className="section-label" style={{ marginTop: 0 }}>
              Findings
            </div>
            {s.continuum.findings
              .slice()
              .reverse()
              .slice(0, 16)
              .map((f) => (
                <div key={f.id} className="vertebra">
                  <i className={`dot ${f.stance}`} />
                  <div className={`v-stance ${f.stance}`}>{f.stance}</div>
                  <div className="v-text">{f.text}</div>
                </div>
              ))}
          </>
        )}

        {s.continuum.openQuestions.length > 0 && (
          <>
            <div className="section-label">Still open</div>
            {s.continuum.openQuestions.map((q) => (
              <button
                key={q}
                className="q-chip"
                onClick={() => s.startResearch(q)}
              >
                {q}
              </button>
            ))}
          </>
        )}

        {echoes.length > 0 && (
          <>
            <div className="section-label">Echoes</div>
            {echoes.map((e) => (
              <button
                key={e.id}
                className="echo-card"
                onClick={() =>
                  e.url ? s.navigate(e.url) : e.query && s.startResearch(e.query)
                }
              >
                {e.title}
                <small>
                  {e.url ? "You've been here" : "You've asked this"} ·{" "}
                  {timeAgo(e.at)}
                </small>
              </button>
            ))}
          </>
        )}
      </div>
    </aside>
  );
}

function timeAgo(at: number) {
  const m = Math.max(1, Math.round((Date.now() - at) / 60000));
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}
