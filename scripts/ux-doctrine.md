# Helix UX doctrine

Read this before you edit anything. It is the standing brief for the compounding improvement loop.

## What Helix is

Helix is a **Grok-native Chromium browser**. One strand is the live web. The other is Grok. Together they are a spine of argument.

It is **not** Perplexity with a URL bar, **not** Chrome with a chat sidebar, and **not** a second Chrome window per person. Electron `WebContentsView` is the real page. The React chrome is Grok throughout: omnibox, Faces, Continuum, Split Mind, Fork, Mosaic, Reader.

Public repo: `shawnwklein/helix-browser`. Product name **Helix**.

## North star: Faces, with Grok as the second reader

Chrome **Profiles** open a whole extra browser. Helix **Faces** are people you browse as, in **one window**:

- Each Face is a locked Chromium cookie jar (`persist:helix-face-<id>`). Work Outlook and personal Microsoft must never share SSO.
- **Add Outlook is one click** — work (`outlook.office.com`) or personal (`outlook.live.com`). Tabs stay color-coded. The omnibox names who you are.
- You can have two inboxes open as two tabs. No window juggling.
- Right-click a Face to rename. If Outlook puts an email in the title, Helix may name the Face — do not fight that unless the name is already custom.

Grok is the other strand, not a plugin:

- Omnibox is Ask-or-Go. A thought researches with grok-4.6 + `web_search` + `x_search`.
- Scout extracts. Skeptic leaves the page. Fork argues the opposite and is allowed to lose.
- Continuum keeps the argument when the tab is gone. Mosaic lays it on a table.

If Faces still feel like a Chrome profile picker glued on, that is the work. If Grok is still a sidebar people can ignore, that is the work.

## Every cycle invents and ships

You are not given a ticket. You **come up with the idea** by walking the real UI as a first-time user, then you ship it.

Read before you edit: `src/components/Chrome.tsx`, `FaceBar.tsx`, `src/views/Constellation.tsx`, `AnswerView.tsx`, `PageView.tsx`, `src/components/Continuum.tsx`, `MindPane.tsx`, `Overlays.tsx`, `src/index.css`, `src/store.ts`, `src/lib/faces.ts`, `electron/main.mjs`, `electron/preload.cjs`.

Ask:

- Can someone add a second Outlook account in one click and trust it will not mix with the first?
- Do they always know **which Face** they are in?
- Does a new user understand Ask vs Go without a manual?
- Does Split Mind / Continuum feel like reading with Grok, or like extra chrome?
- Would a Grok user rather live here than in Chrome + a chatbot?

Pick **one** user-visible improvement you can finish this cycle. Name why a person would feel the difference. Then ship it.

Every cycle ships **both**:

1. **A UX improvement** you invented from the current tree (copy, empty/error, omnibox, constellation, reader, keyboard, density, first-run, settings). Sharpen a real surface. Do not invent a new chrome system.
2. **Identity progress** toward Faces-as-people, Outlook as the easy path, and Grok woven through the same window. If isolation, naming, switching, or “add another account” is thin, that is this track.

## Compounding

Later cycles must be better than earlier ones, not a parallel rewrite.

- Read `iterations/<run>/run-memory.md` and the latest `iteration-N-handoff.md` before editing.
- Do not redo work listed under **Do not redo**.
- If the previous cycle is partial, hit max-turns, or failed validation, finish that work first unless it is truly stuck.
- Write the required handoff file before you stop. The loop owns `run-memory.md` — do not rewrite it.

## Copy and feel

Forbidden: “Let’s dive in”, Chrome-clone copy, “Profile 1”, purple AI slop, turning Helix into a search engine homepage, a dashboard of cards that is not Mosaic.

Preferred: short, human, specific. “Add Outlook.” “Browsing as Work.” “Ask the web, or go somewhere.” Faces are named people/inboxes, not “User 2”.

Stay darkroom / copper / ice. CSS and SVG. Do not replace the helix mark with a generated mascot.

## Architecture you must keep

- Electron + Vite + React. `electron/main.mjs` is the main process. Renderer talks through `window.helix`.
- Page tabs use `WebContentsView` with **per-Face** `partition`. Do not collapse Faces onto a single `persist:helix` session.
- Do not reload a live page when merely switching tabs (`showPage` force flag). Outlook login popups need the same partition (`about:blank` allow; http(s) → new tab in that Face).
- **Omnibox URL Enter must navigate.** Typing `google.com` / `https://outlook.office.com` and pressing Enter (or Go) loads a Chromium page in the current Face. Never no-op. Do not swallow Enter. Do not send a URL to Ask unless the user pressed Ctrl/Cmd+Enter. `node scripts/test-intent.mjs` must stay green.
- Packaged app serves `dist/` plus `/api` from the local host in `electron/host.mjs`. Key stays off the page world (`XAI_API_KEY` / Settings / `x-helix-key`).
- Grok is SpaceXAI / xAI only (`https://api.x.ai/v1`, grok-4.6). Demo orbit must not invent live citations.
- Persistence key `helix:v2` in `src/store.ts`. Additive Faces/tabs only; do not wipe existing identities.

## Releases

If you ship user-facing work, **bump the version**. Patch for UX/fixes, minor if you add a new Face/Grok surface.

1. `package.json` `version`
2. `package-lock.json` root `version` and `packages[""].version`

Do not tag or push unless the loop was started with `--auto-release`. The loop may bump the version for you if you forget. When `--auto-release` is on, every shipped cycle should become a GitHub Release (tag `vX.Y.Z` matching package.json).

## After edits

`npm run build` (`vite build` + `build:api`) must pass. Do not pack Windows installers inside the cycle unless asked — `--auto-release` lets GitHub Actions do that.
