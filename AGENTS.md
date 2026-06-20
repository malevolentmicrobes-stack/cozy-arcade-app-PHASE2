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

## Codex Agent Instructions — 2026-06-17 (updated end-of-day)

**File convention (added 2026-06-19):** active/queued `CODEX_PROMPT_N_*.md` files live at repo root — there should only ever be a small, current set. Once a prompt's fix lands (commit) or its diagnostic report is received and acted on, move it to `docs/archive/codex_prompts/` (`git mv` if tracked, `mv` if not yet committed). Don't leave completed prompts at root — that's how this got to 12 files needing a cleanup pass today.

**Current SW (2026-06-19, ~5:00pm):** PHASE2 `cozy-arcade-PHASE2-v34` (commit `7bf4273`) | PHASE1 `cozy-arcade-v70` (commit `b91cf8f`)
**Next tasks (2026-06-19, ~5:00pm):**
1. `CODEX_PROMPT_13_FQ_ALGO_8_WRONG_RATED_GOOD_DIAGNOSTIC.md` — diagnostic only. Wrong timer-auto-selected answer got rated 'good'. Suspect found (7-layer `advance()` chain's 'good' fallback, ≥6 competing keydown listeners) but the guard meant to prevent it looks correct on paper — needs live instrumentation.
2. `CODEX_PROMPT_14_D4_MUTATION_FLASH_DIAGNOSTIC.md` — diagnostic only, largely superseded by today's reveal-panel fix (see below) but left open in case residual flicker remains after re-testing.
3. **REVEAL-TRIGGER-CHURN / DATA-EO-ALIAS — mitigated, not consolidated.** The worst symptom (flash + diagnosis-duplicated-into-Educational-Objective) is fixed at the display layer. The root architecture (17-layer `reveal()` chain, 900ms reveal interval, 8 separate occurrences of the answer/board_trigger aliasing anti-pattern) is documented but NOT consolidated — that's a deliberate, larger future task, not today's scope. Re-test before considering this fully closed.

FQ-ALGO-7, FQ-RENDER-5, DOMAIN-AGAIN-DUPE, FQ-DATA-2 (genuinely this time) are closed from earlier today. M2 Stripe stays paused. iOS1 finish is user-run.

**Reveal-panel fix (2026-06-19, ~5:00pm):** `renderRevealSections()` now falls back to `board_trigger||quick_recall` when `educational_objective` is empty or contaminated-equal-to-`diagnosis`, and skips its `dx`/`trigger` DOM write when content is unchanged from last paint (same pattern as the existing `oneThingStableRenderSig` guard). PHASE2 `7bf4273` / PHASE1 `b91cf8f`. Verified via 5-scenario JXA simulation against Codex's exact repro case before applying. Did not touch selectSolo/advance/rateCard/FSRS. Did not attempt the other 7 occurrences of the aliasing anti-pattern, or the broader chain consolidation — see OPEN_DIFFERENTIALS.md REVEAL-TRIGGER-CHURN/DATA-EO-ALIAS for the full scope of what's deliberately left undone.

PROMPT_10 (FQ-RENDER-5) and PROMPT_12 (DOMAIN-AGAIN-DUPE diagnostic) both ran 2026-06-19 with Codex. PROMPT_12's diagnostic correctly found the real mechanism was a stale PHASE1-only `requeueAgainCard()` (not the `selectDomain` chain itself, which fires repeatedly but harmlessly) — Claude applied that fix directly since Codex's session had ended. See OPEN_DIFFERENTIALS.md DOMAIN-AGAIN-DUPE row for the full writeup.
**M2 Stripe: PAUSED by user decision 2026-06-18** ("too many glitches") — do not resume without explicit request, regardless of Stripe link availability.
iOS1 scaffold is done — remaining iOS steps (`npx cap add ios` → `npx cap sync` → open in Xcode) are user-run, not Codex tasks.

---

### STOP — Read Before Any Render Work

**Patch history for FQ-RENDER-1 (do not repeat these mistakes):**

| Attempt | What was tried | Why it failed |
|---------|---------------|---------------|
| d5a470b (2026-05-30) | "dedup dropdown injection + kill dual-drop animation jitter" | Same symptom family, predates the FQ-RENDER-1 name; did not stop System2's loop either |
| dfb2ecc | `clearSoloDrop()` at top of startStableSoloDrop351 | `clearSoloDrop()` is IIFE-scoped inside System 2; silently throws ReferenceError from stable mode's IIFE |
| 8a22e66 | `window.stopAllDropTimers()` before `clearSoloDrop()` | stopAllDropTimers cancels System 0 raf only; clearSoloDrop still failed silently |
| ebeef5e | `window.loopSolo=function(){startStableSoloDrop351();}` at end of SS351 | System 2 renderSolo calls `startDrop()` directly, not via loopSolo; reassignment had no effect |
| 948abe7 | DOM class guard in System 2 tick expiry — but only guards the final `selectSolo()` call | Partial — fixed double auto-select, but every earlier line in tick() (warning text/class toggle, drop position, timerFill) still ran unconditionally. This was FQ-RENDER-5. |
| **fb09afa / 2c8f4ce (2026-06-19)** | Explicit `window.__cozyStableOwnsSoloTimer351` flag checked at the TOP of tick()/startDrop() (not just gating the final action), claimed at the earliest synchronous point (`oldRenderSolo351` wrapper, before the setTimeout(0) deferral), reset every card | **Fixed — validated: 3 consecutive Solo cycles, 0 AUTO-SELECT mutations, FSRS 17/17, smoke 6/6, both repos, before push.** |

**The invariant Codex must never violate:**
`clearSoloDrop()` cannot be called from outside System 2's IIFE. Any attempt will throw ReferenceError silently.

**New lesson from FQ-RENDER-5 (4th attempt at this exact symptom family):** Guarding only the final action at the end of a loop does not stop the loop's other side effects. `stopAllDropTimers()` and the `clearSoloDrop()` call inside `startStableSoloDrop351()` have never actually cancelled System2's `raf175164` loop — three prior commits (d5a470b, 948abe7, and the ebeef5e loopSolo reassignment) all assumed one of these worked. Before declaring a drop-engine fix done: (1) verify the *entire* loop body is suppressed, not just its terminal call, (2) instrument the actual DOM node with a MutationObserver, not just confirm "selectSolo fired once."

---

### Three Drop Engines (memorize this)

| System | Handle | Lines (PHASE2 / PHASE1) | cancel fn | selectSolo at |
|--------|--------|------------------------|-----------|---------------|
| 0 | `raf` | 756 / 756 | `safeClear()` via `window.stopAllDropTimers` | 809 / 809 |
| 2 | `raf175164` | 3887 IIFE / same | `clearSoloDrop()` — **IIFE-scoped only** | 3924 / 3936 |
| 3 | `soloStableRaf351` | 6948 / 6981 | `clearTimeout(soloStableRaf351)` inside SS351 | 6985 / 7017 |

---

### Browser Testing — Isolated World Warning

**CRITICAL:** Browser automation (Playwright, CDP, WebDriver evaluate()) runs in an **isolated world**.
`window.runFSRSValidation` and `window.runCozySmokeTests` appear "missing" there even though they exist.

**Solutions (in order of preference):**
1. `osascript` (macOS built-in, main-world access — requires Safari > Develop > Allow JavaScript from Apple Events):
   ```bash
   osascript -e 'tell application "Safari" to do JavaScript "JSON.stringify(window.runFSRSValidation())" in current tab of window 1'
   ```
2. Local HTTP server + manual console: `python3 -m http.server 8897` → open in browser → paste probe in DevTools console
3. Playwright `page.evaluate()` with `{ world: 'main' }` option (Playwright v1.39+)

**Always test LOCAL (127.0.0.1:8897), NOT GitHub Pages — CDN cache can lag 5–15 min behind push.**

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
- PHASE2 public deploy: `git push origin main:public --force` — "public" is a branch on `origin`, NOT a remote named "public"
- selectSolo chain = 11 layers — do NOT add layer 12

---

### Completed This Session (2026-06-17)

| Task | Status | Commit |
|------|--------|--------|
| FQ-RENDER-1 System2 DOM class guard | ✅ browser-confirmed | 948abe7 |
| DOMAIN-AUTO-SELECT loopDomain wrapper | ✅ fixed | 0d12676 |
| FQ-ALGO-3 null next_due_at repair | ✅ applied (needs browser validate) | 0d12676 |
| FQ-ALGO-4 again requeue via pool rebuild | ✅ fixed (pool-rebuild replaces broken splice) | 22260dc |
| FQ-DATA-2 migration guard (legacyToProgress schema check) | ✅ fixed | 3104391 |
| PROMPT_7 domain audit | ✅ browser-confirmed (no code commit) — DOMAIN-WRITER-ORDER disproved; DOMAIN-AUTO-SELECT confirmed working; new differential DOMAIN-RECORD-ZERO added | — |
| PROMPT_8 iOS1 Capacitor scaffold | ✅ done (2026-06-18) — capacitor.config.json + package.json created, manifest.json icon-512.png (512x512) added, index.html/sw.js untouched, PHASE2 only | 918ef92 |
| PROMPT_9 revert FQ-ALGO-7 | ✅ done (2026-06-18), pushed + browser-confirmed correct 2026-06-19 via PROMPT_11 | PHASE2 c2807ac / PHASE1 b9168f5 |
| PROMPT_11 browser specifics audit | ✅ done (2026-06-19) — live Playwright against deployed URLs, both repos. Closed FQ-ALGO-7. Re-confirmed FQ-RENDER-5 live. Found new: DOMAIN-AGAIN-DUPE (card 4x-duplicated in pool after Domain Again), RENDER-STALE-REVEAL (low priority, not confirmed user-visible). | — (diagnostic, no commit) |
| PROMPT_10 fix FQ-RENDER-5 | ✅ done (2026-06-19) — ownership flag, validated 3 consecutive Solo cycles both repos before push, 0 warning mutations | PHASE2 fb09afa / PHASE1 2c8f4ce |
| PROMPT_12 DOMAIN-AGAIN-DUPE diagnostic | ✅ done (2026-06-19) — instrumented selectDomain chain + rating path live, found the real cause was PHASE1's stale additive `requeueAgainCard()`, not the chain itself. Fix applied separately by Claude (Codex session had ended). | PHASE1 2b84281 (PHASE2 needed no change) |
| PATCH-LANG-MEDICAL \b word boundaries | ✅ browser-confirmed | ca70006 |
| PATCH-LANG-WALKER DOM skip content nodes | ✅ source-confirmed (LIVE-NO-DECK prevented runtime test) | 0d12676 |
| DOMAIN-BIONIC (window.bionic\|\|bionic) in domain render | ✅ source-confirmed | f345dda |
| STATE-B deck restore (atlas sysmap → canonical deck key) | ✅ fixed | 98b5254 |

### Current Task: re-test reveal fix, then CODEX_PROMPT_13 (2026-06-19, ~5:00pm)

Timeline today: PROMPT_9 (revert ALGO-7) → PROMPT_11 (live audit, closed ALGO-7, found DOMAIN-AGAIN-DUPE) → PROMPT_10 (fixed RENDER-5) → PROMPT_12 (diagnosed + Claude fixed DOMAIN-AGAIN-DUPE) → user caught FQ-DATA-2 was never really fixed, Claude fixed it for real → user reported "card glitch/flashing," Claude reviewed evidence directly, reopened D4-MUTATION, queued PROMPT_14 → user asked for deep-think analysis; Claude found `renderRevealSections()`'s missing fallback + 17-layer `reveal()` chain → Codex independently ran a pre-mortem with a live browser harness (`CODEX_PREMORTEM_REVEAL_GLITCH_2026-06-19.md`), confirmed 55-57 DOM mutations per reveal AND found a second, deeper bug Claude had missed: `educational_objective` getting contaminated to equal `diagnosis` → Claude verified Codex's finding directly, discovered the same anti-pattern recurs in 8 places (not 1), and applied a single targeted fix at the display layer (`renderRevealSections`) that resolves the user-visible symptom for both findings without touching the other 7 occurrences or attempting the full chain consolidation Codex recommended. PHASE2 `7bf4273` / PHASE1 `b91cf8f`.

**Not done, by design:** the other 7 contamination sites, the 900ms reveal interval, and full reveal-chain consolidation into one idempotent owner. These are real, documented (OPEN_DIFFERENTIALS.md), and deliberately deferred — see RECTIFIER_PLAN's running rule against bulk/unconsolidated patching.

PROMPT_13 (FQ-ALGO-8, wrong auto-select rated 'good') is still queued, unrelated to today's reveal fix — instruments the `advance()` chain + ≥6 competing keydown listeners + `rateOnce`/`alreadyRated`/`pendingFor`. PROMPT_14 is largely superseded by the reveal fix but left open pending re-test.

Remaining Priority 4 work:
- iOS1 finish: user runs `npx cap add ios` → `npx cap sync` → opens `ios/` in Xcode (not a Codex task)
- M2 Stripe: **PAUSED by user 2026-06-18** — not blocked, paused. Do not resume.
- DOMAIN-RECORD-ZERO (OPEN_DIFFERENTIALS.md): needs user intent decision before any fix is scoped — this is the one remaining stop-and-ask item

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

---

### selectDomain Chain (≥13 layers — found 2026-06-19, never documented before now — do NOT add layer 14)

**This existed the whole time and was never mapped.** Domain mode's wrapper chain is deeper than Solo's and had zero guardrails until DOMAIN-AGAIN-DUPE surfaced it. Treat with the same caution as selectSolo above.

| Layer | Line (PHASE2) | Note |
|-------|--------------|------|
| 1 | ~414 | Base game selectDomain |
| 2 | ~2441 | Unmapped wrapper |
| 3 | ~2747 | Unmapped wrapper |
| 4 | ~3199 | Adds 650ms select-lock (`domainSelectLockUntil`) |
| 5 | ~3442 | Unmapped wrapper |
| 6 | ~4085 | Unmapped wrapper |
| 7 | ~4358 | Gates on `canDomainSelect()` |
| 8 | ~4413 | Records `answeredCard17521`/`answeredMode17521` |
| 9 | ~5497 | Unmapped wrapper |
| 10 | ~6873 | Unmapped wrapper |
| 11 | ~7778 | Energy-tracker wrapper (`__energyTrack352`, mirrors selectSolo layer 8/9) |
| 12 | ~13391 | Unmapped wrapper |

Layers marked "Unmapped wrapper" have not been read in full — only located by grep. Before any fix to Domain's rating/select path, read each one; do not assume layer order matches call order without checking `oldSelectDomain`/`priorSelectDomain` chaining at each site.

**Related, not yet mapped:** `bindRatings()` is also redefined at least 3 times (~419, ~7060, ~7794) and calls BOTH `rate()` (wrapped to also call `requeueAgainCard`) AND `rateCard()` for a single rating click — two independent pool-touching paths per press. See DOMAIN-AGAIN-DUPE in OPEN_DIFFERENTIALS.md.

---

### advance() Chain (≥7 layers — found 2026-06-19, never documented before now)

Found while investigating FQ-ALGO-8 (wrong auto-select rated 'good'). Same "deep undocumented chain" pattern as selectDomain above.

| Layer | Line (PHASE2) | Note |
|-------|--------------|------|
| 1 | ~418 | Base: `nextCard()` + render/loop, no rating call |
| 2 | ~884 | Unmapped wrapper |
| 3 | ~2450 | Unmapped wrapper |
| 4 | ~2753 | Unmapped wrapper |
| 5 | ~12175 | Unmapped wrapper |
| 6 | ~14279 | Unmapped wrapper |
| 7 (final, live) | ~14422 (`wrappedAdvance`) | Part of `cozy-rating-path-rectifier-2026-06-03`. If reveal is open and no matching pending rating exists for the current card, **defaults to rating 'good'**, gated by a global single-value `alreadyRated`/`markRated(id)` check. |

**Also found:** at least 6 independent `keydown` listeners bound to Space/Enter/ArrowRight at the reveal screen (lines 432, 682, 1180, 1288-1289, 1695-1696, 3184), calling 3 different function names (`advance`, `continueReveal` — itself redefined 3x at 1278/3277/6809, `advanceReveal`). Only the line-3184 listener uses capture phase + `stopImmediatePropagation()`. See FQ-ALGO-8 in OPEN_DIFFERENTIALS.md — not yet confirmed which path actually misfires.
