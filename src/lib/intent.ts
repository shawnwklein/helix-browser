export type Intent =
  | { type: "go"; url: string }
  | { type: "ask"; query: string }
  | { type: "command"; command: string; args: string }
  | { type: "ambiguous"; text: string; url: string };

export function normalizeUrl(raw: string) {
  const t = raw.trim();
  if (/^https?:\/\//i.test(t)) return t;
  if (/^localhost(:\d+)?([/?#].*)?$/i.test(t)) return `http://${t}`;
  return `https://${t}`;
}

export function looksLikeUrl(s: string) {
  const t = s.trim();
  if (!t || /\s/.test(t)) return false;
  if (/^https?:\/\//i.test(t)) return true;
  if (/^localhost(:\d+)?([/?#].*)?$/i.test(t)) return true;
  if (/^[a-z0-9.-]+\.[a-z]{2,}([/:?#].*)?$/i.test(t)) return true;
  return false;
}

export function parseOmnibox(input: string): Intent {
  const t = input.trim();
  if (!t) return { type: "ask", query: "" };
  if (t.startsWith("/")) {
    const [cmd, ...rest] = t.slice(1).split(/\s+/);
    return { type: "command", command: cmd.toLowerCase(), args: rest.join(" ") };
  }
  if (t.startsWith("?")) return { type: "ask", query: t.slice(1).trim() };
  if (looksLikeUrl(t)) return { type: "go", url: normalizeUrl(t) };
  return { type: "ask", query: t };
}

export function previewIntent(input: string): Intent {
  const t = input.trim();
  if (!t) return { type: "ask", query: "" };
  if (t.startsWith("/") || t.startsWith("?")) return parseOmnibox(t);
  if (looksLikeUrl(t)) return { type: "go", url: normalizeUrl(t) };
  if (!t.includes(" ") && t.length < 18 && /^[a-z0-9-]+$/i.test(t)) {
    return {
      type: "ambiguous",
      text: t,
      url: normalizeUrl(`${t}.com`),
    };
  }
  return { type: "ask", query: t };
}

export function hostOf(url?: string) {
  if (!url) return "";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function faviconFor(url?: string) {
  const host = hostOf(url);
  if (!host) return "";
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=32`;
}
