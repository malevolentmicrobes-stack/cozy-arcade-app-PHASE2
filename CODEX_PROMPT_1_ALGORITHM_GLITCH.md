# Codex Prompt 1 — Browser Test: Algorithm Glitch
# Cozy Arcade PHASE2 + PHASE1 | under 80 lines | no CDP infra

## CONTEXT
Single-file PWA (`index.html`). FSRS v5 spaced repetition. Key fixes already applied:
- FQ-ALGO-1: explicit rating now cancels deferred auto-rate (commit 048d073)
- FQ-DUE-1: `getStudyPool('due')` now filters to `isDue(p)||pinned` before sort

## TASK
Open `index.html` in a local HTTP server (both PHASE2 and PHASE1). Run these tests in-browser console.

---

### GATE 0 — Validation suite must pass first
```javascript
window.runFSRSValidation()   // must return 17/17 — STOP if not
window.runCozySmokeTests()   // must return 6/6 — STOP if not
```

### TESTS A–I — Rating matrix (explicit click path)
For each test: delete progress key, set `current`/`choices`, call `selectSolo(0)`, wait for delay,
then call `rate(current, RATING)`, wait 10.5s total, then read `getProgress(current.id)`.

```javascript
// Helper — run before each test:
function setupCard(id){
  delete window.phase3State.progress[id];
  window.current={id,qid:id,diagnosis:'Test',presentation:'Test',sys:'GEN'};
  window.choices=['Test','X','Y','Z'];
}

// A: auto-correct (no explicit rating, wait 10s)
setupCard('t-A'); selectSolo(0);
setTimeout(()=>{ const p=getProgress('t-A'); console.log('A:',p.last_rating, p.stage); },10200);
// expect: last_rating=good, stage=review

// B: auto-wrong then no click (timer fires rateCard(again))
setupCard('t-B'); selectSolo(1);
setTimeout(()=>{ const p=getProgress('t-B'); console.log('B:',p.last_rating, p.stage); },10200);
// expect: last_rating=again, stage=relearning

// C: explicit Again (cancel deferred auto-rate)
setupCard('t-C'); selectSolo(0);
setTimeout(()=>rate(current,'again'), 300);
setTimeout(()=>{ const p=getProgress('t-C'); console.log('C:',p.last_rating, p.stage); },10500);
// expect: last_rating=again, stage=relearning (NOT good)

// D: explicit Hard
setupCard('t-D'); selectSolo(0);
setTimeout(()=>rate(current,'hard'), 300);
setTimeout(()=>{ const p=getProgress('t-D'); console.log('D:',p.last_rating, p.interval); },10500);
// expect: last_rating=hard, interval=1

// E: explicit Good
setupCard('t-E'); selectSolo(0);
setTimeout(()=>rate(current,'good'), 300);
setTimeout(()=>{ const p=getProgress('t-E'); console.log('E:',p.last_rating, p.interval); },10500);
// expect: last_rating=good, interval=3

// F: explicit Easy
setupCard('t-F'); selectSolo(0);
setTimeout(()=>rate(current,'easy'), 300);
setTimeout(()=>{ const p=getProgress('t-F'); console.log('F:',p.last_rating, p.interval); },10500);
// expect: last_rating=easy, interval>=10

// G: Again twice (both explicit)
setupCard('t-G'); selectSolo(0);
setTimeout(()=>rate(current,'again'), 300);
setTimeout(()=>{ setupCard('t-G'); selectSolo(0); setTimeout(()=>rate(current,'again'),300); },12000);
setTimeout(()=>{ const p=getProgress('t-G'); console.log('G:',p.last_rating, p.stage); },24000);
// expect: last_rating=again, stage=relearning

// H: getStudyPool('due') — must NOT include future-due cards
(()=>{
  const pool = window.getStudyPool ? window.getStudyPool('due') : [];
  const bad = pool.filter(c=>{
    const p = window.getProgress ? getProgress(window.canonicalCardId(c)) : null;
    return p && p.next_due_at && new Date(p.next_due_at) > new Date();
  });
  console.log('H: future-due in due-pool =', bad.length, '(expect 0)');
})();

// I: Shadow Dungeon due mode inherits same fix
(()=>{
  const sd = window.shadowModeMap && window.shadowModeMap['due'];
  const pool = window.getStudyPool ? window.getStudyPool(sd||'due') : [];
  const bad = pool.filter(c=>{
    const p = window.getProgress ? getProgress(window.canonicalCardId(c)) : null;
    return p && p.next_due_at && new Date(p.next_due_at) > new Date();
  });
  console.log('I: Shadow/due future-due count =', bad.length, '(expect 0)');
})();
```

// J: repair_point cleared on correct answer (FQ-DATA-1)
(()=>{
  const id='rp-j-test';
  delete window.phase3State.progress[id];
  window.phase3State.progress[id]={stage:'new',repair_point:true,last_rating:null,seen_count:0,reviewed_count:0};
  window.current={id,qid:id,diagnosis:'RepairTest',presentation:'T',sys:'GEN'};
  window.choices=['RepairTest','X','Y','Z'];
  selectSolo(0);
  setTimeout(()=>rate(current,'good'),300);
  setTimeout(()=>{const p=getProgress(id);console.log('J: repair_point=',p.repair_point,'(expect false)');},600);
})();

// K: wrong_count not inflated when user selects correct lane then clicks Again (FQ-DATA-2)
(()=>{
  const id='rp-k-test';
  delete window.phase3State.progress[id];
  window.current={id,qid:id,diagnosis:'WrongCtTest',presentation:'T',sys:'GEN'};
  window.choices=['WrongCtTest','X','Y','Z'];
  selectSolo(0);
  setTimeout(()=>rate(current,'again'),300);
  setTimeout(()=>{
    const p=getProgress(id);
    console.log('K: correct_count=',p.correct_count,'wrong_count=',p.wrong_count,'(expect correct=1 wrong=0)');
  },600);
})();

// L: stability written after good review of existing review-stage card (FQ-ALGO-5)
(()=>{
  const existId=Object.keys(window.phase3State.progress||{}).find(k=>{
    const p=window.phase3State.progress[k];
    return p&&p.stage==='review'&&!p.stability&&p.reviewed_count>0;
  });
  if(existId){
    rateCard(existId,'good');
    setTimeout(()=>{const p=getProgress(existId);console.log('L: stability=',p.stability,'(expect non-null)');},300);
  } else { console.log('L: no eligible card found'); }
})();

// M: card-000X ghost cards not in due pool (FQ-DATA-3)
(()=>{
  const pool=window.getStudyPool?getStudyPool('due'):[];
  const ghosts=pool.filter(c=>String(canonicalCardId(c)).match(/^card-\d+$/));
  console.log('M: ghost cards in due pool =',ghosts.length,'(expect 0)');
})();

## EXPECTED RESULTS
A=good/review, B=again/relearning, C=again/relearning, D=hard/interval=1,
E=good/interval=3, F=easy/interval>=10, G=again/relearning, H=0, I=0,
J=repair_point=false, K=correct=1/wrong=0, L=stability≠null, M=0

## IF ANY FAIL
Report exact `getProgress()` output for failing tests. Do NOT patch without reporting first.
Tests J/K/L/M are new from 2026-06-15 progress export audit — fix these after H/I pass.
Port ALL fixes to PHASE1 only after PHASE2 validates all 13 tests.
