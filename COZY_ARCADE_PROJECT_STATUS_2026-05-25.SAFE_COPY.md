# Cozy Arcade Board Prep Medicine — Project Status

**Date:** May 25, 2026 (updated ~2pm)
**Repo:** `cozy-arcade-app- PHASE2` · `malevolentmicrobes-stack/cozy-arcade-app`
**Primary files:** `index.html` (10,604+ lines), `progress_beta.html`
**Git HEAD:** `ab9d206` — Install Graphify Claude project context
**Origin sync:** ✅ Local = origin/main (clean working tree)

---

## ⚡ Premortem Corrections (read before any terminal session)

| # | Correction |
|---|---|
| 1 | Phase 2 mobile shell is **already done** — commit `5b2154e` on origin/main, pulled via rebase. Do not treat as pending. |
| 2 | Git is **clean and synced** at `ab9d206`. Nothing to push. |
| 3 | **Active Task A** = Atlas/deck hydration persistence. Run this first. |
| 4 | **Active Task B** = SRS Again timing. Run this second, browser-first. |
| 5 | Task B must NOT start until Task A is diagnosed and patched. |
| 6 | SRS math (`rate()`, `rateCard()`) is protected and verified 13/13. Do not rewrite. |
| 7 | Task B always starts with `window.runSRSValidation()` in browser — not a Codex grep task. |

**Immediate next terminal session order:**
```
1. Confirm .gitignore exists (not just gitignore.txt) and private files are ignored
   → git check-ignore -v <exported JSON> <RTF continuity prompt>
2. graphify update .
3. Task A diagnosis only — no edits
4. Patch only if exact failing branch confirmed
5. Browser validate Atlas reload with deck_with_progress
6. Then Task B browser-first SRS Again timing
```

---

## Workflow Convention

> **One canonical status file.** Discard dated duplicates after merge.
> - `VALIDATION` docs → merge PASS/FAIL results here, then delete.
> - `CODEX_HANDOFF` docs → extract completed items here, then delete.
> - Rule: if Phase N is ✅, it lives only in **Completed Log**.

**Tool routing:**

| Task | Tool |
|------|------|
| grep, git diff, git status, graphify | Claude Code terminal |
| Read/patch index.html / progress_beta.html | Claude Code terminal |
| Validate patches, commit, push | Claude Code terminal |
| Pitch, product strategy, prompt design | Claude web / ChatGPT |
| Architecture discussion, status planning | Claude web (here) |

> **Rule:** Repo → Claude Code terminal. Judgment/planning/wording → Claude web.

---

## Graphify Status

**Active:** ✅ Graphify skill loaded and confirmed working in Claude Code.
- Graph built at commit `27a0a3e`. Current HEAD is `ab9d206` (2 commits ahead).
- Graph covers 17 communities, 236 nodes. Community 13 = highest-risk code cluster.
- **Action needed in terminal before next deep analysis:**
  ```
  graphify update .
  ```

---

## Completed Log

### Phase 1.1 — Settings Drawer / Import-Export Label Cleanup
**Status:** ✅ Completed, tested, validated, pushed.
- `Upload JSON Deck` → `Upload Deck` · `Download JSON` → `Download Deck` · `Progress ↗` → `Progress`
- Settings drawer: primary `Import ▾`, secondary `Export ▾`
- Import routes through `importObjectPhase3` · Export: Deck / Progress / Full Deck + Progress

### Phase 1.2 — Progress Link Mutation Fix
**Status:** ✅ Completed, tested, validated, pushed. Commit `dafabbb` regression-checked.
- `#limitlessImportStatus` stable as Progress navigation only.
- `updateImportButtons()` does not write deck-count text, set onclick=null, or disable Progress.
- `ensureImportPanel()` preserves Progress node/listener.
- `wireUi()` wires Progress to `progress_beta.html` only.
- `progress_beta.html` reads `cozy_arcade_state_v3` defensively.
- Phase 1.1 labels preserved. Non-blocking: dead code in `ensureHomeImport()` ~line 8863 (defer).

### Phase 1.2.2 — Review Deck Filtering / New-Card Launch Scope
**Status:** ✅ Filtering logic validated. Random-new excludes reviewed/relearning cards.
- Fixed: `stateFor()`, `getCardIdentityKeys()`, `progressForCard()`, `isReviewedCard()`, `isNewCard()`
- Fixed: `isReviewCandidate()`, `normalizeMode()`, `basePlayableCards()`, `getStudyPool()`, `startSolo()`
- Fixed: `progress_beta.html` `storeHydratedPayload()`
- Identity aliases checked: `qid_unique`, `card_id`, `original_qid`, `legacy_id`

### Phase 2 — Mobile Top-Bar / Game Shell (cozy-mobile-shell-371)
**Status:** ✅ Already committed on origin/main as `5b2154e`. Pulled into local via rebase.
- `cozy-mobile-shell-371-css` — lines 12091–12466 (375 lines, pure CSS)
- `cozy-mobile-shell-371-js` — lines 12467–12692 (226 lines, IIFE)
- Breakpoints: ≤900px, ≤480px, landscape ≤560px, ≤760px
- Functions: `normalizeHud()`, `wrapGameMain()`, `patchDomainGeometry()`, `ensureSettingsButton()`
- **Phase 1.2 regression confirmed clear** — shell does not touch `#limitlessImportStatus`, import/export, or settings drawer.

### localStorage Contract (finalized)
- Main app owns import + persistence: `cozy_arcade_limitless_cards_v1` (deck) + `cozy_arcade_state_v3` + `cozy_arcade_progress_v1`
- Atlas (`progress_beta.html`) is a pure reader — auto-hydrates `deckMap` from shared keys.
- One "Export Full Backup" button → single JSON roundtrips everything.

---

## Active: Task A — Atlas / Deck Hydration Fix

**Status:** 🔶 Diagnosed. Surgical patch designed. Not yet applied.
**Priority:** HIGH — blocks full Atlas reload persistence.

**Symptom:** Atlas shows progress-only state (22-signal) instead of full deck+progress (full system nodes) after reload.

**Root cause differential (confirmed most likely first):**

| # | Cause | Likelihood |
|---|-------|-----------|
| B | `QuotaExceededError` silently swallowed — ~9.3MB deck fails `localStorage.setItem`, Atlas falls back to progress-only on reload | **Highest** |
| E | Atlas `ingestJSON()` classifies `deck_with_progress` as progress-only (checks `progress` key first, returns early, skips `cards[]`) | High |
| A | `index.html` and `progress_beta.html` running from different origins/paths (file:// vs localhost) — localStorage not shared | Medium |
| C | Atlas import UI language biases user to drop progress-only JSON instead of `deck_with_progress` | Medium |
| D | `isDue()` / pool uses `repair_point` flag to make card immediately due, overriding `next_due_at` | Medium (overlaps Task B) |

**Terminal prompt — Task A (diagnosis only, no edits):**
```
Premortem check first:
- Phase 2 mobile shell is already done (5b2154e). Do not revisit.
- Git is clean at ab9d206. No pending push.
- Task A = Atlas hydration diagnosis only. No edits.
- Task B (SRS) does not start until Task A is resolved.

Step 0 — Verify .gitignore:
- Confirm .gitignore exists (not just gitignore.txt)
- Run: git check-ignore -v cozy_arcade_deck_with_progress_backup*.json
- Run: git check-ignore -v *MASTER_CONTINUITY*.rtf
- Report what is and isn't ignored

Step 1:
graphify update .

Step 2:
Read: CLAUDE.md, COZY_ARCADE_PROJECT_STATUS_2026-05-25.md, graphify-out/GRAPH_REPORT.md

Step 3 — Inspect only index.html and progress_beta.html:
1. When main app opens Progress, does it first persist cards to cozy_arcade_limitless_cards_v1?
2. Does it persist progress to cozy_arcade_state_v3 and cozy_arcade_progress_v1?
3. Does progress_beta.html read cozy_arcade_limitless_cards_v1 before building system nodes?
4. Does progress_beta.html ingest deck_with_progress before progress-only handling?
5. Does any localStorage.setItem for the full deck silently catch QuotaExceededError?
6. Is there a compact/atlas-minimal fallback if the full deck is too large?
7. Are index.html and progress_beta.html assumed to be same-origin?
8. Does Atlas top-bar Import JSON language bias users toward progress-only import?

Output:
- .gitignore status (ignored / not ignored / missing)
- exact failing branch/function
- whether failure is: quota, classification, same-origin, or fallback-cache
- smallest safe patch description
- no edits
```

**Commit gate (when patch is ready):**
- [ ] `git diff --check -- index.html progress_beta.html` passes
- [ ] Import `deck_with_progress` → reload → Atlas shows full system nodes (not 22-signal)
- [ ] No Phase 1.1 / 1.2 regressions
- [ ] Suggested message: `Fix localStorage quota: atlas-minimal fallback on oversized deck`

---

## Active: Task B — SRS Timing / Again Queue Validation

**Status:** 🔶 Diagnosed. Validation prompt ready. Not yet run in terminal.
**Priority:** HIGH — Again cards may repeat immediately or get lost.

**Expected Anki-style behavior:**
- `Again` → `stage=relearning`, `repair_point=true`, `next_due_at = now + 10min`, excluded from Random-new
- After 10min: card is due, re-enters Review/due flow, NOT lost, NOT immediate repeat
- `Random - new cards` never includes relearning/reviewed cards

**Suspected primary bug:**
```
isDue() returns true immediately because repair_point or stage='relearning'
overrides the next_due_at check — so Again is scheduled for 10min
but the pool treats it as due NOW.
```

**Theoretical smallest fix (do not apply yet — confirm first):**
```js
function isDue(progress) {
  if (!progress) return false;
  if (progress.next_due_at) {
    const dueTime = Date.parse(progress.next_due_at);
    if (!Number.isNaN(dueTime)) return dueTime <= Date.now();
  }
  return !!(progress.repair_point || progress.stage === 'relearning');
}
```

**Terminal prompt — Task B (validation only, no edits):**
```
Use Graphify first if helpful. Run: graphify update .

Read:
1. CLAUDE.md
2. COZY_ARCADE_PROJECT_STATUS_2026-05-25.md
3. graphify-out/GRAPH_REPORT.md

Task: SRS timing validation — Again queue behavior. Do not edit files.

Inspect only index.html (and progress_beta.html only if needed for export/Atlas SRS display).
Clinical/card content must not be changed.

Validate these SRS functions:
- rateCard() — confirm Again sets: stage='relearning', interval_days=0, ease_factor-=0.2,
  repair_point=true, next_due_at=now+10min, last_rating='again'
- isDue() — does it check next_due_at FIRST, or does repair_point override timing?
- getStudyPool() — does 'due-weighted review' mode include repair_point cards
  regardless of next_due_at?
- session.seenThisSession — does it block a due Again card from re-entering after 10min?
- advance()/next-card — is the session pool static (built once) or does it rehydrate
  delayed relearning cards?
- basePlayableCards() / isReviewCandidate() — confirm Again cards excluded from Random-new

Output for each function:
- PASS/FAIL
- exact current behavior for Again
- whether bug is: rating math / due timing / pool selection / session queue / identity / export-import
- minimal patch recommendation if needed (no edits unless I approve)
- regression checklist

Most likely bug: isDue() makes repair_point/relearning immediately due,
overriding next_due_at. Confirm or rule out before any other fix.
```

**Commit gate (when patch confirmed):**
- [ ] Again card does NOT reappear in Random-new
- [ ] Again card does NOT immediately reappear in due queue
- [ ] After simulated 10min, Again card is retrievable in review/due mode
- [ ] Export/reimport preserves `stage`, `next_due_at`, `repair_point` fields
- [ ] Suggested message: `Fix SRS isDue: respect next_due_at for relearning/repair cards`

---

## Phase 2 Mobile Shell — Risk Monitoring (no action needed now)

Post-rebase notes from Claude Code review. Watch during mobile testing:

| Risk | Area | Severity |
|------|------|----------|
| MutationObserver on `document.body` (subtree:true) fires on every DOM change; `run()` called continuously | `cozy-mobile-shell-371-js` | Medium — appendIf guard prevents actual churn, but callbacks still execute at high frequency |
| `wrapGameMain()` reparents `.promptBox` — any code using `#solo > .promptBox` (direct child selector) silently fails | `cozy-mobile-shell-371-js` | Medium — grep needed if display issues arise |
| `patchDomainGeometry()` monkey-patches `window.positionOrbs` — any later reassignment of `positionOrbs` silently loses geometry correction | `cozy-mobile-shell-371-js` | Medium — graceful fallback exists |
| `:has(.reveal:not(.hidden)) > .promptBox { display:none !important }` — race condition could blank game screen | `cozy-mobile-shell-371-css` | Low-medium |

---

## Future Roadmap (post-mobile, pre-publishing)

> Separate detailed file: `COZY_ARCADE_REFACTOR_PLAN_v1.md`. This is the summary gate order.

### P3 — SRS Algorithm Upgrade (FSRS v5)
Replace SM-2 in `rateCard()` with FSRS v5 (~50 lines inline). New fields: `stability`, `difficulty`, `retrievability`. No external library. Do after SRS timing (Task B) is validated.

### P4 — End Screen Per-System Breakdown
`endRun()` currently shows flat score. Enhance to per-system breakdown. Add `let sessionStart = Date.now()` to `resetRun()`. Group cards seen this session by `sys`.

### P5 — CSV Import
Replace stub toast in `importDeck()` with real CSV parser. Headers → card fields. Use `parseJsonLoose()` equivalently for field cleanup.

### P6 — Energy Rank Display (optional backport)
Restore 6-tier rank system from `cozy-energy-theme-352`:
`Training Grade → Grade 4 → Grade 3 → Grade 2 → Grade 1 → Special Grade`
Energy per rating: easy=30, good=20, hard=10, again=4.

### P7 — PWA / Offline
- `sw.js` service worker caching `index.html`
- `manifest.json` with standalone display
- Self-hosted Orbitron + DM Sans (replace Google Fonts CDN)
- Required before: no hospital WiFi dependency

### P8 — Security Audit (before publishing)
- Review localStorage exposure (no PII, but deck content is sensitive)
- Content Security Policy headers if hosted
- No hardcoded secrets (Supabase keys must stay in localStorage user input only)

### P9 — Supabase Sync (optional)
- `syncWithSupabase()` called after `boot()` + `loadProgress()`
- POST progress to `user_progress` table, merge remote with local
- Keys via `localStorage.getItem('cozy_supabase_url')` — never hardcoded

### P10 — Capacitor iOS / Android
- Wrap single-file HTML in Capacitor project
- Haptic feedback via `@capacitor/haptics` on correct/wrong
- Local filesystem storage via `@capacitor/filesystem` for deck files
- Prerequisite: PWA must be clean first

### P11 — Payments / Publishing
- Gate: P7 (PWA), P8 (security) must be done
- Stripe or RevenueCat for subscription gating
- App Store / Play Store review compliance: medical content disclaimer required

---

## Graphify — When to Use Where

| Need | Use |
|------|-----|
| Architecture map of current code | Graphify in Claude Code terminal |
| Risk cluster analysis | Graphify in Claude Code terminal |
| Grep for function/variable | Claude Code terminal |
| "What does this function do?" | Claude Code terminal (read file) |
| Planning next patch | Claude web (here) — upload status + relevant docs |
| Prompt design for Codex/terminal | Claude web or ChatGPT |
| Slide text, pitch, user copy | Claude web or ChatGPT |

> Graphify = AST + graph traversal over the actual repo. Use it in terminal.
> Claude web = judgment, planning, status synthesis. Does not see your repo unless you upload files.


---

## Iron Rules — DO NOT TOUCH (from MASTER_CONTINUITY_PROMPT v3)

These functions/elements must never be rewritten or renamed. Any Codex output that modifies them must be rejected.

| Function / Element | Reason |
|---|---|
| `rate()` | Core SRS engine — any rewrite breaks all ratings |
| `rateCard()` | SM-2 math — verified 13/13 tests passing |
| `advance()` | Card progression — rewriting causes reveal glitches |
| `fullCard()` | Full Card toggle — wired via `fullInlineBtn` at runtime |
| `saveState()` | localStorage persistence — key is `soloStudyingState_v1757` |
| `updateKpis()` | Live KPI counters — called after every state change |
| `canonicalCardId()` | Progress key deduplication — `qid_unique → qid → hash` |
| `importDeck()` | Deck loading with merge support |
| One Thing textarea | `data-rate` keydown guard must remain; spacebar must not advance |
| `id="soloFull"` / `id="domainFull"` | Full Card — do not remove |
| `id="runner"` | Runner sprite — renaming breaks CSS animations |
| `id="choiceRow"` | Answer row — CSS drop animation targets this id |

**localStorage keys — NEVER change these:**
- `soloStudyingState_v1757` — base game state
- `cozy_arcade_progress_v1` — Phase 3 progress records
- `cozy_arcade_persona_v1` — persona selection
- `cozyQuestionSeconds351` — timer setting
- `cozy_arcade_limitless_cards_v1` — deck card data (Atlas contract)

**Architecture rules:**
1. Search the ENTIRE file for every target string — fix ALL instances (same function may appear in base HTML + 2–4 later injection blocks)
2. Do NOT add a new script block — edit existing blocks in-place
3. All changes must be additive or in-place only — never destructive
4. `node --check` on ALL script blocks must pass before any commit
5. If a visual change requires new JS, skip and report it — do not invent new logic

**Reject any Codex output containing these patterns:**

| Pattern | Problem |
|---|---|
| `card.presentation` used as answer | Mapping swap — presentation IS the question |
| `educational_objective` as question | Same swap — reject immediately |
| `rate()` or `rateCard()` rewritten | Breaks SM-2 math and 13/13 test suite |
| localStorage key changed | State permanently lost |
| `stage = 'learning'` in rateCard | Invalid stage — only `new` / `review` / `relearning` |
| `id="soloFull"` or `id="domainFull"` removed | Full Card breaks entirely |
| New script block added at bottom | Violates patch architecture |
| `abim-NNN` keys written anywhere | Progress key collision |

---

## SM-2 SRS Spec (verified 13/13 — do not re-implement)

| Rating | ease_factor Δ | interval formula | stage after | repair_point |
|--------|--------------|-----------------|-------------|-------------|
| again | −0.20 | 0 days (relearn in 10 min) | relearning | true |
| hard | −0.15 | max(1, round(i × 1.2)) | review | true |
| good | ±0 | i≤0 → 1d else max(1, round(i×e)) | review | false |
| easy | +0.15 | i≤0 → 4d else max(4, round(i×e×1.3)) | review | false |
| pin | none | unchanged | unchanged | unchanged |

ease_factor: floor 1.3 · default 2.5 · ceiling 4.0

**Browser validation (run in console, not in Codex):**
```
window.runSRSValidation()   → must output: ✅ SRS: 13/13 passed
window.runCozySmokeTests()  → must output: 20/20 passed
```

---

## Correction to Task B — SRS Validation Protocol

> ⚠️ Error in previous status draft: Task B was framed as a Claude Code terminal grep task.
> The master continuity prompt explicitly says: **"Run in browser only (not Codex) → console test suite."**

**Correct Task B protocol:**

**Step 1 — Browser first (always):**
```
1. Open index.html in Chrome/Firefox
2. Upload your deck
3. Open DevTools console
4. Run: window.runSRSValidation()   → expect 13/13
5. Run: window.runCozySmokeTests()  → expect 20/20
6. Play one card, rate Again
7. Check in console: Does card reappear immediately? Or in 10 minutes?
```

**Step 2 — Only if browser test fails, then use Claude Code terminal:**
```
Use Graphify first. Run: graphify update .

Read:
1. CLAUDE.md
2. COZY_ARCADE_PROJECT_STATUS_2026-05-25.md

SM-2 math is already verified 13/13. Do NOT re-verify rateCard() math.

Specific failing test: [paste exact console output / symptom here]

Inspect only the failing function — suspected: isDue()

Check ONLY:
- Does isDue() check next_due_at first?
- Or does repair_point/stage='relearning' override timing immediately?

Output:
- exact line/function where timing gate fails
- smallest safe patch (no edits unless approved)
- no other changes
```

**Step 3 — If patch confirmed safe:**
- Apply in-place edit only (no new script block)
- `node --check` all script blocks
- `git diff --check`
- Browser retest: `window.runSRSValidation()` → 13/13
- Commit: `Fix isDue: respect next_due_at for relearning cards`

---

## User-Facing Docs Status

| File | Status |
|------|--------|
| `HOW_TO_CREATE_YOUR_OWN_CARDS (1).md` | ✅ Canonical — v3 schema, full field reference, AI conversion + manual methods |
| `HOW_TO_CREATE_YOUR_OWN_CARDS(1).md` | Older/simpler version — superseded by v3 above |
| `5_23_MASTER_CONTINUITY_PROMPT.rtf` | ✅ Iron rules reference — last validated commit `053b14c`. Update Section 5 to reflect commits through `ab9d206`. |
