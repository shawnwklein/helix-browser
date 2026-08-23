import type { Face } from "./types";

export const FACE_PALETTE = [
  "#d4a06a",
  "#7ecfc4",
  "#6ea8ff",
  "#e07058",
  "#8fcb7a",
  "#c4a7e7",
  "#e8d5b0",
  "#e8a0b0",
];

export const OUTLOOK_WORK = "https://outlook.office.com/mail/";
export const OUTLOOK_PERSONAL = "https://outlook.live.com/mail/";

/** One-click names on the add-Face sheet. Not Outlook — that path is already named. */
export const FACE_ROLES = ["Work", "School", "Home"] as const;
export type FaceRole = (typeof FACE_ROLES)[number];

/** FaceBar keeps this many pills; extras fold into N more. Who you are stays on the bar. */
export const FACE_BAR_VISIBLE = 4;

/** Trimmed Face name, or null when empty/whitespace (do not mint `Face N`). */
export function normalizeFaceName(name?: string | null): string | null {
  const trimmed = (name ?? "").trim();
  return trimmed ? trimmed : null;
}

/** Home-tab title: "{Face}'s thread". Empty/whitespace stays the last-resort fallback. */
export function homeThreadTitle(name?: string | null): string {
  const trimmed = (name ?? "").trim();
  return trimmed ? `${trimmed}'s thread` : "New thread";
}

export function partitionFor(faceId: string) {
  return `persist:helix-face-${faceId}`;
}

export function nextFaceColor(existing: Face[]) {
  const used = new Set(existing.map((f) => f.color));
  return FACE_PALETTE.find((c) => !used.has(c)) || FACE_PALETTE[existing.length % FACE_PALETTE.length];
}

export function defaultFaces(): Face[] {
  const id = "personal";
  return [
    {
      id,
      name: "Personal",
      color: FACE_PALETTE[0],
      kind: "personal",
      partition: partitionFor(id),
      createdAt: Date.now(),
    },
  ];
}

export function outlookLabel(kind: "outlook-work" | "outlook-personal", n: number) {
  if (kind === "outlook-work") return n <= 1 ? "Work Outlook" : `Work Outlook ${n}`;
  return n <= 1 ? "Personal Outlook" : `Personal Outlook ${n}`;
}

export type FaceClickTab = { id: string; faceId: string };

export type FaceClick =
  | { kind: "stay"; activeId: string }
  | { kind: "activate"; tabId: string }
  | { kind: "newTab"; faceId: string };

export function resolveFaceClick(opts: {
  faceId: string;
  activeFaceId: string;
  activeId: string;
  tabs: FaceClickTab[];
}): FaceClick {
  if (opts.faceId === opts.activeFaceId) {
    return { kind: "stay", activeId: opts.activeId };
  }
  const owned = [...opts.tabs].reverse().find((t) => t.faceId === opts.faceId);
  if (owned) return { kind: "activate", tabId: owned.id };
  return { kind: "newTab", faceId: opts.faceId };
}

export type FaceClose =
  | { kind: "idle"; activeId: string }
  | { kind: "activate"; tabId: string }
  | { kind: "mintHome"; faceId: string };

/** Close a tab without becoming someone else. Background stays put; leftover same-Face wins; last-of-Face mints home. */
export function resolveFaceClose(opts: {
  closedId: string;
  activeId: string;
  activeFaceId: string;
  tabs: FaceClickTab[];
}): FaceClose {
  if (opts.closedId !== opts.activeId) {
    return { kind: "idle", activeId: opts.activeId };
  }
  const closedAt = opts.tabs.findIndex((t) => t.id === opts.closedId);
  const remaining = opts.tabs.filter((t) => t.id !== opts.closedId);
  const owned = remaining
    .map((t, i) => ({ t, i }))
    .filter((x) => x.t.faceId === opts.activeFaceId);
  if (!owned.length) {
    return { kind: "mintHome", faceId: opts.activeFaceId };
  }
  const next = owned.find((x) => x.i >= closedAt);
  const prev = [...owned].reverse().find((x) => x.i < closedAt);
  return { kind: "activate", tabId: (next ?? prev ?? owned[0]).t.id };
}

export type FaceHomeTab = FaceClickTab & { kind: string; url?: string };

export type FaceHomeFace = { id: string; homeUrl?: string };

/** True when this tab is the Face’s mailbox (same origin + /mail…). */
export function tabIsFaceInbox(tab: FaceHomeTab, face: FaceHomeFace): boolean {
  if (tab.faceId !== face.id || tab.kind !== "page" || !tab.url || !face.homeUrl) {
    return false;
  }
  try {
    const page = new URL(tab.url);
    const home = new URL(face.homeUrl);
    if (page.origin !== home.origin) return false;
    const homePath = home.pathname.replace(/\/+$/, "") || "/";
    const pagePath = page.pathname.replace(/\/+$/, "") || "/";
    return pagePath === homePath || pagePath.startsWith(`${homePath}/`);
  } catch {
    return false;
  }
}

export type FaceHome =
  | { kind: "activate"; tabId: string }
  | { kind: "reuse"; tabId: string; url: string }
  | { kind: "newTab"; faceId: string; url: string }
  | { kind: "newHome"; faceId: string };

/** Open this Face’s inbox: activate an existing mailbox, reuse their home thread, or mint a tab. */
export function resolveFaceHome(opts: {
  face: FaceHomeFace;
  activeId: string;
  tabs: FaceHomeTab[];
}): FaceHome {
  const { face, activeId, tabs } = opts;
  if (!face.homeUrl) {
    return { kind: "newHome", faceId: face.id };
  }
  const inboxes = tabs.filter((t) => tabIsFaceInbox(t, face));
  if (inboxes.length) {
    const current = inboxes.find((t) => t.id === activeId);
    return { kind: "activate", tabId: (current ?? inboxes[inboxes.length - 1]).id };
  }
  const active = tabs.find((t) => t.id === activeId);
  if (active?.faceId === face.id && active.kind === "home") {
    return { kind: "reuse", tabId: active.id, url: face.homeUrl };
  }
  return { kind: "newTab", faceId: face.id, url: face.homeUrl };
}

export type FaceTabCluster<T extends { faceId: string } = FaceClickTab> = {
  face: Face;
  tabs: T[];
};

/** Ctrl+Shift+1…9, 0 for Face index 0…9. Eleventh Face has no digit chord. */
export function faceSwitchChord(index: number): string | null {
  if (!Number.isInteger(index) || index < 0 || index > 9) return null;
  return `Ctrl+Shift+${(index + 1) % 10}`;
}

/** Compact ⌃⇧1…9, 0 for receded Face pills. Same 0…9 / null rules as faceSwitchChord. */
export function faceSwitchChordCompact(index: number): string | null {
  if (!Number.isInteger(index) || index < 0 || index > 9) return null;
  return `⌃⇧${(index + 1) % 10}`;
}

/** Digit1 → 0 … Digit9 → 8, Digit0 → 9. Other codes → null. */
export function faceIndexFromDigitCode(code: string): number | null {
  const rest = code.startsWith("Digit") ? code.slice(5) : "";
  if (!/^[0-9]$/.test(rest)) return null;
  const n = Number(rest);
  return n === 0 ? 9 : n - 1;
}

/** Face order, in-face order kept, Faces with no tabs omitted. */
export function clusterTabsByFace<T extends { faceId: string }>(
  faces: Face[],
  tabs: T[],
): FaceTabCluster<T>[] {
  const buckets = new Map<string, T[]>();
  for (const tab of tabs) {
    const owned = buckets.get(tab.faceId);
    if (owned) owned.push(tab);
    else buckets.set(tab.faceId, [tab]);
  }
  const clusters: FaceTabCluster<T>[] = [];
  for (const face of faces) {
    const owned = buckets.get(face.id);
    if (!owned?.length) continue;
    clusters.push({ face, tabs: owned });
  }
  return clusters;
}

export type ClusterTabLayout = "full" | "fold";

/** Receded labeled clusters fold to icon peeks. Solo / current stay full titled tabs. */
export function clusterTabLayout(opts: {
  labeled: boolean;
  current: boolean;
}): ClusterTabLayout {
  return opts.labeled && !opts.current ? "fold" : "full";
}

/**
 * Split Faces into bar pills vs N more.
 * At or under `cap`, everyone is shown. Over cap, show the first `cap` —
 * or the first `cap - 1` plus the active Face when they would otherwise overflow.
 * Overflow keeps original Face order. The active id is never in overflow.
 */
export function overflowFaces<T extends { id: string }>(
  faces: T[],
  activeFaceId: string,
  cap: number = FACE_BAR_VISIBLE,
): { shown: T[]; overflow: T[] } {
  const limit = Number.isInteger(cap) && cap >= 1 ? cap : FACE_BAR_VISIBLE;
  if (faces.length <= limit) {
    return { shown: faces, overflow: [] };
  }
  const activeAt = faces.findIndex((f) => f.id === activeFaceId);
  if (activeAt < 0 || activeAt < limit) {
    return { shown: faces.slice(0, limit), overflow: faces.slice(limit) };
  }
  const shown = [...faces.slice(0, limit - 1), faces[activeAt]];
  const keep = new Set(shown.map((f) => f.id));
  return { shown, overflow: faces.filter((f) => !keep.has(f.id)) };
}

/**
 * True when becoming `nextActiveId` pins them from N more onto the bar.
 * Overflow is vs the previous active Face. Same id, no overflow, and
 * already-shown switches stay false.
 */
export function faceArrivesFromOverflow<T extends { id: string }>(
  faces: T[],
  previousActiveId: string,
  nextActiveId: string,
  cap: number = FACE_BAR_VISIBLE,
): boolean {
  if (!nextActiveId || nextActiveId === previousActiveId) return false;
  const { overflow } = overflowFaces(faces, previousActiveId, cap);
  return overflow.some((f) => f.id === nextActiveId);
}

/**
 * Faces that recede into N more when `nextActiveId` pins in from overflow.
 * Shown vs the previous active, overflow vs the next. Empty unless
 * `faceArrivesFromOverflow` is true.
 */
export function facesDepartToOverflow<T extends { id: string }>(
  faces: T[],
  previousActiveId: string,
  nextActiveId: string,
  cap: number = FACE_BAR_VISIBLE,
): T[] {
  if (!faceArrivesFromOverflow(faces, previousActiveId, nextActiveId, cap)) {
    return [];
  }
  const { shown } = overflowFaces(faces, previousActiveId, cap);
  const { overflow } = overflowFaces(faces, nextActiveId, cap);
  const wasShown = new Set(shown.map((f) => f.id));
  return overflow.filter((f) => wasShown.has(f.id));
}

/**
 * Overflow-row remount ids when N more is already open.
 * Closed sheet: empty even if someone just folded. Open: only `settleIds`
 * (who `facesDepartToOverflow` named). Already-shown / same-id switches
 * pass empty settleIds and stay empty.
 */
export function overflowRowSettles(
  sheetOpen: boolean,
  settleIds: readonly string[],
): string[] {
  if (!sheetOpen || settleIds.length === 0) return [];
  return [...settleIds];
}

/**
 * Overflow-row remount ids when N more is already open and a Face pins in.
 * Closed sheet: empty even if Extra just landed on the bar. Open: only
 * `leaveIds` (who `faceArrivesFromOverflow` named). Already-shown / same-id
 * switches pass empty leaveIds and stay empty.
 */
export function overflowRowLeaves(
  sheetOpen: boolean,
  leaveIds: readonly string[],
): string[] {
  if (!sheetOpen || leaveIds.length === 0) return [];
  return [...leaveIds];
}

/** Stay-pulse length. Matches `.face-pill.stay` (0.42s). Overflow-row click holds N more this long. */
export const FACE_STAY_PULSE_MS = 420;

/**
 * How long to keep N more open after becoming a Face.
 * Overflow-row click holds one stay-pulse so Extra can leave. Chord, Escape,
 * click-away, toggle, closed sheet, already-shown, and same-id are 0.
 */
export function overflowSheetHoldMs(opts: {
  sheetOpen: boolean;
  via: "click" | "chord" | "escape" | "away" | "toggle";
  arrives: boolean;
  sameId?: boolean;
}): number {
  if (!opts.sheetOpen || opts.sameId || !opts.arrives || opts.via !== "click") return 0;
  return FACE_STAY_PULSE_MS;
}

/**
 * Whether N more recedes with Extra on click-to-become.
 * True only when overflowSheetHoldMs is the stay-pulse: open + click + arrives,
 * not same-id. Chord / Escape / click-away / toggle / closed / already-shown
 * stay false — those paths do not mark the sheet `exit`.
 */
export function overflowSheetExits(opts: {
  sheetOpen: boolean;
  via: "click" | "chord" | "escape" | "away" | "toggle";
  arrives: boolean;
  sameId?: boolean;
}): boolean {
  return overflowSheetHoldMs(opts) === FACE_STAY_PULSE_MS;
}

/**
 * Whether N more keeps the pressed `.open` look.
 * True only while the sheet is open and not exiting. Click-hold recede
 * (`overflowSheetExits`) drops `.open` and takes `.exit`. Chord / idle stay
 * pressed. Closed sheet — and exit after unmount — stay false.
 */
export function overflowMoreOpen(sheetOpen: boolean, exiting: boolean): boolean {
  return sheetOpen && !exiting;
}

/**
 * Overflow-sheet rows for one stay-pulse after an overflow pin.
 * Closed / nobody leaving → raw overflow. Open: ghost `leaving` in front
 * of overflow without duplicating still-overflowed ids.
 */
export function overflowSheetRows<T extends { id: string }>(
  sheetOpen: boolean,
  overflow: readonly T[],
  leaving: readonly T[],
): T[] {
  if (!sheetOpen || leaving.length === 0) return [...overflow];
  const seen = new Set(overflow.map((f) => f.id));
  const ghosts = leaving.filter((f) => !seen.has(f.id));
  return [...ghosts, ...overflow];
}

/**
 * Overflow-sheet kicker while N more is already open and someone just folded.
 * Closed sheet / nobody folded / blank names → "". Open + named Faces →
 * "{name} receded" or comma-joined names + " receded". Idle copy stays
 * "Also in this window" in FaceBar.
 */
export function overflowRecedeKicker(
  sheetOpen: boolean,
  departed: readonly { name?: string | null }[],
): string {
  if (!sheetOpen || departed.length === 0) return "";
  const names = departed
    .map((f) => (f.name ?? "").trim())
    .filter((name) => name.length > 0);
  if (!names.length) return "";
  return `${names.join(", ")} receded`;
}

/** Native title for the N more pill. Names who folded; empty when nobody overflowed. */
export function overflowMoreTitle(faces: { name?: string | null }[]): string {
  const names = faces
    .map((f) => (f.name ?? "").trim())
    .filter((name) => name.length > 0);
  if (!names.length) return "";
  return `${names.join(", ")} — also in this window`;
}
