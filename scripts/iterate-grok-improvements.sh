#!/usr/bin/env bash
# Loop grok over Helix so each cycle invents UX and compounds on the last.
#
# Every iteration ships two things:
#   1. A user-facing UX improvement the cycle invents from the real UI
#   2. Progress toward Faces (Chrome profiles, rebuilt) and Grok-in-the-chrome
#
# Prompts include the run ledger, prior job briefs, and handoffs. There is no
# grok --max-turns cap unless you pass one.
#
#   ./scripts/iterate-grok-improvements.sh --iterations 6 --focus faces
#   ./scripts/iterate-grok-improvements.sh -n 4 --focus all --auto-commit
#   ./scripts/iterate-grok-improvements.sh --dry-run -n 3 --focus faces
#   ./scripts/iterate-grok-improvements.sh --resume-run 20260823-010000-faces -n 8
#   ./scripts/iterate-grok-improvements.sh -n 4 --focus faces --unattended --auto-release --no-effort
#
set -euo pipefail

ITERATIONS=5
FOCUS="faces"          # faces | grok | ux | feel | all
EFFORT=""              # omit on grok-build (rejects reasoningEffort)
AUTO_COMMIT=false
AUTO_RELEASE=false
DRY_RUN=false
CONTINUE_SESSION=false
UNATTENDED=false
SKIP_VALIDATE=false
STOP_ON_ERROR=false
MAX_TURNS=""           # omit --max-turns unless the caller passes one
PERMISSION_MODE="acceptEdits"
BASE_PROMPT_FILE=""
RUN_NAME=""
FROM_RUN=""
RESUME_RUN=""

PROJECT_NAME="Helix"
APP_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DOCTRINE_FILE="$APP_ROOT/scripts/ux-doctrine.md"

normalize_focus() {
  case "$1" in
    face|faces|outlook|profile|profiles|identity) echo "faces" ;;
    grok|research|scout|skeptic|continuum) echo "grok" ;;
    product|copy|chrome) echo "ux" ;;
    visual|motion|theme) echo "feel" ;;
    faces|grok|ux|feel|all) echo "$1" ;;
    *)
      echo "Unknown --focus '$1' (use faces|grok|ux|feel|all)" >&2
      exit 1
      ;;
  esac
}

while [[ $# -gt 0 ]]; do
  case $1 in
    --iterations|-n) ITERATIONS="$2"; shift 2 ;;
    --focus) FOCUS="$2"; shift 2 ;;
    --effort) EFFORT="$2"; shift 2 ;;
    --no-effort) EFFORT=""; shift ;;
    --auto-commit) AUTO_COMMIT=true; shift ;;
    --auto-release) AUTO_RELEASE=true; AUTO_COMMIT=true; shift ;;
    --dry-run) DRY_RUN=true; shift ;;
    --continue) CONTINUE_SESSION=true; shift ;;
    --unattended) UNATTENDED=true; PERMISSION_MODE="acceptEdits"; shift ;;
    --permission-mode) PERMISSION_MODE="$2"; shift 2 ;;
    --max-turns) MAX_TURNS="$2"; shift 2 ;;
    --skip-validate) SKIP_VALIDATE=true; shift ;;
    --stop-on-error) STOP_ON_ERROR=true; shift ;;
    --prompt-file) BASE_PROMPT_FILE="$2"; shift 2 ;;
    --run-name) RUN_NAME="$2"; shift 2 ;;
    --from-run) FROM_RUN="$2"; shift 2 ;;
    --resume-run) RESUME_RUN="$2"; shift 2 ;;
    --help|-h)
      cat <<EOF
iterate-grok-improvements.sh — loop grok so Helix compounds

Each cycle reads what the previous cycles shipped, then must:
  1. Invent and ship a UX improvement from the real UI
  2. Move Faces (multi-Outlook identities) and Grok-in-the-chrome forward

Helix is a Grok-native Chromium browser. Faces are people you browse as
in one window — not Chrome's extra-browser profiles.

Options:
  -n, --iterations N     Cycles to run this invocation (default: 5)
  --focus AREA           faces (default) | grok | ux | feel | all
                         Tilts the mix; every cycle still does both tracks.
  --effort LEVEL         grok effort (omit on grok-build)
  --no-effort            Explicitly omit --effort
  --auto-commit          git commit after a validated iteration (bumps version
                         if Grok forgot)
  --auto-release         Implies --auto-commit. Tag vX.Y.Z and push main + tag
                         so GitHub Actions publishes installers
  --dry-run              Write compounding prompts only; do not call grok
  --continue             Pass --continue into grok (session memory).
                         Written run-memory is the default compounding path.
  --unattended           Also pass --always-approve (no tool prompts)
  --permission-mode M    default: acceptEdits
  --max-turns N          Optional grok --max-turns cap. Default: omit (no cap).
                         0 or unlimited also means no cap.
  --skip-validate        Do not typecheck/build after an iteration
  --stop-on-error        Exit the loop on grok/validation failure.
                         Default: record the failure and continue so the next
                         prompt can finish the work.
  --prompt-file FILE     Extra instructions, included every iteration
  --run-name NAME        Folder under iterations/ (default: timestamp-focus).
                         If the folder already has cycles, continue from the next.
  --from-run NAME        Seed this run's memory from iterations/NAME
  --resume-run NAME      Same as --run-name NAME on an existing folder
  -h, --help

Each cycle: snapshot + run ledger + prior briefs/handoffs → prompt → grok
→ npm run build → version bump + handoff + ledger update.

Logs: iterations/<run>/
  run-memory.md              compounding ledger
  iteration-N-job.md         the dual-mandate brief for that cycle
  iteration-N-handoff.md     what shipped / what not to redo / open threads
  iteration-N-prompt.md      full prompt grok saw
  iteration-N.log
  iteration-N-validation.log

Stop with Ctrl-C.
EOF
      exit 0
      ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

FOCUS="$(normalize_focus "$FOCUS")"
if ! [[ "$ITERATIONS" =~ ^[1-9][0-9]*$ ]]; then
  echo "--iterations must be a positive integer" >&2
  exit 1
fi
if [[ -n "$MAX_TURNS" ]]; then
  case "$MAX_TURNS" in
    0|unlimited|none|off) MAX_TURNS="" ;;
    *)
      if ! [[ "$MAX_TURNS" =~ ^[1-9][0-9]*$ ]]; then
        echo "--max-turns must be a positive integer, 0, or unlimited" >&2
        exit 1
      fi
      ;;
  esac
fi
if [[ -n "$BASE_PROMPT_FILE" && ! -f "$BASE_PROMPT_FILE" ]]; then
  echo "--prompt-file not found: $BASE_PROMPT_FILE" >&2
  exit 1
fi

cd "$APP_ROOT"

if [[ ! -f "$DOCTRINE_FILE" ]]; then
  echo "Missing $DOCTRINE_FILE" >&2
  exit 1
fi

if [[ -n "$RESUME_RUN" ]]; then
  RUN_NAME="$RESUME_RUN"
fi
if [[ -z "$RUN_NAME" ]]; then
  RUN_NAME="$(date -u +%Y%m%d-%H%M%S)-${FOCUS}"
fi
LOG_DIR="$APP_ROOT/iterations/$RUN_NAME"
MEMORY_FILE="$LOG_DIR/run-memory.md"
mkdir -p "$LOG_DIR"

last_iteration_number() {
  local max=0 f n
  for f in "$LOG_DIR"/iteration-*-prompt.md; do
    [[ -e "$f" ]] || continue
    n="${f##*/iteration-}"
    n="${n%-prompt.md}"
    if [[ "$n" =~ ^[0-9]+$ ]] && (( n > max )); then
      max=$n
    fi
  done
  echo "$max"
}

extract_md_section() {
  local file=$1
  local heading=$2
  [[ -f "$file" ]] || return 0
  awk -v h="$heading" '
    BEGIN { p = 0 }
    /^## / {
      if (p) exit
      if ($0 == "## " h) { p = 1; next }
    }
    p { print }
  ' "$file"
}

app_version() {
  node -p "require('./package.json').version" 2>/dev/null || echo "?"
}

START_ITER=1
LAST_ITER="$(last_iteration_number)"
if (( LAST_ITER > 0 )); then
  START_ITER=$((LAST_ITER + 1))
fi
END_ITER=$((START_ITER + ITERATIONS - 1))

init_memory() {
  if [[ -f "$MEMORY_FILE" ]]; then
    return
  fi
  local src inherited
  if [[ -n "$FROM_RUN" ]]; then
    src="$APP_ROOT/iterations/$FROM_RUN"
    if [[ ! -d "$src" ]]; then
      echo "Missing --from-run folder: $src" >&2
      exit 1
    fi
  fi
  {
    echo "# Compounding memory — $RUN_NAME"
    echo
    echo "- Project: $PROJECT_NAME"
    echo "- Focus: $FOCUS"
    echo "- Started: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
    echo "- App version at start: $(app_version)"
    echo "- Doctrine: scripts/ux-doctrine.md"
    echo
    echo "Each later cycle must read this, invent the next UX move from the"
    echo "current UI, finish open threads when they still ship, and not redo"
    echo "work already listed under Do not redo."
    echo
    echo "North star: Faces as people in one window; Grok as the second reader."
    echo
    echo "## Cycle log"
    echo
    if [[ -n "$FROM_RUN" ]]; then
      echo "## Inherited from $FROM_RUN"
      echo
      echo "Prior-run text is quoted so this run's ledger headings stay unique."
      echo
      if [[ -f "$src/run-memory.md" ]]; then
        sed 's/^/> /' "$src/run-memory.md"
      else
        echo "(no run-memory.md in $FROM_RUN)"
      fi
      echo
      inherited="$(ls -1 "$src"/iteration-*-handoff.md 2>/dev/null | sort -V | tail -1 || true)"
      if [[ -n "$inherited" && -f "$inherited" ]]; then
        echo "## Last handoff from $FROM_RUN"
        echo
        sed 's/^/> /' "$inherited"
        echo
      fi
    fi
    if [[ -n "$BASE_PROMPT_FILE" ]]; then
      echo "## Standing extra (--prompt-file)"
      echo
      cat "$BASE_PROMPT_FILE"
      echo
    fi
    echo "<!-- loop:rolling -->"
    echo
    echo "## Accumulated — do not redo"
    echo
    echo "(empty at start of run)"
    echo
    echo "## Open threads"
    echo
    echo "(none yet)"
  } > "$MEMORY_FILE"
}

init_memory

echo "=== Grok UX loop — $PROJECT_NAME (Faces + Grok chrome) ==="
echo "Run:         $RUN_NAME"
echo "This pass:   iterations $START_ITER–$END_ITER ($ITERATIONS cycles)"
if (( LAST_ITER > 0 )); then
  echo "Continuing:  folder already has $LAST_ITER cycle(s)"
fi
echo "Focus:       $FOCUS"
echo "Version:     $(app_version)"
echo "Effort:      ${EFFORT:-<omitted>}"
echo "Max-turns:   ${MAX_TURNS:-unlimited (not passed to grok)}"
echo "Unattended:  $UNATTENDED"
echo "Stop-on-err: $STOP_ON_ERROR"
echo "Auto-commit: $AUTO_COMMIT  Auto-release: $AUTO_RELEASE  Dry-run: $DRY_RUN"
echo "Logs:        $LOG_DIR"
echo "Memory:      $MEMORY_FILE"
echo

# ─────────────────────────────────────────────────────────────
gather_snapshot() {
  local iter=$1
  echo "=== Iteration $iter snapshot ($(date -u +%Y-%m-%dT%H:%M:%SZ)) ==="

  echo
  echo "## Git"
  git status --short | head -50 || true
  echo
  git log --oneline -8 || true
  echo
  echo "### version"
  echo "package.json: $(app_version)"
  echo
  echo "### diff --stat vs HEAD"
  git diff --stat HEAD | tail -40 || true

  echo
  echo "## Surfaces (read these; invent from them)"
  echo "chrome:        src/components/Chrome.tsx"
  echo "faces:         src/components/FaceBar.tsx"
  echo "constellation: src/views/Constellation.tsx"
  echo "answer:        src/views/AnswerView.tsx"
  echo "page/reader:   src/views/PageView.tsx"
  echo "mosaic:        src/views/MosaicView.tsx"
  echo "continuum:     src/components/Continuum.tsx"
  echo "mind:          src/components/MindPane.tsx"
  echo "overlays:      src/components/Overlays.tsx"
  echo "styles:        src/index.css"
  echo "store:         src/store.ts"
  echo "face model:    src/lib/faces.ts  src/lib/types.ts"
  echo "electron:      electron/main.mjs  electron/preload.cjs  electron/host.mjs"

  echo
  echo "## Faces / Outlook identity"
  if grep -qE 'persist:helix-face-|activeFaceId|addOutlook' src/store.ts src/lib/faces.ts electron/main.mjs 2>/dev/null; then
    echo "Faces exist. Count Face kinds and whether Electron partitions per Face."
    grep -nE 'persist:helix-face-|addOutlook|OUTLOOK_WORK|partition:' src/lib/faces.ts src/store.ts electron/main.mjs 2>/dev/null | head -50
  else
    echo "NO Faces / per-account partitions yet. Shipping isolated Outlook Faces"
    echo "in one window is the preferred identity-track move."
  fi

  echo
  echo "## Face / Outlook copy still on disk"
  grep -nE 'Profile 1|Chrome profile|Add Outlook|Browsing as|Face|outlook.office' src/components/FaceBar.tsx src/views/Constellation.tsx src/components/Chrome.tsx 2>/dev/null | head -50 || true

  echo
  echo "## Face model"
  node --input-type=module -e '
    import { readFileSync } from "node:fs";
    const src = readFileSync("src/lib/types.ts", "utf8");
    const block = src.match(/export type Face = \{[\s\S]*?\};/);
    console.log(block ? block[0] : "(could not read Face)");
  ' 2>/dev/null || echo "(could not load Face)"

  echo
  echo "## Language counts"
  echo "FaceBar 'outlook': $(grep -c -i outlook src/components/FaceBar.tsx 2>/dev/null || echo 0)"
  echo "FaceBar 'profile': $(grep -c -i profile src/components/FaceBar.tsx 2>/dev/null || echo 0)"
  echo "Chrome  'ask':     $(grep -c -i ask src/components/Chrome.tsx 2>/dev/null || echo 0)"
  echo "Constellation Grok:$(grep -c -i grok src/views/Constellation.tsx 2>/dev/null || echo 0)"
  echo "partition persist: $(grep -c persist:helix-face- electron/main.mjs src/lib/faces.ts 2>/dev/null || echo 0)"
}

gather_compounding() {
  local iter=$1
  local prev=$((iter - 1))
  local keep_jobs=5
  local keep_handoffs=3
  local first_full_job=$((iter - keep_jobs))
  local first_full_handoff=$((iter - keep_handoffs))
  (( first_full_job < 1 )) && first_full_job=1
  (( first_full_handoff < 1 )) && first_full_handoff=1

  echo "## Compounding memory — build on this, do not start over"
  echo
  if [[ "$iter" -eq 1 && "$LAST_ITER" -eq 0 ]]; then
    echo "(first cycle of this run. Still ship both tracks. Invent the idea;"
    echo "do not wait for a ticket.)"
    echo
    if [[ -f "$MEMORY_FILE" ]]; then
      echo "### Run ledger"
      echo
      cat "$MEMORY_FILE"
      echo
    fi
    return
  fi

  echo "You are iteration $iter of run \`$RUN_NAME\`. Earlier cycles already"
  echo "touched the tree. Read the ledger and the last handoff before editing."
  echo "Finish open threads when they still ship. Never redo listed work."
  echo "Invent the next improvement from the UI as it is now."
  echo

  echo "### Run ledger"
  echo
  if [[ -f "$MEMORY_FILE" ]]; then
    cat "$MEMORY_FILE"
  else
    echo "(no run-memory.md yet)"
  fi
  echo

  echo "### Prior job briefs this run"
  echo
  if (( prev < 1 )); then
    echo "(none)"
  else
    local j jobf
    for j in $(seq 1 "$prev"); do
      jobf="$LOG_DIR/iteration-$j-job.md"
      if [[ ! -f "$jobf" ]]; then
        echo "- iteration $j: (no job brief on disk)"
        continue
      fi
      if (( j < first_full_job )); then
        echo "- iteration $j: $(tr '\n' ' ' < "$jobf" | cut -c1-180)"
      else
        echo
        echo "#### Iteration $j job"
        echo
        cat "$jobf"
        echo
      fi
    done
  fi
  echo

  echo "### Handoffs (most recent last)"
  echo
  if (( prev < 1 )); then
    echo "(none)"
  else
    local j hf
    for j in $(seq 1 "$prev"); do
      hf="$LOG_DIR/iteration-$j-handoff.md"
      if [[ ! -f "$hf" ]]; then
        echo "- iteration $j: (no handoff)"
        continue
      fi
      if (( j < first_full_handoff )); then
        echo "- iteration $j: $(grep -m1 -E '^shipped|^partial|^max-turns|^validation|^dry-run|^failed' "$hf" || echo see $hf)"
      else
        echo
        echo "#### Iteration $j handoff"
        echo
        cat "$hf"
        echo
      fi
    done
  fi
  echo

  echo "### Previous cycle log tail"
  echo
  if [[ $prev -ge 1 && -f "$LOG_DIR/iteration-${prev}.log" ]]; then
    tail -c 3500 "$LOG_DIR/iteration-${prev}.log" || true
    echo
  else
    echo "(no previous log)"
    echo
  fi
}

emphasis_for() {
  local iter=$1
  local focus=$2
  case "$focus" in
    faces)
      case $(( (iter - 1) % 3 )) in
        0) echo faces ;;
        1) echo ux ;;
        *) echo grok ;;
      esac
      ;;
    grok) echo grok ;;
    ux) echo ux ;;
    feel) echo feel ;;
    all)
      case $(( (iter - 1) % 4 )) in
        0) echo faces ;;
        1) echo ux ;;
        2) echo grok ;;
        *) echo feel ;;
      esac
      ;;
  esac
}

standing_mandate() {
  cat <<'EOF'
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
EOF
}

emphasis_text() {
  local emphasis=$1
  case "$emphasis" in
    faces)
      cat <<'EOF'
Lead with Faces / Outlook identity (still ship one invented UX improvement).
If adding a second Microsoft account still feels like Chrome profiles, fix
that: one window, color-coded tabs, locked partitions, Add Outlook obvious.
EOF
      ;;
    grok)
      cat <<'EOF'
Lead with Grok-in-the-chrome (still ship one invented UX improvement). Ask-or-Go,
Scout/Skeptic, Continuum, Fork, Mosaic should feel like a second reader, not
a chatbot bolted on. Faces / Outlook isolation must keep working.
EOF
      ;;
    ux)
      cat <<'EOF'
Lead with one invented UX improvement (still move Faces / Grok identity). Walk
first-run, Add Outlook, omnibox, empty Continuum, demo orbit, Reader. Pick the
friction a new user hits next, not a brochure page.
EOF
      ;;
    feel)
      cat <<'EOF'
Lead with look-and-feel (still ship Faces / Grok progress). Copper/ice strands,
Face color on tabs, density, type, motion while Grok searches. Stay CSS/SVG.
Helix should feel like a darkroom research browser, not Chrome with purple AI.
EOF
      ;;
    *)
      cat <<'EOF'
Split the cycle roughly even between an invented UX improvement and Faces /
Grok identity. Finish whichever open thread is closest to shipping first.
EOF
      ;;
  esac
}

write_job_brief() {
  local iter=$1
  local emphasis=$2
  local job_file=$3
  {
    echo "Iteration $iter / run $RUN_NAME — emphasis: $emphasis"
    echo
    emphasis_text "$emphasis"
  } > "$job_file"
}

build_prompt() {
  local iter=$1
  local emphasis=$2
  local prompt_file=$3
  local job_file="$LOG_DIR/iteration-${iter}-job.md"
  local handoff_rel="iterations/${RUN_NAME}/iteration-${iter}-handoff.md"

  write_job_brief "$iter" "$emphasis" "$job_file"

  {
    cat <<EOF
You are building Helix, a Grok-native Chromium browser (Electron WebContentsView + React chrome). Standing rules are in scripts/ux-doctrine.md (also passed as grok --rules). Follow them.

Project: $PROJECT_NAME. Electron + Vite + React. Public repo shawnwklein/helix-browser.

This is iteration $iter of run \`$RUN_NAME\` (this invocation ends at $END_ITER, focus=$FOCUS, emphasis=$emphasis).

You are compounding. Helix must be easier, more Face-native, and more Grok-woven than it was at the start of the previous cycle — not a parallel rewrite.

You invent the change. Read the UI files in the snapshot, come up with the idea, then ship it.

EOF
    gather_snapshot "$iter"
    echo
    gather_compounding "$iter"
    echo
    echo "## Your job this iteration"
    echo "<!-- job:start -->"
    standing_mandate
    echo
    echo "### Emphasis this cycle: $emphasis"
    echo
    cat "$job_file"
    echo "<!-- job:end -->"
    cat <<EOF

Constraints:
- Ship working product in this cycle. No speculative refactors.
- Do not regress Face partitions, Outlook add-account, tab-switch-without-reload, or Grok demo-orbit honesty.
- Additive Faces/settings only. Do not wipe existing identities or tabs.
- \`npm run build\` must pass (Vite renderer + esbuild API bundle).
- Bump \`package.json\` version (and lockfile root version) when you ship user-facing work. Patch for UX; minor if you add a new Face or Grok surface. Do not git tag unless asked (the loop tags when started with --auto-release).
- Copy: short, human — Faces are people, not “Profile 1”.
- Do not rewrite \`iterations/$RUN_NAME/run-memory.md\` — the loop owns that file.

EOF
    if [[ -n "$BASE_PROMPT_FILE" ]]; then
      echo "## Standing extra (--prompt-file, every iteration)"
      echo
      cat "$BASE_PROMPT_FILE"
      echo
    fi
    cat <<EOF
## Required handoff file

Before you stop, write \`$handoff_rel\` using this shape (keep it under ~80 lines):

\`\`\`markdown
# Iteration $iter handoff

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
\`\`\`

Also print a short "What changed this iteration" list at the end of your reply.
EOF
  } > "$prompt_file"
}

synthesize_handoff() {
  local iter=$1
  local status=$2
  local file="$LOG_DIR/iteration-${iter}-handoff.md"
  if [[ -f "$file" ]]; then
    return
  fi
  {
    echo "# Iteration $iter handoff"
    echo
    echo "## Status"
    echo "$status (synthesized — grok did not write the handoff file)"
    echo
    echo "## Invented UX improvement"
    echo "- What: (not recorded)"
    echo
    echo "## Identity (Faces / Outlook / Grok chrome)"
    echo "- What shipped: (not recorded)"
    echo
    echo "## Version"
    echo "- $(app_version)"
    echo
    echo "## Do not redo"
    echo
    echo "## Open threads"
    case "$status" in
      max-turns)
        echo "- Iteration $iter hit grok --max-turns. Continue that work; do not start a disconnected third thread."
        ;;
      dry-run)
        echo "- Execute the iteration $iter job brief for real."
        ;;
      failed)
        echo "- Iteration $iter grok process failed. Inspect iteration-$iter.log and finish anything already in the tree."
        ;;
      *)
        echo "- Write a real handoff next cycle if this work is still in flight."
        ;;
    esac
    echo
    echo "## Next iteration should"
    echo "- UX idea to consider: finish or replace the unfinished UX pick from iteration $iter"
    echo "- Identity: finish or replace the unfinished Faces / Grok pick from iteration $iter"
    echo
    echo "## Git snapshot after this cycle"
    echo
    echo '```'
    git status --short | head -40 || true
    echo
    git diff --stat HEAD | tail -30 || true
    echo '```'
    echo
    if [[ -f "$LOG_DIR/iteration-${iter}.log" ]]; then
      echo "## Log tail"
      echo
      echo '```'
      tail -c 2500 "$LOG_DIR/iteration-${iter}.log" || true
      echo
      echo '```'
    fi
  } > "$file"
}

update_memory() {
  local iter=$1
  local status=$2
  local hf="$LOG_DIR/iteration-${iter}-handoff.md"
  local cycle_file rolling_file rebuilt j any sec

  cycle_file="$(mktemp)"
  rolling_file="$(mktemp)"
  rebuilt="$(mktemp)"

  {
    echo
    echo "### Iteration $iter — $status ($(date -u +%Y-%m-%dT%H:%M:%SZ))"
    echo
    echo "- Prompt: iteration-$iter-prompt.md"
    echo "- Job: iteration-$iter-job.md"
    echo "- Handoff: iteration-$iter-handoff.md"
    echo "- Emphasis: $(head -1 "$LOG_DIR/iteration-${iter}-job.md" 2>/dev/null || echo '?')"
    echo "- Version: $(app_version)"
    echo
    if [[ -f "$hf" ]]; then
      echo "#### Invented UX improvement"
      echo
      extract_md_section "$hf" "Invented UX improvement"
      echo
      echo "#### Identity (Faces / Outlook / Grok chrome)"
      echo
      extract_md_section "$hf" "Identity (Faces / Outlook / Grok chrome)"
      echo
    fi
  } > "$cycle_file"

  {
    echo "## Accumulated — do not redo"
    echo
    any=0
    for j in $(seq 1 "$iter"); do
      sec="$(extract_md_section "$LOG_DIR/iteration-$j-handoff.md" "Do not redo" | sed '/^[[:space:]]*$/d' || true)"
      if [[ -n "$sec" ]]; then
        any=1
        echo "From iteration $j:"
        echo "$sec"
        echo
      fi
    done
    if [[ "$any" -eq 0 ]]; then
      echo "(nothing listed yet)"
      echo
    fi
    echo "## Open threads"
    echo
    extract_md_section "$hf" "Open threads"
    echo
    echo "## Next iteration should"
    echo
    extract_md_section "$hf" "Next iteration should"
    echo
  } > "$rolling_file"

  if grep -q '^<!-- loop:rolling -->$' "$MEMORY_FILE"; then
    awk -v cycle_file="$cycle_file" -v rolling_file="$rolling_file" '
      /^<!-- loop:rolling -->$/ {
        while ((getline line < cycle_file) > 0) print line
        close(cycle_file)
        print "<!-- loop:rolling -->"
        print ""
        while ((getline line < rolling_file) > 0) print line
        close(rolling_file)
        exit
      }
      { print }
    ' "$MEMORY_FILE" > "$rebuilt"
    mv "$rebuilt" "$MEMORY_FILE"
  else
    {
      cat "$cycle_file"
      echo "<!-- loop:rolling -->"
      echo
      cat "$rolling_file"
    } >> "$MEMORY_FILE"
    rm -f "$rebuilt"
  fi
  rm -f "$cycle_file" "$rolling_file"
}

run_validation() {
  local iter=$1
  local log="$LOG_DIR/iteration-${iter}-validation.log"
  local failed=0
  echo "=== Validation for iteration $iter ===" | tee "$log"

  echo "=== npm run build ===" | tee -a "$log"
  if ! npm run build >>"$log" 2>&1; then
    failed=1
  fi
  tail -n 40 "$log" || true

  if [[ "$failed" -ne 0 ]] || grep -E -q 'error TS[0-9]+|Failed to compile|Type error:|ELIFECYCLE|AssertionError|ERR_ASSERTION' "$log"; then
    echo "VALIDATION: FAILED (see $log)" >&2
    return 1
  fi
  echo "VALIDATION: PASSED"
  return 0
}

bump_patch_version() {
  local current next
  current="$(app_version)"
  if [[ ! "$current" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "Cannot bump non-semver version '$current'" >&2
    return 1
  fi
  next="$(node -e '
    const v = process.argv[1].split(".").map(Number);
    v[2] += 1;
    process.stdout.write(v.join("."));
  ' "$current")"
  node --input-type=module -e '
    import { readFileSync, writeFileSync } from "node:fs";
    const next = process.argv[1];
    const pkgPath = "package.json";
    const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
    pkg.version = next;
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
    try {
      const lock = JSON.parse(readFileSync("package-lock.json", "utf8"));
      lock.version = next;
      if (lock.packages && lock.packages[""]) lock.packages[""].version = next;
      writeFileSync("package-lock.json", JSON.stringify(lock, null, 2) + "\n");
    } catch {}
  ' "$next"
  echo "$next"
}

ensure_version_bump() {
  local before=$1
  local after
  after="$(app_version)"
  if [[ "$after" != "$before" ]]; then
    echo "Version already bumped $before → $after"
    return 0
  fi
  if git diff --quiet HEAD -- src electron public index.html package.json 2>/dev/null \
     && [[ -z "$(git ls-files --others --exclude-standard src electron public 2>/dev/null)" ]]; then
    echo "No user-facing tree changes; leaving version $after"
    return 0
  fi
  after="$(bump_patch_version)"
  echo "Loop bumped version $before → $after"
}

maybe_commit_and_release() {
  local iter=$1
  local emphasis=$2
  local version
  version="$(app_version)"
  git add -A
  if git diff --cached --quiet; then
    echo "Nothing to commit."
    return 0
  fi
  git commit -m "Helix ${version}: iteration ${iter} (${emphasis})

Automated UX loop. Run ${RUN_NAME}.
See iterations/${RUN_NAME}/iteration-${iter}-handoff.md" || true
  if [[ "$AUTO_RELEASE" != true ]]; then
    return 0
  fi
  local tag="v${version}"
  if git rev-parse "$tag" >/dev/null 2>&1; then
    echo "Tag $tag already exists; skip release."
    git push origin HEAD:main || true
    return 0
  fi
  git tag "$tag"
  git push origin HEAD:main
  git push origin "$tag"
  echo "Pushed $tag — GitHub Release workflow should publish Windows EXEs."
}

build_grok_cmd() {
  local prompt_file=$1
  GROK_CMD=(
    grok
    --prompt-file "$prompt_file"
    --permission-mode "$PERMISSION_MODE"
    --output-format plain
    --cwd "$APP_ROOT"
    --rules "$DOCTRINE_FILE"
  )
  if [[ -n "$MAX_TURNS" ]]; then
    GROK_CMD+=(--max-turns "$MAX_TURNS")
  fi
  if [[ -n "$EFFORT" ]]; then
    GROK_CMD+=(--effort "$EFFORT")
  fi
  if [[ "$CONTINUE_SESSION" == true ]]; then
    GROK_CMD+=(--continue)
  fi
  if [[ "$UNATTENDED" == true ]]; then
    GROK_CMD+=(--always-approve)
  fi
}

is_max_turns() {
  local log=$1
  [[ -f "$log" ]] && grep -qiE 'max turns reached|error_max_turns|Error: max turns' "$log"
}

is_auth_failure() {
  local log=$1
  [[ -f "$log" ]] && grep -qiE 'not authenticated|login required|invalid api key|authentication_failed' "$log"
}

# ─────────────────────────────────────────────────────────────
for i in $(seq "$START_ITER" "$END_ITER"); do
  EMPHASIS="$(emphasis_for "$i" "$FOCUS")"
  k=$((i - START_ITER + 1))
  BEFORE_VERSION="$(app_version)"
  echo
  echo "=============================================================="
  echo "  ITERATION $i   this pass $k / $ITERATIONS   focus=$FOCUS   emphasis=$EMPHASIS   v$BEFORE_VERSION"
  echo "=============================================================="

  ITER_LOG="$LOG_DIR/iteration-$i.log"
  PROMPT_FILE="$LOG_DIR/iteration-$i-prompt.md"
  HANDOFF_FILE="$LOG_DIR/iteration-$i-handoff.md"

  build_prompt "$i" "$EMPHASIS" "$PROMPT_FILE"
  echo "Prompt → $PROMPT_FILE"
  echo "Job    → $LOG_DIR/iteration-$i-job.md"

  if [[ "$DRY_RUN" == true ]]; then
    echo "[dry-run] skipping grok"
    synthesize_handoff "$i" "dry-run"
    update_memory "$i" "dry-run"
    continue
  fi

  if ! command -v grok >/dev/null 2>&1; then
    echo "grok CLI not found on PATH" >&2
    exit 1
  fi

  if [[ -n "$MAX_TURNS" ]]; then
    echo "Invoking grok (max-turns=$MAX_TURNS, permission=$PERMISSION_MODE)..."
  else
    echo "Invoking grok (no turn cap, permission=$PERMISSION_MODE)..."
  fi
  build_grok_cmd "$PROMPT_FILE"
  set +e
  "${GROK_CMD[@]}" 2>&1 | tee "$ITER_LOG"
  GROK_EXIT=${PIPESTATUS[0]}
  set -e

  if [[ $GROK_EXIT -ne 0 ]] && grep -qi 'reasoningEffort' "$ITER_LOG"; then
    echo "Backend rejected --effort; retrying without it."
    EFFORT=""
    build_grok_cmd "$PROMPT_FILE"
    set +e
    "${GROK_CMD[@]}" 2>&1 | tee -a "$ITER_LOG"
    GROK_EXIT=${PIPESTATUS[0]}
    set -e
  fi

  STATUS="shipped"
  if is_max_turns "$ITER_LOG"; then
    STATUS="max-turns"
    echo "grok hit --max-turns on iteration $i. Recording a partial handoff and continuing so the next prompt can finish the work."
  elif [[ $GROK_EXIT -ne 0 ]]; then
    STATUS="failed"
    echo "grok exited $GROK_EXIT on iteration $i."
    if is_auth_failure "$ITER_LOG"; then
      echo "Authentication failure — stopping loop."
      echo "Log: $ITER_LOG"
      synthesize_handoff "$i" "$STATUS"
      update_memory "$i" "$STATUS"
      exit "$GROK_EXIT"
    fi
    if [[ "$STOP_ON_ERROR" == true ]]; then
      echo "Stopping loop (--stop-on-error)."
      echo "Log: $ITER_LOG"
      synthesize_handoff "$i" "$STATUS"
      update_memory "$i" "$STATUS"
      exit "$GROK_EXIT"
    fi
    echo "Continuing to the next cycle with this failure in the ledger."
  fi

  if [[ "$SKIP_VALIDATE" == true ]]; then
    echo "Validation skipped."
    synthesize_handoff "$i" "$STATUS"
    update_memory "$i" "$STATUS"
    continue
  fi

  echo
  set +e
  run_validation "$i"
  VAL_EXIT=$?
  set -e
  if [[ $VAL_EXIT -ne 0 ]]; then
    if [[ "$STATUS" == "shipped" ]]; then
      STATUS="validation-failed"
    fi
    echo "Validation failed for iteration $i. Working tree left as grok left it."
    echo "See $LOG_DIR/iteration-${i}-validation.log"
    if [[ "$STOP_ON_ERROR" == true ]]; then
      synthesize_handoff "$i" "$STATUS"
      update_memory "$i" "$STATUS"
      exit 1
    fi
  else
    echo "Iteration $i validated."
    if [[ "$STATUS" == "shipped" ]]; then
      ensure_version_bump "$BEFORE_VERSION"
    fi
    if [[ "$AUTO_COMMIT" == true && "$STATUS" == "shipped" ]]; then
      maybe_commit_and_release "$i" "$EMPHASIS"
    fi
  fi

  synthesize_handoff "$i" "$STATUS"
  update_memory "$i" "$STATUS"

  sleep 1
done

echo
echo "=== Loop finished (iterations $START_ITER–$END_ITER, focus=$FOCUS) ==="
echo "Artifacts: $LOG_DIR"
echo "Memory:    $MEMORY_FILE"
echo "Doctrine:  $DOCTRINE_FILE"
echo "Version:   $(app_version)"
echo
echo "Resume later:"
echo "  ./scripts/iterate-grok-improvements.sh --resume-run $RUN_NAME -n 6 --focus $FOCUS"
echo
echo "Open Helix and add two Outlook Faces. If they share a login or you still need a second window, keep looping."
