# Claude Handoff — Cozy Arcade PHASE2
**Date:** 2026-06-15, updated 2026-06-17 | For: Claude (new session) or any AI agent
**Rule #1: Do not write a single line of code until you have completed Steps 1–4 below.**

---

## WHO YOU ARE

You are a senior full-stack app architect with deep experience in:
- Anki/RemNote/FSRS spaced-repetition algorithms
- Duolingo-style gamified learning loops
- Single-file HTML/JS PWAs (mobile-first, iOS/Android packaging target)
- Debugging accumulated patch debt in legacy JS codebases

Your job is NOT to react immediately. Your job is to **read, list, confirm, plan — then and only then implement**. Junior AI mistakes in this codebase came from reacting to the surface symptom without reading the prior patch history. Do not repeat that pattern.

---

## WHAT THIS PROJECT IS (read once, internalize)

A single-file PWA (`index.html`, ~14,500 lines) for ABIM board exam prep.
- Two game modes: Solo Studying (4-choice runner) and Knowledge Expansion (orb arena)
- FSRS v5 spaced-repetition scheduling (replaces SM-2)
- Phase 3 owns all session/pool/progress logic
- Ships via GitHub Pages: PHASE2 serves `origin/public` branch (NOT main)
- PHASE1 (`cozy-arcade-app`) is a parallel repo — never cross-push
- All code lives in `index.html` — no separate JS files, no new `<script>` blocks
- Goal: function identically to Anki's FSRS algorithm

---

## STEP 1 — READ THESE FILES IN ORDER BEFORE ANY OUTPUT

Read each file completely. Do not skim. Do not produce output until all are read.

```
1. COZY_ARCADE_PROJECT_STATUS_2026-06-15.md   ← start here: current state + Codex task
2. SENIOR_DEV_AUDIT_2026_06_07.md             ← architecture audit, Sections 4, 19, 20
3. RECTIFIER_PLAN_2026_05_26.md               ← full fix queue, all addenda through 2026-06-15
4. Chronological_Patch_Hx_RECTIFIER_PLAN_2026_05_26.md  ← every patch session in order
5. ULTIMATE_GOALS.md                           ← root causes RC-1 through RC-12
6. GOAL.md                                     ← open bug inventory + gate log
7. AGENTS.md                                   ← Codex constraints + next task brief
8. CLAUDE.md                                   ← per-repo Claude rules (graphify, validation gates)
```

All files are in: `/Users/rebekahbetar/Documents/GitHub/cozy-arcade-app-PHASE2/`

---

## STEP 2 — PRODUCE THIS LIST BEFORE ANYTHING ELSE

After reading, output ONLY the following. No code. No fixes. No opinions yet.

```
## What I Read — Confirmation List

**Current SW version:** [from status file]
**Last commit:** [from chronological hx]
**FSRS validation last confirmed:** [17/17 date and session]

**Open bugs (copy from GOAL.md Open Bug Inventory):**
| ID | Severity | One-line description | Status |
...

**Fixes applied this session (2026-06-15):**
| ID | Commit | What changed |
...

**Constraints I must not violate:**
1. [list each invariant]
...

**What the next Codex task is supposed to do (from AGENTS.md):**
[one paragraph summary in your own words]

**What I think the user's current top complaint is:**
[one sentence]

**Risks I see before touching any code:**
[numbered list, most dangerous first]
```

Do not proceed to Step 3 until the user confirms this list is accurate.

---

## STEP 3 — RUN VALIDATION GATES (before any code change)

Open `index.html` in browser (or use the Codex Playwright probe). Run:

```javascript
window.runFSRSValidation()   // must return 17/17 — if not, STOP and report
window.runCozySmokeTests()   // must return 6/6 — if not, STOP and report
```

Then run the rating path spot-check (the critical regression test):
```javascript
// In browser console — reset a test card, call rate(), wait 10s, check result
delete window.phase3State.progress['rp-t1'];
window.current = {id:'rp-t1',qid:'rp-t1',diagnosis:'Acromegaly',presentation:'Test',sys:'Endo'};
window.choices = ['Acromegaly','Wrong1','Wrong2','Wrong3'];
// Simulate correct auto-select then explicit Again:
window.selectSolo(0);                      // correct answer at lane 0
setTimeout(()=>window.rate(window.current,'again'), 500);  // explicit Again
// Wait 10 full seconds, then:
setTimeout(()=>console.log(JSON.stringify(window.getProgress('rp-t1'))), 10500);
// Expected: last_rating='again', stage='relearning' — NOT 'good'
```

Report the validation results. If any gate fails, **stop and diagnose before proceeding.**

---

## STEP 4 — WRITE YOUR PLAN (no code yet)

Write a numbered implementation plan for the specific task you are about to do.
For each step include:
- Exact file and line number target
- What the current code says
- What it will say after your change
- What validation you will run after that single change

Example format:
```
Step 1: FQ-RENDER-1 — add clearSoloDrop() to startStableSoloDrop351
  File: index.html, line 6951
  Current: try{clearInterval(ticker);}catch(e){}
  After:   try{clearSoloDrop();}catch(e){} try{clearInterval(ticker);}catch(e){}
  Why: cancels System 2's raf175164 before System 3 starts, stops dual selectSolo fire
  Validate: runFSRSValidation() 17/17 + runCozySmokeTests() 6/6

Step 2: ...
```

Do not begin coding until this plan is written and the user has approved it (or you have confirmed it against the task brief in AGENTS.md).

---

## STEP 5 — IMPLEMENT (one change at a time)

- Make ONE change
- Run `runFSRSValidation()` 17/17 + `runCozySmokeTests()` 6/6
- Confirm pass before next change
- If either fails: revert that change, diagnose, do not proceed
- Bump `sw.js` CACHE version string ONCE after all changes in a session pass
- Port the same change to PHASE1 after PHASE2 validates

---

## CURRENT BUG PRIORITY (as of 2026-06-15)

### P0 — Confirmed fixed, do not regress
| ID | Fix | Commit |
|---|---|---|
| FQ-ALGO-1 | Explicit rating cancels deferred auto-rate (Again no longer overwritten by good) | 048d073 |
| FQ-AUTO-1 | `selected=0` on undo restore (runner not biased toward correct lane) | 8eb10a4 |
| FQ-RENDER-2 | `document.body.className` save/restore in System 2 render path | line 3939 |
| FQ-DUE-1 | `getStudyPool('due')` filters `isDue\|\|pinned` before sort | dfb2ecc |
| FQ-DUE-1b | Phase 3 `cardPool('due')` fallback: pinned-only (not all cards) | 477b25e |
| Test A | Auto-correct writes FSRS immediately via rateOnce-first | 477b25e |
| Dead writes | LEGACY_STATE_KEYS loop, Atlas STATE_KEYS, spacedOn v1759/v175157, cozy_persona | dfb2ecc (PHASE2), b0defd5 (PHASE1) |

### P1 — Fix next (CURRENT PRIORITY)

**User-visible symptom: correctly-answered cards circle back in Shadow Dungeon.**
**Codex browser audit: tests A/H/I/M now fixed. K still open. Render fixes applied but unvalidated.**

| ID | What | Where | Fix |
|---|---|---|---|
| **FQ-POOL-1** | Pinned cards pass `isDue\|\|p.pinned` every pool pass — no `buriedToday` protection after correct rating → pinned cards always recirculate | `rateCard()` ~line 11261 | Add `session.buriedToday.add(cardId)` for good/easy ratings regardless of pinned status (already done for hard/good/easy via `buried=true`) — the issue is the filter in pool building, not rateCard. See `cardPool` line ~11497 filter. |
| **FQ-POOL-2** | Shadow Dungeon 'random'/'spaced' scopes don't filter `session.buriedToday` or `session.seenThisSession` — cards rated good/easy come back immediately | `cardPool()` non-'due' branches ~line 11535 | Apply `splitBuriedToBack` + seenThisSession filter to all scopes, not just 'due' |
| **FQ-DATA-1** | `repair_point=True` never cleared when answer is correct — cards stay in always-due pool forever | `record()` or `rateCard()` | Add `repair_point: false` when `rating==='good'\|\|\|easy'` in `rateCard` setProgress call |
| **FQ-RENDER-1** | clearSoloDrop() fix applied but not browser-validated — selectSolo may still fire twice | `startStableSoloDrop351` line ~6951 | Browser validate: count selectSolo fires per card (expect 1) |
| **FQ-RENDER-3** | Bionic guard applied but not browser-validated — font may still flicker | `installBionicQuestionPatch352` line ~7446 | Browser validate: MutationObserver write count (expect 1) |

### P2 — Fix after P1 clears
| ID | What |
|---|---|
| FQ-ALGO-3 | 18 review-stage rows null next_due_at — always due |
| FQ-ALGO-4 | Again not requeued same session (Anki gap) |
| FQ-DATA-2 | wrong_count bloat from legacy counter |
| FQ-ALGO-6 | K: wrong_count conflates lane accuracy + self-rating |
| State-B | Deck restore after hard reload (Cards 0 / Reviewed 93) |

### P3 — After P2
| ID | What |
|---|---|
| FQ-ALGO-5 | stability/difficulty not written on good/hard/easy reviews |
| M2 | Stripe Payment Link |
| iOS1 | Capacitor scaffold |

---

## HARD CONSTRAINTS — OVERRIDE EVERYTHING ELSE

These are non-negotiable. If a fix requires violating one, the fix is wrong.

1. **No new `<script>` blocks** — all edits are inline in existing source
2. **No new `cardPool` or `nextCard` wrappers**
3. **Never cross-push PHASE1 ↔ PHASE2** — separate repos, separate deploys
4. **`runFSRSValidation()` 17/17 + `runCozySmokeTests()` 6/6 after every change**
5. **Bump `sw.js` CACHE version on every code-change commit** (each repo separately)
6. **Frozen localStorage keys** — never rename:
   `soloStudyingState_v1757`, `cozy_arcade_progress_v1`, `cozy_arcade_persona_v1`,
   `cozyQuestionSeconds351`, `cozy_arcade_limitless_cards_v1`, `bionicOn_v1751523`
7. **selectSolo chain is 11 layers — do not add layer 12**
8. **Codex prompts: under 80 lines, no CDP infra, port both repos in same prompt**
9. **No backtracking** — do not undo fixes from commits 048d073, 8eb10a4, or prior rectifier sessions

---

## WHAT SURVIVES HARD RESET (for debugging reference)

Command+R does NOT clear any app state. Only DevTools → Application → Clear site data resets fully.

| Storage | Key | Clears on |
|---|---|---|
| localStorage | `cozy_arcade_state_v3` (canonical) | Manual clear only |
| localStorage | `cozy_arcade_limitless_cards_v1` (deck) | Manual clear only |
| localStorage | `cozy_arcade_progress_v1` (progress mirror) | Manual clear only |
| sessionStorage | `cozy_energy_session_352` | Tab close |
| SW cache | `cozy-arcade-PHASE2-v18` → serves `./index.html` | Unregister SW or `Clear site data` |

The "Cards 0 / Reviewed 93 / Pinned 41" display is NOT a data bug — it is a deck/progress desync. Progress always restores; deck only restores if `cozy_arcade_limitless_cards_v1` parses and `normalizeDeckIdentities()` runs successfully. Fix is Phase B (State-B), not urgent.

---

## THE NEXT CODEX TASK (copy-paste ready)

The full combined prompt (Step 1: rating audit → Step 2: FQ-RENDER-1 + FQ-RENDER-3 fixes → Step 3: re-audit) is in:

```
COZY_ARCADE_PROJECT_STATUS_2026-06-15.md
Section: "CODEX TASK — COPY THIS ENTIRE BLOCK INTO CODEX"
```

Read that section, confirm you understand the 9-test rating matrix and the two inline fixes, then proceed.

---

## ANTI-PATTERNS — WHAT WENT WRONG BEFORE (do not repeat)

| Mistake | What happened | Correct behavior |
|---|---|---|
| Reacted without reading prior patches | Added wrapper that duplicated existing logic | Read Chronological_Patch_Hx first |
| Added new `<script>` block instead of editing existing source | Patch stack grew to 12+ wrappers | Edit in-place only |
| Targeted wrong line from static analysis | Claude said line ~832, active bug was line ~3939 | Run browser instrumentation probe first |
| Diagnosed wrong system (System 1 RAF vs System 3) | Codex wasted time on non-active code path | Confirm with instrumented browser trace |
| Fixed symptom without reading root cause log | Same bug recurred next session | Read ULTIMATE_GOALS.md RC log before coding |
| Combined multiple fixes in one commit | When it failed, unknown which change caused it | One fix → validate → commit → next fix |
| Did not bump SW cache | Users got stale HTML after deploy | Always bump `sw.js` CACHE in same commit |
| Wrote validation script that didn't wait for deferred timers | FQ-ALGO-1 probe gave false pass | Wait 10+ seconds for 8.2s deferred timer to settle |
| Gated Codex on safaridriver without pre-enabling | Codex blocked, no edits made, wasted run | Use Node static check + manual console commands; safaridriver needs Safari → Develop → Allow Remote Automation enabled by user first |
| Assumed clearSoloDrop() stops all timers | System 0 raf (line 756) not cancelled — SS#2 still fired | Use window.stopAllDropTimers() (line 880) to cancel System 0; clearSoloDrop() only kills System 2 raf175164 |
| Fixed bionic guard in installBionicQuestionPatch352 but not the first write | System 0 renderSolo wrote plain text first; guard only prevented re-write | Fix System 0/2 renderSolo to use (window.bionic\|\|bionic) so first write is already correct |

---

## CURRENT STATE (2026-06-17)
**SW:** PHASE2 v24 (948abe7) | PHASE1 v59 (2e04efd)

| ID | Status | Notes |
|---|---|---|
| FQ-RENDER-1 | ⚠️ Applied, awaiting browser validate | System2 tick DOM class guard (948abe7). 3 prior attempts failed — see below. |
| FQ-RENDER-3 | ✅ Applied | `(window.bionic\|\|bionic)` on all soloQuestion writes (8a22e66). Bionic present in browser. |
| FQ-ALGO-3 | ❌ Open | 18 null next_due_at — P5 prompt in AGENTS.md |
| FQ-ALGO-4 | ❌ Open | Again requeue — P6 prompt in AGENTS.md |

## CRITICAL LESSON: clearSoloDrop() IS IIFE-SCOPED
`clearSoloDrop()` lives inside System 2's IIFE. Calling it from outside (including stable mode's IIFE)
always throws ReferenceError, silently caught by try/catch. Three fix attempts failed because of this:
1. dfb2ecc — added clearSoloDrop() to SS351 start → ReferenceError silent
2. 8a22e66 — added stopAllDropTimers before clearSoloDrop → same
3. ebeef5e — loopSolo reassignment → System2 renderSolo calls startDrop() directly, bypasses loopSolo
Current fix (948abe7): System2 tick checks `choiceRow.classList.contains('soloStableDrop351')` — DOM signal, no cross-IIFE dependency.

Next: AGENTS.md → validate 948abe7 → P5 → P6.

---

*This handoff was generated 2026-06-15, updated 2026-06-16. For prior session history see `Chronological_Patch_Hx_RECTIFIER_PLAN_2026_05_26.md`.*
*Full root cause log: `ULTIMATE_GOALS.md` RC-1 through RC-12.*
*Architecture audit: `SENIOR_DEV_AUDIT_2026_06_07.md` Sections 1–20.*
