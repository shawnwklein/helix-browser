import { useEffect } from "react";
import { Chrome } from "./components/Chrome";
import { Continuum } from "./components/Continuum";
import { MindPane } from "./components/MindPane";
import { CommandPalette, SettingsModal } from "./components/Overlays";
import { activeTab, useHelix } from "./store";
import { AnswerView } from "./views/AnswerView";
import { Constellation } from "./views/Constellation";
import { MosaicView } from "./views/MosaicView";
import { PageView } from "./views/PageView";

export default function App() {
  const s = useHelix();
  const tab = activeTab(s);

  useEffect(() => {
    void s.boot();
    const onResize = () => {
      if (window.innerWidth >= 960) return;
      const st = useHelix.getState();
      if (st.mindOpen && st.continuumOpen) {
        useHelix.setState({ continuumOpen: false });
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (tab?.kind !== "page" || tab.viewMode === "reader") {
      window.helix?.hidePage();
    }
  }, [tab?.id, tab?.kind, tab?.viewMode]);

  return (
    <div className="shell">
      <div className="grain" />
      <Chrome />
      <div className="workspace">
        {s.continuumOpen && <Continuum />}
        {s.continuumOpen || s.mindOpen ? (
          <button
            className="drawer-back"
            aria-label="Close side panels"
            onClick={() =>
              useHelix.setState({ continuumOpen: false, mindOpen: false })
            }
          />
        ) : null}
        <main className="stage">
          {tab?.kind === "home" && <Constellation />}
          {tab?.kind === "answer" && <AnswerView tab={tab} />}
          {tab?.kind === "page" && <PageView tab={tab} />}
          {tab?.kind === "mosaic" && <MosaicView />}
        </main>
        {s.mindOpen && <MindPane />}
      </div>
      <CommandPalette />
      <SettingsModal />
    </div>
  );
}
