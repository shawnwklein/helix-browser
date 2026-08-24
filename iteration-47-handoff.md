# Iteration 47 handoff

## Status
shipped

## Invented UX improvement
- What: Continuum kicker is a Face-dot plus **{name}'s spine** (sentence case). Empty lede is **Ask Grok as {name} — the argument stays here while this Face wanders**. Pane sets `--face` for a quiet wash. Live question still uses `spine-q`.
- Why a person would feel it: Opening Continuum on Work’s thread is no longer a faceless drawer — they see they are asking as Work, the same person as the omnibox chip, while the argument still belongs to this window.
- Files: `src/components/Continuum.tsx`, `src/index.css`, `scripts/test-intent.mjs`, `package.json`, `package-lock.json`
- User-visible: Yes — Face-dot kicker, Face-named empty copy, quiet Face wash; Findings / Echoes / Still open unchanged.

## North star
- What shipped: Continuum reads `activeFace`, paints `--face` on the pane, names the kicker and empty lede as this Face. No `faceStayPulse` (Constellation still skips it too).
- Files: Continuum `activeFace` + Face-dot kicker + `spine-empty`; `.continuum` wash and kicker density
- Still thin: Findings stay window-global (not per-Face storage). Mind pane is still a faceless “Split mind”.

## Version
- From: 0.2.48
- To: 0.2.49

## Do not redo
- Continuum kicker is Face-dot + `{name}'s spine`, not uppercase **The spine**
- Empty copy is **Ask Grok as {name}**; live `spine-q` still renders `s.continuum.question`
- Continuum must not subscribe to `faceStayPulse`; reduced-motion must not invent a pulse
- Findings, Echoes, and Still open chips stay as they are

## Open threads
- Overflow-row ContextMenu / Shift+F10 editor path (cycle 46 next invent)
- Click-away from an overflow-opened editor still drops **N more**
- Eleventh Face digit chord; **N more** chrome-neutral
- Per-Face Continuum storage (findings still window-global)

## Next iteration should
- UX idea to consider: From the focused overflow row, a keyboard path (context-menu key / Shift+F10) to reopen that Face's editor so rename/remove is not mouse-only after the round trip.
- North star: Faces stay locked cookie jars in one window; Continuum now names who is asking, but the spine is still one window-global argument.
