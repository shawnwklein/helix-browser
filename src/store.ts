import { create } from "zustand";
import { extractUrl, fetchStatus, streamGrok } from "./lib/client";
import { rememberEcho } from "./lib/echo";
import {
  defaultFaces,
  homeThreadTitle,
  nextFaceColor,
  normalizeFaceName,
  outlookLabel,
  OUTLOOK_PERSONAL,
  OUTLOOK_WORK,
  partitionFor,
  resolveFaceClick,
} from "./lib/faces";
import { parseOmnibox, type Intent } from "./lib/intent";
import {
  emptyAnswer,
  type AnswerState,
  type Continuum,
  type Echo,
  type Face,
  type MindMessage,
  type MindMode,
  type Tab,
} from "./lib/types";

const PERSIST = "helix:v2";

function nid() {
  return crypto.randomUUID();
}

function homeTab(faceId: string, name?: string | null): Tab {
  return { id: nid(), kind: "home", title: homeThreadTitle(name), faceId };
}

function faceNameOf(faces: Face[], faceId: string): string | undefined {
  return faces.find((f) => f.id === faceId)?.name;
}

function titledHomeTabs(tabs: Tab[], faces: Face[]): Tab[] {
  return tabs.map((t) =>
    t.kind === "home"
      ? { ...t, title: homeThreadTitle(faceNameOf(faces, t.faceId)) }
      : t,
  );
}

function showLive(tab: Tab, faces: Face[], force = false) {
  if (!window.helix || tab.kind !== "page" || !tab.url || tab.viewMode === "reader") {
    window.helix?.hidePage();
    return;
  }
  const face = faces.find((f) => f.id === tab.faceId);
  window.helix.showPage(
    tab.id,
    tab.url,
    face?.partition || partitionFor(tab.faceId),
    force,
  );
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
  faces: Face[];
  activeFaceId: string;
  continuum: Continuum;
  echoes: Echo[];
  continuumOpen: boolean;
  mindOpen: boolean;
  mindMode: MindMode;
  mind: MindMessage[];
  commandOpen: boolean;
  settingsOpen: boolean;
  faceNamerOpen: boolean;
  omnibox: string;
  omniboxFocus: boolean;
  hasKey: boolean;
  demo: boolean;
  model: string;
  faceStayPulse: number;
  boot: () => Promise<void>;
  persist: () => void;
  submitOmnibox: (raw: string, intent?: Intent) => void;
  runCommand: (command: string, args?: string) => void;
  newTab: (faceId?: string) => void;
  closeTab: (id: string) => void;
  activate: (id: string) => void;
  navigate: (url: string, inPlace?: boolean, faceId?: string) => void;
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
  setFaceNamerOpen: (v: boolean) => void;
  setActiveFace: (id: string) => void;
  addOutlook: (kind: "outlook-work" | "outlook-personal") => void;
  addFace: (name?: string) => void;
  renameFace: (id: string, name: string) => void;
  setFaceHint: (id: string, hint: string) => void;
  removeFace: (id: string) => void;
  openFaceHome: (id: string) => void;
  refreshStatus: () => Promise<void>;
  goBack: () => void;
  goForward: () => void;
  reload: () => void;
};

const persisted = typeof localStorage !== "undefined" ? loadPersisted() : null;
const initialFaces =
  persisted?.faces && persisted.faces.length > 0 ? persisted.faces : defaultFaces();
const initialFaceId =
  persisted?.activeFaceId && initialFaces.some((f) => f.id === persisted.activeFaceId)
    ? persisted.activeFaceId
    : initialFaces[0].id;
const initialTabs = titledHomeTabs(
  (persisted?.tabs?.length
    ? persisted.tabs
    : [homeTab(initialFaceId, faceNameOf(initialFaces, initialFaceId))]
  ).map((t) => ({ ...t, faceId: t.faceId || initialFaceId })),
  initialFaces,
);
const initialActive =
  persisted?.activeId && initialTabs.some((t) => t.id === persisted.activeId)
    ? persisted.activeId
    : initialTabs[0].id;

export const useHelix = create<HelixState>((set, get) => ({
  tabs: initialTabs,
  activeId: initialActive,
  faces: initialFaces,
  activeFaceId: initialFaceId,
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
  faceNamerOpen: false,
  omnibox: "",
  omniboxFocus: false,
  hasKey: false,
  demo: true,
  model: "grok-4.6",
  faceStayPulse: 0,

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
        faces: s.faces,
        activeFaceId: s.activeFaceId,
        continuumOpen: s.continuumOpen,
        mindOpen: s.mindOpen,
      }),
    );
  },

  boot: async () => {
    await get().refreshStatus();
    set((s) => ({ tabs: titledHomeTabs(s.tabs, s.faces) }));
    get().persist();
    const desktop = window.helix;
    if (desktop) {
      desktop.onPageEvent((ev) => {
        if (!ev.tabId) return;
        set((s) => {
          const tabs = s.tabs.map((t) =>
            t.id === ev.tabId
              ? {
                  ...t,
                  url: ev.url || t.url,
                  title: ev.title || t.title,
                  canGoBack: ev.canGoBack,
                  canGoForward: ev.canGoForward,
                }
              : t,
          );
          const tab = tabs.find((t) => t.id === ev.tabId);
          const email = ev.title?.match(
            /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
          )?.[0];
          const autoName = /^(Work Outlook|Personal Outlook|Outlook)( \d+)?$/;
          const faces = email
            ? s.faces.map((f) =>
                f.id === tab?.faceId && f.kind.startsWith("outlook")
                  ? {
                      ...f,
                      hint: f.hint || email,
                      name: autoName.test(f.name) ? email : f.name,
                    }
                  : f,
              )
            : s.faces;
          return { tabs, faces };
        });
      });
      desktop.onOpenInFace((ev) => {
        const face =
          get().faces.find((f) => f.partition === ev.partition) ||
          get().faces.find((f) => f.id === get().activeFaceId);
        if (ev.url) get().navigate(ev.url, false, face?.id);
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
  setFaceNamerOpen: (faceNamerOpen) => set({ faceNamerOpen }),

  newTab: (faceId) => {
    const id = faceId || get().activeFaceId;
    const tab = homeTab(id, faceNameOf(get().faces, id));
    set((s) => ({
      tabs: [...s.tabs, tab],
      activeId: tab.id,
      activeFaceId: id,
      omnibox: "",
      ...(isNarrow() ? { mindOpen: false, continuumOpen: false } : {}),
    }));
    window.helix?.hidePage();
    get().persist();
  },

  closeTab: (id) => {
    const { tabs, activeId, activeFaceId } = get();
    if (tabs.length === 1) {
      const tab = homeTab(activeFaceId, faceNameOf(get().faces, activeFaceId));
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
      activeFaceId: tab.faceId || get().activeFaceId,
      omnibox: tab.kind === "page" ? tab.url || "" : tab.query || "",
    });
    showLive(tab, get().faces, false);
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
        const tab: Tab = {
          id: nid(),
          kind: "mosaic",
          title: "Mosaic",
          faceId: get().activeFaceId,
        };
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
    else if (cmd === "outlook") get().addOutlook("outlook-work");
    else if (cmd === "outlook-personal") get().addOutlook("outlook-personal");
    set({ commandOpen: false });
  },

  navigate: (url, inPlace, faceId) => {
    const { tabs, activeId, faces, activeFaceId } = get();
    const fid = faceId || activeFaceId;
    let href = url.trim();
    try {
      href = new URL(href).href;
    } catch {
      try {
        href = new URL(`https://${href}`).href;
      } catch {
        return;
      }
    }
    const active = tabs.find((t) => t.id === activeId);
    const reuse =
      inPlace ||
      ((active?.kind === "page" || active?.kind === "home") &&
        (!faceId || active.faceId === faceId));
    const id = reuse && active ? active.id : nid();
    let title = href;
    try {
      title = new URL(href).hostname.replace(/^www\./, "") || href;
    } catch {
      /* keep href */
    }
    const tab: Tab = {
      id,
      kind: "page",
      title,
      url: href,
      faceId: fid,
      viewMode: "live",
    };
    set((s) => ({
      tabs: reuse && active
        ? s.tabs.map((t) => (t.id === id ? { ...t, ...tab, id: t.id } : t))
        : [...s.tabs, tab],
      activeId: id,
      activeFaceId: fid,
      omnibox: href,
    }));
    showLive(tab, faces, true);
    get().persist();
    extractUrl(href)
      .then((extract) => {
        set((s) => ({
          tabs: s.tabs.map((t) =>
            t.id === id
              ? { ...t, extract, title: extract.title || t.title, extractError: undefined }
              : t,
          ),
          echoes: rememberEcho(s.echoes, {
            title: extract.title,
            url: href,
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
    if (tab) showLive({ ...tab, viewMode: mode }, get().faces, false);
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
      faceId: active?.faceId || get().activeFaceId,
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

  setActiveFace: (id) => {
    const face = get().faces.find((f) => f.id === id);
    if (!face) return;
    const { tabs, activeFaceId, activeId } = get();
    const click = resolveFaceClick({
      faceId: id,
      activeFaceId,
      activeId,
      tabs,
    });
    const faceStayPulse = get().faceStayPulse + 1;
    if (click.kind === "stay") {
      set({ faceStayPulse });
      return;
    }
    set({ activeFaceId: id, faceStayPulse });
    if (click.kind === "activate") get().activate(click.tabId);
    else get().newTab(click.faceId);
    get().persist();
  },

  addOutlook: (kind) => {
    const faces = get().faces;
    const n = faces.filter((f) => f.kind === kind).length + 1;
    const id = nid();
    const face: Face = {
      id,
      name: outlookLabel(kind, n),
      color: nextFaceColor(faces),
      kind,
      partition: partitionFor(id),
      homeUrl: kind === "outlook-work" ? OUTLOOK_WORK : OUTLOOK_PERSONAL,
      createdAt: Date.now(),
    };
    set({ faces: [...faces, face], activeFaceId: id });
    get().navigate(face.homeUrl!, false, id);
    get().persist();
  },

  addFace: (name) => {
    const named = normalizeFaceName(name);
    if (!named) {
      set({ faceNamerOpen: true });
      return;
    }
    const faces = get().faces;
    const id = nid();
    const face: Face = {
      id,
      name: named,
      color: nextFaceColor(faces),
      kind: "general",
      partition: partitionFor(id),
      createdAt: Date.now(),
    };
    set({ faces: [...faces, face], activeFaceId: id, faceNamerOpen: false });
    get().newTab(id);
    get().persist();
  },

  renameFace: (id, name) => {
    const trimmed = normalizeFaceName(name);
    if (!trimmed) return;
    const title = homeThreadTitle(trimmed);
    set((s) => ({
      faces: s.faces.map((f) => (f.id === id ? { ...f, name: trimmed } : f)),
      tabs: s.tabs.map((t) =>
        t.kind === "home" && t.faceId === id ? { ...t, title } : t,
      ),
    }));
    get().persist();
  },

  setFaceHint: (id, hint) => {
    set((s) => ({
      faces: s.faces.map((f) => (f.id === id ? { ...f, hint } : f)),
    }));
    get().persist();
  },

  removeFace: (id) => {
    const { faces, tabs, activeFaceId, activeId } = get();
    if (faces.length <= 1) return;
    const fallback = faces.find((f) => f.id !== id)?.id;
    if (!fallback) return;
    const doomed = tabs.filter((t) => t.faceId === id);
    doomed.forEach((t) => window.helix?.closePage(t.id));
    const nextTabs = tabs.filter((t) => t.faceId !== id);
    const remaining = nextTabs.length
      ? nextTabs
      : [homeTab(fallback, faceNameOf(faces, fallback))];
    const nextActive =
      remaining.find((t) => t.id === activeId)?.id || remaining[0].id;
    set({
      faces: faces.filter((f) => f.id !== id),
      tabs: remaining,
      activeId: nextActive,
      activeFaceId: activeFaceId === id ? fallback : activeFaceId,
    });
    get().persist();
  },

  openFaceHome: (id) => {
    const face = get().faces.find((f) => f.id === id);
    if (!face) return;
    set({ activeFaceId: id });
    if (face.homeUrl) get().navigate(face.homeUrl, false, id);
    else get().newTab(id);
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

export function activeFace(s: HelixState) {
  return s.faces.find((f) => f.id === s.activeFaceId) || s.faces[0];
}

export function faceOf(s: HelixState, faceId?: string) {
  return s.faces.find((f) => f.id === faceId) || s.faces[0];
}
