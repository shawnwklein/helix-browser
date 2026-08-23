# Iteration 44 handoff

## Status
shipped

## Invented UX improvement
- What: Right-click a Face in **N more** opens that person’s Face-tinted editor in the same sheet slot. Kicker is a Face-dot + `{face.name}` (not a generic uppercase pane label). Click still becomes them.
- Why a person would feel it: After School folds into **1 more**, right-clicking School is still School’s jar in this window — color, name, locked cookies — not a switch-only chip that only becomes a person once they sit on the bar.
- Files: `src/components/FaceBar.tsx`, `src/index.css`, `scripts/test-intent.mjs`, `package.json`, `package-lock.json`
- User-visible: Yes — overflow context menu edits without pinning; click still becomes; editor kicker wears the Face-dot.

## North star
- What shipped: A folded person can be renamed or removed without pulling them onto the bar first. Editor still `renameFace` on Enter / **Save name**, `openFaceHome` only with `homeUrl`, `removeFace` only when `faces.length > 1` as **Remove {name}**.
- Files: overflow-row `onContextMenu`, `.face-editor .pane-kicker`
- Still thin: Closing the overflow-opened editor drops the sheet (Escape / save) instead of returning to **N more**. Face 11+ still has no digit chord. **N more** still chrome-neutral.

## Version
- From: 0.2.45
- To: 0.2.46

## Do not redo
- Overflow click: `setActiveFace` + `holdOverflowForLeave`; no `setMenu` / `setRename` on click
- Overflow context menu: `preventDefault`, `setRename`, `setMenu(f.id)`; no `setActiveFace`
- Editor kicker is Face-dot + `{face.name}`; `text-transform: none` (not uppercase **Face**)
- Editor rows wash and Tab ring stay `--face`; hover is a wash; reduced-motion kills the rise, not the ring
- Namer / Outlook pick stay `--scout`; **N more** stays chrome-neutral
- Overflow idle kicker stays **Also in this window**

## Open threads
- Editor close from overflow does not reopen **N more**
- Constellation still skips the stay pulse (forbidden)
- Eleventh Face still has no digit chord
- **N more** stays chrome-neutral (still out of scope)

## Next iteration should
- UX idea to consider: After Save / Escape from an overflow-opened editor, drop back into **N more** so the rest of the folded people are still there.
- North star: Faces stay locked cookie jars in one window; a person who already exists is Face-tinted even when folded.
