# Project Goal Tracker
*Updated 2026-05-28 — reflects session compactions + 2026-05-28 session*

---

## Active Goal

**Goal:** v175160 gameplay + atlas polish — COMPLETE
**Phase:** Next → A9 (Review Tag button) or P7 (PWA service worker)
**Reference:** `RECTIFIER_PLAN_2026_05_26.md`, `ULTIMATE_GOALS.md`
**Status:** v175160 live on both GitHub Pages sites. Infrastructure stabilized. Ready for next feature.

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

## Next Code Tasks (after validation)

| Priority | Goal | Gate |
|----------|------|------|
| A9 | Atlas: "▶ Review Tag" button in card detail → triggers home `browseTag351` + review session | Opens solo study filtered to selected tag |
| A10 | Atlas: pin/bury toggle from card detail panel (write to `phase3State.progress`) | `p.pinned`/`p.buried` toggles persist after atlas close |
| A11 | Atlas: one_thing inline edit from card detail (write to `window.phase3State.progress[id].user_one_thing`) | Card detail shows updated text immediately |
| P7 | PWA service worker (`sw.js` + register before `</body>`) | Chrome DevTools → Application → Service Workers registered |
| P8 | CSP headers via `vercel.json` | `curl -I` shows `Content-Security-Policy` header |
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
