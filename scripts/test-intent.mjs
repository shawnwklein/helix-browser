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
if (!facesSrc.includes("export function resolveFaceClose")) {
  console.error("faces.ts must export resolveFaceClose");
  process.exit(1);
}
if (!storeSrc.includes("resolveFaceClick") || !storeSrc.includes("faceStayPulse")) {
  console.error("setActiveFace must use resolveFaceClick and pulse stay");
  process.exit(1);
}
const closeTabBody = storeSrc.match(/closeTab:\s*\(id\)\s*=>\s*\{([\s\S]*?)\n  \},/)?.[1];
if (!closeTabBody || !closeTabBody.includes("resolveFaceClose")) {
  console.error("closeTab must use resolveFaceClose");
  process.exit(1);
}
if (!closeTabBody.includes("mintHome") || !closeTabBody.includes("homeTab")) {
  console.error("closeTab last-of-Face must mint a home tab");
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
if (!chromeSrc.includes("faceStayPulse")) {
  console.error("Chrome must subscribe to faceStayPulse the way FaceBar does");
  process.exit(1);
}
const kickerBtn =
  chromeSrc.match(/className=\{`tab-cluster-kicker[\s\S]*?`\}/)?.[0] ?? "";
if (
  !kickerBtn.includes("stay") ||
  !kickerBtn.includes("current") ||
  !kickerBtn.includes("staying")
) {
  console.error("Chrome must add stay only on the current tab-cluster-kicker");
  process.exit(1);
}
if (!chromeSrc.includes("-stay-${stayTick}")) {
  console.error("Chrome must remount the current cluster kicker on faceStayPulse");
  process.exit(1);
}
if (!cssSrc.includes(".tab-cluster.current .tab-cluster-kicker.stay")) {
  console.error("index.css must Face-tint stay on the current cluster kicker");
  process.exit(1);
}
if (!cssSrc.includes("@keyframes face-stay-kicker")) {
  console.error("index.css must define cluster kicker stay keyframes");
  process.exit(1);
}
if (!/prefers-reduced-motion: reduce[\s\S]*tab-cluster-kicker\.stay/.test(cssSrc)) {
  console.error("prefers-reduced-motion must disable kicker stay animation");
  process.exit(1);
}
if (constellationSrc.includes("faceStayPulse")) {
  console.error("Constellation must not subscribe to faceStayPulse");
  process.exit(1);
}
const omniboxFace =
  chromeSrc.match(/className=\{`omnibox-face[\s\S]*?<\/span>/)?.[0] ?? "";
if (
  !omniboxFace.includes("stay") ||
  !omniboxFace.includes("staying") ||
  !omniboxFace.includes("face-dot")
) {
  console.error("Chrome must remount the omnibox Face chip with stay and a Face-dot");
  process.exit(1);
}
if (!chromeSrc.includes("omnibox-face-stay-${stayTick}")) {
  console.error("Chrome must remount the omnibox Face chip on faceStayPulse");
  process.exit(1);
}
if (constellationSrc.includes("omnibox-face") || constellationSrc.includes("stayTick")) {
  console.error("Constellation must not take the omnibox Face stay flash");
  process.exit(1);
}
if (!cssSrc.includes(".omnibox-face.stay")) {
  console.error("index.css must Face-tint stay on the omnibox Face chip");
  process.exit(1);
}
if (!cssSrc.includes(".omnibox-face .face-dot")) {
  console.error("index.css must compact the omnibox Face-dot");
  process.exit(1);
}
if (!cssSrc.includes("@keyframes face-stay-omnibox")) {
  console.error("index.css must define omnibox Face stay keyframes");
  process.exit(1);
}
if (!/prefers-reduced-motion: reduce[\s\S]*omnibox-face\.stay/.test(cssSrc)) {
  console.error("prefers-reduced-motion must disable omnibox Face stay animation");
  process.exit(1);
}
if (!/@media \(max-width: 960px\)[\s\S]*\.omnibox-face \{ display: none; \}/.test(cssSrc)) {
  console.error("hide-narrow must still hide .omnibox-face");
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
if (!facesSrc.includes("export function clusterTabLayout")) {
  console.error("faces.ts must export clusterTabLayout");
  process.exit(1);
}
if (!chromeSrc.includes("clusterTabLayout")) {
  console.error("Chrome must mark receded clusters with clusterTabLayout");
  process.exit(1);
}
if (!/className=\{`tab-cluster[\s\S]*fold/.test(chromeSrc)) {
  console.error("Chrome must add fold on receded clusters");
  process.exit(1);
}
if (!chromeSrc.includes("cluster.tabs.map")) {
  console.error("Chrome must still map every cluster tab, not drop receded Faces");
  process.exit(1);
}
if (chromeSrc.includes("cluster.tabs.filter") || /tabs\.filter\([\s\S]*activeFaceId/.test(chromeSrc)) {
  console.error("Chrome must not filter tabs to the active Face");
  process.exit(1);
}
if (!chromeSrc.includes("s.activate(t.id)") || !chromeSrc.includes("s.closeTab(t.id)")) {
  console.error("receded peeks must still activate and close");
  process.exit(1);
}
if (!cssSrc.includes(".tab-cluster.fold .tab")) {
  console.error("index.css must size folded tabs as icon peeks");
  process.exit(1);
}
const foldTabCss = cssSrc.match(/\.tab-cluster\.fold \.tab\s*\{[\s\S]*?\}/)?.[0] ?? "";
const foldMax = foldTabCss.match(/max-width:\s*(\d+)px/);
const foldMin = foldTabCss.match(/min-width:\s*(\d+)px/);
if (!foldMax || Number(foldMax[1]) > 40 || !foldMin || Number(foldMin[1]) > 40) {
  console.error("folded tabs must be icon-sized (≤40px), not titled-tab width:", foldTabCss);
  process.exit(1);
}
if (Number(foldMax[1]) !== 30 || Number(foldMin[1]) !== 30) {
  console.error("folded tabs idle size must stay 30px:", foldTabCss);
  process.exit(1);
}
const foldTitleCss = cssSrc.match(/\.tab-cluster\.fold \.tab-title\s*\{[\s\S]*?\}/)?.[0] ?? "";
if (!/display:\s*none/.test(foldTitleCss)) {
  console.error("folded tab title must be hidden; title stays on the tooltip:", foldTitleCss);
  process.exit(1);
}
if (!cssSrc.includes(".tab-cluster.fold .tab:hover .tab-x")) {
  console.error("index.css must show close on hover for folded peeks");
  process.exit(1);
}
if (!chromeSrc.includes("${t.title} · ${cluster.face.name}")) {
  console.error("folded peeks must keep {tab} · {Face} tooltip");
  process.exit(1);
}
if (!/transition:\s*max-width/.test(foldTabCss)) {
  console.error("folded peeks must ease max-width when they stretch:", foldTabCss);
  process.exit(1);
}
const foldGrowCss =
  cssSrc.match(
    /\.tab-cluster\.fold \.tab:hover\s*,\s*\.tab-cluster\.fold \.tab:focus-within\s*\{[\s\S]*?\}/,
  )?.[0] ?? "";
const growMax = foldGrowCss.match(/max-width:\s*(\d+)px/);
if (!foldGrowCss.includes(":hover") || !foldGrowCss.includes(":focus-within")) {
  console.error("folded peeks must stretch on hover and focus-within:", foldGrowCss);
  process.exit(1);
}
if (!growMax || Number(growMax[1]) <= 40) {
  console.error("hover/focus folded peek must grow past icon size:", foldGrowCss);
  process.exit(1);
}
if (Number(growMax[1]) !== 148) {
  console.error("hover/focus folded peek must grow to 148px:", foldGrowCss);
  process.exit(1);
}
if (/outline:/.test(foldGrowCss) || /box-shadow:/.test(foldGrowCss)) {
  console.error("hover stretch must not share the keyboard ring:", foldGrowCss);
  process.exit(1);
}
const foldFocusCss =
  cssSrc.match(/\.tab-cluster\.fold \.tab:focus-visible\s*\{[\s\S]*?\}/)?.[0] ?? "";
if (!foldFocusCss) {
  console.error("folded peeks must have a :focus-visible keyboard ring");
  process.exit(1);
}
if (!foldFocusCss.includes("var(--face")) {
  console.error("focus-visible peek ring must tint with --face:", foldFocusCss);
  process.exit(1);
}
const foldFocusOutline = foldFocusCss.match(/outline:\s*([^;]+)/)?.[1]?.trim() ?? "";
const foldFocusShadow = foldFocusCss.match(/box-shadow:\s*([^;]+)/)?.[1]?.trim() ?? "";
const foldRing =
  (foldFocusOutline && !/^(none|0(\s|$))/.test(foldFocusOutline) ? foldFocusOutline : "") ||
  (foldFocusShadow && !/^(none|0(\s|$))/.test(foldFocusShadow) ? foldFocusShadow : "");
if (!foldRing) {
  console.error("focus-visible peek must have a non-none outline or box-shadow ring:", foldFocusCss);
  process.exit(1);
}
if (foldFocusOutline && !/outline-offset:/.test(foldFocusCss)) {
  console.error("focus-visible peek outline must have an offset:", foldFocusCss);
  process.exit(1);
}
if (/prefers-reduced-motion: reduce[\s\S]*\.tab-cluster\.fold \.tab:focus-visible[\s\S]{0,120}outline:\s*none/.test(cssSrc)) {
  console.error("reduced-motion must not kill the folded peek focus ring");
  process.exit(1);
}
const foldGrowTitleCss =
  cssSrc.match(
    /\.tab-cluster\.fold \.tab:hover \.tab-title\s*,\s*\.tab-cluster\.fold \.tab:focus-within \.tab-title\s*\{[\s\S]*?\}/,
  )?.[0] ?? "";
if (!foldGrowTitleCss || /display:\s*none/.test(foldGrowTitleCss)) {
  console.error("hover/focus folded peek must show the title:", foldGrowTitleCss);
  process.exit(1);
}
if (!/display:\s*(block|inline|flex|revert)/.test(foldGrowTitleCss)) {
  console.error("hover/focus title rule must un-hide .tab-title:", foldGrowTitleCss);
  process.exit(1);
}
if (!/prefers-reduced-motion: reduce[\s\S]*\.tab-cluster\.fold \.tab/.test(cssSrc)) {
  console.error("prefers-reduced-motion must kill the folded peek grow");
  process.exit(1);
}
const tabPeekJsx = chromeSrc.match(/cluster\.tabs\.map\(\(t\) => \(([\s\S]*?)\)\)/)?.[1] ?? "";
if (/onMouseEnter/.test(tabPeekJsx) || /setActiveFace/.test(tabPeekJsx)) {
  console.error("hovering a peek must not setActiveFace; who you are waits for a click");
  process.exit(1);
}
if (!tabPeekJsx.includes("s.activate(t.id)") || !tabPeekJsx.includes("s.closeTab(t.id)")) {
  console.error("click still activates and closes the peeked tab");
  process.exit(1);
}
if (!/tabIndex=\{layout === "fold" \? 0 : undefined\}/.test(tabPeekJsx)) {
  console.error("folded peeks must take keyboard focus so focus-within can reveal the title");
  process.exit(1);
}
const recedeIdleCss =
  cssSrc.match(/\.tab-cluster:not\(\.current\)\s*\{[\s\S]*?\}/)?.[0] ?? "";
if (!/opacity:\s*0\.46/.test(recedeIdleCss)) {
  console.error("idle receded cluster must stay at opacity 0.46:", recedeIdleCss);
  process.exit(1);
}
const recedeLiftCombined =
  cssSrc.match(
    /\.tab-cluster:not\(\.current\):hover\s*,\s*\.tab-cluster:not\(\.current\):focus-within\s*\{[\s\S]*?\}/,
  )?.[0] ??
  cssSrc.match(
    /\.tab-cluster:not\(\.current\):focus-within\s*,\s*\.tab-cluster:not\(\.current\):hover\s*\{[\s\S]*?\}/,
  )?.[0] ??
  "";
const recedeHoverCss =
  recedeLiftCombined ||
  (cssSrc.match(/\.tab-cluster:not\(\.current\):hover\s*\{[\s\S]*?\}/)?.[0] ?? "");
const recedeFocusCss =
  recedeLiftCombined ||
  (cssSrc.match(/\.tab-cluster:not\(\.current\):focus-within\s*\{[\s\S]*?\}/)?.[0] ?? "");
if (!recedeHoverCss.includes(":hover") || !/opacity:\s*0\.78/.test(recedeHoverCss)) {
  console.error("receded cluster hover must still lift to opacity 0.78:", recedeHoverCss);
  process.exit(1);
}
if (!recedeFocusCss.includes(":focus-within") || !/opacity:\s*0\.78/.test(recedeFocusCss)) {
  console.error("receded cluster :focus-within must lift to opacity 0.78:", recedeFocusCss);
  process.exit(1);
}
if (/prefers-reduced-motion: reduce[\s\S]*\.tab-cluster:not\(\.current\)[\s\S]{0,160}opacity:/.test(cssSrc)) {
  console.error("reduced-motion must not kill receded cluster opacity");
  process.exit(1);
}
const kickerJsx =
  chromeSrc.match(/<button[\s\S]*?className=\{`tab-cluster-kicker[\s\S]*?<\/button>/)?.[0] ?? "";
if (/onMouseEnter/.test(kickerJsx) || /onFocus/.test(kickerJsx)) {
  console.error("cluster kicker hover/focus must not setActiveFace");
  process.exit(1);
}
if (!kickerJsx.includes("s.setActiveFace(cluster.face.id)")) {
  console.error("cluster kicker click must still setActiveFace");
  process.exit(1);
}
const recedeKickerFocusCss =
  cssSrc.match(
    /\.tab-cluster:not\(\.current\) \.tab-cluster-kicker:focus-visible\s*\{[\s\S]*?\}/,
  )?.[0] ?? "";
if (!recedeKickerFocusCss) {
  console.error("receded cluster kicker must have a :focus-visible keyboard ring");
  process.exit(1);
}
if (!recedeKickerFocusCss.includes("var(--face")) {
  console.error("focus-visible receded kicker ring must tint with --face:", recedeKickerFocusCss);
  process.exit(1);
}
const recedeKickerOutline = recedeKickerFocusCss.match(/outline:\s*([^;]+)/)?.[1]?.trim() ?? "";
if (!recedeKickerOutline || /^(none|0(\s|$))/.test(recedeKickerOutline)) {
  console.error("focus-visible receded kicker must have a non-none outline:", recedeKickerFocusCss);
  process.exit(1);
}
if (!/outline-offset:/.test(recedeKickerFocusCss)) {
  console.error("focus-visible receded kicker outline must have an offset:", recedeKickerFocusCss);
  process.exit(1);
}
const kickerHoverCss = cssSrc.match(/\.tab-cluster-kicker:hover\s*\{[\s\S]*?\}/)?.[0] ?? "";
if (!kickerHoverCss) {
  console.error("cluster kicker hover wash must remain");
  process.exit(1);
}
if (/outline:/.test(kickerHoverCss) || /box-shadow:/.test(kickerHoverCss)) {
  console.error("kicker hover must stay a wash without a ring:", kickerHoverCss);
  process.exit(1);
}
if (
  /prefers-reduced-motion: reduce[\s\S]*\.tab-cluster:not\(\.current\) \.tab-cluster-kicker:focus-visible[\s\S]{0,120}outline:\s*none/.test(
    cssSrc,
  )
) {
  console.error("reduced-motion must not kill the receded kicker focus ring");
  process.exit(1);
}
const currentKickerFocusCss =
  cssSrc.match(
    /\.tab-cluster\.current \.tab-cluster-kicker:focus-visible\s*\{[\s\S]*?\}/,
  )?.[0] ?? "";
if (!currentKickerFocusCss) {
  console.error("current cluster kicker must have a :focus-visible keyboard ring");
  process.exit(1);
}
if (!currentKickerFocusCss.includes("var(--face")) {
  console.error("focus-visible current kicker ring must tint with --face:", currentKickerFocusCss);
  process.exit(1);
}
const currentKickerOutline = currentKickerFocusCss.match(/outline:\s*([^;]+)/)?.[1]?.trim() ?? "";
if (!currentKickerOutline || /^(none|0(\s|$))/.test(currentKickerOutline)) {
  console.error("focus-visible current kicker must have a non-none outline:", currentKickerFocusCss);
  process.exit(1);
}
if (!/outline-offset:/.test(currentKickerFocusCss)) {
  console.error("focus-visible current kicker outline must have an offset:", currentKickerFocusCss);
  process.exit(1);
}
if (
  /prefers-reduced-motion: reduce[\s\S]*\.tab-cluster\.current \.tab-cluster-kicker:focus-visible[\s\S]{0,120}outline:\s*none/.test(
    cssSrc,
  )
) {
  console.error("reduced-motion must not kill the current kicker focus ring");
  process.exit(1);
}
if (
  !facesSrc.includes("export function faceSwitchChord") ||
  !facesSrc.includes("export function faceSwitchChordCompact") ||
  !facesSrc.includes("export function faceIndexFromDigitCode")
) {
  console.error("faces.ts must export faceSwitchChord, faceSwitchChordCompact, and faceIndexFromDigitCode");
  process.exit(1);
}
if (!faceBarSrc.includes("faceSwitchChord")) {
  console.error("FaceBar must advertise faceSwitchChord on pills");
  process.exit(1);
}
if (!faceBarSrc.includes("faceSwitchChordCompact")) {
  console.error("FaceBar receded pills must use faceSwitchChordCompact");
  process.exit(1);
}
if (!/const currentChord =[\s\S]{0,160}faceSwitchChord\(/.test(faceBarSrc)) {
  console.error("Browsing as kbd must stay full faceSwitchChord");
  process.exit(1);
}
if (/const currentChord =[\s\S]{0,160}faceSwitchChordCompact/.test(faceBarSrc)) {
  console.error("Browsing as must not use compact chords");
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
if (
  !facesSrc.includes("export const FACE_BAR_VISIBLE") ||
  !facesSrc.includes("export function overflowFaces") ||
  !facesSrc.includes("export function overflowMoreTitle") ||
  !facesSrc.includes("export function faceArrivesFromOverflow") ||
  !facesSrc.includes("export function facesDepartToOverflow") ||
  !facesSrc.includes("export function overflowRowSettles") ||
  !facesSrc.includes("export function overflowRowLeaves") ||
  !facesSrc.includes("export function overflowSheetHoldMs") ||
  !facesSrc.includes("export function overflowSheetExits") ||
  !facesSrc.includes("export function overflowMoreOpen") ||
  !facesSrc.includes("export const FACE_STAY_PULSE_MS") ||
  !facesSrc.includes("export function overflowSheetRows") ||
  !facesSrc.includes("export function overflowRecedeKicker")
) {
  console.error("faces.ts must export FACE_BAR_VISIBLE, overflowFaces, overflowMoreTitle, faceArrivesFromOverflow, facesDepartToOverflow, overflowRowSettles, overflowRowLeaves, overflowSheetHoldMs, overflowSheetExits, overflowMoreOpen, FACE_STAY_PULSE_MS, overflowSheetRows, and overflowRecedeKicker");
  process.exit(1);
}
if (!faceBarSrc.includes("overflowFaces") || !faceBarSrc.includes("FACE_BAR_VISIBLE")) {
  console.error("FaceBar must fold extras with overflowFaces / FACE_BAR_VISIBLE");
  process.exit(1);
}
if (!faceBarSrc.includes("faceArrivesFromOverflow") || !faceBarSrc.includes("faceStayPulse")) {
  console.error("FaceBar must latch overflow arrive on the same faceStayPulse window as stay");
  process.exit(1);
}
if (!faceBarSrc.includes("facesDepartToOverflow") || !faceBarSrc.includes("settlePulse")) {
  console.error("FaceBar must latch overflow depart on the same faceStayPulse window as arrive");
  process.exit(1);
}
if (/\bs\.faces\.map\(/.test(faceBarSrc)) {
  console.error("FaceBar must mint pills from overflowFaces shown, not s.faces.map");
  process.exit(1);
}
if (!faceBarSrc.includes('menu === "overflow"') || !faceBarSrc.includes('menu !== "overflow"')) {
  console.error("overflow must be a menu, not a Face id");
  process.exit(1);
}
if (!faceBarSrc.includes("{overflow.length} more")) {
  console.error("FaceBar must render N more for overflowed Faces");
  process.exit(1);
}
const morePill = faceBarSrc.match(/className=\{`face-pill face-more[\s\S]*?<\/button>/)?.[0] ?? "";
if (
  !morePill.includes("overflowMoreTitle") ||
  !morePill.includes("face-more-who") ||
  !morePill.includes("face-dot")
) {
  console.error("N more pill must show overflow Face-dots and a named title");
  process.exit(1);
}
if (!faceBarSrc.includes("more-settle-${stayTick}") || !/settling \? " settle"/.test(morePill)) {
  console.error("N more pill must remount with settle when a Face departs into overflow");
  process.exit(1);
}
if (
  !morePill.includes("latch.settleIds.includes(f.id)") ||
  !/face-dot\$\{settling && latch\.settleIds\.includes\(f\.id\) \? " settle" : ""\}/.test(morePill)
) {
  console.error("N more must mark the folded Face-dot with settle, not a Face wash on the count");
  process.exit(1);
}
const moreHead = morePill.split("<span")[0] ?? morePill;
if (moreHead.includes("--face") || moreHead.includes("style=")) {
  console.error("N more count pill must stay untinted (Face color lives on the dots)");
  process.exit(1);
}
if (morePill.includes("more Face") || morePill.includes("more Faces")) {
  console.error("N more title must name overflow Faces, not a faceless N more Faces");
  process.exit(1);
}
const overflowSheet = faceBarSrc.match(/sheetRows\.map\(\(f\) => \{[\s\S]*?<\/button>/)?.[0] ?? "";
if (!overflowSheet.includes("setActiveFace")) {
  console.error("overflow sheet must setActiveFace the overflowed name");
  process.exit(1);
}
if (overflowSheet.includes("pal-item")) {
  console.error("overflow rows must be receded identity rows, not pal-items");
  process.exit(1);
}
if (!overflowSheet.includes("face-overflow-row")) {
  console.error("overflow sheet must use face-overflow-row");
  process.exit(1);
}
if (
  !faceBarSrc.includes("overflowRowSettles") ||
  !/overflowRowSettles\(\s*overflowOpen/.test(faceBarSrc)
) {
  console.error("overflow rows must use overflowRowSettles gated on overflowOpen");
  process.exit(1);
}
if (
  !overflowSheet.includes("${f.id}-settle-${stayTick}") ||
  !/face-overflow-row\$\{.*settle/.test(overflowSheet)
) {
  console.error("overflow rows must remount with settle when that id is in overflowSettleIds");
  process.exit(1);
}
if (overflowSheet.includes("setMenu(null)") || overflowSheet.includes("setMenu(")) {
  console.error("overflow row click must not close N more in the same handler");
  process.exit(1);
}
if (!overflowSheet.includes("holdOverflowForLeave")) {
  console.error("overflow row click must latch holdOverflowForLeave after setActiveFace");
  process.exit(1);
}
if (!faceBarSrc.includes("overflowSheetHoldMs") || !faceBarSrc.includes('via: "click"')) {
  console.error("FaceBar must hold N more with overflowSheetHoldMs via click");
  process.exit(1);
}
if (!faceBarSrc.includes("overflowSheetExits") || !faceBarSrc.includes("setOverflowExit")) {
  console.error("FaceBar must latch overflow sheet exit with overflowSheetExits");
  process.exit(1);
}
if (!faceBarSrc.includes('overflowExit ? " exit"')) {
  console.error("overflow sheet must mark exit on the click-hold");
  process.exit(1);
}
if (
  !morePill.includes("overflowMoreOpen") ||
  !/overflowMoreOpen\(\s*overflowOpen,\s*overflowExit\s*\)/.test(morePill)
) {
  console.error("N more .open must use overflowMoreOpen(overflowOpen, overflowExit)");
  process.exit(1);
}
if (!/overflowExit \? " exit"/.test(morePill)) {
  console.error("N more must latch exit from overflowExit on the click-hold");
  process.exit(1);
}
if (/overflowOpen \? " open"/.test(morePill)) {
  console.error("N more must drop .open during exit — do not keep overflowOpen ? open");
  process.exit(1);
}
if (faceBarSrc.includes('via: "chord"')) {
  console.error("FaceBar must not hold-close N more on the chord path");
  process.exit(1);
}
if (
  faceBarSrc.includes('via: "escape"') ||
  faceBarSrc.includes('via: "away"') ||
  faceBarSrc.includes('via: "toggle"')
) {
  console.error("FaceBar must not hold or exit N more on Escape / click-away / toggle");
  process.exit(1);
}
if (
  !/setTimeout\(\s*\(\)\s*=>\s*\{[\s\S]*?setMenu\(\(m\)\s*=>\s*\(m === "overflow" \? null : m\)\)[\s\S]*?\},\s*hold\)/.test(
    faceBarSrc,
  )
) {
  console.error("FaceBar must close N more after the click-hold, not in the row handler");
  process.exit(1);
}
const stayPulseFx = faceBarSrc.match(/if \(!s\.faceStayPulse\) return;[\s\S]*?\[s\.faceStayPulse\]/);
if (!stayPulseFx || stayPulseFx[0].includes("setMenu")) {
  console.error("faceStayPulse must not close N more — chord keeps the sheet open");
  process.exit(1);
}
if (!faceBarSrc.includes('setMenu(overflowOpen ? null : "overflow")')) {
  console.error("N more toggle must still close immediately");
  process.exit(1);
}
if (
  !faceBarSrc.includes("overflowRowLeaves") ||
  !/overflowRowLeaves\(\s*overflowOpen/.test(faceBarSrc)
) {
  console.error("overflow rows must use overflowRowLeaves gated on overflowOpen");
  process.exit(1);
}
if (!faceBarSrc.includes("leaveIds") || !/arriving \? latch\.leaveIds/.test(faceBarSrc)) {
  console.error("FaceBar must latch the arriving Face as leaveIds on faceStayPulse");
  process.exit(1);
}
if (
  !faceBarSrc.includes("overflowSheetRows") ||
  !/overflowSheetRows\(\s*overflowOpen/.test(faceBarSrc)
) {
  console.error("overflow sheet must render overflowSheetRows instead of raw overflow");
  process.exit(1);
}
if (
  !overflowSheet.includes("${f.id}-leave-${stayTick}") ||
  !/face-overflow-row\$\{.*leave/.test(overflowSheet)
) {
  console.error("overflow rows must remount with leave when that id is in overflowLeaveIds");
  process.exit(1);
}
if (
  !faceBarSrc.includes("overflowRecedeKicker") ||
  !/overflowRecedeKicker\(\s*overflowOpen/.test(faceBarSrc)
) {
  console.error("overflow kicker must use overflowRecedeKicker gated on overflowOpen");
  process.exit(1);
}
if (!faceBarSrc.includes("Also in this window")) {
  console.error("overflow sheet idle kicker must stay Also in this window");
  process.exit(1);
}
if (
  !faceBarSrc.includes("recede-${stayTick}") ||
  !/pane-kicker\$\{.*recede/.test(faceBarSrc)
) {
  console.error("overflow kicker must remount with recede when someone folds in");
  process.exit(1);
}
if (!faceBarSrc.includes("recedeKicker || \"Also in this window\"") && !faceBarSrc.includes("{recedeKicker || \"Also in this window\"}")) {
  console.error("overflow recede copy must fall back to Also in this window");
  process.exit(1);
}
if (!overflowSheet.includes("faceSwitchChordCompact")) {
  console.error("overflow rows must use faceSwitchChordCompact in the kbd");
  process.exit(1);
}
if (!overflowSheet.includes("{compact}") || !overflowSheet.includes("face-chord")) {
  console.error("overflow row kbd must render receded compact chord");
  process.exit(1);
}
if (!/\$\{chord \? `  \$\{chord\}`/.test(overflowSheet)) {
  console.error("overflow row title must keep full faceSwitchChord");
  process.exit(1);
}
if (
  /\$\{compact \? `  \$\{compact\}`/.test(overflowSheet) ||
  /\$\{chord \? `  \$\{compact\}`/.test(overflowSheet)
) {
  console.error("overflow row title must not use compact chords");
  process.exit(1);
}
if (!cssSrc.includes(".face-more") || !cssSrc.includes(".face-overflow")) {
  console.error("index.css must style the N more pill and overflow sheet");
  process.exit(1);
}
if (!cssSrc.includes(".face-overflow-who") || !cssSrc.includes(".face-more.open")) {
  console.error("overflow sheet must use Face-dot language; N more open state must not Face-tint");
  process.exit(1);
}
if (!cssSrc.includes(".face-more-who")) {
  console.error("index.css must compact overflow Face-dots on the N more pill");
  process.exit(1);
}
const moreOpenCss = cssSrc.match(/\.face-more\.open\s*\{[^}]*\}/)?.[0] ?? "";
if (!moreOpenCss || moreOpenCss.includes("--face")) {
  console.error("N more open state must not Face-tint");
  process.exit(1);
}
if (!cssSrc.includes(".face-overflow-row")) {
  console.error("index.css must style receded overflow identity rows");
  process.exit(1);
}
if (!/face-overflow-row[\s\S]{0,400}--face/.test(cssSrc)) {
  console.error("overflow rows must have a quiet Face wash");
  process.exit(1);
}
if (!cssSrc.includes("face-overflow-rise")) {
  console.error("overflow rows must have a short open rise");
  process.exit(1);
}
if (!/prefers-reduced-motion: reduce[\s\S]*\.face-overflow-row/.test(cssSrc)) {
  console.error("prefers-reduced-motion must kill the overflow-row rise");
  process.exit(1);
}
if (!cssSrc.includes(".face-overflow-row.settle")) {
  console.error("index.css must settle the folded overflow-row when the sheet is open");
  process.exit(1);
}
if (!cssSrc.includes("@keyframes face-overflow-settle")) {
  console.error("index.css must define overflow-row settle keyframes");
  process.exit(1);
}
if (!/prefers-reduced-motion: reduce[\s\S]*\.face-overflow-row\.settle/.test(cssSrc)) {
  console.error("prefers-reduced-motion must kill the overflow-row settle");
  process.exit(1);
}
if (!cssSrc.includes(".face-overflow-row.leave")) {
  console.error("index.css must rise-out the leaving overflow-row when the sheet is open");
  process.exit(1);
}
if (!cssSrc.includes("@keyframes face-overflow-leave")) {
  console.error("index.css must define overflow-row leave keyframes");
  process.exit(1);
}
if (!/prefers-reduced-motion: reduce[\s\S]*\.face-overflow-row\.leave/.test(cssSrc)) {
  console.error("prefers-reduced-motion must kill the overflow-row leave");
  process.exit(1);
}
const leaveCss = cssSrc.match(/\.face-overflow-row\.leave\s*\{[^}]*\}/)?.[0] ?? "";
if (!leaveCss || leaveCss.includes("--face") || leaveCss.includes("background")) {
  console.error("overflow-row leave must rise-out, not Face-tint the row or N more");
  process.exit(1);
}
if (!cssSrc.includes(".face-overflow .pane-kicker.recede")) {
  console.error("index.css must remount the overflow kicker with recede");
  process.exit(1);
}
if (!cssSrc.includes("@keyframes face-overflow-kicker-recede")) {
  console.error("index.css must define overflow kicker recede keyframes");
  process.exit(1);
}
if (!/prefers-reduced-motion: reduce[\s\S]*\.face-overflow \.pane-kicker\.recede/.test(cssSrc)) {
  console.error("prefers-reduced-motion must kill the overflow kicker recede motion, not the copy");
  process.exit(1);
}
const kickerRecedeCss = cssSrc.match(/\.face-overflow \.pane-kicker\.recede\s*\{[^}]*\}/)?.[0] ?? "";
if (!kickerRecedeCss || kickerRecedeCss.includes("--face")) {
  console.error("overflow recede kicker must not Face-tint");
  process.exit(1);
}
if (!cssSrc.includes(".face-overflow.exit")) {
  console.error("index.css must recede the overflow sheet with exit");
  process.exit(1);
}
if (!cssSrc.includes("@keyframes face-overflow-exit")) {
  console.error("index.css must define overflow sheet exit keyframes");
  process.exit(1);
}
if (!/prefers-reduced-motion: reduce[\s\S]*\.face-overflow\.exit/.test(cssSrc)) {
  console.error("prefers-reduced-motion must kill the overflow sheet exit");
  process.exit(1);
}
const sheetExitCss = cssSrc.match(/\.face-overflow\.exit\s*\{[^}]*\}/)?.[0] ?? "";
if (!sheetExitCss || sheetExitCss.includes("--face") || sheetExitCss.includes("background")) {
  console.error("overflow sheet exit must fade+rise, not Face-tint");
  process.exit(1);
}
if (!sheetExitCss.includes("0.42s")) {
  console.error("overflow sheet exit must last one stay-pulse (0.42s)");
  process.exit(1);
}
if (!cssSrc.includes(".face-more.exit")) {
  console.error("index.css must recede N more with exit on the click-hold");
  process.exit(1);
}
if (!cssSrc.includes("@keyframes face-more-exit")) {
  console.error("index.css must define N more exit keyframes");
  process.exit(1);
}
if (!/prefers-reduced-motion: reduce[\s\S]*\.face-more\.exit/.test(cssSrc)) {
  console.error("prefers-reduced-motion must kill the N more exit");
  process.exit(1);
}
const moreExitCss = cssSrc.match(/\.face-more\.exit\s*\{[^}]*\}/)?.[0] ?? "";
if (!moreExitCss || moreExitCss.includes("--face") || moreExitCss.includes("var(--face)")) {
  console.error("N more exit must recede the pressed look, not Face-tint the count pill");
  process.exit(1);
}
if (!moreExitCss.includes("0.42s")) {
  console.error("N more exit must last one stay-pulse (0.42s)");
  process.exit(1);
}
const moreExitKeyframes = cssSrc.match(/@keyframes face-more-exit\s*\{[\s\S]*?\n\}/)?.[0] ?? "";
if (!moreExitKeyframes || moreExitKeyframes.includes("--face")) {
  console.error("N more exit keyframes must not Face-tint");
  process.exit(1);
}
if (
  !cssSrc.includes(".face-more.exit .face-more-who .face-dot") ||
  !cssSrc.includes("@keyframes face-more-exit-dot")
) {
  console.error("N more exit must recede the overflow-dot ring with the pressed look");
  process.exit(1);
}
const moreExitDotCss = cssSrc.match(/\.face-more\.exit \.face-more-who \.face-dot\s*\{[^}]*\}/)?.[0] ?? "";
if (!moreExitDotCss || moreExitDotCss.includes("--face")) {
  console.error("N more exit dots must recede the ring, not Face-tint");
  process.exit(1);
}
if (!moreExitDotCss.includes("0.42s")) {
  console.error("N more exit dots must last one stay-pulse (0.42s)");
  process.exit(1);
}
if (!cssSrc.includes(".face-pill.on.stay.arrive")) {
  console.error("index.css must rise the overflow-pinned FaceBar pill");
  process.exit(1);
}
if (!cssSrc.includes("@keyframes face-arrive-pill")) {
  console.error("index.css must define FaceBar arrive keyframes");
  process.exit(1);
}
if (!/prefers-reduced-motion: reduce[\s\S]*\.face-pill\.on\.stay\.arrive/.test(cssSrc)) {
  console.error("prefers-reduced-motion must kill the overflow arrive rise");
  process.exit(1);
}
if (!cssSrc.includes(".face-more-who .face-dot.settle")) {
  console.error("index.css must settle the folded Face-dot on N more, not wash the count pill");
  process.exit(1);
}
if (!cssSrc.includes("@keyframes face-settle-dot")) {
  console.error("index.css must define Face-dot settle keyframes");
  process.exit(1);
}
if (!/prefers-reduced-motion: reduce[\s\S]*\.face-more-who \.face-dot\.settle/.test(cssSrc)) {
  console.error("prefers-reduced-motion must kill the overflow settle");
  process.exit(1);
}
const moreCss = cssSrc.match(/\.face-more\s*\{[^}]*\}/)?.[0] ?? "";
const moreSettleCss = cssSrc.match(/\.face-more\.settle\s*\{[^}]*\}/)?.[0] ?? "";
if (moreCss.includes("--face") || moreSettleCss.includes("--face") || moreSettleCss.includes("background")) {
  console.error("N more / N more settle must not Face-tint the count pill");
  process.exit(1);
}
const pillMap = faceBarSrc.match(/shown\.map\(\(f\) => \{[\s\S]*?<\/button>/)?.[0] ?? "";
if (pillMap.includes("settle")) {
  console.error("shown Face pills must stay stay/arrive, not settle");
  process.exit(1);
}
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
if (!/\$\{chord \? `  \$\{chord\}`/.test(pillMap)) {
  console.error("pill title must keep full faceSwitchChord");
  process.exit(1);
}
if (
  /\$\{compact \? `  \$\{compact\}`/.test(pillMap) ||
  /\$\{chord \? `  \$\{compact\}`/.test(pillMap)
) {
  console.error("pill title must not use compact chords");
  process.exit(1);
}
if (!/on \? chord : compact/.test(pillMap)) {
  console.error("receded in-pill kbd must use compact; lit kbd must stay full chord");
  process.exit(1);
}
if (!/face-chord hide-narrow\$\{on \? "" : " compact"\}/.test(pillMap)) {
  console.error("receded face-chord must add compact; lit pill must not");
  process.exit(1);
}
if (!pillMap.includes("arrive") || !/on && staying && arriving \? " arrive"/.test(pillMap)) {
  console.error("lit FaceBar pill must take arrive when pinning from overflow");
  process.exit(1);
}
if (!pillMap.includes("-stay-${stayTick}")) {
  console.error("FaceBar must remount the lit pill on faceStayPulse");
  process.exit(1);
}
if (pillMap.includes("settle")) {
  console.error("already-shown / lit FaceBar pills stay stay-only — settle belongs on N more dots");
  process.exit(1);
}
if (!pillMap.includes("s.setActiveFace(f.id)")) {
  console.error("shown FaceBar pill click must still setActiveFace");
  process.exit(1);
}
if (/onMouseEnter/.test(pillMap) || /onFocus/.test(pillMap)) {
  console.error("FaceBar pill hover/focus must not setActiveFace");
  process.exit(1);
}
const genericPillFocusCss =
  cssSrc.match(/\.face-pill:focus-visible\s*\{[\s\S]*?\}/)?.[0] ?? "";
if (genericPillFocusCss) {
  console.error("generic .face-pill:focus-visible would tint N more; use :not(.face-more):", genericPillFocusCss);
  process.exit(1);
}
const litPillFocusCss =
  cssSrc.match(/\.face-pill\.on:focus-visible\s*\{[\s\S]*?\}/)?.[0] ?? "";
if (!litPillFocusCss) {
  console.error("lit FaceBar pill must have a :focus-visible keyboard ring");
  process.exit(1);
}
if (!litPillFocusCss.includes("var(--face")) {
  console.error("focus-visible lit FaceBar pill ring must tint with --face:", litPillFocusCss);
  process.exit(1);
}
const litPillOutline = litPillFocusCss.match(/outline:\s*([^;]+)/)?.[1]?.trim() ?? "";
if (!litPillOutline || /^(none|0(\s|$))/.test(litPillOutline)) {
  console.error("focus-visible lit FaceBar pill must have a non-none outline:", litPillFocusCss);
  process.exit(1);
}
if (!/outline-offset:/.test(litPillFocusCss)) {
  console.error("focus-visible lit FaceBar pill outline must have an offset:", litPillFocusCss);
  process.exit(1);
}
const recedePillFocusCss =
  cssSrc.match(
    /\.face-pill:not\(\.on\):not\(\.face-more\):focus-visible\s*\{[\s\S]*?\}/,
  )?.[0] ?? "";
if (!recedePillFocusCss) {
  console.error("receded FaceBar pill must have a :focus-visible keyboard ring excluding N more");
  process.exit(1);
}
if (!recedePillFocusCss.includes("var(--face")) {
  console.error("focus-visible receded FaceBar pill ring must tint with --face:", recedePillFocusCss);
  process.exit(1);
}
const recedePillOutline = recedePillFocusCss.match(/outline:\s*([^;]+)/)?.[1]?.trim() ?? "";
if (!recedePillOutline || /^(none|0(\s|$))/.test(recedePillOutline)) {
  console.error("focus-visible receded FaceBar pill must have a non-none outline:", recedePillFocusCss);
  process.exit(1);
}
if (!/outline-offset:/.test(recedePillFocusCss)) {
  console.error("focus-visible receded FaceBar pill outline must have an offset:", recedePillFocusCss);
  process.exit(1);
}
const pillHoverCss = cssSrc.match(/\.face-pill:hover\s*\{[\s\S]*?\}/)?.[0] ?? "";
if (!pillHoverCss) {
  console.error("FaceBar pill hover wash must remain");
  process.exit(1);
}
if (/outline:/.test(pillHoverCss) || /box-shadow:/.test(pillHoverCss)) {
  console.error("FaceBar pill hover must stay a wash without a ring:", pillHoverCss);
  process.exit(1);
}
if (
  /prefers-reduced-motion: reduce[\s\S]*\.face-pill\.on:focus-visible[\s\S]{0,120}outline:\s*none/.test(
    cssSrc,
  )
) {
  console.error("reduced-motion must not kill the lit FaceBar pill focus ring");
  process.exit(1);
}
if (
  /prefers-reduced-motion: reduce[\s\S]*\.face-pill:not\(\.on\):not\(\.face-more\):focus-visible[\s\S]{0,120}outline:\s*none/.test(
    cssSrc,
  )
) {
  console.error("reduced-motion must not kill the receded FaceBar pill focus ring");
  process.exit(1);
}
const overflowRowFocusCss =
  cssSrc.match(/\.face-overflow-row:focus-visible\s*\{[\s\S]*?\}/)?.[0] ?? "";
if (!overflowRowFocusCss) {
  console.error("overflow-sheet identity row must have a :focus-visible keyboard ring");
  process.exit(1);
}
if (!overflowRowFocusCss.includes("var(--face")) {
  console.error("focus-visible overflow-row ring must tint with --face:", overflowRowFocusCss);
  process.exit(1);
}
const overflowRowOutline = overflowRowFocusCss.match(/outline:\s*([^;]+)/)?.[1]?.trim() ?? "";
if (!overflowRowOutline || /^(none|0(\s|$))/.test(overflowRowOutline)) {
  console.error("focus-visible overflow-row must have a non-none outline:", overflowRowFocusCss);
  process.exit(1);
}
if (!/outline-offset:/.test(overflowRowFocusCss)) {
  console.error("focus-visible overflow-row outline must have an offset:", overflowRowFocusCss);
  process.exit(1);
}
const overflowRowHoverCss =
  cssSrc.match(/\.face-overflow-row:hover\s*\{[\s\S]*?\}/)?.[0] ?? "";
if (!overflowRowHoverCss) {
  console.error("overflow-row hover wash must remain");
  process.exit(1);
}
if (/outline:/.test(overflowRowHoverCss) || /box-shadow:/.test(overflowRowHoverCss)) {
  console.error("overflow-row hover must stay a wash without a ring:", overflowRowHoverCss);
  process.exit(1);
}
if (
  /prefers-reduced-motion: reduce[\s\S]*\.face-overflow-row:focus-visible[\s\S]{0,120}outline:\s*none/.test(
    cssSrc,
  )
) {
  console.error("reduced-motion must not kill the overflow-row focus ring");
  process.exit(1);
}
if (
  /\.face-more:focus-visible/.test(cssSrc) ||
  /\.face-pill\.face-more[^{]*:focus-visible/.test(cssSrc)
) {
  console.error("N more must stay Face-neutral — no Face-tinted :focus-visible ring");
  process.exit(1);
}
if (!cssSrc.includes(".face-chord") || !cssSrc.includes(".face-pill.on .face-chord")) {
  console.error("index.css must style in-pill face-chord (quiet receded, Face-tinted on)");
  process.exit(1);
}
if (!cssSrc.includes(".face-chord.compact")) {
  console.error("index.css must style receded .face-chord.compact");
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
  !/e\.shiftKey && e\.code\.startsWith\("Digit"\)[\s\S]{0,320}faceIndexFromDigitCode\(e\.code\)[\s\S]{0,320}setActiveFace/.test(chromeSrc)
) {
  console.error("Chrome Digit Face-switch must call setActiveFace (same pulse path as a click)");
  process.exit(1);
}
if (
  /e\.code\s*(===|==|!==|!=)\s*["']Digit0["']/.test(chromeSrc) ||
  /["']Digit0["']\s*(===|==|!==|!=)\s*e\.code/.test(chromeSrc)
) {
  console.error("Chrome Digit Face-switch must not special-case skip Digit0");
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
if (!/face\??\.homeUrl/.test(constellationSrc)) {
  console.error("Constellation empty home must branch on face.homeUrl");
  process.exit(1);
}
if (
  !facesSrc.includes("export function tabIsFaceInbox") ||
  !facesSrc.includes("export function resolveFaceHome")
) {
  console.error("faces.ts must export tabIsFaceInbox and resolveFaceHome");
  process.exit(1);
}
if (
  !constellationSrc.includes("openFaceHome") ||
  !constellationSrc.includes("Open inbox") ||
  !constellationSrc.includes("Back to inbox") ||
  !constellationSrc.includes("tabIsFaceInbox") ||
  !constellationSrc.includes("outlook-hero-btn rest")
) {
  console.error("inbox Faces must lead Constellation with Open inbox / Back to inbox / openFaceHome");
  process.exit(1);
}
const openFaceHomeBody = storeSrc.match(/openFaceHome:\s*\(id\)\s*=>\s*\{([\s\S]*?)\n  \},/)?.[1];
if (
  !openFaceHomeBody ||
  !openFaceHomeBody.includes("resolveFaceHome") ||
  !openFaceHomeBody.includes('"activate"') ||
  !openFaceHomeBody.includes('"reuse"') ||
  !openFaceHomeBody.includes('"newTab"') ||
  !openFaceHomeBody.includes("newHome")
) {
  console.error("openFaceHome must follow resolveFaceHome activate / reuse / newTab / newHome");
  process.exit(1);
}
if (/if \(face\.homeUrl\) get\(\)\.navigate\(face\.homeUrl, false, id\)/.test(openFaceHomeBody)) {
  console.error("openFaceHome must not always navigate(homeUrl, false)");
  process.exit(1);
}
if (!openFaceHomeBody.includes('"new"')) {
  console.error("openFaceHome newTab must navigate with inPlace \"new\" so a live page is not clobbered");
  process.exit(1);
}
if (!storeSrc.includes('inPlace !== "new"') && !storeSrc.includes("inPlace === \"new\"")) {
  console.error("navigate must treat inPlace \"new\" as mint-a-tab");
  process.exit(1);
}
if (
  !constellationSrc.includes('addOutlook("outlook-work")') ||
  !constellationSrc.includes('addOutlook("outlook-personal")') ||
  !constellationSrc.includes("Add Outlook") ||
  !constellationSrc.includes("Add another inbox")
) {
  console.error("Faces without an inbox must keep two-up Add Outlook / addOutlook");
  process.exit(1);
}
if (
  !constellationSrc.includes("outlook-hero-btn recede") ||
  !constellationSrc.includes("has-inbox")
) {
  console.error("inbox rest must recede Add Outlook as a second card");
  process.exit(1);
}
const recedeBtn =
  constellationSrc.match(/className="outlook-hero-btn recede"[\s\S]*?<\/button>/)?.[0] ?? "";
if (!recedeBtn.includes("setOutlookPickerOpen")) {
  console.error("receded Add Outlook must open the FaceBar Outlook picker");
  process.exit(1);
}
if (recedeBtn.includes("addOutlook")) {
  console.error("receded Add Outlook must not call addOutlook with a guessed kind");
  process.exit(1);
}
if (
  recedeBtn.includes("Personal Microsoft") ||
  recedeBtn.includes("Work or school") ||
  recedeBtn.includes("outlook.live.com") ||
  recedeBtn.includes("outlook.office.com")
) {
  console.error("receded Add Outlook must not name the guessed other inbox");
  process.exit(1);
}
if (!storeSrc.includes("outlookPickerOpen") || !storeSrc.includes("setOutlookPickerOpen")) {
  console.error("store must have outlookPickerOpen / setOutlookPickerOpen");
  process.exit(1);
}
const addOutlookBody = storeSrc.match(/addOutlook:\s*\(kind\)\s*=>\s*\{([\s\S]*?)\n  \},/)?.[1];
if (!addOutlookBody || !addOutlookBody.includes("outlookPickerOpen: false")) {
  console.error("addOutlook must close outlookPickerOpen");
  process.exit(1);
}
if (!faceBarSrc.includes('menu === "outlook" || s.outlookPickerOpen')) {
  console.error("FaceBar must show the Outlook sheet when outlookPickerOpen");
  process.exit(1);
}
if (!cssSrc.includes(".outlook-add.on")) {
  console.error("index.css must light .outlook-add.on when the picker is open");
  process.exit(1);
}
if (!faceBarSrc.includes("+ Outlook")) {
  console.error("FaceBar must keep + Outlook");
  process.exit(1);
}
const restCss = cssSrc.match(/\.outlook-hero-btn\.rest\s*\{[\s\S]*?\}/)?.[0] ?? "";
if (!restCss.includes("--face")) {
  console.error("Open inbox rest card must Face-tint with --face");
  process.exit(1);
}
const restFocusCss =
  cssSrc.match(/\.outlook-hero-btn\.rest:focus-visible\s*\{[\s\S]*?\}/)?.[0] ?? "";
if (!restFocusCss) {
  console.error("inbox rest card must have a :focus-visible keyboard ring");
  process.exit(1);
}
if (!restFocusCss.includes("var(--face")) {
  console.error("focus-visible rest card ring must tint with --face:", restFocusCss);
  process.exit(1);
}
const restFocusOutline = restFocusCss.match(/outline:\s*([^;]+)/)?.[1]?.trim() ?? "";
if (!restFocusOutline || /^(none|0(\s|$))/.test(restFocusOutline)) {
  console.error("focus-visible rest card must have a non-none outline:", restFocusCss);
  process.exit(1);
}
if (!/outline-offset:/.test(restFocusCss)) {
  console.error("focus-visible rest card outline must have an offset:", restFocusCss);
  process.exit(1);
}
const restHoverCss = cssSrc.match(/\.outlook-hero-btn\.rest:hover\s*\{[\s\S]*?\}/)?.[0] ?? "";
if (!restHoverCss) {
  console.error("inbox rest card hover wash must remain");
  process.exit(1);
}
if (/outline:/.test(restHoverCss) || /box-shadow:/.test(restHoverCss)) {
  console.error("inbox rest card hover must stay a wash without a ring:", restHoverCss);
  process.exit(1);
}
const genericHeroFocusCss =
  cssSrc.match(/\.outlook-hero-btn:focus-visible\s*\{[\s\S]*?\}/)?.[0] ?? "";
if (genericHeroFocusCss) {
  console.error(
    "generic .outlook-hero-btn:focus-visible would tint receded Add Outlook and the no-inbox two-up:",
    genericHeroFocusCss,
  );
  process.exit(1);
}
if ((constellationSrc.match(/className="outlook-hero-btn recruit"/g) || []).length !== 2) {
  console.error("no-inbox two-up Add Outlook / Add another inbox must use recruit class");
  process.exit(1);
}
const twoUpHero =
  constellationSrc.match(/className="outlook-hero">[\s\S]*?<\/div>/)?.[0] ?? "";
if (
  !twoUpHero.includes("outlook-hero-btn recruit") ||
  !twoUpHero.includes('addOutlook("outlook-work")') ||
  !twoUpHero.includes('addOutlook("outlook-personal")')
) {
  console.error("no-inbox two-up must stay one-click addOutlook with recruit class");
  process.exit(1);
}
const recedeHeroFocusCss =
  cssSrc.match(/\.outlook-hero-btn\.recede:focus-visible\s*\{[\s\S]*?\}/)?.[0] ?? "";
if (!recedeHeroFocusCss) {
  console.error("receded Add Outlook must have a :focus-visible keyboard ring");
  process.exit(1);
}
if (recedeHeroFocusCss.includes("var(--face") || recedeHeroFocusCss.includes("--face")) {
  console.error("receded Add Outlook must not take a Face-tinted :focus-visible ring:", recedeHeroFocusCss);
  process.exit(1);
}
if (!recedeHeroFocusCss.includes("--scout")) {
  console.error("receded Add Outlook :focus-visible ring must be Helix --scout chrome:", recedeHeroFocusCss);
  process.exit(1);
}
const recedeFocusOutline = recedeHeroFocusCss.match(/outline:\s*([^;]+)/)?.[1]?.trim() ?? "";
if (!recedeFocusOutline || /^(none|0(\s|$))/.test(recedeFocusOutline)) {
  console.error("focus-visible receded Add Outlook must have a non-none outline:", recedeHeroFocusCss);
  process.exit(1);
}
if (!/outline-offset:/.test(recedeHeroFocusCss)) {
  console.error("focus-visible receded Add Outlook outline must have an offset:", recedeHeroFocusCss);
  process.exit(1);
}
const recruitHeroFocusCss =
  cssSrc.match(/\.outlook-hero-btn\.recruit:focus-visible\s*\{[\s\S]*?\}/)?.[0] ?? "";
if (!recruitHeroFocusCss) {
  console.error("no-inbox two-up must have a :focus-visible keyboard ring");
  process.exit(1);
}
if (recruitHeroFocusCss.includes("var(--face") || recruitHeroFocusCss.includes("--face")) {
  console.error("no-inbox two-up must not take a Face-tinted :focus-visible ring:", recruitHeroFocusCss);
  process.exit(1);
}
if (!recruitHeroFocusCss.includes("--scout")) {
  console.error("no-inbox two-up :focus-visible ring must be Helix --scout chrome:", recruitHeroFocusCss);
  process.exit(1);
}
const recruitFocusOutline = recruitHeroFocusCss.match(/outline:\s*([^;]+)/)?.[1]?.trim() ?? "";
if (!recruitFocusOutline || /^(none|0(\s|$))/.test(recruitFocusOutline)) {
  console.error("focus-visible two-up must have a non-none outline:", recruitHeroFocusCss);
  process.exit(1);
}
if (!/outline-offset:/.test(recruitHeroFocusCss)) {
  console.error("focus-visible two-up outline must have an offset:", recruitHeroFocusCss);
  process.exit(1);
}
const recedeHeroHoverCss =
  cssSrc.match(/\.outlook-hero-btn\.recede:hover\s*\{[\s\S]*?\}/)?.[0] ?? "";
if (!recedeHeroHoverCss) {
  console.error("receded Add Outlook hover wash must remain");
  process.exit(1);
}
if (/outline:/.test(recedeHeroHoverCss) || /box-shadow:/.test(recedeHeroHoverCss)) {
  console.error("receded Add Outlook hover must stay a wash without a ring:", recedeHeroHoverCss);
  process.exit(1);
}
const recruitHoverCss =
  cssSrc.match(/\.outlook-hero-btn\.recruit:hover\s*\{[\s\S]*?\}/)?.[0] ?? "";
if (recruitHoverCss && (/outline:/.test(recruitHoverCss) || /box-shadow:/.test(recruitHoverCss))) {
  console.error("no-inbox two-up hover must stay a wash without a ring:", recruitHoverCss);
  process.exit(1);
}
const heroHoverCss = cssSrc.match(/\.outlook-hero-btn:hover\s*\{[\s\S]*?\}/)?.[0] ?? "";
if (!heroHoverCss) {
  console.error("outlook hero hover wash must remain");
  process.exit(1);
}
if (/outline:/.test(heroHoverCss) || /box-shadow:/.test(heroHoverCss)) {
  console.error("outlook hero hover must stay a wash without a ring:", heroHoverCss);
  process.exit(1);
}
if (
  /prefers-reduced-motion: reduce[\s\S]*\.outlook-hero-btn\.rest:focus-visible[\s\S]{0,120}outline:\s*none/.test(
    cssSrc,
  )
) {
  console.error("reduced-motion must not kill the inbox rest card focus ring");
  process.exit(1);
}
if (
  /prefers-reduced-motion: reduce[\s\S]*\.outlook-hero-btn\.recede:focus-visible[\s\S]{0,120}outline:\s*none/.test(
    cssSrc,
  )
) {
  console.error("reduced-motion must not kill the receded Add Outlook focus ring");
  process.exit(1);
}
if (
  /prefers-reduced-motion: reduce[\s\S]*\.outlook-hero-btn\.recruit:focus-visible[\s\S]{0,120}outline:\s*none/.test(
    cssSrc,
  )
) {
  console.error("reduced-motion must not kill the no-inbox two-up focus ring");
  process.exit(1);
}
if (!cssSrc.includes(".outlook-hero-btn.recede")) {
  console.error("Add Outlook on an inbox Face must recede in CSS");
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
import { resolveFaceClick, resolveFaceClose, clusterTabsByFace, clusterTabLayout, overflowFaces, overflowMoreTitle, faceArrivesFromOverflow, facesDepartToOverflow, overflowRowSettles, overflowRowLeaves, overflowSheetHoldMs, overflowSheetExits, overflowMoreOpen, FACE_STAY_PULSE_MS, overflowSheetRows, overflowRecedeKicker, FACE_BAR_VISIBLE, faceSwitchChord, faceSwitchChordCompact, faceIndexFromDigitCode, FACE_ROLES, normalizeFaceName, partitionFor, homeThreadTitle, tabIsFaceInbox, resolveFaceHome, OUTLOOK_WORK } from "./src/lib/faces.ts";
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

const lastOfFace = resolveFaceClose({
  closedId: "work-mail",
  activeId: "work-mail",
  activeFaceId: "work",
  tabs: [
    { id: "work-mail", faceId: "work" },
    { id: "personal-mail", faceId: "personal" },
  ],
});
if (lastOfFace.kind !== "mintHome" || lastOfFace.faceId !== "work") {
  console.error("last tab of the Face you are must mint home, not a neighbor Face:", lastOfFace);
  failed++;
}
const leftoverClose = resolveFaceClose({
  closedId: "work-new",
  activeId: "work-new",
  activeFaceId: "work",
  tabs: faceTabs,
});
if (leftoverClose.kind !== "activate" || leftoverClose.tabId !== "work-old") {
  console.error("leftover same-Face tab must win over a neighbor Face:", leftoverClose);
  failed++;
}
const leftoverEarlier = resolveFaceClose({
  closedId: "work-old",
  activeId: "work-old",
  activeFaceId: "work",
  tabs: faceTabs,
});
if (leftoverEarlier.kind !== "activate" || leftoverEarlier.tabId !== "work-new") {
  console.error("closing an earlier same-Face tab must land on the later same-Face tab:", leftoverEarlier);
  failed++;
}
const backgroundClose = resolveFaceClose({
  closedId: "personal-a",
  activeId: "work-new",
  activeFaceId: "work",
  tabs: faceTabs,
});
if (backgroundClose.kind !== "idle" || backgroundClose.activeId !== "work-new") {
  console.error("background close must stay put on the Face you are:", backgroundClose);
  failed++;
}
const windowLast = resolveFaceClose({
  closedId: "work-mail",
  activeId: "work-mail",
  activeFaceId: "work",
  tabs: [{ id: "work-mail", faceId: "work" }],
});
if (windowLast.kind !== "mintHome" || windowLast.faceId !== "work") {
  console.error("window last-tab must mint home for the Face you are:", windowLast);
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
if (clusterTabLayout({ labeled: false, current: false }) !== "full") {
  console.error("solo cluster must stay full:", clusterTabLayout({ labeled: false, current: false }));
  failed++;
}
if (clusterTabLayout({ labeled: false, current: true }) !== "full") {
  console.error("solo current cluster must stay full");
  failed++;
}
if (clusterTabLayout({ labeled: true, current: true }) !== "full") {
  console.error("labeled current cluster must stay full titled tabs");
  failed++;
}
if (clusterTabLayout({ labeled: true, current: false }) !== "fold") {
  console.error("labeled receded cluster must fold to icon peeks");
  failed++;
}

if (FACE_BAR_VISIBLE !== 4) {
  console.error("FACE_BAR_VISIBLE must be 4:", FACE_BAR_VISIBLE);
  failed++;
}
function people(...ids) {
  return ids.map((id) => ({ id }));
}
function overflowIds(faces, active, cap) {
  const r = overflowFaces(faces, active, cap);
  return { shown: r.shown.map((f) => f.id), overflow: r.overflow.map((f) => f.id) };
}
const three = overflowIds(people("a", "b", "c"), "a");
if (three.shown.join() !== "a,b,c" || three.overflow.length !== 0) {
  console.error("3 Faces must not overflow:", three);
  failed++;
}
const five = people("0", "1", "2", "3", "4");
const firstFour = overflowIds(five, "0");
if (firstFour.shown.join() !== "0,1,2,3" || firstFour.overflow.join() !== "4") {
  console.error("5 Faces with active in the first four overflow the last:", firstFour);
  failed++;
}
const lastPinned = overflowIds(five, "4");
if (lastPinned.shown.join() !== "0,1,2,4" || lastPinned.overflow.join() !== "3") {
  console.error("5 Faces with last active must pin them: shown [0,1,2,4] overflow [3]:", lastPinned);
  failed++;
}
for (const id of ["0", "1", "2", "3", "4"]) {
  const r = overflowIds(five, id);
  if (r.overflow.includes(id) || !r.shown.includes(id)) {
    console.error("active id must never be in overflow:", id, r);
    failed++;
  }
}
const emptyOverflow = overflowIds([], "x");
if (emptyOverflow.shown.length || emptyOverflow.overflow.length) {
  console.error("empty Faces must not overflow:", emptyOverflow);
  failed++;
}
const exactCap = overflowIds(people("0", "1", "2", "3"), "3");
if (exactCap.overflow.length) {
  console.error("exactly cap Faces must not overflow:", exactCap);
  failed++;
}
const sixMid = overflowIds(people("0", "1", "2", "3", "4", "5"), "4");
if (sixMid.shown.join() !== "0,1,2,4" || sixMid.overflow.join() !== "3,5") {
  console.error("overflow must keep original order:", sixMid);
  failed++;
}
const missing = overflowIds(five, "missing");
if (missing.shown.join() !== "0,1,2,3" || missing.overflow.join() !== "4") {
  console.error("unknown active must show the first cap:", missing);
  failed++;
}
if (overflowMoreTitle([]) !== "") {
  console.error("empty overflow title must be empty:", overflowMoreTitle([]));
  failed++;
}
if (overflowMoreTitle([{ name: "Home" }]) !== "Home — also in this window") {
  console.error("one overflow Face title must name them:", overflowMoreTitle([{ name: "Home" }]));
  failed++;
}
const severalTitle = overflowMoreTitle([{ name: "Home" }, { name: "Work Outlook" }]);
if (severalTitle !== "Home, Work Outlook — also in this window") {
  console.error("several overflow Faces must be comma-joined names:", severalTitle);
  failed++;
}
if (overflowMoreTitle([{ name: "  " }, { name: "  Home  " }]) !== "Home — also in this window") {
  console.error("overflow title must skip blank names:", overflowMoreTitle([{ name: "  " }, { name: "  Home  " }]));
  failed++;
}

const fiveArrive = people("0", "1", "2", "3", "4");
if (!faceArrivesFromOverflow(fiveArrive, "0", "4")) {
  console.error("5 Faces, active first, become last must arrive from overflow");
  failed++;
}
for (const id of ["0", "1", "2", "3"]) {
  if (faceArrivesFromOverflow(fiveArrive, "0", id)) {
    console.error("switch among the first four must not arrive:", id);
    failed++;
  }
}
const fourArrive = people("0", "1", "2", "3");
if (
  faceArrivesFromOverflow(fourArrive, "0", "3") ||
  faceArrivesFromOverflow(fourArrive, "1", "2") ||
  faceArrivesFromOverflow(fourArrive, "0", "0")
) {
  console.error("4 Faces (no overflow) must not arrive");
  failed++;
}
if (
  faceArrivesFromOverflow(fiveArrive, "4", "4") ||
  faceArrivesFromOverflow(fiveArrive, "0", "0") ||
  faceArrivesFromOverflow(fiveArrive, "3", "3")
) {
  console.error("same id must not arrive from overflow");
  failed++;
}
const sixArrive = people("0", "1", "2", "3", "4", "5");
if (!faceArrivesFromOverflow(sixArrive, "0", "4")) {
  console.error("6 Faces, become an overflowed mid id must arrive");
  failed++;
}
if (faceArrivesFromOverflow(sixArrive, "0", "2") || faceArrivesFromOverflow(sixArrive, "0", "3")) {
  console.error("6 Faces, switch among the shown four must not arrive");
  failed++;
}

function departIds(faces, prev, next, cap) {
  return facesDepartToOverflow(faces, prev, next, cap).map((f) => f.id);
}
if (departIds(fiveArrive, "0", "4").join() !== "3") {
  console.error("5 Faces, become the overflowed fifth must depart the bumped fourth:", departIds(fiveArrive, "0", "4"));
  failed++;
}
for (const id of ["0", "1", "2", "3"]) {
  if (departIds(fiveArrive, "0", id).length) {
    console.error("switch among the first four must not depart:", id);
    failed++;
  }
}
if (departIds(fourArrive, "0", "3").length || departIds(fourArrive, "1", "2").length) {
  console.error("4 Faces (no overflow) must not depart");
  failed++;
}
if (
  departIds(fiveArrive, "4", "4").length ||
  departIds(fiveArrive, "0", "0").length ||
  departIds(fourArrive, "0", "0").length
) {
  console.error("same id must not depart to overflow");
  failed++;
}
if (departIds(sixArrive, "4", "5").join() !== "4") {
  console.error("6 Faces, overflowed-to-overflowed must depart the previous active:", departIds(sixArrive, "4", "5"));
  failed++;
}
if (departIds(sixArrive, "0", "4").join() !== "3") {
  console.error("6 Faces, become an overflowed mid id must depart the bumped fourth:", departIds(sixArrive, "0", "4"));
  failed++;
}
if (departIds(sixArrive, "0", "2").length || departIds(sixArrive, "0", "3").length) {
  console.error("6 Faces, switch among the shown four must not depart");
  failed++;
}

if (overflowRowSettles(false, departIds(fiveArrive, "0", "4")).length) {
  console.error("closed sheet must not settle overflow rows even when someone departed");
  failed++;
}
if (overflowRowSettles(true, departIds(fiveArrive, "0", "4")).join() !== "3") {
  console.error(
    "open sheet must settle only the departed overflow row:",
    overflowRowSettles(true, departIds(fiveArrive, "0", "4")),
  );
  failed++;
}
const openSixRows = overflowRowSettles(true, departIds(sixArrive, "0", "4"));
if (openSixRows.join() !== "3" || openSixRows.includes("5") || openSixRows.includes("4")) {
  console.error("open sheet must not settle already-overflowed ids:", openSixRows);
  failed++;
}
if (overflowRowSettles(false, ["3", "5"]).join() !== "") {
  console.error("closed sheet must ignore settleIds, including non-departed overflow ids");
  failed++;
}
if (
  overflowRowSettles(true, departIds(fiveArrive, "0", "2")).length ||
  overflowRowSettles(true, departIds(sixArrive, "0", "3")).length
) {
  console.error("already-shown switch must not settle overflow rows");
  failed++;
}
if (
  overflowRowSettles(true, departIds(fiveArrive, "0", "0")).length ||
  overflowRowSettles(true, departIds(fiveArrive, "4", "4")).length ||
  overflowRowSettles(true, departIds(fourArrive, "0", "0")).length
) {
  console.error("same id must not settle overflow rows");
  failed++;
}
if (overflowRowSettles(true, []).length) {
  console.error("open sheet with nobody departed must not settle rows");
  failed++;
}

if (overflowRowLeaves(false, ["4"]).length) {
  console.error("closed sheet must not leave overflow rows even when Extra pinned");
  failed++;
}
if (overflowRowLeaves(true, ["4"]).join() !== "4") {
  console.error(
    "open sheet + Extra pin must leave Extra:",
    overflowRowLeaves(true, ["4"]),
  );
  failed++;
}
if (overflowRowLeaves(false, ["4"]).join() !== "") {
  console.error("closed sheet must ignore leaveIds, including Extra");
  failed++;
}
if (
  overflowRowLeaves(true, faceArrivesFromOverflow(fiveArrive, "0", "2") ? ["2"] : []).length ||
  overflowRowLeaves(true, faceArrivesFromOverflow(sixArrive, "0", "3") ? ["3"] : []).length
) {
  console.error("already-shown switch must not leave overflow rows");
  failed++;
}
if (
  overflowRowLeaves(true, faceArrivesFromOverflow(fiveArrive, "0", "0") ? ["0"] : []).length ||
  overflowRowLeaves(true, faceArrivesFromOverflow(fiveArrive, "4", "4") ? ["4"] : []).length ||
  overflowRowLeaves(true, faceArrivesFromOverflow(fourArrive, "0", "0") ? ["0"] : []).length
) {
  console.error("same id must not leave overflow rows");
  failed++;
}
if (overflowRowLeaves(true, []).length) {
  console.error("open sheet with nobody pinned must not leave rows");
  failed++;
}

if (FACE_STAY_PULSE_MS !== 420) {
  console.error("FACE_STAY_PULSE_MS must be 420 (stay-pulse / overflow click-hold)");
  failed++;
}
if (overflowSheetHoldMs({ sheetOpen: true, via: "click", arrives: true }) !== FACE_STAY_PULSE_MS) {
  console.error(
    "overflow-row click-hold must be one stay-pulse:",
    overflowSheetHoldMs({ sheetOpen: true, via: "click", arrives: true }),
  );
  failed++;
}
if (overflowSheetHoldMs({ sheetOpen: true, via: "chord", arrives: true }) !== 0) {
  console.error("chord must not hold-close N more");
  failed++;
}
if (overflowSheetHoldMs({ sheetOpen: true, via: "escape", arrives: true }) !== 0) {
  console.error("Escape must not hold N more");
  failed++;
}
if (overflowSheetHoldMs({ sheetOpen: true, via: "away", arrives: true }) !== 0) {
  console.error("click-away must not hold N more");
  failed++;
}
if (overflowSheetHoldMs({ sheetOpen: true, via: "toggle", arrives: true }) !== 0) {
  console.error("N more toggle must not hold");
  failed++;
}
if (overflowSheetHoldMs({ sheetOpen: false, via: "click", arrives: true }) !== 0) {
  console.error("closed sheet click-hold must be 0");
  failed++;
}
if (overflowSheetHoldMs({ sheetOpen: true, via: "click", arrives: false }) !== 0) {
  console.error("already-shown switch must not hold N more");
  failed++;
}
if (overflowSheetHoldMs({ sheetOpen: true, via: "click", arrives: true, sameId: true }) !== 0) {
  console.error("same-id must not hold N more");
  failed++;
}
if (overflowSheetExits({ sheetOpen: true, via: "click", arrives: true }) !== true) {
  console.error("overflow-row click must exit N more on the stay-pulse");
  failed++;
}
if (overflowSheetExits({ sheetOpen: true, via: "chord", arrives: true })) {
  console.error("chord must not exit N more");
  failed++;
}
if (overflowSheetExits({ sheetOpen: true, via: "escape", arrives: true })) {
  console.error("Escape must not exit N more");
  failed++;
}
if (overflowSheetExits({ sheetOpen: true, via: "away", arrives: true })) {
  console.error("click-away must not exit N more");
  failed++;
}
if (overflowSheetExits({ sheetOpen: true, via: "toggle", arrives: true })) {
  console.error("N more toggle must not exit");
  failed++;
}
if (overflowSheetExits({ sheetOpen: false, via: "click", arrives: true })) {
  console.error("closed sheet must not exit");
  failed++;
}
if (overflowSheetExits({ sheetOpen: true, via: "click", arrives: false })) {
  console.error("already-shown switch must not exit N more");
  failed++;
}
if (overflowSheetExits({ sheetOpen: true, via: "click", arrives: true, sameId: true })) {
  console.error("same-id must not exit N more");
  failed++;
}
const exitLockstep = [
  { sheetOpen: true, via: "click", arrives: true },
  { sheetOpen: true, via: "chord", arrives: true },
  { sheetOpen: true, via: "escape", arrives: true },
  { sheetOpen: true, via: "away", arrives: true },
  { sheetOpen: true, via: "toggle", arrives: true },
  { sheetOpen: false, via: "click", arrives: true },
  { sheetOpen: true, via: "click", arrives: false },
  { sheetOpen: true, via: "click", arrives: true, sameId: true },
];
for (const opts of exitLockstep) {
  if (overflowSheetExits(opts) !== (overflowSheetHoldMs(opts) === FACE_STAY_PULSE_MS)) {
    console.error("overflowSheetExits must track overflowSheetHoldMs stay-pulse:", opts);
    failed++;
  }
}

if (overflowMoreOpen(true, false) !== true) {
  console.error("open sheet (chord / idle) must keep N more pressed");
  failed++;
}
if (overflowMoreOpen(true, true) !== false) {
  console.error("click-hold recede must drop N more .open");
  failed++;
}
if (overflowMoreOpen(false, false) !== false) {
  console.error("closed sheet must not press N more");
  failed++;
}
if (overflowMoreOpen(false, true) !== false) {
  console.error("closed + exiting must not press N more");
  failed++;
}
if (overflowMoreOpen(true, overflowSheetExits({ sheetOpen: true, via: "click", arrives: true })) !== false) {
  console.error("overflowMoreOpen must drop .open when overflowSheetExits is the stay-pulse");
  failed++;
}
if (overflowMoreOpen(true, overflowSheetExits({ sheetOpen: true, via: "chord", arrives: true })) !== true) {
  console.error("chord must keep N more pressed (no exit)");
  failed++;
}
if (overflowMoreOpen(true, overflowSheetExits({ sheetOpen: true, via: "escape", arrives: true })) !== true) {
  console.error("Escape path must not recede N more via overflowMoreOpen");
  failed++;
}
if (overflowMoreOpen(true, overflowSheetExits({ sheetOpen: true, via: "away", arrives: true })) !== true) {
  console.error("click-away path must not recede N more via overflowMoreOpen");
  failed++;
}
if (overflowMoreOpen(true, overflowSheetExits({ sheetOpen: true, via: "toggle", arrives: true })) !== true) {
  console.error("toggle path must not recede N more via overflowMoreOpen");
  failed++;
}

const extraLeaving = fiveArrive.filter((f) => f.id === "4");
const schoolOverflow = overflowFaces(fiveArrive, "4").overflow;
if (overflowSheetRows(false, schoolOverflow, extraLeaving).map((f) => f.id).join() !== "3") {
  console.error(
    "closed sheet must not ghost Extra:",
    overflowSheetRows(false, schoolOverflow, extraLeaving),
  );
  failed++;
}
const extraGhost = overflowSheetRows(true, schoolOverflow, extraLeaving).map((f) => f.id);
if (extraGhost.join() !== "4,3") {
  console.error("open sheet pin Extra must ghost Extra in front of School:", extraGhost);
  failed++;
}
const stillOverflowed = overflowFaces(sixArrive, "0").overflow;
const noDup = overflowSheetRows(true, stillOverflowed, extraLeaving).map((f) => f.id);
if (noDup.join() !== "4,5" || noDup.filter((id) => id === "4").length !== 1) {
  console.error("overflowSheetRows must not duplicate still-overflowed Extra:", noDup);
  failed++;
}
const sixGhost = overflowSheetRows(
  true,
  overflowFaces(sixArrive, "4").overflow,
  extraLeaving,
).map((f) => f.id);
if (sixGhost.join() !== "4,3,5" || sixGhost.filter((id) => id === "4").length !== 1) {
  console.error("ghost Extra in front of School without duplicating still-overflowed ids:", sixGhost);
  failed++;
}
if (overflowSheetRows(true, schoolOverflow, []).map((f) => f.id).join() !== "3") {
  console.error("open sheet with nobody leaving must stay raw overflow");
  failed++;
}

if (overflowRecedeKicker(false, [{ name: "School" }]) !== "") {
  console.error("closed sheet recede kicker must stay empty");
  failed++;
}
if (overflowRecedeKicker(true, []) !== "") {
  console.error("open sheet with nobody folded must keep recede kicker empty");
  failed++;
}
if (overflowRecedeKicker(true, [{ name: "School" }]) !== "School receded") {
  console.error(
    "open sheet + School must say School receded:",
    overflowRecedeKicker(true, [{ name: "School" }]),
  );
  failed++;
}
if (overflowRecedeKicker(true, [{ name: "School" }, { name: "Home" }]) !== "School, Home receded") {
  console.error(
    "open sheet + School, Home must comma-join receded:",
    overflowRecedeKicker(true, [{ name: "School" }, { name: "Home" }]),
  );
  failed++;
}
if (overflowRecedeKicker(true, [{ name: "  " }, { name: "  School  " }]) !== "School receded") {
  console.error("recede kicker must skip blank names");
  failed++;
}
const recedePeople = ["Personal", "Work", "Home", "School", "Extra"].map((name, i) => ({
  id: String(i),
  name,
}));
if (overflowRecedeKicker(false, facesDepartToOverflow(recedePeople, "0", "4")) !== "") {
  console.error("closed sheet must stay empty even when School folded");
  failed++;
}
if (overflowRecedeKicker(true, facesDepartToOverflow(recedePeople, "0", "4")) !== "School receded") {
  console.error(
    "open sheet pin Extra must say School receded:",
    overflowRecedeKicker(true, facesDepartToOverflow(recedePeople, "0", "4")),
  );
  failed++;
}
if (
  overflowRecedeKicker(true, facesDepartToOverflow(recedePeople, "0", "2")) !== "" ||
  overflowRecedeKicker(true, facesDepartToOverflow(recedePeople, "0", "3")) !== ""
) {
  console.error("already-shown switch must keep recede kicker empty");
  failed++;
}
if (
  overflowRecedeKicker(true, facesDepartToOverflow(recedePeople, "0", "0")) !== "" ||
  overflowRecedeKicker(true, facesDepartToOverflow(recedePeople, "4", "4")) !== ""
) {
  console.error("same-id switch must keep recede kicker empty");
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
if (faceSwitchChord(9) !== "Ctrl+Shift+0") {
  console.error("faceSwitchChord(9) must be Ctrl+Shift+0:", faceSwitchChord(9));
  failed++;
}
if (faceSwitchChord(10) !== null) {
  console.error("faceSwitchChord(10) must be null:", faceSwitchChord(10));
  failed++;
}
if (faceSwitchChordCompact(0) !== "⌃⇧1") {
  console.error("faceSwitchChordCompact(0) must be ⌃⇧1:", faceSwitchChordCompact(0));
  failed++;
}
if (faceSwitchChordCompact(8) !== "⌃⇧9") {
  console.error("faceSwitchChordCompact(8) must be ⌃⇧9:", faceSwitchChordCompact(8));
  failed++;
}
if (faceSwitchChordCompact(9) !== "⌃⇧0") {
  console.error("faceSwitchChordCompact(9) must be ⌃⇧0:", faceSwitchChordCompact(9));
  failed++;
}
if (faceSwitchChordCompact(10) !== null) {
  console.error("faceSwitchChordCompact(10) must be null:", faceSwitchChordCompact(10));
  failed++;
}
if (faceSwitchChordCompact(-1) !== null || faceSwitchChordCompact(2.5) !== null) {
  console.error("faceSwitchChordCompact must use the same 0…9 / null rules as faceSwitchChord");
  failed++;
}
if (faceSwitchChordCompact(1) === faceSwitchChord(1) || faceSwitchChordCompact(9) === faceSwitchChord(9)) {
  console.error("compact chord must not equal full Ctrl+Shift+N");
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
if (faceIndexFromDigitCode("Digit0") !== 9) {
  console.error("Digit0 must map to Face 9:", faceIndexFromDigitCode("Digit0"));
  failed++;
}
if (faceIndexFromDigitCode("Digit10") !== null || faceIndexFromDigitCode("Digit") !== null) {
  console.error("eleventh Face and non-digit codes must have no chord:", faceIndexFromDigitCode("Digit10"));
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

const workFace = { id: "work", homeUrl: OUTLOOK_WORK };
const personalFace = { id: "personal" };
const workMail = { id: "work-mail", faceId: "work", kind: "page", url: OUTLOOK_WORK };
const workMailDeep = { id: "work-mail-deep", faceId: "work", kind: "page", url: "https://outlook.office.com/mail/inbox" };
const workHome = { id: "work-home", faceId: "work", kind: "home" };
const workDocs = { id: "work-docs", faceId: "work", kind: "page", url: "https://docs.google.com/document/d/1" };
const personalMail = { id: "personal-mail", faceId: "personal", kind: "page", url: OUTLOOK_WORK };
const personalHome = { id: "p-home", faceId: "personal", kind: "home" };

if (!tabIsFaceInbox(workMail, workFace) || !tabIsFaceInbox(workMailDeep, workFace)) {
  console.error("tabIsFaceInbox must match this Face's mailbox including /mail/inbox");
  failed++;
}
if (tabIsFaceInbox(workHome, workFace) || tabIsFaceInbox(workDocs, workFace)) {
  console.error("home thread and live pages are not the mailbox");
  failed++;
}
if (tabIsFaceInbox(personalMail, workFace) || tabIsFaceInbox(workMail, personalFace)) {
  console.error("tabIsFaceInbox must not match another Face or a Face with no homeUrl");
  failed++;
}

const existingInbox = resolveFaceHome({
  face: workFace,
  activeId: "work-home",
  tabs: [workMail, workHome],
});
if (existingInbox.kind !== "activate" || existingInbox.tabId !== "work-mail") {
  console.error("existing inbox page must activate that tab:", existingInbox);
  failed++;
}
const laterInbox = resolveFaceHome({
  face: workFace,
  activeId: "work-home",
  tabs: [workMail, workHome, workMailDeep],
});
if (laterInbox.kind !== "activate" || laterInbox.tabId !== "work-mail-deep") {
  console.error("with several mailboxes, activate the last unless current is already one:", laterInbox);
  failed++;
}
const alreadyInbox = resolveFaceHome({
  face: workFace,
  activeId: "work-mail",
  tabs: [workMail, workHome, workMailDeep],
});
if (alreadyInbox.kind !== "activate" || alreadyInbox.tabId !== "work-mail") {
  console.error("already on a mailbox tab must stay on it:", alreadyInbox);
  failed++;
}
const reuseHome = resolveFaceHome({
  face: workFace,
  activeId: "work-home",
  tabs: [workHome],
});
if (reuseHome.kind !== "reuse" || reuseHome.tabId !== "work-home" || reuseHome.url !== OUTLOOK_WORK) {
  console.error("no inbox + current is this Face's home must reuse:", reuseHome);
  failed++;
}
const livePage = resolveFaceHome({
  face: workFace,
  activeId: "work-docs",
  tabs: [workDocs],
});
if (livePage.kind !== "newTab" || livePage.faceId !== "work" || livePage.url !== OUTLOOK_WORK) {
  console.error("no inbox + current is this Face's live page must mint a tab:", livePage);
  failed++;
}
const neighborInbox = resolveFaceHome({
  face: workFace,
  activeId: "work-home",
  tabs: [personalMail, workHome],
});
if (neighborInbox.kind !== "reuse" || neighborInbox.tabId !== "work-home") {
  console.error("another Face's Outlook tab is not this Face's mailbox:", neighborInbox);
  failed++;
}
const noHomeUrl = resolveFaceHome({
  face: personalFace,
  activeId: "p-home",
  tabs: [personalHome],
});
if (noHomeUrl.kind !== "newHome" || noHomeUrl.faceId !== "personal") {
  console.error("no homeUrl must mint a new home thread:", noHomeUrl);
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
