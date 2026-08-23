import { useEffect, useRef, useState } from "react";
import { clusterTabsByFace, faceIndexFromDigitCode, faceSwitchChord } from "../lib/faces";
import { commitToIntent, omniboxEnter, previewIntent, type Intent } from "../lib/intent";
import { activeFace, activeTab, useHelix } from "../store";
import { FaceBar } from "./FaceBar";
import { HelixLogo } from "./HelixLogo";

export function Chrome() {
  const s = useHelix();
  const tab = activeTab(s);
  const streaming = Boolean(tab?.answer?.streaming);
  const input = useRef<HTMLInputElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const preview = previewIntent(s.omnibox);
  const [split, setSplit] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const h = useHelix.getState();
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === "l") {
        e.preventDefault();
        input.current?.focus();
        input.current?.select();
      }
      if (meta && e.key.toLowerCase() === "t") {
        e.preventDefault();
        h.newTab();
      }
      if (meta && e.key.toLowerCase() === "w") {
        e.preventDefault();
        h.closeTab(h.activeId);
      }
      if (meta && e.key.toLowerCase() === "k") {
        e.preventDefault();
        h.setCommandOpen(true);
      }
      if (meta && e.shiftKey && e.key.toLowerCase() === "c") {
        e.preventDefault();
        h.toggleContinuum();
      }
      if (meta && e.shiftKey && e.key.toLowerCase() === "m") {
        e.preventDefault();
        h.toggleMind();
      }
      if (meta && e.shiftKey && e.key.toLowerCase() === "o") {
        e.preventDefault();
        h.addOutlook("outlook-work");
      }
      if (meta && e.shiftKey && e.code.startsWith("Digit")) {
        const index = faceIndexFromDigitCode(e.code);
        const face = index == null ? undefined : h.faces[index];
        if (face) {
          e.preventDefault();
          h.setActiveFace(face.id);
        }
      }
      if (e.key === "Escape") {
        h.setCommandOpen(false);
        h.setSettingsOpen(false);
        setSplit(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (s.omniboxFocus) input.current?.focus();
  }, [s.omniboxFocus]);

  useEffect(() => {
    const current = tabsRef.current?.querySelector<HTMLElement>(".tab-cluster.current");
    if (!current) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    current.scrollIntoView({ inline: "nearest", block: "nearest", behavior: reduce ? "auto" : "smooth" });
  }, [s.activeFaceId, s.activeId]);

  const submit = (forced?: Intent) => {
    const raw = (input.current?.value ?? s.omnibox).trim();
    if (!raw) return;
    if (forced) {
      const intent = commitToIntent(forced);
      if (!intent) return;
      setSplit(false);
      s.submitOmnibox(raw, intent);
      input.current?.blur();
      return;
    }
    const commit = omniboxEnter(raw, { chooserOpen: split });
    const intent = commitToIntent(commit);
    if (!intent) {
      setSplit(true);
      return;
    }
    setSplit(false);
    s.submitOmnibox(raw, intent);
    input.current?.blur();
  };

  const face = activeFace(s);
  const clusters = clusterTabsByFace(s.faces, s.tabs);
  const labeled = clusters.length > 1;
  const currentHasCluster = clusters.some((c) => c.face.id === s.activeFaceId);

  return (
    <header className="chrome">
      <FaceBar />
      <div className="tabs" ref={tabsRef}>
        {clusters.map((cluster) => {
          const current = cluster.face.id === s.activeFaceId;
          const chord = faceSwitchChord(
            s.faces.findIndex((f) => f.id === cluster.face.id),
          );
          return (
            <div
              key={cluster.face.id}
              className={`tab-cluster${current ? " current" : ""}${labeled ? "" : " solo"}`}
              style={{ ["--face" as string]: cluster.face.color }}
              role="group"
              aria-label={cluster.face.name}
            >
              {labeled && (
                <button
                  type="button"
                  className="tab-cluster-kicker"
                  title={`Browse as ${cluster.face.name}${chord ? `  ${chord}` : ""}`}
                  onClick={() => s.setActiveFace(cluster.face.id)}
                >
                  <i className="face-dot" />
                  <span>{cluster.face.name}</span>
                </button>
              )}
              {cluster.tabs.map((t) => (
                <div
                  key={t.id}
                  className={`tab${t.id === s.activeId ? " active" : ""}${t.isFork ? " fork" : ""}`}
                  style={{ ["--face" as string]: cluster.face.color }}
                  onClick={() => s.activate(t.id)}
                  title={`${t.title} · ${cluster.face.name}`}
                >
                  <TabGlyph kind={t.kind} fork={t.isFork} url={t.url} />
                  <span className="tab-title">{t.title}</span>
                  <button
                    className="tab-x"
                    aria-label="Close tab"
                    onClick={(e) => {
                      e.stopPropagation();
                      s.closeTab(t.id);
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
              {current && (
                <button
                  className="tab-add"
                  onClick={() => s.newTab(cluster.face.id)}
                  title="New tab"
                >
                  +
                </button>
              )}
            </div>
          );
        })}
        {!currentHasCluster && (
          <button className="tab-add" onClick={() => s.newTab()} title="New tab">
            +
          </button>
        )}
      </div>
      <div className="toolbar">
        <button className="ico" onClick={s.toggleContinuum} title="Continuum">
          ≡
        </button>
        <button className="ico" onClick={s.goBack} title="Back" disabled={!tab?.canGoBack}>
          ←
        </button>
        <button className="ico" onClick={s.goForward} title="Forward" disabled={!tab?.canGoForward}>
          →
        </button>
        <button className="ico" onClick={s.reload} title="Reload">
          ↻
        </button>
        <form
          className={`omnibox${split ? " split-open" : ""}`}
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <HelixLogo spinning={streaming} />
          <span
            className="omnibox-face"
            style={{ ["--face" as string]: face?.color }}
            title={face?.name}
          >
            {face?.name}
          </span>
          <input
            ref={input}
            value={s.omnibox}
            placeholder="Ask the web, or go somewhere"
            spellCheck={false}
            onChange={(e) => {
              s.setOmnibox(e.target.value);
              setSplit(false);
            }}
            onFocus={() => s.setOmniboxFocus(true)}
            onBlur={() => s.setOmniboxFocus(false)}
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              e.preventDefault();
              e.stopPropagation();
              if (e.metaKey || e.ctrlKey) {
                submit({ type: "ask", query: (input.current?.value ?? s.omnibox).trim() });
              } else {
                submit();
              }
            }}
          />
          <button
            type="submit"
            className={`intent-hint ${preview.type === "go" ? "go" : "ask"}${split ? " open" : ""}`}
            aria-expanded={preview.type === "ambiguous" ? split : undefined}
            aria-haspopup={preview.type === "ambiguous" ? "listbox" : undefined}
          >
            {preview.type === "go"
              ? "Go"
              : preview.type === "command"
                ? "Command"
                : preview.type === "ambiguous"
                  ? split
                    ? "Ask"
                    : "Ask or go"
                  : "Ask"}
          </button>
          {split && preview.type === "ambiguous" && (
            <div className="intent-split" role="listbox" aria-label="Ask or go">
              <button
                type="button"
                className="ask-default"
                role="option"
                aria-selected="true"
                onMouseDown={(e) => {
                  e.preventDefault();
                  submit({ type: "ask", query: preview.text });
                }}
              >
                <b>
                  Ask Grok about {preview.text}
                  <kbd className="enter-hint">Enter</kbd>
                </b>
                <span>Research with the live web and X</span>
              </button>
              <button
                type="button"
                className="go-as-face"
                role="option"
                aria-selected="false"
                style={{ ["--face" as string]: face?.color }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  submit({ type: "go", url: preview.url });
                }}
              >
                <b>
                  Go to {preview.url.replace(/^https?:\/\//, "")} as{" "}
                  <i className="as-face">{face?.name}</i>
                </b>
                <span>This Face’s Chromium — cookies stay here</span>
              </button>
            </div>
          )}
        </form>
        <button
          className="ico hide-narrow"
          title="Command palette"
          onClick={() => s.setCommandOpen(true)}
        >
          ⌘
        </button>
        <button
          className={`ico ice${s.mindOpen ? " on" : ""}`}
          title="Split Mind"
          onClick={s.toggleMind}
        >
          ◇
        </button>
        <button
          className="ico hide-narrow"
          title="Mosaic"
          onClick={() => s.runCommand("mosaic")}
        >
          ▦
        </button>
        <button
          className={(s.demo ? "demo-pill" : "live-pill") + " hide-narrow"}
          onClick={() => s.setSettingsOpen(true)}
          title="Settings"
        >
          {s.demo ? "Demo orbit" : "Grok live"}
        </button>
      </div>
    </header>
  );
}

function TabGlyph({
  kind,
  fork,
  url,
}: {
  kind: string;
  fork?: boolean;
  url?: string;
}) {
  if (kind === "page" && url) {
    let host = url;
    try {
      host = new URL(url).hostname;
    } catch {
      /* keep */
    }
    return (
      <img
        className="tab-icon"
        src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=32`}
        alt=""
      />
    );
  }
  return (
    <span
      className={`glyph ${kind}${fork ? " fork" : ""}`}
      aria-hidden
    />
  );
}
