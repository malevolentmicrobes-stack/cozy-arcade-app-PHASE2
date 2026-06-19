# CODEX PROMPT 13 — FQ-ALGO-8: find why a wrong auto-select gets rated 'good'
**Paste block below into Codex. ~55 lines. Diagnostic only — do not write a fix this prompt.**

**Context:** User reported, from direct observation in a fresh PHASE2 browser session: "a couple
autoselect, space or arrow continue, one wrong autoselected but good." A timer-expired auto-select
landed on the WRONG choice, the reveal showed "Learning Moment," but the rating that got committed
was 'good' instead of 'again'. Claude's source audit found the live suspect but the guard that
*should* prevent this looks correct on paper — meaning either the guard has a real gap, or a
different code path entirely is winning the race. Full writeup: OPEN_DIFFERENTIALS.md FQ-ALGO-8.

**Do not patch `wrappedAdvance`'s 'good' fallback blind** — it may be load-bearing for the literal
"Continue" button (which is supposed to default to good when the user doesn't want to self-rate).

---

```
DIAGNOSTIC ONLY — FQ-ALGO-8. PHASE2 primary, then PHASE1. No source edits this prompt.

GATES: curl deployment gate, confirm live SW, before testing.

STEP 1 — INSTRUMENT (live browser, seeded deck, real timer — do not skip the timer by forcing clicks):
Wrap and log (with timestamp + cardId + args) every call to:
  wrappedSelect / selectSolo, wrappedAdvance / advance, rateOnce, pendingFor,
  markRated, alreadyRated (log its return value too), ratingForSelection (log its return value),
  and EVERY keydown listener that checks for Space/Enter/ArrowRight at the reveal screen
  (there are at least 6 — PHASE2 lines 432, 682, 1180, 1288-1289, 1695-1696, 3184 — instrument
  all of them, log which one's condition actually matched and ran).
Also log window.__cozyLastRatedId and window.__cozyPendingRating20260603 at each step.
Also log window.spacedOn / useSpacedFor('solo') at each step — the rating-commit branches in both
wrappedSelect and wrappedAdvance are gated on this value and it may be inconsistent.

STEP 2 — REPRODUCE the exact reported sequence, several times (this may be intermittent):
1. Set timer short (cozyQuestionSeconds351=3-4s). Do NOT click an answer — let the runner sit on
   a WRONG lane and let the timer auto-select it via timeout.
2. Once the reveal screen shows "Learning Moment" (confirms wrong), press Space or ArrowRight
   (not Enter) to continue, matching the user's report.
3. Capture the full instrumented log for that one card: every function called, in order, with
   timestamps, and the FINAL rating actually written via rateCard (read it back from
   window.phase3State.progress[id].last_rating after advancing).
4. Repeat 5-8 times. Note which repro attempts produce the bug and which don't — if intermittent,
   the timing/order of events between repro runs that fail vs succeed is the answer.

STEP 3 — REPORT (this prompt's entire deliverable, no fix):
- Did the final committed rating ever differ from what ratingForSelection() computed for the
  auto-selected lane? On which repro number(s)?
- Exactly which keydown listener fired (by line number) on each repro, and did more than one fire
  for the same keypress?
- Was alreadyRated(id) true or false at the moment wrappedAdvance ran, on the failing repro(s)?
  If false when you'd expect it true (i.e. wrappedSelect had already rated this exact card),
  explain why markRated's value didn't survive.
- What was spacedOn/useSpacedFor('solo') on each repro?
- Repeat once in PHASE1 — don't assume identical line numbers, grep PHASE1 first.

Send this report to Claude. Do not propose or write a fix — the right fix depends entirely on
which of the above is actually happening, and this exact class of bug (event timing / multiple
wrapper layers racing) has needed live confirmation every time it's come up this project.
```
