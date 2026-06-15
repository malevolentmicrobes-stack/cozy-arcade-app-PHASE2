# Cozy Arcade — Project Status, Test Suite & Next Steps
**Date:** 2026-06-15 | **Active branch:** PHASE2 main → origin/public (production)
**SW version:** cozy-arcade-PHASE2-**v20** | **PHASE1 SW:** v55 | Last commits: PHASE2 `477b25e`, PHASE1 `b0defd5`

---

## DEPLOYMENT ARCHITECTURE (never cross-push)

| Repo | Dev branch | Production branch | Rule |
|------|-----------|-------------------|------|
| PHASE2 | `main` | **`origin/public`** | Worktree push only |
| PHASE1 | `main` | `main` | Push to main = live |

**PHASE2 worktree push:** `git worktree add /tmp/pub origin/public` → commit → `git push origin HEAD:public` → remove worktree

---

## CURRENT PRODUCTION STATE (2026-06-15)

| Fix | ID | Status | Commit |
|-----|----|--------|--------|
| Timer 15s caps + dropdowns | — | ✅ | live |
| SW network-first | — | ✅ v18 | live |
| FQ-AUTO-1: `selected=0` on undo | FQ-AUTO-1 | ✅ | 8eb10a4 |
| Explicit rating cancels deferred timer | FQ-ALGO-1 | ✅ | 048d073 |
| Again requeue respects next_due_at | FQ-ALGO-1b | ✅ | 048d073 |
| body.className save/restore (System 2 render) | FQ-RENDER-2 | ✅ | line 3939 |
| ArrowUp keyboard close Full Card | FQ-NEW-3 | ✅ | live |
| Dual drop engines (selectSolo fires twice) | FQ-RENDER-1 | ❌ OPEN | — |
| Triple bionic writer / font flicker | FQ-RENDER-3 | ❌ OPEN | — |
| "Again" cards not requeued in current session | FQ-ALGO-4 | ❌ OPEN | Anki gap |
| 18 review-stage rows with null next_due_at | FQ-ALGO-3 | ❌ OPEN | data repair |
| repair_point immediate surfacing (E7G) | FQ-ALGO-2 | ⚠️ BY DESIGN | review intent |

---

## WHAT WAS DIAGNOSED TODAY (2026-06-15)

### Root Cause of "Good/Easy Too Soon" — FQ-ALGO-1 (FIXED commit 048d073)

Base `selectSolo` fired an **anonymous** `setTimeout(rateCard(id,'good'), 8000)` — no handle stored,
impossible to cancel. When user clicked **Again** on a correctly-answered card:
1. `rateCard(id,'again')` ran → stage=relearning, next_due_at=now+10min ✅
2. 8.2 seconds later: anonymous timer fired `rateCard(id,'good')` → **overwrote to 3-day review** ❌

**Fix:** Timer now stored as `window.__cozyAutoRateHandle20260603`. New script
`cozy-explicit-rating-stabilizer-2026-06-11` wraps `rate()` + `rateCard()` to call
`clearDeferredAutoRate()` before any explicit rating commits.

**Probe confirmed:** Again→10m ✅ Hard→1d ✅ Good→3d ✅ Easy→15d ✅

### Render Glitch Root Causes — FQ-RENDER-1, FQ-RENDER-3 (still OPEN)

**FQ-RENDER-1:** System 2 (`raf175164`) and System 3 (`soloStableRaf351`) drop engines run
simultaneously. `selectSolo` fires **twice ~42ms apart** per card. All outer wrappers (undo,
rating, energy) execute twice per answer → double FSRS writes possible.
Fix: add `clearSoloDrop()` at top of `startStableSoloDrop351` (~line 6948).

**FQ-RENDER-3:** `installBionicQuestionPatch352` (~line 7427) re-writes `soloQuestion.innerHTML`
as plain text even when `rerenderVisibleBionic351` already applied bionic HTML → font flickers.
Fix: guard `if(prompt && !(el.innerHTML.includes('<b>') && _b)) el.innerHTML = patched(prompt);`

**FQ-RENDER-2:** Already patched at line 3939 (save/restore body classes). ✅

---

## ORDERED DIAGNOSIS — "Good/Easy Too Soon" (most → least probable)

| # | ID | Root Cause | Status |
|---|---|---|---|
| 1 | FQ-ALGO-1 | Anonymous deferred `rateCard(good)` overwrote explicit `again` at 8.2s | ✅ Fixed 048d073 |
| 2 | FQ-ALGO-2 | `repair_point=true` on wrong answers + E7G immediate-due pool → again cards surface immediately in Review Deck | ⚠️ By design |
| 3 | FQ-ALGO-3 | 18 review-stage rows with `next_due_at=null` → `isDue()=true` always → every session feels accelerated | ❌ Data repair needed |
| 4 | FQ-RENDER-1 | Dual-fire: outer rating wrappers execute twice per card → potential double FSRS write per answer | ❌ Open |
| 5 | FQ-ALGO-4 | "Again" cards not requeued in current session (no splice) — Anki learning-step gap | ❌ Open |
| 6 | FQ-ALGO-5 | Wrapper accumulation: two scripts reinstall `rate()` at overlapping timeouts → layered chain | Functionally idempotent; not blocking |

---

## ══════════════════════════════════════════════════════
## CODEX TASK — COPY THIS ENTIRE BLOCK INTO CODEX
## ══════════════════════════════════════════════════════

```
COMBINED TASK — PHASE2 + PHASE1: (1) due-pool fix → (2) render fixes → (3) rating re-audit → (4) PHASE1 port.
Repos: PHASE2=/Users/rebekahbetar/Documents/GitHub/cozy-arcade-app-PHASE2
       PHASE1=/Users/rebekahbetar/Documents/GitHub/cozy-arcade-app

NOTE: Rating audit A–I already passed 2026-06-15 (all 9 PASS). Skipping re-audit of rating path unless
a code change touches rate()/rateCard()/selectSolo. Run full A–I suite after Step 2 only.

Gates before any code change: runFSRSValidation() 17/17, runCozySmokeTests() 6/6.

═══ STEP 1: FQ-DUE-1 — Fix getStudyPool('due') (PHASE2/index.html only) ═══
File: index.html, line 10106–10107, inside Phase 3 getStudyPool function.

Current code (broken):
  } else if (scope === 'due') {
    arr = [...arr].sort((a, b) => dueScoreHot(b) - dueScoreHot(a));
  }

Replace with:
  } else if (scope === 'due') {
    const dueFilt = arr.filter(card => {
      const p = typeof getProgress === 'function' ? getProgress(canonicalCardId(card)) : stateForCard(card);
      return isDue(p) || (p && p.pinned);
    });
    arr = (dueFilt.length ? dueFilt : arr).sort((a, b) => dueScoreHot(b) - dueScoreHot(a));
  }

Why: 'due' branch currently only sorts — never filters. dueScoreHot() gives future-due Again cards
score ~1660 (higher than most cards) so they sort to position 1–3 despite isDue()=false.
Fix filters to isDue()+pinned before sorting. Falls back to full sort only if truly empty.

Validate:
  runFSRSValidation() 17/17 + runCozySmokeTests() 6/6
  Browser check: rate a card 'again', then call getStudyPool('due') within 5 minutes.
  Confirm that card is NOT in the returned array (next_due_at is future, not pinned).
  Confirm getStudyPool('review_deck') DOES still include it (repair_point=true, E7G design).

Do NOT touch the review_deck branch (line 10104–10105). That behavior is correct by E7G design.
Bump PHASE2/sw.js CACHE version after this fix passes.

═══ STEP 2: TWO RENDER FIXES (PHASE2/index.html, no new <script> blocks) ═══

FQ-RENDER-1 (~line 6951, inside startStableSoloDrop351):
  After: if(!row || (typeof mode!=='undefined' && mode!=='solo')) return;
  Add:   try{clearSoloDrop();}catch(e){}
  clearSoloDrop() at line 3890 cancels raf175164 (System 2 RAF) + clears ticker.
  Stops System 2 and System 3 running simultaneously → stops selectSolo firing twice per card.
  → runFSRSValidation() 17/17 + runCozySmokeTests() 6/6 before continuing.

FQ-RENDER-3 (~line 7446, inside installBionicQuestionPatch352 forEach loop):
  Change: if(prompt) el.innerHTML = patched(prompt);
  To:     if(prompt && !(el.innerHTML.includes('<b>') && _b)) el.innerHTML = patched(prompt);
  _b is defined at line 7431 (true when bionicOn_v1751523==='1').
  Skips re-write when bionic markup already present → stops triple-write font flicker.
  → runFSRSValidation() 17/17 + runCozySmokeTests() 6/6 before continuing.

Bump PHASE2/sw.js CACHE version string ONCE after Step 1 + Step 2 both pass.

═══ STEP 3: RATING REGRESSION CHECK ═══
Only needed if Step 2 touched rate()/rateCard()/selectSolo. Run tests D and G at minimum:
  D: rate(CARD,'again') + wait 10s → last_rating='again' (not overwritten)
  G: selectSolo(0) → rate(CARD,'again') → wait 10s → last_rating='again' NOT 'good'
Full A–I suite if any doubt.

═══ STEP 4: PORT TO PHASE1 ═══
Apply FQ-DUE-1 (identical change, same line context) to PHASE1/index.html.
Apply FQ-RENDER-1 and FQ-RENDER-3 to PHASE1/index.html.
Bump PHASE1/sw.js CACHE separately.
runFSRSValidation() 17/17 + runCozySmokeTests() 6/6 on PHASE1.
```

---

## NEXT STEPS QUEUE (after Codex task above completes)

### Immediate — confirmed by browser audit 2026-06-15

**Rating path A–I: ALL PASS** ✅ — FQ-ALGO-1 fix (deferred timer cancel) is confirmed working.
**PHASE1 port: BLOCKED** — due to FQ-DUE-1 Shadow/Due pool failure. Port after fix.

| Priority | ID | Task | Gate |
|----------|---|------|------|
| P1 | **FQ-DUE-1** | `getStudyPool('due')` includes future-due Again cards (Shadow Dungeon bug) | Future-due Again card absent from due pool + 17/17 + 6/6 |
| P1 | FQ-RENDER-1 | Stop dual drop engines (selectSolo fires twice) | 17/17 + 6/6 + selectSolo fires once per card in probe |
| P1 | FQ-RENDER-3 | Fix triple bionic writer font flicker | 17/17 + 6/6 |
| P1 | FQ-ALGO-3 | Data repair: 18 review-null + 56 ghost-seen rows | Atlas diagnostic: 0 issues |
| P1 | PHASE1 port | Port FQ-DUE-1 + FQ-RENDER-1 + FQ-RENDER-3 to PHASE1 | Same gates, PHASE1 SW bumped |

### Near-term

| Priority | ID | Task | Gate |
|----------|---|------|------|
| P2 | FQ-ALGO-4 | Anki same-session requeue: splice "again" card at idx+3 in `requeueAgainCard` when not future-due | Again card comes back ~3 cards later in same session |
| P2 | FQ-RENDER-4 | Move 700ms debounce to outermost selectSolo position (after undo/rating/energy wrappers) | selectSolo fires once per answer in instrumented probe |
| P2 | FQ-FLASH | Review deck / settings bar flash on load | Stable under 5 reloads |
| P2 | FQ-SCORE | Verify HP decreases on wrong answer (regression check) | HP -25 per wrong |
| P3 | FQ-ALGO-5 | Shared guard flag for rate() wrapper accumulation | `String(window.rate)` shows ≤3 wrapper layers |

### Product milestones (after all P1/P2 above clear)

| Priority | ID | Task |
|----------|---|------|
| M | M2 | Stripe Payment Link gate |
| M | iOS1 | Capacitor scaffold → App Store |

---

## VALIDATION COMMANDS (run in browser console after any change)

```javascript
window.runFSRSValidation()   // must return 17/17
window.runCozySmokeTests()   // must return 6/6

// Quick rating path spot-check:
window.phase3State.progress['rp-t1']  // check last_rating / stage / next_due_at after test

// Confirm dual-drop fix (after FQ-RENDER-1):
let _c=0; const _o=window.selectSolo;
window.selectSolo=function(i){_c++;console.log('SS#'+_c,Date.now());return _o.apply(this,arguments);};
// Start Solo, let card auto-select. Expected _c===1 per card.

// Confirm font fix (after FQ-RENDER-3):
let _w=0;const _obs=new MutationObserver(()=>_w++);
_obs.observe(document.getElementById('soloQuestion'),{childList:true,subtree:true,characterData:true});
// Start Solo, let card load. Expected _w===1 (one write = bionic). If _w>1: FQ-RENDER-3 still active.
```

---

## INVARIANTS — NEVER VIOLATE

1. Do NOT add new `cardPool` or `nextCard` wrappers
2. Do NOT add new `<script>` blocks — all fixes inline in existing source
3. Do NOT cross-push between PHASE1 and PHASE2
4. `runFSRSValidation()` 17/17 + `runCozySmokeTests()` 6/6 after every change
5. Bump `sw.js` CACHE on every code commit (both repos separately)
6. localStorage keys are frozen: `soloStudyingState_v1757`, `cozy_arcade_progress_v1`,
   `cozy_arcade_persona_v1`, `cozyQuestionSeconds351`, `cozy_arcade_limitless_cards_v1`, `bionicOn_v1751523`
7. Codex prompts: under 80 lines, no CDP infra, port BOTH repos in same prompt
8. selectSolo chain is 11 layers — do NOT add a 12th wrapper

---

---

## BROWSER AUDIT RESULTS — 2026-06-15 (read-only, no code changes)

**Method:** Playwright/Chrome against `http://127.0.0.1:8897/index.html`, `page.evaluate()` only.
**Script:** `/private/tmp/cozy_rating_matrix_audit_20260615.mjs` — no repo files changed.
**Gates:** `runFSRSValidation()` 17/17 ✅ start and end. `runCozySmokeTests()` 6/6 ✅ start and end.

### Rating Matrix — All 9 Tests

| Test | Result | Actual output |
|---|---|---|
| A — Good explicit | ✅ PASS | last_rating=good, stage=review, interval=3d |
| B — Hard explicit | ✅ PASS | last_rating=hard, stage=review, interval=1d, repair_point=true |
| C — Easy explicit | ✅ PASS | last_rating=easy, stage=review, interval=15d |
| D — Again explicit (+10s wait) | ✅ PASS | last_rating=again, stage=relearning, next_due_at≈+10m, NOT overwritten |
| E — Auto-select correct (+9s) | ✅ PASS | last_rating=good, stage=review, interval=3d |
| F — Auto-select wrong (+9s) | ✅ PASS | last_rating=again, stage=relearning, next_due_at≈+10m |
| G — Cancel test (select→Again→wait 10s) | ✅ PASS | last_rating=again survived 10s, deferred good timer cancelled |
| H — Pin | ✅ PASS | pinned=true, stage unchanged |
| I — Bury | ✅ PASS | buried=true, suspended=true |

**⚠️ Critical condition on E/F:** Auto-select tests E and F only write FSRS state when `spacedOn=true`. With spaced repetition OFF, auto-selection does not call `rateCard()` — the card is seen but not scheduled. This is correct behavior but must be noted in user-facing onboarding and any future probe scripts must set `spacedOn=true` before testing E/F.

### Game Transition Test

| Transition | Result | Detail |
|---|---|---|
| Solo Studying → Knowledge Expansion | ✅ PASS | mode='solo' → mode='domain', valid current card, 4 orb choices rendered |

### Shadow Dungeon / Due Pool State Translation — ❌ FAIL

**Symptom:** A future-due Again card (next_due_at=now+10min) was correctly excluded from `review_deck` scope, but `getStudyPool('due')` still included it — surfacing it at or near the TOP of the "Spaced Repetition" pool.

Shadow Dungeon maps `shadowScope351='due'` → `studyMode='due'` (line 6391) → hits this exact path. Shadow Dungeon inherits the due-pool bug.

**Exact root cause — three compounding code issues:**

**Issue 1 — `'due'` branch only sorts, never filters (line 10106–10107):**
```javascript
} else if (scope === 'due') {
  arr = [...arr].sort((a, b) => dueScoreHot(b) - dueScoreHot(a));
  // ↑ No filter. ALL cards enter the sort regardless of isDue().
}
```

**Issue 2 — `'due'` not in the empty-return guard (line 10112):**
```javascript
if (!arr.length && ['random-new','new','review','wrong','hard','pinned','tagged'].includes(scope)) return [];
// ↑ 'due' is absent. When no cards are truly due, falls through to baseCards() — returns EVERYTHING.
```

**Issue 3 — `dueScoreHot` gives future-due Again cards a HIGHER score than most other cards (lines 10029–10032):**
```javascript
if (p && p.next_due_at) {
  const overdueDays = (Date.now() - Date.parse(p.next_due_at)) / 86400000;
  if (overdueDays > 0) return 2000 + overdueDays;          // truly overdue → 2000+
  return 1500 + (1 / Math.max(0.01, -overdueDays));        // FUTURE due → 1500 + 1/tiny = ~1642!
}
// Fallback (no next_due_at): pinned=1000, again=500, hard=250
```

A card rated Again 1 minute ago with next_due_at = now+9min:
- `overdueDays` ≈ -0.00625 (negative = future)
- Score = `1500 + (1 / 0.00625)` = `1500 + 160` = **~1660**

This score is HIGHER than: pinned+again fallback (1500), any not-yet-due review card, most unseen cards. So future-due Again cards sort to position 1–3 in the due pool, appearing immediately in Spaced Rep and Shadow Dungeon despite `isDue()=false`.

**Why `review_deck` was unaffected:** `review_deck` uses `isReviewCandidateHot` which explicitly checks `repair_point || pinned || last_rating === 'again'` — a whitelist filter, not a score sort. Future-due Again cards have `repair_point=true` so they ARE included in review_deck. That is E7G design (intentional). The bug is specific to the 'due'/Spaced Rep scope.

### Fix for FQ-DUE-1 — `getStudyPool('due')` filter-before-sort (line 10106)

**Target:** `index.html` line 10106–10107, inside Phase 3 `getStudyPool`.

```javascript
// CURRENT (broken):
} else if (scope === 'due') {
  arr = [...arr].sort((a, b) => dueScoreHot(b) - dueScoreHot(a));
}

// FIXED:
} else if (scope === 'due') {
  const dueFilt = arr.filter(card => {
    const p = typeof getProgress === 'function' ? getProgress(canonicalCardId(card)) : stateForCard(card);
    return isDue(p) || (p && p.pinned);
  });
  arr = (dueFilt.length ? dueFilt : arr).sort((a, b) => dueScoreHot(b) - dueScoreHot(a));
}
```

**Logic:** Filter to only `isDue(p)=true` OR pinned cards before sorting. Pinned cards always surface (user chose to pin them). Non-pinned future-due relearning/repair cards are excluded from Spaced Rep mode. If no cards qualify (nothing due, nothing pinned), fall back to the full sorted pool to avoid a broken empty session — same graceful degradation as before, but now only triggered when legitimately empty.

**Validation:** After fix, a card rated Again (next_due_at=now+10min, not pinned) must NOT appear in `getStudyPool('due')` within 10 minutes. `runFSRSValidation()` 17/17 + `runCozySmokeTests()` 6/6 required.

**PHASE1 port status:** Blocked until PHASE2 FQ-DUE-1 fix is validated. Same bug exists in PHASE1 — apply identical change after PHASE2 passes.

---

## SENIOR ARCHITECT PRE-MORTEM — STATE DEBT & PERSISTENCE DIAGNOSIS
*2026-06-15 | Deep analysis, no quick patches. Goal: elegant reduction, zero backtrack.*

### Why Data Survives Command+R (Hard Reload)

**Short answer:** The app uses localStorage (not cookies). Command+R clears HTTP cache but NOT localStorage, sessionStorage, or the service worker cache. Three independent layers survive:

| Layer | Survives Cmd+R | Cleared by | Data stored |
|---|---|---|---|
| `localStorage` | ✅ always | DevTools → Application → Clear Storage | All progress, settings, deck |
| `sessionStorage` | ✅ within tab session | Tab close | `cozy_energy_session_352` |
| Service Worker cache `cozy-arcade-PHASE2-v18` | ✅ serves cached HTML | Cmd+Shift+R OR unregister SW | `./`, `./index.html`, `./manifest.json` |

**To fully reset:** DevTools → Application → Storage → Clear site data (all three layers). Clearing cookies alone has zero effect — the app has no `document.cookie` usage.

---

### Complete localStorage Key Inventory

| Key | Written by | Purpose | Redundancy status |
|---|---|---|---|
| `cozy_arcade_state_v3` | `savePhase3State()` line 11007 | **Canonical** Phase 3 state (progress + settings) | ✅ Keep — sole authority |
| `soloStudyingState_v1757` | `savePhase3State()` line 11008 via LEGACY_STATE_KEYS loop | Legacy mirror of progress only | ❌ **Dead write** — remove from save loop |
| `cozy_arcade_progress_v1` | `savePhase3State()` line 11009, `storeHydratedPayload()` line 13689 | Standalone progress export | ⚠️ Duplicate of state_v3.progress — consolidate |
| `cozy_arcade_limitless_cards_v1` | Line 10807 (deck upload), line 11895 | Deck card cache | ✅ Keep — deck is rightly separate |
| `cozy_arcade_limitless_meta_v1` | Alongside cards_v1 | Deck metadata | ✅ Keep |
| `cozy_user_one_thing_v1` | Line 8580 | one_thing entries (older key) | ❌ Superseded by `cozyUserOneThingMap351` |
| `cozyUserOneThingMap351` | Line 8948 | one_thing map (current key) | ✅ Keep — canonical |
| `cozy_arcade_persona_v1` | `PERSONA_KEY351` line 5877 | Persona | ✅ Keep — canonical |
| `cozy_persona` | Line 5877 (second write) | Persona duplicate | ❌ **Dead write** — remove second setItem |
| `cozyCorrect351` | Line 9521 | XP / correct count | ⚠️ Review if duplicated in phase3State |
| `cozy_energy_total_352` | Line 7369 | Energy total | ✅ Keep |
| `cozy_paid_v1` | Line 14495 | Paywall flag | ✅ Keep |
| `bionicOn_v1751523` | Settings patch | Bionic toggle | ✅ Keep — frozen per invariants |
| `cozyQuestionSeconds351` | Settings patch | Timer setting | ✅ Keep — frozen per invariants |
| `soloStudying_spacedOn_v175153` | Lines 1036, 1260, 1511, 11743 | Spaced rep toggle | ✅ Keep — canonical |
| `soloStudying_spacedOn_v175157` | Line 1511 only | Spaced rep duplicate | ❌ **Dead write** — remove |
| `soloStudying_spacedOn_v1759` | Line 511 only | Spaced rep duplicate | ❌ **Dead write** — remove |
| `cazy_v3` | Atlas read fallback only (line 13674) | Typo key — never written | ❌ **Typo** — remove from Atlas read chain |

**sessionStorage:**
| Key | Purpose |
|---|---|
| `cozy_energy_session_352` | Energy for current tab session only |

---

### Root Cause: "Cards 0 / Reviewed 93 / Pinned 41" Display Bug

This is the **progress/deck desync** — three generations of state management created a split read path:

```
Progress KPIs (Reviewed, Pinned, Due):
  ← phase3State.progress ← cozy_arcade_state_v3  ← always restores ✅

Cards / New KPIs:
  ← appCards() ← in-memory window.cards array
  ← ONLY populated if cozy_arcade_limitless_cards_v1 restores successfully
  ← If deck restore fails or isn't triggered → Cards: 0, New: 0  ❌
```

**Result:** App shows 93 reviewed cards but 0 total cards — which is impossible state. Progress is real, deck just isn't loaded yet (or failed to restore silently).

**Correct fix:** On page load, if `appCards().length === 0` and `cozy_arcade_limitless_cards_v1` has data, auto-restore deck before computing KPIs. OR: show a "Upload deck to see full stats" notice when progress exists but deck is absent.

---

### The Three-Generation State Debt (Root of "Lazy Patch" Problem)

```
Gen 1 (original):
  state[] array
  saveState() line 387-388 → soloStudyingState_v1757 (full legacy object)

Gen 2 (Phase 3):
  phase3State.progress{}
  savePhase3State() line 11002 → writes to THREE keys simultaneously:
    [1] cozy_arcade_state_v3       (canonical full object)
    [2] soloStudyingState_v1757    (legacy mirror, progress only — redundant)
    [3] cozy_arcade_progress_v1    (progress-only export — semi-redundant)
  window.saveState = savePhase3State  (line 12072 — Gen 1 alias patched over)

Gen 3 (Atlas import path):
  storeHydratedPayload() line 13689 → writes to BOTH state_v3 + progress_v1
  Atlas read chain line 13674 → reads 4 keys: state_v3, progress_v1,
    soloStudyingState_v1757, cazy_v3 (TYPO — never written)
```

**Every save is 3 writes. Every Atlas load tries 4 reads. spacedOn has 3 localStorage keys. Persona writes twice per change. This is the "old card states from lazy coding patches" problem.**

---

### Elegant Fix Plan — Reduce Without Backtracking

**Phase A — Safe dead-write removal (inline edits, no logic change):**

| Fix | Line | Change | Risk |
|---|---|---|---|
| A1 | 11008 | Remove `LEGACY_STATE_KEYS.forEach` write from `savePhase3State()` — stop writing `soloStudyingState_v1757` on every save | Low — `loadPhase3State` reads `cozy_arcade_state_v3` first; legacy key only needed for pre-Phase3 migration |
| A2 | 13674 | Remove `'soloStudyingState_v1757'` and `'cazy_v3'` from Atlas STATE_KEYS fallback array | Low — state_v3 and progress_v1 are always written |
| A3 | 511 | Remove `soloStudying_spacedOn_v1759` write | Low — dead key, never read |
| A4 | 1511 | Remove `soloStudying_spacedOn_v175157` write | Low — dead key, never read |
| A5 | 5877 | Remove second `localStorage.setItem('cozy_persona',id)` write | Low — `cozy_arcade_persona_v1` / PERSONA_KEY351 is canonical |

**Phase B — Deck/progress consistency (requires testing):**

| Fix | Change | Risk |
|---|---|---|
| B1 | On home screen KPI render: if `appCards().length === 0` and `phase3State.progress` has entries, show inline notice "Upload deck to activate study modes" instead of Cards: 0 | Low — display only |
| B2 | On page load: attempt silent deck restore from `cozy_arcade_limitless_cards_v1` before first KPI render | Medium — test restore path |

**Phase C — Long-term cleanup (dedicated Codex pass):**

| Fix | Change |
|---|---|
| C1 | Delete `loadState()`/`saveState()` at lines 387-388 — already aliased to Phase 3 at line 12072 |
| C2 | Consolidate `cozy_arcade_progress_v1` writes — one write (from `savePhase3State`) is sufficient; `storeHydratedPayload` should write ONLY `cozy_arcade_state_v3` |
| C3 | Migrate `cozy_user_one_thing_v1` readers to `cozyUserOneThingMap351` |

**Do NOT do in same pass:** Do not combine Phase A + B + C into one Codex task. Apply A first, validate 17/17 + 6/6, then B.

---

### Handoff for Next AI — Storage Pre-Mortem in Brief

**What survives Command+R and why:**
- `localStorage` persists forever (never cleared by hard reload). All progress, settings, deck live here.
- Service worker `cozy-arcade-PHASE2-v18` (registered at line 14485, caches `./index.html`) intercepts before network — even Cmd+Shift+R may serve cached HTML. Must unregister SW or clear Cache Storage to guarantee fresh HTML.
- `sessionStorage` survives refresh but not tab close.

**The 3 writes per save to understand before touching state:**
```javascript
// savePhase3State() writes:
localStorage.setItem('cozy_arcade_state_v3', ...)      // canonical ← keep
localStorage.setItem('soloStudyingState_v1757', ...)   // legacy ← remove (Phase A1)
localStorage.setItem('cozy_arcade_progress_v1', ...)   // semi-redundant ← keep for now
```

**The "Cards 0 / Reviewed 93" issue is not a data bug — it is a deck restore gap.** Progress always loads. Deck only loads if `cozy_arcade_limitless_cards_v1` restores successfully and `normalizeDeckIdentities()` runs. Fix in Phase B, not before rating path and render glitches are resolved.

**Priority order: FQ-RENDER-1 → FQ-RENDER-3 → FQ-ALGO-3 data repair → Phase A dead-write removal → Phase B deck consistency.**

---

## REFERENCE FILES

| File | Purpose |
|------|---------|
| `SENIOR_DEV_AUDIT_2026_06_07.md` | Full audit — Section 4 (selectSolo chain), Section 19 (render diagnosis), Section 20 (FSRS rating bug) |
| `RECTIFIER_PLAN_2026_05_26.md` | Fix queue FQ-1→current + all Codex prompt contracts |
| `ULTIMATE_GOALS.md` | Product vision + root cause log RC-1 through RC-12 |
| `GOAL.md` | Active gate + open bug inventory |
| `Chronological_Patch_Hx_RECTIFIER_PLAN_2026_05_26.md` | Every session entry with validation results |
| `AGENTS.md` | Codex agent constraints + next render-fix task brief |
| `CODEX_PROMPT_1_ALGORITHM_GLITCH.md` | 13-test rating matrix + pool tests (A–M) |
| `CODEX_PROMPT_2_HARD_RESET_SAVE.md` | localStorage hygiene + deck restore verification |
| `CODEX_PROMPT_3_POOL_RECIRCULATION.md` | Shadow Dungeon / pinned card recirculation tests (NEXT TASK) |

---

## SESSION 2 — 2026-06-15 (afternoon) — CHANGES APPLIED

### Commits This Session
| Repo | Commit | SW | What |
|------|--------|-----|------|
| PHASE2 | `dfb2ecc` | v19 | Debulk 7 dead state writes + FQ-DUE-1/RENDER-1/RENDER-3 |
| PHASE2 | `477b25e` | v20 | Fix test A (auto-correct), FQ-DUE-1 cardPool fallback, wrappedRate lastRatedId clear |
| PHASE1 | `b0defd5` | v55 | Remove LEGACY_STATE_KEYS dead write (soloStudyingState_v1757) |
| PHASE2/PHASE1 | pending | v21/v56 | FQ-POOL-1/2 session-blocked pool + Shadow Dungeon queue skip; correct `record()` clears repair_point |

### Codex Browser Audit Results (run before commit 477b25e)
| Test | Result | Note |
|------|--------|------|
| A — auto-correct | ❌ FAIL → **FIXED** in 477b25e | pendingFor-only blocked rateOnce; restored rateOnce-first |
| B — auto-wrong | ✅ PASS | |
| C — explicit Again cancel | ✅ PASS | |
| D — explicit Hard | ✅ PASS | |
| E — explicit Good | ✅ PASS | |
| F — explicit Easy | ✅ PASS | |
| G — Again twice | ✅ PASS | |
| H — due pool no future-due cards | ❌ FAIL → **FIXED** in 477b25e | phase3 cardPool fallback was splitBuriedToBack(all) |
| I — Shadow/due no future-due | ❌ FAIL → **FIXED** in 477b25e | same fallback |
| J — repair_point cleared on good | ✅ PASS | |
| K — correct lane + Again counters | ❌ OPEN | wrong_count conflates lane accuracy + self-rating |
| L — stability written on review good | ✅ PASS | |
| M — ghost card-000X not in due pool | ❌ FAIL → **FIXED** in 477b25e | same fallback |

### Fix Details (commit 477b25e)

**Test A — auto-correct:**
`wrappedSelect` was calling `pendingFor(card, rating)` only (our change in dfb2ecc). `pendingFor` sets an 8.2s timer. That timer fires `rateOnce` → `rateCard`. Race condition: something was blocking `rateOnce` before the timer fired. Fix: restored `rateOnce`-first (immediate write on card selection). Added `window.__cozyLastRatedId=null` in `wrappedRate` so explicit ratings override even after auto-rate wrote good.

**H/I/M — FQ-DUE-1 cardPool fallback:**
`cardPool('due')` in Phase 3 had two layers. We fixed `getStudyPool('due')` (line 10106, Shadow Dungeon path) in dfb2ecc, but the Phase 3 main `cardPool` at line 11524 still used `splitBuriedToBack(refreshed)` as fallback when `dueOnly` was empty. This returned ALL 1,700 cards. Fixed: fallback now returns `pinnedFallback` (pinned cards only) or empty array.

---

## PROGRESS EXPORT AUDIT — 2026-06-15 SESSION 2 (cozy_arcade_progress_2026-06-15(3).json)

**Export time:** during active play session after fixes pushed | Total rows: 1,734

### New Symptom: Cards Circling Back After Correct Answer

| Card | Seen | Rating | Due | Pinned | Repair | Verdict |
|------|------|--------|-----|--------|--------|---------|
| `104-1-8626` | **9×** | easy | FUTURE +24h | No | No | ❌ Bug — should never recircle |
| `104-2-7802` | **6×** | again | FUTURE +8min | No | Yes | ⚠️ repair_point always-due (FQ-ALGO-2) |
| `104-7-7993` | 3× | good | FUTURE +3d | **Yes** | No | ⚠️ pinned always-in-pool |
| `104-28-8682` | 3× | good | FUTURE +24h | No | No | ❌ Bug — pool leak |
| `104-30-7913` | 3× | good | FUTURE +24h | **Yes** | No | ⚠️ pinned always-in-pool |

**31 good/easy cards have seen_count > 1** — confirming widespread same-session recirculation.

### Recirculation Diagnoses (most → least probable)

| # | ID | Root Cause | Evidence |
|---|---|---|---|
| 1 | **FQ-POOL-1** | Pinned cards pass `isDue(p)\|\|p.pinned` filter every pool pass — no `buriedToday` protection after correct rating | `104-7-7993` (pinned=True, good, seen=3, due+3d); `104-30-7913` (pinned=True, seen=3) |
| 2 | **FQ-POOL-2** | Shadow Dungeon pool does NOT filter `session.buriedToday` or `session.seenThisSession` for non-'due' scopes | `104-1-8626` (seen=9, easy, future, NOT pinned) — can only recircle if pool ignores buriedToday |
| 3 | **FQ-ALGO-2** | `repair_point=True` bypasses `isDue()` in review_deck — always immediately due | `104-2-7802` (seen=6, repair=True) |
| 4 | **FQ-DATA-1** | `repair_point` never cleared when `record(ok=true)` fires — confirmed from session 1 audit | Cards `3-13710`, `16-8553` still repair=True after correct answers |
| 5 | **FQ-RENDER-1** | Dual selectSolo fire inflates `reviewed_count` (each card rated twice per appearance) | clearSoloDrop fix applied but not browser-validated |
| 6 | **FQ-ALGO-5** | `__cozyLastRatedId` only tracks ONE card — if same card appears twice in pool, second appearance re-rates | Amplifies seen_count but not root cause of pool leak |
| 7 | **FQ-DUE-1 (old)** | Before 477b25e, splitBuriedToBack served ALL cards as fallback — `104-1-8626` would have been in every 'due' session | Export may partially reflect pre-fix play |

### What Is NOT the Cause
- Progress state is NOT corrupted — FSRS intervals are correct (easy→15d, good→3d)
- This is a POOL filter problem, not a scheduling problem
- Solo Studying appears unaffected because its scope uses `seenThisSession` gating differently
- Shadow Dungeon is the primary suspect per user observation

---

## COMPLETE BUG INVENTORY (as of 2026-06-15 session 2)

### P0 — Fixed, must not regress
| ID | Fix | Commit |
|----|-----|--------|
| FQ-ALGO-1 | Auto-rate timer cancelled by explicit rating | 048d073 |
| FQ-AUTO-1 | selected=0 on undo restore | 8eb10a4 |
| FQ-RENDER-2 | body.className save/restore | line 3939 |
| FQ-DUE-1 | getStudyPool('due') filters isDue\|\|pinned | dfb2ecc |
| FQ-DUE-1b | cardPool('due') fallback returns pinned-only not all | 477b25e |
| Test A | auto-correct writes FSRS immediately | 477b25e |
| Dead writes | LEGACY_STATE_KEYS, Atlas STATE_KEYS, spacedOn, persona | dfb2ecc + b0defd5 |

### P1 — Fix next (blocking good UX)
| ID | What | Where |
|----|------|-------|
| **FQ-POOL-1** | Pinned cards recircle every pool pass — need buriedToday after correct rating | `rateCard()` line 11246: add `session.buriedToday.add(cardId)` for good/easy on pinned cards; OR filter pinned from pool if already in seenThisSession |
| **FQ-POOL-2** | Shadow Dungeon non-'due' scope ignores buriedToday/seenThisSession — 104-1-8626 seen 9× | `cardPool()` for 'random'/'spaced' scopes — add `splitBuriedToBack` or `seenThisSession` filter |
| **FQ-DATA-1** | repair_point never cleared on correct answer | `record()` or `rateCard()` — add `repair_point: false` when `ok===true` or `rating==='good'\|\|\|easy` |
| **FQ-RENDER-1** | Dual drop engines — selectSolo fires twice (clearSoloDrop fix applied, unvalidated) | `startStableSoloDrop351` — browser validate |
| **FQ-RENDER-3** | Triple bionic writer — font flicker (bionic guard applied, unvalidated) | `installBionicQuestionPatch352` — browser validate |

### P2 — Fix after P1
| ID | What |
|----|------|
| FQ-ALGO-3 | 18 review-stage cards with null next_due_at — always due |
| FQ-ALGO-4 | Again cards not requeued in current session (Anki gap) |
| FQ-DATA-2 | wrong_count bloat from legacy counter |
| FQ-DATA-3 | card-000X ghost cards (KE import artifacts) |
| FQ-ALGO-6 | K: wrong_count conflates lane accuracy + self-rating |
| State-B | Deck restore after hard reload (Cards 0 / Reviewed 93) |

### P3 — After P2
| ID | What |
|----|------|
| FQ-ALGO-5 | stability/difficulty not written on good/hard/easy (only on first again) |
| M2 | Stripe Payment Link |
| iOS1 | Capacitor scaffold |

---

## NEXT CODEX TASK

See `CODEX_PROMPT_3_POOL_RECIRCULATION.md` for full copy-paste prompt.

**Priority order:**
1. Validate FQ-RENDER-1 + FQ-RENDER-3 (render fixes applied unvalidated)
2. Fix FQ-POOL-1 (pinned cards in pool every pass)
3. Fix FQ-POOL-2 (Shadow Dungeon seenThisSession/buriedToday filter)
4. Fix FQ-DATA-1 (repair_point not cleared on correct answer)
5. Port to PHASE1 after PHASE2 validates all P1 items

---

## PROGRESS EXPORT AUDIT — 2026-06-15 (cozy_arcade_progress_2026-06-15(2).json)

**Export date:** 2026-06-15T19:16:28Z | Schema: 3.0 | Total rows: 1,734

### Summary Numbers
| Metric | Value | Concern |
|--------|-------|---------|
| Stage = new | 1,639 | Normal (unseen cards) |
| Stage = review | 70 | ⚠ 18 have null next_due_at — always-due (FQ-ALGO-3) |
| Stage = relearning | 25 | All have again rating — normal |
| Cards with stability set | **2** | ❌ Critical — only again-rated new cards |
| repair_point cards total | **41** | ⚠ All have correct_count=0 or near-zero |
| Future-due again cards (pre-filter fix) | 1 | Was causing FQ-DUE-1 surfacing |
| card-000X ghost cards | **10** | ❌ KE import artifacts — always due |

---

### FINDING 1 — "Answered Correctly But Rated Again" — Root Cause Analysis

**Last tested card: `104-22-7715`**
```
stage=relearning | rating=again | correct_count=0 | wrong_count=1
repair_point=true | pinned=true | stability=0.4072 | next_due=+10min
one_thing: "Normal AG metabolic acidosis + negative UAG → GI bicarbonate loss"
```

**What happened:** The user knew the answer but the system shows `correct_count=0, wrong_count=1`.

**Possible sources ranked most → least probable:**

**#1 — MOST LIKELY: User explicitly clicked "Again" (intentional re-study)**
The user saw the card, recognized the right answer, but clicked "Again" to force more repetition. This is legitimate FSRS usage. The bug concern is: should this increment `wrong_count`? Currently `record()` increments wrong_count whenever the explicit rating is "again", regardless of which lane was selected. This conflates *lane accuracy* (did you pick the right MCQ option) with *self-rating* (how confident are you). These are two distinct signals and should be tracked separately.

**#2 — repair_point never cleared on correct answer (FQ-DATA-1 — CONFIRMED NEW BUG)**
Cards `3 - 13710` (correct=2, wrong=98) and `16 - 8553` (correct=1, wrong=96) have been answered **correctly** but `repair_point=true` persists. The E7G design sets `repair_point=true` on wrong answers and should clear it on correct answers. Evidence shows clearing is broken or absent. Result: these cards surface at the top of every session forever, regardless of FSRS scheduling.

**#3 — wrong_count bloat from legacy counter accumulation (FQ-DATA-2 — CONFIRMED NEW BUG)**
Multiple cards show impossible wrong_count values:
- `6 - 8029`: wrong_count=**172**, seen_count=1
- `3 - 8682`: wrong_count=**172**, seen_count=1
- `9 - 8605`: wrong_count=**172**, seen_count=1
- `2 - 8024`, `10 - 7881`: wrong_count=**116**, seen_count=1

A single session card cannot have 172 wrong answers. This is the Gen 1 `state[]` legacy counter being added to the Phase 3 progress counter on each save — the old `wrong` accumulator from `soloStudyingState_v1757` is being merged into `wrong_count` on every `savePhase3State()` call. The 172/116/96/101 values appear in clusters, suggesting they come from a shared global wrong-count in the legacy state that gets stamped onto each newly-seen card.

**#4 — stability=None on all good/hard/easy reviewed cards (FQ-ALGO-5 — CONFIRMED)**
Only 2 out of 1,734 cards have `stability` set, both rated "again" (new → relearning transitions). All 68 cards in review stage that were rated good/hard/easy have `stability=None` and `interval_days` but no `stability` or `difficulty`. This means:
- FSRS parameters are computed on first-time "again" rating (new → relearning)
- But subsequent good/hard/easy reviews do NOT update stability/difficulty in the stored progress
- `interval_days` is written correctly but `stability` is null
- Future scheduling will use stale/null stability values — intervals will degrade

**#5 — card-000X ghost cards always due (FQ-DATA-3 — CONFIRMED)**
10 cards with IDs `card-0001` through `card-0010` are in `stage=review` with `next_due_at=null` and `stability=null`. They all show `seen=1` — they were visited once. Three have `rating=bury` (not a valid FSRS rating). These entered via a Knowledge Expansion import or test deck load. Because `stage=review` + `null next_due_at` → `isDue()=true`, they surface in every session. They cannot be scheduled normally because they lack FSRS data.

**#6 — Dual selectSolo fire corrupting window.current (FQ-RENDER-1 — OPEN)**
The dual drop engine (System 2 + System 3 firing within 42ms) can fire `selectSolo` twice per card. If the first fire sets `window.current = cardA` and the second fire advances to `window.current = cardB`, then when the user rates `cardB`, the `record()` call may attribute the answer to `cardA`'s pool slot. This can make a correct lane selection on card A register as wrong on card B. Fix applied in this session (clearSoloDrop guard) but not yet browser-validated.

---

### FINDING 2 — Code Change Completion (this session)

SW bumped: `cozy-arcade-PHASE2-v18` → **`v19`**

| Change | Status |
|--------|--------|
| loadState reads cozy_arcade_state_v3 | ✅ done |
| Dead spacedOn v1759 → v175153 | ✅ done |
| Dead spacedOn v175157 removed | ✅ done |
| Persona double-write removed | ✅ done |
| LEGACY_STATE_KEYS dead write removed from savePhase3State | ✅ done |
| Atlas STATE_KEYS cleaned (removed soloStudyingState_v1757, cazy_v3) | ✅ done |
| FQ-DUE-1: getStudyPool('due') now filters isDue\|\|pinned | ✅ done |
| FQ-RENDER-1: clearSoloDrop() at top of startStableSoloDrop351 | ✅ done |
| FQ-RENDER-3: bionic guard in installBionicQuestionPatch352 | ✅ done |
| sw.js CACHE v19 | ✅ done |

---

### NEW BUG INVENTORY (from progress export audit)

| ID | Description | Priority | Source |
|----|-------------|----------|--------|
| **FQ-DATA-1** | `repair_point` never cleared when `record(ok=true)` fires — cards 3-13710, 16-8553 confirmed | P1 | `record()` function — search `repair_point` write |
| **FQ-DATA-2** | `wrong_count` bloat: legacy Gen1 counter stamped onto Phase 3 progress on every save | P1 | `savePhase3State()` merge logic |
| **FQ-ALGO-5** | `stability` and `difficulty` not written on good/hard/easy reviews — only on first "again" | P1 | `rateCard()` — FSRS param write path |
| **FQ-DATA-3** | `card-000X` ghost cards (KE import artifacts) stuck in review/always-due with no FSRS data | P2 | KE import validation + deck filter |
| **FQ-ALGO-6** | `wrong_count` conflates lane accuracy + explicit "again" self-rating — should be separate fields | P3 | `record()` design |

---

### NEXT CODEX TASK — Add to Prompt 1 (Algorithm Glitch tests J–M)

```javascript
// J: repair_point cleared on correct answer
delete window.phase3State.progress['rp-repair'];
window.phase3State.progress['rp-repair'] = { stage:'new', repair_point:true, last_rating:null };
window.current = {id:'rp-repair',qid:'rp-repair',diagnosis:'Test',presentation:'T',sys:'GEN'};
window.choices = ['Test','X','Y','Z'];
selectSolo(0);
setTimeout(()=>rate(current,'good'), 300);
setTimeout(()=>{
  const p = getProgress('rp-repair');
  console.log('J: repair_point after good rating =', p.repair_point, '(expect false)');
},500);

// K: wrong_count not incremented on explicit "again" after correct lane
delete window.phase3State.progress['rp-wrongct'];
window.current = {id:'rp-wrongct',qid:'rp-wrongct',diagnosis:'Test',presentation:'T',sys:'GEN'};
window.choices = ['Test','X','Y','Z'];
selectSolo(0);
setTimeout(()=>rate(current,'again'), 300);
setTimeout(()=>{
  const p = getProgress('rp-wrongct');
  console.log('K: wrong_count after correct-lane+Again =', p.wrong_count, '(should be 0, correct_count=1)');
},500);

// L: stability written after good review of existing card
const existId = Object.keys(window.phase3State.progress).find(k=>{
  const p=window.phase3State.progress[k];
  return p && p.stage==='review' && !p.stability;
});
if(existId){
  rateCard(existId,'good');
  setTimeout(()=>{
    const p = getProgress(existId);
    console.log('L: stability after good-review =', p.stability, '(expect non-null)');
  },300);
}

// M: card-000X ghost cards absent from due pool
const ghosts = (window.getStudyPool ? getStudyPool('due') : [])
  .filter(c => String(canonicalCardId(c)).match(/^card-\d+$/));
console.log('M: ghost card-000X in due pool =', ghosts.length, '(expect 0)');
```
