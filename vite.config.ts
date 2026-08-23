import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { helixApiPlugin } from "./server/vite-plugin";
import path from "node:path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  if (env.XAI_API_KEY && !process.env.XAI_API_KEY) {
    process.env.XAI_API_KEY = env.XAI_API_KEY;
  }
  if (env.HELIX_MODEL && !process.env.HELIX_MODEL) {
    process.env.HELIX_MODEL = env.HELIX_MODEL;
  }
  return {
    plugins: [react(), helixApiPlugin()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
    server: {
      host: "0.0.0.0",
      port: 5173,
      strictPort: true,
    },
  };
});
