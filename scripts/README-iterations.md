# Helix UX compounding loop

`scripts/iterate-grok-improvements.sh` runs Grok in a loop so Helix gets easier to live in without hand-writing every prompt.

The standing brief is **Faces, not Chrome profiles**, with **Grok as the second reader**. Each cycle **invents** a UX improvement from the actual UI, then ships it, and also moves identity (Outlook / Faces / Grok-in-chrome) forward.

## Kick off

From the Helix repo root (`/root/GrokBrowser`):

```bash
# Preview the compounding prompts (no grok, no edits)
./scripts/iterate-grok-improvements.sh --dry-run -n 3 --focus faces

# Real loop: invent + ship UX, lean on Faces / Outlook
./scripts/iterate-grok-improvements.sh --iterations 6 --focus faces --unattended --no-effort

# Overnight-style: commit each clean cycle
./scripts/iterate-grok-improvements.sh -n 8 --focus all --unattended --auto-commit --no-effort

# Commit, tag, and push a GitHub release after each shipped cycle
./scripts/iterate-grok-improvements.sh -n 4 --focus faces --unattended --auto-commit --auto-release --no-effort

# Continue an existing run folder (picks up ledger + open threads)
./scripts/iterate-grok-improvements.sh --resume-run 20260823-010000-faces -n 6
```

On grok-build (this machine), omit `--effort` or pass `--no-effort`.

Stop with Ctrl-C. The next invocation with `--resume-run <folder>` continues from the next iteration number.

## Options

| Flag | Meaning |
| --- | --- |
| `-n, --iterations N` | Cycles **this invocation** (default 5) |
| `--focus AREA` | `faces` (default), `grok`, `ux`, `feel`, `all` — tilts the mix; both tracks still run |
| `--effort LEVEL` | `low` / `medium` / `high` — omit on grok-build |
| `--no-effort` | Force-omit effort |
| `--auto-commit` | Commit after a clean build (bumps version if Grok forgot) |
| `--auto-release` | After a committed ship: tag `vX.Y.Z`, push `main` and the tag (fires GitHub Releases) |
| `--dry-run` | Write compounding prompts only |
| `--continue` | `grok --continue` (session memory). Written `run-memory.md` is the default compounding path |
| `--unattended` | Also `--always-approve` |
| `--max-turns N` | Optional per-cycle grok turn cap. **Default: omit (no cap)** |
| `--stop-on-error` | Exit the loop on grok/validation failure |
| `--prompt-file FILE` | Extra instructions, included **every** iteration |
| `--run-name NAME` | Folder under `iterations/`. If it already has cycles, continue from the next |
| `--from-run NAME` | Seed this run's memory from `iterations/NAME` |
| `--resume-run NAME` | Same as `--run-name` on an existing folder |

`--iterations` is the number of **outer cycles** (one `grok` process each). `--max-turns` is an optional cap on **agent rounds inside one cycle**. The loop does not pass `--max-turns` unless you ask it to.

## What each cycle does

1. Gathers a snapshot: git, version, chrome/Faces/constellation/answer/reader, Electron partitions, leftover Chrome-profile copy.
2. Builds a prompt from that snapshot **plus** `run-memory.md`, prior job briefs, and handoffs.
3. Writes `iterations/<run>/iteration-N-job.md` (the dual-mandate brief) and `iteration-N-prompt.md`.
4. Calls `grok --prompt-file … --rules scripts/ux-doctrine.md --permission-mode acceptEdits`.
5. Validates: `npm run build`.
6. Ensures `package.json` / lockfile version bumped on a ship, records `iteration-N-handoff.md`, updates the ledger.
7. With `--auto-release`, tags and pushes so GitHub Actions publishes the Windows EXEs.

If Grok hits `--max-turns` or validation fails, the loop **continues**. The next prompt is told to finish that work. Pass `--stop-on-error` to abort instead.

## Doctrine Grok is held to

See [ux-doctrine.md](ux-doctrine.md). Short version:

- Invent the change by reading the UI. Do not wait for a ticket.
- Faces are people in one window. Outlook accounts must not share cookies.
- Grok is the second strand, not a sidebar people can ignore.
- One UX improvement **and** identity progress every cycle.
- Compound: read the ledger; do not redo shipped work; finish open threads.
- Bump the app version when you ship user-facing work.

## Artifacts

```
iterations/<timestamp>-<focus>/
  run-memory.md                 compounding ledger (loop-owned)
  iteration-N-job.md            dual-mandate brief
  iteration-N-handoff.md        shipped / do-not-redo / open threads
  iteration-N-prompt.md         full prompt grok saw
  iteration-N.log
  iteration-N-validation.log
```

After a loop, open Helix and add two Outlook Faces. If they share a login or you still need a second window, the identity work is not done.
