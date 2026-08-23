import { useEffect, useState } from "react";
import { HelixLogo } from "../components/HelixLogo";
import { commitToIntent, omniboxEnter, previewIntent, type Intent } from "../lib/intent";
import { STARTERS } from "../lib/starters";
import { tabIsFaceInbox } from "../lib/faces";
import { activeFace, useHelix } from "../store";

export function Constellation() {
  const s = useHelix();
  const [q, setQ] = useState("");
  const [split, setSplit] = useState(false);
  const preview = previewIntent(q);
  const face = activeFace(s);
  const inboxOpen = Boolean(face && s.tabs.some((t) => tabIsFaceInbox(t, face)));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSplit(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const submit = (forced?: Intent) => {
    const raw = q.trim();
    if (!raw) return;
    if (forced) {
      const intent = commitToIntent(forced);
      if (!intent) return;
      setSplit(false);
      s.submitOmnibox(raw, intent);
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
  };

  return (
    <div
      className="constellation"
      style={{ ["--face" as string]: face?.color }}
    >
      <div className="hero">
        <div className="logo-row">
          <i className="face-dot" />
          Browsing as <b>{face?.name}</b>
        </div>
        <h1>
          Read the web
          <br />
          <em>with a spine.</em>
        </h1>
        <p className="lede">
          This thread is <b>{face?.name}</b>’s — cookies locked to this Face,
          same window. Grok is the other strand: Scout, Skeptic, Fork.
        </p>
        <form
          className={`ask-field${split ? " split-open" : ""}`}
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <HelixLogo />
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setSplit(false);
            }}
            placeholder="A real question, or a URL"
            autoFocus
            spellCheck={false}
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              e.preventDefault();
              e.stopPropagation();
              if (e.metaKey || e.ctrlKey) {
                submit({ type: "ask", query: q.trim() });
              } else {
                submit();
              }
            }}
          />
          <button
            className="ask-go"
            type="submit"
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
        {face?.homeUrl ? (
          <div className="outlook-hero has-inbox">
            <button
              className="outlook-hero-btn rest"
              onClick={() => s.openFaceHome(face.id)}
            >
              <span className="kicker">{face.name}</span>
              <h3>{inboxOpen ? "Back to inbox" : "Open inbox"}</h3>
              <p>
                {face.homeUrl
                  .replace(/^https?:\/\//, "")
                  .replace(/\/mail\/?$/, "")
                  .replace(/\/$/, "")}{" "}
                · already this Face
              </p>
            </button>
            <button
              className="outlook-hero-btn recede"
              onClick={() => s.setOutlookPickerOpen(true)}
            >
              <span className="kicker">Work or personal</span>
              <h3>Add Outlook</h3>
              <p>Another locked jar — same sheet as + Outlook</p>
            </button>
          </div>
        ) : (
          <div className="outlook-hero">
            <button
              className="outlook-hero-btn recruit"
              onClick={() => s.addOutlook("outlook-work")}
            >
              <span className="kicker">Work or school</span>
              <h3>Add Outlook</h3>
              <p>outlook.office.com · its own cookies, its own Face</p>
            </button>
            <button
              className="outlook-hero-btn recruit"
              onClick={() => s.addOutlook("outlook-personal")}
            >
              <span className="kicker">Personal Microsoft</span>
              <h3>Add another inbox</h3>
              <p>outlook.live.com · sits beside work, never inside it</p>
            </button>
          </div>
        )}
        {!window.helix && (
          <p className="web-note">
            Full account isolation needs the Helix desktop app. This web preview
            can still open Outlook, but Microsoft cookies are shared here.
          </p>
        )}
        <div className="starters">
          {STARTERS.map((st) => (
            <button
              key={st.kicker}
              className="starter"
              onClick={() => s.startResearch(st.query)}
            >
              <div className="kicker">{st.kicker}</div>
              <h3>{st.title}</h3>
            </button>
          ))}
        </div>
        {s.continuum.question && (
          <button
            className="starter"
            style={{ marginTop: 10, width: "100%" }}
            onClick={() => s.startResearch(s.continuum.question)}
          >
            <div className="kicker">Continue</div>
            <h3>{s.continuum.question}</h3>
          </button>
        )}
      </div>
    </div>
  );
}
