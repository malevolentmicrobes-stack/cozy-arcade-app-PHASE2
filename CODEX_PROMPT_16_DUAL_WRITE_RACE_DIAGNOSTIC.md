# CODEX_PROMPT_16 — Dual-Write Race Diagnostic (PHASE2, then PHASE1)

**Diagnostic only. Do not fix anything yet. Report findings back to Claude.**

## Background

Two independent card systems exist in this file and both persist to the SAME
localStorage key, `cozy_arcade_limitless_cards_v1`, with no merge contract:

- "Limitless" system: `normalizeLimitlessCard()` (~line 8396), `normalizeDeck()`
  (~8445), an older `wire()` with its own capture-phase `change` listeners on the
  5 upload input IDs (~8565).
- "Phase3/Canonical" system: `importObjectPhase3()`, `normalizeCardIdentity()`,
  `setAppCards()` (~10847), `wireFileInputs()` (clone-and-replace ownership of the
  same 5 input IDs, re-asserted every 1000ms).

Whichever system's write happens to run last for a given action wins, silently.
This is suspected to be the root cause behind today's two rounds of sparse-card
diagnosis-pollution (each "fixed" the data-fabrication symptom but never touched
this race) and possibly other intermittent card-state oddities reported tonight.

## STEP 1 — Differential list before any fix

List every plausible mechanism for how the two systems could clash for a given
upload/page-load, in probability order, before touching anything. Include at
least: write-order timing, listener-ownership timing (which system's `change`
listener is attached when the file dialog actually closes), and whether either
system's localStorage write can be skipped under some condition (e.g., empty
array guard) letting the other's stale write "win" by omission.

## STEP 2 — Real-browser instrumentation (real Upload button + file chooser only, no direct function calls)

1. Load the page fresh (clear storage once at the very start only).
2. Upload a real JSON deck through the actual Upload button (any deck used
   tonight is fine — TEST_106.json or a small synthetic one).
3. Immediately after the upload completes, capture and log:
   - `localStorage.getItem('cozy_arcade_limitless_cards_v1')` (full JSON)
   - `window.phase3State.cards?.length`
   - `window.appCards().length` / `window.cards?.length`
4. Reload the page (normal reload, not a hard/cache-busting reset) and re-capture
   all three again.
5. Repeat steps 2-4 three times total. Note whether the outcome (which system's
   data is present, card count, any field differences) is consistent across runs
   or timing-dependent.

## STEP 3 — Home button check (cheap, same session, related finding)

`standardHud()` disables the floating `#homeTopBtn` citing a replacement
function, `normalizeHud()`, that no longer exists anywhere in the file. The
actual replacement appears to be `renderHudControls()`, which only patches
`renderSolo`/`renderDomain` (Solo/Domain gameplay only) and is wrapped in a
silently-swallowing `try/catch`.

- Start a Solo session, let at least 5 cards render in sequence.
- On each card, check: is `#homeTopBtn` visible+clickable, OR does a HUD-embedded
  home/exit control exist and work? Is there ever a card where NEITHER is present?
- Repeat once for Domain mode.

## Report format

For each step: what you observed (not what you expected), exact values logged,
and whether the result was consistent across repeats. Flag anything that
contradicts the background description above — don't assume it's right just
because Claude wrote it down first.

## Constraints

- No code changes this round.
- Real UI controls only (Upload button, file chooser, gameplay) — no direct
  function invocation, no synthetic state injection.
- `runFSRSValidation()`/`runCozySmokeTests()` not required for a diagnostic-only
  pass, but note if either gate is broken incidentally.
