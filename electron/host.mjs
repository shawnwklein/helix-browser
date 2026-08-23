import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, resolve } from "node:path";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".json": "application/json",
  ".map": "application/json",
  ".txt": "text/plain; charset=utf-8",
};

export function startHelixHost({ distDir, handleApi }) {
  const root = resolve(distDir);
  return new Promise((resolvePromise, reject) => {
    const server = createServer(async (req, res) => {
      try {
        const url = new URL(req.url || "/", "http://127.0.0.1");
        if (url.pathname.startsWith("/api")) {
          await handleApi(req, res);
          return;
        }
        let rel = decodeURIComponent(url.pathname);
        if (rel === "/" || !extname(rel)) rel = "/index.html";
        const full = resolve(join(root, `.${rel}`));
        if (!full.startsWith(root)) {
          res.writeHead(403);
          res.end();
          return;
        }
        const data = await readFile(full);
        res.writeHead(200, {
          "Content-Type": MIME[extname(full)] || "application/octet-stream",
        });
        res.end(data);
      } catch {
        if (!res.headersSent) {
          res.writeHead(404);
          res.end("not found");
        }
      }
    });
    server.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      resolvePromise({
        server,
        url: `http://127.0.0.1:${addr.port}`,
      });
    });
    server.on("error", reject);
  });
}
