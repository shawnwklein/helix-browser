You are building Helix, a Grok-native Chromium browser (Electron WebContentsView + React chrome). Standing rules are in scripts/ux-doctrine.md (also passed as grok --rules). Follow them.

Project: Helix. Electron + Vite + React. Public repo shawnwklein/helix-browser.

This is iteration 1 of run `20260823-122858-all` (this invocation ends at 99, focus=all, emphasis=faces).

You are compounding. Helix must be easier, more Face-native, and more Grok-woven than it was at the start of the previous cycle — not a parallel rewrite.

You invent the change. Read the UI files in the snapshot, come up with the idea, then ship it.

=== Iteration 1 snapshot (2026-08-23T12:28:58Z) ===

## Git
?? iterations/

ee50e23 Fix omnibox URL Enter so it actually navigates.
9b1ad8d Add a Grok compounding loop modeled on Herald.
0b23818 Add Faces: same-window identities with isolated Outlook sessions.
f342090 Add Helix, a Grok-native Chromium browser, with a Windows release pipeline.

### version
package.json: 0.2.2

### diff --stat vs HEAD

## Surfaces (read these; invent from them)
chrome:        src/components/Chrome.tsx
faces:         src/components/FaceBar.tsx
constellation: src/views/Constellation.tsx
answer:        src/views/AnswerView.tsx
page/reader:   src/views/PageView.tsx
mosaic:        src/views/MosaicView.tsx
continuum:     src/components/Continuum.tsx
mind:          src/components/MindPane.tsx
overlays:      src/components/Overlays.tsx
styles:        src/index.css
store:         src/store.ts
face model:    src/lib/faces.ts  src/lib/types.ts
electron:      electron/main.mjs  electron/preload.cjs  electron/host.mjs

## Faces / Outlook identity
Faces exist. Count Face kinds and whether Electron partitions per Face.
src/lib/faces.ts:14:export const OUTLOOK_WORK = "https://outlook.office.com/mail/";
src/lib/faces.ts:18:  return `persist:helix-face-${faceId}`;
src/lib/faces.ts:34:      partition: partitionFor(id),
src/store.ts:9:  OUTLOOK_WORK,
src/store.ts:102:  addOutlook: (kind: "outlook-work" | "outlook-personal") => void;
src/store.ts:353:    else if (cmd === "outlook") get().addOutlook("outlook-work");
src/store.ts:354:    else if (cmd === "outlook-personal") get().addOutlook("outlook-personal");
src/store.ts:655:  addOutlook: (kind) => {
src/store.ts:664:      partition: partitionFor(id),
src/store.ts:665:      homeUrl: kind === "outlook-work" ? OUTLOOK_WORK : OUTLOOK_PERSONAL,
src/store.ts:681:      partition: partitionFor(id),
electron/main.mjs:18:/** @type {Map<string, { view: WebContentsView, partition: string }>} */
electron/main.mjs:95:  const part = partition || "persist:helix-face-personal";
electron/main.mjs:105:      partition: part,
electron/main.mjs:123:          webPreferences: { sandbox: true, partition: part },
electron/main.mjs:131:          partition: part,
electron/main.mjs:143:  pages.set(tabId, { view, partition: part });

## Face / Outlook copy still on disk
src/components/FaceBar.tsx:2:import { activeFace, faceOf, useHelix } from "../store";
src/components/FaceBar.tsx:4:export function FaceBar() {
src/components/FaceBar.tsx:6:  const current = activeFace(s);
src/components/FaceBar.tsx:24:          className={`face-pill${f.id === s.activeFaceId ? " on" : ""}`}
src/components/FaceBar.tsx:27:          onClick={() => s.setActiveFace(f.id)}
src/components/FaceBar.tsx:28:          onDoubleClick={() => s.openFaceHome(f.id)}
src/components/FaceBar.tsx:52:          onClick={() => s.addFace()}
src/components/FaceBar.tsx:62:            Each Outlook Face is its own Chromium profile. Work and personal
src/components/FaceBar.tsx:90:        <FaceEditor
src/components/FaceBar.tsx:99:        Browsing as <b>{current?.name}</b>
src/components/FaceBar.tsx:105:function FaceEditor({
src/components/FaceBar.tsx:121:      <div className="pane-kicker">Face</div>
src/components/FaceBar.tsx:128:            s.renameFace(faceId, name);
src/components/FaceBar.tsx:137:          s.renameFace(faceId, name);
src/components/FaceBar.tsx:147:            s.openFaceHome(faceId);
src/components/FaceBar.tsx:158:            s.removeFace(faceId);
src/views/Constellation.tsx:24:          Faces are who you are on the web — Chrome profiles, rebuilt. Each
src/views/Constellation.tsx:61:            <h3>Add Outlook</h3>
src/views/Constellation.tsx:62:            <p>outlook.office.com · its own cookies, its own Face</p>
src/components/Chrome.tsx:3:import { activeFace, activeTab, faceOf, useHelix } from "../store";
src/components/Chrome.tsx:4:import { FaceBar } from "./FaceBar";
src/components/Chrome.tsx:52:          h.setActiveFace(face.id);
src/components/Chrome.tsx:80:  const face = activeFace(s);
src/components/Chrome.tsx:84:      <FaceBar />

## Face model
export type Face = {
  id: string;
  name: string;
  color: string;
  kind: FaceKind;
  partition: string;
  hint?: string;
  homeUrl?: string;
  createdAt: number;
};

## Language counts
FaceBar 'outlook': 11
FaceBar 'profile': 1
Chrome  'ask':     7
Constellation Grok:2
partition persist: electron/main.mjs:1
src/lib/faces.ts:1

## Compounding memory — build on this, do not start over

(first cycle of this run. Still ship both tracks. Invent the idea;
do not wait for a ticket.)

### Run ledger

# Compounding memory — 20260823-122858-all

- Project: Helix
- Focus: all
- Started: 2026-08-23T12:28:58Z
- App version at start: 0.2.2
- Doctrine: scripts/ux-doctrine.md

Each later cycle must read this, invent the next UX move from the
current UI, finish open threads when they still ship, and not redo
work already listed under Do not redo.

North star: Faces as people in one window; Grok as the second reader.

## Cycle log

<!-- loop:rolling -->

## Accumulated — do not redo

(empty at start of run)

## Open threads

(none yet)


## Your job this iteration
<!-- job:start -->
**Every iteration ships two things.** Do both in this cycle. You invent the
specific change by reading the current UI — there is no ticket waiting for you.

### 1. UX improvement — invent it, then ship it

Walk Helix as a person who just installed the Windows app: first window,
Faces row, Add Outlook, constellation, typing in the omnibox (Ask vs Go),
an answer tab, a live page, Reader, Split Mind, Continuum, Settings / demo
orbit. Pick **one** surface that would make the next five minutes easier.

Ideas should come from the code in front of you, for example:
- Copy that still says “Profile 1” or feels like a Chrome clone
- Faces that do not make the current person obvious
- Add Outlook buried, or work vs personal Microsoft unclear
- Omnibox that does not show who you are browsing as
- Empty Continuum / Mosaic that dump jargon instead of a next action
- Demo orbit vs live Grok confusion
- Keyboard path, first-run density, waiting language while Grok searches

Rules:
- Improve a real surface. Do not invent a new chrome system or a dashboard.
- Name *why a person would feel the difference* before you change it.
- Stay a native Chromium browser. Do not turn Helix into a website, a
  Perplexity clone, or a chat app with an iframe.

### 2. Identity — Faces as people, Grok as the second reader

Helix should feel like **browsing as yourself (or your work self)**, with
Grok sitting next to you — not managing Chrome profiles.

- If Faces / per-tab partitions are missing, **add them this cycle**.
- **Add Outlook** must stay one or two clicks: work (`outlook.office.com`)
  and personal (`outlook.live.com`), each a sealed cookie jar, same window.
- Tabs carry the Face color. The omnibox names the Face. Switching Faces
  must not reload the other inbox.
- Do not collapse partitions onto one session. Do not open a new BrowserWindow
  per Face (that is Chrome profiles).
- Grok track: omnibox Ask-or-Go, Scout / Skeptic, Continuum, Fork, Mosaic
  should be impossible to miss and must not break Face isolation.
- After Faces exist, spend this track making switching, naming, and
  “add another account” obvious — or weaving Grok tighter into the live page.

### Compounding

- Read the run ledger and the latest handoff *before* editing.
- Do not redo anything listed under **Do not redo**.
- If the previous cycle is `partial`, `max-turns`, or `validation-failed`,
  finish that work first unless it is truly stuck.
- Each cycle should leave Helix more like people+Grok and less like Chrome+chat.

### Emphasis this cycle: faces

Iteration 1 / run 20260823-122858-all — emphasis: faces

Lead with Faces / Outlook identity (still ship one invented UX improvement).
If adding a second Microsoft account still feels like Chrome profiles, fix
that: one window, color-coded tabs, locked partitions, Add Outlook obvious.
<!-- job:end -->

Constraints:
- Ship working product in this cycle. No speculative refactors.
- Do not regress Face partitions, Outlook add-account, tab-switch-without-reload, Grok demo-orbit honesty, or omnibox URL navigation (Enter on a URL must load the page). intent tests passed must pass.
- Additive Faces/settings only. Do not wipe existing identities or tabs.
- `npm run build` must pass (Vite renderer + esbuild API bundle).
- Bump `package.json` version (and lockfile root version) when you ship user-facing work. Patch for UX; minor if you add a new Face or Grok surface. Do not git tag unless asked (the loop tags when started with --auto-release).
- Copy: short, human — Faces are people, not “Profile 1”.
- Do not rewrite `iterations/20260823-122858-all/run-memory.md` — the loop owns that file.

## Required handoff file

Before you stop, write `iterations/20260823-122858-all/iteration-1-handoff.md` using this shape (keep it under ~80 lines):

```markdown
# Iteration 1 handoff

## Status
shipped | partial | max-turns | validation-failed

## Invented UX improvement
- What:
- Why a person would feel it:
- Files:
- User-visible:

## Identity (Faces / Outlook / Grok chrome)
- Faces / partitions: missing | present | sharpened
- What shipped:
- Files:
- Still thin:

## Version
- From:
- To:

## Do not redo
-

## Open threads
-

## Next iteration should
- UX idea to consider:
- Identity:
```

Also print a short "What changed this iteration" list at the end of your reply.
