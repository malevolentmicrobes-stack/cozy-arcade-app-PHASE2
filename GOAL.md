# Project Goal Tracker

## Active Goal

**Goal:** P-RC Rectifier — ALL STEPS COMPLETE (browser validation pending)
**Phase:** P-RC (Rectifier) → advancing to E-series (Export/Undo) + P3.5 (due-count)
**Reference:** `Chronological_Patch_Hx_RECTIFIER_PLAN_2026_05_26.md` — authoritative step list
**Status:** CODE COMPLETE — awaiting browser validation

**All Rectifier Steps Done:**
- ✅ Step 1: `makeChoices` return value fixed — choices always Array(4)
- ✅ Step 2: `bionicOn` consolidated to `bionicOn_v1751523`; fresh-load reads localStorage (`7156bd1`)
- ✅ Step 3/3b: bionic settings hydration + Apply guard + stale key fixed
- ✅ Step 4: `applyVisibleSettings352()` writes `cozyQuestionSeconds351` at line 8118 — code confirmed
- ✅ Step 5: All `timerMax` assignments read localStorage (lines 402, 408, 446, 793, 824)
- ✅ Step 6: `stopAllDropTimers()` + `loopSolo` override in v175151
- ✅ Step 7/8: v17513/14/15 deleted (double-advance eliminated)
- ✅ F3: `dataset.cozyBionic` set at script init (line 383, `7156bd1`)
- ✅ F7: Home controls `display:none` → `order:3` (`7156bd1`)

**Bionic/Settings also done:**
- ✅ `window.enhanceSettings` export (`45a26b6`)
- ✅ Apply no longer auto-closes; Advanced panel hidden; bionic rerenders on Apply (`26153a4`)
- ✅ `v175374` font reverted to pre-my-changes; bionic contrast CSS; soloTrack inset:240px (`bc333a9`)
- ✅ Keyboard controls hint in settings (`bc333a9`)

**Export/Undo done:**
- ✅ E1: Undo (Cmd/Ctrl+Z + shake) implemented in `v175372` — browser verify pending
- ✅ E2: `cleanDeckCard()` strips legacy alias fields — `b0ab820`

**Pending browser validation (do in order):**
1. `window.runFSRSValidation()` → 17/17
2. `window.runCozySmokeTests()` → 6/6
3. Bionic checkbox ON/OFF round-trip after Apply
4. Timer: set 5s → Apply → start game → drains in 5s
5. Export clean deck → no `level_1_presentation` in JSON
6. Cmd+Z after answering → prior card returns

**Next code task:** E3–E5 browser verify (export clean deck, progress-only, deck+progress) → then F2 PWA / P8 CSP

---

## Advancement Rules

| Condition | Action |
|-----------|--------|
| `runFSRSValidation()` → 17/17 | Gate PASSED → proceed to Phase 4 |
| `runFSRSValidation()` → any failures | Fix failing assertions → re-run → do not proceed |
| `runFSRSValidation()` not found | Phase 1–2 not yet inserted → insert helpers first |
| Phase 4 complete + `runCozySmokeTests()` 6/6 | Mark P3 DONE → advance to P3.5 (due-count widget) |

---

## Active Goals — Export / Undo (E-series)

| # | Goal | Status |
|---|------|--------|
| E1 | Undo review (Cmd/Ctrl+Z + iOS shake) | ✅ CODE — browser verify needed |
| E2 | Export strips legacy alias fields from all deck exports | ✅ FIXED — `cleanDeckCard()` extended |
| E3–E5 | Settings exports (deck-only, progress-only, deck+progress) | ⚡ VERIFY in browser |

**Root cause (E2):** `cleanDeckCard()` did `Object.assign({}, card)` which carried every alias added by import normalization. Fixed: added `level_1_presentation`, `level_2_three_second_exposure`, `prompt`, `clinical_vignette_summary`, `answer`, `subject`, `qid_unique`, `treatment`, `next_step` to deletion list.

**Undo implementation note (E1):** `v175372-rectifier-undo-makechoices-smoke` wraps `selectSolo`, captures snapshot before answer fires, restores on Cmd+Z or shake (force>32, 1600ms debounce). Domain mode not covered — solo only.

---

## Blocked Goals Queue (next after P3)

| Priority | Goal | Gate condition |
|----------|------|----------------|
| P3.5 | Due-count widget on home screen ("5 due · 12 new") | Visual confirm in browser |
| P7 | PWA service worker + self-host fonts | Chrome DevTools → Application → Service Workers → registered |
| P8 | Security: XSS audit + CSP headers via vercel.json | `curl -I https://domain.com` shows `Content-Security-Policy` header |
| M2 | Stripe Payment Link live | Test purchase completes + `localStorage.getItem('cozy_paid_v1')` returns `'1'` |
| iOS1 | Capacitor scaffold builds | `npx cap sync` exits 0, Xcode project opens |

---

## Gate Log

| Date | Goal | Condition | Result |
|------|------|-----------|--------|
| 2026-05-26 | Shadow Dungeon dual-event fix | Code review + browser gear test | ✅ PASSED — `20b166a` |
| 2026-05-26 | previewInterval easy formula | `1.6→1.3` verified against `rateCard()` | ✅ PASSED — `9552cb3` |
| 2026-05-26 | SM-2 prereq gate | `window.runSRSValidation()` 17/17 + `runCozySmokeTests()` 6/6 | ✅ PASSED — browser confirmed |
| 2026-05-26 | P3 FSRS Phase 1–2 | helpers + `runFSRSValidation()` inserted into index.html | ✅ PASSED — `runFSRSValidation()` 17/17 browser confirmed |
| 2026-05-26 | P3 FSRS Phase 4 | `rateCard()` SM-2 replaced with FSRS v5 math | ✅ PASSED — `0a4f9d3`, runFSRSValidation() 17/17 + runCozySmokeTests() 6/6 |
| 2026-05-26 | P-RC Audit | 4-file diagnostic comparison, 20-step rectifier plan written | ✅ DONE — `Chronological_Patch_Hx_RECTIFIER_PLAN_2026_05_26.md` |
| 2026-05-26 | P-RC Steps 1+6–8 | makeChoices fix + v17513/14/15 deleted + undo + validated | ✅ PASSED — `d162708`+`8741251`, FSRS 17/17, smoke 6/6, no double-advance |
| 2026-05-26 | P-RC Step 2 | bionic default + single-key round-trip + stale-key audit | ✅ PASSED — bionicOn true fresh-load, ON/OFF round-trip, only `bionicOn_v1751523`, FSRS 17/17, smoke 6/6 |
| 2026-05-26 | P-RC Step 3 | patchSettingsText bionic guard + stale key fix | ✅ PASSED — `f0f4d6b` |
| 2026-05-26 | P-RC Step 3b | bionic toggle revert root cause fixed — applySettings175157 writes localStorage, ensureBionic351 guarded | ✅ CODE — `3bbefde` — browser validation pending |
