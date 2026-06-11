# Cozy Arcade Board Prep — Project Status 2026-06-10

**Repos:** PHASE2 `cozy-arcade-app-PHASE2` (active dev) · PHASE1 `cozy-arcade-app` (production mirror)
**Author:** Claude Code session 2026-06-10
**Supersedes:** COZY_ARCADE_PROJECT_STATUS_2026-05-26.md

---

## 1. Repo & SW Versions (verified 2026-06-10)

| Repo | Path | SW Cache | Last Commit |
|------|------|----------|-------------|
| PHASE2 | `~/Documents/GitHub/cozy-arcade-app-PHASE2` | `cozy-arcade-PHASE2-v10` | 209adab "Update Shadow Dungeon home card" |
| PHASE1 | `~/Documents/GitHub/cozy-arcade-app` | `cozy-arcade-v47` | 86fca1e "Update Shadow Dungeon home card" |

**NEVER cross-push.** Each repo has its own remote.
**Always use `?paid=test_override`** when testing PHASE2 locally.

---

## 2. Theme: User Extension Features

Current development phase centers on **giving each user control over their study experience**. This includes:

| Feature | Status | Notes |
|---------|--------|-------|
| User `one_thing` inline notes (A11) | ✅ Done | Editable in Atlas; round-trips through export |
| Pin/bury from Atlas card detail (A10) | ✅ Done | `naInjectPinBuryButtons` writes phase3State + legacy mirror |
| Number key shortcuts 1–4 (game selection) | ✅ Exists in base code | May be swallowed by debounce — verify |
| Space/Enter = advance on reveal | ✅ Exists | Works via base keydown handler |
| "^" button to close Full Card modal | ❌ Not implemented | Codex Task 3 |
| Pin/suspend controls in Review Deck list | ❌ Not implemented | FQ-NEW-4 (future) |
| Export personal edits (one_thing) separately | ❌ Not implemented | Future — pre-mortem below |
| Anki deck export | ❌ Not planned | Future — pre-mortem below |
| Stripe paywall (M2) | ⚠️ Code done | `STRIPE_PLACEHOLDER_URL` still needs real URL (user action) |

---

## 3. Fix Status Since 2026-06-07 Audit

All fixes verified by git log as of 2026-06-10:

| FQ | Issue | Status |
|----|-------|--------|
| FQ-1 | `review_deck` fallback L11514 burial filter | ✅ `7f4e6e0` / `f8bde3d` |
| FQ-2 | `due` branch burial filter | ✅ `7f4e6e0` / `f8bde3d` |
| FQ-3 | Undo restores FSRS state but not session queue/score/HP/timer | ✅ `dcb492e` / `6cb4e07` |
| FQ-4 | Empty pool guard before game start | ✅ `7f4e6e0` / `f8bde3d` |
| FQ-8 | Domain gameplay not covered by undo wrapper | ✅ `dcb492e` / `6cb4e07` |
| FQ-5 | `shadowSchedule351` dead dropdown removal | ❌ Still pending |
| FQ-6 | Home panel `innerHTML` flash (browseScope churn) | ❌ Still pending |
| FQ-7 | Duplicate ⌂ HUD buttons | ❌ Still pending |
| FQ-9 | Port `vercel.json` to PHASE1 | ❌ Still pending |
| FQ-10 | Replace `STRIPE_PLACEHOLDER_URL` | ⚠️ User action required |
| FQ-11 | Import stability/ghost-seen repair JSON | ⚠️ User action required |

**New glitches identified 2026-06-10:** See Section 4.

**2026-06-10 Codex update:** Applied FQ-AUTO-1/FQ-AUTO-2 to PHASE2 and PHASE1: undo restores runner lane 0, explicit rating cancels deferred auto-rate, and service worker caches bumped to PHASE2 v14 / PHASE1 v51.

---

## 4. Active Glitch: Auto-Select Correct Re-emergence

### Description
After the FQ-3 undo fix (`dcb492e`), the runner visually positions at the correct answer lane after undo, and the timer fires selecting it — appearing as "auto-select correct."

### Root Cause (confirmed by code audit)

`restoreUndoSnapshot()` (PHASE2 `index.html` ~L13314) contains:
```javascript
selected = snap.selected;
```

`snap.selected` is captured **before** `selectSolo` fires in `captureUndoSnapshot`. This records the lane the runner was at when the user answered. If the user answered correctly (moved runner to correct lane then selected), `snap.selected` equals the correct answer's index.

After undo restore:
1. `selected = snap.selected` → runner positioned at correct-answer lane
2. `renderSolo()` re-renders card with runner at that position
3. `loopSolo()` starts timer; if user doesn't move, timer fires `selectSolo(selected)` → correct answer selected again

This looks indistinguishable from "auto-selecting the correct answer."

### Secondary Causes (pre-existing, unchanged)

- Rating-path rectifier reinstalls at t=700, 1600, 3200, 5200, 8000, 13000ms. Undo wrapper reinstalls at t=1200, 2600ms. These interleave, each wrapping the other's output because flags (`__rectifierUndo372` vs `__cozyRatingPath20260603`) are one-sided. Creates 15–20 wrapper layers by 13s.
- Base `selectSolo` (L408) has a 8000ms deferred `rateCard(ok?'good':'again')`. If user rates explicitly (Good after wrong) before 8s, the deferred may overwrite with `'again'`. The `seenThisSession` guard should prevent this — **needs verification (Task 2)**.
- 700ms debounce wrapper (layer 11): rapid keypresses within 700ms of prior answer are silently dropped. User presses 1/2/3/4 and sees no response → confirmed swallowed.

### Fix (Task 1 — elegant, 1 line)

In `restoreUndoSnapshot()`, change:
```javascript
selected = snap.selected;
```
to:
```javascript
selected = 0;
```

Runner resets to neutral (lane 0) after every undo. `renderSolo()` calls `moveHunter()` which positions runner at lane 0. User sees fresh card with runner at far left, must actively move to answer.

### Contingency Plan — If Glitch Re-Emerges After Fix

1. Open DevTools console during gameplay.
2. Run: `console.log('selected after next card:', window.selected)` after each `nextCard()`.
3. If `selected` is non-zero when a new card loads: a wrapper is setting `selected` before render.
4. Trace: `window.selectSolo.toString()` — look for the layer that sets `selected` to a non-zero value.
5. Emergency patch: add `setTimeout(()=>{ selected=0; if(typeof moveHunter==='function')moveHunter(); },50)` inside `loopSolo` before the `setInterval` starts.
6. `git revert HEAD` if emergency patch is needed; fix properly in next Codex session.

### Diagnostic Test (DevTools console)

```javascript
// After undo, run:
console.log('runner lane:', document.getElementById('runner').className);
// Expected: 'hunter lane0' (not lane1/2/3)
console.log('selected:', window.selected);
// Expected: 0
```

---

## 5. How to Test From Each Surface

### Main Page (Home Screen)

```javascript
// 1. Load: http://localhost:PORT/index.html?paid=test_override (PHASE2)
// 2. Verify FSRS + smoke gates
window.runFSRSValidation();   // must be 17/17
window.runCozySmokeTests();   // must be 6/6
// 3. Group G: flash detection (run on load)
// [paste Group G code from SENIOR_DEV_AUDIT Section 16]
// 4. Check home KPI row renders (Cards, Reviewed, Due, New, Pinned show > 0)
// 5. Start Solo → game screen shows; runner at lane0
```

### Settings Page

```javascript
// Open settings → verify:
// a. Timer auto-select checkbox reads from localStorage correctly
// b. Apply → settings saved (localStorage.getItem('cozyQuestionSeconds351') matches input)
// c. Return from settings → lands back on prior screen (solo/domain/home)
// d. After Apply, start Solo → card state unchanged (last_rating intact)
document.getElementById('soloTimerInput').value = '5';
document.getElementById('applyBtn').click();
console.assert(localStorage.getItem('cozyQuestionSeconds351') === '5', 'FAIL: timer not saved');
```

### Solo Studying (Game 1)

```javascript
// 1. Number key selection
// Press 1 → choice A selects (runner moves to lane 0)
// Press 2 → choice B selects (runner moves to lane 1)
// Press 3 → choice C selects
// Press 4 → choice D selects
// If no visual change: debounce wrapper is swallowing — see Task 3

// 2. Timer behavior
// Wait for timer to expire → runner at lane0 auto-selects choice A
// Verify: NOT the correct answer preferentially

// 3. Full Card modal
// After answer: click "Full Card" → modal opens
// Click "^" close button → modal closes (Task 3)
// Press Escape → modal closes (verify)

// 4. Undo
// Answer a card → undo → runner at lane0 (NOT the lane you answered at)
// Runner must NOT be at the correct answer lane after undo
```

### Knowledge Expansion (Game 2)

```javascript
// 1. Number key selection
// Press 1 → first orb (by position) selects
// Press 2/3/4 → orbs 2/3/4 select
// Verify: not swallowed by debounce

// 2. Undo works (FQ-8 fixed) → test by answering then undoing
```

### Shadow Dungeon (from Home Screen)

```javascript
// 1. Open Shadow Dungeon setup
openShadowSetup351();
console.assert(document.getElementById('shadowScope351').value === 'due', 'FAIL: SD scope');
// 2. Select scope, start → game loads with correct scope
// 3. Undo works inside SD Solo and SD Domain
```

---

## 6. How to Verify No Auto-Select / Card State Interference

### After ANY code change, run this sequence:

```javascript
// Gate 1: FSRS + smoke
window.runFSRSValidation();   // 17/17
window.runCozySmokeTests();   // 6/6

// Gate 2: Card state after correct answer
// Answer a card correctly → wait 1s → check:
const ids = Object.keys(window.phase3State?.progress || {});
const lastId = ids[ids.length - 1];
const p = window.phase3State?.progress?.[lastId];
console.log('last_rating:', p?.last_rating, 'stage:', p?.stage);
// Expected: last_rating='good', stage='review'

// Gate 3: Card state after wrong + explicit Good
// 1. Let timer auto-select wrong answer
// 2. Click Good on reveal
// 3. Wait 9s (past the 8s base deferred)
// 4. Then check:
console.log('last_rating after explicit Good:', window.phase3State?.progress?.[lastId]?.last_rating);
// Expected: 'good' — NOT 'again'

// Gate 4: Undo does not expose correct answer
// Answer correctly → undo → check:
console.log('selected after undo:', window.selected);
// Expected: 0
console.log('runner class:', document.getElementById('runner').className);
// Expected: includes 'lane0'

// Gate 5: Burial check (Group C from audit)
// [paste Group C code from SENIOR_DEV_AUDIT Section 16]
```

---

## 7. Codex Task Contracts

### Task 1 — FQ-AUTO-1: Fix undo runner reset (PRIORITY: P0)

```
File: index.html in BOTH repos
PHASE2: /Users/rebekahbetar/Documents/GitHub/cozy-arcade-app-PHASE2/index.html
PHASE1: /Users/rebekahbetar/Documents/GitHub/cozy-arcade-app/index.html

── FIX: Undo restores `selected` to pre-answer runner position ──
In restoreUndoSnapshot() — find the line:
  selected = snap.selected;
Change to:
  selected = 0;

No other changes. Do not touch captureUndoSnapshot, pushUndoSnapshot,
renderSolo, loopSolo, or any other function.
renderSolo() already calls moveHunter() which positions runner at lane0.

── Validation ──
window.runFSRSValidation()   // 17/17
window.runCozySmokeTests()   // 6/6
// Manual: answer card correctly → undoReview() → confirm runner at lane0
// Manual: confirm choices and question are the pre-answer state
// DevTools: console.log(window.selected) after undo → must be 0

Bump PHASE2 sw.js CACHE version by 1. Bump PHASE1 sw.js CACHE version by 1.
Commit each repo to its own remote only. Do NOT cross-push.
```

---

### Task 2 — FQ-AUTO-2: Verify and fix explicit Good rating after wrong auto-select (PRIORITY: P1)

```
File: index.html in BOTH repos
PHASE2: /Users/rebekahbetar/Documents/GitHub/cozy-arcade-app-PHASE2/index.html
PHASE1: /Users/rebekahbetar/Documents/GitHub/cozy-arcade-app/index.html

── VERIFY & FIX: Explicit Good after timer auto-selects wrong answer ──
Risk: base selectSolo (line ~408) defers rateCard(ok?'good':'again') 8000ms.
If user rates Good explicitly before 8s, deferred may overwrite with 'again'.

In cozy-rating-path-rectifier-2026-06-03 script, find wrappedRate:
  var wrappedRate=function(card,rating){
    var out=priorRate.apply(this,arguments);
    if(card && rating && rating!=='pin' && rating!=='bury') markRated(cardIdFor(card));
    return out;
  };
Change to:
  var wrappedRate=function(card,rating){
    if(card && rating && rating!=='pin' && rating!=='bury'){
      clearTimeout(window.__cozyAutoRateHandle20260603);
      window.__cozyPendingRating20260603=null;
      try{ window.cozyPhase3Session?.seenThisSession?.add(cardIdFor(card)); }catch(_){}
    }
    var out=priorRate.apply(this,arguments);
    if(card && rating && rating!=='pin' && rating!=='bury') markRated(cardIdFor(card));
    return out;
  };

── Validation ──
window.runFSRSValidation()   // 17/17
window.runCozySmokeTests()   // 6/6
// Manual: let timer auto-select wrong answer → click Good on reveal →
//   wait 9s → export progress → confirm card has last_rating:'good' not 'again'
// Manual: repeat with wrong answer then Again → confirm last_rating:'again'

Bump PHASE2 sw.js CACHE version by 1. Bump PHASE1 sw.js CACHE version by 1.
Commit each repo to its own remote only.
```

---

### Task 3 — FQ-NEW-3: Add "^" to close Full Card + verify number key selection (PRIORITY: P1)

**Pre-work: Read FAILED_ATTEMPTS_2026-05-29.md Entry 2 (bundle risk) and Entry 5 (local closure wrap risk) before implementing.**

```
File: index.html in BOTH repos
PHASE2: /Users/rebekahbetar/Documents/GitHub/cozy-arcade-app-PHASE2/index.html
PHASE1: /Users/rebekahbetar/Documents/GitHub/cozy-arcade-app/index.html

── TASK A: Add "^" close to Full Card modal ──
fullCard() renders content into #modal / #modalBox.
In the fullCard() function (or wherever modal innerHTML is built), prepend inside .modalBox:
  <button id="fullCardClose351" style="position:absolute;top:8px;right:12px;
    background:none;border:1px solid rgba(103,232,249,.3);color:#9cf7ff;
    border-radius:8px;padding:4px 10px;cursor:pointer;font-size:18px"
    onclick="document.getElementById('modal').classList.add('hidden')">^</button>
Also add to the existing keydown handler (find the block for mode==='solo' && !paused):
  After the Escape check, add:
  if(e.key==='^' && document.getElementById('modal') &&
    !document.getElementById('modal').classList.contains('hidden')){
    document.getElementById('modal').classList.add('hidden'); return;
  }
No new wrappers, no new window.* exports, no new cardPool/nextCard changes.

── TASK B: Verify number key 1-4 in Solo and KE ──
The base keydown handler (line ~432) already has 1-4 → selectSolo/selectDomain.
Check if 700ms debounce wrapper guards key presses — search for _selT160 or 700 in
the outermost selectSolo wrapper. If it applies to ALL selectSolo calls (not just
timer-fired ones), add a flag: in keydown handler before selectSolo(n-1):
  window.__cozyKeySelect = true;
In the debounce wrapper, if window.__cozyKeySelect is true:
  window.__cozyKeySelect = false; return priorFn.apply(this, arguments); // bypass debounce
Only add this if testing confirms 1-4 keys are being dropped — check first.

── Validation ──
window.runFSRSValidation()   // 17/17
window.runCozySmokeTests()   // 6/6
// Manual: during Solo press 1→lane A selects; press 2→lane B; 3→C; 4→D
// Manual: click Full Card → "^" button visible top-right → click → modal closes
// Manual: press ^ key during modal → modal closes
// Manual: KE: press 1-4 → orbs respond

Bump PHASE2 sw.js CACHE version by 1. Bump PHASE1 sw.js CACHE version by 1.
Commit each repo to its own remote only.
```

---

### Task 4 — FQ-NEW-4: Review Deck — inline pin/suspend controls (PRIORITY: P2, future)

Currently the Review Deck (`#review` screen, `showReview()`) lists cards with pin/rating status text but NO interactive controls. Atlas (A10) has pin/bury via `naInjectPinBuryButtons`.

**This is a FUTURE task.** Do not implement until Tasks 1–3 are verified.

Approach when ready:
- In `showReview()`, for each review list item `div`, add two small inline buttons:
  - Pin/Unpin: toggle `phase3State.progress[id].pinned`, call `savePhase3State()` + `saveState()`, re-render row
  - Suspend/Unsuspend: toggle `phase3State.progress[id].suspended`, call `savePhase3State()` + `saveState()`, re-render row
- Use the EXACT same logic as `naInjectPinBuryButtons` in Atlas — do not invent new logic
- Test: pin a card from review deck → go to Solo → card appears pinned (runner lane highlighted, shows in pinned pool)

---

## 8. Updated Fix Queue — Priority Order

| ID | Priority | Repos | Issue | Status |
|----|----------|-------|-------|--------|
| FQ-AUTO-1 | P0 | Both | Undo runner reset (selected=0 after undo) | **NEXT → Task 1** |
| FQ-AUTO-2 | P1 | Both | Explicit Good overrides auto-select 'again' | **NEXT → Task 2** |
| FQ-NEW-3 | P1 | Both | "^" close Full Card + verify number keys | **NEXT → Task 3** |
| FQ-5 | P1 | Both | `shadowSchedule351` dead dropdown removal | Pending |
| FQ-6 | P2 | Both | Home panel flash / browseScope churn | Pending |
| FQ-7 | P2 | Both | Duplicate ⌂ HUD buttons | Pending |
| FQ-9 | P3 | PHASE1 only | Port `vercel.json` security headers | Pending |
| FQ-NEW-4 | P2 | Both | Review Deck pin/suspend inline controls | Future |
| FQ-10 | User | PHASE2 | Replace `STRIPE_PLACEHOLDER_URL` | User action |
| FQ-11 | User | Both | Import stability/ghost-seen repair JSON | User action |
| iOS1 | Final | — | Capacitor scaffold (`npx cap sync`) | After all FQs |

---

## 9. Future Items — Pre-Mortem Analysis

### 9A. Export Personal Edits (one_thing) as Portable JSON

**Goal:** Export just the user's personal notes (`user_one_thing` field) so they can be imported separately from FSRS progress — useful if upgrading to a new deck version without losing their annotations.

**Current state:** `user_one_thing` is already in `exportProgressMap` and survives the full export/import cycle. A selective export would filter only entries where `user_one_thing` is non-null.

**Implementation (simple):**
```javascript
function exportOneThingNotes(){
  const notes = {};
  const prog = window.phase3State?.progress || {};
  Object.keys(prog).forEach(id => {
    if(prog[id].user_one_thing) notes[id] = { user_one_thing: prog[id].user_one_thing };
  });
  // download as JSON blob
}
```

**What if other progress is loaded first?**
- Merge strategy: on import of a notes-only file, ONLY update `user_one_thing` — never overwrite `last_rating`, `stage`, `stability`, etc.
- Gate: check that imported JSON has `user_one_thing` keys only (no `last_rating` / `stage` → reject as wrong file type)
- This is LOW risk. Implement after pin/suspend controls are verified.

---

### 9B. Anki Deck Export — Deep Pre-Mortem

**Goal:** Allow exporting cards as an Anki-compatible file.

**Option 1: `.apkg` format (RISKY — DO NOT IMPLEMENT)**
- `.apkg` = ZIP containing a SQLite3 database (`collection.anki2`)
- Requires SQLite WASM in-browser (~2MB library) or backend
- Anki schema changes between versions; schema mismatch = import failure
- Cards have HTML fields, CSS, template variables — very complex mapping
- **Verdict:** Too risky. High implementation cost, high failure rate, no rollback.

**Option 2: Anki Text Import format (SAFER)**
- Anki supports importing plain text: tab-separated Front\tBack\tTags
- Each line = one card; `#tags column:2` etc. in header
- User must first create a note type in Anki matching the fields
- Works in ALL Anki versions; no schema dependency
- **Risk:** Content with tabs/newlines needs sanitization (replace `\t` with spaces, `\n` with `<br>`)
- **Risk:** User must manually select the correct note type in Anki during import
- **Mitigation:** Export as `.txt` file with instructions comment at top
- **Verdict:** Implement as "Export for Anki (text import)" — NOT `.apkg`

**Option 3: AnkiConnect API (desktop only, no ship risk)**
- Requires Anki desktop + AnkiConnect plugin running locally
- Not viable for a PWA; skip.

**Recommended approach when ready:**
1. Add "Export for Anki" button in Settings → Advanced
2. Produce tab-separated `.txt` file: `Front\tBack\tTags`
3. Front = `presentation` or `quick_recall` field (user-selectable)
4. Back = `diagnosis` + optional `educational_objective`
5. Tags = `system` (sanitized: spaces→underscores)
6. Sanitize: strip `\t` from all content; replace `\n` with `<br>`
7. Include comment header explaining Anki import steps
8. **Do NOT modify FSRS data or progress during export**

**Pre-mortem questions to answer before implementing:**
- Does the user want only pinned/studied cards, or all 1,249?
- Should `user_one_thing` appear on the Back side?
- Does the user have an existing Anki deck this would conflict with?
- Will duplicate cards cause problems if exported multiple times?

---

## 10. Operational Rules (never violate)

1. `runFSRSValidation()` 17/17 + `runCozySmokeTests()` 6/6 after EVERY change
2. Bump `sw.js` CACHE version on every code commit (PHASE2 and PHASE1 track separately)
3. All code in `index.html` — no separate JS files
4. Never add new `cardPool` or `nextCard` wrappers
5. Burial check requires all 4: `!p.suspended && !p.buried && p.rating!=='bury' && p.last_rating!=='bury'`
6. Never rename localStorage keys
7. Codex prompts: **under 80 lines**, no CDP infra, port BOTH repos in same prompt
8. Do not mix analysis and implementation in one Codex prompt
9. PHASE2 is dev; PHASE1 is production mirror. Test in PHASE2 first; you push to PHASE1 only after verification

---

## 11. Key Reference Documents

| Document | Location | Purpose |
|----------|----------|---------|
| `RECTIFIER_PLAN_2026_05_26.md` | PHASE2 | Master fix queue + Codex prompt contracts |
| `SENIOR_DEV_AUDIT_2026_06_07.md` | PHASE2 | Full glitch root-cause + browser test suite (Groups A–I) |
| `FAILED_ATTEMPTS_2026-05-29.md` | PHASE1 | Anti-patterns — read before ANY new code |
| `REDUNDANT_CODE_AUDIT.md` | PHASE1 | Code debt map — read before touching KPI/HUD/selectSolo chain |
| `LAYOUT_MAP_2026-05-27.md` | PHASE2 | UI panel/component layout |
| `ULTIMATE_GOALS.md` | PHASE2 | High-level product vision |
| `AGENTS.md` | PHASE2 | Codex agent instructions |

---

*Next Codex session: run Tasks 1 → 2 → 3 in order. Verify each before starting the next.*
*User actions still pending: import repair JSON + replace Stripe URL in PHASE2.*
