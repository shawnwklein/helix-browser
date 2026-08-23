import type { Plugin } from "vite";
import { handleApi } from "./api";

export function helixApiPlugin(): Plugin {
  return {
    name: "helix-api",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url ?? "";
        if (!url.startsWith("/api")) return next();
        try {
          await handleApi(req, res);
        } catch (err) {
          if (res.headersSent) return;
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: String(err) }));
        }
      });
    },
  };
}
