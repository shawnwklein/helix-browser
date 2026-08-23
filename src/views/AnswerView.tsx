import { Markdown } from "../components/Markdown";
import { hostOf } from "../lib/intent";
import type { Tab } from "../lib/types";
import { useHelix } from "../store";

export function AnswerView({ tab }: { tab: Tab }) {
  const s = useHelix();
  const a = tab.answer;
  if (!a) return null;
  const xCites = a.citations.filter((c) => c.kind === "x");
  const webCites = a.citations.filter((c) => c.kind !== "x");

  return (
    <div className="answer">
      <div className="answer-inner">
        <div className={`strand${tab.isFork ? " fork" : ""}`}>
          <i />
          <i />
        </div>
        <div className="kicker-row">
          <span>{tab.isFork ? "Fork" : "Research"}</span>
          <span>·</span>
          <span>{s.demo ? "demo orbit" : s.model}</span>
          {a.streaming && <span>· live</span>}
        </div>
        {a.streaming && !a.title && (
          <div className="phase">
            <i className="pulse" />
            {a.phaseLabel}
          </div>
        )}
        <h1>
          {a.title ||
            (tab.isFork ? "Forking the thesis…" : tab.query)}
        </h1>
        {a.verdict && <p className="verdict">{a.verdict}</p>}
        {a.error && <div className="err">{a.error}</div>}

        {(a.holds.length > 0 || a.fails.length > 0) && (
          <div className="split-board">
            <div className="split-col holds">
              <h2>What holds</h2>
              <ul>
                {a.holds.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
            </div>
            <div className="split-col fails">
              <h2>What fails</h2>
              <ul>
                {a.fails.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {a.tensions.length > 0 && (
          <div className="tensions">
            {a.tensions.map((t) => (
              <span key={t} className="tension">
                {t}
              </span>
            ))}
          </div>
        )}

        <Markdown text={a.essay} />

        {(webCites.length > 0 || a.nextTabs.length > 0) && (
          <>
            <div className="section-label">Sources · open as Chromium tabs</div>
            <div className="filmstrip">
              {(a.nextTabs.length ? a.nextTabs : webCites).map((c, i) => {
                const url = "url" in c ? c.url : "";
                const title = "title" in c ? c.title : hostOf(url);
                return (
                  <button
                    key={url + i}
                    className="source"
                    onClick={() => s.navigate(url)}
                  >
                    <div className="host">{hostOf(url)}</div>
                    <b>{title}</b>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {xCites.length > 0 && (
          <>
            <div className="section-label">X pulse</div>
            <div className="filmstrip">
              {xCites.map((c) => (
                <button
                  key={c.url}
                  className="source x"
                  onClick={() => s.navigate(c.url)}
                >
                  <div className="host">X</div>
                  <b>{c.title}</b>
                </button>
              ))}
            </div>
          </>
        )}

        {a.followups.length > 0 && (
          <div className="followups">
            <h3>Sharper next</h3>
            <div className="follow-grid">
              {a.followups.map((q) => (
                <button key={q} className="follow" onClick={() => s.followUp(q)}>
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="answer-actions">
          <button
            className="btn fork"
            onClick={() => s.forkClaim(a.verdict || tab.query || "")}
          >
            Fork this thesis
          </button>
          <button className="btn" onClick={() => s.runMind("skeptic")}>
            Run Skeptic
          </button>
          <button className="btn" onClick={() => s.runMind("scout")}>
            Run Scout
          </button>
          <button
            className="btn"
            onClick={() =>
              webCites.concat(a.nextTabs as typeof webCites).forEach((c) => {
                if (c.url) s.navigate(c.url);
              })
            }
          >
            Open sources
          </button>
        </div>
      </div>
    </div>
  );
}
