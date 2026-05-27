# Project Goal Tracker
*Updated 2026-05-27 — reflects both session compactions + current session*

---

## Active Goal

**Goal:** Neural Atlas inline + export/schema hardening — COMPLETE
**Phase:** P7 PWA service worker → P8 CSP headers
**Reference:** `RECTIFIER_PLAN_2026_05_26.md`, `ULTIMATE_GOALS.md`
**Status:** All rectifier + atlas + export work CODE COMPLETE. Browser-validate before P7.

---

## All Completed Work (Chronological)

### P-RC Rectifier (2026-05-26) — all ✅
- ✅ Step 1: `makeChoices` return value fixed — choices always Array(4)
- ✅ Step 2: `bionicOn` consolidated to `bionicOn_v1751523`; fresh-load reads localStorage
- ✅ Step 3/3b: bionic settings hydration + Apply guard + stale key fixed
- ✅ Step 4: `applyVisibleSettings352()` writes `cozyQuestionSeconds351`
- ✅ Step 5: All `timerMax` assignments read localStorage
- ✅ Step 6: `stopAllDropTimers()` + `loopSolo` override in v175151
- ✅ Step 7/8: v17513/14/15 deleted (double-advance eliminated)
- ✅ F3: `dataset.cozyBionic` set at script init
- ✅ F7: Home controls `display:none` → `order:3`
- ✅ Bionic/settings: `window.enhanceSettings` export, Apply no-auto-close, Advanced panel hidden
- ✅ `v175374`: font restored; bionic contrast CSS; soloTrack inset:240px

### Schema / Export Hardening (2026-05-27, session 1) — all ✅
- ✅ `canonicalizeCard(raw, opts)` added at line ~11379 — single source of truth
  - `mode:'export'` → strict allowlist (14 canonical fields + `card_id`)
  - `mode:'display'` → alias normalization for gameplay render
  - `cleanDeckCard(card)` = `canonicalizeCard(card, {mode:'export'})` wrapper
- ✅ Progress export de-aliased: `progressPayload()`, `backupPayload()`, `fullGameStatePayload()` all call `exportProgressMap()` directly — `seen/reviewed/correct/rating/last` aliases no longer exported
- ✅ `one_thing` in progress: `exportProgressMap` resolves value BEFORE writing to `phase3State.progress[cardId]`, persists through save/reload
- ✅ Home labels: "Upload Deck"→"Upload", "Download Deck"→"Download"
- ✅ Download button → `exportDeckWithProgress` (clean deck + FSRS progress, combined)
- ✅ Undo stack: `__cozyUndoStack372` upgraded from single-slot to 5-deep; toast shows "Undone (N more)"

### Neural Atlas Inline (2026-05-27, session 2) — all ✅
- ✅ `74ce963`: Neural Atlas embedded as `<div id="atlas" class="screen hidden">` inside index.html
  - Full feature parity with progress_beta.html (constellation, sidebar KPIs, card browser, export, diagnostic)
  - All IDs `na-` prefixed; CSS scoped to `#atlas { ... }` — zero bleed into main app
  - RAF render loop halts when `#atlas.hidden`; `naInit()` not auto-called
  - `window.showAtlasScreen()` / `window.hideAtlasScreen()` public API
  - Progress button → `window.showAtlasScreen()` (was `window.open('progress_beta.html','_blank')`)
- ✅ `c7e5c01`: Home button fix + live data reads
  - `hideAtlasScreen`: explicitly hides `#atlas` before calling `window.home()`
  - `readProgress()`: reads `window.phase3State.progress` live (no localStorage round-trip)
  - `atlasLoadDeck()`: reads `window.appCards()` live (full card objects with sys/diagnosis/presentation)
- ✅ `20df845`: Orphan progress entry pruning
  - After deck+progress load, drops entries with no matching card in `deckMap`
  - Eliminates `'—'` constellation node caused by prior-session/prior-deck orphan records
  - Guard: only prunes when deck IS loaded; if no deck, shows all progress

---

## Pending Browser Validation

Run in order — do not proceed to P7 until all pass:

1. `window.runFSRSValidation()` → 17/17
2. `window.runCozySmokeTests()` → 6/6
3. Home KPI row shows Cards | Reviewed | Due | New | Pinned with live values
4. Bionic: uncheck → Apply → reopen → still unchecked; `localStorage.getItem('bionicOn_v1751523') === '0'`
5. Export Download → JSON has no `level_1_presentation`, no `seen/reviewed/correct/rating/last`
6. Cmd+Z after answering → prior card reappears; toast says "Undone" or "Undone (N more)"
7. Settings Export Deck Only → canonical fields only
8. Settings Export Progress → FSRS fields only (no aliases)
9. Settings Export Deck+Progress → clean cards + clean progress
10. Progress button → Atlas opens inline (no new tab); constellation shows system nodes
11. ← Home → returns to home screen; RAF stops
12. Atlas ↻ → refreshes from live app state; no `'—'` node when deck loaded

---

## Next Code Tasks (after validation)

| Priority | Goal | Gate |
|----------|------|------|
| P7 | PWA service worker (`sw.js` + register before `</body>`) | Chrome DevTools → Application → Service Workers registered |
| P8 | CSP headers via `vercel.json` | `curl -I` shows `Content-Security-Policy` header |
| M2 | Stripe Payment Link | Test purchase + `localStorage.getItem('cozy_paid_v1') === '1'` |
| iOS1 | Capacitor scaffold | `npx cap sync` exits 0 |

---

## Advancement Rules

| Condition | Action |
|-----------|--------|
| `runFSRSValidation()` → 17/17 | Gate PASSED |
| Any failure | Fix assertion → re-run → do not proceed |
| Validation items 1–12 all pass | Mark session DONE → advance to P7 |

---

## Gate Log

| Date | Goal | Result |
|------|------|--------|
| 2026-05-26 | Shadow Dungeon dual-event fix | ✅ `20b166a` |
| 2026-05-26 | previewInterval easy formula | ✅ `9552cb3` |
| 2026-05-26 | SM-2 prereq gate | ✅ FSRS 17/17 + smoke 6/6 |
| 2026-05-26 | P3 FSRS Phase 1–2 | ✅ `runFSRSValidation()` 17/17 |
| 2026-05-26 | P3 FSRS Phase 4 | ✅ `0a4f9d3` FSRS 17/17 + smoke 6/6 |
| 2026-05-26 | P-RC All steps | ✅ `d162708`+`8741251` |
| 2026-05-26 | Bionic/Settings | ✅ `45a26b6`, `26153a4`, `bc333a9` |
| 2026-05-27 | canonicalizeCard + export de-alias | ✅ `698ebe9`, `35cd2b4`, `2dd12a1` |
| 2026-05-27 | Undo 5-deep + one_thing persist | ✅ `92b9be8` |
| 2026-05-27 | Neural Atlas inline embed | ✅ `74ce963`, `c7e5c01`, `20df845` |
