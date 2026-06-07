# Rectifier Plan — 2026-05-26 / 2026-05-27 / 2026-06-03
*Cozy Arcade Board Prep-Medicine — Single-file HTML/JS (index.html ~13,300 lines)*
*Updated 2026-06-03 to include runtime authority diagnosis for Claude.*

---

## Session Summary — 2026-05-26 Changes

| Commit | Change | Status |
|--------|--------|--------|
| `45a26b6` | `window.enhanceSettings` export — bionic checkbox hydrates on every settings open | ✅ |
| `26153a4` | No auto-close on Apply; Advanced panel hidden; bionic rerenders on Apply | ✅ |
| `bc333a9` | `v175374` font restore + bionic contrast CSS; soloTrack inset:240px | ✅ |
| `b0ab820` | `cleanDeckCard()` strips legacy alias fields | ✅ (superseded by `698ebe9`) |
| `d830094` | New-count KPI added to Home row | ✅ CODE |
| `7156bd1` | `bionicOn` reads localStorage at init; `dataset.cozyBionic` set immediately | ✅ |
| `f0f4d6b` | patchSettingsText bionic guard + stale key fix | ✅ |
| `d162708` | makeChoices fix + v17513/14/15 deleted | ✅ |
| `8741251` | Undo v175372 + smoke tests | ✅ |

---

## Session Summary — 2026-05-27 Session 1 (Schema + Export + Undo)

| Commit | Line(s) | Change | Status |
|--------|---------|--------|--------|
| `698ebe9` | ~11379 | `canonicalizeCard(raw, opts)` — allowlist-based export + alias normalization | ✅ |
| `698ebe9` | ~11430 | `cleanDeckCard(card)` = `canonicalizeCard(card,{mode:'export'})` wrapper | ✅ |
| `35cd2b4` | ~11560 | `progressPayload()` → `exportProgressMap()` directly (removed double-dedup) | ✅ |
| `35cd2b4` | ~11570 | `backupPayload()` → `exportProgressMap()` directly | ✅ |
| `35cd2b4` | ~11580 | `fullGameStatePayload()` → `exportProgressMap()` directly | ✅ |
| `92b9be8` | ~11500 | `exportProgressMap` resolves `one_thing` BEFORE `phase3State.progress[cardId]=p` | ✅ |
| `2dd12a1` | ~11634 | Home Download → `exportDeckWithProgress`; labels "Upload"/"Download" | ✅ |
| `92b9be8` | v175372 | Undo stack: 5-deep `__cozyUndoStack372`; toast "Undone (N more)" | ✅ |

---

## Session Summary — 2026-05-27 Session 2 (Neural Atlas Inline)

| Commit | Change | Status |
|--------|--------|--------|
| `74ce963` | Neural Atlas embedded as `<script id="neural-atlas-embedded">` IIFE; `<div id="atlas" class="screen hidden">` injected at boot; Progress button → `window.showAtlasScreen()` | ✅ |
| `c7e5c01` | `hideAtlasScreen`: explicit `#atlas.hidden` + `window.home()`; `readProgress()` reads `window.phase3State.progress` live; `atlasLoadDeck()` reads `window.appCards()` live | ✅ |
| `20df845` | `naInit()` + `fullRefresh()`: prune orphan progress entries (no matching deckMap card) before `buildSysMap()` — eliminates `'—'` node | ✅ |

---

## Session Diagnosis — 2026-06-03 Runtime Authority Glitches

The current visible bug reports should be handled as one rectifier family, not four unrelated fixes:

| Symptom | Diagnosis | Primary source contributors |
|---------|-----------|-----------------------------|
| General Study Mode glitches when changed | Multiple scope authorities disagree: `browseScope351`, `homeFilters.scope`, `deckMode`, `dataset.cozyLaunchScope`, `__cozyApplyDeckMode351()`, stable-random `selectedScope()`, and Phase 3 `selectedOrder()` | `browseScope351` created around ~6132; stable-random selectedScope/buildPool around ~10003; Phase 3 selectedOrder/getStudyPool/sessionPool around ~11245 |
| Multiple pause/settings controls on gameplay | HUD is mutated by several generations. Base HUD has `#soloPause`/`#domainPause`; mobile shell `normalizeHud()` moves controls and creates home/settings/status pills; pause/settings flow patches run separately | Base HUD around ~380; settings/gameplay hub around ~6163; pause settings cleanup around ~8092; mobile shell `normalizeHud()` around ~12686 |
| Character/runner appears biased toward correct answer | Selection state is global and wrapped repeatedly. Correct answer is added/highlighted in select paths; stale `selected` or lane classes can carry across card transitions if not reset before `makeChoices()`/render | `setDomainSelected()` around ~6762; `selectDomain()` correct highlighting around ~6826; `selectSolo` wrapper around ~6849; undo wrapper around ~13061 |
| Current card state does not translate | Progress is split across legacy `state`, `phase3State.progress`, alias sync, Atlas `readProgress()`, and import/export migration. Some layers use `cardState()`, some use `getProgress()`, some read localStorage | Energy `cardState()` around ~7419; Phase 3 `getProgress/progressForCard/savePhase3State` around ~10905; Atlas `readProgress()` around ~13390 |
| E5 Shadow Dungeon appears fixed in source but not in runtime | Phase 3 `nextCard` guard exists, but older stable-random `patchGameFlow()` can remain the active runtime `nextCard` | stable-random `patchGameFlow()` around ~10094; Phase 3 `nextCard` around ~11921 |
| `cardPool` winner uncertainty | Prior browser runtime validation showed active `cardPool` as Energy `scopedCardPool352(prior...)`, not Phase 3 `sessionPool` | Energy `installBuriedPoolFilter()` around ~7528; `setInterval(installBuriedPoolFilter,120)` around ~8282; Phase 3 assignment around ~11920 |

### E7 Runtime Authority Result — 2026-06-03

E7 is fixed and browser-validated. The actual deferred runtime conflict was:
- `installBuriedPoolFilter()` runs repeatedly every 120ms and wraps `cardPool` unless `__energyBuriedFilter352` is present.
- `patchGameFlow()` runs on start-button clicks and wraps `cardPool`/`nextCard` unless `__cozyStableRandom351` is present.
- Legacy `patchStudyOptions()` can refresh home labels after Phase 3, but must not replace Phase 3 `cardPool`.

Implemented guard/result:
- Phase 3 `cardPool` is marked with `__energyBuriedFilter352=true` and `__cozyStableRandom351=true`.
- Phase 3 `nextCard` is marked with `__cozyStableRandom351=true`.
- `patchStudyOptions()` now returns before its old `cardPool` replacement when Phase 3 owns the pool.
- Cache-busted headless Chrome/CDP validation passed before and after `startSolo` click: `String(window.cardPool)` is `() => sessionPool(...)`, does not include `scopedCardPool352`; `String(window.nextCard)` includes `__shadowDungeonActive175164`; FSRS 17/17; smoke 6/6.

### E7B Scope Consistency Result — 2026-06-03

E7B is fixed and browser-validated. General Study Mode changes now flow through `syncGeneralStudyScopePhase3()` instead of separate patch-layer writes.

Implemented behavior:
- `browseScope351` uses legacy-readable scope tokens (`random`, `due`, `pinned`, etc.) while Phase 3 converts them through `normalizeMode()` for `getStudyPool()`.
- One sync function atomically updates `document.documentElement.dataset.cozyLaunchScope`, `phase3State.settings.solo_order`, `deckMode`, and `window.homeFilters.scope`, then clears the Phase 3 session pool key.
- Existing `window.__cozyApplyDeckMode351()` delegates to this sync function; no new `cardPool` or `nextCard` wrapper was added.
- Mode-change console smoke logs `[E7B] General Study Mode scope synchronized: <scope> pool non-empty: <bool> count: <n>`.
- Seeded headless Chrome/CDP validation passed: Random pool 3 cards; Due pool 1 card and its `next_due_at` is past; Pinned pool 1 pinned card; `String(window.cardPool)` still references `sessionPool`; FSRS 17/17; smoke 6/6.

### E7C Gameplay HUD Deduplication Result — 2026-06-03

E7C is fixed and browser-validated. Gameplay HUD controls now flow through `renderHudControls(gameId)` inside the existing mobile shell block.

Implemented behavior:
- `renderHudControls('solo'|'domain')` is the single idempotent HUD contract for game screens only.
- It dedupes visible gameplay HUD roles by `data-hud-role`: exactly one pause, one close/home, one settings, and one energy/status control.
- It keeps existing score/streak/gate/round/HP pills, marks controls with `data-hud-v1="1"`, and does not touch drawer, settings panel, Atlas, review screen, or home.
- Existing render paths are hooked so Solo/Domain call the normalizer immediately after render; the existing interval/mutation maintenance is now guarded by the role deduper.
- Headless Chrome/CDP validation passed: Solo 1 pause / 1 home / 1 settings / 1 energy; Domain 1 pause / 1 home / 1 settings / 1 energy; `String(window.cardPool)` still references `sessionPool`; FSRS 17/17; smoke 6/6.

### P7 PWA Result — 2026-06-03

P7 is fixed and browser-validated for PHASE2.

Implemented behavior:
- `manifest.json` exists with app name, short name, standalone display, colors, and start URL.
- `index.html` has the manifest link, theme-color meta tag, and service-worker registration before `</body>`.
- `sw.js` uses cache `cozy-arcade-PHASE2-v1`; app shell is stale-while-revalidate; external assets are cache-first with network fallback; same-origin non-shell requests are network-first with cache fallback.
- Headless Chrome/CDP validation passed: manifest parsed; service worker registered at `http://127.0.0.1:8796/`; shell cache contains `./`, `./index.html`, and `./manifest.json`; offline reload served the app shell; `String(window.cardPool)` still references `sessionPool`; FSRS 17/17; smoke 6/6.

### A9 Atlas Review Tag Result — 2026-06-03

A9 is fixed and browser-validated for PHASE2.

Implemented behavior:
- Atlas card detail injects exactly one `#na-review-tag-btn` after the existing detail renderer runs.
- Button text uses the first parsed card tag; if no usable tag exists, the launcher can fall back to the card/system value.
- Clicking the button closes Atlas through existing `hideAtlasScreen()` so the Atlas RAF loop is cancelled by the existing `naRafId` path.
- Launch sync writes `dataset.cozyLaunchScope`, `dataset.cozyLaunchTag`/`dataset.cozyLaunchSystem`, `window.homeFilters`, and matching home/browse selects, then calls `syncGeneralStudyScopePhase3()` and starts Solo.
- Phase 3 `getStudyPool()` now applies selected tag/system filters directly and includes those filters in `poolKey`. This is required because older filter-aware wrappers no longer own `cardPool`.
- No new `cardPool` or `nextCard` wrapper was added.

Headless Chrome/CDP validation passed: `#na-review-tag-btn` count 1; `▶ Review Tag: A9Tag`; Atlas hidden after click; Solo visible after notification continue; pool IDs `a9-tag-1/a9-tag-2` only; `String(window.cardPool)` still references `sessionPool`; `String(window.nextCard)` includes `__shadowDungeonActive175164`; FSRS 17/17; smoke 6/6.

### Claude Rectifier Order — Do Not Skip

1. **Runtime authority guard:** Complete. Do not re-open by adding another wrapper. Keep Phase 3 as owner of `cardPool`/`nextCard`; older installers must only refresh UI/state and must skip replacing flagged Phase 3 functions.
2. **Scope normalization:** Complete. Preserve `syncGeneralStudyScopePhase3()` as the only General Study Mode state writer. Do not reintroduce independent writes to `dataset.cozyLaunchScope`, `phase3State.settings.solo_order`, `deckMode`, or `homeFilters.scope`.
3. **HUD single contract:** Complete. Preserve `renderHudControls()` as the only gameplay HUD control normalizer. Do not add separate HUD injection loops for pause/home/settings/energy controls.
4. **Atlas tag/system review launch:** Complete for A9. Preserve Phase 3 tag/system filtering in `getStudyPool()` and `poolKey`; do not move it back into legacy `cardPool` wrappers.
5. **Selection neutrality:** On every `nextCard()` / `renderSolo()` / `renderDomain()`, reset `selected` and lane/orb classes before choices are rendered. Never infer selected lane from `choices.indexOf(correctAnswer)` except when explicitly marking the correct answer after a user selection.
6. **Progress canonicalization:** Treat `phase3State.progress` as the only write source. Keep legacy `state` synced only as a compatibility mirror; Atlas/export should read the canonical map.

### Gates For This Rectifier

```javascript
window.runFSRSValidation()   // must be 17/17
window.runCozySmokeTests()   // must be 6/6
String(window.cardPool)      // must be Phase 3/session-owned or a guarded approved wrapper
String(window.nextCard)      // must include or call the Phase 3 Shadow Dungeon queue guard
```

Manual checks:
- Change General Study Mode to `random-new`, `review`, `pinned`, and `due`; start Solo; verify the pool label/count and first card match the selected scope.
- In Solo and Knowledge Expansion, count visible pause controls: exactly one per game.
- Start a new Solo card repeatedly; runner starts in a neutral/predictable lane and does not jump to the correct answer before user input/timer.
- Answer one card, export progress, open Atlas, and confirm the same card's seen/rating/due state appears in both.

---

## Root Cause Diagnosis

### A — Bionic Toggle Never Hydrated (FIXED `45a26b6`)
`function enhanceSettings()` was local to main IIFE. IIFE-B's `openSettings()` called `window.enhanceSettings` = undefined.
**Fix:** `window.enhanceSettings = enhanceSettings` in IIFE-A.

### B — Bionic Visual Effect Invisible (FIXED `v175374`)
`.promptText{font-weight:950}` — every character already 950 weight. `<b>` inside = zero contrast.
**Fix:** `[data-cozyBionic="1"] .promptText` base = 500/dim-blue; `b` = 950/white.

### C — Font Size / Timer Overlap (FIXED `bc333a9`)
`clamp(22px,2.6vw,36px)` v1 grew promptBox past soloTrack inset.
**Fix:** Reverted font to accumulated patch values; soloTrack inset:240px.

### D — Settings Auto-Close on Apply (FIXED `26153a4`)
`setTimeout(returnFromSettings352, 0)` in `applyReturn352` listener.
**Fix:** Removed the setTimeout line.

### E — Export Alias Pollution (FIXED `698ebe9`, `35cd2b4`)
`cleanDeckCard()` used blacklist — missed fields added by import normalization.
`deduplicateProgress()` called `syncProgressAliases()` which wrote `seen/reviewed/correct/rating/last` back.
**Fix:** `canonicalizeCard` allowlist; all export paths call `exportProgressMap()` directly.

### F — `one_thing` Missing from Progress Export (FIXED `92b9be8`)
`phase3State.progress[cardId] = p` was written BEFORE `p.one_thing` was resolved.
**Fix:** Resolve `oneThingVal` and assign `p.one_thing = oneThingVal` before the `phase3State` write.

### G — Atlas `'—'` System Node (FIXED `20df845`)
`phase3State.progress` accumulates entries for every card ever studied across deck versions.
Orphan entries (card ID no longer in current deck) have no `deckMap[id]` match → `mergeSysFromDeck()` skips → sys stays blank → all group under `'—'`.
**Fix:** After deck+progress load, prune `progress` to entries where `deckMap[id]` exists (guard: only when deck IS loaded).

### H — Atlas Home Button Did Nothing (FIXED `c7e5c01`)
`#atlas` was not in the `screens[]` array defined at app boot, so `show('home')` called by `window.home()` only hid items in that array, not `#atlas`.
**Fix:** Explicitly `document.getElementById('atlas').classList.add('hidden')` before calling `window.home()`.

### I — Atlas Blank Constellation (FIXED `c7e5c01`)
`atlasLoadDeck()` read from `cozy_arcade_limitless_cards_v1` which `showAtlasScreen()` had written as a sys-map stub (`{qid_unique, sys}` only). Cards had no `diagnosis`, `presentation`, etc. And `readProgress()` read from localStorage which may be stale.
**Fix:** `atlasLoadDeck()` tries `window.appCards()` first (live, full card objects). `readProgress()` tries `window.phase3State.progress` first (live).

---

## 10-Step Fix Plan (Status)

| Step | Target | Fix | Gate |
|------|--------|-----|------|
| F1 | Font sizes | ✅ `v175374` style block | Visual confirm |
| F2 | Bionic contrast | ✅ `[data-cozyBionic]` CSS | Visual confirm |
| F3 | `dataset.cozyBionic` on init | ✅ `7156bd1` | localStorage round-trip |
| F4 | Timer key | ✅ line 8118 | `localStorage.getItem('cozyQuestionSeconds351')` |
| F5 | `timerMax` literals | ✅ lines 402,408,446,793,824 | Timer uses selected value |
| F6 | `setInterval(install,900)` guard | ⏳ LOW PRIORITY | No visible regression |
| F7 | Home controls | ✅ `7156bd1` | Home buttons visible |
| F8 | MutationObserver narrowing | ⏳ LOW PRIORITY | No performance hit seen |
| F9 | Due-count widget | ✅ CODE `d830094` | KPI row verify |
| F10 | Gear rewrite one-time guard | ⏳ LOW PRIORITY | Gear always opens settings |

---

## Current `cozy-phase3-state-model-js` IIFE Key Functions

| Function | Location | Purpose |
|----------|----------|---------|
| `canonicalizeCard(raw, opts)` | ~11379 | Allowlist export OR alias-normalize for display |
| `cleanDeckCard(card)` | ~11430 | `canonicalizeCard(card,{mode:'export'})` wrapper |
| `exportProgressMap()` | ~11450 | Canonical progress export — explicit field allowlist |
| `progressPayload()` | ~11560 | Progress-only export JSON |
| `backupPayload()` | ~11570 | Deck+progress backup JSON |
| `fullGameStatePayload()` | ~11580 | Full game state JSON |
| `rateCard(card, rating)` | ~11200 | FSRS v5 scheduling |
| `canonicalCardId(card)` | ~10650 | Stable ID derivation |
| `window.canonicalizeCard` | ~11728 | Global export of canonicalizeCard |
| `window.appCards` | ~11843 | Global export of appCards() |
| `window.phase3State` | ~10877 | Global export of phase3State |

---

## Neural Atlas IIFE Architecture

**Script id:** `neural-atlas-embedded` (appended before `</body></html>`, line ~12884)
**Screen div:** `<div id="atlas" class="screen hidden">` — injected into DOM at IIFE parse time
**Canvas:** `id="na-canvas"` inside `id="na-canvas-wrap"`

**Data flow (embedded mode):**
```
window.showAtlasScreen()
  → writes sys-map to localStorage (for external import compat)
  → show('atlas')  [uses existing screen system]
  → requestAnimationFrame(naInit)
      → atlasLoadDeck()  →  window.appCards() [live, full cards]
      → readProgress()   →  window.phase3State.progress [live]
      → mergeSysFromDeck()  →  fills sys on progress entries
      → prune orphans  →  drops entries without deckMap match
      → buildSysMap()  →  groups by sys
      → buildGraph()   →  force-directed constellation
      → naRender()     →  RAF loop (halts when #atlas.hidden)

window.hideAtlasScreen()
  → cancelAnimationFrame(naRafId)
  → document.getElementById('atlas').classList.add('hidden')
  → window.home()
```

**Global bridges for HTML `onclick` attrs:**
`naHandleFileUpload`, `naHandleDrop`, `naFullRefresh`, `naRunDiagnostic`,
`naExportProgressOnly`, `naExportFullBackup`, `naClearSelection`,
`naAdjustZoom`, `naResetView`, `naCloseCardDetail`, `naSetFilter`,
`naRenderTable`, `naClickSys`, `naOpenCardDetail`

---

## Validation Tests

### 2026-06-03 Codex Update — E3/E4/E3b Data Patch + Rating-Path Rectifier

- Real deck/progress inputs validated:
  - `/Users/rebekahbetar/Documents/ *EXAMPLE JSON FILES /A.A.ABIM_DATABASE_v18_FIXED copy 2.json`
  - `/Users/rebekahbetar/Documents/ *EXAMPLE JSON FILES /cozy_arcade_deck_with_progress_backup-2 copy.json`
  - `/Users/rebekahbetar/Documents/ *EXAMPLE JSON FILES /cozy_arcade_progress_2026-06-01-3 copy.json`
- Exported patched progress:
  - `/Users/rebekahbetar/Documents/ *EXAMPLE JSON FILES /cozy_arcade_progress_2026-06-03_codex_E3_E4_ghost_patch.json`
  - `/Users/rebekahbetar/Documents/ *EXAMPLE JSON FILES /cozy_arcade_deck_with_progress_backup_2026-06-03_codex_E3_E4_ghost_patch.json`
- E3/E4 result: six target cards now have populated FSRS stability/difficulty/next_due_at and `ease_factor:2.5`. Good-rated cards have interval 3; hard-rated cards have interval 1, matching the app's own FSRS hard-new validator.
- E3b result: six ghost-seen cards reset to `stage:'new'`, zero seen/review/correct/wrong counters, null rating/stability/next_due_at, pinned flags preserved.
- Rating-path diagnosis: `record()` could mark cards seen before deferred `rateCard()` fired; Continue also depended on reveal DOM state. Added `cozy-rating-path-rectifier-2026-06-03` in `index.html` to keep pending answer ratings and commit them through `rateCard()` on auto-select timeout or Continue/advance, while explicit Hard/Again/Good still win through `rate()`.
- Validation after patch: FSRS 17/17, smoke 6/6, Phase 3 `cardPool` contains `sessionPool`, `nextCard` retains Shadow guard, E7B/E7C/E7D/A9 all green, focused rating probe passes auto-good, auto-again, Continue-good, explicit-hard, explicit-again.

### 2026-06-04 Codex Validation — Main Flash + Runner Bias + Between-Game State

- Confirmed main-page dropdown flash: `ensureScopeOptions352()` injected `Suspended / buried` into visible `browseScope351` around the delayed legacy-install window, then Phase 3 removed it. Patched it to avoid visible home selects and only maintain the hidden review manager select.
- Confirmed runner is not auto-placing the correct answer. Real 1,000-card deck sample after importing `A.A.ABIM_DATABASE_v18_FIXED copy 2.json`: correct answer lanes were 213 / 271 / 265 / 251. The runner starts at lane 0 every card because `makeChoices()` resets `selected=0`; timer auto-selecting without user movement picks lane 0, not the known correct lane.
- Confirmed answer-state writes work: auto-good, auto-again, Continue-good, explicit-Hard, explicit-Again all write FSRS fields through `rateCard()`.
- Confirmed between-game state bug and fix: newly rated Hard cards wrote progress correctly but were excluded from Review Deck because `review_deck` filtered out future-due cards. Patched Review Deck/Hard filters so pinned, repair, hard, and again cards enter the review pool immediately while ordinary scheduled reviewed cards still obey due timing.

### 2026-06-06 Codex Validation — Review Deck Scope + One Thing Persistence

- Probe D flagged historical `last_rating` leakage: future-due cards with current `rating:'good'` but old `last_rating:'hard'` still passed review predicates. Patched legacy and Phase 3 review/hard filters to use current rating/repair flags only, and kept the visible General Study Mode select aligned with persisted Phase 3 scope.
- Added `user_one_thing` to Phase 3 progress migration/export so Atlas inline edits round-trip through save/import/export.
- Service worker cache bumped to `cozy-arcade-PHASE2-v2`.

```javascript
// Core suites
window.runFSRSValidation()   // 17/17
window.runCozySmokeTests()   // 6/6

// Bionic round-trip
localStorage.setItem('bionicOn_v1751523','0');
location.reload();
// Open settings → bionic checkbox should be UNCHECKED

// Export — no aliases
// Download Deck JSON → must NOT contain: level_1_presentation, seen, reviewed, correct, rating, last

// Undo
// Answer a card → Cmd+Z → prior card reappears; toast 'Undone' or 'Undone (N more)'

// Atlas
window.showAtlasScreen()  // opens inline; constellation shows colored sys nodes
window.hideAtlasScreen()  // returns home; no ghost #atlas overlay
// ↻ button → no '—' node when deck is loaded
```

---

## Contingency Plan

If `runFSRSValidation()` fails after any step:
1. `git revert HEAD` — single commit revert, no squash
2. Re-run validation to confirm clean state
3. Fix only the failing assertion
4. Re-commit

If bionic appears broken:
1. DevTools → Elements → `<html>` → confirm `data-cozy-bionic="1"`
2. If not set: `applyVisibleSettings352()` didn't run → check `applyReturn352` listener
3. If set but no visual: check computed `color` and `font-weight` on `.promptText b`

---

## Key localStorage Keys (never rename)

| Key | Default | Controls |
|-----|---------|----------|
| `bionicOn_v1751523` | `null`→true | Bionic reading ON/OFF |
| `cozyQuestionSeconds351` | `null`→7 | Timer seconds |
| `soloStudyingState_v1757` | — | Active card session state |
| `cozy_arcade_progress_v1` | — | FSRS progress (canonical) |
| `cozy_arcade_persona_v1` | — | User persona |
| `cozy_arcade_limitless_cards_v1` | — | Uploaded deck / Atlas sys-map cache |

---

*Reference file:* `/Users/rebekahbetar/Documents/Codex/2026-05-16/cozy-arcade/index.html` (do not overwrite; CSS/logic comparison only)
*Active gate tracking:* `GOAL.md`
*Feature goals:* `ULTIMATE_GOALS.md`

---

## Session Addendum — 2026-06-06 Full Session (SCOPE / SD / DATA / A10 / A11 / P8 / M2)

### What Was Done

| Fix | Commit | Detail |
|-----|--------|--------|
| SCOPE | c91bca2 | Removed `last_rating` from all review/hard pool predicates; `syncProgressAliases` direction fixed (`rating = rating \|\| last_rating`, not reverse); `dataset.cozyLaunchScope` deleted for 'all'/'random' to prevent stale persist across reload; `user_one_thing` added to `exportProgressMap` and `migrateLegacyProgress` so Atlas inline edits round-trip through save/import/export |
| SD (Shadow Dungeon progress) | 6cce78e | `stateForCard()` and `currentState()` now prefer `window.phase3State?.progress?.[k]` with fallback to legacy `state[]`; imported backup previously invisible to Shadow Dungeon pool because both readers looked at `state[]` only |
| DATA repair | 6cce78e | Rating hook reinstalls at 8s + 13s in addition to existing 0.7s/1.6s/3.2s/5.2s; ghost-seen prevention: user/timer selection calls `rateCard()` immediately; Codex exported `cozy_arcade_progress_2026-06-06_codex_stability_ghost_repair.json` (42 `stability:null` cards replayed, 10 ghost-seen reset) |
| A10 | session | `naInjectPinBuryButtons(cardId)` inside Atlas IIFE — pin/bury toggles write `phase3State.progress[cardId].pinned/buried` + `window.state[cardId]` mirror + `window.saveState()` |
| A11 | c91bca2 | `naInjectOneThingEdit(cardId)` inside Atlas IIFE — textarea pre-filled from `p.user_one_thing ?? card.one_thing`; saves on blur/700ms debounce; mirrors to `phase3State.progress[cardId].user_one_thing`; `user_one_thing` added to export serialization |
| E7G port to PHASE1 | b20a1ef | `ensureScopeOptions352()` restricted to hidden `reviewScope17526`; Review Deck includes pinned/repair/hard/again immediately regardless of FSRS due date |
| P8 | acb2e8b | `vercel.json` added to PHASE2 with `Content-Security-Policy` (unsafe-inline for scripts/styles, Google Fonts, frame-ancestors none), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin` |
| M2 | d832483 | Stripe paywall gate (`cozy-paywall-m2-2026-06-06`) appended before `</body>` in PHASE2; key `cozy_paid_v1`; `?paid=1` or `?paid=test_override` unlocks and cleans URL; `STRIPE_PLACEHOLDER_URL` literal awaits user's real Stripe link |

**PHASE2 SW versions across this session:** v1 (P7) → v2 (SCOPE/c91bca2) → v3 (SD/6cce78e) → v4 (M2/d832483)

**PHASE1 last commit:** `b20a1ef` — all SCOPE/SD/rating-path/E7G ports applied; still missing `vercel.json` and M2

### Errors Found and Fixed This Session

| Error | Root Cause | Fix |
|-------|-----------|-----|
| `syncProgressAliases` backwards direction | `rating = last_rating \|\| rating` overwrote current rating with historical one | Reversed to `rating = rating \|\| last_rating` |
| `dataset.cozyLaunchScope` stale persist | 'review' scope from last session survived reload — pool mismatch on cold open | Delete attribute for 'all'/'random'; set for other scopes |
| `user_one_thing` not serialized | Written to live `phase3State.progress` but omitted from `exportProgressMap` allowlist | Added to both `exportProgressMap` and `migrateLegacyProgress` |
| Shadow Dungeon invisible to imports | `stateForCard()` read `state[]` only; `phase3State.progress` loaded from import had no mirror in `state[]` | `stateForCard()` now reads `phase3State.progress` first |
| Ghost-seen cards (10 in backup) | `record()` incremented `seen_count` before `rateCard()` fired in some paths | Moved `rateCard()` call to immediate user/timer selection; hook reinstalls at 8s + 13s |
| 42 `stability:null` review cards | Pre-E1 SM2-era cards rated many times but FSRS stability never set | Replayed through `rateCard()` via Codex repair script; export written |

### Prompt Efficiency Analysis (Session Retrospective)

| Prompt type | Codex duration | Outcome |
|-------------|---------------|---------|
| Long (300–500 lines, CDP infra) | 15–34 min | Often diverged, user interrupted |
| Short (<80 lines, no CDP, validation gates only) | 3–5 min | Targeted, passed gates |

**Rule going forward:**
- Codex prompts: under 80 lines
- Validation: `runFSRSValidation()` 17/17 + `runCozySmokeTests()` 6/6 only — no custom CDP harness
- Port both repos in same prompt — never split PHASE1/PHASE2 ports across sessions
- Do not ask Codex to "verify" or "audit" — only to fix a named specific thing

### Pending After 2026-06-06

1. **User action**: Import `cozy_arcade_progress_2026-06-06_codex_stability_ghost_repair.json`
2. **User action**: Replace `STRIPE_PLACEHOLDER_URL` in PHASE2 `index.html` with real Stripe Payment Link
3. **Code**: Port `vercel.json` + GOAL.md to PHASE1; port M2 gate to PHASE1 (after Stripe URL provided)

---

## Session Addendum — 2026-06-07 Senior Dev Audit + Stepwise Testing Plan

See `SENIOR_DEV_AUDIT_2026_06_07.md` (Sections 15–16) for the full IF/THEN browser test suite (Groups A–I). This section records the fix queue and Codex prompt contracts derived from that audit.

### Current Fix Queue — Priority Order

| ID | Priority | Both repos? | Issue | Source line(s) |
|----|----------|------------|-------|----------------|
| FQ-1 | P0 | ✅ Both | `review_deck` fallback (L11514) still only checks `!suspended` | PHASE2 L11514, PHASE1 ~same |
| FQ-2 | P0 | ✅ Both | `due` pool branch has no burial check | PHASE2 L11447, PHASE1 ~same |
| FQ-3 | P0 | ✅ Both | Undo restores FSRS state but not session queue index, score, HP, timer | L13276 |
| FQ-4 | P1 | ✅ Both | New device empty pool — no guard before game start | L11418+, startSolo |
| FQ-5 | P1 | ✅ Both | `shadowSchedule351` dropdown is dead (never read by start handler) | L6373 |
| FQ-6 | P2 | ✅ Both | Home panel `innerHTML` rebuild causes select value churn (flash source) | L6172 |
| FQ-7 | P2 | ✅ Both | Duplicate ⌂ HUD buttons from legacy injectors | L1548+ |
| FQ-8 | P2 | ✅ Both | Domain gameplay not covered by undo wrapper | L13287 |
| FQ-9 | P3 | PHASE1 only | Port `vercel.json` P8 security headers | — |
| FQ-10 | User | PHASE2 only | Replace `STRIPE_PLACEHOLDER_URL` with real Stripe link | — |
| FQ-11 | User | Both | Import stability/ghost-seen repair JSON | — |

### Codex Prompt Contracts for FQ-1 + FQ-2 (next session)

**Prompt (under 80 lines):**
```
File: index.html in BOTH repos
PHASE2: /Users/rebekahbetar/Documents/GitHub/cozy-arcade-app-PHASE2/index.html
PHASE1: /Users/rebekahbetar/Documents/GitHub/cozy-arcade-app/index.html

── FIX FQ-1: review_deck fallback burial filter ──
In getStudyPool(), find the SECOND review_deck branch (approximately):
  if (selected === 'review_deck') {
    return applyStudyFiltersPhase3(normalizeDeckIdentities()).filter(c => !progressForCard(c).suspended).filter(c => {
Change the .filter(c => !progressForCard(c).suspended) to:
  .filter(c => { const p=progressForCard(c); return !p.suspended && !p.buried && p.rating!=='bury' && p.last_rating!=='bury'; })

── FIX FQ-2: due branch burial filter ──
In getStudyPool(), find:
  arr = arr.filter(c => isDue(progress(c)));
Change to:
  arr = arr.filter(c => { const p=progressForCard(c); return isDue(p) && !p.suspended && !p.buried && p.rating!=='bury' && p.last_rating!=='bury'; });

── FIX FQ-4: empty pool guard ──
In startSolo() (or directStartGame351 for SD), after the pool is resolved and before
the game loop starts, add:
  if (!pool || pool.length === 0) { toast('No cards match this filter — try a different scope'); return; }

── Validation ──
window.runFSRSValidation()   // 17/17
window.runCozySmokeTests()   // 6/6
// Run Group C browser test from SENIOR_DEV_AUDIT_2026_06_07.md Section 16
// Confirm no leaks for modes: review_deck, due, pinned, random-new
// Confirm toast appears when pool is empty

Bump PHASE2 sw.js: v7→v8. Bump PHASE1 sw.js: v44→v45.
Commit each repo to its own remote only. Do NOT cross-push.
```

### Codex Prompt Contract for FQ-3 (undo session restore)

**Prompt (under 80 lines):**
```
File: index.html in BOTH repos
PHASE2: /Users/rebekahbetar/Documents/GitHub/cozy-arcade-app-PHASE2/index.html
PHASE1: /Users/rebekahbetar/Documents/GitHub/cozy-arcade-app/index.html

── FIX FQ-3: undo session restore ──
In the undo snapshot wrapper (find: window.__cozyUndoStack372.push(snap)):
The snap object must also capture: sessionPoolIndex, score, streak, hp, gate.
In restoreUndoSnapshot(), after restoring phase3State.progress[snap.id]:
  Also restore: score, streak, hp, gate to snap values.
  Call nextCard() with the snapped card directly rather than advancing pool index.
  If window.__shadowRunQueue exists and snap has queueIndex, restore __shadowRunQueueIdx.

── FIX FQ-8: Domain undo coverage ──
Wrap selectDomain the same way selectSolo is wrapped for undo:
  - Push snapshot before selection (same snap structure as selectSolo wrapper)
  - The restoreUndoSnapshot must handle mode==='domain' without forcing mode='solo'

── Validation ──
window.runFSRSValidation()   // 17/17
window.runCozySmokeTests()   // 6/6
// Run Group E browser test from SENIOR_DEV_AUDIT_2026_06_07.md Section 16
// Answer 5 cards, undoReview() 5 times → each undo shows the prior card (not a different card)
// Test in both Solo and Domain

Bump PHASE2 sw.js: v8→v9. Bump PHASE1 sw.js: v45→v46.
Commit each repo to its own remote only.
```

### Browser Test Execution Order (for next Codex session)

After each Codex code fix, run these groups from `SENIOR_DEV_AUDIT_2026_06_07.md` Section 16:

| After fix | Run groups | Pass criteria |
|---|---|---|
| FQ-1 + FQ-2 applied | A, C | A: 17/17, 6/6; C: 0 leaks in all modes |
| FQ-4 applied | A, H | A green; H: toast fires on empty pool |
| FQ-3 + FQ-8 applied | A, E | A green; E: undo restores card sequence + Domain covered |
| FQ-6 applied | A, G | A green; G: ≤2 browseScope changes in 3s |
| All FQ-1 to FQ-8 | A, B, C, D, E, F, G, H, I | All groups pass |

### Rectifier Rules — Carry Forward

These rules have not changed and must be followed in every subsequent fix:

1. Do NOT add new `cardPool` or `nextCard` wrappers.
2. `syncGeneralStudyScopePhase3()` is the only writer for scope state.
3. `renderHudControls()` is the only HUD control normalizer.
4. `rateCard()` is the only FSRS write path.
5. All burial checks must test: `!p.suspended && !p.buried && p.rating!=='bury' && p.last_rating!=='bury'` (four conditions — see real gameplay JSON in Section 2 of audit).
6. Every Codex prompt: under 80 lines, no CDP infra request, validation gates `runFSRSValidation()` 17/17 + `runCozySmokeTests()` 6/6, port BOTH repos in same prompt.
7. SW version must be bumped on every code commit (PHASE2 tracks separately from PHASE1).
4. **Code**: iOS1 — Capacitor scaffold (`npx cap sync`)

2026-06-07: Applied FQ-1/FQ-2/FQ-4 burial-safe study-pool filters and empty Solo guard in PHASE2; browser CDP validation passed FSRS 17/17, smoke 6/6, buried-card exclusion, and empty-pool toast.
2026-06-07: Applied FQ-3/FQ-8 undo session restore in PHASE2; undo snapshots now restore score/streak/hp/gate/index/current card and cover Domain without forcing Solo.
2026-06-07: M2 paywall trigger spec recorded: paywall must not appear on first launch; it should trigger only after 100 cards reviewed AND both Solo Studying and Shadow Dungeon have been used at least once.
