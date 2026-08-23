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
