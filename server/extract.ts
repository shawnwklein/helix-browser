import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";

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

const UA =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Helix/0.1 Chrome/131.0.0.0 Safari/537.36";

export async function extractPage(url: string): Promise<ExtractedPage> {
  const parsed = new URL(url);
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Only http(s) URLs can be read");
  }

  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), 14000);
  let html = "";
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: ac.signal,
      headers: {
        "User-Agent": UA,
        Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.8",
      },
    });
    if (!res.ok) throw new Error(`Fetch failed (${res.status})`);
    html = await res.text();
  } finally {
    clearTimeout(t);
  }

  const dom = new JSDOM(html, { url });
  const doc = dom.window.document;
  const reader = new Readability(doc);
  const article = reader.parse();

  const text =
    article?.textContent?.trim() ||
    doc.body?.textContent?.replace(/\s+/g, " ").trim() ||
    "";

  return {
    url,
    title: article?.title || doc.title || parsed.hostname,
    byline: article?.byline ?? null,
    excerpt: article?.excerpt ?? null,
    siteName: article?.siteName ?? parsed.hostname,
    content: article?.content || `<p>${escapeHtml(text.slice(0, 12000))}</p>`,
    text: text.slice(0, 24000),
    length: text.length,
  };
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
