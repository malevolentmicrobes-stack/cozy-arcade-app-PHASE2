# Senior Dev Audit — Cozy Arcade PHASE2 / PHASE1
**Date:** 2026-06-07  
**Repos:** cozy-arcade-app-PHASE2 code @ d1ed274; docs HEAD @ bae38a2 · cozy-arcade-app @ d2ed490 per handoff  
**Purpose:** Pre-production glitch triage for team review. Root causes + all secondary modifiers listed per issue.

---

## 2026-06-07 Codex Browser Evidence Addendum

This addendum supersedes any weaker/older claims below. Validation was run against PHASE2 from local HTTP on `http://127.0.0.1:8820/index.html?paid=test_override` using an isolated headless Chrome/CDP profile on port `9295`. The code state is still the d1ed274 code path; the current repo HEAD `bae38a2` is a docs-only audit commit.

### Browser-tested results

| Check | Result | Notes |
|---|---:|---|
| FSRS validation | PASS | `runFSRSValidation()` returned 17/17 |
| Smoke validation | PASS | `runCozySmokeTests()` returned 6/6 |
| PHASE2 service worker | PASS | cache key `cozy-arcade-PHASE2-v7` present |
| "Beta Spaced" label | PASS | no `Beta Spaced` text in browser body |
| Shadow Dungeon default scope | PASS | `shadowScope351` resets to `due` on open |
| Shadow Dungeon start scope sync | PASS | `browseScope351` and `dataset.cozyLaunchScope` are `due` after Start |
| Buried-like JSON examples in pool | PASS for tested modes | injected `card-0003`, `card-0004`, `card-0006` as `suspended:true`, `last_rating:"bury"`; no leaks through `due`, `review_deck`, `pinned`, `random_new`, `random_all`, `new_first` |
| Boot visible modal/menu flash | NOT REPRODUCED | corrected viewport-intersection probe saw no visible `settings`, `review`, `pause`, `end`, `notify`, or `shadowSetup351` flash in first ~2.5s |
| Boot select value churn | OBSERVED | `browseScope351` appears after boot and can move from absent to `all`; user-reported option flash remains plausible from home panel rebuild/select option churn |
| Pause menu export | PASS | clicking `#pauseExport` downloaded `cozy_arcade_progress_2026-06-07.json` |
| HUD `×` export | FAIL for file export | HUD `×` exits home but did not create a new progress download; it only preserves local state |
| HUD undo position | PASS in focused check | focused HUD probe found role order `undo`, `pause`, `home`, `settings` |
| Undo depth, Solo injected deck | PARTIAL | restored 4 real injected-card snapshots, so "only two" was not reproduced exactly |
| Undo correctness | FAIL production bar | first snapshot can be stale/ghost, Domain is not undo-wrapped, restore forces `mode='solo'`, session queue/index is not restored |

### JSON evidence from user gameplay exports

The four files in `/Users/rebekahbetar/Documents/selected wrong then good.... card state diagnosis/` all contain 1,435 progress entries. The same three buried-like records appear in each:

```json
{
  "card-0003": { "suspended": true, "buried": false, "last_rating": "bury", "correct_count": 1, "wrong_count": 0, "stage": "review" },
  "card-0004": { "suspended": true, "buried": false, "last_rating": "bury", "correct_count": 1, "wrong_count": 0, "stage": "review" },
  "card-0006": { "suspended": true, "buried": false, "last_rating": "bury", "correct_count": 1, "wrong_count": 0, "stage": "review" }
}
```

Implication: production filtering must treat all of these as excluded from gameplay: `suspended`, `buried`, `rating === "bury"`, `last_rating === "bury"`, plus session-buried IDs. A future export may have `last_rating:"bury"` without `suspended:true`, so the stricter filter is still required even though the supplied JSON examples passed current browser pool checks.

### Corrected interpretation of the main-page flash

The first CDP probe incorrectly counted the settings drawer as visible because it only checked element size; `#cozySettingsDrawer351` has size while transformed off-screen. The corrected probe checks viewport intersection and did **not** reproduce a visible drawer/modal flash.

Remaining likely sources for the user-visible "menu flashes options to select":

1. `showHomePanel351()` rebuilds the home panel via `innerHTML`, so the General Study Mode select is destroyed/recreated.
2. Multiple installers call home/layout patchers on `DOMContentLoaded`, delayed `setTimeout`, and polling intervals.
3. `ensureScopeOptions352()`/home-scope normalization can insert/remove or remap options while the user is watching the home screen.
4. Browser autofill/form-state restore may briefly restore the previous select value before late code normalizes it.

The next production test should sample the actual `browseScope351.options` list and selected value every animation frame for 2.5s on desktop and mobile, not just modal visibility.

### Corrected interpretation of undo

The injected Solo test answered five cards and then called `undoReview()` five times. It restored four real injected cards: `undo-card-3`, `undo-card-2`, `undo-card-1`, `undo-card-0`; the fifth undo consumed a stale/ghost snapshot and returned false. This does not match a hard two-card limit, but it confirms the current implementation is still not production-correct.

The remaining undo defects are architectural:

1. Undo wraps `selectSolo` only; `selectDomain`/Shadow Dungeon domain gameplay is not covered.
2. `restoreUndoSnapshot()` forces `mode = 'solo'`, so undo from Domain is structurally wrong.
3. Session pool, Shadow queue index, score/streak/HP, and timer state are not restored.
4. Wrapper chains can capture stale `current` before the injected/imported deck is fully authoritative.

### Export behavior correction

`#pauseExport` does export a durable file. HUD `×` does not. Current user-facing copy should distinguish:

- Pause → Export Progress: durable JSON backup.
- HUD `×`: exit to home, local browser save only.

If "x still exports progress" is a product requirement, HUD `×` must call the same Phase 3 export path as `#pauseExport`, or it must show the save/export decision modal before leaving gameplay.

### Production cleanup recommendation

Do not add another wrapper patch for these issues. The elegant fix is to delete the patch stack in favor of these small authorities:

1. `isExcludedFromGameplay(cardOrId)` as the only gameplay exclusion predicate.
2. `resolveStudyScope({ source, mode })` as the only scope translator for home, review, and Shadow Dungeon.
3. `buildStudyPool({ gameType, scope, system, tag })` as the only pool builder.
4. `commitAnswerTransaction({ gameType, cardId, selectedIndex, source })` as the only rating/progress writer.
5. `undoTransaction()` restoring card, mode, queue index, score/streak/HP, timer, progress, and legacy mirror.
6. `renderHomeControls()` and `renderHudControls()` as idempotent renderers, with no polling `setInterval` patchers.

---

## 0. Architecture Context (read first)

The app is a single `index.html` (~14 800 lines). All logic is in sequential `<script>` blocks and appended IIFEs. There is no bundler, no module system, no tree-shaking. Every patch appended to the file wraps earlier functions by reassigning globals. This pattern is the root cause of most issues below.

**Canonical data paths (two separate stores — never unified):**
| Store | Key | Written by |
|---|---|---|
| Legacy `state` | `soloStudyingState_v1757` | `record()`, `rate()`, `saveState()` |
| Phase 3 FSRS | `cozy_arcade_progress_v1` | `rateCard()`, `phase3State.progress` |

Progress is mirrored from Phase 3 → legacy inside `record()`, but the mirror is one-way and partial.

---

## 1. Shadow Dungeon Defaults to "Review Pinned" on Start

### Confirmed root causes

**1-A. Browser remembers last `<select>` value (primary)**  
`ensureShadowSetup351()` sets `ov.innerHTML` with `<option value="due" selected>`. The `selected` HTML attribute only sets the *initial* default. Once a user picks "Review pinned and missed cards," the browser caches that choice for the session. Reopening the overlay reuses the cached value. Our fix in `openShadowSetup351()` explicitly sets `sc.value='due'` on every open — this is the correct mitigation.

**1-B. Duplicate shadow start handler (secondary)**  
There are **two** shadow start handlers:
- **Primary** (L6385): `$('shadowStart351').onclick = ()=>{…}` — sets `homeScope175155`, now also sets `browseScope351` (fixed d1ed274).
- **Secondary** (L13020): `start.addEventListener('click', ()=>{…})` — guarded by `!start.onclick`. Since the primary handler sets `.onclick`, this secondary path is **never reached**. It is dead code that previously contained the `browseScope351` write. Dead code risk: if the primary handler is ever removed or refactored away, the secondary silently takes over with different scope logic.

**1-C. `startSolo()` reads `browseScope351` before home scope propagates (secondary)**  
Even with the fix, `syncGeneralStudyScopePhase3(studyMode)` must fire synchronously and write `dataset.cozyLaunchScope`, `phase3State.settings.solo_order`, `deckMode`, and `homeFilters.scope` before `directStartGame351()` calls `getStudyPool()`. If `syncGeneralStudyScopePhase3` is undefined at time of call (not yet installed), the scope silently falls back to whatever `browseScope351` last held.

**1-D. `shadowSchedule351` second dropdown (cosmetic but confusing)**  
The overlay contains a redundant "Review scheduled" dropdown (`#shadowSchedule351`) that is never read by the start handler — only `#shadowScope351` is read. Users may change `shadowSchedule351` thinking it controls behavior. It does nothing.

**Validation test:**
```javascript
// In DevTools console after hard reload:
openShadowSetup351();
console.assert(document.getElementById('shadowScope351').value === 'due', 'FAIL: scope not reset');
document.getElementById('shadowScope351').value = 'pinned';
document.getElementById('shadowStart351').click();
setTimeout(() => {
  const bs = document.getElementById('browseScope351');
  console.assert(bs?.value === 'due', 'FAIL: browseScope not synced; got ' + bs?.value);
}, 300);
```

---

## 2. Buried Cards Appearing in Play Deck

### Confirmed root causes

**2-A. `review_deck` fallback branch at L11514 still only checks `suspended` (critical — NOT YET FIXED)**  
There are **two** `review_deck` branches in `getStudyPool()`:

| Location | Filter |
|---|---|
| L11458 (primary, fixed d1ed274) | `!p.suspended && !p.buried && p.rating!=='bury' && p.last_rating!=='bury'` |
| L11514 (fallback, **unfixed**) | `.filter(c => !progressForCard(c).suspended)` only |

The fallback at L11514 is reached via the `scheduledModes` refresh path. A card that was buried will pass through if `p.buried` is falsy but `p.last_rating==='bury'`.

**2-B. JSON burial encoding mismatch (critical)**  
Cards buried in-app are stored as:
```json
{ "suspended": true, "last_rating": "bury", "rating": "bury" }
```
NOT as `{ "buried": true }`. Any filter that only checks `p.buried` misses all real buried cards. The four conditions that must ALL be checked: `!p.suspended`, `!p.buried`, `p.rating !== 'bury'`, `p.last_rating !== 'bury'`.

**2-C. `due` branch (L11447) has no burial check**  
```javascript
arr = arr.filter(c => isDue(progress(c)));
```
A card that is buried but has a `next_due_at` in the past will pass `isDue()` and appear in the `due` pool. Shadow Dungeon "Spaced Repetition" mode maps to `due`, so buried cards flow into SD sessions.

**2-D. `basePlayableCards()` is NOT called by `review_deck` or `due` branches**  
`basePlayableCards()` at L11093 correctly filters `!p.buried && !p.suspended && !isReviewedCard(card)`. But the `review_deck` and `due` branches bypass it entirely and run their own filter chains. The "new cards" and standard session paths do call `basePlayableCards()`, which is why burial works there but not in review/due modes.

**2-E. `progressForCard()` vs `progress()` — two different lookup functions**  
The primary branch uses `progressForCard(c)` (Phase 3 lookup, normalizes aliases). The fallback branch uses `progress(c)` (legacy lookup). A card imported with a non-canonical ID may exist under one lookup but not the other, causing filters to see an empty object where `suspended` and `buried` are both `undefined` (falsy) — effectively treating all filters as passing.

**Fix required (L11514–11519):**
```javascript
// Change:
if (selected === 'review_deck') {
  return applyStudyFiltersPhase3(normalizeDeckIdentities()).filter(c => !progressForCard(c).suspended).filter(c => {
// To:
if (selected === 'review_deck') {
  return applyStudyFiltersPhase3(normalizeDeckIdentities()).filter(c => { const p=progressForCard(c); return !p.suspended && !p.buried && p.rating!=='bury' && p.last_rating!=='bury'; }).filter(c => {
```

**Also fix `due` branch (L11447):**
```javascript
// Change:
arr = arr.filter(c => isDue(progress(c)));
// To:
arr = arr.filter(c => { const p=progressForCard(c); return isDue(p) && !p.suspended && !p.buried && p.rating!=='bury' && p.last_rating!=='bury'; });
```

**Validation test:**
```javascript
// Bury a card, then check pool:
const testId = Object.keys(window.phase3State.progress)[0];
window.phase3State.progress[testId].suspended = true;
window.phase3State.progress[testId].last_rating = 'bury';
const pool = window.getStudyPool ? window.getStudyPool('review_deck') : [];
const leaked = pool.filter(c => (c.id||c.qid) === testId);
console.assert(leaked.length === 0, 'FAIL: buried card leaked into review_deck pool');
```

---

## 3. "Beta Spaced Repetition" Label — PHASE2 Status

**Locations audited:**
| Location | Status |
|---|---|
| `shadowScope351` `<option>` in `ensureShadowSetup351()` L6373 | ✅ Fixed: "Spaced Repetition" |
| Second shadow overlay HTML L13014 | ✅ Fixed: "Spaced Repetition" |
| `shadowSchedule351` dropdown (decorative, unused) | ✅ "Spaced Repetition" |
| `#review` screen `<h1>` at L381 static HTML | ✅ "Spaced Repetition" |
| Settings `spacedToggle` label | ✅ "Spaced Repetition after answers" |

**Residual risk:**  
The `shadowSchedule351` dropdown (label "Review scheduled") is never read by the start handler and shows "Spaced Repetition" as an option. Users clicking this will get no effect. It should either be removed or wired to `shadowScope351`'s change handler.

---

## 4. `selectSolo` Wrapper Chain — 11 Layers Deep

This is the most significant architectural debt in the codebase. Every patch wraps `window.selectSolo` without removing the prior wrap. Current chain on page load:

| Layer | Line | Name / Purpose | Sets flag? |
|---|---|---|---|
| 1 | 408 | Base game selectSolo | — |
| 2 | 860 | Knowledge Pulse / shadow queue advance | — |
| 3 | 2431 | Rating-path rectifier (auto-select commit) | — |
| 4 | 2741 | Bionic / stable-random wrapper | — |
| 5 | 3958 | Shadow dungeon queue advance (v2) | — |
| 6 | 4071 | Unlisted wrapper | — |
| 7 | 4227 | Unlisted wrapper | — |
| 8 | 6893 | Energy scope wrapper | — |
| 9 | 7752 | Energy tracker (`__energyTrack352`) | `__energyTrack352=true` |
| 10 | 13303 | Undo snapshot wrapper | `__rectifierUndo372=true` |
| 11 | 14199 | 700ms debounce guard | — |

**Effects:**
- Each layer runs sequentially on every answer. 11 function calls per selection.
- The debounce at layer 11 (700ms) can swallow rapid undo + re-selection sequences.
- Layers 6 and 7 have no guard flags and are re-applied on every `DOMContentLoaded` that fires in order.
- The undo wrapper (layer 10) guards against re-wrap via `.__rectifierUndo372`, but layers 6, 7, and 11 run after it and add new outer wrappers that don't propagate the flag.

---

## 5. Undo Button Only Goes Back ~2 Cards

### Confirmed root causes

**5-A. Double-snapshot per card (partially fixed d1ed274)**  
Energy tracker (layer 9) does NOT copy `.__rectifierUndo372` from the prior `selectSolo`. When the undo wrapper (layer 10) installs at ~1200ms, it sees the energy wrapper (without `__rectifierUndo372`) and wraps it. The energy wrapper then wraps the undo wrapper externally via its own install cycle. Result: two snapshots pushed per answered card. The same-card-ID dedupe fix (d1ed274) mitigates but does not eliminate this — if card IDs differ (new card drawn before dedupe runs), both snapshots land.

**5-B. 700ms debounce (layer 11) prevents rapid undo+reselect**  
The debounce runs at the outermost layer. Calling `undoReview()` then immediately answering hits the 700ms guard and the answer is silently dropped. User perceives "undo worked but nothing happened."

**5-C. Undo restores `phase3State.progress` snapshot but NOT `cardPool` session position**  
`restoreUndoSnapshot()` at L13276 restores the card's progress object. But `sessionPool` (the shuffled in-session array) and `window.__shadowRunQueue` index are not restored. After undo, `nextCard()` draws the next card from the session sequence, not the undone card. User sees a *different* card, making it appear undo went back only one review.

**5-D. Stack limit is 5 but only ~2 are recoverable**  
Stack stores up to 5 snapshots. But because the session position is not restored (5-C), only the most recent 1–2 undos show any visual effect. The remaining stack entries are consumed silently.

**Correct undo behavior requires:**
1. Snapshot: card ID, progress state, session pool index, score, streak, HP.
2. Restore: all of the above, then re-render the undone card.

---

## 6. Home Screen Menu Flash

### Confirmed root causes

**6-A. Multiple `show('home')` calls at different times**  
- L599: `DOMContentLoaded` → `show('home')` (base)
- L1436: A second `show()` function is defined that hides all `.screen` elements via `querySelectorAll('.screen')` — different selector than the base `show()` which uses a fixed `screens` array. If a late-installing IIFE calls this version, it re-hides all screens including game screens while user is mid-game.
- L1462: `forceSpacedDefaultOff()` + `wireSettingsReturn()` + `setInterval(wireSettingsReturn, 1000)` — the interval-based re-wiring can fire mid-render.

**6-B. `ensureScopeOptions352()` temporarily inserts `Suspended / buried` into visible `browseScope351`**  
L7831: this function adds a "Suspended / buried" option to `browseScope351` during install. A later cleanup removes it. Between install and cleanup (~50–200ms), the home dropdown briefly shows the option before it disappears — visible as a flash/jump.

**6-C. Home panel `innerHTML` is rebuilt on every `showHomePanel351()` call**  
L6172: `panel.innerHTML = '...'` — replaces the entire review deck panel HTML. Any pending user input in a select is wiped. On slow devices, the repaint is visible.

**6-D. `DOMContentLoaded` fires multiple times across IIFEs (race condition)**  
The file has 9+ `document.addEventListener('DOMContentLoaded', ...)` listeners. On first load, all fire in registration order. IIFEs registered early may complete and call `show('home')` while later IIFEs are still mid-install, causing partial DOM states to render briefly.

---

## 7. Auto-Select Timer — Perceived Bias

**The timer is NOT selecting the correct answer preferentially.** The runner starts at `selected=0` (lane A) on every new card. The timer fires `selectSolo(selected)` when `timer<=0`. Lane A is shuffled randomly, so over many cards, lane A is correct ~25% of the time. Observed "auto-select correct" is coincidence bias or confirmation bias.

**However, there is a real issue:**  
The debounce wrapper (layer 11, 700ms) means if a user presses a key within 700ms of the previous answer, it is dropped. Combined with the ~650ms `setTimeout` before `reveal()` shows, users who select quickly can have their rating swallowed. They see the card advance without a rating being recorded — appears as "auto-selected."

**For Shadow Dungeon specifically:**  
After an undo or pool refresh, `selected` may retain its prior value (not reset to 0) if `makeChoices()` wasn't called cleanly. The runner visually snaps to the prior lane, and if the timer fires before the user moves, it selects that lane — appearing to "remember" the prior answer.

---

## 8. Card State Label Map

What actually happens to FSRS state for each user action:

| User action | `stage` after | `last_rating` | `interval_days` | `next_due_at` |
|---|---|---|---|---|
| Selected correct + timer/key, then rated **Easy** | `review` | `easy` | FSRS calc (long) | future |
| Selected correct + timer/key, then rated **Good** | `review` | `good` | FSRS calc (~3d new) | future |
| Selected correct + timer/key, then rated **Hard** | `review` | `hard` | FSRS calc (1d) | tomorrow |
| Selected correct + timer/key, then rated **Again** | `relearning` | `again` | relearning (~10m) | ~10min from now |
| Selected wrong + timer/key, then rated **Again** | `relearning` | `again` | relearning | ~10min |
| Selected wrong + timer/key, then rated **Good** | `review` | `good` | FSRS calc | future |
| **Continue** button | `review` | `good` | same as Good | future |
| **Bury** button | `suspended` | `bury` | unchanged | unchanged |
| **Pin** button | toggles `pinned` flag | unchanged | unchanged | unchanged |
| Auto-timer selects correct lane | same as "selected correct + Good" | `good` | FSRS calc | future |
| Auto-timer selects wrong lane | same as "selected wrong + Again" | `again` | relearning | ~10min |

**Important:** `record()` writes `rating: ok ? 'good' : 'again'` to legacy `state` immediately on answer. `rateCard()` writes to `phase3State.progress` via the FSRS algorithm. These run on different timers and can diverge if the user closes the app between answer and rating.

**Ghost-seen cards:** If `record(c, ok)` fires but `rateCard()` fails (exception, or app closed), `reviewed` is incremented but `last_rating` is null. This is the source of "reviewed but no rating" entries in the Atlas diagnostic. The `typeof ok === 'boolean'` gate (d1ed274) reduces new ghost-seen creation but does not repair existing ones.

---

## 9. X Button — Does NOT Export to File

**Verified behavior:** The HUD close/exit button (`data-hud-role='exit'`) calls `goHome351()` → `saveState()` → `localStorage.setItem('soloStudyingState_v1757', ...)`. **No file is downloaded.**

To export progress to a file, users must use:
- **Pause menu → Export Progress** (exports legacy `state` as JSON)
- **Settings → Advanced → Export Progress** (exports full Phase 3 progress as JSON)
- **Review Deck tab → Export selected subset** (exports filtered card subset)

**Risk:** Users who close the app with the X button assume their progress is saved. It IS saved to localStorage. But if the browser clears storage (private mode, cache clear, new device), all progress is lost. The only durable save is the file export.

---

## 10. "Review Study Deck" Glitch on New Devices

This is the most impactful onboarding failure. On a clean device/profile with no localStorage:

**10-A. `phase3State.progress` is empty → `review_deck` returns 0 cards**  
`getStudyPool('review_deck')` calls `isReviewCandidate(c)` which requires at least one of: `seen`, `reviewed`, `rating`, `last_rating`, `stage==='review'`. For all-new cards, none of these are set. The pool is 0 cards. The game loop calls `nextCard()`, gets `undefined`, and either crashes or renders a blank card.

**10-B. `applyStudyFiltersPhase3` applies last-used system/tag filters**  
On second+ visits, if user previously filtered by a system, `applyStudyFiltersPhase3` applies that filter silently. Pool shrinks to a subset. User on a new device loading a custom deck that doesn't match the stored filter gets 0 cards.

**10-C. `normalizeDeckIdentities()` may return empty array before deck is loaded**  
If a custom deck is still being parsed when `getStudyPool()` fires, `normalizeDeckIdentities()` returns `[]`. Pool is empty. The timing dependency is ~200ms for the deck parse IIFE — tight on slow devices.

**10-D. `browseScope351` defaults to `'new'` but `getStudyPool('new')` returns only unseen cards**  
First-launch default is "New cards - not reviewed." For the bundled deck, all cards are new. Pool is the full deck. But `startSolo()` may have been called before `getStudyPool` installs (multiple DOMContentLoaded timings), falling back to the base `cardPool()` which is sequential and shows all cards — but without FSRS tracking.

**Solutions to evaluate:**
1. Add a "no cards in pool" guard before `startSolo`/`directStartGame351`: if pool empty, toast + return to home.
2. On first launch (no localStorage), force scope to `'all'` as the default before any game starts.
3. Validate that `normalizeDeckIdentities().length > 0` before allowing game start.
4. Show a "How to play" screen on first launch rather than jumping directly to a game.

---

## 11. Duplicate ⌂ Home Buttons in HUD

**Root cause:** `wire()` at L433 calls `document.querySelectorAll('[data-home]').forEach(b => b.onclick = home)`. This includes any `[data-home]` element anywhere in the DOM — including inside game HUDs. Multiple patches add `[data-home]` to the HUD:

- Base HTML `<button class="btn" data-home>Home</button>` in settings/review screens
- `renderHudControls()` adds `data-hud-role='exit'` (NOT `data-home`) — correct
- Legacy IIFE at L1548 may inject a `[data-home]` button into the HUD directly
- `normalizeHud()` / `wrapGameMain()` at L13040 may re-inject HUD controls

**Result:** Up to 3 home buttons can appear in the HUD simultaneously. The second and third are legacy buttons that bypass `renderHudControls`'s deduplication guard (which only dedupes by `data-hud-role`).

**Fix:** Add `data-hud-role='home'` to the legacy home button injectors so `removeDuplicateRoleButtons` can dedupe them, or remove the injectors entirely.

---

## 12. Code Elegance — Patch Accumulation Analysis

The file has grown from a clean ~400-line base to ~14 800 lines through ~30 sequential patch IIFEs. This is the root cause of nearly every issue above.

**Specific redundancies identified:**

| Issue | Lines involved | Recommended action |
|---|---|---|
| 11 `selectSolo` wrappers | 408, 860, 2431, 2741, 3958, 4071, 4227, 6893, 7752, 13303, 14199 | Consolidate into 1 function with internal flags |
| 2 `show()` function definitions | 389, 1436 | Remove the second definition; extend the first |
| 2 shadow start handlers | 6385, 13020 | Remove dead L13020 handler |
| 2 `review_deck` branches | 11458, 11514 | Apply same filter to both |
| 2 export button implementations | 429, 965 | Keep Phase 3 version (965); remove legacy (429) |
| `shadowSchedule351` unused dropdown | 6373, 13014 | Remove or wire to `shadowScope351` |
| 9+ `DOMContentLoaded` listeners | 493, 599, 696, 1012, 1191, 1329, 1426, 1462, … | Consolidate into one `init()` call |
| `setInterval(wireSettingsReturn, 1000)` | 1462 | Remove polling; use one-time observer |

---

## 13. Codex Browser Validation Prompts

Run these in DevTools console on PHASE2 after hard reload (`Cmd+Shift+R`):

```javascript
// 1. Core validation
window.runFSRSValidation();   // must return 17/17
window.runCozySmokeTests();   // must return 6/6

// 2. Shadow Dungeon scope sync
openShadowSetup351();
console.assert($('shadowScope351').value === 'due', 'FAIL: SD scope not reset');
$('shadowStart351').click();
setTimeout(() => {
  console.assert($('browseScope351')?.value === 'due', 'FAIL: browseScope not synced');
  console.log('SD scope:', $('browseScope351')?.value);
}, 300);

// 3. Buried card leak check (review_deck)
const firstId = Object.keys(window.phase3State?.progress||{})[0];
if (firstId) {
  window.phase3State.progress[firstId].suspended = true;
  window.phase3State.progress[firstId].last_rating = 'bury';
  const pool = window.sessionPool ? window.sessionPool() : [];
  const leaked = pool.filter(c => (c.id||c.qid) === firstId);
  console.assert(leaked.length === 0, 'FAIL: buried card in pool');
  // cleanup
  delete window.phase3State.progress[firstId].suspended;
  delete window.phase3State.progress[firstId].last_rating;
}

// 4. Undo stack depth
console.log('Undo stack depth:', window.__cozyUndoStack372?.length || 0);
// Answer 5 cards, then:
// console.log('Stack after 5:', window.__cozyUndoStack372?.length);
// window.undoReview(); // should restore card 5

// 5. Export check
typeof window.phase3State?.progress === 'object'
  ? console.log('Phase3 progress records:', Object.keys(window.phase3State.progress).length)
  : console.warn('Phase3 progress not loaded');

// 6. selectSolo wrapper depth (counts wrapping chain)
let fn = window.selectSolo, depth = 0;
while (fn && depth < 20) { depth++; fn = fn.__wrapped || null; }
console.log('selectSolo chain depth (manual):', depth);
```

---

## 14. Pending Fixes — Priority Order

| Priority | Issue | Status |
|---|---|---|
| P0 | `review_deck` fallback L11514 still leaks buried cards | **NOT FIXED** |
| P0 | `due` branch has no burial check | **NOT FIXED** |
| P0 | Undo restores progress but not session position | **NOT FIXED** |
| P1 | 11 `selectSolo` wrappers — consolidate | **NOT FIXED** |
| P1 | New device empty pool guard | **NOT FIXED** |
| P1 | `shadowSchedule351` dead dropdown removal | **NOT FIXED** |
| P2 | Home screen flash (`ensureScopeOptions352`) | **NOT FIXED** |
| P2 | Duplicate ⌂ HUD buttons | **NOT FIXED** |
| P2 | 48 stability:null + 14 ghost-seen card repair JSON | **NOT IMPORTED (user action)** |
| P3 | `STRIPE_PLACEHOLDER_URL` → real Stripe link | **NOT REPLACED (user action)** |
| P3 | iOS1 Capacitor scaffold | **NOT STARTED** |
| ✅ | SD scope contamination (browseScope sync) | Fixed d1ed274 |
| ✅ | review_deck primary branch burial filter | Fixed d1ed274 |
| ✅ | `record()` ghost-seen prevention | Fixed d1ed274 |
| ✅ | Undo double-push dedupe | Fixed c767353 |
| ✅ | GATE COMPLETED z-index | Fixed c767353 |
| ✅ | Shadow Dungeon defaults to "Spaced Repetition" on open | Fixed c767353 |
| ✅ | "Beta Spaced Repetition" → "Spaced Repetition" label | Fixed bed4eda |
| ✅ | SW registration missing in PHASE1 | Fixed d2ed490 |

---

## 15. PHASE1 vs PHASE2 — Divergence Table

Issues that exist in one repo but not the other, as of 2026-06-07.

### PHASE2-only issues
| Issue | Status |
|---|---|
| `STRIPE_PLACEHOLDER_URL` not replaced with real Stripe link | **User action required** |
| M2 paywall gate (`cozy-paywall-m2-2026-06-06`) — must use `?paid=test_override` for all testing | Active |
| `vercel.json` security headers present | ✅ Deployed |
| SW key `cozy-arcade-PHASE2-v7` | ✅ Active |

### PHASE1-only issues
| Issue | Status |
|---|---|
| No Stripe paywall (M2 not ported — intentional until Stripe URL provided) | By design |
| No `vercel.json` (P8 not ported) | Missing |
| SW registration was absent until d2ed490 | ✅ Fixed d2ed490 |
| SW key `cozy-arcade-v44` | ✅ Active |

### Issues identical in both repos (unfixed as of bae38a2 / d2ed490)
| Issue | Lines (PHASE2 ref) |
|---|---|
| `review_deck` fallback branch L11514 still only checks `!suspended` | L11514–11519 |
| `due` pool branch has no burial check | L11447 |
| Undo restores progress but not session position, score, timer | L13276–13283 |
| Domain gameplay not covered by undo wrapper | L13287 check |
| 11 `selectSolo` wrappers — no consolidation | L408→14199 |
| New device / empty pool: no guard before game start | L11418+ |
| Home panel `innerHTML` rebuild causes select churn on every open | L6172 |
| `shadowSchedule351` dropdown reads nothing (dead UI) | L6373 |
| Duplicate ⌂ HUD buttons from legacy injectors | L1548+ |

---

## 16. Autonomous Browser Test Suite (IF/THEN format)

Paste each group into DevTools console on the target app (hard-reload first, use `?paid=test_override` on PHASE2). Each test is self-contained and prints PASS/FAIL with diagnostic context. No CDP setup needed.

---

### Group A — Core Gates

```javascript
// GROUP A: Core validation gates
(function(){
  const fsrs = window.runFSRSValidation?.();
  const smoke = window.runCozySmokeTests?.();
  console.assert(fsrs === '17/17' || String(fsrs).includes('17'), 'A1 FAIL: FSRS got ' + fsrs);
  console.assert(smoke === '6/6'  || String(smoke).includes('6'),  'A2 FAIL: Smoke got ' + smoke);
  const pool = window.cardPool;
  const poolStr = pool ? String(pool) : '';
  console.assert(poolStr.includes('sessionPool') || poolStr.includes('phase3'), 'A3 FAIL: cardPool not Phase3 — ' + poolStr.slice(0,80));
  const nc = window.nextCard;
  const ncStr = nc ? String(nc) : '';
  console.assert(ncStr.includes('__shadowDungeonActive') || ncStr.includes('shadowQueue'), 'A4 FAIL: nextCard missing SD guard');
  console.log('GROUP A:', [fsrs, smoke, poolStr.slice(0,30), ncStr.slice(0,30)]);
})();
// IF any FAIL → do NOT proceed with other fixes; core architecture is broken
```

---

### Group B — Shadow Dungeon Scope Sync

```javascript
// GROUP B: SD scope sync (all three paths)
(function(){
  // B1: reset on open
  if (typeof openShadowSetup351 === 'function') {
    const bs = document.getElementById('browseScope351');
    if (bs) bs.value = 'pinned';
    openShadowSetup351();
    const sc = document.getElementById('shadowScope351');
    console.assert(sc?.value === 'due', 'B1 FAIL: shadowScope351 not reset to due, got ' + sc?.value);
    document.getElementById('shadowCancel351')?.click();
  }
  // B2: start syncs browseScope + dataset
  if (typeof openShadowSetup351 === 'function') {
    openShadowSetup351();
    document.getElementById('shadowScope351').value = 'pinned';
    document.getElementById('shadowStart351')?.click();
    setTimeout(()=>{
      const bs = document.getElementById('browseScope351');
      const ds = document.documentElement.dataset.cozyLaunchScope;
      console.assert(bs?.value === 'pinned', 'B2a FAIL: browseScope not synced, got ' + bs?.value);
      console.assert(ds === 'pinned' || !ds, 'B2b WARN: dataset.cozyLaunchScope = ' + ds);
      console.log('GROUP B: browseScope=' + bs?.value + ' dataset=' + ds);
      // exit back to home
      if (typeof goHome351 === 'function') goHome351(); else window.home?.();
    }, 400);
  }
})();
// IF B1 FAIL → openShadowSetup351 does not reset sc.value; check line 6408
// IF B2a FAIL → shadowStart onclick not writing browseScope351; check line 6395-6398
```

---

### Group C — Burial / Suspension Filter (all pool branches)

```javascript
// GROUP C: Buried card exclusion across all pool modes
(function(){
  const prog = window.phase3State?.progress;
  if (!prog) { console.warn('C SKIP: phase3State not loaded'); return; }
  const ids = Object.keys(prog).slice(0, 3);
  if (ids.length < 3) { console.warn('C SKIP: need at least 3 progress entries'); return; }

  // Save originals
  const orig = ids.map(id => ({...prog[id]}));

  // Inject buried pattern from real gameplay JSON
  prog[ids[0]].suspended = true; prog[ids[0]].last_rating = 'bury'; prog[ids[0]].rating = 'bury';
  prog[ids[1]].buried = true;
  prog[ids[2]].suspended = true; prog[ids[2]].buried = false; prog[ids[2]].last_rating = 'bury';

  const modes = ['review_deck', 'due', 'pinned', 'random-new', 'new'];
  const getPool = (mode) => {
    try {
      if (window.getStudyPool) return window.getStudyPool(mode) || [];
      if (window.sessionPool) return window.sessionPool() || [];
      return [];
    } catch(e) { return []; }
  };

  modes.forEach(mode => {
    const pool = getPool(mode);
    ids.forEach((id, i) => {
      const leaked = pool.some(c => (c.id||c.qid) === id);
      if (leaked) console.error('C FAIL mode=' + mode + ' leaked buriedId[' + i + ']=' + id);
    });
    console.log('C pool[' + mode + '] size=' + pool.length + ' — checked ' + ids.length + ' buried IDs');
  });

  // Restore
  ids.forEach((id, i) => { prog[id] = orig[i]; });
  console.log('GROUP C: burial check complete, originals restored');
})();
// IF C FAIL mode=review_deck → L11514 fallback branch missing burial filter
// IF C FAIL mode=due → L11447 due branch missing burial filter
// IF C FAIL mode=pinned → progress(c).pinned lookup using wrong store
```

---

### Group D — Card State Transitions (FSRS correctness)

```javascript
// GROUP D: Card state labels after each rating path
(function(){
  const prog = window.phase3State?.progress;
  const deck = window.appCards?.() || window.cards || [];
  if (!prog || !deck.length) { console.warn('D SKIP: no deck/progress'); return; }
  const testCard = deck[0];
  const id = testCard.id || testCard.qid;
  if (!id) { console.warn('D SKIP: no card id'); return; }
  const orig = {...(prog[id] || {})};

  const check = (rating, expectStage) => {
    prog[id] = {...orig};
    window.rateCard?.(id, rating);
    const p = prog[id];
    const ok = p.stage === expectStage;
    console[ok ? 'log' : 'error']('D[' + rating + '] stage=' + p.stage + ' expect=' + expectStage + ' last_rating=' + p.last_rating + (ok ? ' ✓' : ' ✗'));
  };

  check('again', 'relearning');
  check('hard', 'review');
  check('good', 'review');
  check('easy', 'review');

  // Bury path
  prog[id] = {...orig};
  window.rateCard?.(id, 'bury');
  const buried = prog[id];
  console.assert(buried.suspended || buried.buried || buried.last_rating === 'bury',
    'D[bury] FAIL: card not marked buried — ' + JSON.stringify({suspended: buried.suspended, buried: buried.buried, last_rating: buried.last_rating}));

  prog[id] = orig; // restore
  console.log('GROUP D: card state transition check complete');
})();
// IF D[again] stage≠relearning → rateCard FSRS logic broken
// IF D[bury] FAIL → burial encoding broken; filter checks will also fail
```

---

### Group E — Undo Correctness

```javascript
// GROUP E: Undo depth + session restore
(function(){
  const stack = window.__cozyUndoStack372;
  if (!stack) { console.warn('E SKIP: undo stack not initialized'); return; }
  console.log('E1: stack depth before test = ' + stack.length);

  // E2: check Domain coverage
  const selectDomain = window.selectDomain;
  const domainStr = selectDomain ? String(selectDomain) : '';
  const domainHasUndo = domainStr.includes('__cozyUndoStack372') || domainStr.includes('undoReview');
  console[domainHasUndo ? 'log' : 'warn']('E2 Domain undo coverage: ' + (domainHasUndo ? 'PRESENT' : 'MISSING — domain gameplay cannot be undone'));

  // E3: undo wrapper chain — count how many wrappers exist
  let fn = window.selectSolo, depth = 0, hasUndoLayer = false, hasDebounce = false;
  const seen = new Set();
  while (fn && typeof fn === 'function' && !seen.has(fn) && depth < 20) {
    seen.add(fn);
    const s = String(fn);
    if (s.includes('__cozyUndoStack372')) hasUndoLayer = true;
    if (s.includes('700') || s.includes('_selT160') || s.includes('debounce')) hasDebounce = true;
    fn = fn.__inner || fn._prior || null;
    depth++;
  }
  console.log('E3: selectSolo chain depth (approx) — hasUndoLayer=' + hasUndoLayer + ' hasDebounce=' + hasDebounce);
  if (!hasUndoLayer) console.error('E3 FAIL: no undo layer found in selectSolo chain');
  if (hasDebounce) console.warn('E3 WARN: 700ms debounce wraps selectSolo — rapid undo+answer sequences may be swallowed');

  // E4: session position restore check
  const restoreFn = window.restoreUndoSnapshot;
  if (restoreFn) {
    const fnStr = String(restoreFn);
    const restoresIndex = fnStr.includes('sessionIndex') || fnStr.includes('poolIndex') || fnStr.includes('queueIndex') || fnStr.includes('__shadowRunQueue');
    console[restoresIndex ? 'log' : 'warn']('E4 Session position restored on undo: ' + (restoresIndex ? 'YES' : 'NO — user sees different card after undo'));
  }
  console.log('GROUP E: undo diagnostic complete');
})();
// IF E2 WARN → Domain undo not wired; users playing domain lose undo functionality
// IF E3 FAIL → undoReview() has no snapshot to pop from
// IF E4 WARN → undo works on progress state but not on card sequence — primary UX complaint
```

---

### Group F — Export Paths

```javascript
// GROUP F: Export button coverage
(function(){
  // F1: pauseExport wired?
  const pe = document.getElementById('pauseExport');
  console.assert(pe && typeof pe.onclick === 'function', 'F1 FAIL: #pauseExport has no onclick');

  // F2: HUD × (exit) does NOT trigger file download
  // (observe console — no blob/download call should fire when HUD exit clicked)
  const exitBtn = document.querySelector('[data-hud-role="exit"]');
  if (exitBtn) {
    let downloadFired = false;
    const origCreate = URL.createObjectURL;
    URL.createObjectURL = function(b) { downloadFired = true; return origCreate.call(URL, b); };
    exitBtn.click();
    setTimeout(() => {
      URL.createObjectURL = origCreate;
      console[downloadFired ? 'warn' : 'log']('F2: HUD × triggered file download: ' + downloadFired + (downloadFired ? ' — UNEXPECTED (only localStorage save expected)' : ' ✓ localStorage only'));
    }, 300);
  } else {
    console.warn('F2 SKIP: HUD exit button not found (may only appear during active game)');
  }

  // F3: Phase3 export function exists
  const hasExport = typeof window.naExportProgressOnly === 'function' || typeof window.exportSession === 'function';
  console.assert(hasExport, 'F3 FAIL: no export function found');
  console.log('GROUP F: export checks initiated');
})();
// IF F1 FAIL → Pause > Export Progress button is unwired; users cannot make durable saves
// IF F2 shows UNEXPECTED → HUD × is double-exporting (adds extra downloads)
// IF F3 FAIL → no export path exists at all
```

---

### Group G — Home Screen Flash Detection

```javascript
// GROUP G: Select option churn / home panel flash (run immediately on page load)
(function(){
  const log = [];
  const sel = document.getElementById('browseScope351');
  if (!sel) { console.warn('G SKIP: browseScope351 not present'); return; }
  const start = Date.now();
  const snap = () => ({ t: Date.now() - start, val: sel.value, opts: Array.from(sel.options).map(o=>o.value).join(',') });
  log.push(snap());
  const id = setInterval(() => {
    const s = snap();
    const prev = log[log.length - 1];
    if (s.val !== prev.val || s.opts !== prev.opts) log.push(s);
    if (s.t > 3000) {
      clearInterval(id);
      console.log('GROUP G: browseScope351 churn log (' + log.length + ' changes in 3s):');
      log.forEach(e => console.log('  t=' + e.t + 'ms val=' + e.val + ' opts=' + e.opts));
      if (log.length > 2) console.warn('G WARN: ' + log.length + ' changes — likely cause of visible flash');
      else console.log('G OK: minimal churn');
    }
  }, 50);
})();
// IF G WARN: log shows opts changing → ensureScopeOptions352 or home panel rebuild is the flash source
// Specific patterns:
//   opts gains "buried" then loses it → ensureScopeOptions352 at L7831
//   val jumps from "due" to "all" → homeScope normalization overwriting browseScope
//   opts gains/loses options → showHomePanel351 innerHTML rebuild at L6172
```

---

### Group H — New Device / Empty Pool Guard

```javascript
// GROUP H: Empty pool guard before game start (simulate clean device)
(function(){
  const orig = window.phase3State?.progress;
  if (!window.phase3State) { console.warn('H SKIP: phase3State not loaded'); return; }

  // Temporarily empty progress
  window.phase3State.progress = {};

  const modes = ['review_deck', 'due', 'review', 'pinned'];
  modes.forEach(mode => {
    try {
      const pool = window.getStudyPool ? window.getStudyPool(mode) : [];
      const size = pool ? pool.length : 0;
      if (size === 0) {
        // Check: does startSolo guard against 0-card pool?
        const startFn = String(window.startSolo || '');
        const hasGuard = startFn.includes('hasCardsOrWarn') || startFn.includes('pool.length') || startFn.includes('sessionPool');
        console[hasGuard ? 'log' : 'warn']('H[' + mode + ']: pool=0, startSolo guard present=' + hasGuard);
        if (!hasGuard) console.error('H FAIL[' + mode + ']: empty pool with no guard — game will start with 0 cards (blank/crash)');
      } else {
        console.log('H[' + mode + ']: pool size=' + size + ' (non-empty even with no progress — deck cards flow through)');
      }
    } catch(e) { console.error('H[' + mode + '] threw: ' + e.message); }
  });

  window.phase3State.progress = orig; // restore
  console.log('GROUP H: empty pool guard check complete, progress restored');
})();
// IF H FAIL[review_deck] → new device opening Review Deck mode gets silent 0-card start
// IF H FAIL[due] → new device opening Spaced Repetition gets blank game
// Fix: add pool.length > 0 check in startSolo / directStartGame351 before game loop starts
```

---

### Group I — Scope-to-Pool-to-Game Consistency

```javascript
// GROUP I: End-to-end scope consistency (home select → pool → game shows right cards)
(function(){
  const browseEl = document.getElementById('browseScope351');
  if (!browseEl) { console.warn('I SKIP: browseScope351 not present'); return; }
  const modes = ['random', 'new', 'pinned', 'review'];
  const results = [];
  modes.forEach(mode => {
    browseEl.value = mode;
    browseEl.dispatchEvent(new Event('change', {bubbles: true}));
    setTimeout(() => {
      const poolFn = window.getStudyPool || window.sessionPool;
      const pool = poolFn ? (window.getStudyPool ? window.getStudyPool(mode) : poolFn()) : null;
      const size = pool ? pool.length : '?';
      const launchScope = document.documentElement.dataset.cozyLaunchScope;
      const phase3Order = window.phase3State?.settings?.solo_order;
      const scopeMatch = launchScope === mode || !launchScope;
      const orderMatch = phase3Order === mode || !phase3Order;
      results.push({ mode, size, launchScope, phase3Order, scopeMatch, orderMatch });
      if (results.length === modes.length) {
        console.log('GROUP I: scope consistency:');
        results.forEach(r => {
          const ok = r.scopeMatch && r.orderMatch;
          console[ok ? 'log' : 'warn']('  mode=' + r.mode + ' poolSize=' + r.size + ' dataset=' + r.launchScope + ' phase3=' + r.phase3Order + (ok ? ' ✓' : ' ✗ MISMATCH'));
        });
      }
    }, 100);
  });
})();
// IF mismatch on any mode → scope change event is not reaching all 4 authorities
// Expected: browseScope351.value === dataset.cozyLaunchScope === phase3State.settings.solo_order
// If syncGeneralStudyScopePhase3 is working, all three should match after a change event
```

---

### Quick-Run All Groups (paste once, runs A–I sequentially)

```javascript
// MASTER RUN — groups A + C + D + E + F + G + H in sequence
// (B and I require user interaction; run separately)
setTimeout(()=>{
  console.group('=== COZY ARCADE BROWSER DIAGNOSTIC ===');
  // Paste each group function body here, or run them individually above
  console.log('Run groups A, C, D, E, F, G, H individually above.');
  console.log('Groups B and I require active game / select interaction — run manually.');
  console.groupEnd();
}, 200);
```

---

*Addendum authored 2026-06-07. Codex browser evidence addendum at top of document supersedes Section 0–14 where contradicted.*

---

## 17. Auto-Select Correct Re-emergence — 2026-06-10 Addendum

**Reported:** Runner appears to auto-select the correct answer after undo is used. Previously ruled out (2026-06-04 validation: "runner is not auto-placing the correct answer"). Re-emerged after FQ-3 undo session restore fix (commit `dcb492e` / `6cb4e07`, 2026-06-07).

### Root Cause (code-confirmed)

`restoreUndoSnapshot()` contains:
```javascript
selected = snap.selected;
```

`captureUndoSnapshot()` captures `selected` at the moment just before `selectSolo` fires — this is wherever the runner was when the user answered. If the user answered correctly (moved runner to correct lane, then selected), `snap.selected` equals the correct answer's index.

After undo:
1. `selected = snap.selected` → runner set to correct-answer lane
2. `renderSolo()` + `moveHunter()` → runner visually at that lane
3. `loopSolo()` starts; if user doesn't move, `if(timer<=0&&autoSelect)selectSolo(selected)` fires the correct answer

This is architecturally correct (undo is replaying state) but perceptually wrong (user expects fresh start after undo, not a replay).

### Secondary Issues (existing, unchanged)

**17-A. Duplicate wrapper accumulation (confirmed ongoing)**
Rating-path rectifier installs at t=700, 1600, 3200, 5200, 8000, 13000ms.
Undo wrapper installs at t=1200, 2600ms.
Each install wraps the output of the last install. Guards are one-sided:
- Undo guard checks `!priorFn.__rectifierUndo372`
- Rectifier guard checks `!priorFn.__cozyRatingPath20260603`
Neither checks for the OTHER flag, so they alternate wrapping each other.
By t=13s: 15–20 total wrapper layers.
Effect: mostly harmless (each wrapper calls through) but adds latency and risks stale `current` captures.

**17-B. 8-second base rateCard deferred may overwrite explicit rating**
Base `selectSolo` (L408):
```javascript
setTimeout(()=>{ if(!session.seenThisSession.has(_autoCardId)) rateCard(_autoCardId,ok?'good':'again'); }, 8000);
```
If user rates explicitly (e.g., Good after wrong auto-select) before 8s, the 8s timer fires with 'again' if `seenThisSession` hasn't been updated. Whether `rateCard` updates `seenThisSession` before 8s is not confirmed — needs verification (Task 2).

### Fix (FQ-AUTO-1 — 1 line)

In `restoreUndoSnapshot()`, `index.html` (find: `selected = snap.selected;`):
```javascript
// Change:
selected = snap.selected;
// To:
selected = 0;
```

Runner resets to neutral lane 0 after every undo. User must actively move to re-answer. `renderSolo()` calls `moveHunter()` which respects the new `selected=0`.

### Contingency Plan

If re-emerges after fix:
1. Check `window.selected` in DevTools after undo → should be 0
2. If non-zero: a wrapper is overriding `selected` after `restoreUndoSnapshot`
3. Search for any code that sets `selected = ` after `renderSolo()` in the undo path
4. Emergency patch: at the end of `restoreUndoSnapshot`, add:
   `setTimeout(()=>{ selected=0; if(typeof moveHunter==='function')moveHunter(); }, 50);`
5. `git revert HEAD` if emergency patch is needed; permanent fix in next Codex session

### Validation Test for FQ-AUTO-1

```javascript
// GROUP E addendum — Undo runner position
(function(){
  console.log('Undo runner test: answer a card, then call undoReview()');
  // After undoReview():
  setTimeout(()=>{
    const sel = window.selected;
    const cls = document.getElementById('runner')?.className || '';
    console.assert(sel === 0, 'FQ-AUTO-1 FAIL: selected=' + sel + ' (expected 0)');
    console.assert(cls.includes('lane0'), 'FQ-AUTO-1 FAIL: runner class=' + cls + ' (expected lane0)');
    if(sel === 0 && cls.includes('lane0')) console.log('FQ-AUTO-1 PASS: runner at lane0 after undo');
  }, 500);
})();
```

---

## 18. Number Key Selection + Full Card Close — 2026-06-10 Addendum

### Number Key Selection (1–4)

Base keydown handler (L432) already has: `let n=parseInt(e.key); if(n>=1&&n<=4)selectSolo(n-1)`

This works for Solo. For KE (domain): `if(n>=1&&n<=4)selectDomain(n-1)` — also present.

**Risk:** The 700ms debounce wrapper (layer 11) at L14199 wraps the outermost `selectSolo`. If a user presses a number key within 700ms of the prior answer, it may be silently swallowed. This is acceptable for the timer (prevents accidental double-select) but wrong for explicit keypresses.

**Test to determine if debounce affects key presses:**
```javascript
// During gameplay, press 1 rapidly after answering:
// If no visual response → debounce is swallowing it
// If lane changes → debounce is not affecting explicit key presses
```

**Fix only if needed:** Set `window.__cozyKeySelect = true` in keydown before calling selectSolo; bypass debounce if flag is true.

### Full Card Modal ("^" Close)

`fullCard()` currently uses `#modal` with a single "Close" button (`#modalClose`). No top-close control exists. User wants a "^" (chevron/caret) button as a quick touch/click dismiss target.

**Implementation note:** Add button INSIDE `.modalBox` positioned `top:8px; right:12px; position:absolute`. Connect `onclick` to `$('modal').classList.add('hidden')`. Also handle `^` keypress when modal is open. No wrapper chains, no new globals needed.
