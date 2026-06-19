# Codex Prompt 3 — Pool Recirculation & Shadow Dungeon Fix
# Cozy Arcade PHASE2 + PHASE1 | under 80 lines | no CDP infra

## CONTEXT
Single-file PWA (index.html). FSRS v5. Confirmed user symptom: cards answered correctly
(good/easy) circle back in the same session. Export shows 104-1-8626 seen 9×(easy, due+24h).
Two confirmed root causes + one render validation needed.

## GATES — run first, stop if either fails
```javascript
window.runFSRSValidation()  // must be 17/17
window.runCozySmokeTests()  // must be 6/6
```

## PART 1 — VALIDATE RENDER FIXES (read-only, no patch if passing)

```javascript
// FQ-RENDER-1: selectSolo must fire exactly once per card drop
let _ss=0; const _sso=window.selectSolo;
window.selectSolo=function(){_ss++;console.log('SS#'+_ss,Date.now());return _sso.apply(this,arguments);};
// Start Solo, let one card auto-select at timer expiry. Check console.
// PASS: SS#1 logged once. FAIL: SS#1 then SS#2 within 200ms → dual-fire still active.

// FQ-RENDER-3: soloQuestion must be written exactly once per card (bionic path)
let _writes=0;
const _obs=new MutationObserver(()=>_writes++);
_obs.observe(document.getElementById('soloQuestion'),{childList:true,subtree:true,characterData:true});
// Start Solo, let one card load fully. Then:
console.log('soloQuestion writes:', _writes, '(expect 1)');
// FAIL if _writes > 1 → triple-writer still active
```
Report pass/fail for each. If FAIL, do not patch render yet — report only.

## PART 2 — FIX FQ-POOL-1: pinned cards recirculate every pool pass

Pinned cards satisfy `isDue(p) || p.pinned` filter permanently. After rating good/easy,
they should enter `session.buriedToday` so pool building pushes them to back/excludes.

Find `rateCard` in Phase 3 (search: `function rateCard(cardId, rating)`).
In the `good/hard/easy` branch, `buried` local var is already `true`.
Verify `session.buriedToday.add(cardId)` fires at line ~11268.
Then find `cardPool` pool-building for non-'due' scopes (~line 11497-11535).

**The actual gap:** non-'due' scopes (random, spaced, new_first, reviewed_first) call
`splitBuriedToBack(refreshed)` or return `shuffleCards(...)` WITHOUT filtering
`session.seenThisSession`. Find the base return at line ~11535:
```javascript
return shuffleCards(applyStudyFiltersPhase3(basePlayableCards()));
```
Fix: filter out seenThisSession cards from the base shuffle:
```javascript
const base = applyStudyFiltersPhase3(basePlayableCards())
  .filter(c => !session.seenThisSession.has(canonicalCardId(c)));
return shuffleCards(base.length ? base : applyStudyFiltersPhase3(basePlayableCards()));
```

## PART 3 — FIX FQ-DATA-1: repair_point never cleared on correct answer

Find `rateCard` setProgress call (~line 11269). Current `repair` value:
- `again`: `repair = true`
- `hard`: `repair = true` (rating === 'hard')
- `good` / `easy`: `repair = false` ← this is correct but only for NEW occurrences

The bug: `repair_point` in stored progress is SET when again fires but never explicitly
cleared when good/easy fires on a card that already has `repair_point: true`.
`setProgress` merges with existing — so if `repair_point` was true before and setProgress
only sets `repair_point: false` for hard/good/easy, it should clear. Verify this is the case.

If `setProgress` does a merge that preserves old `repair_point`:
```javascript
// In the good/easy/hard branch, explicitly pass repair_point: false when rating is good/easy:
repair = (rating === 'hard');  // already correct — verify this writes repair_point:false
```
Run browser check after fix:
```javascript
delete window.phase3State.progress['rp-repair-test'];
window.phase3State.progress['rp-repair-test']={stage:'new',repair_point:true};
window.rateCard('rp-repair-test','good');
setTimeout(()=>{
  const p=window.getProgress('rp-repair-test');
  console.log('repair_point after good:', p.repair_point, '(expect false)');
},200);
```

## PART 4 — BROWSER SMOKE AFTER EACH FIX
```javascript
window.runFSRSValidation()  // 17/17 after each change
window.runCozySmokeTests()  // 6/6 after each change
```

## PART 5 — POOL RECIRCULATION REGRESSION TEST
```javascript
// Seed a card, rate good, confirm it does NOT reappear in pool
(()=>{
  const id='pool-recir-test';
  delete window.phase3State.progress[id];
  window.rateCard(id,'good');
  // Check buriedToday contains it:
  console.log('buriedToday has card:', window.cozyPhase3Session?.buriedToday?.has(id), '(expect true)');
  // Check seenThisSession:
  window.cozyPhase3Session?.seenThisSession?.add(id);
  // Rebuild pool and check card absent:
  window.cozyPhase3Session.poolKey='';
  const pool = window.cardPool ? window.cardPool() : [];
  const found = pool.some(c => window.canonicalCardId(c)===id);
  console.log('card in pool after good rating:', found, '(expect false)');
})();
```

## EXPECTED RESULTS
- FQ-RENDER-1: SS#1 once per card
- FQ-RENDER-3: soloQuestion writes = 1
- FQ-POOL-1: card absent from pool after good rating
- FQ-DATA-1: repair_point=false after good rating
- All gates: 17/17 + 6/6

## IF RENDER FIXES FAIL
Report only. Do NOT patch render in this prompt — a separate prompt covers FQ-RENDER-1/3.

## PORT RULE
Apply all passing fixes to PHASE1 (cozy-arcade-app/index.html) in the same prompt.
Bump sw.js CACHE separately: PHASE2 v20→v21, PHASE1 v55→v56.
