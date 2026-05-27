# Project Goal Tracker

## Active Goal

**Goal:** P-RC Rectifier — Steps 4–5 active
**Phase:** P-RC (Rectifier)
**Reference:** `Chronological_Patch_Hx_RECTIFIER_PLAN_2026_05_26.md` — authoritative step list
**Status:** IN PROGRESS

**Completed (Steps 1–3, 6–8):** ✅ DONE 2026-05-26
- ✅ Step 1: `makeChoices` return value fixed — choices always Array(4), never undefined
- ✅ Step 6: `stopAllDropTimers()` + `loopSolo` override added to v175151
- ✅ Step 7: v17513 drop overrides + v17514 style+script deleted
- ✅ Step 8: v17515 style+script deleted (primary double-advance source eliminated)
- ✅ Bonus: Undo review (Cmd/Ctrl+Z + iOS shake) added via `v175372-rectifier-undo-makechoices-smoke`
- ✅ Step 2: `bionicOn` consolidated to `bionicOn_v1751523` only; fresh-load default is `true`
- ✅ Step 3: `patchSettingsText()` bionic block guarded to run once; stale key fixed
- ✅ Step 3b (bionic revert): `applySettings175157()` now writes `bionicOn_v1751523`; `ensureBionic351()` only force-syncs on first toggle init — `3bbefde`

**Also completed this session (bionic/settings rectifier):**
- ✅ `window.enhanceSettings` export — gear-click path now calls hydrating version (`45a26b6`)
- ✅ Settings Apply no longer auto-closes; Advanced panel hidden; bionic rerenders on Apply (`26153a4`)
- ✅ `v175374-rectifier-font-bionic-fix` style — font sizes restored, bionic contrast CSS added

**Next priority (Steps 4–5):**
- **Step 4 ← ACTIVE:** Verify Apply writes `cozyQuestionSeconds351` (handled by `applyVisibleSettings352()` line 8111 — confirm in browser)
- Step 5: Normalize remaining `timerMax` hardcoded literals

**P3.5 due-count widget:** unblocked — Step 8 complete, display code is now stable

**Prerequisite gate:** ✅ PASSED 2026-05-26 — `window.runFSRSValidation()` → 17/17, `window.runCozySmokeTests()` → 6/6, no double-advance, choices valid

**Pending visual gate:** `v175374` font + bionic contrast — visual confirm in browser required

---

## Gate Condition (Step 3b — bionic revert fix)

```
condition: browser:console validation after 3bbefde
expected:
  1. Uncheck bionic toggle → click Apply → close settings → reopen settings → checkbox is UNCHECKED
  2. localStorage.getItem('bionicOn_v1751523') === '0' after unchecking and applying
  3. Opening gameplay hub does NOT re-check the bionic toggle
  4. window.runFSRSValidation() → 17/17 still passing
  5. window.runCozySmokeTests() → 6/6 still passing
```

**To unblock:** Validate in browser → add gate log entry → advance to Step 5.

---

## Advancement Rules

| Condition | Action |
|-----------|--------|
| `runFSRSValidation()` → 17/17 | Gate PASSED → proceed to Phase 4 |
| `runFSRSValidation()` → any failures | Fix failing assertions → re-run → do not proceed |
| `runFSRSValidation()` not found | Phase 1–2 not yet inserted → insert helpers first |
| Phase 4 complete + `runCozySmokeTests()` 6/6 | Mark P3 DONE → advance to P3.5 (due-count widget) |

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
