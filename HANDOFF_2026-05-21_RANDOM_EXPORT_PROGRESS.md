# Handoff - 2026-05-21 Random Order and Progress Export

## Current State

- `main` includes the One Thing reveal fix from commit `f1dd108`.
- One Thing is now rendered by one deterministic `renderOneThingStable351()` path.
- Expansion is controlled only by `.oneThingToggle351`.
- Body-click expansion has been disabled.
- The One Thing signature is based on `.oneThingText351` only, so Show more / Show less label changes do not collapse the card.
- The UPDATE editor is preserved during the reveal sync loop.

## Follow-up Work Completed This Session

- Review Deck now supports `Random - all cards` and `Random - new cards` as real review-list scopes.
- Solo Studying and Knowledge Expansion random launches use the selected random scope through the shared deck session pool.
- Deck JSON exports now include progress `state` alongside `cards`.
- Re-uploading a deck JSON that includes `state` merges that progress back into local progress.
- Progress-only JSON remains supported through merge progress.
- JSON import now tolerates bare `NaN`, `Infinity`, and `-Infinity` values by parsing them as `null`; this is needed for the supplied random 20-card test file.

## Validation Expectations

- Use `/Users/rebekahbetar/Downloads/ABIM_DATABASE_first_10_cards_in_order_PRETTY.json` for deterministic first-10 order comparisons.
- Use `/Users/rebekahbetar/Downloads/ABIM_DATABASE_random_20_cards_seed_20260521_PRETTY.json` to validate loose JSON parsing, because it contains bare `NaN` and is not strict JSON.
- Confirm Review Deck random order does not match source order.
- Confirm Solo Studying random session order does not match source order.
- Confirm Knowledge Expansion random session order does not match source order.
- Confirm a 3-card progress export restores progress after clearing state and re-importing.
- Confirm the restored progress includes records generated from both Solo Studying and Knowledge Expansion.

## Notes

- Leave `rate()`, `continueReveal()`, `initGame()`, and sprite/runner code untouched.
- The existing untracked files in the worktree were not part of this handoff.
