import type { Citation, HelixMeta } from "./types";

export type StreamEvent = {
  onStatus?: (phase: string, label: string) => void;
  onMeta?: (meta: HelixMeta) => void;
  onDelta?: (text: string) => void;
  onCitation?: (c: Citation) => void;
  onDone?: (info: { responseId?: string }) => void;
  onError?: (message: string) => void;
};

function keyHeader(): Record<string, string> {
  const key = localStorage.getItem("helix:key") || "";
  return key ? { "x-helix-key": key } : {};
}

function parseSse(raw: string): { event: string; data: string } | null {
  let event = "message";
  const data: string[] = [];
  for (const line of raw.replace(/\r/g, "").split("\n")) {
    if (line.startsWith("event:")) event = line.slice(6).trim();
    else if (line.startsWith("data:")) data.push(line.slice(5).trimStart());
  }
  if (!data.length) return null;
  return { event, data: data.join("\n") };
}

export async function streamGrok(
  path: string,
  body: unknown,
  ev: StreamEvent,
  signal?: AbortSignal,
) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...keyHeader() },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok || !res.body) {
    const t = await res.text().catch(() => res.statusText);
    ev.onError?.(t || "Helix could not reach Grok");
    return;
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let idx: number;
    while ((idx = buf.indexOf("\n\n")) !== -1) {
      const raw = buf.slice(0, idx);
      buf = buf.slice(idx + 2);
      const parsed = parseSse(raw);
      if (!parsed) continue;
      let data: Record<string, unknown> = {};
      try {
        data = JSON.parse(parsed.data) as Record<string, unknown>;
      } catch {
        continue;
      }
      if (parsed.event === "status")
        ev.onStatus?.(String(data.phase || ""), String(data.label || ""));
      else if (parsed.event === "meta") ev.onMeta?.(data as unknown as HelixMeta);
      else if (parsed.event === "delta") ev.onDelta?.(String(data.text || ""));
      else if (parsed.event === "citation")
        ev.onCitation?.(data as unknown as Citation);
      else if (parsed.event === "done")
        ev.onDone?.({ responseId: data.responseId as string | undefined });
      else if (parsed.event === "error")
        ev.onError?.(String(data.message || "error"));
    }
  }
}

export async function fetchStatus() {
  const res = await fetch("/api/status", { headers: keyHeader() });
  return (await res.json()) as { hasKey: boolean; demo: boolean; model: string };
}

export async function saveKey(key: string) {
  localStorage.setItem("helix:key", key);
  await fetch("/api/key", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...keyHeader() },
    body: JSON.stringify({ key }),
  });
}

export async function extractUrl(url: string) {
  const res = await fetch(`/api/extract?url=${encodeURIComponent(url)}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "extract failed");
  return data;
}
