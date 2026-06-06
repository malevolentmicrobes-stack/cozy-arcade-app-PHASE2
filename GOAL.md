# Project Goal Tracker
*Updated 2026-06-06 — SCOPE/SD/DATA/A10/A11 closed; PHASE2 SW v3; P8 CSP hardening is the active deployment milestone*

---

## Active Goal

**Goal:** P8 deployment hardening: CSP/security headers through `vercel.json`; next milestones are M2 Stripe gate and iOS1 Capacitor scaffold.
**Phase:** E5/E6/E7/E7B/E7C/E7G/P7/A9/SCOPE/SD/DATA/A10/A11 validation complete; P8 in progress.
**Reference:** `RECTIFIER_PLAN_2026_05_26.md`, `ULTIMATE_GOALS.md`
**Status:** PHASE2 commit `6cce78e` fixed Shadow Dungeon progress sharing, data repair export, and ghost prevention; PHASE2 `sw.js` cache is `cozy-arcade-PHASE2-v3`. Cache-busted headless validation passed: `String(window.cardPool)` references Phase 3 `sessionPool`; `String(window.nextCard)` includes the Shadow Dungeon guard; `runFSRSValidation()` returns 17/17; `runCozySmokeTests()` returns 6/6.

### Current Project State — 2026-06-06
- SCOPE is fixed 2026-06-06: historical `last_rating` no longer drives review predicates, `rating` wins in `syncProgressAliases()`, `dataset.cozyLaunchScope` clears on all/random, and `user_one_thing` persists through progress import/export.
- SD is fixed 2026-06-06: Shadow Dungeon `currentState()` and legacy `stateForCard()` readers prefer canonical `phase3State.progress`; imported backup validation saw flagged 102, pinned 97, missed 18; `cardPool`/`nextCard` ownership remained Phase 3.
- DATA is repaired 2026-06-06: 42 `stability:null` review records were replayed through `rateCard()`, 10 ghost-seen records were reset to new-stage defaults, and repair export was written as `cozy_arcade_progress_2026-06-06_codex_stability_ghost_repair.json`.
- Ghost prevention is fixed 2026-06-06: solo user/timer selection calls `rateCard()` immediately, and the rating hook reinstalls at 8s and 13s. Timer auto-select validation produced `last_rating:'good'` with non-null stability/difficulty.
- A10/A11 are fixed: Atlas card detail pin/bury toggles update `phase3State.progress`, and inline `one_thing` edits persist via `user_one_thing`.
- P8 is the active milestone: add Vercel CSP/security headers while preserving the single-file inline-script app requirements.
- In-app Browser direct inspection of the current `file://.../index.html` tab was blocked by Browser URL policy, so validation used local HTTP + headless Chrome/CDP against the same `index.html`.
- E7 runtime authority is now validated after cache-busted reload and start-click: Phase 3 owns `cardPool`/`nextCard`. Also guarded legacy `patchStudyOptions()` so it can refresh home labels without replacing Phase 3 `cardPool`.
- E7B scope consistency is fixed 2026-06-03: `syncGeneralStudyScopePhase3()` atomically updates `dataset.cozyLaunchScope`, `phase3State.settings.solo_order`, `deckMode`, and `homeFilters.scope`; mode-change console smoke logs `sessionPool()` non-empty status. Seeded headless validation: Random 3/3, Due 1 due card, Pinned 1 pinned card; FSRS 17/17; smoke 6/6; Phase 3 still owns `cardPool`.
- E7C HUD dedupe is fixed 2026-06-03: `renderHudControls()` is the idempotent gameplay HUD normalizer for Solo/Domain and guarantees one pause, one close/home, one settings, and one energy/status control inside each game HUD. Headless validation: Solo 1/1/1/1, Domain 1/1/1/1; FSRS 17/17; smoke 6/6; Phase 3 still owns `cardPool`.
- P7 PWA is fixed 2026-06-03: `sw.js`, `manifest.json`, manifest/theme tags, and service-worker registration are present. Service worker strategy matches the P7 plan: app shell stale-while-revalidate, external assets cache-first, same-origin non-shell requests network-first with cache fallback. Headless validation: manifest parsed, SW scope registered, cache contains `./`, `./index.html`, `./manifest.json`, offline reload works, FSRS 17/17, smoke 6/6.
- A9 Atlas Review Tag is fixed 2026-06-03: Atlas card detail appends one `#na-review-tag-btn`; click closes Atlas through `hideAtlasScreen()`, syncs Phase 3 scope/tag/system filters, and launches Solo. Phase 3 `getStudyPool()` now applies selected tag/system filters directly and includes them in `poolKey`; no new `cardPool`/`nextCard` wrapper was added. Headless validation: button count 1, `▶ Review Tag: A9Tag`, Atlas hidden after click, Solo visible, pool IDs `a9-tag-1/a9-tag-2` only, `String(window.cardPool)` references `sessionPool`, FSRS 17/17, smoke 6/6.
- User-visible glitch cluster originally included General Study Mode mismatch, duplicate pause/settings-style controls, solo runner/selected-lane bias, and card/progress translation drift. E7B resolves the General Study Mode scope mismatch; E7C resolves gameplay HUD control duplication; the other symptoms remain scoped below.
- Current diagnosis after E7C: runtime `cardPool`/`nextCard` ownership, General Study Mode scope precedence, and gameplay HUD duplication are no longer blockers. Remaining likely contributors are stale selected/lane state and split progress read/write boundaries.
- Next after P8: M2 Stripe Payment Link gate, then iOS1 Capacitor scaffold.

---

## All Completed Work (Chronological)

### P-RC Rectifier (2026-05-26) — all ✅
- ✅ Step 1: `makeChoices` return value fixed — choices always Array(4)
- ✅ Step 2: `bionicOn` consolidated to `bionicOn_v1751523`; fresh-load reads localStorage
- ✅ Step 3/3b: bionic settings hydration + Apply guard + stale key fixed
- ✅ Step 4: `applyVisibleSettings352()` writes `cozyQuestionSeconds351`
- ✅ Step 5: All `timerMax` assignments read localStorage
- ✅ Step 6: `stopAllDropTimers()` + `loopSolo` override in v175151
- ✅ Step 7/8: v17513/14/15 deleted (double-advance eliminated)
- ✅ F3: `dataset.cozyBionic` set at script init
- ✅ F7: Home controls `display:none` → `order:3`
- ✅ Bionic/settings: `window.enhanceSettings` export, Apply no-auto-close, Advanced panel hidden
- ✅ `v175374`: font restored; bionic contrast CSS; soloTrack inset:240px

### Schema / Export Hardening (2026-05-27, session 1) — all ✅
- ✅ `canonicalizeCard(raw, opts)` added at line ~11379 — single source of truth
  - `mode:'export'` → strict allowlist (14 canonical fields + `card_id`)
  - `mode:'display'` → alias normalization for gameplay render
  - `cleanDeckCard(card)` = `canonicalizeCard(card, {mode:'export'})` wrapper
- ✅ Progress export de-aliased: `progressPayload()`, `backupPayload()`, `fullGameStatePayload()` all call `exportProgressMap()` directly — `seen/reviewed/correct/rating/last` aliases no longer exported
- ✅ `one_thing` in progress: `exportProgressMap` resolves value BEFORE writing to `phase3State.progress[cardId]`, persists through save/reload
- ✅ Home labels: "Upload Deck"→"Upload", "Download Deck"→"Download"
- ✅ Download button → `exportDeckWithProgress` (clean deck + FSRS progress, combined)
- ✅ Undo stack: `__cozyUndoStack372` upgraded from single-slot to 5-deep; toast shows "Undone (N more)"

### Neural Atlas Inline (2026-05-27, session 2) — all ✅
- ✅ `74ce963`: Neural Atlas embedded as `<div id="atlas" class="screen hidden">` inside index.html
  - Full feature parity with progress_beta.html (constellation, sidebar KPIs, card browser, export, diagnostic)
  - All IDs `na-` prefixed; CSS scoped to `#atlas { ... }` — zero bleed into main app
  - RAF render loop halts when `#atlas.hidden`; `naInit()` not auto-called
  - `window.showAtlasScreen()` / `window.hideAtlasScreen()` public API
  - Progress button → `window.showAtlasScreen()` (was `window.open('progress_beta.html','_blank')`)
- ✅ `c7e5c01`: Home button fix + live data reads
  - `hideAtlasScreen`: explicitly hides `#atlas` before calling `window.home()`
  - `readProgress()`: reads `window.phase3State.progress` live (no localStorage round-trip)
  - `atlasLoadDeck()`: reads `window.appCards()` live (full card objects with sys/diagnosis/presentation)
- ✅ `20df845`: Orphan progress entry pruning
  - After deck+progress load, drops entries with no matching card in `deckMap`
  - Eliminates `'—'` constellation node caused by prior-session/prior-deck orphan records
  - Guard: only prunes when deck IS loaded; if no deck, shows all progress

### UI Polish (2026-05-28) — all ✅
- ✅ `a4712f1`: How to Play collapsible added to settings drawer — Solo, Knowledge Expansion, Mobile sections; `.kbd351` pill styling; `drawerBionic351`/`drawerQuestionTime351` untouched
- ✅ `7d809ef`: ArrowDown full-screen modal glitch fixed — `patchFullCardButtons` 1200ms interval guarded with `!b.dataset.v350`; redundant `btn.click()` removed from v343 handler so `handleRevealKey` is sole toggle authority
- ✅ `e7e6ccf`: Advanced Merge `<details>` dropdown removed — replaced with flat `.drawerStatusBar351` chip bar (card count + source); same change applied to cozy-arcade and cozy-arcade-app repos
- ✅ SYS upload verified: `systems()` builds list dynamically from loaded cards (`c.sys`); no hardcoded validation — custom sys values flow through filters, atlas, shadow dungeon automatically
- ✅ `37f5896`/`316db65`: Prompt AI text updated — "Flashcard app" branding, "Rephrase" rule removed; PHASE2 + cozy-arcade-app (cozy-arcade already had different text)

### Infrastructure / Deployment (2026-05-28) — all ✅
- ✅ PHASE2 local folder `origin` → `cozy-arcade-app-PHASE2.git` (correct; was displaying wrong in GitHub Desktop PR panel — confirmed UI cache bug, not a push error)
- ✅ `app` cross-remote removed from PHASE2 folder — PHASE2 can only push to PHASE2.git; cozy-arcade-app folder pushes to cozy-arcade-app.git independently
- ✅ PHASE2 `public` branch merged from `main` (48 commits) — live site at `malevolentmicrobes-stack.github.io/cozy-arcade-app-PHASE2/` now serves v175160
- ✅ Both deployed app HTML files match (`index.html` SHA-256 `bf8b187...`); `cozy-arcade-app` remains at `0c6ba70`, PHASE2 `main` is `fca5396` with docs-only infrastructure note, and `*.SAFE_COPY.md` is gitignored on both
- **GitHub Desktop PR panel still shows "cozy-arcade-app"** — this is a stale UI cache. Push goes to correct repo. Fix: remove + re-add PHASE2 repo entry in GitHub Desktop (right-click → Remove → File → Add Local Repository → same folder)

### Gameplay + Atlas UX Polish (2026-05-28) — all ✅
- ✅ `v175160`: Double-advance lock — lock resets on `renderSolo`/`renderDomain` instead of 650ms timer; 12s fallback; stale auto-advance timers no longer skip the next card
- ✅ `v175160`: `selectSolo` 700ms debounce — prevents double-queue during 650ms reveal animation gap
- ✅ `v175160`: Auto-export progress on game exit — `pauseHome` (Exit to Home) and `endHome` (Game Complete → Home) both call `exportProgress351()` before navigating
- ✅ `v175160`: Card detail scoped to sidebar — `#na-sidebar{position:relative}` so card detail fills sidebar only, no topbar overlap; topbar z-index bumped to 300
- ✅ `v175160`: `← Back` pill button replaces `← Atlas` in card detail close button
- ✅ `v175160`: Scroll position saved/restored — `#na-sb-scroll.scrollTop` saved on open, restored on close via rAF

### Game Completed + Atlas UX (2026-05-28) — all ✅
- ✅ **Game Completed Home button fixed** — root cause was `patchedHome(force=undefined)` → `shouldPromptExit()` true (mode still `'solo'`). Fix: `endHome.onclick` now calls `home(true)`. Commit `v175159`.
- ✅ **Continue button added** — `#end` modal now has Continue (primary) / Restart / Home. Continue resets HP=100, calls `nextCard()`, increments gate/round, rerenders.
- ✅ **Atlas tabs injected in topbar** — `⬡ Atlas | ≡ Review Cards`. "Review Cards" adds `browse-mode` class: canvas hidden, sidebar fills 100% width. Active tab cyan highlight. Resets to Atlas view on each `showAtlasScreen()` call.
- ✅ **Card detail close button** — relabeled `✕ Close` → `← Atlas`.

### Atlas Topbar + Font Flicker Fix (2026-05-28) — all ✅
- ✅ **Atlas topbar: `← Home` to far left** — `injectAtlasTabs` inserts before `children[1]` (not `firstChild`) so Home stays first. Commit `915b8fe`.
- ✅ **Atlas topbar: Import + Export adjacent** — Progress / Deck+Prog buttons moved next to Import pill
- ✅ **Export consolidation** — "Progress" = FSRS data only; "Deck+Prog" = calls `window.exportDeckWithProgress` (canonical deck + FSRS progress)
- ✅ **TEST MODE removed from drawer** — checkbox at line 9195 removed; dev-only, its open-drawer layout shift triggers font reflow glitch
- ✅ **`renderSolo` body.className fix** — `document.body.className=''` wiped `cozyDrawerOpen351` causing promptBox width snap on every card; now preserves `cozy*/na-/Drawer` classes

### FSRS + UX Fixes (2026-06-01) — all ✅
- ✅ **E2 fix**: `continueIfRevealVisible()` now calls `rateCard(canonicalCardId(current),'good')` before `advance()` when `spacedOn` is true — keyboard Enter/Arrow advance was silently bypassing FSRS rating, leaving 139 cards with `seen_count=0 / last_rating=null / next_due_at=null` forever
- ✅ **Ports to PHASE1**: same E2 fix applied to cozy-arcade-app

### Atlas Tag Feature (2026-05-28) — all ✅
- ✅ `003957c`: Tag filter + sortable columns + tag/sys constellation toggle (PHASE2 only)
  - `parseTags(card)` helper handles string or array `tags` field
  - `buildTagMap(prog)` — builds constellation grouped by card tags (same structure as `buildSysMap`)
  - "Tag View" toggle button in sidebar header → switches constellation + sys-list between sys and tag nodes
  - Tag filter list in sidebar (below sys-list) — all unique tags with counts, click to filter card browser; active tag highlighted
  - `naSelectedTag` state + tag filter in `renderTable()` — stackable with sys filter and pill filters
  - Tags included in search scope (`parseTags(card).join(' ')`)
  - Sortable column headers: click Diagnosis/Sys/Stage/Due → ▲▼ indicators, click again to reverse
  - Tags shown as clickable pills in card detail panel — click a tag pill to filter the browser by that tag
  - `clearSelection()` also clears `naSelectedTag`; `fullRefreshDisplay()` uses `naViewMode`

---

## Pending Browser Validation

Run in order — do not proceed to P7 until all pass:

1. `window.runFSRSValidation()` → 17/17
2. `window.runCozySmokeTests()` → 6/6
3. Home KPI row shows Cards | Reviewed | Due | New | Pinned with live values
4. Bionic: uncheck → Apply → reopen → still unchecked; `localStorage.getItem('bionicOn_v1751523') === '0'`
5. Export Download → JSON has no `level_1_presentation`, no `seen/reviewed/correct/rating/last`
6. Cmd+Z after answering → prior card reappears; toast says "Undone" or "Undone (N more)"
7. Settings Export Deck Only → canonical fields only
8. Settings Export Progress → FSRS fields only (no aliases)
9. Settings Export Deck+Progress → clean cards + clean progress
10. Progress button → Atlas opens inline (no new tab); constellation shows system nodes
11. ← Home → returns to home screen; RAF stops
12. Atlas ↻ → refreshes from live app state; no `'—'` node when deck loaded

---

## Open Bug Inventory (MASTER_FIX_PROMPT)

| ID | Severity | Description | Status |
|----|----------|-------------|--------|
| E1 | 🔴 CRITICAL | FSRS stability/difficulty never persists to export — 48 rated cards have `stability:null`. Root cause: `legacyToProgress()` omitted stability/difficulty/retrievability, so every reload reset fields to null | ✅ Fixed + browser-validated 2026-06-01: stability:3.1262 survives reload; `exportProgressMap` also fixed to include all three FSRS fields. Known: `W[15]=0.0000` (hard_penalty) — Hard doesn't reduce stability; fixing requires updating validation test too (deferred E4b) |
| E2 | 🔴 CRITICAL | Keyboard advance bypassed `rateCard()` — 139 cards stuck as `new` forever | ✅ Fixed + browser-validated 2026-06-01: advance() wrapper in FSRS Phase 3 block; explicit rating guard via `__cozyLastRatedId`; confirmed seen_count:1 / last_rating:'good' / next_due_at set; explicit 'again' not overridden |
| E3 | 🟠 HIGH | 6 SM2-era cards had `stability:null` and stale SM2-like schedule state | ✅ Data-patched + browser-validated 2026-06-03: imported real deck+progress backup, replayed each card through in-app `rateCard()` preserving original rating/counts/pins, and exported patched JSONs. Good-rated cards `3-7988`,`4-8508` now have stability 3.1262 + interval 3. Hard-rated cards `1-8118`,`2-13381`,`5-8377`,`9-8081` now have stability 1.1829 + interval 1, which matches the app's FSRS hard-new validation. |
| E4 | 🟠 HIGH | 6 cards had mutated `ease_factor` (2.1–2.35) from pre-FSRS SM2 logic | ✅ Data-patched 2026-06-03: all six target cards reset to `ease_factor:2.5` with populated FSRS stability/difficulty/next_due_at. Patched exports: `/Users/rebekahbetar/Documents/ *EXAMPLE JSON FILES /cozy_arcade_progress_2026-06-03_codex_E3_E4_ghost_patch.json` and `/Users/rebekahbetar/Documents/ *EXAMPLE JSON FILES /cozy_arcade_deck_with_progress_backup_2026-06-03_codex_E3_E4_ghost_patch.json`. |
| E3b | 🟠 HIGH | 6 ghost-seen cards: `11-13303`,`2-8719`,`7-8271`,`1-7713`,`2-8755`,`4-13423` — stage='review', seen_count=1, last_rating=null, stability=null, interval=0. Pre-E2 casualties where record() ran but rateCard() never did. | ✅ Data-patched 2026-06-03: reset to stage='new', seen_count=0, reviewed_count=0, correct_count=0, wrong_count=0, last_rating=null, stability=null, next_due_at=null while preserving pinned flags. |
| E5 | 🟠 HIGH | Shadow Dungeon breaks after card 1 — `nextCard()` falls back to full pinned set, ignores filter selection | ✅ Fixed 2026-06-03: Phase 3 `nextCard()` now checks `__shadowDungeonActive175164` + `__shadowRunQueue` before calling `sessionPool`; `__shadowRunQueueIdx` init changed 0→1 since card 0 consumed by `startCard`. PHASE1 + PHASE2. SW v26. |
| E6 | 🟠 HIGH | `deckMode:'due'` sorts 1249 new cards before 37 overdue ones — `dueScore()` has no `next_due_at` logic | ✅ Fixed 2026-06-03: `getStudyPool('due')` already filtered correctly via `isDue()`; added ascending `next_due_at` sort so most-overdue card surfaces first. PHASE1 + PHASE2. |
| E7 | 🔴 CRITICAL | Runtime authority conflict: 14 `window.cardPool =` assignments + deferred installers. Prior browser validation: active `cardPool` was Energy `scopedCardPool352(prior...)`, active `nextCard` was stable-random `sessionCards()`. Drove General Study Mode glitch, duplicate HUD controls, biased lane behavior, state translation drift. | ✅ Fixed + browser-validated 2026-06-03: Phase 3 marks `cardPool` with `__energyBuriedFilter352=true` + `__cozyStableRandom351=true`, marks `nextCard` with `__cozyStableRandom351=true`, and legacy `patchStudyOptions()` now skips replacing Phase 3 `cardPool`. Cache-busted CDP validation: `cardPool` = `() => sessionPool(...)`, no `scopedCardPool352`, `nextCard` has Shadow Dungeon guard, FSRS 17/17, smoke 6/6. |
| E8 | 🟡 MEDIUM | Full Card showed LEVEL 1/LEVEL 2 — whitelist formatter + alias write removal applied | ✅ Fixed prior session |
| SCOPE | 🔴 CRITICAL | Review Deck scope drift from historical `last_rating`, stale launch dataset, and `user_one_thing` serialization gaps | ✅ Fixed 2026-06-06: removed `last_rating` from review predicates, `rating` wins alias reconciliation, `dataset.cozyLaunchScope` clears on all/random, and `user_one_thing` round-trips through progress import/export. |
| SD | 🔴 CRITICAL | Shadow Dungeon ignored imported progress because legacy readers looked at `state[]` before `phase3State.progress` | ✅ Fixed + validated 2026-06-06: `currentState()`/`stateForCard()` prefer canonical progress; imported backup counts flagged 102, pinned 97, missed 18; `nextCard` still retains Shadow guard. |
| DATA | 🔴 CRITICAL | Backup had 42 `stability:null` review cards and 10 ghost-seen records | ✅ Repaired 2026-06-06: stability-null records replayed via `rateCard()`, ghost-seen records reset to new defaults, repair export `cozy_arcade_progress_2026-06-06_codex_stability_ghost_repair.json` created. |
| A10 | 🟡 MEDIUM | Atlas card detail needed pin/bury toggles writing to canonical progress | ✅ Fixed: card detail toggles update `phase3State.progress` and persist after Atlas close. |
| A11 | 🟡 MEDIUM | Atlas card detail needed inline `one_thing` edit writing as `user_one_thing` | ✅ Fixed: inline edit writes `window.phase3State.progress[id].user_one_thing` and reflects immediately in card detail/export. |

## Next Code Tasks (after validation)

| Priority | Goal | Gate |
|----------|------|------|
| E7A | Runtime authority pass: Phase 3 owns `cardPool`, `nextCard`, `resetRun`, scope selection, and progress writes; older interval installers guarded | Runtime `cardPool`/`nextCard` are Phase 3 or approved guarded wrappers |
| E7B | ✅ Fixed + browser-validated 2026-06-03: General Study Mode now uses `syncGeneralStudyScopePhase3()` as the one source of truth from `browseScope351` → `dataset.cozyLaunchScope` + `phase3State.settings.solo_order` + `deckMode` + `homeFilters.scope` → `sessionPool`. | Headless validation: Random pool 3, Due pool 1 overdue card, Pinned pool 1 pinned card; Phase 3 `cardPool` still contains `sessionPool`; FSRS 17/17; smoke 6/6. |
| E7C | ✅ Fixed + browser-validated 2026-06-03: `renderHudControls()` dedupes gameplay HUD roles and render hooks call it after Solo/Domain render. | Headless validation: Solo and Domain each have exactly one pause, one close/home, one settings, and one energy/status display; Phase 3 `cardPool` still contains `sessionPool`; FSRS 17/17; smoke 6/6. |
| E7D | ✅ Fixed 2026-06-03: `makeChoices()` now sets `selected=0` at all 4 call sites — runner starts at lane 0 (neutral). Auto-select timer can no longer guarantee a correct pick. Both repos. | Lane 0 is not correlated with correct answer position |
| E7E | ✅ Fixed 2026-06-03: `record()` mirrors `rating='good'|'again'` + pinned/buried/next_due_at/last_rating from Phase 3 on every answer. `stateFor()` (multi-key) merges `window.phase3State.progress` on top of `state[]` for legacy display/filter readers. Both repos. | Legacy display shows current seen/rating/due |
| E7F | ✅ Fixed + browser-validated 2026-06-03: `cozy-rating-path-rectifier-2026-06-03` preserves Phase 3 pool ownership and only wraps `selectSolo`, `advance`, and `rate` so answer-state writes reach `rateCard()`. Auto-correct → good/review/3d; auto-wrong → again/relearning/10m; Continue → good/review/3d; Hard → hard/review/1d; Again → again/relearning/10m. | Focused CDP probe: all 5 rating paths pass; core validation FSRS 17/17 + smoke 6/6 |
| E7G | ✅ Fixed + browser-validated 2026-06-04: main-page mode select flash was legacy `ensureScopeOptions352()` temporarily injecting `Suspended / buried` into `browseScope351`; now limited to the hidden review manager select and cleans visible home selects. Review Deck now includes pinned/repair/hard/again cards immediately, even when FSRS scheduled due is in the future. Runner diagnosis: correct answers are not lane-biased; 1,000-card real-deck sample distributed 213/271/265/251 across lanes, while `selected` intentionally resets to lane 0. | Core validation green; boot samples stable at 0.7/1.7/3.4/6.2s; real-deck Hard card enters Review Deck after rating. |
| A9 | ✅ Fixed + browser-validated 2026-06-03: Atlas card detail `#na-review-tag-btn` syncs selected tag/system into Phase 3 filters and launches Solo without adding runtime wrappers. | Headless validation: one button, Atlas closes, Solo opens, selected-tag pool contains only matching cards; Phase 3 `cardPool` still contains `sessionPool`; FSRS 17/17; smoke 6/6. |
| A10 | ✅ Fixed: Atlas card detail pin/bury toggles write to `phase3State.progress`. | `p.pinned`/`p.buried` toggles persist after Atlas close |
| A11 | ✅ Fixed: Atlas card detail inline `one_thing` edit writes `window.phase3State.progress[id].user_one_thing`. | Card detail shows updated text immediately and export preserves `user_one_thing` |
| P7 | ✅ Fixed + browser-validated 2026-06-03: `sw.js`, `manifest.json`, manifest/theme tags, and SW registration are present. | Headless validation: manifest parsed, SW registered at repo root scope, shell cache contains `./`, `./index.html`, `./manifest.json`, offline reload served app shell, FSRS 17/17, smoke 6/6. |
| P8 | ✅ Added 2026-06-06: CSP/security headers via `vercel.json`; CSP keeps `'unsafe-inline'` for the single-file app's inline scripts/styles. | `vercel.json` validates as JSON; Vercel deploy should emit `Content-Security-Policy` header |
| M2 | Stripe Payment Link | Test purchase + `localStorage.getItem('cozy_paid_v1') === '1'` |
| iOS1 | Capacitor scaffold | `npx cap sync` exits 0 |

### Atlas Browse — Non-Negotiables (do not regress)
- Constellation continues to work when atlas opens (naInit → naSelectedSys=null, naSelectedTag=null)
- `phase3State.progress` and `appCards()` are the live data sources — no localStorage round-trips
- All atlas element IDs remain `na-` prefixed; CSS scoped to `#atlas`
- RAF render loop must stop when `#atlas.hidden`
- Anki import field mapping: `Anki Front → presentation`, `Anki Back → one_thing + educational_objective`, `Anki Tags → tags + sys` (handled by `canonicalizeCard` allowlist — tags field preserved)

---

## Advancement Rules

| Condition | Action |
|-----------|--------|
| `runFSRSValidation()` → 17/17 | Gate PASSED |
| Any failure | Fix assertion → re-run → do not proceed |
| Validation items 1–12 all pass | Mark session DONE → advance to P7 |

---

## Gate Log

| Date | Goal | Result |
|------|------|--------|
| 2026-05-26 | Shadow Dungeon dual-event fix | ✅ `20b166a` |
| 2026-05-26 | previewInterval easy formula | ✅ `9552cb3` |
| 2026-05-26 | SM-2 prereq gate | ✅ FSRS 17/17 + smoke 6/6 |
| 2026-05-26 | P3 FSRS Phase 1–2 | ✅ `runFSRSValidation()` 17/17 |
| 2026-05-26 | P3 FSRS Phase 4 | ✅ `0a4f9d3` FSRS 17/17 + smoke 6/6 |
| 2026-05-26 | P-RC All steps | ✅ `d162708`+`8741251` |
| 2026-05-26 | Bionic/Settings | ✅ `45a26b6`, `26153a4`, `bc333a9` |
| 2026-05-27 | canonicalizeCard + export de-alias | ✅ `698ebe9`, `35cd2b4`, `2dd12a1` |
| 2026-05-27 | Undo 5-deep + one_thing persist | ✅ `92b9be8` |
| 2026-05-27 | Neural Atlas inline embed | ✅ `74ce963`, `c7e5c01`, `20df845` |
| 2026-05-27 | Prompt AI v3 schema update | ✅ `65f1074` — all three locations |
| 2026-05-28 | How to Play drawer + ArrowDown glitch fix | ✅ `a4712f1`, `7d809ef` |
| 2026-05-28 | Advanced Merge dropdown → status chips (3 repos) | ✅ `e7e6ccf` |
