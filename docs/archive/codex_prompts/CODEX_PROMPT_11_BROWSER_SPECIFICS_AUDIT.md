# CODEX PROMPT 11 — Browser test specifics: confirm what's actually still glitching
**Paste block below into Codex. ~45 lines. Diagnostic only — do not fix anything yet.**

**Context:** FQ-ALGO-7 (Again-card pool reshuffle) was reverted and is now LIVE —
PHASE2 `c2807ac` on origin/main + origin/public, PHASE1 `b9168f5` on origin/main,
SW v31/v66, pushed 2026-06-19. FQ-RENDER-5 (the "AUTO-SELECT IN" warning ghosting
over stable gameplay, found 2026-06-18) is diagnosed but the fix (CODEX_PROMPT_10)
has NOT been applied yet. User reports glitches still occurring after this deploy.
**Do not assume it's the same bug as either of the above — gather real specifics
first.**

---

```
BROWSER SPECIFICS AUDIT — PHASE2 + PHASE1. Diagnostic only, no fixes this prompt.

STEP 0 — DEPLOYMENT GATE:
curl -s https://malevolentmicrobes-stack.github.io/cozy-arcade-app-PHASE2/sw.js | head -2
→ must show cozy-arcade-PHASE2-v31. STOP and report if stale — do not test against
a cached old version, that would produce false positives for already-fixed bugs.

STEP 1 — REPRODUCE WITH SPECIFICS (reuse your seeded-deck + MutationObserver harness
from the prior session, both repos):
Play at least 5 consecutive Solo cards, mixing Again/Hard/Good ratings. For EACH card
capture and log:
  a) Does the choiceRow/pool order visibly change right after an Again rating, beyond
     the missed card moving to front? (FQ-ALGO-7 re-check — should be NO now)
  b) Does #soloDropWarn175151 show "AUTO-SELECT IN ..." while #soloReveal is visible
     or after an answer is locked in? (FQ-RENDER-5 — expected YES, not yet fixed)
  c) Any console errors/warnings during the session — paste exact text.
  d) Anything else visually wrong that doesn't match (a) or (b) — describe the exact
     element, its state/class list, and the exact action that triggered it. Do not
     skip this even if it seems minor.

STEP 2 — DOMAIN MODE (shorter pass, 3 rounds, both repos): same capture — timer/orb
behavior, console errors, anything visually wrong. This mode has had less browser
coverage than Solo.

STEP 3 — REPORT ONLY (this prompt's entire deliverable — do not write a fix):
For every glitch actually observed, give: exact repro steps, and which OPEN_DIFFERENTIALS.md
ID it matches (FQ-ALGO-7, FQ-RENDER-5, or something else) — or "NEW, no matching
differential" with a full description if it doesn't match any tracked item. If FQ-ALGO-7's
fix looks broken in some new way, say so explicitly rather than filing it under FQ-RENDER-5.
Send this report back to Claude before any further fix work starts.
```
