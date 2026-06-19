# CODEX PROMPT 10 — FQ-RENDER-5: stop System2's drop loop, don't just gate its last line
**Paste block below into Codex. ~55 lines.**

**Context:** This is the 4th patch attempt at the same symptom family (d5a470b 2026-05-30,
dfb2ecc, 8a22e66, ebeef5e, 948abe7 — see AGENTS.md "STOP — Read Before Any Render Work").
948abe7 only guarded the final `selectSolo()` call inside System2's `tick()`. Every earlier
line in that loop (warning text/class toggle, drop position, timerFill) still runs
unconditionally, which is why "AUTO-SELECT IN" paints over live stable gameplay in both repos.
Root cause is already diagnosed in OPEN_DIFFERENTIALS.md (FQ-RENDER-5) — do not re-investigate
from scratch, but DO run STEP 1 below before writing any fix.

---

```
FIX FQ-RENDER-5 — PHASE2 primary, then PHASE1. Read OPEN_DIFFERENTIALS.md FQ-RENDER-5 first.

GATES: runFSRSValidation()17/17 runCozySmokeTests()6/6 first, both repos.

STEP 1 — DIFFERENTIAL (do this before touching code):
Reuse your seeded-deck + MutationObserver harness from the prior audit session. Confirm: does
System0's renderSolo/startDrop/tick (PHASE2 ~line 831-857) ever actually execute in a real
session, or is window.renderSolo always System2's version (~line 3938) by the time gameplay
starts? Report which — this determines whether System0 needs the same guard below or is dead
code in practice.

STEP 2 — FIX (no new wrapper layer; modify these functions in place, do not add a new one):
1. Add one flag near session/state init: window.__cozyStableOwnsSoloTimer351 = false;
2. System2's renderSolo() (~3938), as the FIRST line: window.__cozyStableOwnsSoloTimer351=false;
   (safety net — every new card defaults to "System2 may run" so a stuck flag can never freeze
   the game with no timer at all).
3. System2's startDrop() (~3927) and tick() (~3906), as the FIRST line of EACH:
   if(window.__cozyStableOwnsSoloTimer351) return;
   (tick must also set raf175164=null; before returning, so the raf chain actually stops).
4. ONLY if STEP 1 shows System0 is live: apply the identical two guards to System0's
   startDrop()/tick() (~788, ~814).
5. In startStableSoloDrop351() (~6948), right after row.classList.add('soloStableDrop351'):
   set window.__cozyStableOwnsSoloTimer351=true; AND defensively clear the warning node:
     const warn=q('soloDropWarn175151'); if(warn){warn.classList.remove('on');warn.textContent='';}
6. Port identically to PHASE1 — grep PHASE1's own line numbers first, do not assume PHASE2's
   offsets (PHASE1 runs ~12 lines behind PHASE2 throughout this file).

STEP 3 — VALIDATE (browser, both repos, reuse your existing harness):
- Across a FULL card lifecycle in stable mode, #soloDropWarn175151.textContent must never
  contain "AUTO-SELECT" text.
- Test at least 3 CONSECUTIVE cards, not one — the flag must reset every card. If a card after
  the first fails to auto-advance/select on timeout, the flag got stuck: that is a worse
  regression than this bug, do not ship it.
- runFSRSValidation 17/17 + runCozySmokeTests 6/6 after.

STEP 4 — COMMIT: PHASE2 then PHASE1 separately. Bump sw.js CACHE both repos.

STEP 5 — REPORT: STEP1 finding (System0 live or dead in practice), exact diff applied per repo,
3-card consecutive test result, gate results, commit hashes.
```
