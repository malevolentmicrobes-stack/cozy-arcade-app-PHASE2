## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

## Claude Handoff — 2026-06-03 Runtime Glitch Diagnosis

The user reports these visible symptoms:
- General Study Mode selection appears glitchy or does not reliably translate into the active gameplay pool.
- Gameplay HUD can show multiple pause/settings-style controls or duplicated control clusters.
- The solo runner/character appears biased toward, or auto-proclive toward, the correct answer.
- Current card/progress state does not consistently translate between home filters, gameplay, Atlas, and exports.

Do not treat these as isolated UI bugs. Current diagnosis is stacked patch contention, with the E7 runtime ownership part now fixed and browser-validated:
- Older "stable random" and Energy/System layers still install runtime wrappers after newer Phase 3 code.
- E7 confirmed contributors were `installBuriedPoolFilter()` around ~7528, `patchGameFlow()` around ~10094, and legacy `patchStudyOptions()` around ~6052. Phase 3 now marks `cardPool` with `__energyBuriedFilter352` + `__cozyStableRandom351`, marks `nextCard` with `__cozyStableRandom351`, and `patchStudyOptions()` skips its old `cardPool` replacement when Phase 3 owns the pool.
- Cache-busted headless Chrome/CDP validation passed 2026-06-03 before and after `startSolo`: `String(window.cardPool)` is `() => sessionPool(...)`, not `scopedCardPool352`; `String(window.nextCard)` includes `__shadowDungeonActive175164`; FSRS 17/17; smoke 6/6.
- E7B is also fixed/validated 2026-06-03. General Study Mode now uses `syncGeneralStudyScopePhase3()` as the single writer for `browseScope351` changes: it updates `dataset.cozyLaunchScope`, `phase3State.settings.solo_order`, `deckMode`, and `homeFilters.scope`, then clears the Phase 3 session pool key. Existing `__cozyApplyDeckMode351()` delegates to this function. No new `cardPool`/`nextCard` wrapper was added.
- E7C is fixed/validated 2026-06-03. Gameplay HUD controls now use `renderHudControls('solo'|'domain')` as the single idempotent contract. It dedupes by `data-hud-role` and guarantees exactly one pause, one close/home, one settings, and one energy/status control per game HUD. No new `cardPool`/`nextCard` wrapper was added.
- P7 is fixed/validated 2026-06-03. PHASE2 has `sw.js`, `manifest.json`, manifest/theme tags, and service-worker registration. Headless validation confirmed SW registration, shell cache entries, offline reload, FSRS 17/17, and smoke 6/6. Do not recreate P7 unless the cache strategy changes.
- A9 is fixed/validated 2026-06-03. Atlas card detail now appends one `#na-review-tag-btn` that closes Atlas, syncs tag/system filters through Phase 3, and launches Solo. Important contributor: Phase 3 `getStudyPool()` had to apply selected tag/system filters and include them in `poolKey`; older filter-aware wrappers no longer own runtime. No new `cardPool`/`nextCard` wrapper was added.
- Solo selection has multiple wrappers (`selectSolo` base, Knowledge Pulse wrapper, Energy tracking wrapper, v175160 debounce). Bias-like behavior can come from stale `selected`, lane/highlight state not resetting with `makeChoices()`, or auto-select timers selecting the highlighted lane after wrappers reorder/reset the pool.
- Progress translation is split between legacy `state`, `phase3State.progress`, alias sync, Atlas `readProgress()`, and import/export migration. Before fixing UI, define one canonical progress read/write boundary.

Rectifier rule for the next code pass:
1. Keep Phase 3 as the only authoritative session/pool layer. Do not add new `cardPool`/`nextCard` wrappers; older installers should skip replacing flagged Phase 3 functions.
2. Preserve General Study Mode's single source of truth: select value -> `syncGeneralStudyScopePhase3()` -> `phase3State.settings` + `dataset.cozyLaunchScope` + legacy mirrors -> `sessionPool`.
3. Preserve `renderHudControls()` as the gameplay HUD control contract. Do not add separate pause/home/settings/energy injection loops.
4. Preserve A9 tag/system filtering inside Phase 3 `getStudyPool()`/`poolKey`; do not move Atlas Review Tag back into legacy pool wrappers.
5. Then audit `selected`/runner lane reset: every new card must set `selected = 0` or an explicit neutral lane, update visuals, and never derive selection from the correct answer.
6. Then reconcile progress state with a single `phase3State.progress` write path and keep legacy `state` as a mirror only.

Validation gates after rectifier:
- `window.runFSRSValidation()` must return `17/17`.
- `window.runCozySmokeTests()` must return `6/6`.
- Runtime `String(window.cardPool)` must reference Phase 3/session pool, not the Energy `scopedCardPool352(prior...)` wrapper.
- Runtime `String(window.nextCard)` must include the Shadow Dungeon queue guard or call the guarded Phase 3 implementation.
- Changing General Study Mode must update `browseScope351.value`, `document.documentElement.dataset.cozyLaunchScope`, `phase3State.settings.solo_order`, `deckMode`, `homeFilters.scope`, and the next solo pool count consistently.
- Gameplay DOM must contain exactly one visible pause, close/home, settings, and energy/status control per game.

## Claude Handoff Addendum — 2026-06-03 Data + Rating Paths

Codex applied today's data patch and rating-path rectifier:
- Patched exports are in `/Users/rebekahbetar/Documents/ *EXAMPLE JSON FILES /cozy_arcade_progress_2026-06-03_codex_E3_E4_ghost_patch.json` and `/Users/rebekahbetar/Documents/ *EXAMPLE JSON FILES /cozy_arcade_deck_with_progress_backup_2026-06-03_codex_E3_E4_ghost_patch.json`.
- E3/E4 target cards now have populated FSRS stability/difficulty/next_due_at and `ease_factor:2.5`. Good-rated cards correctly have interval 3; hard-rated cards correctly have interval 1 per `runFSRSValidation()`.
- E3b ghost-seen target cards are reset to new with zero seen/review counters and null rating/stability/due date, preserving pinned flags.
- `index.html` now includes `cozy-rating-path-rectifier-2026-06-03`, which wraps only `selectSolo`, `advance`, and `rate`. It does not add `cardPool` or `nextCard` wrappers. It keeps a pending answer rating after selection, commits auto-selected answers through `rateCard()` after the auto fallback, commits Continue through `rateCard('good')`, and preserves explicit Hard/Again/Good choices.
- Focused CDP validation passed: auto-correct -> good/review/3d, auto-wrong -> again/relearning/10m, Continue -> good/review/3d, Hard -> hard/review/1d, Again -> again/relearning/10m.

## Claude Handoff Addendum — 2026-06-04 Validation

Codex validated the user's reported main-page flash and runner concern:
- Main-page flash was real. Cause: legacy `ensureScopeOptions352()` temporarily inserted `Suspended / buried` into visible `browseScope351` during delayed install; Phase 3 later removed it. Fix keeps that legacy option maintenance away from visible home selects.
- Runner is not automatically selecting the correct answer. Real-deck sample of 1,000 cards had correct answer lanes 213 / 271 / 265 / 251. The only deterministic behavior is `selected=0` on each new card, so timer auto-select without user movement chooses lane 0.
- Progress between games was partly failing for Hard: `rateCard('hard')` wrote FSRS correctly, but `review_deck` excluded future-due hard cards. Fix makes pinned/repair/hard/again candidates appear in Review Deck immediately while normal due scheduling remains intact.
