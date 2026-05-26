# Project Goal Tracker

## Active Goal

**Goal:** P-RC Rectifier — Step 2: consolidate `bionicOn` to single key + correct default
**Phase:** P-RC (Rectifier)
**Reference:** `Chronological_Patch_Hx_RECTIFIER_PLAN_2026_05_26.md` — authoritative step list
**Status:** IN PROGRESS

**Completed (Steps 1 + 6–8):** ✅ DONE 2026-05-26
- ✅ Step 1: `makeChoices` return value fixed — choices always Array(4), never undefined
- ✅ Step 6: `stopAllDropTimers()` + `loopSolo` override added to v175151
- ✅ Step 7: v17513 drop overrides + v17514 style+script deleted
- ✅ Step 8: v17515 style+script deleted (primary double-advance source eliminated)
- ✅ Bonus: Undo review (Cmd/Ctrl+Z + iOS shake) added via `v175372-rectifier-undo-makechoices-smoke`

**Next priority (Steps 2–5):**
- **Step 2 ← ACTIVE:** Consolidate `bionicOn` to `bionicOn_v1751523` only; set default `true`
- Step 3: Fix `patchSettingsText()` 1200ms setInterval to read single key
- Step 4: Fix Apply button to write `cozyQuestionSeconds351`
- Step 5: Normalize remaining `timerMax` hardcoded literals

**P3.5 due-count widget:** unblocked — Step 8 complete, display code is now stable

**Prerequisite gate:** ✅ PASSED 2026-05-26 — `window.runFSRSValidation()` → 17/17, `window.runCozySmokeTests()` → 6/6, no double-advance, choices valid

---

## Gate Condition (Step 2)

```
condition: browser:console validation after Step 2
expected:
  1. localStorage.clear(); location.reload() → bionicOn === true on fresh load
  2. localStorage.setItem('bionicOn_v1751523','1'); location.reload() → bionicOn === true, drawer checkbox checked
  3. localStorage.setItem('bionicOn_v1751523','0'); location.reload() → bionicOn === false, drawer checkbox unchecked
  4. cozyBionic351 key no longer read or written (grep localStorage.setItem in console → only bionicOn_v1751523)
  5. window.runFSRSValidation() → 17/17 still passing
  6. window.runCozySmokeTests() → 6/6 still passing
```

**To unblock:** Run Step 2 Codex console prompts → all pass → add gate log entry → advance to Step 3.

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
