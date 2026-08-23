import { useState } from "react";
import { HelixLogo } from "../components/HelixLogo";
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
          One strand is the page. The other is Grok — Scout extracting, Skeptic
          stress-testing, Fork arguing the opposite. The Continuum keeps the
          argument when the tab is gone.
        </p>
        <form
          className="ask-field"
          onSubmit={(e) => {
            e.preventDefault();
            if (q.trim()) s.submitOmnibox(q);
          }}
        >
          <HelixLogo />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="A real question, or a URL"
            autoFocus
          />
          <button className="ask-go" type="submit">
            Ask
          </button>
        </form>
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
