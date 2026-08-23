import { useHelix } from "../store";

export function MosaicView() {
  const s = useHelix();
  const cards = [
    ...s.continuum.findings.map((f) => ({
      id: f.id,
      kind: f.stance,
      title: f.text,
      body: "",
      run: () => s.activate(f.tabId),
    })),
    ...s.tabs
      .filter((t) => t.kind !== "home" && t.kind !== "mosaic")
      .map((t) => ({
        id: t.id,
        kind: t.kind,
        title: t.title,
        body: t.answer?.verdict || t.extract?.excerpt || t.url || "",
        run: () => s.activate(t.id),
      })),
  ];

  return (
    <div className="mosaic">
      <div className="pane-kicker">Mosaic</div>
      <h1>{s.continuum.question || "Lay the argument on the table"}</h1>
      <p className="lede" style={{ margin: 0 }}>
        Tabs are evidence. Findings are vertebrae. Grok does not rearrange your
        taste — it groups what holds, what fails, and what is still a fight.
      </p>
      <div className="mosaic-grid">
        {cards.map((c) => (
          <button key={c.id} className={`card ${c.kind}`} onClick={c.run}>
            <div className="kind">{c.kind}</div>
            <h3>{c.title}</h3>
            {c.body && c.body !== c.title ? <p>{c.body}</p> : null}
          </button>
        ))}
        {cards.length === 0 && (
          <div className="card">
            <div className="kind">empty</div>
            <h3>Nothing on the table yet</h3>
            <p>Ask a question or open a page. The mosaic fills from the Continuum.</p>
          </div>
        )}
      </div>
    </div>
  );
}
