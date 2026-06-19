# CODEX PROMPT 12 — DOMAIN-AGAIN-DUPE: find which selectDomain layer double-fires
**Paste block below into Codex. ~50 lines. Diagnostic only — do not write a fix this prompt.**

**Context:** Your PROMPT_11 audit found a real bug: after rating a Domain round "Again,"
`session.pool` contained the same card 4 times adjacently. Claude's source audit ruled out
an additive-mutation bug — `session.pool` is never `.push`/`.unshift`/`.concat`'d anywhere
except `rateCard()`'s splice (verified idempotent on repeat calls) and `sessionPool()`'s
plain replacement. That means something in the rating/select PATH is firing multiple times
per user action, not the pool-mutation code itself.

**New finding:** `selectDomain` has been reassigned at least 13 times (PHASE2 lines 414,
2441, 2747, 3199, 3442, 4085, 4358, 4413, 5497, 6873, 7778, 13391 — full table now in
AGENTS.md "selectDomain Chain"). This chain was never mapped or instrumented before today,
unlike Solo's known 11-layer `selectSolo` chain. `bindRatings()` (redefined ~419, ~7060,
~7794) also calls both `rate()` (wrapped to call `requeueAgainCard`) AND `rateCard()` for
one click — two independent pool-touching paths per press.

---

```
DIAGNOSTIC ONLY — DOMAIN-AGAIN-DUPE. PHASE2 primary, then PHASE1. No source edits this prompt.

GATES: curl deployment gate, confirm live SW v31/v66, both repos, before testing.

STEP 1 — INSTRUMENT (reuse your seeded-deck + live-browser harness from PROMPT_11):
Wrap EVERY layer of selectDomain (all ~13 reassignment sites) with a call counter that logs
{layer_line, t:performance.now(), cardId} BEFORE delegating to the prior function — do not
just wrap window.selectDomain once at the end, you need a per-layer count since any layer
could be the one that fires twice. Also instrument rateCard(), rate(), and
requeueAgainCard() the same way. Also log every assignment to session.pool (you can do this
by polling pool length + first-3-ids every 50ms during one round instead of patching the
property).

STEP 2 — REPRODUCE: play 3 Domain rounds live, rate round 2 "Again" (this matched your
PROMPT_11 repro). Capture the full call log across all instrumented functions for that one
round, in order, with timestamps.

STEP 3 — REPORT (this prompt's entire deliverable, no fix):
- Which function(s) fired more than once for the single Again click, and how many times each.
- For each extra fire: what triggered it — was it called from inside another instrumented
  function (cascading), or from an independent source (timer, event listener, etc)?
- Does the duplicate appear in session.pool immediately after the click, or only after the
  NEXT round's render/sessionPool() rebuild?
- Repeat once in PHASE1 to confirm the same layer is responsible (don't assume parity without
  checking — PHASE1's selectDomain reassignment lines may differ slightly).

Send this report to Claude. Do not propose or write a fix — the fix approach depends on
which layer is actually firing twice, and guessing wrong here has cost 3+ failed attempts
before on the equivalent Solo bug (see AGENTS.md "STOP — Read Before Any Render Work").
```
