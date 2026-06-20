# CODEX PROMPT 15 — FQ-ALGO-9: does one Space press fire advance() AND selectSolo() on the next card?
**Paste block below into Codex. ~55 lines. Diagnostic only — do not write a fix this prompt.**

**Context:** Your last browser probe (PHASE2 `7dee2cd`) found something more severe than FQ-ALGO-8:
pressing Space at a reveal screen correctly called `advance('solo')`, but `selectSolo(0)` also fired
on the resulting next card — possibly auto-answering a card the user never saw. Claude's source
analysis found a plausible mechanism but could not confirm it's THE mechanism: there are 19 separate
`keydown` listeners (4 on `window`, 15 on `document`), mixing capture and bubble phase. Line 432 is
bubble-phase (fires last) and unconditionally calls `selectSolo(selected)` when reveal is *not* open —
if whatever advances the card during capture phase doesn't actually call `stopImmediatePropagation()`
for this exact path, propagation continues to bubble phase and 432 fires on the *new* card.

Also unresolved from your last report: whether the Continue button's rating actually goes through
Claude's new `__cozyExplicitContinueClick351` flag, or through `ratingForSelection` coincidentally
also returning 'good'. The flag self-clears immediately after use by design, so checking it *after*
`advance()` completes will always show `false` either way — that test can't disambiguate the two cases.

---

```
DIAGNOSTIC ONLY — FQ-ALGO-9 + Continue-flag disambiguation. PHASE2 primary, then PHASE1.
No source edits this prompt.

GATES: curl deployment gate / confirm local SW version before testing.

STEP 1 — INSTRUMENT (reuse your existing seeded-deck + local Chrome harness):
Wrap all 19 keydown listeners (grep the file fresh for exact current line numbers — they shift
as the file changes — for `addEventListener('keydown'`) with a logger that records: line number,
target (window/document), phase (capture/bubble, i.e. the 3rd arg), and whether THIS invocation's
body actually executed past its early-return guards (not just that the listener fired). Also
instrument `advance`, `selectSolo`, and `stopImmediatePropagation`/`stopPropagation` calls with
a shared sequence counter so you can reconstruct exact order for one event.

STEP 2 — REPRODUCE the exact reported sequence:
1. Force or wait for a wrong timer auto-select at the reveal screen.
2. Press Space ONCE (a single physical keydown, not multiple).
3. Capture the full instrumented sequence: every listener invocation in firing order, which ones
   executed past their guards, which called stopImmediatePropagation/stopPropagation and at what
   point in the sequence, and whether `advance()` and `selectSolo()` both trace back to this ONE
   keydown event or to two separate dispatches (check `event.timeStamp`/identity, not just timing).
4. Repeat 5+ times — note if this is deterministic or intermittent.

STEP 3 — DISAMBIGUATE the Continue-button question:
Force a WRONG lane selection (don't let the timer auto-correct it), then click the literal Continue
button (not Space/Arrow). Check the FINAL committed rating in progress data:
- If 'good' despite the wrong selection: the explicit-Continue-click flag path is proven correct.
- If 'again': that's a real regression in FQ-ALGO-8's fix — report this prominently, don't bury it.

STEP 4 — REPORT (this prompt's entire deliverable, no fix):
- Exact listener firing order for the Space-press reproduction, which listener's action actually
  caused the advance, and whether a SEPARATE listener's unconditional selectSolo call is what fired
  on the new card — or whether this turned out to be unrelated to the keydown race entirely (e.g.
  a timer-based auto-select on the new card with a very short configured duration).
- Definitive answer on the Continue-button disambiguation above.
- Repeat once in PHASE1 — don't assume identical line numbers or listener set, grep PHASE1 first.

Send this report to Claude. Do not propose or write a fix until the exact listener/order is
identified — guessing which of 19 listeners to change, in what order, risks the same kind of
regression Claude already caught and avoided once while designing the FQ-ALGO-8 fix.
```
