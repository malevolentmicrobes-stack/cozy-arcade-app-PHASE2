# CODEX PROMPT 9 — Revert FQ-ALGO-7 (Again-card pool reshuffle regression)
**Paste block below into Codex. ~40 lines.**

**Context:** 22260dc (2026-06-17) changed rateCard's again-branch from a pool-splice to a full
pool reset. In the default `solo_order:'random_new'`, this reshuffles the entire new-card queue
on every Again press and does NOT requeue the missed card (it's already stage='relearning' by
the time the reset fires, so it fails the `isNewCard` filter). User reported the app "acting
different since last played" — this is the confirmed root cause (OPEN_DIFFERENTIALS FQ-ALGO-7).
**Decision: revert, do not fix-forward.** Smallest safe change, not a new design.

---

```
REVERT — FQ-ALGO-7. PHASE2 primary, then PHASE1.
GATES: runFSRSValidation()17/17 runCozySmokeTests()6/6 first, both repos.

In rateCard()'s 'again' branch, find:
  if(rating==='again'){session.seenThisSession.delete(cardId);session.poolKey='';session.pool=[];}

Replace with the pre-22260dc splice-to-front behavior:
  if(rating==='again'){
    session.seenThisSession.delete(cardId);
    try{
      const pool=session.pool;
      if(Array.isArray(pool)){
        const idx=pool.findIndex(c=>canonicalCardId(c)===cardId);
        if(idx>0){const[c]=pool.splice(idx,1);pool.unshift(c);}
        else if(idx===-1&&window.cards){
          const c=window.cards.find(c=>canonicalCardId(c)===cardId);
          if(c) pool.unshift(c);
        }
      }
    }catch(_){}
  }

Do NOT attempt to fix the splice's known limitation (nextCard uses pool[index%length], so
pool[0] only gets picked once index wraps — that's FQ-ALGO-4's original note, out of scope here).
This is a straight revert restoring known, non-disruptive prior behavior.

Port to PHASE1: grep PHASE1's own index.html for "poolKey=''" — do not assume PHASE2's line
number. Apply the equivalent revert there.

Bump sw.js CACHE in both repos. Commit PHASE2 and PHASE1 SEPARATELY.

VALIDATE: runFSRSValidation 17/17 + runCozySmokeTests 6/6 in both repos after revert. Browser-
confirm: rate a card 'again', the queue does not visibly reshuffle/jump on that single action.

REPORT: commit hashes both repos, gate results.
```
