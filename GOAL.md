# Project Goal Tracker

## Active Goal

**Goal:** P-RC Rectifier — execute 20-step patch cleanup plan to eliminate accumulated quick-fix debt
**Phase:** P-RC (Rectifier)
**Reference:** `Chronological_Patch_Hx_RECTIFIER_PLAN_2026_05_26.md` — authoritative step list
**Status:** IN PROGRESS

**Priority order (Steps 1–8 first — highest impact, unblock rest):**
- Step 1: Fix `makeChoices` return value → choices never undefined
- Step 2: Consolidate `bionicOn` initialization (single key, correct default)  
- Step 3–5: Consolidate bionic/timer persistence, normalize timerMax
- Step 6–8: Remove superseded drop-mechanic patches (v17513, v17514, v17515)

**P3.5 due-count widget:** deferred until after P-RC Step 8 — display code must be stable first

**Current phase:** DONE — FSRS v5 fully live; advancing to P3.5
**Prerequisite gate:** ✅ PASSED 2026-05-26 — `window.runFSRSValidation()` → 17/17, `window.runCozySmokeTests()` → 6/6

---

## Gate Condition

```
condition: browser:console validation suite after Steps 1–8
expected:
  1. advances.length === 1  (no double-advance)
  2. bindRatings called once per reveal
  3. choices is valid Array(4) of strings
  4. bionicOn === false on fresh load (localStorage cleared)
  5. window.runFSRSValidation() → 17/17 still passing
  6. window.runCozySmokeTests() → 6/6 still passing
```

**To unblock:** Run the 8 Codex console prompts in `Chronological_Patch_Hx_RECTIFIER_PLAN_2026_05_26.md` → all pass → mark DONE → advance to P3.5.

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
