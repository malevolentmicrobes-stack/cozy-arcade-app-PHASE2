# Codex Prompt 2 — Browser Test: Hard Reset Save Issue
# Cozy Arcade PHASE2 + PHASE1 | under 80 lines | no CDP infra

## CONTEXT
State survives Command+R because it is in localStorage, NOT cookies. Only DevTools → Clear site data resets fully.
Recent debulking removed dead localStorage writes. This test verifies clean key hygiene and deck restore.

Canonical keys (must exist after save):
- `cozy_arcade_state_v3` — canonical progress (Phase 3)
- `cozy_arcade_progress_v1` — progress mirror
- `cozy_arcade_limitless_cards_v1` — deck
- `cozy_arcade_persona_v1` — persona
- `cozyQuestionSeconds351` — timer setting
- `soloStudying_spacedOn_v175153` — spaced mode toggle
- `bionicOn_v1751523` — bionic toggle

Dead keys (must NOT be written after debulking):
- `soloStudyingState_v1757` — removed from savePhase3State
- `cazy_v3` — removed from Atlas STATE_KEYS
- `soloStudying_spacedOn_v1759` — dead duplicate
- `soloStudying_spacedOn_v175157` — dead duplicate
- `cozy_persona` — dead duplicate

---

## TESTS — Run in browser console (both PHASE2 and PHASE1)

### STEP 1 — Baseline key audit before any action
```javascript
const CHECK = ['cozy_arcade_state_v3','cozy_arcade_progress_v1','cozy_arcade_limitless_cards_v1',
  'cozy_arcade_persona_v1','cozyQuestionSeconds351','soloStudying_spacedOn_v175153','bionicOn_v1751523'];
const DEAD = ['soloStudyingState_v1757','cazy_v3','soloStudying_spacedOn_v1759',
  'soloStudying_spacedOn_v175157','cozy_persona'];
console.log('--- CANONICAL ---');
CHECK.forEach(k=>console.log(k,'=',localStorage.getItem(k)?.slice(0,60)));
console.log('--- DEAD (should be null) ---');
DEAD.forEach(k=>console.log(k,'=',localStorage.getItem(k)));
```

### STEP 2 — Force a save then re-audit dead keys
```javascript
// Trigger a save:
if(typeof savePhase3State==='function') savePhase3State();
console.log('--- DEAD KEYS AFTER SAVE (all must be null) ---');
const DEAD=['soloStudyingState_v1757','cazy_v3','soloStudying_spacedOn_v1759',
  'soloStudying_spacedOn_v175157','cozy_persona'];
DEAD.forEach(k=>console.log(k,'=',localStorage.getItem(k)));
```

### STEP 3 — Simulate hard reload (Command+R equivalent)
Rate a card, note its progress, reload the page, re-read progress.
```javascript
// Before reload — pick a card and rate it, then record:
const testId = window.appCards && appCards()[0] && canonicalCardId(appCards()[0]);
if(testId){ rateCard(testId,'good'); }
setTimeout(()=>{
  const p = getProgress(testId);
  console.log('PRE-RELOAD last_rating=',p?.last_rating,'interval=',p?.interval);
  console.log('Reload the page now (Command+R), then run STEP 3b');
},500);

// STEP 3b — After reload, paste this:
const testId = /* paste same testId string here */ null;
if(testId){
  const p = getProgress(testId);
  console.log('POST-RELOAD last_rating=',p?.last_rating,'interval=',p?.interval);
  // expect same values as pre-reload
}
```

### STEP 4 — Deck/progress consistency check
```javascript
(()=>{
  const cards = window.appCards ? appCards() : [];
  const progress = window.phase3State?.progress || {};
  const cardIds = new Set(cards.map(c=>canonicalCardId(c)));
  const orphans = Object.keys(progress).filter(id=>!cardIds.has(id));
  console.log('Total cards:', cards.length);
  console.log('Total progress rows:', Object.keys(progress).length);
  console.log('Orphan progress rows (no matching card):', orphans.length);
  console.log('Cards with null next_due_at (review stage):', 
    Object.values(progress).filter(p=>p.stage==='review'&&!p.next_due_at).length);
})();
// Healthy: orphans near 0; null-due review rows < 5
```

## EXPECTED RESULTS
- DEAD keys: all null after save
- POST-RELOAD progress: matches pre-reload (same last_rating + interval)
- Orphan progress rows: 0 or very low (no "Cards 0 / Reviewed 93" discrepancy)

## IF DEAD KEYS ARE NOT NULL
Report which key still has a value. Search `index.html` for that key string and find the write.
Do NOT patch without reporting. Port fix to PHASE1 only after PHASE2 passes all steps.
