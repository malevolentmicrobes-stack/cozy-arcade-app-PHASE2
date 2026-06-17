# Cozy Arcade — Dev Day Plan 2026-06-16
PHASE2 SW v24 (948abe7) | PHASE1 SW v59 (2e04efd) | Repo: cozy-arcade-app-PHASE2 | Updated: 2026-06-17

---

## TOKEN BUDGET ANALYSIS (prior Codex runs)
- P3 wasted ~40% tokens on Playwright setup (3 fail loops). Fix: safaridriver curl = 0 setup cost.
- P3 wasted ~15% on re-discovering pool code. Fix: give exact lines below.
- P4 must: exact file+line → change → paste test → done. No exploration.

---

## DIFFERENTIAL: BROWSER RUNTIME vs HTML SOURCE BUGS

Bugs invisible in HTML grep, only surface in live browser:

| # | Source | Symptom |
|---|---|---|
| D1 | Closure capture order | System 0 `bionic` = old ref (line 838); `window.bionic` updated later by patch |
| D2 | 3 RAF handles, 2 clearers | `raf`/`raf175164`/`soloStableRaf351` — `clearSoloDrop` only kills `raf175164` |
| D3 | Timer drift | System 0 `DROP_MS=7000` hardcoded; System 3 reads localStorage; both fire at 7s ± 10ms |
| D4 | MutationObserver inflation | 1 innerHTML swap → N callbacks (one per child node). 8 callbacks ≠ 8 writes |
| D5 | SW cache stale | Old SW serves old HTML after push; CACHE bump forces eviction |
| D6 | sessionPool stale | Pool built at session start; `again` cards don't splice back in same session |
| D7 | seenThisSession accumulation | Set grows all session; new session needed to reset |
| D8 | 18 null next_due_at rows | `isDue()=true` always for those cards; invisible in source |
| D9 | Wrapper chain depth | 11 selectSolo layers; each has own cancel logic; not all cross-cancel |
| D10 | selectSolo double-write | Both wrappers call `record()` on same card if fired twice |

---

## DAY PLAN

```
PHASE 1 — RENDER FIX (2 line changes) ← DO FIRST
  1.1  Run Codex P4 (prompt below)
  1.2  Verify safaridriver test: SS#1 once, soloQuestion writes ≤ 2
  1.3  Commit, push PHASE2 public, bump SW v21→v22 / v56→v57

PHASE 2 — DATA REPAIR (18 null rows)
  2.1  Run Codex P5 (prompt below)
  2.2  Verify: no cards stuck in always-due
  2.3  Commit, push both repos

PHASE 3 — AGAIN REQUEUE (Anki gap)
  3.1  Run Codex P6 (prompt below)
  3.2  Verify: again card appears next after current
  3.3  Commit, push both repos

PHASE 4 — DOCS + HANDOFF
  4.1  Update project status doc with new SW versions + fixes
  4.2  Update CLAUDE_HANDOFF_2026-06-16.md
  4.3  Update memory
```

---

## SAFARIDRIVER SETUP (one-time, user runs in terminal)
```bash
# Enable once (prompts password):
safaridriver --enable
```

---

## CODEX P4 — RENDER FIX (copy-paste to Codex, ~55 lines)
### Paste this exactly:

```
RENDER FIX — PHASE2+PHASE1. No new scripts/wrappers. No cardPool changes.
REPOS: PHASE2=/Users/rebekahbetar/Documents/GitHub/cozy-arcade-app-PHASE2
       PHASE1=/Users/rebekahbetar/Documents/GitHub/cozy-arcade-app
GATES FIRST: runFSRSValidation()17/17 runCozySmokeTests()6/6 — STOP if fail.

ROOT CAUSES (confirmed from source):
  FQ-RENDER-1: System0 (line 756 `let raf=null`) RAF not cancelled by startStableSoloDrop351.
    clearSoloDrop() only kills raf175164. window.stopAllDropTimers (line 880) calls safeClear()
    which kills System0 raf. Both fire selectSolo at ~7s → 10ms apart.
  FQ-RENDER-3: System0 renderSolo (line 838) writes soloQuestion with closure-captured old bionic().
    installBionicQuestionPatch352 sets window.bionic later. System2 same issue (line 3943).
    Fix: use (window.bionic||bionic)() so always uses latest patched version.

FIX 1 — FQ-RENDER-1 (1 line change):
  File: index.html ~line 6951, inside startStableSoloDrop351
  FIND:    try{clearSoloDrop();}catch(e){}
  REPLACE: try{window.stopAllDropTimers&&window.stopAllDropTimers();}catch(e){} try{clearSoloDrop();}catch(e){}
  → runFSRSValidation()17/17 + runCozySmokeTests()6/6

FIX 2 — FQ-RENDER-3 (2 line changes):
  File: index.html
  ~line 838 (System0 renderSolo): bionic(getPrompt(current)) → (window.bionic||bionic)(getPrompt(current))
  ~line 3943 (System2 renderSolo): bionic(getPrompt(current)) → (window.bionic||bionic)(getPrompt(current))
  → runFSRSValidation()17/17 + runCozySmokeTests()6/6

BROWSER TEST (safaridriver — no npm, macOS built-in):
  python3 -m http.server 8897 &
  safaridriver --port 4444 &
  S=$(curl -s -X POST localhost:4444/session -H'Content-Type:application/json' \
    -d'{"capabilities":{"browserName":"safari"}}' \
    | python3 -c "import sys,json;print(json.load(sys.stdin)['sessionId'])")
  # Navigate:
  curl -s -X POST localhost:4444/session/$S/url -d'{"url":"http://127.0.0.1:8897/"}'
  sleep 3
  # Gates:
  curl -s -X POST localhost:4444/session/$S/execute/sync \
    -H'Content-Type:application/json' \
    -d'{"script":"return JSON.stringify(window.runFSRSValidation&&window.runFSRSValidation())","args":[]}'
  curl -s -X POST localhost:4444/session/$S/execute/sync \
    -H'Content-Type:application/json' \
    -d'{"script":"return JSON.stringify(window.runCozySmokeTests&&window.runCozySmokeTests())","args":[]}'
  # Render probe — FQ-RENDER-1:
  curl -s -X POST localhost:4444/session/$S/execute/sync \
    -H'Content-Type:application/json' \
    -d'{"script":"let n=0,o=window.selectSolo;window.selectSolo=function(){n++;return o.apply(this,arguments)};setTimeout(()=>window.__ssCount=n,8000);return \"probe armed\"","args":[]}'
  # After 8s, read count:
  curl -s -X POST localhost:4444/session/$S/execute/sync \
    -H'Content-Type:application/json' \
    -d'{"script":"return window.__ssCount","args":[]}'
  # Expect: 0 before card loads; 1 after timer expires. FAIL if 2+.
  # FQ-RENDER-3: inspect soloQuestion.innerHTML — expect contains <b> tags (bionic applied first write).
  curl -s -X POST localhost:4444/session/$S/execute/sync \
    -H'Content-Type:application/json' \
    -d'{"script":"const el=document.getElementById(\"soloQuestion\");return el?el.innerHTML.includes(\"<b>\"):null","args":[]}'
  # Expect: true (bionic applied on first write, no rewrite needed)

PORT: apply identical 3 line changes to PHASE1/index.html.
BUMP: PHASE2/sw.js v21→v22, PHASE1/sw.js v56→v57. Commit both repos separately.
```

---

## CODEX P5 — DATA REPAIR: 18 NULL ROWS (paste after P4 done)

```
DATA REPAIR — 18 null next_due_at. PHASE2+PHASE1.
GATES: runFSRSValidation()17/17 runCozySmokeTests()6/6 first.

FIND in browser console:
  const nullDue=Object.entries(window.phase3State?.progress||{})
    .filter(([k,v])=>v.stage==='review'&&!v.next_due_at);
  console.log('count:',nullDue.length,'ids:',nullDue.map(([k])=>k).slice(0,5));

In rateCard() or a one-time repair function, set next_due_at for those rows:
  const now=new Date().toISOString();
  nullDue.forEach(([k,v])=>{ v.next_due_at=now; v.interval=v.interval||1; });
  savePhase3State();
  console.log('repaired',nullDue.length,'rows');

Add a one-time auto-repair block in Phase3 init (runs once per session if flag absent):
  if(!window.__cozyNullDueRepaired){
    window.__cozyNullDueRepaired=true;
    Object.values(window.phase3State?.progress||{}).forEach(p=>{
      if(p.stage==='review'&&!p.next_due_at){ p.next_due_at=new Date().toISOString(); p.interval=p.interval||1; }
    });
    savePhase3State();
  }

Validate: rerun null count → expect 0.
Port to PHASE1. Bump SW v22→v23 / v57→v58.
```

---

## CODEX P6 — AGAIN REQUEUE (paste after P5 done)

```
AGAIN REQUEUE — FQ-ALGO-4. PHASE2+PHASE1.
GATES: runFSRSValidation()17/17 runCozySmokeTests()6/6 first.

PROBLEM: rateCard(id,'again') sets next_due_at=now+10min but sessionPool was
built at session start. Card not seen again until next session.

FIX: In rateCard() again branch (~line 11261), after FSRS update:
  Find: session.buriedToday.delete(cardId);
  After it, add:
    // Splice again card to front of session pool for immediate requeue
    try{
      const pool=window.cozyPhase3Session?.pool;
      if(Array.isArray(pool)){
        const idx=pool.findIndex(c=>window.canonicalCardId(c)===cardId);
        if(idx>0){ const [card]=pool.splice(idx,1); pool.unshift(card); }
        else if(idx===-1&&window.cards){
          const card=window.cards.find(c=>window.canonicalCardId(c)===cardId);
          if(card) pool.unshift(card);
        }
      }
    }catch(_){}

Validate:
  delete window.phase3State.progress['requeue-test'];
  window.rateCard('requeue-test','again');
  const pool=window.cozyPhase3Session?.pool||[];
  console.log('first in pool:',window.canonicalCardId(pool[0]),'(expect requeue-test)');

Port to PHASE1. Bump SW v23→v24 / v58→v59.
```

---

## AFTER ALL 3 CODEX RUNS

```bash
# Update project status + handoff, then:
cd /Users/rebekahbetar/Documents/GitHub/cozy-arcade-app-PHASE2
git add index.html sw.js CODEX_DAY_PLAN_2026-06-16.md
git commit -m "Update day plan 2026-06-16"
git push origin main && git push origin HEAD:public --force
```

---

## CURRENT SW TRACKER
| Repo | Current (P4 done) | After P5 | After P6 |
|---|---|---|---|
| PHASE2 | **v24** (948abe7) | v25 | v26 |
| PHASE1 | **v59** (2e04efd) | v60 | v61 |

Note: P4 took 3 attempts (see COZY_ARCADE_PROJECT_STATUS_2026-06-17.md for error log).
FQ-RENDER-1 fix is System2 DOM class guard (948abe7) — still awaiting browser validation.
P5/P6 prompts in AGENTS.md are current with corrected SW versions.

---

## WHAT SURVIVES CONTEXT CONDENSING (paste at top of next session)
```
Cozy Arcade. PHASE2=cozy-arcade-app-PHASE2 SW v21. PHASE1=cozy-arcade-app SW v56.
Last commits: PHASE2 83079db, PHASE1 78bf6cb.
DONE: FQ-ALGO-1, FQ-AUTO-1, FQ-DUE-1/1b, FQ-POOL-1/2, FQ-DATA-1.
OPEN P1: FQ-RENDER-1 (System0 raf not cancelled), FQ-RENDER-3 (System0 closure bionic).
Fix is Codex P4 in this file. safaridriver at /usr/bin/safaridriver.
OPEN P2: FQ-ALGO-3 (18 null next_due_at), FQ-ALGO-4 (again not requeued).
NEVER: new script blocks, new cardPool/nextCard wrappers, cross-push repos.
ALWAYS: runFSRSValidation()17/17 + runCozySmokeTests()6/6 after every change.
```
