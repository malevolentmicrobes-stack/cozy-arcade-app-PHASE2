# Cozy Arcade — Project Status
**Date:** 2026-06-17 | **Active branch:** PHASE2 main → origin/public (production)
**SW:** PHASE2 `cozy-arcade-PHASE2-v33` | PHASE1 `cozy-arcade-v69`
**Last commits:** PHASE2 `88af09e` (pushed origin/main+public) | PHASE1 `0b4482a` (pushed origin/main)
**Next tasks:** CODEX_PROMPT_13 (FQ-ALGO-8 diagnostic — wrong auto-select rated 'good') and CODEX_PROMPT_14 (D4-MUTATION reopened — card glitch/flashing on zero-cache import), both diagnostic-only, independent of each other. FQ-ALGO-7, FQ-RENDER-5, DOMAIN-AGAIN-DUPE, FQ-DATA-2 closed today. M2 paused by user. iOS1 finish is user-run. DOMAIN-RECORD-ZERO awaits a product-intent answer from the user.

## SESSION 12 — "card glitch/flashing" reported, zero-cache repro (2026-06-19, same day)

User provided a screen recording (`claude_small_screen_recording_2026-06-19.mp4`) and 5 screenshots (`claude_screenshots_low_jpeg/`), reproduced on a complete new browser/computer with zero cache during JSON import, and asked Claude to try diagnosing/fixing directly first to save Codex credits.

Claude reviewed all 5 screenshots plus one frame extracted via macOS QuickLook (`qlmanage -t`, since no ffmpeg is available in this environment to sample the video at multiple timestamps). Findings:
- All captured frames show the same reveal card (Sarcoidosis/Löfgren syndrome) with consistent, correct content — no text corruption, duplication, or wrong-card content in any still.
- The visible difference between the two screenshot groups (narrower vs. wider layout) correlates with browser toolbar/zoom-badge differences, consistent with a window resize between captures rather than an app-level bug — but this doesn't rule out a true rapid flicker that's only visible in motion.
- Session was at Gate 12, not the first card post-import, so if this is real it isn't strictly first-import-only.

**Could not confirm a root cause from static evidence, so did not patch blind.** Reopened the existing D4-MUTATION differential (MutationObserver write-churn causing possible first-frame flicker, known since 2026-06-15, previously deprioritized as "not blocking") as the most likely match — not confirmed as the same mechanism. CODEX_PROMPT_14 queued: live diagnostic under a genuinely cold browser profile, matching the user's exact repro condition, instrumenting MutationObserver/className timing rather than guessing at a fix.

---

## SESSION 11 — re-test found a 5th bug: wrong auto-select rated 'good' (2026-06-19, same day)

User re-tested PHASE2 in a fresh browser after the FQ-DATA-2 fix. Reported directly: "a couple autoselect, space or arrow continue, one wrong autoselected but good." Provided two new exports (`cozy_arcade_deck_with_progress_backup(3).json`, `cozy_arcade_progress_2026-06-19(1).json`) — the export data itself doesn't capture enough forensic detail to prove which specific card was affected (no log of "displayed answer vs. committed rating"), so this rests on the user's direct observation, which is trusted.

Source audit found the live suspect: the final `advance()` (7th layer in a never-before-mapped wrapper chain, now documented in AGENTS.md) defaults to rating 'good' if no matching "pending" rating is found for the current card. The guard meant to prevent this from clobbering an already-correct rating (`alreadyRated`/`markRated`, a global single-value check) looks correct in isolation -- so the real trigger is either a gap in that guard under specific conditions, or one of at least 6 competing keydown listeners (Space/Enter/ArrowRight at the reveal screen, also never mapped before today) firing a different, non-rating-aware path instead.

**Not patched blind.** This is event-timing/race territory, the same category as FQ-RENDER-5 and DOMAIN-AGAIN-DUPE, both of which needed live instrumentation before a correct fix was possible. CODEX_PROMPT_13 instruments the full path and reproduces the exact reported sequence live, several times, before any fix is proposed.

---

## SESSION 10 — FQ-DATA-2 was never actually fixed; user caught it via their own progress export (2026-06-19)

User exported progress to `/Downloads/cozy_arcade_progress_2026-06-19.json` and noticed a few cards (incl. Primary Biliary Cholangitis) with absurd `wrong_count`. Claude investigated the export directly rather than guessing:

- The two PBC entries turned out to be two genuinely different cards (not a duplication bug) — ruled that out first.
- Found the real issue: the 3104391 commit's guard (`schema_version==='fsrs5'`) was dead code. Grepped the entire file — that value is never written to any per-card progress object. The guard could never fire, so `wrong_count` kept inflating by +1 on every page load for any card still sitting in 'again'/relearning state.
- Quantified against the real export: 27 of 99 reviewed cards (27%) affected. Worst: two cards at `wrong_count=136` (true value 1).
- `wrong_count` is genuinely user-visible (Neural Atlas card detail "Wrong" stat, plus an aggregate dashboard sum) — this wasn't cosmetic.
- Fixed the guard for real (checks actual phase3-native fields now) and added a one-time repair block that corrects already-corrupted values using the invariant `wrong_count = reviewed_count - correct_count` (provably exact, since those two fields don't have this bug). Verified against real corrupted data points from the export via JXA simulation before applying. PHASE2 `88af09e` / PHASE1 `0b4482a`, pushed.

**Process note for future sessions:** a "fix" that passes code review can still be completely inert if the guard condition checks for something no other code ever produces. Verify guard fixes against real persisted data shape, not just the diff.

---

## SESSION 9 — FQ-RENDER-5 fixed, DOMAIN-AGAIN-DUPE diagnosed and fixed (2026-06-19, same day as Session 8)

Codex ran PROMPT_10 (fix) and PROMPT_12 (diagnostic) back to back, with real credits this time.

| Item | Result |
|---|---|
| FQ-RENDER-5 | ✅ Fixed. Ownership flag stops System2's tick/startDrop loop entirely (not just its final action), claimed at the earliest synchronous point Codex found — better than the original prompt spec, eliminates a race the prompt only mitigated. Validated 3 consecutive Solo cycles, 0 warning mutations, both repos, before push. PHASE2 `fb09afa` / PHASE1 `2c8f4ce`. |
| DOMAIN-AGAIN-DUPE | ✅ Diagnosed correctly, then fixed. Codex's instrumented diagnostic (no source edits) found the `selectDomain`/`rate()` chain fires 5-6x per click but is *harmless* by itself — PHASE2 builds the pool correctly under that same repeated firing. The real bug: PHASE1 had kept an older, additive `requeueAgainCard()` that PHASE2 had already replaced. Claude verified the divergence directly, ported PHASE2's exact (already browser-proven) function into PHASE1, validated via 5x-repeat JXA simulation, committed `2b84281`. First confirmed PHASE1/PHASE2 source divergence found this project — worth a one-time full diff audit eventually, not urgent. |
| FQ-ALGO-5 | Upgraded from theoretical to measured: the rate()/rateCard() wrapper-reinstall schedule causes 5-6 stacked calls per single rating click. Currently harmless everywhere now. Logged, not actioned. |

App should be materially more stable now than at the start of today's session — three real, confirmed bugs closed in one day, all with either live browser validation (PROMPT_10) or careful source verification + simulation (PROMPT_9, DOMAIN-AGAIN-DUPE port).

---

## SESSION 8 — LIVE BROWSER AUDIT (PROMPT_11), one bug closed, one new found (2026-06-19)

Codex ran PROMPT_11 with real Playwright against the deployed GitHub Pages URLs (not local seeds) for both repos.

| Finding | Result |
|---|---|
| FQ-ALGO-7 (Again pool reshuffle) | ✅ Browser-confirmed fixed. `[1,2,3,4]→Again(3)→[3,1,2,4]` in both repos. **Closed.** |
| FQ-RENDER-5 (AUTO-SELECT warning ghost) | ✅ Re-confirmed still live in both repos. `choiceRow` showed `v175151-drop warning soloStableDrop351` simultaneously. Run CODEX_PROMPT_10 next. |
| DOMAIN-AGAIN-DUPE (new) | ❌ Confirmed: same card appeared 4x in `session.pool` after a Domain Again rating. Claude's source audit found `selectDomain` has ≥13 wrapper layers, never mapped before today (now documented in AGENTS.md). Mechanism not yet pinned down — needs live instrumentation (CODEX_PROMPT_12), not a guessed fix. |
| RENDER-STALE-REVEAL (new, low priority) | 🔍 Reveal text possibly mixing previous/next card content after `advance()`. Not confirmed user-visible. Revisit after the two above are fixed. |

No console/page errors in either repo during the audit.

---

## SESSION 7 — FQ-ALGO-7 REVERT, applied without Codex (2026-06-18)

Codex had no credits available. Claude pre-mortemed (verified the revert was byte-exact to pre-22260dc code, checked no later code depends on the full-reset behavior, traced 4 pool scenarios via macOS JXA) and applied the revert directly to both repos.

| Repo | Commit | SW | Pushed? |
|------|--------|----|---------|
| PHASE2 | `c2807ac` | v30→v31 | No — local only |
| PHASE1 | `b9168f5` | v65→v66 | No — local only |

Not browser-validated (no Playwright/node in Claude's environment). Recommend a manual spot-check next time the app is open: miss one card, confirm the rest of the queue doesn't visibly reshuffle.

---

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
| All soloQuestion bionic writes use (window.bionic\|\|bionic) | FQ-RENDER-3 | ✅ applied | 8a22e66 — browser-confirmed |
| System2 tick guards against stable mode via .soloStableDrop351 | FQ-RENDER-1 | ✅ browser-confirmed | 948abe7 — SS#1 once from System3, System2 silent |
| 18 null next_due_at review rows | FQ-ALGO-3 | ✅ applied | 0d12676 — needs browser validate |
| Again cards not requeued same session | FQ-ALGO-4 | ✅ applied | 0d12676 — needs browser validate |
| Domain timer auto-select (loopDomain wrapper) | DOMAIN-AUTO-SELECT | ✅ applied | 0d12676 — needs browser validate |
| patchVisibleLanguage \b word boundaries (medical term corruption) | PATCH-LANG-MEDICAL | ✅ applied | ca70006 — needs browser validate |
| TreeWalker skips content nodes (#soloQuestion etc) | PATCH-LANG-WALKER | ✅ applied | 0d12676 — needs browser validate |
| Domain bionic writes closure capture | DOMAIN-BIONIC | ✅ applied | f345dda — source-confirmed |
| wrong_count bloat | FQ-DATA-2 | ✅ fixed | 3104391 |
| stability/difficulty not written good/hard/easy | FQ-ALGO-5 | 🔍 monitoring (architectural risk only) | — |
| Deck restore after hard reload | State-B | ✅ fixed | 98b5254 |
| iOS Capacitor scaffold | iOS1 | ✅ scaffold done (capacitor.config.json + package.json + icon-512.png) | 918ef92 |
| Stripe | M2 | ❌ open — blocked on user's real Stripe Payment Link | — |

---

## SESSION 6 — iOS1 CAPACITOR SCAFFOLD (2026-06-18)

PHASE2 only — Capacitor scaffold per CODEX_PROMPT_8. `manifest.json` had empty `icons: []`; Claude generated `icon-512.png` (512x512, upscaled from the existing DNA-helix sigil art) and added it to manifest before handing the prompt to Codex.

| Step | Result |
|------|--------|
| STEP 0 deployment gate | passed at PHASE2 v30 |
| STEP 1 audit | manifest.json had required fields; sw.js present; package.json absent |
| STEP 2 | created `capacitor.config.json` |
| STEP 3 | created `package.json` (Capacitor v6 deps only, no `npm install` run) |
| STEP 4 | icon-512.png validated as real 512x512 PNG, referenced in manifest |
| STEP 5 commit/push | `918ef92` — staged only capacitor.config.json, package.json, manifest.json, icon-512.png; pushed `origin/main` and `origin/public` (force) |

index.html and sw.js untouched — SW version stays v30. No PHASE1 changes (iOS1 is PHASE2-only).

**Remaining for iOS1:** user runs `npx cap add ios` → `npx cap sync` → opens `ios/` in Xcode (manual, not a Codex task).

---

## SESSION 5 — v25/v26 DATA + LANG FIXES (2026-06-17 end-of-day)

### Commit log

| Commit | Repo | SW | Change |
|--------|------|----|--------|
| ca70006 | PHASE2 | v24→v25 | patchVisibleLanguage: add \b word boundaries to prevent Strongyloides→Goodyloides corruption |
| [PHASE1 port] | PHASE1 | v59→v60 | Port same lang fix |
| 0d12676 | PHASE2 | v25→v26 | FQ-ALGO-3 null-due repair block; FQ-ALGO-4 again requeue; DOMAIN-AUTO-SELECT loopDomain fix; PATCH-LANG-WALKER DOM skip |
| 65ddcdf | PHASE1 | v60→v61 | Port all above |

### Status: applied but NOT browser-validated yet
Run `CODEX_PROMPT_4_VALIDATE_AND_DOMAIN.md` to browser-confirm all v26 fixes.

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
