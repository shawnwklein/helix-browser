import type { IncomingMessage, ServerResponse } from "node:http";

export function writeSse(
  res: ServerResponse,
  event: string,
  data: unknown,
) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

export function openSse(res: ServerResponse) {
  res.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
}

export async function readJson<T>(req: IncomingMessage): Promise<T> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8") || "{}";
  return JSON.parse(raw) as T;
}

export function parseSseBlock(raw: string): { event?: string; data: string } {
  let event: string | undefined;
  const dataLines: string[] = [];
  for (const line of raw.replace(/\r/g, "").split("\n")) {
    if (line.startsWith("event:")) event = line.slice(6).trim();
    else if (line.startsWith("data:")) dataLines.push(line.slice(5).trimStart());
  }
  return { event, data: dataLines.join("\n") };
}

export async function* iterateSse(res: Response): AsyncGenerator<{
  event?: string;
  data: string;
}> {
  if (!res.body) return;
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true }).replace(/\r/g, "");
    let idx: number;
    while ((idx = buf.indexOf("\n\n")) !== -1) {
      const raw = buf.slice(0, idx);
      buf = buf.slice(idx + 2);
      if (raw.trim()) yield parseSseBlock(raw);
    }
  }
  if (buf.trim()) yield parseSseBlock(buf);
}

export function keyFrom(req: IncomingMessage, fallback?: string) {
  const header = req.headers["x-helix-key"];
  const fromHeader = Array.isArray(header) ? header[0] : header;
  return (
    process.env.XAI_API_KEY ||
    fromHeader ||
    fallback ||
    ""
  ).trim();
}
