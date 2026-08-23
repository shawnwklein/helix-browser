import { create } from "zustand";
import { extractUrl, fetchStatus, streamGrok } from "./lib/client";
import { rememberEcho } from "./lib/echo";
import { parseOmnibox, type Intent } from "./lib/intent";
import {
  emptyAnswer,
  type AnswerState,
  type Continuum,
  type Echo,
  type MindMessage,
  type MindMode,
  type Tab,
} from "./lib/types";

const PERSIST = "helix:v1";

function nid() {
  return crypto.randomUUID();
}

function homeTab(): Tab {
  return { id: nid(), kind: "home", title: "New thread" };
}

function isNarrow() {
  return typeof window !== "undefined" && window.innerWidth < 960;
}

function loadPersisted(): Partial<HelixState> | null {
  try {
    const raw = localStorage.getItem(PERSIST);
    if (!raw) return null;
    return JSON.parse(raw) as Partial<HelixState>;
  } catch {
    return null;
  }
}

type HelixState = {
  tabs: Tab[];
  activeId: string;
  continuum: Continuum;
  echoes: Echo[];
  continuumOpen: boolean;
  mindOpen: boolean;
  mindMode: MindMode;
  mind: MindMessage[];
  commandOpen: boolean;
  settingsOpen: boolean;
  omnibox: string;
  omniboxFocus: boolean;
  hasKey: boolean;
  demo: boolean;
  model: string;
  boot: () => Promise<void>;
  persist: () => void;
  submitOmnibox: (raw: string, intent?: Intent) => void;
  runCommand: (command: string, args?: string) => void;
  newTab: () => void;
  closeTab: (id: string) => void;
  activate: (id: string) => void;
  navigate: (url: string, inPlace?: boolean) => void;
  setViewMode: (mode: "live" | "reader") => void;
  startResearch: (query: string, opts?: { replace?: boolean; fork?: boolean; claim?: string }) => void;
  followUp: (query: string) => void;
  forkClaim: (claim: string) => void;
  runMind: (mode: MindMode) => void;
  pinFinding: (text: string, stance: "holds" | "fails" | "tension") => void;
  setOmnibox: (v: string) => void;
  setOmniboxFocus: (v: boolean) => void;
  toggleContinuum: () => void;
  toggleMind: () => void;
  setMindMode: (m: MindMode) => void;
  setCommandOpen: (v: boolean) => void;
  setSettingsOpen: (v: boolean) => void;
  refreshStatus: () => Promise<void>;
  goBack: () => void;
  goForward: () => void;
  reload: () => void;
};

const persisted = typeof localStorage !== "undefined" ? loadPersisted() : null;
const initialTabs = persisted?.tabs?.length ? persisted.tabs : [homeTab()];
const initialActive = persisted?.activeId && initialTabs.some((t) => t.id === persisted.activeId)
  ? persisted.activeId
  : initialTabs[0].id;

export const useHelix = create<HelixState>((set, get) => ({
  tabs: initialTabs,
  activeId: initialActive,
  continuum: persisted?.continuum || {
    question: "",
    startedAt: Date.now(),
    findings: [],
    openQuestions: [],
  },
  echoes: persisted?.echoes || [],
  continuumOpen:
    typeof window !== "undefined" && window.innerWidth < 960
      ? false
      : persisted?.continuumOpen ?? true,
  mindOpen: persisted?.mindOpen ?? false,
  mindMode: "scout",
  mind: [],
  commandOpen: false,
  settingsOpen: false,
  omnibox: "",
  omniboxFocus: false,
  hasKey: false,
  demo: true,
  model: "grok-4.6",

  persist: () => {
    const s = get();
    const tabs = s.tabs.map((t) => ({
      ...t,
      answer: t.answer ? { ...t.answer, streaming: false } : t.answer,
    }));
    localStorage.setItem(
      PERSIST,
      JSON.stringify({
        tabs,
        activeId: s.activeId,
        continuum: s.continuum,
        echoes: s.echoes,
        continuumOpen: s.continuumOpen,
        mindOpen: s.mindOpen,
      }),
    );
  },

  boot: async () => {
    await get().refreshStatus();
    const desktop = window.helix;
    if (desktop) {
      desktop.onPageEvent((ev) => {
        if (!ev.tabId) return;
        set((s) => ({
          tabs: s.tabs.map((t) =>
            t.id === ev.tabId
              ? {
                  ...t,
                  url: ev.url || t.url,
                  title: ev.title || t.title,
                  canGoBack: ev.canGoBack,
                  canGoForward: ev.canGoForward,
                }
              : t,
          ),
        }));
      });
    }
  },

  refreshStatus: async () => {
    try {
      const st = await fetchStatus();
      set({ hasKey: st.hasKey, demo: st.demo, model: st.model });
    } catch {
      /* offline chrome still works */
    }
  },

  setOmnibox: (omnibox) => set({ omnibox }),
  setOmniboxFocus: (omniboxFocus) => set({ omniboxFocus }),
  toggleContinuum: () => {
    set((s) => {
      const continuumOpen = !s.continuumOpen;
      return {
        continuumOpen,
        mindOpen: continuumOpen && isNarrow() ? false : s.mindOpen,
      };
    });
    get().persist();
  },
  toggleMind: () => {
    set((s) => {
      const mindOpen = !s.mindOpen;
      return {
        mindOpen,
        continuumOpen: mindOpen && isNarrow() ? false : s.continuumOpen,
      };
    });
    get().persist();
  },
  setMindMode: (mindMode) => set({ mindMode }),
  setCommandOpen: (commandOpen) => set({ commandOpen }),
  setSettingsOpen: (settingsOpen) => set({ settingsOpen }),

  newTab: () => {
    const tab = homeTab();
    set((s) => ({
      tabs: [...s.tabs, tab],
      activeId: tab.id,
      omnibox: "",
      ...(isNarrow() ? { mindOpen: false, continuumOpen: false } : {}),
    }));
    window.helix?.hidePage();
    get().persist();
  },

  closeTab: (id) => {
    const { tabs, activeId } = get();
    if (tabs.length === 1) {
      const tab = homeTab();
      set({ tabs: [tab], activeId: tab.id, omnibox: "" });
      window.helix?.closePage(id);
      window.helix?.hidePage();
      get().persist();
      return;
    }
    const i = tabs.findIndex((t) => t.id === id);
    const next = tabs.filter((t) => t.id !== id);
    const fallback = next[Math.max(0, i - 1)] || next[0];
    set({
      tabs: next,
      activeId: activeId === id ? fallback.id : activeId,
    });
    window.helix?.closePage(id);
    get().persist();
  },

  activate: (id) => {
    const tab = get().tabs.find((t) => t.id === id);
    if (!tab) return;
    set({
      activeId: id,
      omnibox: tab.kind === "page" ? tab.url || "" : tab.query || "",
    });
    if (tab.kind === "page" && tab.url && tab.viewMode !== "reader") {
      window.helix?.showPage(tab.id, tab.url);
    } else {
      window.helix?.hidePage();
    }
    get().persist();
  },

  submitOmnibox: (raw, forced) => {
    const intent = forced || parseOmnibox(raw);
    if (intent.type === "command") {
      get().runCommand(intent.command, intent.args);
      return;
    }
    if (intent.type === "go") {
      get().navigate(intent.url);
      return;
    }
    if (intent.type === "ambiguous") {
      get().startResearch(intent.text);
      return;
    }
    if (intent.type === "ask" && intent.query) {
      get().startResearch(intent.query);
    }
  },

  runCommand: (command, args = "") => {
    const cmd = command.replace(/^\//, "");
    if (cmd === "scout") get().runMind("scout");
    else if (cmd === "skeptic") get().runMind("skeptic");
    else if (cmd === "numbers") get().runMind("numbers");
    else if (cmd === "compare") get().runMind("compare");
    else if (cmd === "fork") {
      const tab = get().tabs.find((t) => t.id === get().activeId);
      get().forkClaim(args || tab?.answer?.verdict || tab?.title || "");
    } else if (cmd === "mosaic") {
      const existing = get().tabs.find((t) => t.kind === "mosaic");
      if (existing) get().activate(existing.id);
      else {
        const tab: Tab = { id: nid(), kind: "mosaic", title: "Mosaic" };
        set((s) => ({ tabs: [...s.tabs, tab], activeId: tab.id }));
        window.helix?.hidePage();
      }
    } else if (cmd === "reader") {
      const tab = get().tabs.find((t) => t.id === get().activeId);
      if (tab?.kind === "page") {
        get().setViewMode(tab.viewMode === "reader" ? "live" : "reader");
      }
    } else if (cmd === "new") get().newTab();
    else if (cmd === "settings") set({ settingsOpen: true });
    set({ commandOpen: false });
  },

  navigate: (url, inPlace) => {
    const { tabs, activeId } = get();
    const active = tabs.find((t) => t.id === activeId);
    const reuse =
      inPlace ||
      active?.kind === "page" ||
      active?.kind === "home";
    const id = reuse && active ? active.id : nid();
    const tab: Tab = {
      id,
      kind: "page",
      title: new URL(url).hostname.replace(/^www\./, ""),
      url,
      viewMode: window.helix ? "live" : "live",
    };
    set((s) => ({
      tabs: reuse && active
        ? s.tabs.map((t) => (t.id === id ? { ...t, ...tab, id: t.id } : t))
        : [...s.tabs, tab],
      activeId: id,
      omnibox: url,
    }));
    if (window.helix && tab.viewMode === "live") {
      window.helix.showPage(id, url);
    } else {
      window.helix?.hidePage();
    }
    get().persist();
    extractUrl(url)
      .then((extract) => {
        set((s) => ({
          tabs: s.tabs.map((t) =>
            t.id === id
              ? { ...t, extract, title: extract.title || t.title, extractError: undefined }
              : t,
          ),
          echoes: rememberEcho(s.echoes, {
            title: extract.title,
            url,
            claims: extract.excerpt ? [extract.excerpt] : [],
          }),
        }));
        get().persist();
      })
      .catch((err: Error) => {
        set((s) => ({
          tabs: s.tabs.map((t) =>
            t.id === id ? { ...t, extractError: err.message } : t,
          ),
        }));
      });
  },

  setViewMode: (mode) => {
    const id = get().activeId;
    set((s) => ({
      tabs: s.tabs.map((t) => (t.id === id ? { ...t, viewMode: mode } : t)),
    }));
    const tab = get().tabs.find((t) => t.id === id);
    if (mode === "live" && tab?.url) window.helix?.showPage(id, tab.url);
    else window.helix?.hidePage();
  },

  startResearch: (query, opts) => {
    const { tabs, activeId, continuum } = get();
    const active = tabs.find((t) => t.id === activeId);
    const replace = opts?.replace ?? active?.kind === "home";
    const id = replace && active ? active.id : nid();
    const tab: Tab = {
      id,
      kind: "answer",
      title: opts?.fork ? `Fork: ${query.slice(0, 40)}` : query.slice(0, 48),
      query,
      isFork: opts?.fork,
      forkedFrom: opts?.fork ? activeId : undefined,
      answer: emptyAnswer(),
    };
    const question = continuum.question || query;
    set((s) => ({
      tabs: replace && active
        ? s.tabs.map((t) => (t.id === id ? tab : t))
        : [...s.tabs, tab],
      activeId: id,
      omnibox: query,
      continuum: {
        ...s.continuum,
        question,
        startedAt: s.continuum.startedAt || Date.now(),
      },
    }));
    window.helix?.hidePage();
    const ctx = [
      continuum.question && `Question: ${continuum.question}`,
      ...continuum.findings.slice(-8).map((f) => `${f.stance}: ${f.text}`),
    ]
      .filter(Boolean)
      .join("\n");

    const path = opts?.fork ? "/api/grok/fork" : "/api/grok/research";
    const body = opts?.fork
      ? { claim: opts.claim || query, context: ctx }
      : { query, context: ctx };

    const patch = (fn: (a: AnswerState) => AnswerState) => {
      set((s) => ({
        tabs: s.tabs.map((t) =>
          t.id === id && t.answer ? { ...t, answer: fn(t.answer) } : t,
        ),
      }));
    };

    streamGrok(path, body, {
      onStatus: (phase, label) => patch((a) => ({ ...a, phase, phaseLabel: label })),
      onMeta: (meta) =>
        patch((a) => ({
          ...a,
          ...meta,
        })),
      onDelta: (text) => patch((a) => ({ ...a, essay: a.essay + text })),
      onCitation: (c) =>
        patch((a) => ({
          ...a,
          citations: a.citations.some((x) => x.url === c.url)
            ? a.citations
            : [...a.citations, c].sort((x, y) => x.n - y.n),
        })),
      onDone: (info) => {
        patch((a) => ({ ...a, streaming: false, responseId: info.responseId }));
        const t = get().tabs.find((x) => x.id === id);
        const a = t?.answer;
        if (a) {
          set((s) => ({
            tabs: s.tabs.map((tab) =>
              tab.id === id ? { ...tab, title: a.title || tab.title } : tab,
            ),
            continuum: {
              ...s.continuum,
              findings: [
                ...s.continuum.findings,
                ...a.holds.map((text) => ({
                  id: nid(),
                  text,
                  stance: "holds" as const,
                  tabId: id,
                  at: Date.now(),
                })),
                ...a.fails.map((text) => ({
                  id: nid(),
                  text,
                  stance: "fails" as const,
                  tabId: id,
                  at: Date.now(),
                })),
                ...a.tensions.map((text) => ({
                  id: nid(),
                  text,
                  stance: "tension" as const,
                  tabId: id,
                  at: Date.now(),
                })),
              ].slice(-40),
              openQuestions: a.followups.slice(0, 6),
            },
            echoes: rememberEcho(s.echoes, {
              title: a.title || query,
              query,
              claims: [...a.holds, ...a.fails].slice(0, 6),
            }),
          }));
        }
        get().persist();
      },
      onError: (message) =>
        patch((a) => ({ ...a, streaming: false, error: message })),
    });
  },

  followUp: (query) => {
    const tab = get().tabs.find((t) => t.id === get().activeId);
    if (!tab?.answer) {
      get().startResearch(query);
      return;
    }
    get().startResearch(query);
  },

  forkClaim: (claim) => {
    if (!claim.trim()) return;
    get().startResearch(claim, { fork: true, claim, replace: false });
  },

  pinFinding: (text, stance) => {
    const tabId = get().activeId;
    set((s) => ({
      continuum: {
        ...s.continuum,
        findings: [
          ...s.continuum.findings,
          { id: nid(), text, stance, tabId, at: Date.now() },
        ],
      },
    }));
    get().persist();
  },

  runMind: (mode) => {
    const tab = get().tabs.find((t) => t.id === get().activeId);
    set({
      mindOpen: true,
      mindMode: mode,
      continuumOpen: isNarrow() ? false : get().continuumOpen,
    });
    let page = "";
    if (tab?.kind === "page") {
      page = [
        tab.extract?.title || tab.title,
        tab.url,
        tab.extract?.text || tab.extract?.excerpt || "",
      ].join("\n\n");
    } else if (tab?.kind === "answer") {
      page = [
        tab.answer?.title,
        tab.answer?.verdict,
        tab.answer?.essay,
      ]
        .filter(Boolean)
        .join("\n\n");
    } else if (mode === "compare") {
      page = get()
        .tabs.filter((t) => t.kind !== "home")
        .map((t) => {
          if (t.kind === "answer") return `# ${t.answer?.title}\n${t.answer?.verdict}`;
          return `# ${t.title}\n${t.url}\n${t.extract?.excerpt || ""}`;
        })
        .join("\n\n");
    }
    if (!page.trim()) {
      page = `The user is on the Constellation home. Continuum question: ${get().continuum.question || "none yet"}.`;
    }
    const id = nid();
    set((s) => ({
      mind: [
        ...s.mind,
        { id, mode, text: "", streaming: true, at: Date.now() },
      ].slice(-12),
    }));
    streamGrok(
      "/api/grok/mind",
      { mode, page },
      {
        onDelta: (text) =>
          set((s) => ({
            mind: s.mind.map((m) =>
              m.id === id ? { ...m, text: m.text + text } : m,
            ),
          })),
        onDone: () =>
          set((s) => ({
            mind: s.mind.map((m) =>
              m.id === id ? { ...m, streaming: false } : m,
            ),
          })),
        onError: (message) =>
          set((s) => ({
            mind: s.mind.map((m) =>
              m.id === id ? { ...m, streaming: false, text: message } : m,
            ),
          })),
      },
    );
  },

  goBack: () => window.helix?.goBack(),
  goForward: () => window.helix?.goForward(),
  reload: () => {
    const tab = get().tabs.find((t) => t.id === get().activeId);
    if (tab?.kind === "page" && tab.url) {
      if (window.helix) window.helix.reload();
      else get().navigate(tab.url, true);
    }
  },
}));

export function activeTab(s: HelixState) {
  return s.tabs.find((t) => t.id === s.activeId) || s.tabs[0];
}
