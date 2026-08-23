# Iteration 43 handoff

## Status
shipped

## Invented UX improvement
- What: Restyle the right-click Face editor from leftover `pal-item`s and a generic **Face** kicker into stacked Helix identity rows — **Save name**, **Open inbox**, **Remove {name}** — with this person’s `--face` wash, a short open rise, and a `--face` Tab ring, because that person already exists.
- Why a person would feel it: After they name Work and right-click the pill, the sheet is Work’s jar in this window (color, name, locked-cookie copy), not a command-palette leftover that talks like a Chrome profile menu.
- Files: `src/components/FaceBar.tsx`, `src/index.css`, `scripts/test-intent.mjs`, `package.json`, `package-lock.json`
- User-visible: Yes — editor is Face-tinted identity rows; kicker is the name; Tab ring is `--face`; hover is a wash; Escape closes.

## North star
- What shipped: Editing a Face that already exists is Helix `--face` chrome (same 28px density as namer / Outlook pick, tinted because the jar is real). Clicks still `renameFace` / `openFaceHome` / `removeFace`.
- Files: `.face-editor`, `.face-editor-row`, `.face-editor-row:focus-visible`, `face-editor-rise`
- Still thin: Overflow rows still have no editor. Face 11+ still has no digit chord. **N more** still chrome-neutral. Constellation still skips the stay pulse (forbidden).

## Version
- From: 0.2.44
- To: 0.2.45

## Do not redo
- Face editor sheet is not `pal-item`; kicker is `{face.name}`, not **Face**; no “profile” copy
- Editor rows wash and `:focus-visible` ring stay `--face` (non-none outline + 1px offset), never `--scout`
- Hover stays a wash (no outline / box-shadow ring); reduced-motion kills the rise, not the Tab ring
- `renameFace` on Enter / **Save name**; `openFaceHome` only when `homeUrl`; `removeFace` only when `faces.length > 1` as **Remove {name}**
- Escape closes the editor the same way as namer / Outlook pick (`editorOpen`)
- Face namer and Outlook picker stay `--scout` identity rows (cycle 42 / 41)

## Open threads
- Overflow rows still have no context menu / Face editor
- Constellation still does not share the stay pulse (still forbidden)
- Eleventh Face still has no digit chord
- **N more** stays chrome-neutral

## Next iteration should
- UX idea to consider: Open this same Face editor from an overflow row, so School in **N more** can be renamed or removed without first pulling them onto the bar.
- North star: Faces stay locked cookie jars in one window; a person who already exists is Face-tinted, recruiting or naming stays `--scout`
