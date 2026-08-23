import { useState } from "react";
import { HelixLogo } from "../components/HelixLogo";
import { parseOmnibox } from "../lib/intent";
import { STARTERS } from "../lib/starters";
import { useHelix } from "../store";

export function Constellation() {
  const s = useHelix();
  const [q, setQ] = useState("");

  return (
    <div className="constellation">
      <div className="hero">
        <div className="logo-row">
          <HelixLogo size={28} />
          Helix · Grok-native Chromium
        </div>
        <h1>
          Read the web
          <br />
          <em>with a spine.</em>
        </h1>
        <p className="lede">
          Faces are who you are on the web — Chrome profiles, rebuilt. Each
          Outlook account is a locked Chromium identity in this same window.
          Grok still sits on the other strand: Scout, Skeptic, Fork.
        </p>
        <form
          className="ask-field"
          onSubmit={(e) => {
            e.preventDefault();
            const raw = q.trim();
            if (!raw) return;
            s.submitOmnibox(raw, parseOmnibox(raw));
          }}
        >
          <HelixLogo />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="A real question, or a URL"
            autoFocus
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              e.preventDefault();
              const raw = q.trim();
              if (!raw) return;
              s.submitOmnibox(raw, parseOmnibox(raw));
            }}
          />
          <button className="ask-go" type="submit">
            {parseOmnibox(q).type === "go" ? "Go" : "Ask"}
          </button>
        </form>
        <div className="outlook-hero">
          <button
            className="outlook-hero-btn"
            onClick={() => s.addOutlook("outlook-work")}
          >
            <span className="kicker">Work or school</span>
            <h3>Add Outlook</h3>
            <p>outlook.office.com · its own cookies, its own Face</p>
          </button>
          <button
            className="outlook-hero-btn"
            onClick={() => s.addOutlook("outlook-personal")}
          >
            <span className="kicker">Personal Microsoft</span>
            <h3>Add another inbox</h3>
            <p>outlook.live.com · sits beside work, never inside it</p>
          </button>
        </div>
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
