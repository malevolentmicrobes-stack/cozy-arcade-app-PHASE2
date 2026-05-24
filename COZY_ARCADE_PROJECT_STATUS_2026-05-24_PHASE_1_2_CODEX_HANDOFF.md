# Cozy Arcade Board Prep Medicine — Project Status + Codex Handoff

**Date:** May 24, 2026  
**Timestamp:** 17:05–17:15  
**Working repo/folder:** `cozy-arcade-app- PHASE2`  
**Primary files:** `index.html`, `progress_beta.html`  
**Current status:** Phase 1.1 completed and pushed. Phase 1.2 is the active next patch.

---

## Session Summary

This handoff updates the project state after Phase 1.1 and prepares Codex for Phase 1.2.

- Phase 1.1 is complete, tested, validated, and pushed.
- Current `index.html` reflects Phase 1.1 label cleanup and drawer hierarchy.
- Prior Codex diagnosis found a separate Progress-link mutation bug in `index.html` + `progress_beta.html`.
- The next step is **not a broad refactor**. It is a **minimal surgical patch** to stabilize the Progress control and progress-state transfer.

---

## Completed Log

### Phase 1.1 — Settings Drawer / Import-Export Label Cleanup

**Status:** ✅ Completed, tested, validated, and pushed to GitHub.

**Commit log**
- Main: `f414b2f`
- Public / GitHub Pages: `dd6d11f`

**Completed changes in `index.html`**
- `Upload JSON Deck` → `Upload Deck`
- Download JSON / backup-facing labels → `Download Deck`
- `Progress ↗` → `Progress`
- Settings drawer now has:
  - Primary `Import ▾`
  - Secondary `Export ▾`
- Import menu uses one hidden JSON input and routes through `importObjectPhase3`.
- Export menu has:
  - Deck
  - Progress
  - Full Deck + Progress
- Only one drawer dropdown stays open at a time.

**Verification completed**
- Local current file: `index.html` — 47 script blocks, 0 failures.
- Clean rebased remote-base file: `index.html` — 48 script blocks, 0 failures.
- String checks passed: old labels gone, new import/export strings present.
- Browser smoke test passed:
  - Labels visible.
  - Drawer hierarchy correct.
  - JSON import works.
  - Dropdown close behavior works.
  - Download Deck downloads `cozy_arcade_deck_with_progress_backup.json`.

**Phase 1.1 result**
- ✅ UI label cleanup completed.
- ✅ Import/export drawer hierarchy stabilized.
- ✅ Pushed to GitHub.
- ✅ Tested and validated.

---

## Current Diagnosis

### Phase 1.2 — Progress Link Mutation / Progress State Sync

**Status:** 🔶 Diagnosed. Ready for minimal surgical patch.

**Allowed files**
- `index.html`
- `progress_beta.html`

**Do not edit**
- `cozy-arcade-app-PHASE2/`
- Large JSON/card files
- Images/screenshots
- Markdown docs
- Unrelated CSS/gameplay blocks

### Confirmed root cause

`#limitlessImportStatus` is supposed to act as the stable Progress control, but it is also being reused as a status/deck-count element. Competing mutators repeatedly rewrite and disable it.

After deck upload/import:
- `updateImportButtons()` writes deck-count text into a UI pill and disables it.
- `ensureImportPanel()` can recreate DOM with `innerHTML`, wiping listeners.
- `wireUi()` later tries to rewire Progress again.
- Repeated installer timers around 900–1000 ms reapply the competing mutations.

Net effect: the Progress control can turn into static deck-count text, lose `onclick`, gain `pointer-events:none`, and stop opening `progress_beta.html`.

### File/function map

| File | Key functions / blocks | Role |
|---|---|---|
| `index.html` | `updateImportButtons()` | Writes deck count text and disables element |
| `index.html` | `ensureImportPanel()` | Recreates import panel with `innerHTML`, destroying listeners |
| `index.html` | `wireUi()` | Main Progress rewiring + risky aliasing/fallback |
| `index.html` | repeated installers / `setInterval` | Reapply mutation loops |
| `index.html` | home DOM / `#limitlessImportStatus` | Current Progress element is a span, not permanent link |
| `progress_beta.html` | `STATE_KEYS`, `readProgress()` | Does not fully read current Phase 3 state |
| `progress_beta.html` | `atlasLoadDeck()` | Reads deck from `cozy_arcade_limitless_cards_v1` |
| `progress_beta.html` | `ingestJSON()` | Treats full game state partly as deck-only |

### Exact offending behavior to patch

#### 1. `index.html` — `updateImportButtons()`

Problem pattern:

```js
local.textContent = n ? (n + ' cards') : '';
local.onclick = null;
local.style.pointerEvents = 'none';
local.setAttribute('aria-disabled','true');
```

This directly turns a potentially clickable Progress UI pill into static deck-count text.

#### 2. `index.html` — `ensureImportPanel()`

Problem pattern:

```js
panel.innerHTML = ...;
```

This can recreate the import area and wipe `onclick`, inline styles, ARIA, and text from `#limitlessImportStatus`.

#### 3. `index.html` — `wireUi()`

Problem pattern:
- Falls back between `#limitlessImportStatus` and `#limitlessLocalDeckStorage`.
- Writes Progress text.
- Sets `onclick = () => window.open('progress_beta.html', '_blank')`.

This tries to repair the Progress control but is racing against other mutators.

#### 4. `index.html` — repeated installers

Problem pattern:
- `setInterval(...updateImportButtons...)`
- `setInterval(...wireUi...)`

These timers reapply competing changes after upload/import.

#### 5. `progress_beta.html` — state keys

Problem:
- Progress page reads old keys.
- It misses `cozy_arcade_state_v3`.
- It does not use URL params/postMessage.
- Link paths are correct, but state transfer is incomplete.

#### 6. `progress_beta.html` — full game state import

Problem:
- `ingestJSON()` detects `cards` first and treats full game-state payloads as deck-only.
- Embedded `progress` may be skipped.

---

## Phase 1.2 — Active Task

### Objective

Apply a minimal surgical patch to:

1. Make `#limitlessImportStatus` permanently mean **Progress navigation**.
2. Stop deck-count/status code from writing into or disabling the Progress control.
3. Preserve existing repeated installers, but make them idempotent/non-destructive.
4. Add defensive `cozy_arcade_state_v3` reading to `progress_beta.html`.
5. Handle full game-state import in `progress_beta.html` before deck-only import behavior.

---

## Codex Prompt — Phase 1.2 Minimal Surgical Patch

Paste the following into Codex while opened in:

```text
~/Documents/GitHub/cozy-arcade-app- PHASE2
```

```text
Proceed with a minimal surgical patch only.

Important repo context:
- Current working folder is cozy-arcade-app- PHASE2.
- Phase 1.1 is complete and pushed.
- Main branch commit: f414b2f.
- Public/GitHub Pages commit: dd6d11f.
- Current index.html has the cleaned labels:
  - Upload Deck
  - Download Deck
  - Progress
  - Import ▾ / Export ▾ drawer hierarchy
- Do not undo Phase 1.1 label or drawer changes.
- Graphify was configured previously; use graph context if available, but do not rerun broad extraction unless necessary.

Context:
The diagnosis confirmed a race/mutation bug:
- #limitlessImportStatus should be the stable Progress control.
- updateImportButtons() writes deck-count text and disables a UI element.
- ensureImportPanel() can recreate DOM with innerHTML and wipe listeners.
- wireUi() reuses/falls back between #limitlessImportStatus and #limitlessLocalDeckStorage.
- repeated installers around ~900–1000ms reapply these mutations.
- progress_beta.html does not fully read the main Phase 3 state key.

Files allowed:
- index.html
- progress_beta.html

Do not edit:
- nested folder cozy-arcade-app-PHASE2/
- large JSON/card files
- images
- markdown docs
- unrelated CSS/gameplay blocks

Patch goals:
1. Make #limitlessImportStatus permanently mean Progress navigation only.
2. Make Progress always open progress_beta.html.
3. Never let updateImportButtons() write deck count into #limitlessImportStatus.
4. Never let updateImportButtons() set onclick=null, pointerEvents='none', or aria-disabled='true' on #limitlessImportStatus.
5. If deck count/status is needed, write it only into #limitlessLocalDeckStorage or create/use a separate status-only span.
6. Make ensureImportPanel() preserve the existing #limitlessImportStatus node/listener whenever possible. Avoid unconditional full innerHTML replacement if a minimal child check works.
7. In wireUi(), do not alias Progress to #limitlessLocalDeckStorage. Wire #limitlessImportStatus only.
8. Keep the existing repeated installers, but make the functions idempotent and non-destructive.
9. In progress_beta.html, add support for reading cozy_arcade_state_v3 defensively.
10. In progress_beta.html ingestJSON(), if a payload contains both cards and progress/full_gamestate metadata, ingest progress before or along with deck cards instead of treating it as deck-only.

Hard constraints:
- Do not rewrite whole files.
- Do not rewrite whole functions unless the function is tiny and the diff is smaller than piecemeal replacement.
- Do not rename broad app state keys.
- Do not change gameplay, scoring, spaced repetition, card parsing, session summary, pause menu, or visual theme.
- Do not remove setInterval installers in this patch.
- Preserve existing styling as much as possible.
- Prefer small guard clauses and selector-specific fixes.
- Do not add new navigation complexity.
- Do not add postMessage or URL param sync in this patch unless absolutely necessary.
- Do not replace Progress with a new unrelated button if the existing #limitlessImportStatus can be made stable.

Required output:
1. Exact files changed.
2. Exact functions/blocks changed.
3. Concise explanation of why the patch is minimal.
4. Manual regression checklist.
5. Show the diff summary.

After patching, run or provide:
- git diff -- index.html progress_beta.html
- A summary of only the changed blocks.
```

---

## Commands After Codex Patch

Run from:

```bash
cd ~/Documents/GitHub/"cozy-arcade-app- PHASE2"
```

### 1. Review diff

```bash
git diff -- index.html progress_beta.html
```

### 2. If diff is too broad, stop and revert

```bash
git checkout -- index.html progress_beta.html
```

### 3. If diff is small and correct, run smoke checks

Use browser tests below.

### 4. Optional graph refresh after patch

```bash
graphify update .
```

---

## Phase 1.2 Regression Checklist

### Progress control

- [ ] Fresh load: Progress displays as `Progress`.
- [ ] Fresh load: clicking Progress opens `progress_beta.html`.
- [ ] Upload deck from home: Progress remains visible and clickable at 0 seconds.
- [ ] Upload deck from home: Progress remains clickable after 1 second.
- [ ] Upload deck from home: Progress remains clickable after 3 seconds.
- [ ] Upload deck from settings/import drawer: Progress remains clickable after 3 seconds.
- [ ] Progress does not become `N cards`.
- [ ] Progress does not gain `pointer-events:none`.
- [ ] Progress does not gain disabled ARIA state.

### State transfer

- [ ] `progress_beta.html` opens and reads progress from `cozy_arcade_state_v3` if present.
- [ ] `progress_beta.html` still reads legacy keys if `cozy_arcade_state_v3` is absent.
- [ ] `progress_beta.html` still reads deck systems from `cozy_arcade_limitless_cards_v1`.
- [ ] Full GameState import into Progress loads both deck and progress.
- [ ] Deck-only import into Progress still works.

### App preservation

- [ ] Home button works.
- [ ] Settings gear works.
- [ ] Import drawer works.
- [ ] Export drawer works.
- [ ] Only one drawer dropdown stays open at a time.
- [ ] Upload Deck still imports JSON.
- [ ] Download Deck still downloads expected JSON.
- [ ] Export Progress still works.
- [ ] Full Deck + Progress still works.
- [ ] Pause menu still works.
- [ ] Solo Studying starts.
- [ ] Knowledge Expansion starts.
- [ ] Spaced repetition state is not reset.

---

## Acceptance Criteria

Phase 1.2 is complete only if:

1. `git diff -- index.html progress_beta.html` is small and touches only the diagnosed blocks.
2. Progress remains stable after deck upload/import and repeated installer timers.
3. `progress_beta.html` reads current Phase 3 state defensively.
4. Full game-state import handles both cards and progress.
5. Phase 1.1 labels/drawer hierarchy remain intact.
6. Browser smoke test passes.

---

## Session-End Project State Template

Use this after Phase 1.2 completes:

```markdown
## Phase 1.2 Completion Log

**Status:** ✅ Completed / 🔶 Needs review / ❌ Reverted  
**Date/time:**  
**Commit:**  

### Files changed
- `index.html`
- `progress_beta.html`

### Changed blocks
- `updateImportButtons()`
- `ensureImportPanel()`
- `wireUi()`
- `progress_beta.html` state reading
- `progress_beta.html` full game-state import handling

### Validation
- [ ] Progress remained clickable after home deck upload.
- [ ] Progress remained clickable after settings import.
- [ ] Progress did not become deck-count text.
- [ ] Progress page read current Phase 3 progress.
- [ ] Full Deck + Progress import worked.
- [ ] Phase 1.1 drawer labels preserved.
- [ ] Gameplay smoke test passed.

### Next active phase
Phase 2 — Mobile top-bar restructuring.
```

---

## Next Phase After 1.2

### Phase 2 — Mobile Top-Bar Restructuring

**Status:** ⏭️ Deferred until Phase 1.2 passes.

Principles for Phase 2:
- Do not combine navigation controls with deck/status counters.
- Keep Progress as a stable navigation control.
- Separate:
  - home/back
  - mode/session status
  - pause/settings/progress
  - deck count/import/export
- Mobile-first top bar must avoid current control crowding.
- No visual/gameplay refactor until Progress/state sync is stable.

---

## Current Handoff Summary

- Phase 1.1: ✅ completed, tested, validated, pushed.
- Phase 1.2: 🔶 ready for minimal surgical Codex patch.
- Main risk: over-patching repeated installers/import system.
- Safe path: patch only selector-specific Progress/status mutation conflict and progress state reading.
- Next commit should be small and easy to review.


## Codex Update - 2026-05-24 Progress Link Surgical Patch

- Repo: cozy-arcade-app- PHASE2.
- Scope: minimal surgical patch only in index.html and progress_beta.html.
- Preserved Phase 1.1 labels and drawer language: Upload Deck, Download Deck, Progress, Import / Export drawer hierarchy.
- index.html: stabilized #limitlessImportStatus as the Progress navigation control only; updateImportButtons no longer mutates it; ensureImportPanel now preserves the existing Progress node/listener instead of replacing the panel HTML; wireUi no longer aliases Progress to #limitlessLocalDeckStorage and keeps Progress text stable.
- progress_beta.html: added defensive reading of cozy_arcade_state_v3; full_gamestate or cards+progress payloads now ingest progress and deck card mappings together instead of being treated as deck-only.
- Repeated installers were left in place and made safer by making the patched functions idempotent and non-destructive for Progress.
- Graphify CLI was not available in this shell, so no graph update or broad extraction was run.
- Suggested regression: load home, wait several seconds, upload deck, confirm Progress remains clickable and opens progress_beta.html; confirm progress_beta reads local Phase 3 state; upload full gamestate to progress_beta and confirm both signals and deck/system mapping load.


## Codex Update - 2026-05-24 Phase 1.2.1 Deck + Progress Roundtrip

- Scope: minimal surgical patch in index.html and progress_beta.html.
- index.html: Full Deck + Progress / Download Deck export now saves first and emits a clean deck_with_progress payload with cards[] and progress{}.
- progress_beta.html: deck_with_progress and full_gamestate payloads with cards[] plus progress{} or state{} now hydrate both deckMap and progress before refresh.
- progress_beta.html: full imports persist cards to cozy_arcade_limitless_cards_v1, progress to cozy_arcade_state_v3 and cozy_arcade_progress_v1, and maintain soloStudyingState_v1757 compatibility.
- Progress-only imports still route as progress-only and do not claim a loaded deck.
- Validation: cozy_arcade_deck_with_progress_backup.json classified as full import with 1249 cards, 1259 progress entries, and 1249 matched deck/progress ids; cozy_arcade_progress_2026-05-24-4 copy.json classified as progress-only with 273 progress entries and no deck hydration.
