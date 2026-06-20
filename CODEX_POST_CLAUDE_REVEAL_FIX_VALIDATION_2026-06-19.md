# CODEX POST-CLAUDE VALIDATION — Reveal Fix Review

Timestamp: 2026-06-19 19:55 CDT

Scope: Review Claude's PHASE2 commit `7bf4273` and log commit `c4db2e6` after the reveal-glitch pre-mortem. This is a validation report, not a new code change.

## What Claude Changed

Claude changed only:

- `index.html` inside `renderRevealSections()`
- `sw.js` cache version `v33 -> v34`

No `selectSolo`, `advance`, `rateCard`, interval scheduler, SM-2/FSRS math, or rating code was touched by the reveal fix.

## Browser Re-Test Results

Method: rebuilt the same localhost in-page harness from the current patched `index.html`, served from `/private/tmp`, and read results through the in-app Browser. The harness uses main-world page script inside copied HTML, because Browser evaluate is read-only/isolated.

### Case A: normal card with educational objective + board trigger

- Before fix: 55 reveal-subtree mutations.
- After Claude fix: 53 reveal-subtree mutations.
- Content remained correct at immediate / 20 ms / 160 ms / 1110 ms.

Verdict: small mutation reduction, no regression.

### Case B: board-trigger-only card with contaminated `educational_objective == diagnosis`

- Before fix: immediate and stable states showed diagnosis in the Educational Objective box.
- After Claude fix:
  - Immediate frame still showed `Aortic dissection` in the trigger box.
  - By ~20 ms, trigger text corrected to `Tearing chest pain + pulse deficit -> immediate CTA chest.`
  - The corrected text stayed stable through 160 ms and 1110 ms.
- Mutation count changed from 57 to 55.

Verdict: Claude fixed the stable/readable state, but not the first frame. The user may still perceive a flash because the contaminated text is still painted first and corrected by the deferred writer.

## Built-In Validation

Smoke test:

- `runCozySmokeTests()`: 6/6 passed.

SRS validation:

- `runSRSValidation()`: 11/17 passed.
- Failed expectations: Again ease, Hard interval, Good new/review intervals, Easy new/review intervals.

Important: these SRS failures are not caused by `7bf4273`. Diff from pre-fix `88af09e` to current shows no scheduler/rating code changes. This is a separate pre-existing mismatch between the built-in validation expectations and current scheduler behavior, or a pre-existing algorithm bug. Do not conflate it with the reveal glitch.

## Differential Ranking After Claude Fix

1. **Residual first-frame reveal contamination** — highest. The stable display is fixed, but immediate reveal can still show the wrong trigger text before `renderRevealSections()` corrects it.
2. **Remaining reveal DOM churn** — still high. 53/55 mutations remain; the 900 ms interval and structural insertion-after-paint remain.
3. **Upstream field alias contamination** — mitigated at display layer only. The source alias problem still exists in multiple normalizers.
4. **Cold-cache font swap** — still plausible contributor to perceived jitter, especially on fresh browsers.
5. **SRS validation mismatch** — separate issue, important because the user cares about SM-2 stability, but not caused by the reveal patch.

## Feedback For Claude

The fix is appropriately narrow and avoids SM-2/rating backtracking. However, it should be described as a mitigation, not a completed fix:

- It does not stop the first contaminated frame.
- It does not consolidate reveal rendering.
- It does not remove the 900 ms render interval.
- It does not fix upstream alias contamination.

Next safest code fix, if we proceed: move the same corrected `eduObj` source/fallback into the earliest visible reveal writer, or make the base reveal call use the same reveal model before un-hiding the panel. That would address the first-frame flash without touching SM-2.

