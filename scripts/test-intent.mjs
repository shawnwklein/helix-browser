import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const runner = `
import { looksLikeUrl, parseOmnibox, normalizeUrl } from "./src/lib/intent.ts";

const go = [
  "google.com",
  "www.google.com",
  "https://outlook.office.com/mail/",
  "http://localhost:5173",
  "localhost:3000",
  "127.0.0.1",
  "outlook.office.com",
];
const ask = [
  "is fusion commercial yet",
  "?just a question",
];

let failed = 0;
for (const q of go) {
  const intent = parseOmnibox(q);
  if (intent.type !== "go" || !looksLikeUrl(q)) {
    console.error("expected go:", q, intent);
    failed++;
  }
}
for (const q of ask) {
  const intent = parseOmnibox(q);
  if (intent.type !== "ask") {
    console.error("expected ask:", q, intent);
    failed++;
  }
}
const n = normalizeUrl("outlook.office.com");
if (n !== "https://outlook.office.com") {
  console.error("normalize", n);
  failed++;
}
if (failed) {
  console.error(failed, "intent failures");
  process.exit(1);
}
console.log("intent tests passed");
`;

const result = spawnSync(
  process.execPath,
  ["--experimental-strip-types", "--input-type=module", "-e", runner],
  { cwd: root, encoding: "utf8" },
);
process.stdout.write(result.stdout || "");
process.stderr.write(result.stderr || "");
process.exit(result.status ?? 1);
