# Cozy Arcade — Project Status
**Date:** 2026-06-17 | **Active branch:** PHASE2 main → origin/public (production)
**SW:** PHASE2 `cozy-arcade-PHASE2-v24` | PHASE1 `cozy-arcade-v59`
**Last commits:** PHASE2 `948abe7` | PHASE1 `2e04efd`

---

## DEPLOYMENT ARCHITECTURE (never cross-push)

| Repo | Production branch | Rule |
|------|-------------------|------|
| PHASE2 `cozy-arcade-app-PHASE2` | `origin/public` | `git push origin HEAD:public --force` |
| PHASE1 `cozy-arcade-app` | `main` | `git push origin main` |

---

## PRODUCTION STATE

| Fix | ID | Status | Commit |
|-----|----|--------|--------|
| Explicit rating cancels deferred auto-rate | FQ-ALGO-1 | ✅ | 048d073 |
| `selected=0` on undo restore | FQ-AUTO-1 | ✅ | 8eb10a4 |
| Body class save/restore System 2 render | FQ-RENDER-2 | ✅ | line 3939 |
| getStudyPool('due') filters isDue+pinned | FQ-DUE-1 | ✅ | dfb2ecc |
| Pinned-only fallback in cardPool('due') | FQ-DUE-1b | ✅ | 477b25e |
| isSessionBlockedCard() in all pool scopes | FQ-POOL-1/2 | ✅ | 83079db |
| record(ok=true) clears repair_point | FQ-DATA-1 | ✅ | 83079db |
| All soloQuestion bionic writes use (window.bionic\|\|bionic) | FQ-RENDER-3 | ✅ applied | 8a22e66 — needs browser re-validate |
| System2 tick guards against stable mode via .soloStableDrop351 | FQ-RENDER-1 | ✅ browser-confirmed | 948abe7 — SS#1 once from System3, System2 silent |
| 18 null next_due_at review rows | FQ-ALGO-3 | ❌ open | P5 next |
| Again cards not requeued same session | FQ-ALGO-4 | ❌ open | P6 next |
| wrong_count bloat | FQ-DATA-2 | ❌ open | — |
| stability/difficulty not written good/hard/easy | FQ-ALGO-5 | ❌ open | — |
| Deck restore after hard reload | State-B | ❌ open | — |
| iOS Capacitor scaffold | iOS1 | ❌ open | — |
| Stripe | M2 | ❌ open | — |

---

## SESSION 4 — FQ-RENDER-1 ROOT CAUSE SAGA (2026-06-16/17)

### What actually failed (three attempts before real fix)

**Attempt 1 — stopAllDropTimers + clearSoloDrop at SS351 start (8a22e66)**
Diagnosis was wrong. `clearSoloDrop()` is defined inside System 2's IIFE. Calling it from System 3's IIFE throws a ReferenceError caught silently by try/catch. System 2's `raf175164` was NEVER cancelled.

**Attempt 2 — loopSolo ownership (ebeef5e)**
`startStableSoloDrop351()` overwrites `loopSolo` at the end to point to itself. Insufficient because System 2's renderSolo wrapper calls `startDrop()` DIRECTLY — not via `loopSolo`. Direct call bypasses the reassignment entirely.

**Attempt 3 — DOM class guard on System 2 tick (948abe7) ← CURRENT**
Root cause: System 2 and System 3 always start together (~same duration), expire ~40ms apart. System 2 fires selectSolo first. Fix: in System 2's tick expiry, check `choiceRow.classList.contains('soloStableDrop351')` before calling selectSolo. Stable mode adds this class at card start. No cross-IIFE variable access needed. If stable mode is NOT active (class absent), System 2 fires as a fallback — correct behavior.

### Three-engine architecture (never confuse these)

| System | RAF handle | Cancel fn | selectSolo at |
|--------|-----------|-----------|---------------|
| 0 | `raf` (line 756) | `safeClear()` via `window.stopAllDropTimers` | line 809 |
| 2 | `raf175164` (line 3887 IIFE) | `clearSoloDrop()` — **IIFE-scoped, NOT accessible externally** | line 3924 PHASE2 / 3936 PHASE1 |
| 3 | `soloStableRaf351` setTimeout | `clearTimeout(soloStableRaf351)` in SS351 itself | line 6985 PHASE2 / 7017 PHASE1 |

**Key invariant:** `clearSoloDrop()` cannot be called from outside System 2's IIFE. Any code in a different IIFE calling `clearSoloDrop()` will throw ReferenceError and silently no-op.

### Commit log this session

| Commit | Repo | Change |
|--------|------|--------|
| 8a22e66 | PHASE2 | stopAllDropTimers + (window.bionic\|\|bionic) all soloQuestion writes; SW v21→v22 |
| 243f182 | PHASE1 | Port same; add <b> guard to installBionicQuestionPatch352; SW v56→v57 |
| ebeef5e | PHASE2 | loopSolo ownership in SS351; SW v22→v23 |
| 767b0f1 | PHASE1 | Port loopSolo ownership; SW v57→v58 |
| 948abe7 | PHASE2 | System2 tick DOM class guard; SW v23→v24 |
| 2e04efd | PHASE1 | Port System2 tick DOM class guard; SW v58→v59 |

### Coding errors made this session (do not repeat)

| Error | What happened | Correct approach |
|-------|--------------|-----------------|
| Assumed clearSoloDrop() is globally accessible | It's IIFE-scoped in System 2; try/catch silently swallowed ReferenceError | Check scope before assuming callable; use DOM/window signals for cross-IIFE communication |
| Assumed loopSolo is the only System 2 restart path | System 2's renderSolo wrapper calls startDrop() directly | Trace all callers, not just loopSolo |
| git add without cd to PHASE1 first | Shell has no directory persistence between Bash calls; staged in wrong repo 3 times | Always `cd /path/to/repo && git add ...` in same Bash command |
| Static analysis claimed clearSoloDrop() would work | Three Codex browser stack traces were needed to confirm the actual failure | For cross-IIFE interactions, browser validation is required; static analysis is unreliable |

---

## NEXT CODEX TASK

**FQ-RENDER-1 ✅ CONFIRMED** (Codex browser audit 2026-06-17): SS#1 once from System 3 (line 6985). System 2 silent at line 3924. FSRS 17/17, smoke 6/6 both repos.

**Before P5 (one remaining check):** Domain-mode smoke test. Domain not exercised in audit. Source suggests low risk (uses `renderDomain`/`loopDomain`/`orbArena` — no `soloStableDrop351` dependency). Run one domain round to confirm no regression.

**P5 — FQ-ALGO-3:** 18 null next_due_at rows. Prompt in AGENTS.md with current SW versions.

**P6 — FQ-ALGO-4:** Again requeue. See CODEX_DAY_PLAN_2026-06-16.md.

---

## HARD CONSTRAINTS (never violate)

1. No new `<script>` blocks — all edits inline in existing source
2. No new `cardPool` or `nextCard` wrappers
3. Never cross-push PHASE1 ↔ PHASE2
4. `runFSRSValidation()` 17/17 + `runCozySmokeTests()` 6/6 after every change
5. Bump `sw.js` CACHE on every code-change commit (each repo separately)
6. Frozen localStorage keys — never rename: `soloStudyingState_v1757`, `cozy_arcade_progress_v1`, `cozy_arcade_persona_v1`, `cozyQuestionSeconds351`, `cozy_arcade_limitless_cards_v1`, `bionicOn_v1751523`
7. selectSolo chain = 11 layers — do NOT add layer 12
8. Codex prompts: under 80 lines, no CDP infra, no safaridriver gate
9. Always `cd /path/to/repo && git add` in single Bash call — shell has no directory persistence
