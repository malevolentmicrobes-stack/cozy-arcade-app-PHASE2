# Cozy Arcade — Project Status
**Date:** 2026-06-17 | **Active branch:** PHASE2 main → origin/public (production)
**SW:** PHASE2 `cozy-arcade-PHASE2-v36` | PHASE1 `cozy-arcade-v72`
**Last commits (2026-06-19, ~6:30pm):** PHASE2 `34697f4` (pushed origin/main+public) | PHASE1 `02e4d23` (pushed origin/main)
**Next tasks:** Re-test both the reveal first-frame fix and the FQ-ALGO-8 fix below — neither is live-browser-validated yet. M2 paused by user. iOS1 finish is user-run. DOMAIN-RECORD-ZERO awaits a product-intent answer.

## SESSION 18 — FQ-ALGO-8 fixed: a pre-mortem that ruled out the obvious suspects, then hardened the actual fallback (2026-06-19, ~6:30pm)

User asked for a full re-review of logged edits/rectifier plans/non-negotiables, then a pre-mortem, then the fix. Re-traced `advance()`'s full 7-layer chain with fresh line numbers (today's earlier edits had shifted everything) — confirmed, unlike `reveal()`, none of the 7 are hard-replacements, so the whole chain is genuinely live. Found a previously-undocumented layer (~12184, "E2 fix") with its own independent rating-good call, but tracing showed it correctly no-ops when select-time rating already succeeded — same as the final layer's own guard. Ruled out a stale-closure `selectSolo` theory by checking the actual enclosing `<script>` block for a shadowing local declaration (found none).

**Could not find a deterministic bug after this tracing.** Every guarded path looks correct in isolation — consistent with a genuine intermittent race, matching the user's own report ("one" wrong rating out of "a couple" autoselects, not every time).

Rather than guess at the race, hardened the fallback that produces the wrong symptom regardless of why it's reached: `wrappedAdvance` used to default to rating 'good' whenever no pending rating existed for the current card. Found that the live "Continue" button implementation has no rating logic of its own and relies entirely on this fallback — meaning the fallback can't simply be changed to "always compute the real rating" without breaking the Continue button's existing, intentional "always good" behavior. Added one flag, set only by that button's click handler, so the fallback now distinguishes an explicit Continue click (stays 'good') from Space/Arrow dismissing a reveal without one (now computes the actual rating via `ratingForSelection`). PHASE2 `34697f4` / PHASE1 `02e4d23`. Verified via 5-scenario JXA simulation. **Not live-browser-validated** — this is a safety-net fix for the observed symptom, not a proven fix for whatever race causes select-time rating to occasionally not register.

---

## SESSION 17 — first-frame flash fixed at the actual live root (2026-06-19, ~6:00pm)

"Apply the fix to the earliest writer" turned out to need real investigation: the `reveal()` chain has 17 reassignments, but most are dead code. `reveal175158` (~line 1878) is a hard replacement with no call to any prior `reveal` — and it's itself superseded by another hard replacement at ~line 7125 (also no prior call). Confirmed line ~7125 is the actual live root by checking that nothing else after it does the same thing — the only reassignments following it (8913, 9380, 9718) all properly chain via `prior.apply()`.

Hit one dead end during the trace: `dx.textContent=answer(card)` at line ~7139 appeared to call an undefined function (no `function answer(` anywhere in the file via several grep attempts), which would mean this entire branch throws on every call — directly contradicted by Codex's own validation showing the settled state working. Resolved: `answer` is a properly-scoped arrow function at line ~5843 (`const answer=c=>{...}`); an earlier broad grep search of mine had a `sort -u` step that deduplicated identical matched substrings across different lines, hiding this one. Worth remembering: dedup by matched text, not by line number, can silently drop real hits.

Applied the same `educational_objective`-vs-`diagnosis` contamination guard (proven at `renderRevealSections`, commit `7bf4273`) to the real root at line ~7141. Also applied to base `reveal()` (~412) and the ~1265 wrapper for consistency, despite confirming neither is reachable — harmless, not worth reverting. PHASE2 `57a8f0e` / PHASE1 `b69fa21`. Verified via JXA simulation against the line's specific fallback order before applying. **Not yet live-browser-validated** — recommend a re-test before considering REVEAL-TRIGGER-CHURN fully resolved.

Full `reveal()` chain table (live vs. dead, line by line) now in AGENTS.md.

## SESSION 16 — Claude verified Codex's SRS-validation alarm was a false alarm: wrong test, not a regression (2026-06-19, ~5:30pm)

Codex's Session 15 report flagged `runSRSValidation()` returning 11/17 as a possible scheduler issue. **This was a false alarm — `runSRSValidation()` is not the project's real validation gate.** Claude verified directly:
- `git log -L` on the function: added in commit `79b75e5` (2026-05-25), commit message literally **"implement window.runSRSValidation — 13 SM-2 assertions"** — written to test the pre-FSRS algorithm, a month before today, unrelated to anything done this session.
- Its assertions expect ease-factor-multiplication intervals and a dynamic `ease_factor` — neither matches current FSRS behavior (`fsrsNextInterval` is stability-based; `rateCard()` hardcodes `ease_factor: 2.5`). It fails because the algorithm intentionally changed long ago, not because anything broke.
- The project's actual gate, `runFSRSValidation()`, was extracted and **actually executed** by Claude (macOS JXA, exact current source) — **17/17, empirically confirmed**, not inferred from a diff.

**Your FSRS/scheduling algorithm is fully intact.** Nothing today touched any `fsrs*` function. `OPEN_DIFFERENTIALS.md` SRS-VALIDATION-MISMATCH marked ✗ DISPROVED.

**The other half of Codex's report was real and is the actual next task:** the reveal-panel fix (Session 14) corrects the *settled* state but not the *first frame* — base `reveal()` (the earliest synchronous writer) still paints the uncorrected/contaminated content before `renderRevealSections` corrects it ~20ms later. Mutation count only dropped slightly (55→53 / 57→55) since the other ~16 chain layers are untouched. Not fixed yet — same fallback logic needs applying at the earliest writer, mirroring the lesson from FQ-RENDER-5 (fix ownership at the earliest point, not the last).

## SESSION 15 — Codex post-Claude reveal-fix validation (2026-06-19, later same evening)

Codex reviewed Claude's PHASE2 `7bf4273` / log `c4db2e6` and re-ran the same browser harness against the patched current file. Full report: `CODEX_POST_CLAUDE_REVEAL_FIX_VALIDATION_2026-06-19.md`.

Results:
- Normal card reveal mutations: 55 before -> 53 after. Content stayed correct.
- Board-trigger-only contaminated card: stable/readable state is fixed by ~20ms (`board_trigger` displays instead of diagnosis), but the immediate reveal frame still shows the contaminated diagnosis before the deferred writer corrects it. Mutation count: 57 before -> 55 after.
- `runCozySmokeTests()` passed 6/6.
- `runSRSValidation()` returned 11/17 — **see Session 16 above: this was a false alarm, wrong function, not a regression.**

Updated differential order after validation: (1) residual first-frame reveal contamination, (2) remaining reveal DOM churn/900ms interval, (3) upstream field alias contamination, (4) cold-cache font swap.

## SESSION 14 — reveal-panel fix applied: flash + diagnosis-contamination, both addressed at the display layer (2026-06-19, ~5:00pm)

User asked Claude to push the most probable 1-2 fixes directly (save Codex credits) without removing anything that already works (explicit concern: don't backtrack on the working FSRS/rating algorithm, named "SM-2" in the request).

**What Claude verified before touching anything:**
- Re-confirmed Codex's 55/57-mutation finding by reading the actual `renderRevealSections()` code (the deferred, `setTimeout(0)`, final writer in `reveal()`'s 17-layer chain) — no idempotency guard on its `dx`/`trigger` writes, unlike the One Thing box, which already has one (`oneThingStableRenderSig`) and was therefore NOT part of the problem.
- Independently verified Codex's `educational_objective`-contamination finding by reading `canonicalizeCard()` directly — then found it's actually **worse than either of us first reported**: the exact "prefer `answer`/diagnosis-like text over `board_trigger`" anti-pattern recurs in **8 separate places** in the file (lines 1615, 4002-4003, 5413, 6752, 7140, 7648, 7652, plus `canonicalizeCard` itself at 11645/11676) — and `canonicalizeCard`'s specific contaminating branch is actually dead code in normal play (only called in `mode:'export'`; Codex's repro must have called it directly, bypassing the live app flow). The real contamination users see comes from one of the other 7 reachable sites — not individually identified which.

**Decision:** fixing all 8 sites, or doing Codex's recommended full reveal-chain consolidation, in one pass would be exactly the "bulk, no quick patches" risk this session has repeatedly warned itself about. Instead: one targeted guard at the final display point (`renderRevealSections`), which fixes the user-visible symptom regardless of which upstream site caused it for any given card.

**Fix applied (PHASE2 `7bf4273` / PHASE1 `b91cf8f`):** `renderRevealSections()` now (1) falls back to `board_trigger||quick_recall` whenever `educational_objective` is empty OR equal to `diagnosis` (the exact contaminated-symptom signature), and (2) skips the `dx`/`trigger` DOM write entirely when computed content is unchanged since the last paint — same proven pattern as the existing One Thing guard, not a new mechanism. Board Trigger and One Thing sections were left untouched; they already update correctly every call.

**Verification:** 5-scenario JXA simulation (`osascript -l JavaScript`, no node/Playwright in this environment) before applying — normal card, Codex's exact contaminated-card repro, empty-objective-with-quick_recall fallback, repeated same-card render (must skip), different card immediately after (must still update). All 5 passed. **Not live-browser-validated.**

**Explicitly not touched:** `selectSolo`, `advance()`, `rateCard()`, any FSRS/SM-2 scheduling code, the other 7 contamination sites, the 900ms reveal-refresh interval, or the broader 17-layer chain consolidation Codex recommended. All documented in OPEN_DIFFERENTIALS.md (REVEAL-TRIGGER-CHURN, DATA-EO-ALIAS, both now ⚠️ MITIGATED not ✅ FIXED) as real, deliberate, future work — not silently dropped.

---

## SESSION 13 — Codex reveal-glitch pre-mortem and top-5 test matrix (2026-06-19, later same day)

User asked for no shortcuts: review patch history/logs first, list plausible browser-surfaced sources, test the top five, and avoid backtracking on the working SM-2/rating algorithm. Codex created `CODEX_PREMORTEM_REVEAL_GLITCH_2026-06-19.md`.

Test results:
- Confirmed top mechanism: reveal answer-panel writer churn. Localhost browser harness with `MutationObserver` on `#soloReveal` measured 55 mutations for a normal reveal and 57 for a board-trigger-only reveal. `.boardTrigger350` and `.oneThing350` are inserted after reveal begins, so layout movement is deterministic.
- Confirmed second mechanism: field alias contamination. A board-trigger-only card normalized to `educational_objective = "Aortic dissection"`, duplicating diagnosis into the Educational Objective box. Source trace points to `canonicalizeCard()` assigning `educational_objective = c.educational_objective || c.answer || ...` and then `c.answer = educational_objective`.
- Confirmed lower-priority contributors: Google Fonts cold-cache swap (`display=swap`, not app-shell precached), multiple keydown/advance listeners, and global/body `MutationObserver` churn.

Fix direction recorded, not applied in this session: consolidate reveal rendering into one idempotent owner and fix canonical field aliasing. Do not add another reveal wrapper; do not touch SM-2/FSRS unless a separate FQ-ALGO-8 test implicates it.

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
