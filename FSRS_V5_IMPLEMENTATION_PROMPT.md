# FSRS v5 Implementation — Safe Validation Prompt

Use this as the Claude Code terminal prompt for P3 FSRS v5.
Do NOT start Phase 4 until Phase 3 browser validation passes.

## Exact Test Vectors (computed from reference weights)

```
W = [0.4072,1.1829,3.1262,15.4722,7.2102,0.5316,1.0651,0.0589,
     1.5330,0.1544,0.9956,1.9783,0.1542,0.4683,0.5825,0.0000,
     2.7869,0.4527,0.6632]

FIRST REVIEW:
  again → S=0.4072  D=7.2102  interval=1d
  hard  → S=1.1829  D=6.5085  interval=1d
  good  → S=3.1262  D=5.3146  interval=3d
  easy  → S=15.4722 D=3.2829  interval=15d

SECOND REVIEW (rated good on schedule):
  [was again] S: 0.41→2.09  D: 7.21→6.98  interval=2d
  [was hard]  S: 1.18→2.12  D: 6.51→6.32  interval=2d
  [was good]  S: 3.13→6.94  D: 5.31→5.19  interval=7d
  [was easy]  S: 15.47→36.78 D: 3.28→3.28 interval=37d

EARLY REVIEW (S=3.13, D=5.315, 1 day early):
  again → S: 3.13→1.47  D: 5.32→7.20  interval=0 (10-min)
  hard  → S: 3.13→3.13  D: 5.32→6.20  interval=3d  (W[15]=0, no gain)
  good  → S: 3.13→3.13  D: 5.32→5.20  interval=3d
  easy  → S: 3.13→6.45  D: 5.32→4.19  interval=6d
```

## Error Catalog

| Error | Trigger | Fix |
|-------|---------|-----|
| `p.stability` undefined on SM-2 migrated card | First FSRS review of old card | Default: `stability = Math.max(p.interval_days\|\|0, 1)`, `difficulty = 5.0` |
| `t=0` elapsed days → `S'_r = 0` | Card rated twice same day | Floor: `Math.max(0.001, elapsedDays)` |
| `runSRSValidation()` SM-2 tests fail | Phase 4 complete | Expected — SM-2 math is replaced. `runFSRSValidation()` must pass instead |
| `previewInterval()` mismatch | Phase 4 only touched `rateCard()` | Fix `previewInterval()` in same commit |
| `W[15]=0` hard cards show no stability gain | By design in FSRS v5 | Not a bug — hard cards penalize difficulty only |

## Session Prompt (paste into Claude Code terminal)

```
READ FIRST before any edits:
1. index.html — find the script block containing rateCard() (around line 11370)
2. Confirm: function rateCard, function isDue, function getStudyPool are all present
3. Read COZY_ARCADE_PROJECT_STATUS_2026-05-25.md — Iron Rules section

GOAL: Implement FSRS v5 scheduling as drop-in for rateCard() in index.html.

IRON RULES (violating any = reject entire change):
- DO NOT rename or rewrite: rateCard, rate, advance, fullCard, saveState,
  updateKpis, canonicalCardId, importDeck
- DO NOT add a new <script> block — all edits inside existing rateCard() block
- localStorage keys must never change
- All edits in-place only

═══════════════════════════════════════════════════════
PHASE 1 — Write FSRS helpers (no changes to rateCard yet)
═══════════════════════════════════════════════════════

Immediately BEFORE "function rateCard(" insert:

  const FSRS_W=[0.4072,1.1829,3.1262,15.4722,7.2102,0.5316,1.0651,0.0589,
                1.5330,0.1544,0.9956,1.9783,0.1542,0.4683,0.5825,0.0000,
                2.7869,0.4527,0.6632];
  const FSRS_RETENTION=0.9;
  function fsrsRating(r){return {again:1,hard:2,good:3,easy:4}[r]||3;}
  function fsrsClamp(v,lo,hi){return Math.max(lo,Math.min(hi,v));}
  function fsrsInitStability(r){return Math.max(0.1,FSRS_W[fsrsRating(r)-1]);}
  function fsrsInitDifficulty(r){
    const ri=fsrsRating(r);
    return fsrsClamp(FSRS_W[4]-Math.exp(FSRS_W[5]*(ri-1))+1,1,10);
  }
  function fsrsRetrievability(elapsedDays,S){
    return Math.exp(Math.log(FSRS_RETENTION)*Math.max(0.001,elapsedDays)/Math.max(0.1,S));
  }
  function fsrsNextInterval(S){return Math.max(1,Math.round(S));}
  function fsrsRecallStability(D,S,Rv,r){
    const ri=fsrsRating(r);
    const hard_p=ri===2?FSRS_W[15]:1, easy_b=ri===4?FSRS_W[16]:1;
    const val=S*Math.exp(FSRS_W[8])*(11-D)*Math.pow(S,-FSRS_W[9])
             *(Math.exp(FSRS_W[10]*(1-Rv))-1)*hard_p*easy_b;
    return Math.max(S,val);
  }
  function fsrsForgetStability(D,S,Rv){
    const val=FSRS_W[11]*Math.pow(D,-FSRS_W[12])
             *(Math.pow(S+1,FSRS_W[13])-1)*Math.exp(FSRS_W[14]*(1-Rv));
    return fsrsClamp(val,0.1,S-0.1);
  }
  function fsrsUpdateDifficulty(D,r){
    const ri=fsrsRating(r);
    const D0e=fsrsClamp(FSRS_W[4]-Math.exp(FSRS_W[5]*3)+1,1,10);
    return fsrsClamp(FSRS_W[7]*D0e+(1-FSRS_W[7])*(D-FSRS_W[6]*(ri-3)),1,10);
  }

═══════════════════════════════════════════════════════
PHASE 2 — Add runFSRSValidation() immediately after helpers
═══════════════════════════════════════════════════════

  window.runFSRSValidation=function(){
    const pass=[],fail=[];
    function check(label,got,exp,tol=0.05){
      const ok=Math.abs(Number(got)-Number(exp))<=tol;
      (ok?pass:fail).push({label,got,exp});
    }
    check('S0 again', fsrsInitStability('again'),  0.4072,0.001);
    check('S0 hard',  fsrsInitStability('hard'),   1.1829,0.001);
    check('S0 good',  fsrsInitStability('good'),   3.1262,0.001);
    check('S0 easy',  fsrsInitStability('easy'),  15.4722,0.001);
    check('D0 again', fsrsInitDifficulty('again'), 7.2102,0.01);
    check('D0 hard',  fsrsInitDifficulty('hard'),  6.5085,0.01);
    check('D0 good',  fsrsInitDifficulty('good'),  5.3146,0.01);
    check('D0 easy',  fsrsInitDifficulty('easy'),  3.2829,0.01);
    check('int good', fsrsNextInterval(fsrsInitStability('good')),  3);
    check('int easy', fsrsNextInterval(fsrsInitStability('easy')), 15);
    const Rv=fsrsRetrievability(3,3.1262);
    check('R on schedule',Rv,0.9038,0.005);
    const S2=fsrsRecallStability(5.3146,3.1262,Rv,'good');
    check('S good->good',S2,6.9371,0.05);
    check('int good->good',fsrsNextInterval(S2),7);
    const Rv2=fsrsRetrievability(1,3.1262);
    const Sf=fsrsForgetStability(5.315,3.1262,Rv2);
    check('S early again',Sf,1.4685,0.05);
    const Se=fsrsRecallStability(5.315,3.1262,Rv2,'easy');
    check('easy bonus',Se>3.1262*2,1);
    check('D update good',fsrsUpdateDifficulty(5.315,'good'),5.195,0.05);
    check('D update again',fsrsUpdateDifficulty(5.315,'again'),7.20,0.05);
    const passed=pass.length,total=pass.length+fail.length;
    console.log(`${passed===total?'✅':'❌'} FSRS: ${passed}/${total} passed`);
    if(fail.length) console.table(fail);
    return {passed,total,failed:fail};
  };

═══════════════════════════════════════════════════════
PHASE 3 — VALIDATION GATE
Run: node --check on the script block containing these additions.
Commit: "feat(fsrs): add fsrs v5 helpers + runFSRSValidation"
Browser: window.runFSRSValidation() → must show ✅ FSRS: 17/17 passed
STOP if any test fails. Do not proceed to Phase 4.
═══════════════════════════════════════════════════════

PHASE 4 — Swap rateCard() internals (only after Phase 3 ✅)

Inside rateCard(), replace the SM-2 math section only
(from "const now = new Date();" through the closing brace before
"session.seenThisSession.add(cardId)").

Rules:
1. Keep pin/bury early-return unchanged
2. Keep "const now = new Date();" and variable declarations
3. Detect migration: const stability=Number(p.stability||Math.max(p.interval_days||0,1));
                     const difficulty=Number(p.difficulty||(p.ease_factor?
                       fsrsClamp((2.5-p.ease_factor)*10+5,1,10):5.0));
4. For 'again': nextDue=addMinutes(now,10), stage='relearning', repair=true,
   newStability=p.stability?fsrsForgetStability(difficulty,stability,currentR):fsrsInitStability('again'),
   newDifficulty=p.stability?fsrsUpdateDifficulty(difficulty,'again'):fsrsInitDifficulty('again')
5. For hard/good/easy: compute fsrsRecallStability/fsrsUpdateDifficulty/fsrsNextInterval
6. interval_days = FSRS interval (keeps isDue/hasFutureDue working)
7. ease_factor: keep writing it (backward compat) — set to 2.5 always
8. Add to setProgress() call: stability:newStability, difficulty:newDifficulty, retrievability:currentR
9. Update previewInterval() easy/hard/good branches to use fsrsNextInterval(fsrsRecallStability(...))

After Phase 4:
- window.runFSRSValidation() → ✅ 17/17
- window.runSRSValidation() → SM-2 tests will show different numbers (expected)
- window.runCozySmokeTests() → ✅ 6/6 (structural tests, not math)
- Commit: "feat(fsrs): replace rateCard SM-2 math with FSRS v5"
```
