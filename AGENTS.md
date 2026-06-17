## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, invoke the `skill` tool with `skill: "graphify"` before doing anything else.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

---

## Codex Agent Instructions — 2026-06-17

**Current SW:** PHASE2 `cozy-arcade-PHASE2-v24` (commit 948abe7) | PHASE1 `cozy-arcade-v59` (commit 2e04efd)

---

### STOP — Read Before Any Render Work

**Patch history for FQ-RENDER-1 (do not repeat these mistakes):**

| Attempt | What was tried | Why it failed |
|---------|---------------|---------------|
| dfb2ecc | `clearSoloDrop()` at top of startStableSoloDrop351 | `clearSoloDrop()` is IIFE-scoped inside System 2; silently throws ReferenceError from stable mode's IIFE |
| 8a22e66 | `window.stopAllDropTimers()` before `clearSoloDrop()` | stopAllDropTimers cancels System 0 raf only; clearSoloDrop still failed silently |
| ebeef5e | `window.loopSolo=function(){startStableSoloDrop351();}` at end of SS351 | System 2 renderSolo calls `startDrop()` directly, not via loopSolo; reassignment had no effect |
| **948abe7** | DOM class guard in System 2 tick expiry | **Current fix — awaiting browser validation** |

**The invariant Codex must never violate:**
`clearSoloDrop()` cannot be called from outside System 2's IIFE. Any attempt will throw ReferenceError silently.

---

### Three Drop Engines (memorize this)

| System | Handle | Lines (PHASE2 / PHASE1) | cancel fn | selectSolo at |
|--------|--------|------------------------|-----------|---------------|
| 0 | `raf` | 756 / 756 | `safeClear()` via `window.stopAllDropTimers` | 809 / 809 |
| 2 | `raf175164` | 3887 IIFE / same | `clearSoloDrop()` — **IIFE-scoped only** | 3924 / 3936 |
| 3 | `soloStableRaf351` | 6948 / 6981 | `clearTimeout(soloStableRaf351)` inside SS351 | 6985 / 7017 |

---

### Hard Constraints (Never Violate)

- All edits inline in `index.html` — no new `<script>` blocks, no new files
- Do NOT add `cardPool` or `nextCard` wrappers
- Do NOT cross-push between PHASE1 and PHASE2 — separate repos, separate commits
- Bump `sw.js` CACHE version after any code change
- Apply fix to BOTH repos in same Codex session (PHASE2 primary, PHASE1 port)
- Prompts under 80 lines; no CDP infra; no safaridriver gate (requires user Safari pre-enable)
- Validate `runFSRSValidation()` 17/17 + `runCozySmokeTests()` 6/6 after every change
- `cd /path/to/repo && git add ...` in single command — shell has no directory persistence between calls
- selectSolo chain = 11 layers — do NOT add layer 12

---

### Current Task: Domain Smoke + P5

**FQ-RENDER-1 CONFIRMED** (Codex browser audit 2026-06-17):
- SS#1 once from System3 (PHASE2 line 6985 / PHASE1 line 7017) ✅
- System2 silent at expiry (PHASE2 line 3924 / PHASE1 line 3936) ✅
- FSRS 17/17, smoke 6/6 both repos ✅
- `String(window.renderSolo).includes('startStableSoloDrop351')` = false — this check is UNRELIABLE, do not use as gate

**Domain smoke result (2026-06-17 Codex audit):**
- Orbs render + animate ✅
- Manual orb click → reveal opens ✅ (manual selection works)
- No JS errors ✅
- Domain timer auto-completion ❌ PRE-EXISTING — loopDomain wrapper at ~line 7009 clears ticker at 0 but omits `selectDomain` call. Base loopDomain (line 413) has it; later wrapper lost it. NOT our regression. Tracked as DOMAIN-AUTO-SELECT in OPEN_DIFFERENTIALS.md.
- **Domain smoke gate: PASS** — manual selection works; auto-timer was already broken before our changes.

---

### P5 — FQ-ALGO-3: 18 null next_due_at (run after FQ-RENDER-1 confirmed)

**Known bugs in prior prompt version — all fixed below:**
- Used `window.phase3State?.progress` — window.phase3State not yet assigned at init; use local `phase3State`
- Used `p.interval` — wrong field; canonical is `p.interval_days`
- Called `savePhase3State()` unconditionally — must only save if rows changed

```
DATA REPAIR — 18 null next_due_at. PHASE2+PHASE1.
REPOS: PHASE2=/Users/rebekahbetar/Documents/GitHub/cozy-arcade-app-PHASE2
       PHASE1=/Users/rebekahbetar/Documents/GitHub/cozy-arcade-app
GATES: runFSRSValidation()17/17 runCozySmokeTests()6/6 first.

NOTE: null rows exist in user's persisted localStorage, not in clean seeded deck.
Run null count check AFTER real app loads (with actual stored progress):
  const nullDue=Object.entries(window.phase3State?.progress||{})
    .filter(([k,v])=>v.stage==='review'&&!v.next_due_at);
  console.log('null count:',nullDue.length);

ADD one-time auto-repair block in index.html, in Phase3 init, immediately AFTER the line
where phase3State is assigned from loadPhase3State() (local variable, not window):
  if(!window.__cozyNullDueRepaired){
    window.__cozyNullDueRepaired=true;
    let _repairCount=0;
    const _now=new Date().toISOString();
    Object.values(phase3State?.progress||{}).forEach(p=>{
      if(p.stage==='review'&&!p.next_due_at){
        p.next_due_at=_now;
        p.interval_days=p.interval_days||1;
        _repairCount++;
      }
    });
    if(_repairCount>0) try{savePhase3State();}catch(_){}
  }

Validate:
  → runFSRSValidation()17/17 + runCozySmokeTests()6/6
  → Reload page. Rerun null count → expect 0 (repair persisted)
  → Confirm _repairCount logged > 0 (if user's real data has the 18 rows)
Port to PHASE1. Bump PHASE2 sw v24→v25, PHASE1 sw v59→v60. Commit both repos separately.
```

---

### P6 — FQ-ALGO-4: Again Requeue (run after P5)

```
AGAIN REQUEUE — FQ-ALGO-4. PHASE2+PHASE1.
GATES: runFSRSValidation()17/17 runCozySmokeTests()6/6 first.

In rateCard() again branch, after FSRS update and session.buriedToday.delete(cardId):
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
  console.log('first:',window.canonicalCardId(pool[0]),'expect: requeue-test');

Port to PHASE1. Bump PHASE2 sw v25→v26, PHASE1 sw v60→v61. Commit both repos separately.
```

---

### selectSolo Chain (11 layers — do not add layer 12)

| Layer | Line (PHASE2) | Purpose |
|-------|--------------|---------|
| 1 | ~408 | Base game selectSolo |
| 2 | ~860 | Knowledge Pulse / shadow queue advance |
| 3 | ~2431 | Rating-path rectifier |
| 4 | ~2741 | Bionic/stable-random wrapper |
| 5 | ~3958 | Shadow dungeon queue advance v2 |
| 6 | ~4071 | Unlisted wrapper |
| 7 | ~4227 | Unlisted wrapper |
| 8 | ~6893 | Energy scope wrapper |
| 9 | ~7752 | Energy tracker |
| 10 | ~13303 | Undo snapshot |
| 11 | ~14199 | 700ms debounce guard |
