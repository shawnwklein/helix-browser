import type { IncomingMessage, ServerResponse } from "node:http";
import { extractPage } from "./extract";
import {
  handlersFromSse,
  runFollowup,
  runFork,
  runMind,
  runResearch,
  MODEL,
} from "./grok";
import { demoFork, DEMO_MIND, matchDemo, playDemo } from "./demo";
import { keyFrom, openSse, readJson, writeSse } from "./sse";

let sessionKey = "";

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

function pathOf(req: IncomingMessage) {
  return (req.url || "").split("?")[0];
}

export async function handleApi(req: IncomingMessage, res: ServerResponse) {
  const path = pathOf(req);
  const method = req.method || "GET";

  if (path === "/api/health") {
    return sendJson(res, 200, { ok: true, name: "helix", model: MODEL });
  }

  if (path === "/api/status" && method === "GET") {
    const key = keyFrom(req, sessionKey);
    return sendJson(res, 200, {
      hasKey: Boolean(key),
      demo: !key,
      model: MODEL,
      desktop: false,
    });
  }

  if (path === "/api/key" && method === "POST") {
    const body = await readJson<{ key?: string }>(req);
    sessionKey = (body.key || "").trim();
    return sendJson(res, 200, { hasKey: Boolean(sessionKey), demo: !sessionKey });
  }

  if (path === "/api/extract" && method === "GET") {
    const u = new URL(req.url || "", "http://helix.local");
    const target = u.searchParams.get("url");
    if (!target) return sendJson(res, 400, { error: "url required" });
    try {
      const page = await extractPage(target);
      return sendJson(res, 200, page);
    } catch (err) {
      return sendJson(res, 422, { error: String((err as Error).message || err) });
    }
  }

  const streamPaths = new Set([
    "/api/grok/research",
    "/api/grok/followup",
    "/api/grok/fork",
    "/api/grok/mind",
  ]);

  if (streamPaths.has(path) && method === "POST") {
    const key = keyFrom(req, sessionKey);
    const body = await readJson<{
      query?: string;
      claim?: string;
      context?: string;
      priorEssay?: string;
      previous?: string;
      mode?: "scout" | "skeptic" | "numbers" | "compare";
      page?: string;
    }>(req);

    openSse(res);
    const write = (event: string, data: unknown) => writeSse(res, event, data);
    const h = handlersFromSse(write);
    const ac = new AbortController();
    req.on("close", () => ac.abort());

    try {
      if (!key) {
        if (path === "/api/grok/mind") {
          const mode = body.mode || "scout";
          write("status", { phase: "writing", label: "Scout is looking…" });
          const text = DEMO_MIND[mode] || DEMO_MIND.scout;
          write("delta", { text });
          write("done", { responseId: "demo" });
        } else if (path === "/api/grok/fork") {
          await playDemo(demoFork(body.claim || body.query || ""), h, ac.signal);
        } else {
          await playDemo(matchDemo(body.query || ""), h, ac.signal);
        }
      } else if (path === "/api/grok/research") {
        await runResearch(key, body.query || "", body.context || "", h, ac.signal);
      } else if (path === "/api/grok/followup") {
        await runFollowup(
          key,
          body.query || "",
          body.priorEssay || "",
          body.previous,
          h,
          ac.signal,
        );
      } else if (path === "/api/grok/fork") {
        await runFork(key, body.claim || "", body.context || "", h, ac.signal);
      } else if (path === "/api/grok/mind") {
        await runMind(
          key,
          body.mode || "scout",
          body.page || "",
          h,
          ac.signal,
        );
      }
    } catch (err) {
      h.onError(String((err as Error).message || err));
    }
    res.end();
    return;
  }

  sendJson(res, 404, { error: "unknown endpoint" });
}
