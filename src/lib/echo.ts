import type { Echo } from "./types";

export function findEchoes(query: string, echoes: Echo[]) {
  const tokens = query
    .toLowerCase()
    .split(/\W+/)
    .filter((t) => t.length > 3);
  if (!tokens.length) return echoes.slice(0, 4);
  const scored = echoes
    .map((e) => {
      const hay = `${e.title} ${e.claims.join(" ")} ${e.query || ""}`.toLowerCase();
      const score = tokens.reduce((n, t) => n + (hay.includes(t) ? 1 : 0), 0);
      return { e, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || b.e.at - a.e.at);
  return scored.slice(0, 5).map((x) => x.e);
}

export function rememberEcho(
  echoes: Echo[],
  next: Omit<Echo, "id" | "at"> & { id?: string; at?: number },
): Echo[] {
  const item: Echo = {
    id: next.id || crypto.randomUUID(),
    at: next.at || Date.now(),
    title: next.title,
    url: next.url,
    query: next.query,
    claims: next.claims.slice(0, 8),
  };
  const rest = echoes.filter(
    (e) => e.title !== item.title && e.url !== item.url,
  );
  return [item, ...rest].slice(0, 80);
}
