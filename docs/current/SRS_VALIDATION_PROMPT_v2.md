# SRS VALIDATION PROMPT — COZY ARCADE BOARD PREP
## Spaced Repetition System Audit & Verification Guide
**App:** `index.html` (Phase 2) · **Algorithm:** SM-2 variant · **Target:** Anki-equivalent behavior  
**Generated:** 2026-05-21

---

## PURPOSE

This prompt is your complete checklist to verify, validate, and debug the spaced repetition system (SRS) inside `index.html`. Run through this before any release. Each section includes **what to test**, **what correct behavior looks like**, and **the exact code location to fix** if something is wrong.

Paste this into Claude Code, Codex, or any AI with `index.html` in context.

---

## PART 1 — ALGORITHMIC CORRECTNESS (SM-2)

### 1A. Rating → Interval Math

The `rateCard(cardId, rating)` function (line ~10871) must produce these exact intervals. Verify each case by calling `rateCard` in the browser console and inspecting `phase3State.progress[cardId]`.

```
Setup:  ease_factor=2.5, interval_days=10, stage='review'
```

| Rating | Expected interval_days | Expected ease_factor | Expected stage | repair_point |
|--------|----------------------|---------------------|----------------|--------------|
| `again` | 0 (relearning) | 2.3 (2.5 - 0.2) | `relearning` | true |
| `hard` | 12 (round(10 * 1.2)) | 2.35 (2.5 - 0.15) | `review` | true |
| `good` | 25 (round(10 * 2.5)) | 2.5 (unchanged) | `review` | false |
| `easy` | 42 (round(10 * 2.65 * 1.3)) | 2.65 (2.5 + 0.15) | `review` | false |

**NEW card (interval=0, stage='new'):**

| Rating | Expected interval_days | Note |
|--------|----------------------|------|
| `hard` | 1 (max(1, round(0 * 1.2)) → max(1,0) = 1) | Floor at 1 |
| `good` | 1 (interval<=0 → 1) | First good → 1 day |
| `easy` | 4 (interval<=0 → 4) | First easy → 4 days |
| `again` | 0 + 10min | Relearning, not days |

**VALIDATION CODE — paste in browser console:**
```javascript
// Test rateCard math directly
(function() {
  const TESTS = [
    {setup:{ease_factor:2.5,interval_days:10,stage:'review'}, rating:'again', expect:{interval_days:0,ease_factor:2.3,stage:'relearning',repair_point:true}},
    {setup:{ease_factor:2.5,interval_days:10,stage:'review'}, rating:'hard',  expect:{interval_days:12,ease_factor:2.35,stage:'review',repair_point:true}},
    {setup:{ease_factor:2.5,interval_days:10,stage:'review'}, rating:'good',  expect:{interval_days:25,ease_factor:2.5,stage:'review',repair_point:false}},
    {setup:{ease_factor:2.5,interval_days:10,stage:'review'}, rating:'easy',  expect:{interval_days:42,ease_factor:2.65,stage:'review',repair_point:false}},
    {setup:{ease_factor:2.5,interval_days:0, stage:'new'},    rating:'good',  expect:{interval_days:1,stage:'review',repair_point:false}},
    {setup:{ease_factor:2.5,interval_days:0, stage:'new'},    rating:'easy',  expect:{interval_days:4,stage:'review',repair_point:false}},
  ];
  let pass=0,fail=0;
  TESTS.forEach(({setup,rating,expect},i) => {
    // Inject fake progress
    const fakeId = '__srs_test_' + i;
    window.phase3State = window.phase3State || {progress:{}};
    window.phase3State.progress[fakeId] = {...window.defaultProgress?.(fakeId)||{}, ...setup, card_id:fakeId};
    window.rateCard(fakeId, rating);
    const result = window.phase3State.progress[fakeId];
    let ok = true;
    for (const [k,v] of Object.entries(expect)) {
      if (Math.abs((result[k]||0) - v) > 0.01 && result[k] !== v) {
        console.warn(`FAIL T${i+1} [${rating}] ${k}: expected ${v}, got ${result[k]}`);
        ok = false;
      }
    }
    ok ? pass++ : fail++;
    delete window.phase3State.progress[fakeId];
  });
  console.log(`SRS MATH: ${pass}/${TESTS.length} passed${fail?' ← FIX REQUIRED':' ✓'}`);
})();
```

**EXPECTED OUTPUT:** `SRS MATH: 6/6 passed ✓`

---

### 1B. ease_factor Floor (Must Never Go Below 1.3)

Anki hard-floors ease at 1.3. Verify by pressing `again` many times.

```javascript
// Console test — ease floor
(function() {
  const id = '__ease_floor_test';
  window.phase3State.progress[id] = {...window.defaultProgress(id), ease_factor:1.35, stage:'review', interval_days:5};
  window.rateCard(id, 'again');
  const ef = window.phase3State.progress[id].ease_factor;
  const ok = ef >= 1.3;
  console.log(`EASE FLOOR: ease=${ef.toFixed(2)} → ${ok?'PASS ✓':'FAIL ← ease dropped below 1.3'}`);
  delete window.phase3State.progress[id];
})();
```

---

### 1C. Lapse Counting (Only Increments in Review Stage)

Pressing `again` on a `new` or `learning` card must NOT increment lapses.

```javascript
(function() {
  const id = '__lapse_test';
  // new card: again should NOT add lapse
  window.phase3State.progress[id] = {...window.defaultProgress(id), stage:'new', lapses:0};
  window.rateCard(id, 'again');
  const lapseOnNew = window.phase3State.progress[id].lapses;

  // review card: again SHOULD add lapse
  window.phase3State.progress[id].stage = 'review';
  window.rateCard(id, 'again');
  const lapseOnReview = window.phase3State.progress[id].lapses;

  console.log(`LAPSE COUNT: new=${lapseOnNew} (expect 0), review=${lapseOnReview} (expect 1) → ${lapseOnNew===0&&lapseOnReview===1?'PASS ✓':'FAIL ←'}`);
  delete window.phase3State.progress[id];
})();
```

---

### 1D. `again` → Relearning → next_due in Minutes (Not Days)

A card rated `again` must come back in ~10 minutes, not tomorrow.

```javascript
(function() {
  const id = '__relearn_test';
  window.phase3State.progress[id] = {...window.defaultProgress(id), stage:'review', interval_days:10};
  window.rateCard(id, 'again');
  const p = window.phase3State.progress[id];
  const minutesUntilDue = (Date.parse(p.next_due_at) - Date.now()) / 60000;
  const ok = minutesUntilDue > 5 && minutesUntilDue < 20;
  console.log(`RELEARN TIMER: ${minutesUntilDue.toFixed(1)}min → ${ok?'PASS ✓':'FAIL ← should be ~10 min'}`);
  delete window.phase3State.progress[id];
})();
```

---

## PART 2 — isDue() LOGIC

The `isDue(progress)` function controls which cards appear in "Due" mode. Verify all cases.

```javascript
(function() {
  function fakeP(overrides) { return {...window.defaultProgress('_'), ...overrides}; }
  const now = new Date();
  const pastIso = new Date(now - 86400000).toISOString();   // yesterday
  const futureIso = new Date(now + 86400000).toISOString(); // tomorrow

  const cases = [
    {label:'null next_due_at (new card)',    p:fakeP({next_due_at:null}),      expect:false},
    {label:'next_due_at in past',            p:fakeP({next_due_at:pastIso}),   expect:true},
    {label:'next_due_at in future',          p:fakeP({next_due_at:futureIso}), expect:false},
    {label:'repair_point=true (always due)', p:fakeP({repair_point:true,next_due_at:futureIso}), expect:true},
    {label:'stage=relearning (always due)',  p:fakeP({stage:'relearning',next_due_at:futureIso}), expect:true},
  ];

  let pass=0,fail=0;
  cases.forEach(({label,p,expect}) => {
    const result = window.isDue ? window.isDue(p) : '⚠️ isDue not exposed';
    const ok = result === expect;
    console.log(`isDue [${label}]: ${ok?'PASS ✓':`FAIL ← got ${result}, expected ${expect}`}`);
    ok ? pass++ : fail++;
  });
  console.log(`isDue: ${pass}/${cases.length} passed${fail?' ← FIX REQUIRED':' ✓'}`);
})();
```

> **If `isDue` is not exposed on window:** Add `window.isDue = isDue;` near line 11305 where other functions are exported.

---

## PART 3 — SESSION POOL & QUEUE BEHAVIOR

### 3A. New Cards Surface Before Reviews (new_first mode)

```javascript
// After loading a deck with a mix of new and due cards:
(function() {
  const pool = window.sessionPool ? window.sessionPool('solo') : [];
  if (!pool.length) { console.warn('Load a deck first'); return; }
  const firstFive = pool.slice(0,5).map(c => {
    const p = window.phase3State?.progress?.[window.canonicalCardId(c)] || {};
    return {id: window.canonicalCardId(c).slice(0,12), stage: p.stage||'new'};
  });
  console.table(firstFive);
  console.log('Pool size:', pool.length, '— Verify new cards appear before review cards in new_first mode');
})();
```

### 3B. Buried Cards Move to Back of Queue

After answering a card (`good` or `easy`), it should be buried from the current session and not reappear until all other cards are shown.

```javascript
// Mark 3 cards as buried, verify they are at end of pool
(function() {
  const pool = window.sessionPool ? window.sessionPool('solo') : [];
  if (pool.length < 4) { console.warn('Need 4+ cards loaded'); return; }
  const buried = pool.slice(0,2).map(c => window.canonicalCardId(c));
  buried.forEach(id => session?.buriedToday?.add(id));
  const rebuilt = window.getStudyPool ? window.getStudyPool('new_first','solo') : pool;
  const first2ids = rebuilt.slice(0,2).map(c => window.canonicalCardId(c));
  const overlap = first2ids.filter(id => buried.includes(id));
  console.log(`BURIED CARDS: ${overlap.length===0?'PASS ✓ (not at front)':'FAIL ← buried cards appearing at front'}`);
})();
```

### 3C. Repair Points Surface First

Cards with `repair_point: true` must always appear near the top.

```javascript
(function() {
  const pool = window.sessionPool ? window.sessionPool('solo') : [];
  if (!pool.length) { console.warn('Load a deck first'); return; }
  // Manually set first 3 as repair points
  pool.slice(3,6).forEach(c => {
    const id = window.canonicalCardId(c);
    if (window.phase3State?.progress?.[id]) window.phase3State.progress[id].repair_point = true;
  });
  const rebuilt = window.getStudyPool ? window.getStudyPool('due','solo') : [];
  const repairIds = pool.slice(3,6).map(c => window.canonicalCardId(c));
  const frontIds = rebuilt.slice(0,6).map(c => window.canonicalCardId(c));
  const found = repairIds.filter(id => frontIds.includes(id)).length;
  console.log(`REPAIR POINT PRIORITY: ${found}/3 repair cards in top 6 → ${found>=2?'PASS ✓':'FAIL ←'}`);
})();
```

---

## PART 4 — PROGRESS PERSISTENCE

### 4A. localStorage Key is Correct

```javascript
// Must use ONLY this key
const keys = Object.keys(localStorage).filter(k => k.startsWith('cozy'));
console.log('localStorage keys:', keys);
// EXPECTED: ['cozy_arcade_progress_v1']
// FAIL if: cozy_progress, cozy_state, cozy_arcade_state, or multiple keys appear
```

### 4B. Progress Survives Reload

```javascript
// Step 1 — run before reload
window._srs_pretest = {
  id: window.canonicalCardId(window.appCards()[0]),
};
window.rateCard(window._srs_pretest.id, 'easy');
const before = JSON.parse(JSON.stringify(window.phase3State.progress[window._srs_pretest.id]));
console.log('BEFORE RELOAD — interval:', before.interval_days, 'stage:', before.stage, 'ease:', before.ease_factor);
localStorage.setItem('_srs_pretest_id', window._srs_pretest.id);

// Step 2 — run AFTER page reload
(function() {
  const id = localStorage.getItem('_srs_pretest_id');
  if (!id) { console.warn('Run Step 1 first, then reload'); return; }
  const after = window.phase3State?.progress?.[id];
  if (!after) { console.error('FAIL ← progress not found after reload'); return; }
  console.log('AFTER RELOAD — interval:', after.interval_days, 'stage:', after.stage, 'ease:', after.ease_factor);
  const ok = after.interval_days >= 4 && after.stage === 'review' && after.ease_factor >= 2.65;
  console.log(`PERSISTENCE: ${ok?'PASS ✓':'FAIL ← values changed after reload'}`);
  localStorage.removeItem('_srs_pretest_id');
})();
```

### 4C. No Progress Key Collision (canonicalCardId uniqueness)

```javascript
// Verify all loaded cards have unique canonical IDs
(function() {
  const cards = window.appCards ? window.appCards() : [];
  const ids = cards.map(c => window.canonicalCardId(c));
  const unique = new Set(ids);
  const dupes = ids.length - unique.size;
  console.log(`CANONICAL ID UNIQUENESS: ${ids.length} cards, ${dupes} duplicates → ${dupes===0?'PASS ✓':'FAIL ← '+dupes+' collision(s)'}`);
  if (dupes > 0) {
    const seen = new Set();
    ids.forEach((id,i) => {
      if (seen.has(id)) console.warn('DUPE:', id, cards[i]);
      seen.add(id);
    });
  }
})();
```

---

## PART 5 — ANKI BEHAVIORAL PARITY

These are the behaviors that make SRS feel like Anki. Test each manually in the UI.

### 5A. Four-Button Rating UX

After answering, the reveal must show exactly 4 rating buttons:

| Button | Label in UI | Internal rating string |
|--------|------------|----------------------|
| 🔴 | Again / Repair Point | `'again'` |
| 🟠 | Hard | `'hard'` |
| 🟢 | Good | `'good'` |
| 🔵 | Easy | `'easy'` |

**Check:** Open app → start Solo Studying → answer any card → verify all 4 buttons appear and are tappable. Keyboard shortcuts (1/2/3/4 or A/H/G/E) should trigger the correct rating.

### 5B. Interval Preview (Anki shows days on each button)

Anki displays the projected next-due date on each rating button (e.g., "Good · 3d", "Easy · 8d"). This is **not yet implemented** in Cozy Arcade but is a Phase 3 target.

**To implement:** In the reveal HTML builder, after computing intervals, render:
```javascript
function previewInterval(cardId, rating) {
  const p = getProgress(cardId);
  const ease = Number(p.ease_factor || 2.5);
  const interval = Number(p.interval_days || 0);
  if (rating === 'again') return '10 min';
  if (rating === 'hard') return `${Math.max(1, Math.round(interval * 1.2) || 1)}d`;
  if (rating === 'good') return `${interval <= 0 ? 1 : Math.max(1, Math.round(interval * ease))}d`;
  if (rating === 'easy') return `${interval <= 0 ? 4 : Math.max(4, Math.round(interval * ease * 1.3))}d`;
  return '';
}
```

### 5C. New Card Graduation (learning → review)

A new card rated `good` once should graduate to `review` stage (not stay in `learning`).

```javascript
(function() {
  const id = '__grad_test';
  window.phase3State.progress[id] = {...window.defaultProgress(id)};
  window.rateCard(id, 'good');
  const stage = window.phase3State.progress[id].stage;
  console.log(`GRADUATION: stage after first good = '${stage}' → ${stage==='review'?'PASS ✓':'FAIL ← should be review'}`);
  delete window.phase3State.progress[id];
})();
```

### 5D. Pin Does Not Affect Scheduling

Pinning a card must toggle `pinned` only — never change `interval_days`, `ease_factor`, or `next_due_at`.

```javascript
(function() {
  const id = '__pin_test';
  window.phase3State.progress[id] = {...window.defaultProgress(id), interval_days:7, ease_factor:2.5, next_due_at:'2099-01-01T00:00:00Z'};
  window.rateCard(id, 'pin');
  const p = window.phase3State.progress[id];
  const ok = p.pinned === true && p.interval_days === 7 && p.ease_factor === 2.5 && p.next_due_at === '2099-01-01T00:00:00Z';
  console.log(`PIN SAFETY: ${ok?'PASS ✓':'FAIL ← pin altered scheduling fields'}`);
  delete window.phase3State.progress[id];
})();
```

---

## PART 6 — REVIEW MODE FILTER VALIDATION

The Review screen filters must match the SRS state correctly.

```javascript
(function() {
  // Seed some known states
  const cards = window.appCards ? window.appCards().slice(0,10) : [];
  if (cards.length < 5) { console.warn('Load 5+ cards first'); return; }

  const ids = cards.map(c => window.canonicalCardId(c));
  // Set up: 2 repair points, 2 pinned, 1 due today
  window.phase3State.progress[ids[0]] = {...window.defaultProgress(ids[0]), repair_point:true};
  window.phase3State.progress[ids[1]] = {...window.defaultProgress(ids[1]), repair_point:true};
  window.phase3State.progress[ids[2]] = {...window.defaultProgress(ids[2]), pinned:true};
  window.phase3State.progress[ids[3]] = {...window.defaultProgress(ids[3]), pinned:true};
  window.phase3State.progress[ids[4]] = {...window.defaultProgress(ids[4]), next_due_at:new Date(Date.now()-1000).toISOString(), stage:'review'};

  console.log('Review filter seeds applied — now open Review screen and verify:');
  console.log('  "Repair Points" filter → should show exactly 2 cards');
  console.log('  "Pinned" filter → should show exactly 2 cards');
  console.log('  "Due" filter → should show at least 1 card');

  // Cleanup
  ids.forEach(id => delete window.phase3State.progress[id]);
})();
```

---

## PART 7 — MASTER SMOKE TEST (Run All)

Paste this single block to run every automated SRS check at once.

```javascript
(async function runSRSValidation() {
  console.group('🎮 COZY ARCADE — SRS VALIDATION SUITE');
  let totalPass = 0, totalFail = 0;

  function assert(label, condition) {
    if (condition) { console.log(`  ✓ ${label}`); totalPass++; }
    else { console.warn(`  ✗ FAIL: ${label}`); totalFail++; }
  }

  function fakeProgress(overrides = {}) {
    return { card_id:'__t', seen_count:0, correct_count:0, wrong_count:0,
      reviewed_count:0, pinned:false, buried:false, suspended:false,
      repair_point:false, stage:'new', last_rating:null, last_seen_at:null,
      next_due_at:null, interval_days:0, ease_factor:2.5, lapses:0, ...overrides };
  }

  function testRate(setup, rating, expectKey, expectVal, tolerance=0.01) {
    const id = '__t_' + Math.random().toString(36).slice(2);
    window.phase3State.progress[id] = { ...fakeProgress(), ...setup, card_id:id };
    window.rateCard(id, rating);
    const result = window.phase3State.progress[id];
    const val = result[expectKey];
    const ok = typeof expectVal === 'number'
      ? Math.abs(val - expectVal) <= tolerance
      : val === expectVal;
    delete window.phase3State.progress[id];
    return { ok, val };
  }

  console.groupCollapsed('1. SM-2 Interval Math');
  const r10 = {ease_factor:2.5,interval_days:10,stage:'review'};
  let t;
  t=testRate(r10,'again','interval_days',0);    assert('again→interval=0',t.ok);
  t=testRate(r10,'again','stage','relearning');   assert('again→stage=relearning',t.ok);
  t=testRate(r10,'again','repair_point',true);    assert('again→repair_point=true',t.ok);
  t=testRate(r10,'again','ease_factor',2.3);      assert('again→ease=2.3',t.ok);
  t=testRate(r10,'hard','interval_days',12);      assert('hard→interval=12',t.ok);
  t=testRate(r10,'hard','ease_factor',2.35);      assert('hard→ease=2.35',t.ok);
  t=testRate(r10,'good','interval_days',25);      assert('good→interval=25',t.ok);
  t=testRate(r10,'good','ease_factor',2.5);       assert('good→ease unchanged',t.ok);
  t=testRate(r10,'easy','interval_days',42);      assert('easy→interval=42',t.ok);
  t=testRate(r10,'easy','ease_factor',2.65);      assert('easy→ease=2.65',t.ok);
  console.groupEnd();

  console.groupCollapsed('2. New Card Graduation');
  t=testRate({stage:'new',interval_days:0},'good','stage','review');   assert('new+good→review',t.ok);
  t=testRate({stage:'new',interval_days:0},'good','interval_days',1);  assert('new+good→1day',t.ok);
  t=testRate({stage:'new',interval_days:0},'easy','interval_days',4);  assert('new+easy→4days',t.ok);
  console.groupEnd();

  console.groupCollapsed('3. Ease Floor 1.3');
  t=testRate({ease_factor:1.35,stage:'review',interval_days:5},'again','ease_factor',1.3); assert('ease floor ≥1.3',t.ok);
  console.groupEnd();

  console.groupCollapsed('4. Lapse Counting');
  t=testRate({stage:'new',lapses:0},'again','lapses',0);      assert('no lapse on new',t.ok);
  t=testRate({stage:'review',lapses:0},'again','lapses',1);   assert('lapse +1 on review',t.ok);
  console.groupEnd();

  console.groupCollapsed('5. Relearning Timer (~10min)');
  const id5 = '__rl5';
  window.phase3State.progress[id5] = {...fakeProgress({stage:'review',interval_days:10}), card_id:id5};
  window.rateCard(id5,'again');
  const mins = (Date.parse(window.phase3State.progress[id5].next_due_at)-Date.now())/60000;
  assert('again due in 5-20 min', mins>5 && mins<20);
  delete window.phase3State.progress[id5];
  console.groupEnd();

  console.groupCollapsed('6. Pin Safety');
  t=testRate({interval_days:7,ease_factor:2.5,next_due_at:'2099-01-01T00:00:00.000Z'},'pin','pinned',true); assert('pin toggles pinned',t.ok);
  t=testRate({interval_days:7,ease_factor:2.5},'pin','interval_days',7); assert('pin preserves interval',t.ok);
  t=testRate({interval_days:7,ease_factor:2.5},'pin','ease_factor',2.5); assert('pin preserves ease',t.ok);
  console.groupEnd();

  console.groupCollapsed('7. isDue Logic');
  if (window.isDue) {
    const now = new Date();
    assert('null next_due=false',  !window.isDue(fakeProgress({next_due_at:null})));
    assert('past due=true',         window.isDue(fakeProgress({next_due_at:new Date(now-1000).toISOString()})));
    assert('future due=false',     !window.isDue(fakeProgress({next_due_at:new Date(now+86400000).toISOString()})));
    assert('repair_point=always due', window.isDue(fakeProgress({repair_point:true,next_due_at:new Date(now+86400000).toISOString()})));
    assert('relearning=always due',   window.isDue(fakeProgress({stage:'relearning',next_due_at:new Date(now+86400000).toISOString()})));
  } else {
    console.warn('  ⚠️ isDue not exposed on window — add: window.isDue = isDue; near line 11305');
    totalFail += 5;
  }
  console.groupEnd();

  console.groupCollapsed('8. localStorage Key');
  const lsKeys = Object.keys(localStorage).filter(k => k.startsWith('cozy'));
  const correctKey = lsKeys.includes('cozy_arcade_progress_v1');
  assert('cozy_arcade_progress_v1 exists', correctKey);
  const noLegacy = !lsKeys.some(k => k !== 'cozy_arcade_progress_v1' && k !== 'cozy_debug');
  assert('no stale cozy_ keys', noLegacy);
  if (!noLegacy) console.warn('  Legacy keys found:', lsKeys.filter(k=>k!=='cozy_arcade_progress_v1'&&k!=='cozy_debug'));
  console.groupEnd();

  console.groupCollapsed('9. canonicalCardId Uniqueness');
  const allCards = window.appCards ? window.appCards() : [];
  if (allCards.length > 0) {
    const ids9 = allCards.map(c => window.canonicalCardId(c));
    const uniq9 = new Set(ids9);
    assert(`${allCards.length} cards have unique IDs`, ids9.length === uniq9.size);
  } else {
    console.warn('  ⚠️ Load a deck to test ID uniqueness');
  }
  console.groupEnd();

  console.groupEnd();
  const emoji = totalFail === 0 ? '✅' : '❌';
  console.log(`${emoji} SRS VALIDATION: ${totalPass} passed, ${totalFail} failed`);
  if (totalFail > 0) console.warn('Fix failures before marking Phase 2 complete.');
  return { pass: totalPass, fail: totalFail };
})();
```

**EXPECTED OUTPUT:**
```
✅ SRS VALIDATION: 27 passed, 0 failed
```

---

## PART 8 — KNOWN ISSUES & FIXES

### Issue 1: `isDue` not exposed to window
**Symptom:** Part 7 of master test skips 5 checks.  
**Fix:** In `index.html` near line 11305, add:
```javascript
window.isDue = isDue;
```

### Issue 2: `dueScore` has 3 competing implementations
**Symptom:** `dueScore`, `dueScore350`, `dueScore352`, `dueScoreHot` all exist. Wrong one may run.  
**Current workaround:** `dueScoreHot` cascades through all — this is correct behavior.  
**Phase 3 fix:** Consolidate to single `dueScore()` + `window.dueScore = dueScore`.

### Issue 3: `hard` rating buries card immediately
**Current behavior:** `buried = true` for `hard`.  
**Anki behavior:** Hard cards stay in the same session queue, just deprioritized.  
**If this feels wrong:** Change `buried = true` → `buried = false` in the `hard` branch and add to `session.buriedToday` only after 2nd consecutive hard.

### Issue 4: `good` on first card gives interval=1 day
**Current behavior:** First `good` → 1 day. Second `good` → round(1 * ease) = ~2-3 days.  
**Anki behavior:** Learning steps (1min → 10min → graduated). Cozy Arcade skips learning steps.  
**This is intentional simplification.** For boards, faster graduation is correct.

### Issue 5: No interval preview on rating buttons
**Missing:** Buttons don't show "Good · 3d" like Anki does.  
**Fix location:** Find the reveal HTML builder (search `bindRatings`), add `previewInterval()` output from Part 5B above.

---

## PART 9 — INTEGRATION CHECKLIST

Run these end-to-end in the browser before shipping Phase 2:

- [ ] Load `ABIM_DATABASE_v17_CLEAN_EXPORT.json` — import summary shows 1,249 cards
- [ ] Start Solo Studying → answer 5 cards with 4 different ratings → check progress panel
- [ ] Rate same card `again` → leave app → return after 1 min → card should appear as due
- [ ] Rate card `easy` → card should NOT reappear in current session
- [ ] Open Review → "Repair Points" filter shows only `again`/`hard` rated cards
- [ ] Export progress → re-import → ratings preserved
- [ ] Run master smoke test (Part 7) → 27/27 pass
- [ ] `window.runCozySmokeTests()` → 15/15 or 20/20 pass

---

## QUICK REFERENCE — SM-2 VALUES

```
Rating  | Ease Δ  | Interval formula              | Stage after   | repair_point | buried
--------|---------|-------------------------------|---------------|--------------|-------
again   | -0.20   | 0 (back to 10-min queue)      | relearning    | true         | false
hard    | -0.15   | max(1, round(i × 1.2))        | review        | true         | true
good    | ±0      | i≤0 → 1 else max(1, round(i×e)) | review      | false        | true
easy    | +0.15   | i≤0 → 4 else max(4, round(i×e×1.3)) | review  | false        | true
pin     | none    | unchanged                     | unchanged     | unchanged    | unchanged

ease_factor floor: 1.3 (never lower)
ease_factor default: 2.5
interval_days default: 0 (new card)
relearning step: 10 minutes
localStorage key: cozy_arcade_progress_v1
```

---

*SRS_VALIDATION_PROMPT_v1.md · Cozy Arcade Board Prep · Phase 2 · 2026-05-21*
