# Cozy Arcade — Project Status 2026-07-04

## TL;DR
- **Live app is finally caught up.** PHASE2 `cozy-arcade-PHASE2-v64`, PHASE1 `cozy-arcade-v99` — both confirmed via direct curl of production `sw.js`, not just local/docs.
- **The reason it wasn't caught up for 10+ days, and the reason this cost a full day twice, is fully root-caused and fixed. Read the "Deploy Incident" section below before doing anything else in this project.**

---

## What shipped this session

**AUTO-TAGS-DIAGNOSIS-LEAK** — sparse cards (no source `tags` field) had `diagnosis` synthesized into the tags fallback (`[system, test, diagnosis]`), which then displayed as a visible diagnosis leak in Full Card's TAGS line. Fixed at all 3 confirmed-live sites (`normalizeCard`, `normalizeLimitlessCard`, `normalizeSourceCard`) by aligning to `[system, test]` only, matching two sibling normalizers that already used this safe pattern. Full-file re-grep confirmed zero remaining occurrences. PHASE2 `a1fea48` (v63→v64), PHASE1 `5ed3f60` (v98→v99). Codex live-browser-validated via the real Upload button under both SW-blocked and SW-allowed conditions.

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

## Open, unrelated to today's work (carried forward, see OPEN_DIFFERENTIALS.md for full detail)
- `REVEAL-TRIGGER-CHURN` — top-ranked real bug, multi-writer reveal architecture, needs a dedicated consolidation pass.
- HUD settings button offscreen on iPhone (PHASE2); PHASE1's unconditional home-button-hide CSS rule.
- `BOARD-TRIGGER-PREVIEW-TIMING`, `MULTI-OWNER-CLEANUP`, `FQ-ALGO-6/K`, `FQ-ALGO-7B`, `DOMAIN-RECORD-ZERO` — lower priority, deliberately deferred.
- `ANSWER-SELECT-HEADLESS` — headless-Chrome-only artifact, not confirmed user-visible, low priority.
