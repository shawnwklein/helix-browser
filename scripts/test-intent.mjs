import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { readFileSync } from "node:fs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const constellationSrc = readFileSync(path.join(root, "src/views/Constellation.tsx"), "utf8");
const chromeSrc = readFileSync(path.join(root, "src/components/Chrome.tsx"), "utf8");
const facesSrc = readFileSync(path.join(root, "src/lib/faces.ts"), "utf8");
const storeSrc = readFileSync(path.join(root, "src/store.ts"), "utf8");
const faceBarSrc = readFileSync(path.join(root, "src/components/FaceBar.tsx"), "utf8");
const overlaysSrc = readFileSync(path.join(root, "src/components/Overlays.tsx"), "utf8");
const cssSrc = readFileSync(path.join(root, "src/index.css"), "utf8");
if (!constellationSrc.includes("omniboxEnter") || constellationSrc.includes("parseOmnibox")) {
  console.error("Constellation must commit through omniboxEnter, not parseOmnibox");
  process.exit(1);
}
if (!constellationSrc.includes("commitToIntent") || !chromeSrc.includes("commitToIntent")) {
  console.error("Constellation and Chrome must share commitToIntent");
  process.exit(1);
}
if (!facesSrc.includes("export function resolveFaceClick")) {
  console.error("faces.ts must export resolveFaceClick");
  process.exit(1);
}
if (!storeSrc.includes("resolveFaceClick") || !storeSrc.includes("faceStayPulse")) {
  console.error("setActiveFace must use resolveFaceClick and pulse stay");
  process.exit(1);
}
const setActiveFaceBody = storeSrc.match(
  /setActiveFace:\s*\(id\)\s*=>\s*\{([\s\S]*?)\n  \},/,
)?.[1];
if (
  !setActiveFaceBody ||
  !/if \(click\.kind === "stay"\) \{[\s\S]*faceStayPulse[\s\S]*return;[\s\S]*faceStayPulse/.test(
    setActiveFaceBody,
  )
) {
  console.error("setActiveFace must pulse faceStayPulse on switch as well as stay");
  process.exit(1);
}
if (!faceBarSrc.includes("stay") || !faceBarSrc.includes("faceStayPulse")) {
  console.error("FaceBar must pulse the lit pill and Browsing as on a stay click");
  process.exit(1);
}
if (!facesSrc.includes("export function clusterTabsByFace")) {
  console.error("faces.ts must export clusterTabsByFace");
  process.exit(1);
}
if (!chromeSrc.includes("clusterTabsByFace") || !chromeSrc.includes("tab-cluster")) {
  console.error("Chrome must render tab-cluster via clusterTabsByFace");
  process.exit(1);
}
if (!chromeSrc.includes("tab-cluster-kicker")) {
  console.error("Chrome must render a Face cluster kicker");
  process.exit(1);
}
if (
  !chromeSrc.includes("clusters.length > 1") &&
  !chromeSrc.includes("s.faces.length > 1")
) {
  console.error("Cluster kicker must wait until a second person exists");
  process.exit(1);
}
if (/\.tabs\.filter\(\s*\(?t\)?\s*=>\s*t\.faceId\s*===\s*s\.activeFaceId/.test(chromeSrc)) {
  console.error("other-Face tabs must stay visible, not filtered to the active Face");
  process.exit(1);
}
if (
  !facesSrc.includes("export function faceSwitchChord") ||
  !facesSrc.includes("export function faceIndexFromDigitCode")
) {
  console.error("faces.ts must export faceSwitchChord and faceIndexFromDigitCode");
  process.exit(1);
}
if (!faceBarSrc.includes("faceSwitchChord")) {
  console.error("FaceBar must advertise faceSwitchChord on pills");
  process.exit(1);
}
if (faceBarSrc.includes("Ctrl+${i + 1}")) {
  console.error("FaceBar must not advertise Ctrl+${i + 1}");
  process.exit(1);
}
if (!faceBarSrc.includes("<kbd") || !faceBarSrc.includes("s.faces.length > 1")) {
  console.error("Browsing as must show a kbd chord once a second Face exists");
  process.exit(1);
}
const pillMap = faceBarSrc.match(/s\.faces\.map\(\(f, i\) => \{[\s\S]*?<\/button>/)?.[0] ?? "";
if (
  !pillMap.includes("face-chord") ||
  !pillMap.includes("<kbd") ||
  !/s\.faces\.length > 1[\s\S]{0,120}<kbd/.test(pillMap)
) {
  console.error("Face pills must render a face-chord kbd once a second Face exists");
  process.exit(1);
}
if (!pillMap.includes("hide-narrow")) {
  console.error("in-pill face-chord must hide-narrow so 390px pills stay name-sized");
  process.exit(1);
}
if (pillMap.includes("Ctrl+${i + 1}")) {
  console.error("in-pill chord must stay faceSwitchChord, not Ctrl+N");
  process.exit(1);
}
if (!cssSrc.includes(".face-chord") || !cssSrc.includes(".face-pill.on .face-chord")) {
  console.error("index.css must style in-pill face-chord (quiet receded, Face-tinted on)");
  process.exit(1);
}
if (!chromeSrc.includes("faceIndexFromDigitCode")) {
  console.error("Chrome Digit Face-switch must use faceIndexFromDigitCode");
  process.exit(1);
}
if (!chromeSrc.includes('e.shiftKey && e.code.startsWith("Digit")')) {
  console.error("Chrome Digit Face-switch must keep shiftKey");
  process.exit(1);
}
if (
  !/e\.shiftKey && e\.code\.startsWith\("Digit"\)[\s\S]{0,320}setActiveFace/.test(chromeSrc)
) {
  console.error("Chrome Digit Face-switch must call setActiveFace (same pulse path as a click)");
  process.exit(1);
}
if (!chromeSrc.includes("faceSwitchChord")) {
  console.error("Chrome cluster kicker must include faceSwitchChord");
  process.exit(1);
}
if (
  !facesSrc.includes("export const FACE_ROLES") ||
  !facesSrc.includes("export function normalizeFaceName")
) {
  console.error("faces.ts must export FACE_ROLES and normalizeFaceName");
  process.exit(1);
}
if (
  storeSrc.includes("Face ${faces.length + 1}") ||
  storeSrc.includes("`Face ${")
) {
  console.error("addFace must not mint Face N");
  process.exit(1);
}
if (!storeSrc.includes("faceNamerOpen") || !storeSrc.includes("normalizeFaceName")) {
  console.error("nameless addFace must open faceNamerOpen and require a real name");
  process.exit(1);
}
if (
  !storeSrc.includes("set({ faceNamerOpen: true })") ||
  !storeSrc.includes("name: named") ||
  !storeSrc.includes("partition: partitionFor(id)")
) {
  console.error("nameless addFace must only flag the namer; named add must keep persist:helix-face- jars");
  process.exit(1);
}
if (
  !faceBarSrc.includes('menu === "add"') ||
  !faceBarSrc.includes("FACE_ROLES") ||
  !faceBarSrc.includes("Browse as") ||
  !faceBarSrc.includes("Name this person")
) {
  console.error("FaceBar + must open the add namer with role chips and Browse as");
  process.exit(1);
}
if (faceBarSrc.includes("onClick={() => s.addFace()}")) {
  console.error("FaceBar + must not call nameless addFace");
  process.exit(1);
}
if (overlaysSrc.includes('label: "New Face", run: () => s.addFace()')) {
  console.error("New Face must open the namer, not call nameless addFace");
  process.exit(1);
}
if (!overlaysSrc.includes("setFaceNamerOpen")) {
  console.error("New Face must open the same namer via setFaceNamerOpen");
  process.exit(1);
}
if (!cssSrc.includes(".face-roles") || !cssSrc.includes(".face-role")) {
  console.error("index.css must style the Face role chip row");
  process.exit(1);
}
if (
  !constellationSrc.includes("Browsing as") ||
  !constellationSrc.includes("face?.name") ||
  !constellationSrc.includes("face-dot")
) {
  console.error("Constellation must greet with Browsing as / face?.name and a face-dot");
  process.exit(1);
}
if (constellationSrc.includes("Helix · Grok-native Chromium")) {
  console.error("Constellation kicker must not stay generic Helix · Grok-native Chromium");
  process.exit(1);
}
if (
  !/className="constellation"[\s\S]{0,120}--face/.test(constellationSrc) &&
  !/--face[\s\S]{0,120}className="constellation"/.test(constellationSrc)
) {
  console.error("Constellation home must set --face on the root");
  process.exit(1);
}
if (!/constellation::before[\s\S]{0,500}--face/.test(cssSrc)) {
  console.error("constellation wash must tint to --face");
  process.exit(1);
}
if (!cssSrc.includes("constellation-arrive")) {
  console.error("constellation empty home must have a short arrival rise");
  process.exit(1);
}
if (!facesSrc.includes("export function homeThreadTitle")) {
  console.error("faces.ts must export homeThreadTitle");
  process.exit(1);
}
if (!storeSrc.includes("homeThreadTitle")) {
  console.error("store.ts must title home tabs with homeThreadTitle");
  process.exit(1);
}
if (storeSrc.includes('title: "New thread"')) {
  console.error("homeTab must not hardcode title: New thread");
  process.exit(1);
}
const runner = `
import { looksLikeUrl, parseOmnibox, previewIntent, normalizeUrl, omniboxEnter, commitToIntent } from "./src/lib/intent.ts";
import { resolveFaceClick, clusterTabsByFace, faceSwitchChord, faceIndexFromDigitCode, FACE_ROLES, normalizeFaceName, partitionFor, homeThreadTitle } from "./src/lib/faces.ts";
import { STARTERS } from "./src/lib/starters.ts";

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
const ambiguous = ["fusion", "github", "apple"];

let failed = 0;
for (const q of go) {
  const intent = parseOmnibox(q);
  if (intent.type !== "go" || !looksLikeUrl(q)) {
    console.error("expected go:", q, intent);
    failed++;
  }
  const preview = previewIntent(q);
  if (preview.type !== "go") {
    console.error("preview expected go:", q, preview);
    failed++;
  }
}
for (const q of ask) {
  const intent = parseOmnibox(q);
  if (intent.type !== "ask") {
    console.error("expected ask:", q, intent);
    failed++;
  }
  const preview = previewIntent(q);
  if (preview.type !== "ask") {
    console.error("preview expected ask:", q, preview);
    failed++;
  }
}
for (const q of ambiguous) {
  const preview = previewIntent(q);
  if (preview.type !== "ambiguous" || preview.text !== q || preview.url !== \`https://\${q}.com\`) {
    console.error("preview expected ambiguous:", q, preview);
    failed++;
  }
  // parseOmnibox still treats a bare token as Ask — Chrome must not coerce it to Go.
  const parsed = parseOmnibox(q);
  if (parsed.type !== "ask") {
    console.error("parseOmnibox should not auto-go:", q, parsed);
    failed++;
  }
}
const n = normalizeUrl("outlook.office.com");
if (n !== "https://outlook.office.com") {
  console.error("normalize", n);
  failed++;
}

// Chrome Enter: first ambiguous action still opens the chooser; second Enter Asks.
for (const q of ambiguous) {
  const first = omniboxEnter(q);
  if (first.action !== "chooser") {
    console.error("first Enter should show chooser:", q, first);
    failed++;
  }
  const second = omniboxEnter(q, { chooserOpen: true });
  if (second.action !== "ask" || second.query !== q) {
    console.error("second Enter should Ask:", q, second);
    failed++;
  }
}

// Real URLs still Go on Enter, even if a chooser were somehow open.
for (const q of go) {
  const enter = omniboxEnter(q);
  if (enter.action !== "go") {
    console.error("Enter on URL should Go:", q, enter);
    failed++;
  }
  const evenOpen = omniboxEnter(q, { chooserOpen: true });
  if (evenOpen.action !== "go") {
    console.error("chooserOpen must not steal URL Go:", q, evenOpen);
    failed++;
  }
}

// Ctrl/Cmd+Enter still force-Asks (URLs, ambiguous tokens, and thoughts).
for (const q of [...go, ...ambiguous, ...ask]) {
  const forced = omniboxEnter(q, { forceAsk: true });
  if (forced.action !== "ask" || forced.query !== q.trim()) {
    console.error("Ctrl/Cmd+Enter should force Ask:", q, forced);
    failed++;
  }
}

// New-tab / Constellation uses omniboxEnter + commitToIntent, not parseOmnibox.
const fusionFirst = omniboxEnter("fusion");
if (fusionFirst.action !== "chooser") {
  console.error("constellation first Enter on fusion should chooser:", fusionFirst);
  failed++;
}
if (commitToIntent(fusionFirst) !== null) {
  console.error("commitToIntent must not submit fusion chooser:", commitToIntent(fusionFirst));
  failed++;
}
const fusionSecond = omniboxEnter("fusion", { chooserOpen: true });
const fusionAsk = commitToIntent(fusionSecond);
if (!fusionAsk || fusionAsk.type !== "ask" || fusionAsk.query !== "fusion") {
  console.error("constellation second Enter on fusion should Ask:", fusionSecond, fusionAsk);
  failed++;
}
const fusionParsed = parseOmnibox("fusion");
if (fusionParsed.type !== "ask") {
  console.error("parseOmnibox(fusion) remains Ask (no silent fusion.com):", fusionParsed);
  failed++;
}

for (const q of ["google.com", "https://outlook.office.com"]) {
  const enter = omniboxEnter(q);
  const evenOpen = omniboxEnter(q, { chooserOpen: true });
  const intent = commitToIntent(evenOpen);
  if (enter.action !== "go" || evenOpen.action !== "go" || intent?.type !== "go") {
    console.error("constellation URL should Go even with chooserOpen:", q, enter, evenOpen, intent);
    failed++;
  }
}

for (const q of ["fusion", "google.com", "is fusion commercial yet"]) {
  const forced = omniboxEnter(q, { forceAsk: true });
  const intent = commitToIntent(forced);
  if (forced.action !== "ask" || intent?.type !== "ask" || intent.query !== q) {
    console.error("constellation Ctrl/Cmd+Enter should force Ask:", q, forced, intent);
    failed++;
  }
}

const ambPreview = previewIntent("fusion");
if (ambPreview.type !== "ambiguous" || commitToIntent(ambPreview) !== null) {
  console.error("commitToIntent must never treat ambiguous as a submit:", ambPreview, commitToIntent(ambPreview));
  failed++;
}
if (
  commitToIntent({ type: "ambiguous", text: "github", url: "https://github.com" }) !== null
) {
  console.error("commitToIntent must reject ambiguous Intent");
  failed++;
}

for (const q of ask) {
  const enter = omniboxEnter(q);
  const intent = commitToIntent(enter);
  if (enter.action !== "ask" || intent?.type !== "ask") {
    console.error("full-sentence thought should Ask:", q, enter, intent);
    failed++;
  }
}
for (const st of STARTERS) {
  const enter = omniboxEnter(st.query);
  const intent = commitToIntent(enter);
  if (enter.action !== "ask" || intent?.type !== "ask" || intent.query !== st.query) {
    console.error("starter should stay direct research:", st.kicker, enter, intent);
    failed++;
  }
}

const faceTabs = [
  { id: "work-old", faceId: "work" },
  { id: "personal-a", faceId: "personal" },
  { id: "work-new", faceId: "work" },
  { id: "personal-b", faceId: "personal" },
];
const stay = resolveFaceClick({
  faceId: "work",
  activeFaceId: "work",
  activeId: "work-old",
  tabs: faceTabs,
});
if (stay.kind !== "stay" || stay.activeId !== "work-old") {
  console.error("already-active Face must keep activeId:", stay);
  failed++;
}
const switchTo = resolveFaceClick({
  faceId: "personal",
  activeFaceId: "work",
  activeId: "work-old",
  tabs: faceTabs,
});
if (switchTo.kind !== "activate" || switchTo.tabId !== "personal-b") {
  console.error("other Face with tabs must activate last owned tab:", switchTo);
  failed++;
}
const empty = resolveFaceClick({
  faceId: "school",
  activeFaceId: "work",
  activeId: "work-old",
  tabs: faceTabs,
});
if (empty.kind !== "newTab" || empty.faceId !== "school") {
  console.error("Face with no tabs must request a new tab:", empty);
  failed++;
}

const clusterFaces = [
  { id: "work", name: "Work", color: "#d4a06a", kind: "outlook-work", partition: "persist:helix-face-work", createdAt: 1 },
  { id: "personal", name: "Personal", color: "#7ecfc4", kind: "personal", partition: "persist:helix-face-personal", createdAt: 2 },
  { id: "school", name: "School", color: "#6ea8ff", kind: "work", partition: "persist:helix-face-school", createdAt: 3 },
];
const mixedTabs = [
  { id: "w-old", faceId: "work" },
  { id: "p-a", faceId: "personal" },
  { id: "w-new", faceId: "work" },
  { id: "p-b", faceId: "personal" },
];
const grouped = clusterTabsByFace(clusterFaces, mixedTabs);
if (grouped.length !== 2) {
  console.error("empty Faces must be omitted; expected 2 clusters:", grouped);
  failed++;
}
if (
  grouped[0]?.face.id !== "work" ||
  grouped[0]?.tabs.map((t) => t.id).join() !== "w-old,w-new"
) {
  console.error("Work cluster must keep in-face order, Face order first:", grouped[0]);
  failed++;
}
if (
  grouped[1]?.face.id !== "personal" ||
  grouped[1]?.tabs.map((t) => t.id).join() !== "p-a,p-b"
) {
  console.error("Personal cluster must keep in-face order:", grouped[1]);
  failed++;
}
const allIds = grouped.flatMap((c) => c.tabs.map((t) => t.id)).join();
if (allIds !== "w-old,w-new,p-a,p-b") {
  console.error("other-Face tabs must stay in the strip, not be dropped:", allIds);
  failed++;
}
const personalFirst = clusterTabsByFace([clusterFaces[1], clusterFaces[0]], mixedTabs);
if (
  personalFirst.map((c) => c.face.id).join() !== "personal,work" ||
  personalFirst[0]?.tabs.map((t) => t.id).join() !== "p-a,p-b"
) {
  console.error("clusters must follow Face order:", personalFirst);
  failed++;
}
const solo = clusterTabsByFace(
  [clusterFaces[1]],
  [{ id: "p1", faceId: "personal" }, { id: "p2", faceId: "personal" }],
);
if (solo.length !== 1 || solo[0].face.id !== "personal" || solo[0].tabs.length !== 2) {
  console.error("single-Face strip is one unlabeled cluster:", solo);
  failed++;
}
const none = clusterTabsByFace(clusterFaces, [{ id: "p1", faceId: "personal" }]);
if (none.length !== 1 || none[0].face.id !== "personal") {
  console.error("Faces with no tabs must be omitted even if listed first:", none);
  failed++;
}

if (faceSwitchChord(0) !== "Ctrl+Shift+1") {
  console.error("faceSwitchChord(0) must be Ctrl+Shift+1:", faceSwitchChord(0));
  failed++;
}
if (faceSwitchChord(8) !== "Ctrl+Shift+9") {
  console.error("faceSwitchChord(8) must be Ctrl+Shift+9:", faceSwitchChord(8));
  failed++;
}
if (faceSwitchChord(9) !== null) {
  console.error("faceSwitchChord(9) must be null:", faceSwitchChord(9));
  failed++;
}
if (faceIndexFromDigitCode("Digit1") !== 0) {
  console.error("Digit1 must map to Face 0:", faceIndexFromDigitCode("Digit1"));
  failed++;
}
if (faceIndexFromDigitCode("Digit9") !== 8) {
  console.error("Digit9 must map to Face 8:", faceIndexFromDigitCode("Digit9"));
  failed++;
}
if (faceIndexFromDigitCode("Digit0") !== null) {
  console.error("Digit0 must not switch a Face:", faceIndexFromDigitCode("Digit0"));
  failed++;
}

if (FACE_ROLES.join() !== "Work,School,Home") {
  console.error("FACE_ROLES must be Work / School / Home:", FACE_ROLES);
  failed++;
}
if (normalizeFaceName("") !== null || normalizeFaceName("   ") !== null || normalizeFaceName(undefined) !== null) {
  console.error("empty / whitespace Face names are invalid");
  failed++;
}
if (normalizeFaceName("Work") !== "Work" || normalizeFaceName("  Home  ") !== "Home") {
  console.error("normalizeFaceName must trim and keep Work / Home:", normalizeFaceName("Work"), normalizeFaceName("  Home  "));
  failed++;
}

function draftNamedFace(raw, id) {
  const name = normalizeFaceName(raw);
  if (!name) return null;
  return { name, partition: partitionFor(id) };
}
if (draftNamedFace(undefined, "x") || draftNamedFace("", "x") || draftNamedFace("   ", "x")) {
  console.error("nameless / empty / whitespace add must create nothing");
  failed++;
}
const work = draftNamedFace("Work", "work");
const school = draftNamedFace("School", "school");
const home = draftNamedFace("  Home  ", "home");
if (work?.name !== "Work" || school?.name !== "School" || home?.name !== "Home") {
  console.error("Work / School / typed Home must become those names:", work, school, home);
  failed++;
}
if (
  work?.partition !== "persist:helix-face-work" ||
  school?.partition !== "persist:helix-face-school" ||
  home?.partition !== "persist:helix-face-home"
) {
  console.error("named Faces must keep persist:helix-face- jars:", work, school, home);
  failed++;
}

if (homeThreadTitle("Work") !== "Work's thread") {
  console.error("homeThreadTitle(Work) must be Work's thread:", homeThreadTitle("Work"));
  failed++;
}
if (homeThreadTitle("Personal") !== "Personal's thread") {
  console.error("homeThreadTitle(Personal) must be Personal's thread:", homeThreadTitle("Personal"));
  failed++;
}
if (homeThreadTitle("Work Outlook") !== "Work Outlook's thread") {
  console.error("homeThreadTitle(Work Outlook) must be Work Outlook's thread:", homeThreadTitle("Work Outlook"));
  failed++;
}
if (homeThreadTitle("  Work  ") !== "Work's thread") {
  console.error("homeThreadTitle must trim:", homeThreadTitle("  Work  "));
  failed++;
}
if (
  homeThreadTitle("") !== "New thread" ||
  homeThreadTitle("   ") !== "New thread" ||
  homeThreadTitle(undefined) !== "New thread"
) {
  console.error("empty homeThreadTitle must stay the last-resort fallback");
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
