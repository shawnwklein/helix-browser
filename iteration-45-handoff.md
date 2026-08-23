# Iteration 45 handoff

## Status
shipped

## Invented UX improvement
- What: Save, Enter, and Escape on a Face editor opened from **N more** return to the overflow sheet. Remove does too when other folded people remain.
- Why a person would feel it: After they right-click School in **1 more** and Save or Escape, they land back on the folded people — not a blank FaceBar with the list gone.
- Files: `src/lib/faces.ts`, `src/components/FaceBar.tsx`, `scripts/test-intent.mjs`, `package.json`, `package-lock.json`
- User-visible: Yes — overflow-opened editor close restores **N more**; bar-opened close, Open inbox, and click-away still dismiss.

## North star
- What shipped: `faceEditorCloseMenu({ fromOverflow, reason, overflowRemaining })` → `"overflow" | null`. FaceBar remembers overflow-opened editors; Save / Enter / Escape / Remove-with-others `setMenu` to that helper.
- Files: `faceEditorCloseMenu`, FaceBar `editorFromOverflow` + `closeEditor`
- Still thin: Click-away still dismisses (does not reopen **N more**). Face 11+ still has no digit chord. **N more** still chrome-neutral.

## Version
- From: 0.2.46
- To: 0.2.47

## Do not redo
- Overflow click: `setActiveFace` + `holdOverflowForLeave`; no `setMenu` / `setRename` on click
- Overflow context menu: `preventDefault`, `setEditorFromOverflow(true)`, `setRename`, `setMenu(f.id)`; no `setActiveFace`
- Bar context menu: `setEditorFromOverflow(false)` then `setMenu(f.id)`
- Open inbox still closes (`reason: "inbox"` → `null`); click-away still `setMenu(null)`
- Remove last overflowed Face closes (`overflowRemaining: 0` → `null`)
- Editor kicker Face-dot + name; rows `--face`; namer / Outlook `--scout`; **N more** chrome-neutral

## Open threads
- Click-away from an overflow-opened editor still drops **N more** (intentional this cycle)
- Constellation still skips the stay pulse (forbidden)
- Eleventh Face still has no digit chord
- **N more** stays chrome-neutral (still out of scope)

## Next iteration should
- UX idea to consider: After Save / Escape returns to **N more**, put keyboard focus on the overflow row they were editing so the round trip is not mouse-only.
- North star: Faces stay locked cookie jars in one window; a folded person you were just editing is still in this window’s list.
