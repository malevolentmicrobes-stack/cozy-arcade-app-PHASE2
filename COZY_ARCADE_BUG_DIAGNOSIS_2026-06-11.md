# Cozy Arcade — Bug Diagnosis & Root Cause Analysis
**Date:** 2026-06-11 | **Author:** Technical Lead Review | **Scope:** PHASE2 production + PHASE1

---

## CRITICAL ARCHITECTURE FACT (discovered 2026-06-11)

> **PHASE2 GitHub Pages serves `origin/public`, NOT `main`.**
> Pushing to `main` has zero effect on what users see. Every production change must also be applied to `origin/public`.

PHASE1 serves from `main` — no special handling needed.

---

## BUG 1 — Character auto-trends toward correct answer

### Status: Partially fixed. Residual perceived bias is statistical, not systematic.

### All identified sources (primary → secondary):

| # | Location | Mechanism | Status |
|---|----------|-----------|--------|
| 1 | `restoreUndoSnapshot` ~line 13314 | Restored `selected = snap.selected` — the correct answer's lane from prior play | **Fixed** FQ-AUTO-1: now `selected = 0` |
| 2 | `loopSolo()` line 407 | `selectSolo(selected)` fires when `timer <= 0`. If user moved with arrows, `selected` is non-zero. On fresh card, `selected=0` from `makeChoices()` → always fires lane 0 | Correct behavior; ~25% of cards correct answer is at lane 0 by random shuffle |
| 3 | Drop animation RAF line 3924 | `selectSolo(selectedIdx())` fires when fall animation ends. `selectedIdx()` wraps `selected`. **Redundant with #2** — both fire at timer expiry | No systematic bias; redundant call is no-op since `selectSolo` guards open reveal |
| 4 | Legacy render path line 809 | Third `selectSolo(selectedIdx())` — separate render path, also reads `selected` | Same as #3; no bias unless `selected` was corrupted |
| 5 | `wrappedRate` deferred auto-rate | 8000ms setTimeout in `selectSolo` base function: `rateCard(_autoCardId, ok?'good':'again')` fires even after explicit rating | **Fixed** FQ-AUTO-2: `wrappedRate` cancels `__cozyAutoRateHandle20260603` on explicit rating |
| 6 | Multiple ticker instances | If `clearInterval(ticker)` fails (e.g. ticker undefined), two timers run. First fires correct `selectSolo(0)`, second fires again with stale `selected` | Low risk; guarded by `if(mode!=='solo'||paused)return` |
| 7 | `setSelectedIndex(0)` setTimeout delay | `renderDomain` wrapper calls `setTimeout(()=>setSelectedIndex(0),30)` — 30ms window where `selected` could be set by a racing call | KE only; visual state, not selection |
| 8 | `shuffle()` determinism | If `Math.random()` is seeded or patched (e.g. `__cozyStableRandom351`), correct answer could land at lane 0 more than 25% | No evidence of bias in 1000-card sample (213/271/265/251 distribution) |

### Pre-mortem for recurrence:
- Adding `selected = snap.selected` back to `restoreUndoSnapshot` would re-trigger Bug 1
- Patching `makeChoices()` without keeping `selected = 0` at end would re-trigger
- Any new wrapper adding `selected = correctLaneIndex` before timer fires

### Monitoring snippet (paste in console to watch live):
```javascript
(function(){
  let c=0,t=0;
  const o=window.selectSolo;
  window.selectSolo=function(i){
    if(window.choices&&window.current){
      t++;
      if(window.choices[i]===window.current.diagnosis){c++;console.log('Auto-correct hit: '+c+'/'+t+' ('+Math.round(100*c/t)+'%)');}
    }
    return o.apply(this,arguments);
  };
  console.log('Monitoring selectSolo — expected correct rate ~25%');
})()
```
**Expected: ~25% correct. Consistent >40% = real bias. ~25% = random shuffle working correctly.**

---

## BUG 2 — Selecting alternative timer breaks gameplay

### Status: Active. Root causes identified below.

### Known symptom: Setting timer to 11–15s causes game to freeze or not play.

| # | Location | Mechanism | Fixed? |
|---|----------|-----------|--------|
| 1 | `dropMs()` line 3888 | `Math.min(10,...)` hard cap — timer value stored as 13, but `dropMs()` returned 10000ms. Fall animation ends at 10s, timer visual shows 13s. **Desync causes perceived freeze.** | **Fixed**: cap raised to 15 |
| 2 | `questionSeconds351()` line 6700 | `return Math.max(3,Math.min(10,n))` — capped the value before writing to `window.__cozyQuestionMs351`. Even if localStorage had 13, runtime got 10000ms | **Fixed**: cap raised to 15 |
| 3 | Settings apply handler line 6722 | `Math.min(10,Number(sel.value)||5)` — capped at 10 before storing | **Fixed**: cap raised to 15 |
| 4 | Shadow start handler line 6384 | `Math.min(10,Number(dropSel.value)||7)` | **Fixed** |
| 5 | Shadow start handler line 6396 | `Math.min(10,Number(drop.value)||7)` | **Fixed** |
| 6 | Dropdowns max value | All 4 dropdowns (`questionTime351`, `shadowDropSeconds351` ×2, `drawerQuestionTime351`) capped at `<option value="10">` — user could not select 11–15 | **Fixed**: options 11–15 added |
| 7 | `drawerQuestionTime351` vs `questionTime351` | Two separate settings surfaces. Drawer apply writes `cozyQuestionSeconds351`. Hub apply writes same key. Shadow writes `cozyShadowDropSeconds351`. All independent — changing one does NOT change the other | Architectural; not a bug but causes confusion |
| 8 | `window.__cozyQuestionMs351` stale override | This runtime key overrides localStorage inside `dropMs()`. If a Shadow session sets it to 10000 and then Settings is changed, the runtime still uses 10000 until page reload | Minor; workaround: reload after switching modes |

### Pre-mortem for recurrence:
- Any new `Math.min(10,` in a timer-related path will silently re-cap
- Grep gate: `grep -c "Math.min(10," index.html` must return 0 after every timer-related commit

---

## BUG 3 — PHASE2 production served stale HTML (resolved 2026-06-11)

**Root cause:** PHASE2 has two branches. `main` = dev. `origin/public` = what GitHub Pages actually serves.

Timer fix pushed to `main` → not visible in browser.  
Codex then overwrote `public:index.html` with `main:index.html` → production broke (`selectedOrder is not defined`, 0 cards loaded).

**Fix (commit 81fc423):** Restored working `public` index, applied only timer patch on top, pushed `origin/public`.

**Permanent fix:** All PHASE2 production changes must go to `origin/public`. Workflow:
```bash
git worktree add /tmp/phase2-public origin/public
cd /tmp/phase2-public
# apply changes
git commit -m "..."
git push origin HEAD:public
git worktree remove /tmp/phase2-public
```

---

## KNOWN RESIDUAL ISSUES (not yet fixed)

| ID | Description | Priority |
|----|-------------|----------|
| FQ-NEW-3b | Visible `^` click/touch button missing from Full Card modal DOM. Keyboard close works (ArrowUp). Touch users cannot close. | High |
| FQ-VERIFY-1 | Auto-wrong selection + rate Good: does FSRS state update correctly? Not yet browser-verified. | High |
| FQ-REVIEW-1 | Review Deck: pin/unpin and suspend/unsuspend controls — unknown if accessible from Review screen | Medium |
| FQ-5 | Dead `shadowSchedule351` dropdown still present in Shadow Dungeon overlay | Low |

---

## KNOWN WORKING (do not re-patch)

| Feature | Evidence |
|---------|----------|
| Number keys 1–4 pre-reveal | Line 432 keydown handler; advertised in UI hint text. **Do not add again.** |
| ArrowUp / ^ keyboard Full Card close | Script `cozy-full-card-caret-close-2026-06-10` at line 14418 |
| Undo lane reset (`selected=0`) | `restoreUndoSnapshot` line ~13314 |
| Deferred auto-rate cancel | `wrappedRate` in rectifier |
| FSRS scheduling | `runFSRSValidation()` 17/17 stable |
| Smoke tests | `runCozySmokeTests()` 6/6 stable |
| Timer 11–15s runtime | `dropMs()` returns 11000–15000; `timerMax` correctly set; live timing ~±700ms |

---

## PATCH HISTORY SUMMARY (ordered, both repos)

1. E7/E7B/E7C — Phase 3 pool ownership, HUD dedup, scope sync (June 3)
2. P7 — SW/manifest/offline for PHASE2 (June 3)
3. A9 — Atlas tag/system filter → Solo launch (June 3)
4. Data patch — E3/E4 FSRS + ghost card reset (June 3)
5. Rating path rectifier — `cozy-rating-path-rectifier-2026-06-03` (June 3)
6. FQ-AUTO-1 — `selected=0` in `restoreUndoSnapshot` (June 10)
7. FQ-AUTO-2 — cancel deferred auto-rate in `wrappedRate` (June 10)
8. FQ-NEW-3 partial — ArrowUp/^ keyboard close for Full Card (June 10)
9. Timer 15s — 5 caps + 4 dropdowns + SW v16/v53 (June 11)
10. SW network-first — app shell strategy changed from stale-while-revalidate (June 11)
11. PHASE2 public repair — restored working public branch, kept timer fix (June 11, commit 81fc423)
