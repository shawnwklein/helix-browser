export type TabKind = "home" | "answer" | "page" | "mosaic";

export type Citation = {
  n: number;
  url: string;
  title: string;
  kind: "web" | "x";
};

export type HelixMeta = {
  title: string;
  verdict: string;
  holds: string[];
  fails: string[];
  tensions: string[];
  followups: string[];
  nextTabs: { title: string; url: string }[];
};

export type AnswerState = HelixMeta & {
  phase: string;
  phaseLabel: string;
  essay: string;
  citations: Citation[];
  responseId?: string;
  error?: string;
  streaming: boolean;
};

export type ExtractedPage = {
  url: string;
  title: string;
  byline: string | null;
  excerpt: string | null;
  siteName: string | null;
  content: string;
  text: string;
  length: number;
};

export type FaceKind = "personal" | "work" | "outlook-work" | "outlook-personal" | "general";

export type Face = {
  id: string;
  name: string;
  color: string;
  kind: FaceKind;
  partition: string;
  hint?: string;
  homeUrl?: string;
  createdAt: number;
};

export type Tab = {
  id: string;
  kind: TabKind;
  title: string;
  faceId: string;
  url?: string;
  query?: string;
  isFork?: boolean;
  forkedFrom?: string;
  viewMode?: "live" | "reader";
  extract?: ExtractedPage;
  extractError?: string;
  canGoBack?: boolean;
  canGoForward?: boolean;
  answer?: AnswerState;
};

export type Finding = {
  id: string;
  text: string;
  stance: "holds" | "fails" | "tension";
  tabId: string;
  at: number;
};

export type Echo = {
  id: string;
  title: string;
  url?: string;
  query?: string;
  claims: string[];
  at: number;
};

export type Continuum = {
  question: string;
  startedAt: number;
  findings: Finding[];
  openQuestions: string[];
};

export type MindMode = "scout" | "skeptic" | "numbers" | "compare";

export type MindMessage = {
  id: string;
  mode: MindMode;
  text: string;
  streaming?: boolean;
  at: number;
};

export const emptyAnswer = (overrides: Partial<AnswerState> = {}): AnswerState => ({
  phase: "searching_web",
  phaseLabel: "Opening the web…",
  title: "",
  verdict: "",
  holds: [],
  fails: [],
  tensions: [],
  followups: [],
  nextTabs: [],
  essay: "",
  citations: [],
  streaming: true,
  ...overrides,
});
