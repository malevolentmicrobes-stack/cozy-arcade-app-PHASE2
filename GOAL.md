# Project Goal Tracker

## Active Goal

**Goal:** Implement FSRS v5 scheduling — replace SM-2 math in `rateCard()` with FSRS v5 algorithm
**Phase:** P3
**Reference:** `FSRS_V5_IMPLEMENTATION_PROMPT.md` — use this as the coding session prompt
**Status:** IN PROGRESS

**Current phase:** Phase 4 — FSRS v5 math inserted into `rateCard()` — awaiting final validation
**Prerequisite gate:** ✅ PASSED 2026-05-26 — `window.runFSRSValidation()` → 17/17, `window.runCozySmokeTests()` → 6/6

---

## Gate Condition (must pass before Phase 4 proceeds)

```
condition: browser:window.runFSRSValidation()
expected:  { passed: 17, total: 17, failed: [] }
output:    ✅ FSRS: 17/17 passed
```

**To unblock:** Open the live app in browser, open DevTools console, run:
```js
window.runFSRSValidation()
```
Report the output here. If output is `✅ FSRS: 17/17 passed` → mark gate PASSED → proceed to Phase 4.

**Phase 4 is locked until this gate passes. Do not modify `rateCard()` before then.**

---

## What Phase 4 will do (once gate passes)

- Replace SM-2 math inside `rateCard()` with FSRS v5 internals
- Add `stability`, `difficulty`, `retrievability` fields to `setProgress()` call
- Handle SM-2 migration: cards without `stability` default to `stability = max(interval_days, 1)`, `difficulty = 5.0`
- Update `previewInterval()` to match FSRS formula
- Run `window.runFSRSValidation()` → ✅ 17/17
- Run `window.runCozySmokeTests()` → ✅ 6/6
- Commit: `feat(fsrs): replace rateCard SM-2 math with FSRS v5`
- Push to both `origin public` and `phase2 public`

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
| 2026-05-26 | P3 FSRS Phase 4 | `rateCard()` SM-2 replaced with FSRS v5 math | ⏳ IN PROGRESS — run `runFSRSValidation()` + `runCozySmokeTests()` to confirm |
