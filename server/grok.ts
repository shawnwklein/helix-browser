import {
  FOLLOWUP_SYSTEM,
  FORK_SYSTEM,
  RESEARCH_SYSTEM,
  SCOUT_SYSTEM,
  SKEPTIC_SYSTEM,
  NUMBERS_SYSTEM,
  COMPARE_SYSTEM,
} from "./prompts";
import { iterateSse } from "./sse";

export const MODEL = process.env.HELIX_MODEL || "grok-4.6";
const XAI = "https://api.x.ai/v1/responses";

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

export type StreamHandlers = {
  onStatus: (phase: string, label: string) => void;
  onMeta: (meta: HelixMeta) => void;
  onDelta: (text: string) => void;
  onCitation: (c: Citation) => void;
  onDone: (info: { responseId?: string }) => void;
  onError: (message: string) => void;
};

type ToolSpec =
  | { type: "web_search"; enable_image_search?: boolean }
  | { type: "x_search" }
  | { type: "code_interpreter" };

function kindOf(url: string): "web" | "x" {
  try {
    const h = new URL(url).hostname;
    if (h === "x.com" || h === "twitter.com" || h.endsWith(".x.com")) return "x";
  } catch {
    /* ignore */
  }
  return "web";
}

function titleFromUrl(url: string) {
  try {
    const u = new URL(url);
    if (kindOf(url) === "x") return "X";
    return u.hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function createHelixParser(
  onMeta: (m: HelixMeta) => void,
  onDelta: (t: string) => void,
) {
  let mode: "start" | "meta" | "body" = "start";
  let buf = "";
  return {
    push(text: string) {
      if (mode === "body") {
        onDelta(text);
        return;
      }
      buf += text;
      if (mode === "start") {
        const i = buf.indexOf("«helix»");
        if (i === -1) {
          if (buf.length > 120) {
            mode = "body";
            onDelta(buf);
            buf = "";
          }
          return;
        }
        mode = "meta";
        buf = buf.slice(i + "«helix»".length);
      }
      if (mode === "meta") {
        const j = buf.indexOf("«/helix»");
        if (j === -1) return;
        const raw = buf.slice(0, j).trim();
        try {
          onMeta(JSON.parse(raw) as HelixMeta);
        } catch {
          /* Grok drifted; essay still useful */
        }
        mode = "body";
        const rest = buf.slice(j + "«/helix»".length).replace(/^\n+/, "");
        buf = "";
        if (rest) onDelta(rest);
      }
    },
  };
}

function collectCitations(text: string, extra: string[]) {
  const found = new Map<string, Citation>();
  const re = /\[\[(\d+)\]\]\((https?:[^)]+)\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const url = m[2];
    if (found.has(url)) continue;
    found.set(url, {
      n: Number(m[1]),
      url,
      title: titleFromUrl(url),
      kind: kindOf(url),
    });
  }
  let n = found.size;
  for (const url of extra) {
    if (!url || found.has(url)) continue;
    n += 1;
    found.set(url, { n, url, title: titleFromUrl(url), kind: kindOf(url) });
  }
  return [...found.values()].sort((a, b) => a.n - b.n);
}

function phaseFromEvent(type: string): { phase: string; label: string } | null {
  const t = type.toLowerCase();
  if (t.includes("web_search"))
    return { phase: "searching_web", label: "Searching the live web…" };
  if (t.includes("x_search"))
    return { phase: "searching_x", label: "Listening to X…" };
  if (t.includes("code"))
    return { phase: "reading", label: "Running numbers…" };
  if (t.includes("in_progress") || t.includes("output_item"))
    return { phase: "reading", label: "Reading sources…" };
  return null;
}

async function streamXai(opts: {
  key: string;
  system: string;
  user: string;
  tools: ToolSpec[];
  previous?: string;
  handlers: StreamHandlers;
  signal?: AbortSignal;
}) {
  const input: unknown[] = [
    { role: "system", content: opts.system },
    { role: "user", content: opts.user },
  ];

  const res = await fetch(XAI, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${opts.key}`,
      "Content-Type": "application/json",
    },
    signal: opts.signal,
    body: JSON.stringify({
      model: MODEL,
      stream: true,
      input,
      tools: opts.tools,
      ...(opts.previous ? { previous_response_id: opts.previous } : {}),
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`xAI ${res.status}: ${body.slice(0, 400)}`);
  }

  const parser = createHelixParser(opts.handlers.onMeta, opts.handlers.onDelta);
  const extraUrls: string[] = [];
  let essay = "";
  let responseId: string | undefined;
  let writing = false;

  for await (const ev of iterateSse(res)) {
    if (opts.signal?.aborted) return;
    if (!ev.data || ev.data === "[DONE]") continue;
    let json: Record<string, unknown>;
    try {
      json = JSON.parse(ev.data) as Record<string, unknown>;
    } catch {
      continue;
    }
    const type = String(ev.event || json.type || "");
    if (typeof json.id === "string" && type.includes("response")) {
      responseId = json.id;
    }
    if (json.response && typeof json.response === "object") {
      const id = (json.response as { id?: string }).id;
      if (id) responseId = id;
      const citations = (json.response as { citations?: string[] }).citations;
      if (Array.isArray(citations)) extraUrls.push(...citations);
    }
    if (Array.isArray(json.citations)) {
      extraUrls.push(...(json.citations as string[]));
    }

    const phase = phaseFromEvent(type);
    if (phase && !writing) opts.handlers.onStatus(phase.phase, phase.label);

    let delta = "";
    if (type === "response.output_text.delta" && typeof json.delta === "string") {
      delta = json.delta;
    } else if (typeof json.delta === "string" && type.includes("delta")) {
      delta = json.delta;
    } else if (json.choices && Array.isArray(json.choices)) {
      const c = json.choices[0] as { delta?: { content?: string } };
      delta = c?.delta?.content || "";
    }
    if (delta) {
      if (!writing) {
        writing = true;
        opts.handlers.onStatus("writing", "Writing the spine…");
      }
      essay += delta;
      parser.push(delta);
    }
  }

  const cites = collectCitations(essay, extraUrls);
  for (const c of cites) opts.handlers.onCitation(c);
  opts.handlers.onDone({ responseId });
}

const RESEARCH_TOOLS: ToolSpec[] = [
  { type: "web_search", enable_image_search: true },
  { type: "x_search" },
  { type: "code_interpreter" },
];

export async function runResearch(
  key: string,
  query: string,
  context: string,
  handlers: StreamHandlers,
  signal?: AbortSignal,
) {
  const user = context
    ? `Continuum so far:\n${context}\n\nResearch this:\n${query}`
    : query;
  await streamXai({
    key,
    system: RESEARCH_SYSTEM,
    user,
    tools: RESEARCH_TOOLS,
    handlers,
    signal,
  });
}

export async function runFollowup(
  key: string,
  query: string,
  priorEssay: string,
  previous: string | undefined,
  handlers: StreamHandlers,
  signal?: AbortSignal,
) {
  await streamXai({
    key,
    system: FOLLOWUP_SYSTEM,
    user: `Prior answer (abridged):\n${priorEssay.slice(0, 8000)}\n\nFollow-up:\n${query}`,
    tools: RESEARCH_TOOLS,
    previous,
    handlers,
    signal,
  });
}

export async function runFork(
  key: string,
  claim: string,
  context: string,
  handlers: StreamHandlers,
  signal?: AbortSignal,
) {
  await streamXai({
    key,
    system: FORK_SYSTEM,
    user: `Claim to fork:\n${claim}\n\nContext:\n${context.slice(0, 8000)}`,
    tools: RESEARCH_TOOLS,
    handlers,
    signal,
  });
}

export async function runMind(
  key: string,
  mode: "scout" | "skeptic" | "numbers" | "compare",
  page: string,
  handlers: StreamHandlers,
  signal?: AbortSignal,
) {
  const system =
    mode === "scout"
      ? SCOUT_SYSTEM
      : mode === "skeptic"
        ? SKEPTIC_SYSTEM
        : mode === "numbers"
          ? NUMBERS_SYSTEM
          : COMPARE_SYSTEM;
  const tools: ToolSpec[] =
    mode === "skeptic" ? RESEARCH_TOOLS : [];
  await streamXai({
    key,
    system,
    user: page.slice(0, 18000),
    tools,
    handlers,
    signal,
  });
}

export function handlersFromSse(
  write: (event: string, data: unknown) => void,
): StreamHandlers {
  const seen = new Set<string>();
  return {
    onStatus: (phase, label) => write("status", { phase, label }),
    onMeta: (meta) => write("meta", meta),
    onDelta: (text) => write("delta", { text }),
    onCitation: (c) => {
      const k = c.url;
      if (seen.has(k)) return;
      seen.add(k);
      write("citation", c);
    },
    onDone: (info) => write("done", info),
    onError: (message) => write("error", { message }),
  };
}
