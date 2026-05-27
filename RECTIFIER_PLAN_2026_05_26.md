# Rectifier Plan — 2026-05-26
*Cozy Arcade Board Prep-Medicine — Single-file HTML/JS (index.html ~12,800 lines)*

---

## Session Summary — Changes Made Today

| Commit | Line(s) | Change | Status |
|--------|---------|--------|--------|
| `45a26b6` | 1299 | `window.enhanceSettings = enhanceSettings` — exports IIFE-A's hydration-aware version so gear-click path calls the right function | ✅ LIVE |
| `26153a4` | 8200–8202 | Remove `setTimeout(returnFromSettings352, 0)` from Apply listener — settings no longer auto-closes on Apply | ✅ LIVE |
| `26153a4` | 1296 | Apply onclick now calls `installBionicQuestionPatch352()` + `rerenderVisibleBionic351()` — bionic re-renders in gameplay after Apply | ✅ LIVE |
| `26153a4` | 1299 | `box.querySelectorAll('details.v175152-panel')` loop hides "Advanced: Merge / Progress Import" panel on every settings open | ✅ LIVE |
| pending | 12670–12671 | `<style id="v175374-rectifier-font-bionic-fix">` — font size restore + bionic contrast CSS | ✅ INSERTED (uncommitted) |

---

## Root Cause Diagnosis

### A — Bionic Toggle Never Hydrated (FIXED `45a26b6`)

**Line 943** — `function enhanceSettings()` is local to the main app IIFE. Not global.  
**Line 2105** — IIFE-B's `openSettings()` calls `window.enhanceSettings` which was `undefined`.  
**Result:** Settings opened, bionic checkbox never read from localStorage. Always showed `true` (init state).  
**Fix:** `window.enhanceSettings = enhanceSettings` in IIFE-A exports the correct hydrating version.

### B — Bionic Visual Effect Invisible (FIXED `v175374-...` style)

**Line 390** — `bionic()` wraps first 48% of each word in `<b>` tags.  
**CSS Line 3** — `.promptText{font-weight:950}` — EVERY character is already 950 weight.  
**Result:** `<b>word_half</b>` inside 950-weight container = zero visual contrast. Bionic appears "lost."  
**Fix:** `[data-cozyBionic="1"] .promptText` → `font-weight:500; color:rgba(160,200,255,0.62)` base. `b` inside → `font-weight:950; color:#fff`. Now bold half is white/heavy, rest is dimmed blue.  
**Note:** `document.documentElement.dataset.cozyBionic` is set by `applyVisibleSettings352()` (line 8107) and `installBionicQuestionPatch352()` (line 7402).

### C — Font Size Accumulated Shrinkage (FIXED `v175374-...` style)

Twelve overlapping `!important` rules for `.solo .promptText` each progressively smaller:

| Line | Rule | Max (desktop) |
|------|------|---------------|
| 3 (base) | `clamp(24px,3vw,42px)` | 42px |
| 120 | `clamp(18px,2.05vw,30px)!important` | 30px |
| 128 | `clamp(16px,1.72vw,25px)!important` | 25px |
| 372 | `clamp(14px,4.0vw,21px)!important` | 21px |
| 3209 | `clamp(16px,1.72vw,27px)!important` | 27px |

Last `!important` at same specificity wins → text shrinks with each patch.  
**Fix:** New rule at bottom of file: `clamp(22px,2.6vw,36px)!important` — higher position in cascade, restores legible size. Mobile breakpoint also corrected.

### D — Settings Auto-Close on Apply (FIXED `26153a4`)

**Line 8202** — `setTimeout(returnFromSettings352, 0)` inside `applyReturn352` listener.  
**Result:** Settings closed 0ms after Apply was clicked. User had to race the auto-close.  
**Fix:** Removed the `setTimeout` line. Apply now saves without closing.

---

## Plausible Culprit Pathology — Font/Display

**Priority-ordered suspects for text size regression:**

1. `cozy-mobile-shell-371-css` (line ~11894) — HUD restructuring adds several `.solo .promptText` rules with small `clamp()` values. Being near end of file, these frequently win the cascade.
2. `v175151` drop mechanic (lines ~700–890) — Adjusts `soloTrack inset` which compresses the prompt box vertical space, forcing text to wrap more.
3. `cozyArcadeBehaviorPatch` (line 5539) — Adds `promptBox.longPrompt17528` class to long questions, triggering the `font-size:clamp(13px,1.12vw,19px)!important` rule at line 5347.
4. `v343_minimal_revert_patch` (line 5610) — `MutationObserver` on `documentElement` re-applies layout patches on every DOM change; may trigger cascade recompute.
5. `cozy_v350_rescue_css` (line 5671) — `#home .homeWrap>.controls{display:none!important}` forces layout reflow that can affect sibling element sizing.
6. Multiple `.promptBox` width overrides (`min(800px,78vw)`, `min(760px,76vw)`, etc.) — narrower box forces text wrapping at larger apparent sizes.
7. `settings-text-fix` style block — Typography overrides for `#settings .box` that include global `font-size` resets which may cascade into gameplay.

---

## Plausible Culprit Pathology — Bionic Reading Function Lost

**Priority-ordered suspects:**

1. **Scope isolation** (confirmed root cause) — `bionic()` at line 390 is global. `installBionicQuestionPatch352()` reassigns it to `bionicQuestionHTML352`. BUT `bionicHTML351` (line 5811) is used by `rerenderVisibleBionic351()` and reads `dataset.cozyBionic` not `bionicOn`. Two parallel systems, neither triggering the CSS contrast correctly until today's fix.
2. **No visual contrast CSS** (confirmed) — `.promptText{font-weight:950}` makes `<b>` invisible. Fixed by `v175374`.
3. **`ensureBionic351()` force-sync** (line 6630) — Reads `initial` from localStorage and sets all bionic toggles. If called after Apply writes `'0'`, it reads `'0'` correctly. But if called BEFORE Apply writes (e.g. from `boot()` 100ms timeout), it overwrites with stale value.
4. **`installBionicQuestionPatch352()` unguarded** (line 7397) — Called every 900ms from `install()`. Each call overwrites `window.bionic = bionicQuestionHTML352`. If `bionicQuestionHTML352` has a bug producing empty output, bionic appears gone. (Low risk — function is stable.)
5. **`rerenderVisibleBionic351()` uses `dataset.cozyBionic`** (line 5813) — If `document.documentElement.dataset.cozyBionic` is not set (e.g. initial load before Apply), `bionicHTML351` returns plain text even when `bionicOn = true`. The `document.documentElement.dataset.cozyBionic` is only set by: `installBionicQuestionPatch352()` (line 7402), `applyVisibleSettings352()` (line 8107), and `ensureBionic351()` → `sync()` (line 6644). On first load with default `bionicOn = true`, this dataset may not be set until `install()` first fires (~350ms), leaving a window where bionic is off.
6. **`bionicQuestionHTML352` (line 7385) is patched onto `window.bionic`** — But `renderSolo()` (line 402) calls the LOCAL `bionic` in the main IIFE scope. After reassignment via `bionic = patched` at line 7407, this works — but if the reassignment fails (strict mode local `const bionic`), the local version remains.

---

## 10-Step Fix Plan (Remaining)

| Step | Target | Line(s) | Fix | Gate |
|------|--------|---------|-----|------|
| F1 | Font sizes | 12670 (new style) | ✅ DONE — `v175374` style block inserted | Visual confirm |
| F2 | Bionic contrast | 12670 (new style) | ✅ DONE — `[data-cozyBionic]` CSS | Visual confirm bionic on/off |
| F3 | `dataset.cozyBionic` on init | 382 area | Add `document.documentElement.dataset.cozyBionic` write to initial `bionicOn=true` declaration | `runFSRSValidation()` 17/17 |
| F4 | Timer key (Step 4 Rectifier) | 1296 | Apply onclick already calls `applyVisibleSettings352()` which writes `cozyQuestionSeconds351` (line 8111). Verify no gap. | `localStorage.getItem('cozyQuestionSeconds351')` after Apply |
| F5 | `timerMax` literals (Step 5) | ~402, ~408, ~7 hardcoded | Replace `7` with `parseInt(localStorage.getItem('cozyQuestionSeconds351')\|\|7)` | Timer uses selected value |
| F6 | `setInterval(install,900)` guard | 8310 | Add `document.documentElement.dataset` guard to expensive inner functions so 900ms loop is a no-op after first run | No visible regression |
| F7 | `cozy_v350_rescue_css` home controls | 5685 | Remove `display:none!important` on `.homeWrap>.controls` | Home buttons visible |
| F8 | `v343_minimal_revert_patch` MutationObserver | 5665 | Narrow observer target from `documentElement` to `#soloCard,#fullCard` | No performance hit |
| F9 | Due-count widget (P3.5) | TBD | "5 due · 12 new" on home screen | Visual confirm |
| F10 | `patchHome()` gear rewrite cleanup | 2114 | Add `if(gear.dataset.v175374Wired) return` guard so gear.onclick is assigned once | Gear always opens settings |

---

## Option A — Conservative (Recommended)

Apply F1–F5 only. These are high-confidence, low-blast-radius. Validate each in browser before the next. F1/F2 are already inserted. F3–F5 are small targeted additions.

## Option B — Aggressive

Apply all F1–F10 in one pass. Risk: F6/F8 touch interval/observer infrastructure — could break drop mechanic or review list.

## Option C — Revert + Replay

Revert to reference (`2026-05-16/index.html`) for CSS only (extract style blocks, replace), keep all JS patches. Achieves clean font baseline without touching logic. Highest effort, best CSS outcome.

---

## Contingency Plan

If `runFSRSValidation()` fails after any step:
1. `git revert HEAD` — single commit revert, no squash
2. Re-run validation to confirm clean state
3. Identify which specific assertion failed (look for FAIL lines in console)
4. Fix only that assertion before re-attempting

If bionic still appears broken after F2:
1. Open DevTools → Elements → inspect `<html>` → confirm `data-cozy-bionic="1"` is set
2. If not set: Apply didn't run `applyVisibleSettings352()` → check `applyReturn352` listener is attached
3. If set but no visual: inspect a `.promptText` element → check computed `color` and `font-weight` on `b` children

---

## Validation Tests

```javascript
// Run in browser console after each fix

// 1. Bionic toggle round-trip
localStorage.setItem('bionicOn_v1751523','0');
location.reload();
// Open settings → bionic checkbox should be UNCHECKED

// 2. Apply persists bionic OFF
// Uncheck bionic → Apply → close → reopen settings → still UNCHECKED
localStorage.getItem('bionicOn_v1751523') === '0' // true

// 3. Bionic visual contrast
document.documentElement.dataset.cozyBionic = '1';
// soloQuestion text should show dim-blue base, bright-white bold prefix per word

// 4. Font size sanity
getComputedStyle(document.querySelector('.solo .promptText')).fontSize
// Should be ≥ 22px on 1440px+ screen, ≥ 18px on mobile

// 5. Timer seconds persisted
// Set timer to 5s → Apply → start game → timer bar drains over 5s (not 7s)
localStorage.getItem('cozyQuestionSeconds351') === '5'

// 6. Full validation suite
window.runFSRSValidation()  // → 17/17
window.runCozySmokeTests()  // → 6/6
```

---

## Gate Log (2026-05-26 Additions)

| Commit | Change | Gate |
|--------|--------|------|
| `45a26b6` | `window.enhanceSettings` export — bionic checkbox hydrates on every settings open | Browser validate: checkbox reflects localStorage |
| `26153a4` | No auto-close + Advanced panel hidden + bionic rerender on Apply | PERFECT — user confirmed |
| pending | `v175374` font restore + bionic contrast CSS | Visual confirm pending |

---

*Reference file:* `/Users/rebekahbetar/Documents/Codex/2026-05-16/cozy-arcade/index.html` (8,803 lines — do not overwrite; use for CSS/logic comparison only)  
*Authoritative step list:* `Chronological_Patch_Hx_RECTIFIER_PLAN_2026_05_26.md`  
*Active constraints:* See `COZY_ARCADE_PROJECT_STATUS_2026-05-26.md` — localStorage keys and protected functions must never change.
