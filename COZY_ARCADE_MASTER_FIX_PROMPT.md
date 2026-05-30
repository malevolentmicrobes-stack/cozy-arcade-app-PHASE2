# COZY ARCADE — MASTER FIX PROMPT
# Claude Code Terminal Session
# Generated: 2026-05-30 | Based on: index.html + 3 progress exports

READ THIS ENTIRE FILE BEFORE TOUCHING ANY CODE.
Do not begin edits until you have confirmed each LOCATE step in the actual file.

---

## IRON RULES (violating any = reject entire change)

- DO NOT rename or rewrite: `rateCard`, `rate`, `advance`, `fullCard`, `saveState`,
  `updateKpis`, `canonicalCardId`, `importDeck`, `startCard`, `nextCard`
- DO NOT add a new `<script>` block — all edits inside existing script blocks
- DO NOT change localStorage key names
- DO NOT change export JSON schema keys (card_id, seen_count, etc.)
- All edits in-place only; no file splits
- After every phase: run `window.runFSRSValidation()` in browser — must stay ✅ 17/17

---

## CONFIRMED BUG INVENTORY (from data analysis of 3 progress exports)

### E1 — CRITICAL: FSRS stability/difficulty never persisted to export
- **Scope**: 48/48 rated cards have `stability: null`, `difficulty: null`
- **Confirmed**: `rateCard()` calls `setProgress(cardId, { stability: newS, difficulty: newD, ... })`
  but the export reads from a DIFFERENT state object than `setProgress` writes to
- **Evidence**: All cards have `ease_factor: 2.5` (rateCard's compat write) but zero
  FSRS fields — proves rateCard ran but its FSRS output was discarded

### E2 — CRITICAL: Autoselect + continue (arrow/enter) writes ghost state
- **Scope**: 139 cards total; 99 in the most recent session alone
- **Symptom**: `last_seen_at` updated, `one_thing` saved, but `seen_count=0`,
  `last_rating=null`, `next_due_at=null`, `stage=new` — card appears reviewed
  but is completely unscheduled
- **Cause**: The arrow/enter key handler (or the `autoSelect` advance path)
  updates `one_thing` and `last_seen_at` but does NOT call `rateCard()`
- **These 139 cards will never appear in due-queue and will loop as "new" forever**

### E3 — HIGH: SM2-era cards have wrong intervals (5 cards, all 5–6 days overdue)
- **Cards**: `4-8340`, `7-8154`, `11-11019`, `13-9895`, `1-8317`
- **Symptom**: `good` rating → `interval=1d` (SM2 default), should be `3d` (FSRS)
- **All were last seen 2026-05-24 and are now 5–6 days overdue**
- **Cause**: Rated before FSRS helpers were deployed

### E4 — HIGH: SM2 ease_factor was being mutated instead of hardcoded
- **Cards**: `14-7695` (2.35), `9-8727` (2.35), `12-8430` (2.3),
  `8-13397` (2.3), `5-8840` (2.1), `15-8525` (2.1)
- **Correct FSRS behavior**: `ease_factor` should always be written as `2.5`
  (kept only for SM2 backward compat, never modified)
- **Cause**: Pre-FSRS SM2 logic was modifying ease on hard/again ratings;
  these cards were rated in an intermediate code state

### E5 — HIGH: Shadow Dungeon queue breaks after card 1
- **Cause**: `shadowStartFirst.onclick = () => startCard(filterShadowCards()[0])`
  — single-shot; `nextCard()` then falls back to `shadowCards175164()`
  which returns ALL pinned+wrong, ignoring the dropdown filter selection
- **index is not reset** — resumes wherever the global counter was
- **No `__shadowRunQueue` exists** — the filtered subset is never preserved

### E6 — HIGH: `deckMode: 'due'` is not a real due-queue
- **Cause**: `dueScore()` has NO knowledge of `next_due_at`, `stability`,
  or `interval_days`; it only scores by `pinned > again > unseen > seen`
- **Result**: 37 cards are genuinely overdue (up to 6.9 days) but the due-mode
  sorts all 1,249 new cards ahead of them (new cards score 100, overdue score 0)

### E7 — HIGH: 13 competing `cardPool` overrides
- **Confirmed**: `window.cardPool = cardPool = function()` appears 13 times
- **Last writer wins unpredictably**; the shadow dungeon override is overwritten
  by at least one later patch that doesn't check `__shadowDungeonActive175164`

### E8 — MEDIUM: Full Card shows LEVEL 1 / LEVEL 2 instead of v17 schema fields
- **Root display site**: `sourceFull()` at ~L8679–8680
- **Proximate cause**: `normalizeSourceCard()` synthesizes `level_1_presentation`
  from `presentation` before `sourceFull` reads it (L8641–8660)
- **Re-synthesizer**: `canonicalizeCard()` at L11492–11493 overwrites AFTER
  all prior normalizers — even a cleaned card gets re-polluted here
- **9 upstream normalizers** also write level fields (C1–C9 — see below)

### E9 — MEDIUM: 1 card (`card-0007`) rated `good` but interval=0, no `next_due_at`
- **Cause**: Early-session card (May 21) where `good` rating fired but
  `next_due_at` was not written — predates current `rateCard` implementation

---

## PHASE 1 — FIX E1: Unify state store so FSRS fields persist

### LOCATE FIRST (do not edit until found):

1. Find `function setProgress(` — note which object it writes to
2. Find `function getProgress(` — confirm it reads from `phase3State.progress`
3. Find the export function — search for `exported_at` or `downloadJSON` near progress data
4. Find `function loadState(` and `function saveState(` — note localStorage keys used
5. Confirm: does `setProgress` write to `phase3State.progress[cardId]`?
6. Confirm: does the export read from `phase3State.progress` or from `state` / `loadState()`?

### THE FIX:

If export reads from a different object than `phase3State.progress`:

```js
// In the export function, replace whatever state source it uses with:
const progressData = phase3State.progress || {};
// Then iterate progressData instead of state/loadState()
```

If `setProgress` writes to `phase3State.progress` but `saveState()` only persists
`state` (the SM2 object), add this at the END of `setProgress`:

```js
// After the existing write, also persist to localStorage under the unified key:
try {
  const unified = JSON.parse(localStorage.getItem('cozy_progress_v3') || '{}');
  unified[cardId] = phase3State.progress[cardId];
  localStorage.setItem('cozy_progress_v3', JSON.stringify(unified));
} catch(e) {}
```

And in the export function, read from `cozy_progress_v3` first, fall back to
existing state.

### VERIFY:
- Rate one card as `good`
- Export progress
- Confirm exported card has `stability: 3.1262` and `difficulty: 5.3146`
- Confirm `runFSRSValidation()` → ✅ 17/17

---

## PHASE 2 — FIX E2: Autoselect + continue must call rateCard

### LOCATE FIRST:

1. Search for `autoSelect` variable usage — find where it's checked
2. Find the key handler that advances the card (arrow key / enter key)
   — search for `ArrowRight`, `keydown`, `'Enter'`, or `advance(`
3. Find where `one_thing` or `last_seen_at` is written OUTSIDE of `rateCard`
4. Confirm: does the advance path call `rateCard()`? If not, this is the bug.

### THE FIX:

In the arrow/enter key handler that advances the card WITHOUT a rating:

```js
// BEFORE calling nextCard() or advance(), insert:
if (autoSelect && current) {
  const autoCardId = current.id || current.qid;
  // Only fire if this card hasn't been rated this advance
  if (!session.seenThisSession.has(autoCardId)) {
    rateCard(autoCardId, 'good'); // autoselect correct = good
  }
}
```

If the path is in `loopSolo()` or `renderSolo()` where the continue button
or key handler is wired, find that wiring and insert the same guard.

### ALSO FIX the `last_seen_at` / `one_thing` partial write:

Search for where `last_seen_at` is written WITHOUT going through `rateCard`.
If found in a separate `updateSeenAt()` or similar function, either:
- Remove the standalone write (let `rateCard` handle it), OR
- Ensure it only fires if `rateCard` already fired for this card this session

### VERIFY:
- Enable autoSelect
- Play through 3 cards using only arrow/enter (no rating buttons)
- Export progress
- Confirm those 3 cards have `seen_count=1`, `last_rating='good'`,
  `stability=3.1262`, `next_due_at` set to 3 days from now

---

## PHASE 3 — FIX E5: Shadow Dungeon preserves selected subset

### LOCATE FIRST:

1. Find `q('shadowStartFirst').onclick` — confirm it's the single-shot version
2. Find `shadowCards175164()` — confirm it ignores dropdown filter
3. Find the final `window.cardPool = cardPool = function()` override that
   handles `__shadowDungeonActive175164` — confirm it calls `shadowCards175164()`
4. Find `nextCard()` — confirm it calls `cardPool()` without queue awareness

### THE FIX:

Replace the `shadowStartFirst` onclick handler:

```js
q('shadowStartFirst').onclick = () => {
  const queue = filterShadowCards(); // respects ALL dropdown filters
  if (!queue.length) {
    toast('No cards match this filter');
    return;
  }
  window.__shadowRunQueue = queue;
  window.__shadowRunQueueIdx = 0;
  window.__shadowDungeonActive175164 = true;
  startCard(queue[0]);
};
```

In the FINAL `window.cardPool = cardPool = function()` override, change:

```js
// REPLACE:
if(window.__shadowDungeonActive175164){
  const sh = shadowCards175164(); // BUG: ignores filter
  if(sh.length) return sh;
}

// WITH:
if(window.__shadowDungeonActive175164 && Array.isArray(window.__shadowRunQueue) && window.__shadowRunQueue.length){
  return window.__shadowRunQueue; // preserves original filter selection
}
```

Override `nextCard` behavior during shadow run:

```js
// At the TOP of the final nextCard override (or wrap existing nextCard):
const _origNextCard = nextCard;
window.nextCard = nextCard = function() {
  if (window.__shadowDungeonActive175164 &&
      Array.isArray(window.__shadowRunQueue) &&
      window.__shadowRunQueue.length) {
    window.__shadowRunQueueIdx = (window.__shadowRunQueueIdx || 0);
    current = window.__shadowRunQueue[window.__shadowRunQueueIdx % window.__shadowRunQueue.length];
    window.__shadowRunQueueIdx++;
    makeChoices();
    return;
  }
  _origNextCard();
};
```

Add a reset when Shadow Dungeon is exited:

```js
// Wherever mode switches away from shadow (home button, etc.):
window.__shadowRunQueue = null;
window.__shadowRunQueueIdx = 0;
window.__shadowDungeonActive175164 = false;
```

### VERIFY:
- Open Shadow Dungeon, select "Review missed / No Idea" filter, set System = Cardiology
- Click Start — confirm first card is Cardiology + missed
- Press next 5 times — confirm ALL 5 cards are Cardiology + missed (not random)
- Cards should cycle through the selected queue, not the full deck

---

## PHASE 4 — FIX E6: Real due-queue in dueScore and cardPool

### LOCATE FIRST:

1. Find `function dueScore(` — confirm it has NO `next_due_at` logic
2. Find `function isDue(` — confirm it correctly reads `next_due_at`
3. Find the `deckMode === 'due'` branch in cardPool — confirm it only sorts, never filters

### THE FIX — replace dueScore:

```js
function dueScore(c) {
  const s = state[c.id || c.qid] || {};
  // FSRS-aware: prioritize by overdue urgency
  if (s.next_due_at) {
    const overdueDays = (Date.now() - Date.parse(s.next_due_at)) / 86400000;
    if (overdueDays > 0) return 2000 + overdueDays; // overdue: sort by urgency
    return 1000 + (1 / Math.max(0.01, -overdueDays)); // due soon
  }
  // Legacy fallback for cards without next_due_at
  return (s.pinned ? 500 : 0) + (s.last_rating === 'again' ? 200 : 0) + (s.seen ? 0 : 100);
}
```

In the cardPool section that handles `deckMode === 'due'`, ADD a filter step:

```js
if (deckMode === 'due') {
  const dueArr = arr.filter(c => isDue(getProgress(c.id || c.qid)));
  if (dueArr.length > 0) {
    arr = dueArr.sort((a, b) => dueScore(b) - dueScore(a));
  } else {
    // No due cards — show message and fall back to priority sort
    try { toast('No cards due yet — showing by priority'); } catch(e) {}
    arr = arr.sort((a, b) => dueScore(b) - dueScore(a));
  }
}
```

Apply this fix to ONLY the final active `cardPool` override
(the one that runs at runtime — add `console.log('[cardPool active]')` to find it).

### VERIFY:
- Set deckMode to 'due'
- Confirm the first cards shown have `next_due_at` in the past
- Export progress after 3 ratings, confirm `next_due_at` values exist

---

## PHASE 5 — FIX E8: Full Card — remove LEVEL 1 / LEVEL 2

### LOCATE FIRST (3 sites must all be fixed):

**Site A** — Display (L~8679–8680): `sourceFull()` function
**Site B** — Proximate synthesizer (L~8641–8660): `normalizeSourceCard()` return object
**Site C** — Re-synthesizer (L~11492–11493): `canonicalizeCard()` function

### FIX Site A — sourceFull():

```js
function sourceFull(c) {
  c = normalizeSourceCard(c || {}, 0);
  return [
    ['QID',                  c.qid_unique || c.qid],
    ['TEST',                 c.test],
    ['SYSTEM',               c.sys || c.system],
    ['DIAGNOSIS',            sourceAnswer(c)],
    ['PRESENTATION',         c.presentation],
    ['ONE THING',            first(userOneThing(c), c.one_thing)],
    ['EDUCATIONAL OBJECTIVE',c.educational_objective],
    ['BOARD TRIGGER',        c.board_trigger],
    ['EXPLANATION',          c.explanation],
    ['WHY NOT OTHERS',       c.why_not_others],
    ['TAGS',                 Array.isArray(c.tags) ? c.tags.join('; ') : c.tags]
  ]
  .filter(x => clean(x[1]))
  .map(x => x[0] + ':\n' + x[1])
  .join('\n\n');
}
```

### FIX Site B — normalizeSourceCard(), remove these two lines from its return object:

```js
// DELETE these two lines:
level_1_presentation: first(c.level_1_presentation, level1),
level_2_three_second_exposure: first(c.level_2_three_second_exposure, level2),
```

### FIX Site C — canonicalizeCard(), remove or guard these two lines (~L11492–11493):

```js
// DELETE or guard with: if (!c.qid_unique) { ... }
c.level_1_presentation = presentation;           // DELETE
c.level_2_three_second_exposure = educational_objective; // DELETE
```

### VERIFY:
- Open any card's Full Card view
- Confirm "LEVEL 1" and "LEVEL 2" labels are gone
- Confirm "PRESENTATION", "EDUCATIONAL OBJECTIVE", "BOARD TRIGGER",
  "EXPLANATION", "WHY NOT OTHERS" are showing
- Reload page and open Full Card again — labels must not reappear

---

## PHASE 6 — DATA REPAIR: Fix SM2-era cards and ghosts

After Phases 1–5 are confirmed working, run this one-time migration in the
browser console to repair existing corrupt state:

```js
// Paste into browser console after loading the app with the fixed code

(function repairCorruptProgress() {
  const now = new Date();

  // E3 FIX: SM2-era good→1d cards — should be good→3d
  const sm2EraCards = ['4 - 8340', '7 - 8154', '11 - 11019', '13 - 9895', '1 - 8317'];
  sm2EraCards.forEach(id => {
    const p = getProgress(id);
    if (p && p.last_rating === 'good' && p.interval_days === 1) {
      const lastSeen = new Date(p.last_seen_at);
      const correctedDue = new Date(lastSeen.getTime() + 3 * 86400000);
      setProgress(id, {
        interval_days: 3,
        stability: 3.1262,
        difficulty: 5.3146,
        next_due_at: correctedDue.toISOString()
      });
      console.log('[repair] SM2-era fixed:', id);
    }
  });

  // E4 FIX: ease_factor floating-point anomaly — normalize to 2.5
  // (ease is kept only for compat, FSRS always uses 2.5)
  const easeAnomalies = ['14 - 7695', '9 - 8727', '12 - 8430',
                          '8 - 13397', '5 - 8840', '15 - 8525'];
  easeAnomalies.forEach(id => {
    const p = getProgress(id);
    if (p && p.ease_factor !== 2.5) {
      setProgress(id, { ease_factor: 2.5 });
      console.log('[repair] ease normalized:', id);
    }
  });

  // E9 FIX: card-0007 — rated good but interval=0, no next_due_at
  const p0007 = getProgress('card-0007');
  if (p0007 && p0007.last_rating === 'good' && !p0007.next_due_at) {
    const lastSeen = p0007.last_seen_at ? new Date(p0007.last_seen_at) : now;
    setProgress('card-0007', {
      interval_days: 3,
      stability: 3.1262,
      difficulty: 5.3146,
      next_due_at: new Date(lastSeen.getTime() + 3 * 86400000).toISOString()
    });
    console.log('[repair] card-0007 fixed');
  }

  // E2 GHOST FIX: 139 cards with last_seen_at but seen_count=0, no rating
  // Re-initialize as 'new' so they re-enter the queue cleanly
  // (Do NOT set a rating — they need to be reviewed properly)
  let ghostCount = 0;
  Object.keys(phase3State.progress || {}).forEach(id => {
    const p = getProgress(id);
    if (p && p.last_seen_at && p.seen_count === 0 && !p.last_rating && p.stage === 'new') {
      setProgress(id, {
        last_seen_at: null,
        updated_at: now.toISOString()
      });
      ghostCount++;
    }
  });
  console.log('[repair] Ghost cards reset:', ghostCount);

  console.log('[repair] COMPLETE — export progress to verify');
})();
```

---

## PHASE 7 — VERIFICATION CHECKLIST

Run ALL of these before committing:

```
□ window.runFSRSValidation()     → ✅ 17/17 passed
□ window.runCozySmokeTests()     → ✅ 6/6 passed (structural, not math)
□ Rate card as 'good' → export → stability=3.1262, difficulty=5.3146 ✅
□ Rate card as 'again' → export → stage=relearning, next_due_at=~10min from now ✅
□ Rate card as 'easy' → export → interval=15d, stability=15.4722 ✅
□ Autoselect + arrow → export → seen_count=1, last_rating='good', stability set ✅
□ Shadow Dungeon: select Cardiology + missed → 10 cards → all Cardiology+missed ✅
□ deckMode='due' → first card shown has past next_due_at ✅
□ Full Card → shows PRESENTATION not LEVEL 1 ✅
□ Reload page → Full Card still shows PRESENTATION ✅
□ Export after repair → SM2-era cards have interval=3d, stability=3.1262 ✅
```

---

## REFERENCE: FSRS v5 First-Review Expected Values

```
Rating  stability  difficulty  interval  stage
again   0.4072     7.2102      0d        relearning (next_due = +10min)
hard    1.1829     6.5085      1d        review     (repair_point=true)
good    3.1262     5.3146      3d        review
easy    15.4722    3.2829      15d       review
```

Second review (was good, rated good on schedule):
```
S: 3.1262 → 6.9371   D: 5.3146 → 5.195   interval: 7d
```

---

## REFERENCE: Key Function Locations (search index.html for these strings)

| Function | Search string | Purpose |
|----------|--------------|---------|
| `rateCard` | `function rateCard(cardId, rating)` | Core SRS rating — DO NOT RENAME |
| `setProgress` | `function setProgress(` | State write — confirm it writes FSRS fields |
| `getProgress` | `function getProgress(` | State read — must match setProgress's store |
| `isDue` | `function isDue(progress)` | Due check — reads next_due_at |
| `dueScore` | `function dueScore(c)` | Sort key — currently broken, fix in Phase 4 |
| `sourceFull` | `function sourceFull(c)` | Full card display — fix in Phase 5 Site A |
| `normalizeSourceCard` | `function normalizeSourceCard` | Level synth — fix in Phase 5 Site B |
| `canonicalizeCard` | `function canonicalizeCard` | Level re-synth — fix in Phase 5 Site C |
| `shadowStartFirst` | `q('shadowStartFirst').onclick` | Shadow queue — fix in Phase 3 |
| `filterShadowCards` | `function filterShadowCards()` | Shadow filter — used in Phase 3 fix |
| `cardPool (final)` | Run `console.log` to find active one | Due filter — fix in Phase 4 |

---

## SESSION ORDER

1. Phase 1 first — FSRS persistence fix is the prerequisite for all data integrity
2. Phase 2 — autoselect fix (stops generating new ghosts)
3. Phase 3 — shadow dungeon queue (user-facing priority)
4. Phase 4 — due queue fix
5. Phase 5 — full card display
6. Phase 6 — run repair migration in console
7. Phase 7 — full verification checklist

---

## ADDENDUM — 2026-05-30: CONFIRMED LINE NUMBERS + FIX CORRECTIONS

*Generated by graphify + grep LOCATE pass on actual PHASE2 index.html (~13,950 lines).
Every line number below is confirmed. Corrections to Phase 1, 2, 5 plans above.*

---

### CONFIRMED FUNCTION LOCATIONS

| Function | Actual line | Notes |
|----------|-------------|-------|
| `loadState` | L386 | Old SM2 store — reads `soloStudyingState_v1757` |
| `saveState` | L387 | Old SM2 store — writes `soloStudyingState_v1757` |
| `nextCard` | L396 | Calls `cardPool()`, assigns `current`, calls `makeChoices()` |
| `advance` | L417 | Calls `nextCard()`; no FSRS call — confirmed |
| `rate` | L419 | Old SM2 only: writes `state[k].rating`, `state[k].last`. Does NOT call `rateCard()` |
| `bindRatings` | L416 | Rating button wiring — THIS is where `rateCard` must be added (E2 fix) |
| `importDeck` | L429 | Legacy import |
| `updateKpis` | L426 | Old SM2 KPI display |
| `wire` | L432 | Button wiring at boot |
| `startCard` | L973 | Launches card into solo mode |
| `shadowStartFirst.onclick` | L993 | Single-shot: `startCard(filterShadowCards()[0])` — confirmed broken |
| `shadowCards175164` | L3792 | Returns `cards.filter(c => isWrongOrPinned(c))` — ignores dropdown filter |
| `cardPool` Shadow override | L3874 | `window.cardPool = cardPool = function()` — uses `shadowCards175164()` |
| `normalizeSourceCard` | L8630 | Synthesizes level fields — do NOT remove level aliases here |
| `sourceFull` | L8670 | Full Card popup text — only fix needed for E8 |
| `exportProgressMap` | L10901 | Builds progress export — E1 fix goes here |
| `savePhase3State` | L10937 | Calls `exportProgressMap()` then writes localStorage |
| `phase3State` init | L10893 | `let phase3State = loadPhase3State(normalizeDeckIdentities())` |
| `getProgress` | L10994 | Reads from `phase3State.progress` ✓ |
| `setProgress` | L11014 | Writes to `phase3State.progress[cardId]` ✓ — and calls `savePhase3State()` |
| `isDue` | L11051 | Correctly reads `next_due_at` ✓ |
| `rateCard` | L11150 | Writes `stability`, `difficulty`, `next_due_at` to `phase3State.progress` ✓ |
| `updateKpisPhase3` | L11403 | Phase 3 KPI display |
| `exportDeckWithProgress` | L11537 | Calls `backupPayload()` → `exportProgressMap()` |
| `progressPayload` | L11448 | Calls `exportProgressMap()` |
| `backupPayload` | L11512 | Calls `exportProgressMap()` |
| `canonicalizeCard` | L11458 | Sets level aliases in display mode — do NOT remove (game rendering) |
| `dueScoreHot` | L10013 | Active Phase 3 due-sort fn — chains 352→350→original, all lack `next_due_at` |
| `dueScore350` | L6073 | No `next_due_at` — confirmed |
| `dueScore` (original) | L395 | No `next_due_at` — confirmed |
| `window.rateCard` export | L11795 | `window.rateCard = rateCard` — callable from `bindRatings` |

---

### E1 CORRECTION — Fix is 2 lines in `exportProgressMap()`, NOT in `setProgress`

The original Phase 1 plan assumes the problem is in `setProgress` or the state object.
**The actual bug**: `exportProgressMap()` at L10901 reads from `phase3State.progress` (correct)
but the `entry` object it builds at L10911–10932 simply **omits `stability` and `difficulty`**.
`setProgress` and `phase3State.progress` are both correct — export is the only broken link.

**Exact fix — add 2 lines to `exportProgressMap()` entry object, after `ease_factor` (L10926):**

```js
// In exportProgressMap(), find this block (L10925–10927):
        interval_days: Number(p.interval_days || 0),
        ease_factor: Number(p.ease_factor || 2.5),
        lapses: Number(p.lapses || 0),

// Replace with:
        interval_days: Number(p.interval_days || 0),
        ease_factor: Number(p.ease_factor || 2.5),
        stability: p.stability || null,
        difficulty: p.difficulty || null,
        lapses: Number(p.lapses || 0),
```

Do NOT touch `setProgress`, `savePhase3State`, or localStorage keys.
`rateCard` already writes `stability` and `difficulty` to `phase3State.progress` — they just
get stripped by the export serializer. This 2-line addition is the entire Phase 1 fix.

---

### E2 CORRECTION — Fix goes in `bindRatings()` (L416), NOT in arrow/keydown handlers

The original Phase 2 plan targets arrow/enter keydown handlers. Those handlers call `advance()`
which calls `nextCard()` — no state is written at all. The keydown path is NOT the ghost source.

**The actual disconnect**: `bindRatings()` at L416 calls `rate(current, r)` (old SM2 state only).
`rateCard()` (Phase 3 FSRS at L11150) is **never called from any game UI path**.
`window.rateCard` is exported at L11795 and is callable.

**Exact fix — edit `bindRatings()` at L416 in-place:**

```js
// CURRENT (L416):
function bindRatings(which){document.querySelectorAll('[data-rate]').forEach(b=>b.onclick=()=>{let r=b.dataset.rate;if(r==='continue'){advance(which);return}rate(current,r); if(r==='pin')toast('Pinned'); else advance(which)})}

// REPLACE WITH:
function bindRatings(which){document.querySelectorAll('[data-rate]').forEach(b=>b.onclick=()=>{let r=b.dataset.rate;if(r==='continue'){try{if(current&&typeof rateCard==='function')rateCard(canonicalCardId(current),'good');}catch(e){}advance(which);return}rate(current,r);try{if(current&&r!=='pin'&&typeof rateCard==='function')rateCard(canonicalCardId(current),r);}catch(e){} if(r==='pin')toast('Pinned'); else advance(which)})}
```

This adds two `try/catch` guards:
1. "continue" button → fires `rateCard(id, 'good')` before `advance()`
2. All ratings (again/hard/good/easy) → fires `rateCard(id, r)` alongside existing `rate()`

`try/catch` guards prevent any failure in `rateCard` from breaking the existing game flow.
The old `rate()` call is kept for SM2 backward compat (it writes `state[k].rating` used by
legacy `dueScore` + `dueScore350`).

**Ghost card source**: Line L11927 writes `setProgress(id, { last_seen_at: nowIso() })` in
a monitoring/repair loop — this is why 139 cards have `last_seen_at` but `seen_count=0`.
The E2 fix above stops generating new ghosts. Phase 6 repair script clears existing ones.

---

### E5 CONFIRMED — Fix targets L993 and L3874–3881

- `q('shadowStartFirst').onclick` at L993: `startCard(filterShadowCards()[0])` — single-shot ✓
- `shadowCards175164()` at L3792: `cards.filter(c => isWrongOrPinned(c))` — ignores filter ✓
- `cardPool` Shadow override at L3874–3881: calls `shadowCards175164()` — ignores filter ✓
- Phase 3 plan (build `window.__shadowRunQueue` queue) is correct as written

---

### E6 CONFIRMED — Fix target is `dueScoreHot` at L10013

`dueScoreHot` (L10013) is a `const` arrow function that chains to `dueScore352→dueScore350→dueScore`,
all lacking `next_due_at`. This is the active due-sort fn for Phase 3's final `cardPool` override.

**Fix: replace `dueScoreHot` body at L10013–10019 in-place:**

```js
// REPLACE:
  const dueScoreHot = card => {
    try { if (typeof dueScore352 === 'function') return dueScore352(card); } catch (_) {}
    try { if (typeof dueScore350 === 'function') return dueScore350(card); } catch (_) {}
    try { if (typeof dueScore === 'function') return dueScore(card); } catch (_) {}
    const st = stateForCard(card);
    return (st.pinned ? 1000 : 0) + (st.rating === 'again' ? 500 : 0) + (st.rating === 'hard' ? 250 : 0) + (isSeen(card) ? 0 : 100);
  };

// WITH:
  const dueScoreHot = card => {
    const p = (typeof getProgress === 'function') ? getProgress(canonicalCardId(card)) : stateForCard(card);
    if (p && p.next_due_at) {
      const overdueDays = (Date.now() - Date.parse(p.next_due_at)) / 86400000;
      if (overdueDays > 0) return 2000 + overdueDays;
      return 1500 + (1 / Math.max(0.01, -overdueDays));
    }
    const st = stateForCard(card);
    return (st.pinned ? 1000 : 0) + (st.last_rating === 'again' ? 500 : 0) + (st.last_rating === 'hard' ? 250 : 0) + (isSeen(card) ? 0 : 100);
  };
```

This makes overdue cards (positive `overdueDays`) sort to 2000+ — far above any new card's ~100.

---

### E8 CORRECTION — Only Site A (`sourceFull` L8679–8680) needs to change

Original Phase 5 plan targets 3 sites. **Sites B and C must NOT be changed:**

- **Site B** (`normalizeSourceCard` L8659–8660): sets `level_1_presentation` and `level_2_three_second_exposure`
  as aliases used for GAME RENDERING (`sourcePrompt()`, `canonicalizeCard()` presentation fallback). 
  Removing breaks card display in-game.
- **Site C** (`canonicalizeCard` L11492–11493): sets same aliases used as presentation fallbacks
  for gameplay rendering. Removing breaks card rendering.

**Only fix needed — remove 2 lines from `sourceFull()` array at L8679–8680:**

```js
// In sourceFull() at L8670, find the array:
      ['LEVEL 1',c.level_1_presentation||c.level_1],    // DELETE THIS LINE
      ['LEVEL 2',c.level_2_three_second_exposure||c.level_2],  // DELETE THIS LINE

// The array should go directly from:
      ['PRESENTATION',sourcePrompt(c)],
      ['EDUCATIONAL OBJECTIVE',c.educational_objective],
// (no LEVEL 1 or LEVEL 2 between them)
```

The labels "LEVEL 1" and "LEVEL 2" will no longer appear in the Full Card popup.
`PRESENTATION` and `EDUCATIONAL OBJECTIVE` already show the same content — no data is lost.

---

### IRON RULE REMINDERS FOR EDITS

1. `bindRatings` at L416 — edit in-place, do not extract to new function
2. `exportProgressMap` at L10901 — add 2 lines inside the `entry` object only
3. `sourceFull` at L8670 — remove 2 lines from the array only
4. `dueScoreHot` at L10013 — replace the `const` body in-place
5. After EACH phase edit: run `window.runFSRSValidation()` in browser → must be 17/17
6. Bump `CACHE` in `sw.js` only on the final commit after all phases verified
