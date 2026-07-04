# Cozy Arcade — Project Status 2026-07-04

## TL;DR
- **Live app is finally caught up.** PHASE2 `cozy-arcade-PHASE2-v64`, PHASE1 `cozy-arcade-v99` — both confirmed via direct curl of production `sw.js`, not just local/docs.
- **The reason it wasn't caught up for 10+ days, and the reason this cost a full day twice, is fully root-caused and fixed. Read the "Deploy Incident" section below before doing anything else in this project.**

---

## What shipped this session

**AUTO-TAGS-DIAGNOSIS-LEAK** — sparse cards (no source `tags` field) had `diagnosis` synthesized into the tags fallback (`[system, test, diagnosis]`), which then displayed as a visible diagnosis leak in Full Card's TAGS line. Fixed at all 3 confirmed-live sites (`normalizeCard`, `normalizeLimitlessCard`, `normalizeSourceCard`) by aligning to `[system, test]` only, matching two sibling normalizers that already used this safe pattern. Full-file re-grep confirmed zero remaining occurrences. PHASE2 `a1fea48` (v63→v64), PHASE1 `5ed3f60` (v98→v99). Codex live-browser-validated via the real Upload button under both SW-blocked and SW-allowed conditions.

**ADVANCE-LOCK-SELF-CANCEL** — switching Pages to `main` exposed a previously hidden live regression: Solo reveal would hide after Space/Continue, but `current`/`index` did not advance, so the same card stayed on screen. Browser trace confirmed `advance()` returned before `nextCard()`/`renderSolo()`. Fixed by removing the self-cancel pre-lock in `bindFinalRatings()` and narrowing `__cozyLastAdvanceAt351` so it only guards visible reveal transitions, not hidden auto-timer calls. PHASE2 v64→v65, PHASE1 v99→v100. Local browser matrix passed both repos: correct+Space, wrong+Space, Continue button, FSRS 17/17, smoke 6/6.

**New standing rules added** (full detail in OPEN_DIFFERENTIALS.md):
- `NO-SYNTHESIZED-LEARNING-FIELDS`: diagnosis/answer may feed `answer`/`diagnosis`/`output`, never `educational_objective`/`quick_recall`/`explanation`/`one_thing`/`board_trigger`/`tags`. This exact anti-pattern has now recurred 4 times in different fields.
- `WINDOW-NORMALIZE-LIMITLESS-TRIPLE-OVERWRITE`: `window.normalizeLimitlessCard` is reassigned 3x across 3 script blocks; the live one (~line 9006) is not the function literally named `normalizeLimitlessCard` (~line 8393). Grep every `window.<fn> =` assignment before trusting which function is actually live.

---

## Deploy Incident — READ THIS BEFORE TRUSTING ANY "LIVE" CLAIM IN THIS PROJECT

**Cost:** a full day, twice — once roughly a week before this session, then again during this session, before being fully root-caused.

**What happened:** `main` had contained all the validated fixes (through v64/v99) for over a week. The live GitHub Pages site kept serving `v49`/`v65` the entire time. Multiple prior sessions declared fixes "done" and "live" based on local browser validation, without ever independently re-checking the actual production URL.

**Root cause:** A 2026-06-24 session (`PAGES-SOURCE-BRANCH` in OPEN_DIFFERENTIALS.md) recorded that PHASE2's GitHub Pages Source setting had been switched from `public` to `main`, and claimed this was "confirmed live." That claim was never re-verified against a live curl afterward — it was trusted at face value. Direct proof gathered this session: `git show origin/public:sw.js` matched the live site exactly (frozen at the last version pushed to `public`, 06-22/23), while `origin/main` had raced ahead for 10+ days with zero live effect. Whatever happened in Settings on 06-24, Source was not actually `main` in practice.

**Secondary complication found mid-fix:** force-pushing `main`'s content into `public` (a workaround attempt) caused GitHub's own internal classic "pages build and deployment" pipeline to run — its build step succeeded but its deploy step failed, twice, identically. Most likely explanation: a leftover Environment (`github-pages`) deployment-branch restriction from the abandoned 06-24 switch attempt, allowing only `main` to deploy while Source still pointed at `public`. Could not confirm the exact log text (requires repo-admin API auth this environment doesn't have).

**Actual fix:** user changed Settings → Pages → Source → `main` directly (for both repos). Verified live within one curl poll (~10s) of the change. No further Settings changes needed.

**Permanent prevention, now in place:**
1. **Process rule:** never report a fix as "live" without an actual curl of the production `sw.js`, every time, regardless of what any doc claims was already verified. See `DEPLOY-STALE-GATE` in OPEN_DIFFERENTIALS.md and Rule #2 in `CLAUDE_HANDOFF_2026-06-15.md`.
2. **Structural safety net:** both repos now run `.github/workflows/pages.yml` ("Sync main to public") on every push to `main` — force-pushes `main` into `public` automatically. Kept running indefinitely (explicit user decision) even though Source is now `main` directly, specifically so that if Source ever silently reverts to `public` again, live can never be more than one push behind. This is intentional redundancy, not leftover cruft — do not remove it without asking the user first.

---

## ADVANCE-LOCK-SELF-CANCEL — emergency, same day, fixed and live-confirmed
Switching Pages to `main` exposed a real regression already sitting on `main` for weeks: Space/Continue hid the reveal panel but never dealt the next card. Root cause: `bindFinalRatings()` set a redundant pre-lock before calling `advance()`, and `wrappedAdvance`'s shared 350ms lock checked/set unconditionally even on non-reveal calls, letting stray calls poison the timestamp right before the real press arrived. Fixed both repos (PHASE2 `933a74e`, PHASE1 `3361061`, v64→v65/v99→v100). User played it live and confirmed. Full incident + prevention lesson in OPEN_DIFFERENTIALS.md `ADVANCE-LOCK-SELF-CANCEL`.

## REVEAL-TRIGGER-CHURN — root cause found and fixed same day
Weeks of "multi-writer reveal architecture" investigation only had half the picture. Live MutationObserver + stack-trace instrumentation (real Upload-button flow) found the actual majority contributor: two undocumented `setInterval` sweeps (`relabelMainFilters()` 1200ms, `pinLanguage()` 1000ms) walking the entire document and unconditionally rewriting `.textContent` even when unchanged, plus two more unconditional writers (`ensureFull()`, `refreshPinButtons()`) on the existing 250ms reveal-open interval. Added write-if-changed guards to all four — same idempotency pattern already used elsewhere in this file. Measured: 58→10 writes reveal-open, 49→12 post-advance, both repos, confirmed live not just local. Re-tested the "stale content while hidden" question directly on live — no drift found. PHASE2 `c013ff6` (v65→v66), PHASE1 `49475dc` (v100→v101). Full writeup in OPEN_DIFFERENTIALS.md `REVEAL-TRIGGER-CHURN`.

**What's still open in the reveal chain:** the underlying architecture (at least 5 confirmed-live wrapper layers for the solo-answer path — lines 2485/9751/9413/8946/7133, verified today by live stack trace, NOT the "1 root + 3 chain" the 06-19 docs claimed) is unconsolidated. Domain-mode and other call sites not yet verified against the same trace. See RECTIFIER_PLAN's 2026-07-04 addendum for the full plan if/when this gets tackled.

## Why so many errors today — read this before assuming any doc/memory claim is current
Four separate incidents in one session, each with the same root shape: something was declared true (deploy fixed, advance fixed, reveal chain mapped) without live re-verification, and stayed wrong for days-to-weeks before someone actually checked. Full pattern analysis in `RECTIFIER_PLAN_2026_05_26.md`'s 2026-07-04 addendum. Short version: curl/instrument/trace before declaring anything done, every time, regardless of what a prior session recorded.

## Open, unrelated to today's work (carried forward, see OPEN_DIFFERENTIALS.md for full detail)
- HUD settings button offscreen on iPhone (PHASE2) superseded — corrected finding: PHASE1 has duplicate anonymous Home buttons partially offscreen instead; gear/Settings visibility confirmed fine both repos.
- `BOARD-TRIGGER-PREVIEW-TIMING`, `MULTI-OWNER-CLEANUP`, `FQ-ALGO-6/K`, `FQ-ALGO-7B`, `DOMAIN-RECORD-ZERO` — lower priority, deliberately deferred.
- `ANSWER-SELECT-HEADLESS` — headless-Chrome-only artifact, not confirmed user-visible, low priority.
- `RENDER-NULL-CURRENT` — real defensive gap (`renderSolo` reads `current.system` with no null guard), confirmed via forced test only, not naturally reproduced. Low priority.
