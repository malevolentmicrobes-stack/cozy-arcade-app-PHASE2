# Senior Dev Audit — Cozy Arcade PHASE2 / PHASE1
**Date:** 2026-06-07  
**Repos:** cozy-arcade-app-PHASE2 @ d1ed274 · cozy-arcade-app @ d2ed490  
**Purpose:** Pre-production glitch triage for team review. Root causes + all secondary modifiers listed per issue.

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

*Audit by Claude Sonnet 4.6 acting as senior dev / tech lead. All line numbers reference PHASE2 d1ed274. PHASE1 is structurally identical except lacks the Stripe paywall block.*
