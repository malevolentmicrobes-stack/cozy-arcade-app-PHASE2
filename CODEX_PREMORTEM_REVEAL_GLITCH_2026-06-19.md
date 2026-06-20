# CODEX PRE-MORTEM — Reveal Glitch / Browser-Surfaced Churn

Timestamp: 2026-06-19 16:40 CDT

Scope: PHASE2 local source at `/Users/rebekahbetar/Documents/GitHub/cozy-arcade-app-PHASE2`. The request was diagnostic/pre-mortem: identify plausible patch-history sources, test the top five, and avoid touching SM-2/rating logic unless directly implicated.

## Ground Rules From Patch History

- Do not add wrapper layer 12 to `selectSolo`, layer 14 to `selectDomain`, or more `advance()`/`reveal()` wrappers.
- Do not alter SM-2/FSRS scheduling for this visual glitch. The confirmed symptom is answer-panel/render churn, not interval math.
- Prior FQ-RENDER lessons apply here: guarding only a final action does not stop earlier DOM side effects. For reveal work, measure the actual reveal DOM nodes.
- Product contract from README reveal order: `diagnosis -> educational_objective -> board_trigger -> one_thing -> why_not_others -> ratings`.

## Top Five Differentials Tested

| Rank | Differential | Test | Result | Confidence |
|---|---|---|---|---|
| 1 | Reveal answer-panel writer churn | Localhost browser harness with synthetic cards, MutationObserver on `#soloReveal`, checkpoints at immediate / 20 ms / 160 ms / 1110 ms | Confirmed. Normal card: 55 reveal-subtree mutations. Board-trigger-only card: 57 mutations. Child count changed after reveal. `.boardTrigger350` and `.oneThing350` are inserted after reveal begins. | Very high |
| 2 | Field alias contamination: `answer`/diagnosis becomes `educational_objective` | Same browser harness plus source trace through `canonicalizeCard()` | Confirmed. Board-trigger-only card normalized to `educational_objective: "Aortic dissection"` and reveal showed the diagnosis in the Educational Objective box. | Very high |
| 3 | Cold-cache font swap / FOUT | Source + service worker inspection | Confirmed as a contributor. `index.html` loads Google Fonts with `display=swap`; `sw.js` precaches only `./`, `index.html`, and `manifest.json`. Fonts are not available on first cold load until network returns. | Medium |
| 4 | Keydown / advance listener multiplicity | Source count and prior log cross-check | Confirmed as an existing risk, not primary for this visual glitch. There are many `keydown` listeners and `advance()` is wrapped repeatedly. This better matches "wrong auto-selected but Good" than answer panel flashing. | Medium-low for visual glitch |
| 5 | Global MutationObserver / body-subtree churn | Source count and prior D4 history | Confirmed as ambient churn. Multiple observers watch document/body subtree and can run during reveal. This can amplify flicker but does not explain divergent reveal content by itself. | Medium-low |

## Evidence Pointers

- Base reveal fallback is sane: `current.educational_objective || current.board_trigger || current.quick_recall` at `index.html` line ~415.
- Later reveal wrapper changes priority to `current.answer || current.educational_objective || current.level_2_three_second_exposure || current.quick_recall` at line ~1268.
- Bionic rerender uses another answer source and rewrites `#soloTrigger` / `#domainObj` at lines ~6694-6705.
- `renderRevealSections()` rewrites diagnosis, trigger, board trigger, and One Thing at lines ~8882-8894.
- `renderRevealSections()` is deferred after reveal with `setTimeout(...,0)` at line ~8913.
- `renderRevealSections()` also runs every 900 ms while a reveal is open at line ~8921.
- `canonicalizeCard()` synthesizes `educational_objective` from `c.answer` and then sets `c.answer = educational_objective` at lines ~11645-11677.
- `sw.js` precaches only the local shell; Google Fonts are external and cache-on-demand.

## Browser Harness Findings

Synthetic card A had diagnosis, educational objective, board trigger, and One Thing.

- Immediate reveal showed the correct educational objective and board trigger.
- By 20 ms, One Thing appeared and child count increased.
- Mutation count: 55.

Synthetic card B had diagnosis, board trigger, One Thing, and no educational objective.

- Import/normalization produced `educational_objective = "Aortic dissection"`.
- Immediate reveal showed `Aortic dissection` in both diagnosis and educational-objective positions.
- Board trigger existed separately below it.
- Mutation count: 57.

## Pre-Mortem: How A Bad Fix Would Fail

1. Adding another `reveal()` wrapper would temporarily hide one symptom but increase writer order complexity.
2. Changing SM-2/rating defaults would not reduce reveal DOM churn and risks repeating the FQ-ALGO-7 backtrack.
3. Self-hosting fonts first would reduce cold-load layout movement but leave the deterministic 55+ reveal mutations.
4. Removing One Thing rendering would reduce churn but delete a study feature the user relies on.
5. Fixing only `board_trigger` fallback would leave `answer`/diagnosis alias contamination intact.

## Safest Fix Direction

Fix 1 should consolidate reveal rendering, not add a wrapper:

- Create stable reveal section nodes before showing the panel.
- Compute a single `revealModel` per card: diagnosis, educational objective, board trigger, One Thing, full explanation.
- Update each node only when a card id + field signature changes.
- Remove the 900 ms reveal-section interval or make it no-op when the signature is unchanged.

Fix 2 should repair field normalization:

- `educational_objective` should not fall back to diagnosis-style `answer` unless the source schema explicitly means answer = teaching explanation.
- `answer` should not be treated as both diagnosis and educational objective in the same canonical card.
- Board-trigger-only cards should show board trigger as the teaching text fallback rather than duplicating diagnosis into the educational objective slot.

## Recommendation

Patch order:

1. Fix reveal render ownership/idempotency first.
2. Fix canonical field aliasing second.
3. Re-test with the same two-card browser harness and a normal imported deck.
4. Only after those pass, revisit fonts as a polish/perceived-jitter improvement.

