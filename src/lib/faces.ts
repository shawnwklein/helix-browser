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

export type FaceTabCluster<T extends { faceId: string } = FaceClickTab> = {
  face: Face;
  tabs: T[];
};

/** Ctrl+Shift+1…9 for Face index 0…8. Tenth Face has no digit chord. */
export function faceSwitchChord(index: number): string | null {
  if (!Number.isInteger(index) || index < 0 || index > 8) return null;
  return `Ctrl+Shift+${index + 1}`;
}

/** Digit1 → 0 … Digit9 → 8. Digit0 and other codes → null. */
export function faceIndexFromDigitCode(code: string): number | null {
  if (!code.startsWith("Digit")) return null;
  const n = Number(code.slice(5));
  if (!Number.isInteger(n) || n < 1 || n > 9) return null;
  return n - 1;
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
