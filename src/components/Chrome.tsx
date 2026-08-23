import { useEffect, useRef, useState } from "react";
import { parseOmnibox, previewIntent } from "../lib/intent";
import { activeFace, activeTab, faceOf, useHelix } from "../store";
import { FaceBar } from "./FaceBar";
import { HelixLogo } from "./HelixLogo";

export function Chrome() {
  const s = useHelix();
  const tab = activeTab(s);
  const streaming = Boolean(tab?.answer?.streaming);
  const input = useRef<HTMLInputElement>(null);
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
        const face = h.faces[Number(e.code.slice(5)) - 1];
        if (face) {
          e.preventDefault();
          h.setActiveFace(face.id);
        }
      }
      if (e.key === "Escape") {
        h.setCommandOpen(false);
        h.setSettingsOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (s.omniboxFocus) input.current?.focus();
  }, [s.omniboxFocus]);

  const submit = (forced?: ReturnType<typeof parseOmnibox>) => {
    setSplit(false);
    s.submitOmnibox(s.omnibox, forced);
    input.current?.blur();
  };

  const face = activeFace(s);

  return (
    <header className="chrome">
      <FaceBar />
      <div className="tabs">
        {s.tabs.map((t) => (
          <div
            key={t.id}
            className={`tab${t.id === s.activeId ? " active" : ""}${t.isFork ? " fork" : ""}`}
            style={{ ["--face" as string]: faceOf(s, t.faceId)?.color }}
            onClick={() => s.activate(t.id)}
            title={`${t.title} · ${faceOf(s, t.faceId)?.name || ""}`}
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
        <button className="tab-add" onClick={s.newTab} title="New tab">
          +
        </button>
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
          className="omnibox"
          onSubmit={(e) => {
            e.preventDefault();
            if (preview.type === "ambiguous") {
              setSplit(true);
              return;
            }
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
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                submit({ type: "ask", query: s.omnibox.trim() });
              }
            }}
          />
          <span
            className={`intent-hint ${preview.type === "go" ? "go" : "ask"}`}
          >
            {preview.type === "go"
              ? "Go"
              : preview.type === "command"
                ? "Command"
                : preview.type === "ambiguous"
                  ? "Ask or go"
                  : "Ask"}
          </span>
          {split && preview.type === "ambiguous" && (
            <div className="intent-split">
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  submit({ type: "go", url: preview.url });
                }}
              >
                <b>Go to {preview.url.replace(/^https?:\/\//, "")}</b>
                <span>Open as a Chromium page</span>
              </button>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  submit({ type: "ask", query: preview.text });
                }}
              >
                <b>Ask Grok about {preview.text}</b>
                <span>Research with the live web and X</span>
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
