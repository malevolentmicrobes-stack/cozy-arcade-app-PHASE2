# Claude Handoff — Cozy Arcade PHASE2
**Date:** 2026-06-15, updated 2026-07-04 | For: Claude (new session) or any AI agent
**Rule #1: Do not write a single line of code until you have completed Steps 1–4 below.**

**Rule #2, added 2026-07-04 after this exact mistake wasted a full day twice: never report a fix as "live"/"deployed" on trust — verify with a live curl every time, even if a doc says it was already confirmed.** A 2026-06-24 doc entry (`PAGES-SOURCE-BRANCH` in OPEN_DIFFERENTIALS.md) claimed Pages Source had been switched to `main` and verified live. It hadn't actually stuck (or silently reverted) and nobody re-checked for 10 days — `main` advanced 15+ commits with zero live effect the whole time. Before ever saying "this is live now": `curl -s https://malevolentmicrobes-stack.github.io/<repo>/sw.js | grep CACHE` and compare to local. Full incident + the permanent fix (a `.github/workflows/pages.yml` safety-net workflow that keeps `public` synced to `main` regardless of which branch Pages Source actually points to) is in OPEN_DIFFERENTIALS.md's `DEPLOY-STALE-GATE` entry — read it once, then apply the rule automatically forever.

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

*This handoff was generated 2026-06-15, updated 2026-06-17. For prior session history see `Chronological_Patch_Hx_RECTIFIER_PLAN_2026_05_26.md`.*
*Full root cause log: `ULTIMATE_GOALS.md` RC-1 through RC-12.*
*Architecture audit: `SENIOR_DEV_AUDIT_2026_06_07.md` Sections 1–20.*

---

## ADDENDUM 2026-06-17 — AUTONOMOUS SESSION PROTOCOL

**The user must never manually copy-paste handoff content. Claude owns all file updates.**

### CORRECTED SW STATE (as of 2026-06-17 end-of-day)
| Repo | SW | Last commit | P5 FQ-ALGO-3 | P6 FQ-ALGO-4 |
|------|----|---------|----|---|
| PHASE2 | **v26** | 0d12676 | ✅ fixed | ✅ fixed |
| PHASE1 | **v61** | 65ddcdf | ✅ fixed | ✅ fixed |

The CURRENT STATE block above showing v24 is stale. v26/v61 is correct.
OPEN_DIFFERENTIALS.md is always the authoritative source of truth for bug status.

---

### CANONICAL FILE ROLES (Claude reads these in order at session start)

| File | Role | Update frequency |
|------|------|-----------------|
| `OPEN_DIFFERENTIALS.md` | Living browser bug log — source of truth | Every Codex session |
| `COZY_ARCADE_PROJECT_STATUS_YYYY-MM-DD.md` | Session summary + production state table | Every session |
| `AGENTS.md` | Codex task queue — SW version header + copy-paste prompts | Every session |
| `CLAUDE_HANDOFF_YYYY-MM-DD.md` | Session constraints + anti-patterns for new Claude | When constraints change |
| `CODEX_PROMPT_N_*.md` | Ready-to-paste Codex prompt for current task | Created when task is defined |

**If files contradict each other: OPEN_DIFFERENTIALS wins for bug status; AGENTS.md wins for SW version.**

---

## ADDENDUM 2026-06-28 — BOARD TRIGGER CLEAN + POOL TIMING FIX

### SW STATE
| Repo | SW | Key changes |
|------|-----|-------------|
| PHASE2 | **v60** | v59: board trigger clean fix; v60: wrappedSelect pool timing fix |
| PHASE1 | **v95** | v95: wrappedSelect pool timing fix (same as PHASE2 v60) |

### FIXES APPLIED THIS SESSION

**v59 — PHASE2 only — Board Trigger clean inconsistency (index.html)**
- Root cause: `ensureBoard` (line 6749) and live root (line 7128) used the IIFE-local `clean` (line 5824) which does NOT strip "NOT SPECIFIED IN SOURCE"; `renderRevealSections` used a different local `clean` (line 8649) that DOES strip it. Cards with placeholder text showed board trigger visible for 1 frame, then hidden.
- Also: neither location set `board.dataset.boardSig`, causing `renderRevealSections` to re-render the board trigger on every reveal even when live root already rendered it correctly.
- Fix: both locations now strip "NOT SPECIFIED IN SOURCE" inline before `safeBionic()`, AND set `board.dataset.boardSig = String(card.board_trigger||'')` to allow `renderRevealSections` to skip redundant re-renders.
- Nephrolithiasis stuck-board-trigger bug confirmed resolved by this fix.

**v60 — BOTH REPOS — wrappedSelect premature seenThisSession (index.html)**
- Root cause: `wrappedSelect` (cozy-rating-path-rectifier, ~line 14458 PHASE2 / ~14893 PHASE1) called `rateOnce(card,rating)` synchronously at selection time. `rateOnce` → `rateCard` → `rate` → `wrappedRate` → `seenThisSession.add(card)`. This updated `seenThisSession` BEFORE `advance()` fired. When `advance()` ran and `nextCard()` rebuilt the filtered pool, the pool was already smaller by 1 card with `index` pointing to the pre-rebuild position — causing `current` to land on an unexpected card. Board trigger then showed that unexpected card's content ("stuck on an alternative question"). The surge review toast (n=10) also previewed the wrong card's board_trigger for the same reason.
- Fix: replaced `if(!rateOnce(card,rating)) pendingFor(card,rating); else {...}` with `pendingFor(card,rating)`. `wrappedAdvance` already calls `rateOnce` correctly at line 14490 (before `priorAdvance.apply()`), committing the rating and updating `seenThisSession` at the correct pool-transition moment.
- This worked before SM2 patches. This is why: pre-patch `selectSolo` never touched `seenThisSession`. SM2 patch introduced the synchronous rating at select time.

### CARD STATE CONTEXT (deck session 2026-06-28)
- RHEUM-003 = popliteal cyst card; state=review, last_rating=good, due 2026-07-01
- Deck: 60 cards total — 28 new, 21 review, 11 relearning
- "new-in-order"/"random new" + mixed relearning cards = pool rebuilds frequently = amplified the pool-index misalignment bug

### VALIDATION REQUIRED BEFORE PUSH
```
window.runFSRSValidation()   // 17/17
window.runCozySmokeTests()   // 6/6
```
Visual check: board trigger shows correct card's content immediately on reveal; n=10 surge review toast previews the NEXT card (not current or previous).

---

### CLAUDE SESSION-END CHECKLIST (run before every response that ends a session)

Claude runs these updates autonomously. Never ask the user to do this.

```
1. OPEN_DIFFERENTIALS.md
   - Add new ❌ rows for any bugs confirmed this session
   - Update ✅ rows for anything fixed (add commit hash)
   - Add 🔍 rows for new differentials from Codex STEP 1 output
   - Never delete rows — change status only

2. COZY_ARCADE_PROJECT_STATUS_YYYY-MM-DD.md
   - Update SW version line at top
   - Update PRODUCTION STATE table (✅/❌ per fix)
   - Add new session block with commit log + errors made

3. AGENTS.md
   - Update "Current SW" header line (PHASE2 vN / PHASE1 vN)
   - Mark completed tasks — remove or archive their prompt blocks
   - Set "Current Task" to next Codex prompt filename

4. CLAUDE_HANDOFF (this file)
   - Update CORRECTED SW STATE table in this addendum
   - Add new ANTI-PATTERNS if session revealed new failure modes

5. CODEX_PROMPT_N+1_*.md
   - Create next Codex prompt file if the current one is done
   - Under 80 lines, differential-first structure (see CODEX_PROMPT_4 as template)
```

---

### DIFFERENTIAL-FIRST MANDATE (applies to ALL Codex prompts)

Every Codex prompt MUST include a STEP 1 differential block BEFORE any fix:

```
STEP 1 — DIFFERENTIAL: List top 5 probable browser-only runtime failures
ranked HIGH/MED/LOW from the commits/changes being validated.
Format: [PROB:HIGH] ID — symptom — why grep misses it
Do NOT fix yet. Send list to Claude for OPEN_DIFFERENTIALS premortem log.
```

**Why this prevents glitches:** Static HTML analysis misses closure capture order,
IIFE scoping, RAF timing, MutationObserver inflation, and SW cache staleness.
Listing differentials first forces Codex to think before acting and surfaces
the failure mode that 3 prior FQ-RENDER-1 attempts missed.

---

### TOKEN EFFICIENCY RULES

| Rule | Saves |
|------|-------|
| Codex prompts under 80 lines with exact line numbers | ~40% — eliminates exploration loops |
| STEP 0 gates before any fix | ~15% — stops wasted fix work if app is broken |
| Differential list before fix | ~20% — prevents wrong-direction fixes (saved 3 FQ-RENDER-1 attempts) |
| No safaridriver gate in prompt | ~10% — safaridriver needs user pre-enable; use CDP/console probes instead |
| One fix → validate → commit (no batching) | prevents rollback cost |
| Port both repos in same Codex session | halves handoff overhead |
| Claude auto-updates all files at session end | eliminates user copy-paste overhead entirely |

---

### OPEN_DIFFERENTIALS QUICK REFERENCE

File: `OPEN_DIFFERENTIALS.md`

| Status | Meaning |
|--------|---------|
| ✅ CONFIRMED FIXED | Browser-validated with commit hash |
| ⚠️ MITIGATED | Partially addressed, residual risk noted |
| ❌ OPEN | Confirmed in browser, not yet fixed |
| 🔍 MONITORING | Not yet browser-confirmed, worth watching |
| ⬛ BY DESIGN | Intentional, not a bug |
| ✗ DISPROVED | Static analysis claim proven wrong by browser |

**Claude adds rows from Codex STEP 1 output as 🔍 MONITORING.**
**Codex updates rows to ✅ or ❌ after browser tests in STEP 2.**
**Never delete rows — stale disproved items prevent future AI agents from repeating failed approaches.**

---

### NEXT CODEX TASK — re-listed 2026-06-19, ~5:00pm

**CODEX_PROMPT_4 through CODEX_PROMPT_12 are complete.** Five real bugs found and closed in the 2026-06-18/19 window:

| Bug | Fixed by | Commits |
|---|---|---|
| FQ-ALGO-7 (Again-card pool reshuffle regression) | Claude, no Codex credits that session; later browser-confirmed correct via PROMPT_11 | PHASE2 `c2807ac` / PHASE1 `b9168f5` |
| FQ-RENDER-5 ("AUTO-SELECT IN" warning ghosting, 4th patch attempt at this symptom) | Codex, PROMPT_10, validated 3 consecutive cycles before push | PHASE2 `fb09afa` / PHASE1 `2c8f4ce` |
| DOMAIN-AGAIN-DUPE (card 4x-duplicated in Domain pool) | Codex diagnosed (PROMPT_12), Claude fixed (stale PHASE1-only `requeueAgainCard`) | PHASE1 `2b84281` (PHASE2 needed no change) |
| FQ-DATA-2 (wrong_count inflation — **the 2026-06-17 "fix" was dead code, never actually worked**, user caught it via their own progress export) | Claude | PHASE2 `88af09e` / PHASE1 `0b4482a` |
| REVEAL-TRIGGER-CHURN / DATA-EO-ALIAS (reveal-panel flash + diagnosis duplicated into Educational Objective box) — see below, **mitigated not fully consolidated** | Claude + Codex, independently converged | PHASE2 `7bf4273` / PHASE1 `b91cf8f` |

**Reveal-panel fix detail:** user reported "card glitch/flashing." Claude's deep-think source analysis found `renderRevealSections()` (the deferred, final writer in `reveal()`'s 17-layer chain) had no fallback when `educational_objective` was empty. Codex independently ran a live-browser pre-mortem (`CODEX_PREMORTEM_REVEAL_GLITCH_2026-06-19.md`), confirmed 55-57 DOM mutations per reveal, and found something deeper: `educational_objective` can get contaminated to literally equal `diagnosis` (traced to `canonicalizeCard()` aliasing `answer`). Claude verified Codex's finding directly and discovered the same anti-pattern recurs in **8 places**, not 1 — and the specific function Codex's test exercised is dead code in normal play (only reachable via a mode never used live). Applied one targeted fix at `renderRevealSections`: fallback to `board_trigger||quick_recall` when `educational_objective` is empty-or-contaminated, plus an idempotency guard (mirrors the One Thing box's existing, proven pattern) so unchanged content doesn't get rewritten. Did NOT touch the other 7 sites, the 900ms reveal-refresh interval, or attempt Codex's recommended full chain consolidation — logged as deliberate future work, not forgotten.

**Two diagnostics still queued, independent of the above:**
1. `CODEX_PROMPT_13_FQ_ALGO_8_WRONG_RATED_GOOD_DIAGNOSTIC.md` — user observed a timer-expired wrong auto-select get rated 'good'. Suspect: `advance()`'s 7-layer wrapper chain (table in AGENTS.md) defaults to 'good' when no pending rating matches; the guard meant to prevent this looks correct in isolation, so the real trigger isn't confirmed.
2. `CODEX_PROMPT_14_D4_MUTATION_FLASH_DIAGNOSTIC.md` — largely superseded by the reveal-panel fix above; left open pending re-test rather than closed on assumption.

**Decision rule established today, now applied five times:** deterministic, provable bugs (pure data transforms, array logic, field-fallback corrections — FQ-ALGO-7, FQ-DATA-2, the reveal-panel fix) get diagnosed and fixed directly by Claude, verified via JXA simulation (`osascript -l JavaScript`) against real data when no node/Playwright is available, then pushed — but scoped to the smallest verifiable correction, even when a larger related problem is found along the way. Anything involving event timing, multiple competing wrapper layers, or visual motion as the *primary* mechanism (FQ-RENDER-5, DOMAIN-AGAIN-DUPE, FQ-ALGO-8) gets a live diagnostic first — no exceptions, regardless of how confident the source-level suspect looks.

Remaining non-Codex work:
- iOS1 finish: user runs `npx cap add ios` → `npx cap sync` → opens `ios/` in Xcode
- M2 Stripe: **PAUSED by user 2026-06-18** ("too many glitches") — do not resume without explicit request
- DOMAIN-RECORD-ZERO (OPEN_DIFFERENTIALS.md): still needs user intent decision — this is a product-intent question, not a technical one, so it stays a stop-and-ask item under the protocol below
- REVEAL-TRIGGER-CHURN/DATA-EO-ALIAS full consolidation (the other 7 contamination sites, the 900ms interval, the 17-layer chain) — real, documented, deliberately not urgent

---

## ADDENDUM 2026-06-18 — AUTONOMY PROTOCOL v2

**User directive verbatim:** "be more autonomous, I don't have time for this back and forth... reduce bulk no quick patches — review prior patch log first + rectifier plan."

This extends the 2026-06-17 autonomous session protocol above. That protocol covered *file updates*. This covers *decisions* — when Claude proceeds without asking, and when it must still stop.

### Claude decides alone (no round-trip to the user):

- **Revert vs. fix-forward**, whenever one option is strictly smaller/safer. Default to revert unless fixing forward is clearly low-risk. Document the decision and reasoning inline in OPEN_DIFFERENTIALS.md and AGENTS.md — the user reads the log, not a chat message, to see what was decided.
- **Root-cause diagnosis depth.** Before writing any Codex prompt for a render/timer/pool bug, Claude must first read the existing patch-history table (AGENTS.md "STOP — Read Before Any Render Work") and OPEN_DIFFERENTIALS.md for the same subsystem, and check: *has this exact symptom been patched before and failed?* If yes, the new prompt must explain why this attempt differs from the failed ones — not just retry the same shape of fix. (This is what FQ-RENDER-5 required: three prior attempts at the same symptom had each fixed a narrower slice than the real loop.)
- **Drafting and queuing Codex prompts** — Claude writes ready-to-paste `CODEX_PROMPT_N_*.md` files and updates AGENTS.md's "Next task" without waiting for approval, as long as the fix follows existing hard constraints (no new wrapper layers, single-fix-per-prompt, both repos, gates first).
- **All four tracking-doc updates** at session end (already established 2026-06-17).

### Claude still stops and asks:

- **Product-intent questions with no technically-correct answer** — e.g. DOMAIN-RECORD-ZERO ("should an unrated wrong answer leave an FSRS trace?"). These are the user's call, not an engineering tradeoff.
- **Anything irreversible or affecting money/external systems** — force-pushes beyond the established `main:public` deploy pattern, Stripe/payment changes, deleting data.
- **A genuine architecture fork** — e.g. if fixing something properly would require breaking one of the hard constraints (adding a wrapper layer, touching the 11-layer selectSolo chain, renaming a localStorage key). Flag it, don't just do it.

### Codex decides alone within a prompt's scope:

- Exact variable/flag names, minor implementation shape, which of the prescribed validation steps to run first.
- Whether System0 is live or dead code in practice (STEP 1 differential calls for Codex to determine this and report it, not ask Claude mid-session).

### Codex still stops and reports back without finishing:

- If STEP 1's differential reveals the root cause is **not** what the prompt assumed.
- If a fix would require touching index.html in a repo other than the one specified, or adding a new `<script>` block / new cardPool/nextCard wrapper.
- If a validation step fails after the fix is applied — report STEP 1-3 findings, do not retry blindly or paper over with a second patch in the same session.

---

## ADDENDUM 2026-06-28 — Knowledge Pulse Toasts + oneThing Flash (v50→v56 / v86→v92)

**Context:** Session continued oneThing350 multi-observer work from 2026-06-24. Codex review identified stale measurement carryover as the real bug (not the 5 static-analysis bugs Claude initially ranked). Three bugs fixed this session; one open.

### What Changed

| Commits | Bug | Root Cause | Fix |
|---------|-----|-----------|-----|
| PHASE2 v53 / PHASE1 v89 | Toast click-blocking in Domain mode | `pointer-events:none` on `.pulseToast351` was inside `.cozyGameShellActive371` guard; `renderDomain()` clears `body.className` mid-game | Moved `pointer-events:none` to base rule, unconditional |
| PHASE2 v53 / PHASE1 v89 | Toast stacking | `showPulseToast()` appended without clearing prior toasts | Added `querySelectorAll('.pulseToast351').forEach(t=>t.remove())` at top of `showPulseToast()` |
| PHASE2 v55 / PHASE1 v91 | Wrong milestone toast (SYSTEM SURGE instead of BOARD TRIGGER UNLOCKED at n=10) | `else if` chain was 5→10→25→50; `n=10` matched `n%5===0` first. Also: PHASE2 fallback `peekNextCard()` had `+1` index offset | Reordered to 50→25→10→5; fixed PHASE2 fallback index |
| PHASE2 v56 / PHASE1 v92 | Prior card One Thing text flashing one frame on new reveal | `wrappedAdvance` cleared dataset flag but not `innerHTML`; `renderRevealSections()` deferred via `setTimeout(0)` leaves 1-frame stale DOM gap; `renderOneThingStable351` trusted stale measurement when card key changed | `wrappedAdvance` clears `innerHTML` + `oneThingStableRenderSig` (guarded vs. active textarea); measurement guard tightened to check `oneThingStableKey===key` |

**Lesson burned in this session:** with `else if`, highest-specificity divisor must come first — `n%5` is always true when `n%10` is true, so 5 listed before 10 silently swallows the 10 case.

### What Is Still Open

**BOARD-TRIGGER-PREVIEW-TIMING (not yet browser-confirmed):** `peekNextCard()` reads the pre-advance pool. By the time the next card is actually selected, `poolKey()` has changed (includes `seenThisSession.size`, which updates inside `wrappedRate`), pool has rebuilt, and `index` reset to 0. The preview card shown in the n=10 toast likely ≠ actual next card. Needs browser harness: log `peekNextCard().id` vs `current.id` after advance at 9→10 correct, then decide strategy.

**MULTI-OWNER-CLEANUP (Codex post-test recommendation, low urgency):** Competing card import normalizers, no single progress-merge owner, multiple independent reveal writers, unguarded localStorage deck restore (`cozy_arcade_limitless_cards_v1`, PHASE2 line ~8430). Documented in OPEN_DIFFERENTIALS.md. Do not fix opportunistically — scope as a dedicated cleanup pass.

**5 remaining sources for prior-card/refresh/progress glitch (Codex post-test):** Fix is good for oneThing DOM specifically but broader glitch not closed. Codex flagged: (1) stale card object persisting across advance, (2) multiple competing reveal writers, (3) progress merge split between state/phase3State, (4) localStorage deck restore firing unconditionally, (5) pool rebuild timing. No single commit closes this family.

### State at Handoff

- SW: PHASE2 `cozy-arcade-PHASE2-v56` (commit `e21abcd`) | PHASE1 `cozy-arcade-v92` (commit `4b0ab35`)
- Both repos: pushed, user-browser-validated, working trees clean
- Validation gates still passing: `window.runFSRSValidation()` 17/17, `window.runCozySmokeTests()` 6/6
- `runSRSValidation()` (obsolete SM-2) expected to fail — not a regression signal
- Next Codex task if scoped: Board Trigger preview timing harness (log peek vs. actual at 9→10)
