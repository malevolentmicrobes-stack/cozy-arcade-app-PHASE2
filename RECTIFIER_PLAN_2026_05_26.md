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

---

## Session Addendum — 2026-06-10 Glitch Re-emergence + User Extension Features

### New Glitches Identified

| ID | Issue | Root Cause | Fix |
|----|-------|-----------|-----|
| FQ-AUTO-1 | Runner auto-selects correct answer after undo | `restoreUndoSnapshot` sets `selected = snap.selected`; snap captured pre-answer = where user was when answering | Change `selected = snap.selected` → `selected = 0` in `restoreUndoSnapshot` (1-line fix) |
| FQ-AUTO-2 | Explicit Good after wrong auto-select may be overwritten | Base `selectSolo` defers `rateCard(ok?'good':'again')` 8000ms; explicit `rate('good')` fires but 8s timer may overwrite | In `wrappedRate` (rectifier): clear `__cozyAutoRateHandle20260603` + add id to `seenThisSession` before `priorRate` fires |
| FQ-NEW-3 | No "^" close on Full Card modal; number key debounce unclear | `#modal` has only "Close" button; 700ms debounce wrapper may swallow 1–4 keypresses | Add `^` button to modal; verify/bypass debounce for explicit keypresses |

### Updated Fix Queue (2026-06-10)

| ID | Priority | Repos | Issue |
|----|----------|-------|-------|
| FQ-AUTO-1 | P0 | Both | Undo runner resets to lane0 |
| FQ-AUTO-2 | P1 | Both | Explicit rating wins over auto-select deferred |
| FQ-NEW-3 | P1 | Both | "^" close Full Card + number key verify |
| FQ-5 | P1 | Both | `shadowSchedule351` dead dropdown |
| FQ-6 | P2 | Both | Home panel flash |
| FQ-7 | P2 | Both | Duplicate ⌂ HUD buttons |
| FQ-9 | P3 | PHASE1 | Port `vercel.json` |
| FQ-NEW-4 | P2 | Both | Review Deck pin/suspend inline controls (future) |
| FQ-10 | User | PHASE2 | Replace `STRIPE_PLACEHOLDER_URL` |
| FQ-11 | User | Both | Import stability/ghost-seen repair JSON |
| iOS1 | Final | — | Capacitor scaffold |

### Codex Prompt Contracts (2026-06-10)

See `COZY_ARCADE_PROJECT_STATUS_2026-06-10.md` Section 7 for full prompt text.

**FQ-AUTO-1 summary (1-line fix):**
In `restoreUndoSnapshot()`: `selected = snap.selected` → `selected = 0`

**FQ-AUTO-2 summary:**
In `wrappedRate` inside `cozy-rating-path-rectifier-2026-06-03`: before `priorRate.apply()`, add:
`clearTimeout(window.__cozyAutoRateHandle20260603); window.__cozyPendingRating20260603=null; try{window.cozyPhase3Session?.seenThisSession?.add(cardIdFor(card));}catch(_){}`

**FQ-NEW-3 summary:**
Add `^` button to `fullCard()` modal. Verify 1–4 key selection not swallowed by 700ms debounce; bypass debounce for explicit keypresses if needed.

### Browser Test After Each Fix

| After fix | Run | Pass criteria |
|-----------|-----|---------------|
| FQ-AUTO-1 | A + E | A: gates green; E: undo runner at lane0, selected=0 |
| FQ-AUTO-2 | A + D | A: gates green; D: explicit Good wins over auto-select 'again' |
| FQ-NEW-3 | A | A: gates green; manual 1–4 keys respond; ^ closes modal |

### Rectifier Rules — Carry Forward (unchanged)

1. Do NOT add new `cardPool` or `nextCard` wrappers.
2. `syncGeneralStudyScopePhase3()` is the only writer for scope state.
3. `renderHudControls()` is the only HUD control normalizer.
4. `rateCard()` is the only FSRS write path.
5. All burial checks must test all 4 conditions.
6. Codex prompts: under 80 lines, no CDP infra, port BOTH repos in same prompt.
7. SW version bumped on every code commit.

---

## 2026-06-15 Session Addendum — Card Render Glitch Root Cause Corrections

**Status:** Analysis + browser audit only. No code changes. FSRS 17/17 / smoke 6/6 confirmed pre-session.

**Source:** Combined Claude static analysis + Codex headless Chrome/CDP browser audit (6m 33s session, port 8897, PHASE2 only).

### New Bug Identifiers

| ID | Name | Severity | Status |
|---|---|---|---|
| FQ-RENDER-1 | Dual drop engines fire `selectSolo` twice per card (~42ms apart) | Critical | Open |
| FQ-RENDER-2 | `document.body.className=''` in active render path ~line 3939 (not only ~832) | High | Open |
| FQ-RENDER-3 | Triple prompt writer — `installBionicQuestionPatch352` re-writes plain text after bionic pass | High | Open |
| FQ-RENDER-4 | 700ms debounce at wrong layer (layer 11 of 11) — outer wrappers bypass it | Medium | Open |

### What Codex Browser Audit Corrected

**Claude claimed (static analysis):** System 1's `DROP_MS=7000` RAF fires `selectSolo(0)` at 7s hardcoded, causing premature auto-select with longer timer settings.
**Codex disproved:** With 13s timer, `selectSolo` fired at ~13.0s. System 1's RAF is not the live auto-select path on current PHASE2. System 3 (`soloStableRaf351`) is the active timer.

**Claude claimed:** Font flicker = two writers (`bionic()` vs `bionicHTML351()`).
**Codex found:** THREE writers. The third — `installBionicQuestionPatch352` (~line 7438) — runs plain-text rewrites repeatedly after `rerenderVisibleBionic351` has already applied bionic formatting. This is the primary "back and forth" flicker source.

**Claude claimed:** Active body class clear = line ~832 (System 1 renderSolo).
**Codex found:** Active body class clear is in System 2's render path around line ~3939. Both paths exist; line 3939 is the live one.

### Fix Plan (Source Edits Only — No New Wrappers)

| Fix | File | Line | Change |
|---|---|---|---|
| FQ-RENDER-1 | index.html | ~6948 (`startStableSoloDrop351`) | Add `clearSoloDrop()` at top — cancels System 2's `raf175164` before System 3 starts |
| FQ-RENDER-2 | index.html | ~3939 | Save `cozy*`/`na-*`/Drawer classes; restore after `document.body.className=''` |
| FQ-RENDER-3 | index.html | ~7438 (`installBionicQuestionPatch352`) | Guard: skip if `soloQuestion.innerHTML` already contains `<b>` |
| FQ-RENDER-4 | index.html | debounce layer | Move 700ms debounce to outermost position (after undo/rating/energy wrappers) |

### Dual-Fire Cascade (FQ-RENDER-1 Detail)

Because `selectSolo` fires twice per card (~42ms apart), every outer wrapper executes twice:
- **Layer 10 undo snapshot** (`__rectifierUndo372`) writes two snapshots per card → explains phantom undo depth / stale undo state
- **Layer 3 rating rectifier** (`__cozyRatingPath20260603`) calls `pendingFor()`/`rateCard()` twice → potential double FSRS write per answer
- **Layer 9 energy tracker** (`__energyTrack352`) records double energy spend

FQ-RENDER-1 fix (single-engine) is the highest-leverage change — it collapses all cascade issues.

### Probable But Not Yet Browser-Confirmed

- `installBuriedPoolFilter` setInterval(120ms) still running after E7 guard flags — may re-wrap pool
- `loopDomain` / Knowledge Expansion mode has same dual-engine pattern (untested)
- `applyPromptText` always writes plain text first regardless of `bionicOn` state

### Codex Prompt Target for Next Pass

File: `index.html`. All fixes are inline source edits — do NOT add `<script>` blocks.
Validation after each change: `runFSRSValidation()` 17/17 + `runCozySmokeTests()` 6/6.
Bump SW CACHE version in sw.js after any code change.
Port prompt to BOTH repos (PHASE1 + PHASE2) as per Rectifier Rule 6.

---

## 2026-06-15 (session 2) — FSRS Rating Override Bug — commit 048d073

**Bug ID: FQ-ALGO-1 | Severity: CRITICAL | Status: ✅ Patched**

### Symptom
Cards appearing as Good/Easy too soon. Explicit "Again" button apparently ignored — cards scheduled 3 days out instead of 10 minutes.

### Root Cause
`selectSolo` base function (line ~408) fired a **non-cancellable anonymous timer**: `setTimeout(()=>{rateCard(id, ok?'good':'again')}, 8000)`. No handle was stored, so it could never be cleared. Flow on a correctly-answered card where user clicks Again:
1. `selectSolo(i)` → ok=true → anonymous timer starts (8s → will fire `rateCard(id,'good')`)
2. User reads reveal, decides Again → clicks Again button
3. `rate(card,'again')` → `rateCard(id,'again')` → `next_due_at` = 10 min from now ✅
4. 8 seconds later: anonymous timer fires → `rateCard(id,'good')` → **overwrites to 3-day review** ❌

### Fix (commit 048d073)

**Change 1 — `selectSolo` line ~408:**
`setTimeout(...)` → `window.__cozyAutoRateHandle20260603=setTimeout(...)` — timer handle stored, cancellable.

**Change 2 — new script `cozy-explicit-rating-stabilizer-2026-06-11`:**
- `clearDeferredAutoRate()`: cancels `__cozyAutoRateHandle20260603` + clears pending rating
- `wrapRate()`: clears deferred timer before any explicit `rate(card, rating)` call
- `wrapRateCard()`: clears deferred timer before any explicit `rateCard(cardId, rating)` call
- `requeueAgainCard(card, rating)`: for 'again' ratings — if future `next_due_at`, clears `poolKey` (triggers pool rebuild) and returns; else removes from `seenThisSession`. Does NOT splice into current pool.
- Guard flag: `__cozyExplicitRatingStabilizer20260611`

**Probe validation:** Again→10m/relearning ✅, Hard→1d ✅, Good→3d ✅, Easy→15d ✅, FSRS 17/17 ✅, smoke 6/6 ✅

### Ordered Diagnosis List (most → least probable for "Good/Easy too soon")

| Probability | ID | Root Cause | Status |
|---|---|---|---|
| 1st | FQ-ALGO-1 | Anonymous deferred timer `rateCard(good)` overwrote explicit `again` 8.2s after selection | ✅ Patched 048d073 |
| 2nd | FQ-ALGO-2 | `repair_point=true` on wrong answers + E7G immediate-due pool treatment → again cards appear in Review Deck before 10-min due | Open — by design, may need configuring |
| 3rd | FQ-ALGO-3 | 18 review-stage rows with `next_due_at=null` → `isDue()=true` always → these cards appear every session | Open — data cleanup needed |
| 4th | FQ-RENDER-1 | Dual drop engines → selectSolo fires twice → outer rating wrappers double-write FSRS per card | Open — FQ-RENDER-1 fix required |
| 5th | FQ-ALGO-4 | "Again" cards not requeued in current session (no splice) — pool shifts to other cards; user perceives old cards returning "too good" | Open — Anki learning-step gap |
| 6th | FQ-ALGO-5 | Wrapper accumulation: rating-path-rectifier + explicit-stabilizer both reinstall at overlapping timeouts → layered wrappers on `rate()` | Functionally idempotent; architectural risk only |

### Autoselect Binary Rating Note
Timer auto-select (no explicit button) still fires `rateCard(id, ok?'good':'again')` at 8.2s — binary good/again by design. If user clicks Hard/Easy WITHIN 8.2s after auto-select, those now work correctly (timer cancelled). If user does nothing, binary auto-rate fires. This is correct Anki-approximation behavior for timed review.

### SW Version
`cozy-arcade-PHASE2-v18` (bumped in sw.js)

## Session Addendum — 2026-06-18/19 — FQ-ALGO-7 Regression, FQ-RENDER-5, DOMAIN-AGAIN-DUPE

This file is now historical/closed-out reference; **OPEN_DIFFERENTIALS.md is the live source of truth for bug status, AGENTS.md for SW versions** (per CLAUDE_HANDOFF's autonomous protocol). This entry is a pointer, not a duplicate — full detail lives in those files.

**FQ-ALGO-7 (regression, found and closed within 24h):** 2026-06-17's FQ-ALGO-4 fix (22260dc) replaced a pool-splice with a full pool reset, which in the default `random_new` order reshuffled the entire queue on every Again press without requeuing the missed card. User reported the app "acting different since last played." Reverted by Claude directly (Codex had no credits) on 2026-06-18, browser-confirmed correct on 2026-06-19 via live Playwright against the deployed URLs. Closed.

**FQ-RENDER-5 (4th attempt at a recurring symptom — see d5a470b 2026-05-30, dfb2ecc, 8a22e66, ebeef5e, 948abe7):** System2's drop-timer loop never actually stops once a card renders — `stopAllDropTimers()` only cancels System0; the `clearSoloDrop()` call meant to cancel System2 from outside its IIFE throws silently. Every prior fix only guarded the loop's *final* action (the auto-select call), never the loop itself — so the "AUTO-SELECT IN" warning text kept painting over live stable gameplay. Confirmed live in production both repos 2026-06-19. Fix designed (explicit ownership flag, checked at the top of the loop, reset every card as a stuck-flag safety net) but not yet applied — needs Codex/Playwright, this one involves RAF timing and closure scoping, not safe to hand-apply like FQ-ALGO-7 was.

**DOMAIN-AGAIN-DUPE (new, found 2026-06-19 via live deployed-URL audit):** A card duplicated 4x in `session.pool` after a Domain Again rating. Ruled out additive-pool-mutation bugs by grep (none exist outside the already-fixed splice). Found instead that `selectDomain` has been wrapped at least 13 times across the file — a deeper, never-before-documented chain than Solo's mapped 11-layer `selectSolo` chain (now written up in AGENTS.md). Root cause not yet pinned down; needs live per-layer instrumentation before any fix is attempted, same discipline FQ-RENDER-1 needed after three failed un-validated guesses in May/June.

**Lesson reinforced across all three:** narrow symptom-patches that guard only the visible end-effect (one auto-select call, one pool array) without stopping the actual mechanism keep resurfacing as the same bug in new clothes. Differential-first, live-browser-confirmed fixes only from here.

**Update 2026-06-19, later same day — all three closed:** FQ-RENDER-5 fixed (5th attempt at this symptom family, this one validated: 3 consecutive Solo cycles, 0 warning mutations, both repos, before push — PHASE2 `fb09afa` / PHASE1 `2c8f4ce`). DOMAIN-AGAIN-DUPE diagnosed and fixed same day: the `selectDomain` chain firing 5-6x per click turned out to be harmless on its own; the real bug was PHASE1 quietly carrying an older, additive `requeueAgainCard()` that PHASE2 had already replaced — the project's first confirmed PHASE1/PHASE2 source divergence (PHASE1 `2b84281`). FQ-ALGO-7 closed too (browser-confirmed correct via live Playwright against the deployed URLs). Three real bugs, one day, all either live-validated or carefully source-verified. See OPEN_DIFFERENTIALS.md for full detail.

**Update 2026-06-19, same day, a fourth bug — and a process failure worth naming:** FQ-DATA-2 had been marked ✅ fixed since 2026-06-17 (commit 3104391). It was never actually fixed. The guard checked `schema_version==='fsrs5'`, a value no code anywhere in the file ever writes — the guard could never fire, and `wrong_count` kept silently inflating by +1 on every page load for any card stuck in 'again' state. The user caught this themselves, by exporting their progress and noticing a few cards (including Primary Biliary Cholangitis) with implausible wrong_count values — not from a test gate, not from a Codex audit, from actually using the export feature. 27 of 99 reviewed cards in that export were affected; two had `wrong_count=136` against a true value of 1. Fixed for real this time (PHASE2 `88af09e` / PHASE1 `0b4482a`), verified against the actual corrupted numbers from the user's own export before applying. **The lesson: closing a differential because the diff looks right is not the same as closing it because it was checked against real data.** From here, no guard-condition fix gets marked ✅ without confirming the condition can actually be satisfied by something real code produces.

**Update 2026-06-19, two more reports same day, both correctly left open rather than guess-fixed:**
1. **FQ-ALGO-8:** user directly observed a timer-expired wrong auto-select get rated 'good'. Found the live suspect (`advance()`'s 7-layer wrapper chain, final layer defaults to 'good' if no pending rating matches) but the guard that should prevent this looks correct in isolation — the real trigger needs live instrumentation (CODEX_PROMPT_13), not a guess.
2. **D4-MUTATION reopened:** user reported "card glitch/flashing" with a screen recording + screenshots, reproduced on a zero-cache fresh browser during JSON import. Claude reviewed the visual evidence directly (no ffmpeg available to sample video motion) and found no content corruption in the stills — couldn't confirm or rule out a real flicker from that alone. Rather than guess, reopened the existing (previously deprioritized) D4-MUTATION differential as the likely match and queued CODEX_PROMPT_14 to confirm live under the user's actual repro condition.

Both fit the pattern established earlier today: deterministic, provable bugs (FQ-ALGO-7, FQ-DATA-2) get fixed directly and fast; anything involving event timing, multiple competing handlers, or visual motion gets a live diagnostic first, every time, no exceptions.

**Update 2026-06-19, ~5:00pm — the D4-MUTATION/reveal-glitch report resolved, fifth bug closed, sixth found and deliberately left open:** Claude's deep-think analysis (missing fallback chain in `renderRevealSections`) and Codex's independent live-browser pre-mortem (55-57 DOM mutations per reveal, plus a deeper `educational_objective`-contamination bug Claude had missed) converged on the same function. Claude verified Codex's contamination finding directly and discovered it's systemic — the same "answer over board_trigger" anti-pattern repeats in 8 places, not 1, and the specific function Codex's test exercised (`canonicalizeCard`'s display-mode branch) is actually unreachable in normal play (dead code, only `export` mode is ever called). Applied ONE targeted fix at the final display point (`renderRevealSections`): content-correctness fallback + idempotency guard, mirroring the One Thing box's already-proven pattern. PHASE2 `7bf4273` / PHASE1 `b91cf8f`. Did not touch SM-2/FSRS/rating code, did not fix the other 7 contamination sites, did not attempt Codex's recommended full chain consolidation — all logged as deliberate, not forgotten (OPEN_DIFFERENTIALS.md REVEAL-TRIGGER-CHURN/DATA-EO-ALIAS, both ⚠️ MITIGATED).

**Standing rule, now said three times across this file — make it the default, not a reminder:** when a patch touches a function with more than one caller or more than one prior patch already layered on it, fix the smallest verifiable thing at the most authoritative point, document everything else found along the way, and resist fixing it all in one pass even when the fix is obvious. Bulk is the risk, not effort.

**Update 2026-06-19, ~5:30pm — a validation scare that turned out to be a false alarm, and why it matters:** Codex's post-fix validation flagged `runSRSValidation()` returning 11/17 as a possible scheduler regression, right after the reveal fix above. This is the single most anxiety-inducing kind of finding for this project given the user's explicit, repeated concern about "backtracking on the algorithm that worked." Claude did not take the report at face value: traced `runSRSValidation` via `git log -L` to commit `79b75e5` (2026-05-25), commit message literally "implement window.runSRSValidation — 13 SM-2 assertions" — a test for the algorithm this project replaced with FSRS, weeks before today, unrelated to anything in this session. The project's actual gate, `runFSRSValidation()`, was extracted and *executed* (not just read) via macOS JXA against the exact current source: 17/17. **The lesson, on top of the FQ-DATA-2 lesson above: when a finding touches the thing the user is most afraid of breaking, the bar for verification goes up, not down — read the test's own history before treating its failure as signal.** `runSRSValidation` is now marked obsolete in OPEN_DIFFERENTIALS; not deleted, since removing code the user might be attached to without asking first is its own kind of unilateral risk.

**Update 2026-06-19, ~6:00pm — "the earliest writer" required real tracing, not an assumption:** Closing the first-frame flash meant finding which of `reveal()`'s 17 reassignments is actually live. Most are dead: two separate unconditional hard-replacements partway through the chain each discard everything before them, and only the second one (~line 7125) is the true root — confirmed by checking nothing later does the same thing. Applied the same fix already proven elsewhere to that one real location. The lesson restated once more, because it kept being true today: a layered chain's *textual* first occurrence is not its *live* first occurrence — check for hard-replacements before assuming a wrapper fix will ever execute.

**Update 2026-06-19, ~6:30pm — FQ-ALGO-8 fixed without ever finding the root cause, and that's the honest, correct outcome:** Asked to re-review everything, pre-mortem, then fix. Did the pre-mortem properly: re-traced `advance()`'s 7-layer chain (all genuinely live, unlike `reveal()`), found and cleared a new undocumented layer, ruled out a stale-closure theory by actually checking the relevant `<script>` block for a shadowing declaration. Found nothing deterministically wrong. Concluded the trigger is a genuine intermittent race, consistent with the user's own report of it happening once, not every time. **Did not force a root-cause finding that didn't exist.** Instead hardened the one fallback that produces the wrong observable symptom, made it safe regardless of what triggers it, and was careful enough in that hardening to discover and avoid a second-order regression it would have caused against the literal Continue button's existing, intentional behavior. This is the shape a fix should take when the race itself resists static proof: fix the blast radius, not a guessed cause, verify the fix doesn't break an adjacent intentional behavior, say plainly that the trigger is still unknown.

**Update 2026-06-20 — Codex's live test found something the static trace couldn't have, and that's exactly why this discipline exists:** the FQ-ALGO-8 fix held up in Codex's browser run, but the SAME run surfaced a more severe finding no amount of additional source reading would have caught cleanly: a single Space press appearing to both advance the card AND fire `selectSolo` on the next one. Claude found a plausible mechanism on review (19 keydown listeners, not the 6 previously documented; capture/bubble phase split; a bubble-phase listener with no reveal-state guard) but explicitly declined to fix it from that alone — the exact listener interaction across 19 registrations, in two phases, with inconsistent `stopImmediatePropagation` usage, is precisely the class of problem this file has said over and over needs live instrumentation, not a 20th guess. Queued a new diagnostic instead of a fix. Also flagged that Codex's own Continue-button test was inconclusive by construction (the flag it checked is designed to self-clear), and asked for a redesigned test rather than accepting an ambiguous result as proof either way.

**Update 2026-06-20, same day — the diagnostic paid off, and the fix went where the diagnostic pointed, not where it was easy:** `CODEX_PROMPT_15` found the exact mechanism: a global `stopImmediatePropagation` override that silently no-ops for Enter/Space at the reveal screen, letting a stale event reach a later bubble-phase listener after the card had already advanced. The obvious-looking fix was to touch the shim. Didn't — it's a global override with two OTHER conditions nobody left a comment explaining, affecting an unknown slice of 20+ keydown listeners. Fixed the actual unguarded consumer instead, with a narrow, same-event-cycle-scoped guard. Also caught that Codex's own follow-up Continue-button test, despite being a deliberate redesign, was still flawed in a way that made its result not actually prove anything — said so rather than letting an inconclusive test get treated as settled.

**Update 2026-06-20, closing the loop — fixed, live-validated, and still honest about what's left:** Codex re-ran the exact reproduction against the fix: 5/5 cycles, both repos, zero stray selections. FQ-ALGO-9 is closed for the symptom that was reported and reproduced. The shim itself is untouched, on purpose, and that's recorded as a standing architectural risk rather than something the fix quietly papered over. A timing-based guard with a 10x+ empirical safety margin is a reasonable trade against rewriting a global override with unknown dependents — but it's a trade, not a proof, and the docs say so. This is what "fixed" should mean in this codebase from here: closed for what was shown to happen, explicit about what wasn't touched and why, never silently upgraded to "the architecture is now sound."

**Update 2026-06-20, same day — refused to blame the JSON until the JSON actually proved guilty, twice, in both directions:** User pushed back on Codex's "duplicate field" report and asked for direct cross-validation, not agreement. Pulled the actual source JSON instead of trusting either report: confirmed the duplication was genuinely present in the source data (45-68% of cards, in BOTH the test deck and the user's own "FIXED" 1249-card reference database), so no code fix was applied — would have been hiding bad data behind a UI patch, exactly the bulk-patch shortcut this file keeps warning against. Then the user supplied 4 more real conversion files and a different finding emerged: one had raw, unconverted `{{c1::answer}}` Anki markup in 100/100 cards, with zero existing app-side handling. That one WAS a real, narrow code gap — fixed it, and only it. Same discipline, opposite conclusions, in the same conversation: don't reflexively blame the data, and don't reflexively spare the code either. Check each claim against the actual artifact before deciding which side of that line it's on.

**Update 2026-06-20, later same day — almost shipped the exact bug this file is about, caught it by tracing the data flow one level deeper before writing the fix:** Codex live-re-tested the duplication finding and proposed a fix: hide a field when it looks similar enough to one already shown. The user rejected that frame entirely and asked for completeness instead — show everything uploaded, nothing hidden, function like today. Good redirect: a symmetric similarity check would have hidden `explanation` (long, mostly unique case text) just because it contains a chunk of `educational_objective`. Re-grounded in `ULTIMATE_GOALS.md`'s 14-field canonical allowlist and `GOAL.md`'s E8 precedent (Full Card is a whitelist formatter, not heuristics) before writing anything — confirmed completeness was the established, already-correct pattern, not a new idea. Then, designing the "show why_not_others separately" addition, traced `normalizeSourceCard` one level deeper and found it silently copies `explanation` into `why_not_others` when the source has no distinct value — meaning the obvious-looking version of this exact fix (show both fields whenever both are non-empty) would have printed the same paragraph twice under two headings on most real cards. Caught via JXA simulation before applying, not after. This is the discipline working as intended: re-verify the data's actual shape one layer below where you're about to write code, every time, even on a fix that looks purely additive and safe.

**Update 2026-06-20, later still — a static trace concluded "clean," and it was wrong, not because the trace was sloppy but because the file has a second system the trace didn't know to look for:** Claude traced the live JSON-upload path (`importObjectPhase3`→`normalizeCardIdentity`) thoroughly and correctly concluded that SPECIFIC path never pollutes sparse cards. Codex didn't accept "I traced the code and it's clean" as the final word — retested through the actual Upload button and browser file chooser, and found real contamination. Both were right about what they'd each checked. The miss: this file has at least two independent `wire()` systems competing for ownership of the same 5 upload input IDs, and Claude's trace only followed the one that looked authoritative (the one with the clone-and-replace, self-reasserting-every-second pattern), not realizing a second, older one also still runs and unconditionally re-normalizes the whole deck through a polluting function on every invocation. Lesson: for any "is the live path clean" question in this file, a single confirmed path is not the same as confirming there's only one path — multi-listener races (already known from FQ-ALGO-9's keydown saga) apply just as much to `change` events, clicks, and anything else with more than one handler on the same element. Fixed the actual data-fabrication bug at its source rather than the listener race (same reason FQ-ALGO-9 didn't touch the propagation shim): the race needs live instrumentation before any fix, the fabrication bug didn't.

**Update 2026-06-22 — that "fix" was also incomplete, for two concrete, fixable reasons, both now corrected:** Codex's real-upload retest (`ff98200`) found the sparse-card pollution STILL present after `e5e6f6d`. Two distinct misses, both worth remembering: (1) Claude had declared `normalizeCardFields352`/`normalizeDeckFields352` dead code based on `grep "normalizeCardFields352("` finding zero calls — but the actual call site is `cards.forEach(normalizeCardFields352)`, a bare function reference with no `(` immediately after the name, which that exact grep pattern cannot match. Lesson: "search for `name(`" finds direct calls only; bare references passed to `.forEach`/`.map`/`setTimeout`/etc. need a plain `grep "name"` pass too, every time "is this dead code" is the question. (2) Claude's own `revealSoft` fix removed the literal `,c.diagnosis` term but left `c.back`/`c.answer`/`c.output` in the same fallback chain — and those are themselves diagnosis-equivalent by the time they're read, because multiple normalizers in this file (including the one just found in #1) default `answer = answer || diagnosis`. Removing the named symptom isn't the same as removing every path to the same value. Both corrected and ported to PHASE1 (`c054cab`), JXA-verified, independently re-confirmed (not just accepted) before committing.

---

## PRE-MORTEM ANALYSIS — 2026-06-22, requested by user after the level_N bug resurfaced a third time

**Standing rule, going forward, on this whole class of problem: before deleting or neutralizing ANY existing code (a field, a fallback term, a function, a guard), first write down — even just one sentence — what that code's CURRENT, ACTUAL purpose is and who its known callers/dependents are.** Not what it was probably for when written. What it actually does today, confirmed by reading callers, not assumed from the name or a comment. Today's home-button bug is a direct example of skipping this step in the past: `standardHud()` disabled `homeTopBtn` with a comment naming `normalizeHud()` as the replacement owner — but `normalizeHud` doesn't exist anywhere in the file anymore. Something renamed or replaced it (almost certainly into `renderHudControls()`) and nobody went back to confirm the disabling code's premise still held. **No quick patches. No deleting code without redrafting its current purpose first. Reduce bulk at the end of a fix, not as the fix itself.**

### The deeper architectural fact behind today's recurring bugs

This project has not one card pipeline but at least two, coexisting in the same file, each with its own normalize/import logic, and — this is the important part — **they write to the exact same localStorage key** (`cozy_arcade_limitless_cards_v1`), not separate ones:

- **"Limitless" system:** `LIMITLESS_LABEL`/`LIMITLESS_STORAGE_KEY`/`LIMITLESS_META_KEY` (~line 8367), `normalizeLimitlessCard()` (~8396), `normalizeDeck()` (~8445), the older `wire()` that owns its own capture-phase `change` listeners (~8565). Branded "COZY ARCADE BOARD PREP-MEDICINE LIMITLESS" — an older product name, suggesting this is the OLDER of the two systems, kept alive rather than removed when the newer one was built.
- **"Phase3/Canonical" system:** `phase3State`, `canonicalCardId()` (~10746), `importObjectPhase3()`, `normalizeCardIdentity()`, `setAppCards()` (~10847) — the newer, more careful system, with its own clone-and-replace input-ownership mechanism and a 1-second self-reasserting interval.

Both `setAppCards`-equivalents in both systems persist to **the same key**. There is no merge contract, no "who owns this key" arbitration — whichever system's write happens to run last for a given user action wins, silently. This is the same shape of bug already found and fixed twice today (FQ-ALGO-9's keydown race, the sparse-card upload race) — except those were about *event listeners* racing for the same DOM element; this is about *two normalization systems* racing for the same persisted state. It is very likely "the ultimate source of card evolution over time" the user asked about: not the `level_N` field names specifically, but the fact that two independent systems have been mutating the same stored deck for a long time, each occasionally "fixed" without the other one being checked.

### Ranked diagnostic list (most probable source of remaining/future card-translation errors, in order)

1. **Limitless/Phase3 dual-write to `cozy_arcade_limitless_cards_v1` with no ownership contract.** Highest-probability source of "a fix here gets undone by something else" bugs going forward, including today's two level_N/diagnosis-pollution rounds. Needs live instrumentation (which system actually wins, and when) before any structural fix — same discipline as every listener race this session, not a guess.
2. **`level_N` legacy fields (~100 remaining references) outside the two chains already cleaned today.** Confirmed dead against all 6 real decks checked this session; scope: CSV-import-specific parsing (`normalizeLimitlessCard`'s CSV path, `cardsFromCsv351`, `normalizeCard`×2), `canonicalizeCard`, and the field-storage properties themselves (`level_3_treatment`, `level_3_next_step`, `level_1_presentation`). Safe-looking removal candidate, but each site needs the same "what's its current purpose, who calls it" check before deletion, not a blanket strip.
3. **`standardHud()`'s `homeTopBtn` disable references a function (`normalizeHud`) that no longer exists.** The intended replacement, `renderHudControls()`, only ever runs for `solo`/`domain` gameplay (patched onto `renderSolo`/`renderDomain`, wrapped in `setTimeout(...,0)` + a silently-swallowing `try/catch`). If that patch fails to attach, or fires before the HUD DOM exists, there is no floating button AND no HUD-embedded one — zero error, zero toast, just a missing way home. Static screens (`#settings`, `#review`, `#pause`, `#end`) have their own baked-in `data-home`/`*Home` buttons and are not at risk; the actual risk window is specifically inside live `#solo`/`#domain` gameplay.
4. **`canonicalizeCard()`'s `mode:'display'` branch** — confirmed dead (export-mode only) as of 2026-06-19's DATA-EO-ALIAS investigation, but worth re-checking it's still dead after today's changes before assuming so again.
5. **Multiple `onclick=` assignments to the same element across the file** (`homeTopBtn` alone has at least 3: lines ~1321, ~2163, ~5644, plus the nulling at ~2376) — last-one-to-run wins, same family of bug as the dual-write/listener races, lower severity since `onclick=` (unlike `addEventListener`) at least can't double-fire, but still fragile to load-order changes.
6. **`#toast` "Imported N cards" message reflects whichever system's import path fired** — per the screenshot's "Imported 479 cards," worth confirming which pipeline (Limitless vs Phase3) actually produced that exact number for a known deck, as a cheap way to empirically detect which system is currently "winning" the dual-write race in practice.

### Plan for Codex testing (real browser, real UI controls — not direct function calls, per this session's established discipline)

1. **Dual-write race:** upload a deck through the real Upload button, then immediately inspect `localStorage.getItem('cozy_arcade_limitless_cards_v1')` and `window.phase3State.cards`/`window.appCards()` together. Reload the page (not a hard reset) and re-check both. Repeat 3x to see if which system's data survives is consistent or timing-dependent.
2. **Home button:** start a Solo session, let multiple cards render, and on each one check (a) `document.getElementById('homeTopBtn')`'s computed `display` and `onclick`, (b) whether `#solo .hud [data-home]` (or equivalent rendered by `renderHudControls`) exists and is clickable. Confirm whether there's ever a window with neither present.
3. **level_N dead-code confirmation:** before removing the remaining ~100 references, grep-confirm (using the corrected method — bare name, not `name(`) every remaining call site's actual reachability, the same way `normalizeDeckFields352` was missed once already.
4. Standard gates unchanged: `runFSRSValidation()` 17/17, `runCozySmokeTests()` 6/6, real file-chooser upload (not direct function injection) for anything import-related.

No code changed in this entry — this is the analysis the user asked for before any further deletion or patching.

**Update 2026-06-23 — pre-mortem correctly talked me out of the bigger fix, twice in one session:** User asked for "pre-mortem then implement" on Codex's reveal-ownership feedback. Two candidate fixes existed: (1) restore the `current`-swap safety net (`answeredCard17521`) that an earlier hard-replace had silently discarded, or (2) make `wrappedAdvance` explicitly clear the reveal panel before the next card renders. Traced (1) far enough to find it requires a NEW cross-script global plus tracing `selectSolo`'s own ~11-layer chain — i.e., exactly "another wrapper," which is what Codex's own feedback explicitly said not to do. Implemented (2) instead: self-contained, no cross-function state, mirrors a pattern already proven correct elsewhere in the same function. Also fixed a confirmed CSS cascade bug (homeTopBtn computed `display:grid` despite an inline `display:none` and two `!important` hiding rules) the cheap way Codex recommended — one final kill-rule at the end of the file — rather than fully untangling why the existing cascade resolves the way it does. Two real fixes shipped from one pre-mortem, the third candidate correctly left alone. This is the discipline doing its job: "implement" doesn't mean "implement everything suggested," it means implement what survives the pre-mortem.

Separately: git push broke mid-session with an authentication error, after several commits had already landed locally and one had even pushed successfully to `main` before failing on the very next push to `public`. Not a code problem — didn't try to work around it (no force-anything, no credential-bypass attempts). Kept committing locally so no work was lost, documented exactly which commits are pushed vs pending in `PROJECT_STATUS`, and waited for the user to refresh the credential rather than guessing at a fix for something outside the codebase.

**Correction 2026-06-23 — Codex browser retest rejected the first homeTopBtn kill-rule:** The final appended rule existed, but it used lower specificity than older `button#homeTopBtn` / `#homeTopBtn.homeTopBtn` rules that still set `display:grid!important`. Mobile/browser state still had a hidden 44x44 grid box until the game-shell class appeared. Fixed with a higher-specificity final kill-rule that also zeros width/height/pointer-events; retest required before push.

---

## PRE-MORTEM — 2026-07-04, requested by user after four separate incidents in one session, explicitly because of "so many errors"

Four things went wrong today, in sequence, each with the identical root shape: **something was declared true without live re-verification, and stayed wrong for days-to-weeks before anyone actually checked.**

1. **Deploy-stale (10+ days).** A 2026-06-24 doc entry (`PAGES-SOURCE-BRANCH`) claimed Pages Source had been switched to `main` and "confirmed live." Nobody re-curled the live `sw.js` after that day. It wasn't true, or reverted silently — `main` advanced 15+ commits with zero live effect for over a week, costing a full day twice (once ~a week before 2026-07-04, then again on 2026-07-04 itself, before being root-caused).
2. **ADVANCE-LOCK-SELF-CANCEL.** Fixing incident #1 exposed a real, already-live bug that had been sitting inert on `main` the whole time deploy was stale — nobody had exercised that code in production for weeks, so nobody caught it. Not a new bug from today's work; a hidden one, surfaced by fixing something unrelated.
3. **REVEAL-TRIGGER-CHURN's root cause was only half-diagnosed for weeks.** Multiple prior sessions (06-19 through 06-24) measured mutation counts and treated the "multi-writer reveal() chain" as the whole story. It wasn't — the actual majority contributor (two document-wide `setInterval` sweeps rewriting text unconditionally) had never been instrumented for, because every prior pass looked at the reveal()/renderRevealSections() writers specifically and never asked "what ELSE touches this DOM subtree."
4. **The reveal() chain's own "dead code" claim was itself unverified.** This file's 2026-06-19 entry ("line ~7125 is the true live root... only 8913/9380/9718 chain") was repeated as fact by Claude on 2026-07-04 without re-checking — until the user directly asked "how do you know it's dead code?" Re-verified via live stack trace and found the OLD claim was itself incomplete: it missed an entire live layer (line ~2485) that the 06-19 investigation never found. The 06-19 claim wasn't fabricated — it was a real, careful investigation for its time — but it was still treated as permanently true rather than a point-in-time finding, the same mistake as #1.

**The single underlying failure mode, stated once, to stop repeating it a fifth time: a claim of "verified" or "confirmed" or "dead code" describes the state of the system AT THE MOMENT it was checked, not a permanent property of the code.** Every one of today's four incidents would have been caught immediately by a live re-check at the start of the session that touched it — a curl, a stack trace, a browser test — instead of trusting the last session's written record. This project's docs are good at RECORDING findings; they are not, and cannot be, a substitute for RE-CHECKING them before relying on them, especially after any deploy, branch, or multi-week gap.

**Standing rule, going forward, stronger than "verify before fixing" — verify before TRUSTING, even your own prior session's notes:** before answering "is X still true," re-run the check that established X, every time, regardless of how recently or how carefully it was written down. This applies to: deploy/live state (curl), "is this code dead" (stack trace or grep, not memory), "is this bug fixed" (re-run the repro), and "is this the root cause" (instrument, don't assume the last investigation found everything).

**What was done right today, worth keeping:** every one of the four incidents WAS eventually caught by someone actually checking (the user noticing the game was broken, Claude/Codex re-curling live, Claude re-instrumenting the reveal chain) rather than by extending trust further. The fixes themselves were narrow, measured before/after, and validated (FSRS 17/17, smoke 6/6, live curl, live functional replay) before being called done. The failure was in how long it took to start checking, not in the checking itself once started.

**Reveal-chain consolidation — deliberately NOT started today, scoped for a future dedicated pass:** the empirically-confirmed live chain for the solo-answer path is 5 layers deep (source lines 2485→9751→9413→8946→7133, verified by live stack trace, not the "1 root + 3 chain" the 06-19 entry claimed). Domain mode and 5 other `reveal()` call sites (lines 408, 414, 874, 3293, 4106, 6912 — only 4093 traced so far) are NOT yet verified against the same method. Goal, if/when this is taken up: not deleting the ~11 apparently-unreached reassignments (cosmetic, lower value) but consolidating the confirmed-live 5-layer chain into one function with one responsibility, so a future patch can't blindly add a 6th wrapper without anyone realizing 5 already exist — which is exactly how the chain got this deep in the first place. Steps: (1) trace every remaining call site the same way, (2) capture full before-behavior (values, not counts) across every card type/mode as a reference, (3) write one consolidated function, (4) diff its output against the reference byte-for-byte, (5) full gate + live validation before any commit. Not attempted today — bigger and riskier than anything else in this session, deserves its own dedicated pass with nothing else bundled in.

**Step 1 attempted same day, domain mode blocked by a known limitation, not a new gap:** tried the identical live stack-trace method against `selectDomain(0)` (synthetic 3-card deck, real Upload flow). Reveal never fired within 3s, no thrown error — consistent with the already-documented `ANSWER-SELECT-HEADLESS` differential (orb selection needs real visual/pointer positioning, doesn't work via direct function call in headless). Not pursued further today per "reduce bulk" — domain-mode verification needs a real device or headed-browser test, not more headless engineering. Solo-mode's 5-layer chain remains the only empirically-confirmed part of this investigation.
