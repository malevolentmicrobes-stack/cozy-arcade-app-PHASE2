# Cozy Arcade Board Prep — Project Status
*Updated: 2026-05-26*

---

## Current Phase: P-RC Rectifier (Steps 2–5 active)

**App:** Single-file HTML/JS flashcard game. `index.html` (~12,650 lines after rectifier deletions). No build step, no framework.
**Live site:** GitHub Pages via `phase2/public` branch.
**Repos:** `origin` → `cozy-arcade-app` (history), `phase2` → `cozy-arcade-app-PHASE2` (live).

---

## Completed This Session (2026-05-26)

| Commit | Change | Gate |
|--------|--------|------|
| `0a4f9d3` | FSRS v5 replaces SM-2 in `rateCard()` | `runFSRSValidation()` 17/17 |
| `166d663` | Settings: bionic OFF by default, remove Live JSON Preview + Test Mode | Visual confirm |
| `40d3584` | Bionic single-key + timer reads from localStorage | Browser confirm |
| `fe99803` | 4-file no-bias audit + 20-step Rectifier Plan | `Chronological_Patch_Hx_RECTIFIER_PLAN_2026_05_26.md` |
| `d162708` | Rectifier Steps 1+6–8: makeChoices fix + v17513/14/15 deleted | Code + structural |
| `8741251` | Validation pass + undo review (Cmd/Ctrl+Z + iOS shake) + smoke fixes | FSRS 17/17, smoke 6/6 |

---

## What Was Fixed (Steps 1 + 6–8)

### Step 1 — makeChoices return value
- **Bug:** `choices=makeChoices(c)` assigned `undefined` to `choices` — `makeChoices()` returns nothing (sets global directly). Every Shadow Dungeon / review-launched card showed blank answer buttons and always scored wrong.
- **Fix:** Removed `choices=` prefix from both call sites (`renderReviewList` onclick, `startCard()`).

### Steps 7–8 — Delete superseded drop patches
- **Deleted:** `v17513` drop overrides (updateSoloVisuals + renderSolo within IIFE), `v17514` (style+script), `v17515` (style+script, 195 lines).
- **Why v17515 was critical:** Its `autoHandle = setTimeout(selectSolo, 7030ms)` was never cancelled by v175151 (which only clears its own `raf` handle). This caused double-advance: player answers → card advances → 7 seconds later `autoHandle` fires → card advances again. Deleting v17515 eliminates the timer at source.
- **v175151** (lines ~700–890 post-deletion) is the sole authoritative drop mechanic. RAF-based, top-to-bottom, respects user timer setting.

### Step 6 — loopSolo + stopAllDropTimers
- **Added** `window.loopSolo = loopSolo = function(){ clearInterval(ticker); }` inside v175151. Previously, `renderSolo()` started the RAF drop via `startDrop()`, then the caller always also called `loopSolo()` which restarted the base setInterval ticker — two timers running in parallel.
- **Added** `window.stopAllDropTimers()` global helper.

### Undo Review (Cmd/Ctrl+Z + iOS Shake)
- **Added** `v175372-rectifier-undo-makechoices-smoke` script.
- Wraps `selectSolo` to snapshot card/choices/progress before answer.
- `window.undoReview()` restores snapshot: reverts FSRS progress, `state` entry, reloads card as unanswered.
- Keyboard: Cmd/Ctrl+Z (capture phase, doesn't fire in inputs).
- iOS: `devicemotion` force > 32 with 1.6s debounce.

---

## Architecture Notes (Current)

- **Single localStorage key per setting:** `cozyBionic351` consolidated to `bionicOn_v1751523` (Step 2 complete)
- **Drop mechanic:** v175151 only — RAF loop, `startTop` geometry from prompt bottom, `dropDistance` from track height. `loopSolo()` is now a no-op (clears base ticker).
- **FSRS v5:** 19 weights, `stability`/`difficulty`/`retrievability` fields on progress. `previewInterval('good')` → `'3d'` for new cards. `W[15]=0.0` (hard penalty intentionally zero).
- **Undo:** `window.__cozyLastReviewUndo372` holds one-deep snapshot; cleared after use. `window.undoReview()` is the API.

---

## P-RC Rectifier Step Status

| Step | Description | Status |
|------|-------------|--------|
| 1 | Fix `makeChoices` return value | ✅ DONE `d162708` |
| 2 | Consolidate `bionicOn` to `bionicOn_v1751523`, default `true` | ✅ DONE |
| 3 | Fix `patchSettingsText()` 1200ms loop — read single key | 🔄 ACTIVE |
| 4 | Fix Apply button → write `cozyQuestionSeconds351` | ⏳ PENDING |
| 5 | Normalize `timerMax` literals throughout | ⏳ PENDING |
| 6 | `stopAllDropTimers()` + `loopSolo` override | ✅ DONE `d162708` |
| 7 | Delete v17513 + v17514 | ✅ DONE `d162708` |
| 8 | Delete v17515 | ✅ DONE `d162708` |
| 9–20 | Remaining cleanup (spacedOn, reveal chain, setIntervals, etc.) | ⏳ PENDING |

---

## Next Steps (ordered)

### Complete — Step 2: Consolidate bionicOn
1. `bionicOn=false` → `bionicOn=true` at base declaration
2. All localStorage reads/writes use `bionicOn_v1751523`
3. No `cozyBionic351` key is written by Apply/drawer paths
4. Drawer checkbox initializes at boot and mirrors `bionicOn_v1751523`
5. Verified: fresh load default true, ON/OFF round-trip, FSRS 17/17, smoke 6/6

### Immediate — Steps 3–5
- **Step 3:** Fix 1200ms `patchSettingsText()` interval to read `bionicOn_v1751523` only
- **Step 4:** Add `localStorage.setItem('cozyQuestionSeconds351', soloTimerInput.value)` to Apply handler
- **Step 5:** Remove hardcoded `7` timerMax literals

### Deferred (after P-RC)
| Priority | Goal |
|----------|------|
| P3.5 | Due-count widget: "5 due · 12 new" on home screen |
| P7 | PWA service worker + self-host fonts |
| P8 | XSS audit + CSP headers via vercel.json |
| M2 | Stripe Payment Link live |
| iOS1 | Capacitor scaffold |

---

## Active Constraints (never violate)

- localStorage keys MUST NOT change: `soloStudyingState_v1757`, `cozy_arcade_progress_v1`, `cozy_arcade_persona_v1`, `cozyQuestionSeconds351`, `cozy_arcade_limitless_cards_v1`
- Functions never rewritten or renamed: `rate()`, `rateCard()`, `advance()`, `fullCard()`, `saveState()`, `updateKpis()`, `canonicalCardId()`, `importDeck()`
- Never add a new `<script>` block outside existing patch pattern — edit in-place only
- Two-repo deploy: always push `origin public` AND `phase2 public` for live updates
