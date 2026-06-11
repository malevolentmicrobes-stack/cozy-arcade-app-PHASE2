# Cozy Arcade — Project Status & Task Registry
**Date:** 2026-06-11 | **Active branch:** PHASE2 main → origin/public (production)

---

## DEPLOYMENT ARCHITECTURE (critical — burned twice already)

| Repo | Dev branch | Production branch | Rule |
|------|-----------|-------------------|------|
| PHASE2 | `main` | **`origin/public`** | Every fix MUST be applied to BOTH |
| PHASE1 | `main` | `main` | Push to main = live |

**PHASE2 workflow:** `git worktree add /tmp/pub origin/public` → edit → commit → `git push origin HEAD:public` → remove worktree

---

## CURRENT PRODUCTION STATE

| Fix | main | origin/public (live) |
|-----|------|----------------------|
| Timer 15s (caps + dropdowns) | ✅ | ✅ |
| SW network-first (v17/v54) | ✅ | ✅ |
| FQ-AUTO-1: `selected=0` on undo | ✅ | ✅ 8eb10a4 |
| FQ-AUTO-2: cancel deferred auto-rate | ✅ | ✅ this push |
| FQ-NEW-3: ArrowUp keyboard close Full Card | ✅ | ✅ source verified |
| Rating path rectifier (June 3 exact script) | ✅ | ⚠️ audit separately |

**Immediate next push:** Production validation/monitoring after Undo HUD + FQ-AUTO-2 + Again requeue deploy.

---

## TASK REGISTRY — ALL OPEN ITEMS

### P1 — Critical / gameplay breaking

| ID | Task | Status | Notes |
|----|------|--------|-------|
| FQ-AUTO-1 | Runner auto-selects correct answer after undo | ✅ FIXED in public 8eb10a4 | `selected=0` in restoreUndoSnapshot |
| FQ-AUTO-2 | Deferred auto-rate fires after explicit rating | ✅ FIXED this push | Explicit rating clears `__cozyAutoRateHandle20260603` + pending payload |
| FQ-PUB-1 | Rating path rectifier exact June 3 script not in public branch | ⚠️ AUDIT | Public now has explicit rating stabilizer; audit whether full legacy rectifier is still needed |
| FQ-AGAIN | "Again" card doesn't reshuffle into current session | ✅ FIXED this push | Requeues current card into active pool and clears seen marker |
| FQ-FLASH | Review deck / settings bar menu flash (recurred) | ❌ OPEN | Was fixed, recurred after public branch repair |

### P2 — UI / usability

| ID | Task | Status | Notes |
|----|------|--------|-------|
| FQ-UNDO-BTN | Add visible Undo button left of Pause (= Ctrl/Cmd+Z) | ✅ FIXED this push | HUD button calls existing undo implementation |
| FQ-NEW-3b | Visible `^` click/touch button to close Full Card modal | ❌ OPEN | Keyboard close done; touch users can't close |
| FQ-NEW-3 | ArrowUp keyboard close Full Card | ✅ source verified | Public has ArrowUp/Escape close handlers |
| FQ-SCORE | Verify score/HP decreases on wrong answer | ❌ VERIFY | HP -25 on wrong exists; score logic unclear |
| FQ-REVIEW | Review Deck: pin/unpin + suspend/unsuspend controls | ❌ VERIFY | Unknown if accessible from Review screen |

### P3 — Data / export

| ID | Task | Status | Notes |
|----|------|--------|-------|
| FQ-EXPORT | Export progress → verify card ratings persist correctly | ❌ VERIFY | Auto-wrong + rate Good → FSRS state not browser-verified |
| FQ-IMPORT | Import `cozy_arcade_progress_2026-06-06_codex_stability_ghost_repair.json` | ❌ USER ACTION | User must import manually |

### P4 — Settings / cleanup

| ID | Task | Status | Notes |
|----|------|--------|-------|
| FQ-CACHE | Settings "Clear local cache" — safe card-preserving version | ❌ OPEN | Current "Clear Local State" nukes everything; need softer reset |
| FQ-5 | Remove dead `shadowSchedule351` dropdown | ❌ OPEN | Dead UI element |
| FQ-STRIPE | Replace `STRIPE_PLACEHOLDER_URL` in PHASE2 | ❌ USER ACTION | User provides real Stripe link |

### P5 — Final / future

| ID | Task | Status | Notes |
|----|------|--------|-------|
| FQ-PROMPT | Prompt AI textarea text — verify current vs. intended | ❌ VERIFY | Which text is wrong? |
| FQ-IOS1 | iOS1: Capacitor scaffold (`npx cap sync`) | ❌ OPEN | Final task before App Store |

---

## KNOWN WORKING — DO NOT RE-PATCH

| Feature | Verified |
|---------|---------|
| Number keys 1–4 pre-reveal (Solo + KE) | Line 432 keydown handler; UI hint confirms |
| Timer 11–15s (all modes) | Live: timerMax=13 confirmed on production URL |
| FSRS scheduling | 17/17 stable |
| Smoke tests | 6/6 stable |
| FQ-AUTO-1 undo lane reset | public 8eb10a4 |

---

## PATCH HISTORY (ordered)

1. E7/E7B/E7C — Phase 3 pool ownership, HUD dedup, scope sync (June 3)
2. P7 — SW/manifest/offline for PHASE2 (June 3)
3. A9 — Atlas tag/system filter → Solo launch (June 3)
4. Data patch — E3/E4 FSRS + ghost card reset (June 3)
5. Rating path rectifier — `cozy-rating-path-rectifier-2026-06-03` (June 3)
6. FQ-AUTO-1 + FQ-AUTO-2 + FQ-NEW-3 — undo reset + deferred rate cancel + keyboard close (June 10)
7. Timer 15s — 5 caps + 4 dropdowns + SW v16/v53 (June 11)
8. SW network-first — no more stale cache on deploy (June 11)
9. PHASE2 public repair — restore working public branch (June 11, 81fc423)
10. FQ-AUTO-1 re-applied to public — was lost in repair (June 11, 8eb10a4)
11. Codex implementation — Undo HUD/public FQ-AUTO-2/Again mid-session requeue + SW v17/v54 (June 11)

---

## NEXT CODEX PROMPT (ready to run)

**Target:** Validate and monitor Undo HUD/public FQ-AUTO-2/Again reshuffle in production after deploy.
**Validation gates:** FSRS 17/17 + Smoke 6/6 + undo button visible + Again card reappears within session
