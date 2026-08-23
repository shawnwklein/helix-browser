import { useLayoutEffect, useRef } from "react";
import type { Tab } from "../lib/types";
import { hostOf } from "../lib/intent";
import { useHelix } from "../store";

export function PageView({ tab }: { tab: Tab }) {
  const s = useHelix();
  const desktop = Boolean(window.helix);
  const live = tab.viewMode !== "reader";
  const slot = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!desktop) return;
    const send = () => {
      const el = slot.current;
      if (!live) {
        window.helix?.hidePage();
        return;
      }
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (r.width < 4 || r.height < 4) return;
      window.helix.setContentBounds({
        x: Math.round(r.left),
        y: Math.round(r.top),
        width: Math.round(r.width),
        height: Math.round(r.height),
      });
    };
    send();
    const ro = new ResizeObserver(send);
    if (slot.current) ro.observe(slot.current);
    window.addEventListener("resize", send);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", send);
    };
  }, [desktop, live, tab.id, tab.url, s.continuumOpen, s.mindOpen]);

  return (
    <div className="page">
      <div className="page-bar">
        <div className="seg">
          <button
            className={live ? "on" : ""}
            onClick={() => s.setViewMode("live")}
          >
            Live Chromium
          </button>
          <button
            className={!live ? "on" : ""}
            onClick={() => s.setViewMode("reader")}
          >
            Helix Reader
          </button>
        </div>
        <span className="pane-kicker" style={{ marginLeft: 8 }}>
          {hostOf(tab.url)}
        </span>
        <span
          className="page-face"
          style={{
            ["--face" as string]:
              s.faces.find((f) => f.id === tab.faceId)?.color || "#d4a06a",
          }}
        >
          {s.faces.find((f) => f.id === tab.faceId)?.name}
        </span>
        <div className="ghost">
          <button onClick={() => s.runMind("scout")}>Scout</button>
          <button onClick={() => s.runMind("skeptic")}>Skeptic</button>
          <button onClick={() => s.runMind("numbers")}>Numbers</button>
          <button
            onClick={() =>
              s.forkClaim(
                tab.extract?.excerpt || tab.title || tab.url || "",
              )
            }
          >
            Fork
          </button>
        </div>
      </div>

      {live ? (
        desktop ? (
          <div ref={slot} className="live-frame" />
        ) : (
          <iframe
            className="live-frame"
            title={tab.title}
            src={tab.url}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
          />
        )
      ) : tab.extract ? (
        <article className="reader">
          <div className="reader-inner">
            <header>
              <div className="site">{tab.extract.siteName || hostOf(tab.url)}</div>
              <h1>{tab.extract.title}</h1>
              <div className="byline">
                {tab.extract.byline || "Helix Reader"} ·{" "}
                {Math.round(tab.extract.length / 900) || 1} min
              </div>
            </header>
            <div
              className="reader-article"
              dangerouslySetInnerHTML={{ __html: tab.extract.content }}
            />
          </div>
        </article>
      ) : (
        <div className="page-empty">
          <div>
            <h2>
              {tab.extractError
                ? "This page would not be read"
                : "Pulling the document…"}
            </h2>
            <p>
              {tab.extractError ||
                "Helix Reader is fetching a clean copy so Scout and Skeptic have something to hold."}
            </p>
            {tab.extractError && (
              <button className="btn primary" onClick={() => s.setViewMode("live")}>
                Stay on live Chromium
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
