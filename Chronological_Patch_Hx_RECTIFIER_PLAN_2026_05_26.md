# Cozy Arcade — Patch History & Rectifier Plan
*Senior Developer Audit — 2026-05-26 — No prior bias*

---

- 2026-05-26 Codex: Browser-validated Steps 1+6-8 plus undo review; `makeChoices`, no double-advance, `loopSolo`, legacy choiceRow classes, FSRS 17/17, and smoke 6/6 all pass.
- 2026-05-26 Codex: Browser-validated Step 2 bionic consolidation; fresh default true, ON/OFF single-key round-trip, no `cozyBionic351` writes, FSRS 17/17, and smoke 6/6 all pass.

---

## 2026-06-10 Patch History Entry

**Status at session start:** PHASE2 SW v10 (`cozy-arcade-PHASE2-v10`), commit 209adab. PHASE1 SW v47 (`cozy-arcade-v47`), commit 86fca1e. FQ-1 through FQ-4 and FQ-8 all committed and verified.

**Glitches identified this session (no code changes yet — analysis only):**

| Glitch | Root Cause | First appeared |
|--------|-----------|---------------|
| FQ-AUTO-1: Runner auto-selects correct after undo | FQ-3 fix (`dcb492e`) restored `selected = snap.selected`; snap = runner position at answer time | Re-emerged after 2026-06-07 FQ-3 fix |
| FQ-AUTO-2: Explicit Good overwritten by 8s deferred 'again' | Base `selectSolo` defers `rateCard(ok?'good':'again')` for 8000ms; `seenThisSession` guard may not fire in time | Existing risk — not yet confirmed |
| FQ-NEW-3: "^" close missing on Full Card | Feature never added | New request |

**Documents updated this session:**
- Created: `COZY_ARCADE_PROJECT_STATUS_2026-06-10.md`
- Updated: `RECTIFIER_PLAN_2026_05_26.md` (2026-06-10 addendum)
- Updated: `SENIOR_DEV_AUDIT_2026_06_07.md` (Sections 17–18)
- Updated: this file

**Code changes pending (Codex Tasks 1–3 not yet run):**
- FQ-AUTO-1: `restoreUndoSnapshot`: `selected = snap.selected` → `selected = 0`
- FQ-AUTO-2: `wrappedRate` in rectifier: cancel 8s deferred + update seenThisSession on explicit rating
- FQ-NEW-3: Add "^" button to Full Card modal; verify/bypass 700ms debounce for number keys

**SW versions expected after Tasks 1–3:** PHASE2 v13, PHASE1 v50 (3 bumps each).

## File Inventory

| # | Path | Lines | Bytes | Role |
|---|------|-------|-------|------|
| File 1 | `cozy-arcade-app- PHASE2/index.html` | 13,031 | 752 KB | **Current production** — the file under audit |
| File 2 | `OLD PRIOR index(1) copy.html` | 8,803 | 7.8 MB | **Old Prior** — last known clean state before PHASE2 branch diverged; large because it embeds a full card dataset inline in `DATA.cards[]` |
| File 3 | `cozy-arcade/index.html` | 9,071 | 7.8 MB | **Earlier Prior** — cozy-arcade repo snapshot ~5/16/2026; nearly identical to File 2 at the patch layer, also has full embedded cards |
| File 4 | `cozy-arcade/public/cozy_arcade_blank_import.html` | 8,795 | 3.3 MB | **Blank Import template** — same patch layer as Files 2–3 but smaller card dataset; the canonical "clean shell" |

**Key structural difference:** File 1 was stripped of its embedded card data (`cards_embedded:0`) and grew 4,000+ lines of additional patch code (lines 2266–13031) that does not exist in Files 2–4. Files 2–4 share the same base patch stack through approximately line 2265, then diverge only in their embedded card payloads.

---
#context
## PROMPT: HISTORY SETTINGS / TIMER / BIONIC / CARD VIEW GLITCH
### PROBLEM
- App was working better before.
- Now quick patches made mess.
-Need senior developer brain.
-Do not do more random patch.
-Review old HTML vs current HTML first.

Current goal:
- Keep current good functions.
- Do not break Import / Export dropdowns.
- Do not break Prompt AI dropdown/box font
- Do not delete useful Settings work.[prior "test mode" worked: labeled wrong-could be better goal was good view]
- Fix timer.
- Fix bionic reading.
- Fix card display.
- Fix gameplay view on small screen. [review test mode]
- Clean code.
- No more hard-coded hacks.

---
## DIAGNOSTIC LIST 1: Current File vs Old Prior (File 1 vs File 2)

### A. Bionic Reading Initialization

1. **`bionicOn` initial value flipped.** File 1 line 388: `bionicOn=false`. Files 2, 3, 4 line 389: `bionicOn=true`. This means every first-load session in File 1 starts with bionic OFF; in all prior files it started ON. No localStorage migration was written to smooth this over.

2. **`bionicOn` is set in at least 12 distinct locations in File 1** (lines 388, 437, 513, 1492, 1660, 1872, 5114–5116, 5157, 5182, 7005, 7009, 8466, 9478 among others). File 2 has 8 locations. The extra 4+ locations in File 1 are patch-layer additions that each independently try to read/write the same variable with no shared source of truth.

3. **Two competing localStorage keys for bionic state in File 1:** `cozyBionic351` (line 5182) and `bionicOn_v1751523` (lines 5114, 5157, 7009). File 2 uses both keys too, but File 2 also reads `cozyBionic351` as an OR-fallback (line 7692), providing a migration path. File 1 lost that OR-fallback at line 5182, which only reads `cozyBionic351` in isolation.

4. **No `cozyBionic` or `bionic351` or `bionicOn_v1751` key exists in File 1's base layer** (lines 388–726). The base declares `bionicOn=false` and reads it only from the checkbox. Multiple later patches each independently try to persist it to different keys, guaranteeing that after any settings save the wrong key may be read on next load.

5. **`bionicToggle` checkbox has no `checked` attribute in HTML** in any of the four files (confirmed line 386 in File 1). All files rely on JS to hydrate the checkbox. In File 1, at least 4 separate patches call `bionicToggle.checked=` at DOMContentLoaded, with no guaranteed ordering. The last one to run wins, which is nondeterministic.

6. **`bionicOn` is set to `false` by `forceSpacedDefaultOff` side-effect** (line 1794–1795 in File 1). This function runs at DOMContentLoaded and is designed for spaced-rep, but its bionic branch resets bionic state as a side effect if `bionicOn_v1751523` is null—meaning first-run users always get bionic=false even if prior sessions saved it as true under `cozyBionic351`.

### B. Timer/Timing Initialization

1. **`timerMax` initial value is `9` in all four files** (File 1 line 389, File 2 line 390). However, File 1's base `renderSolo` at line 408 reads `localStorage.getItem('cozyQuestionSeconds351') || $('soloTimerInput')?.value || 7` — the fallback is `7`, not `9`. File 2 line 409 reads `$('soloTimerInput')?.value || 9` — consistent with the declared default. File 1 introduced a discrepancy: the global init says 9, the render function uses 7.

2. **`timerMax` is hardcoded to `DURATION_MS/1000` (= 7.0) in three separate drop-mechanic patches** (lines 826, 848, 1040 in File 1) overriding any user setting mid-session without reading `cozyQuestionSeconds351`. A user who set 10-second timers in Settings will silently get 7 seconds.

3. **`timerMax` is re-hardcoded to `7` in File 1 lines 1164 and 1195** inside the v175151 drop patch. Same problem. This literal `7` does not exist in Files 2–4 at these line positions; it was introduced in File 1's PHASE2-only patches.

4. **`renderDomain` in File 1's base (line 414) reads `cozyQuestionSeconds351 || 7`** — no fallback to `soloTimerInput` value. File 2 line 415 hardcodes `timerMax=7` for domain. Both are wrong but in different ways; neither reads the settings input for the domain game.

5. **The `soloTimerInput` value is never saved to `cozyQuestionSeconds351` by the Apply button.** The Apply handler at line 437 (base `wire()`) reads `$('deckMode').value`, `$('promptField').value`, `autoSelect`, `bionicOn` — but does NOT call `localStorage.setItem('cozyQuestionSeconds351', ...)`. This means the timer input in Settings is decorative; the saved key is never written by the UI. This bug exists in all four files.

6. **Four competing `timerMax` assignment chains** are active simultaneously in File 1 when a Solo game runs: the base `loopSolo` setInterval (line 411), the v17513 rAF patch (lines 826/848), the v17515 CSS-drop setTimeout patch (lines 1040/1047), and the v175151 rAF patch (lines 1164/1195/1200+). Each resets `timerMax` independently.

### C. Settings UI Structure

1. **File 1 has `id="settingsBtn"` wired to `show('settings')` in the base `wire()` at line 437, then re-wired 8+ times** by patches at lines 591, 1365, 1543, 1663, 1664, 2030, 2259, 2260. File 2 wires it 4 times. Each re-wire uses `.onclick=` assignment (not addEventListener), so only the last assignment survives — but the last one depends on script execution order, which is nondeterministic across DOMContentLoaded vs immediate IIFE timing.

2. **File 1 has at least 5 distinct "Continue" buttons injected into the settings panel** by successive patches: `settingsContinue175153` (line 1484), `settingsContinue175154` (line 1659), `settingsContinue175156` (line 1800), `settingsContinue175157` (line 1913), and the base `applyBtn`. Each patch tries to remove the previous ones (line 1907: removes 153, 154, 156) but the cleanup is fragile — it only fires on `openSettings175157()` call, not on every settings render. File 2 has only `settingsContinue175153` and `settingsContinue175154`.

3. **`applyBtn` onclick is reassigned 16 times** in File 1 (confirmed by grep). Only the last assignment is active. File 2 has 6 reassignments. The base `wire()` assignment at line 437 is always overwritten; the actual effective Apply handler is whichever patch ran last at DOMContentLoaded, which varies.

4. **File 1 introduced a settings "return to game" flow** (lines 1645, 1884–1895, 1897–1900) that Files 2–4 do not have. This flow uses `window.__returnMode175157` and `window.__lastGameBeforeSettings` as two separate competing return-mode trackers, both trying to solve the same problem. They can diverge: one patch sets `__lastGameBeforeSettings` via body class inspection (line 1784), another sets `__returnMode175157` via `window.mode` inspection (line 1878). If `mode` and the body class disagree (a known state during patch transitions), the user returns to the wrong screen.

5. **File 1 removed the home-screen `spacedBtn` and `exportBtn`** that exist in Files 2, 3, 4 (File 2 line 438). File 1's base HTML (line 386) only has `id="settingsBtn"`. The spaced review entry point was moved to the Settings drawer, breaking the direct home-screen shortcut that users relied on.

### D. `install()` / Patch Initialization

1. **File 1 has 47 `DOMContentLoaded` event listener registrations** (confirmed by grep). Files 2–4 have approximately 30. The 17 additional registrations in File 1 (lines 2256, 2512, 2666, 2914, 3189, 3268, 3494, 3562, 3662, 3928, 4076, 4109, 4325, 4513, 4734, 4893, 5186, etc.) are all from PHASE2-only patches. Each fires at page load, meaning initialization order is effectively random for any code that does not guard with `dataset` flags.

2. **At least 12 persistent `setInterval` polling loops** run simultaneously in File 1 after load (lines 1807, 2668, 2915, 3817, 4077, 4110, 4735, 4894, 5187, 7660, 12213, and `setInterval(wireSettingsReturn, 1000)` at line 1807). Files 2–4 have approximately 6. These loops re-patch the DOM every 800–1500ms in perpetuity, causing constant micro-thrash and fighting each other when they try to modify the same elements (e.g., settings buttons, HUD labels, runner sprite).

3. **`wire()` is patched by `patchWire1759()` at line 601** (called immediately, not at DOMContentLoaded), which wraps `wire` before `wire` is ever called. Then `DOMContentLoaded` fires `wire()` at line 603. The wrapped `wire` calls the original `wire` plus adds new bindings. But then patch v175152 (line 1364) wraps `wire` again via `oldWire`. By the time any button is clicked, the actual call chain is: v175152 wrapper → patchWire1759 wrapper → base wire. If any wrapper throws, the base never runs.

4. **Three competing rAF loops are started for Solo drop mechanics** (v17514 at line 820, v17515 CSS at line 1007, v175151 at line 1159). Each `renderSolo` override calls `stopDrop()`/`clearDropTimers()`/`safeClear()` to cancel the previous one, but the cancel functions target different handles (`dropTimer`, `autoHandle/warnHandle/tickHandle`, `raf`). A stale rAF from v17514 can continue running even after v175151 takes over because they use different variable names.

5. **`setInterval(syncRunner, 100)` at line 4077 and `setInterval(dedupeRunner, 1000)` at line 4110** both run unconditionally. `syncRunner` fires 10x per second for the entire browser session. Neither interval is cleared on home/game exit. These do not exist in Files 2–4.

### E. `fullCard()` Function

1. **`fullCard()` is overridden 5 times in File 1** (lines 430 base, 656 no-op wrap, 4455, 4786, 9204). Files 2–4 override it 3 times. The base at line 430 uses field names `current.qid`, `current.test`, `current.system`, `current.one_thing` — all without `|| ''` fallbacks. If any field is undefined, the template literal renders the string `"undefined"` visibly in the modal.

2. **The final active `fullCard` override at line 9204** replaces the modal content with `sourceFull(current)` — a function defined nearby at approximately line 9185. This function uses different field priority ordering than the base. A card that shows correctly in gameplay may show different content in the Full Card modal because the field-read chain changed.

3. **`fullCard` at line 430 references `current.test`** but cards normalized by the CSV importer (lines 2117 ff.) set `test: 'CSV IMPORT'` for all cards. The field is populated but meaningless. Files 2–4 have the same base `fullCard` but no CSV importer, so `current.test` is always the deck's original value.

4. **No `|| ''` fallbacks on `current.one_thing`, `current.board_trigger`, `current.explanation`** in the base `fullCard` in any file. These fields are optional in most deck formats and will render as `"undefined"` for every CSV-imported card.

5. **Line 656 in File 1: `window.fullCard = fullCard = function(){ oldFullCard(); };`** — this no-op wrapper calls the old function and discards its return value, which is fine since fullCard returns nothing. But it captures `oldFullCard` at patch-install time, not at call time. If a later patch overrides `fullCard` before this wrapper is created, `oldFullCard` is stale. The v17513 patch (installed at DOMContentLoaded via line 724) installs this wrapper before the later v17521 patch (line 4784) runs, so execution order is: no-op wrapper → base `fullCard`. Then v17521 wraps again. The chain is unnecessarily deep.

### F. Gate-Complete / Reveal Overlay

1. **`reveal()` is overridden 12 times in File 1** (lines 419 base, 525, 1511, 1957, 2223, 3120, 3391, 3541, 4405, 4765, 5804, 9636, 9960). Files 2–4 have approximately 9 overrides. Each override calls its captured `priorReveal` reference, creating a 12-deep call chain on every answer. Any error in any layer silently swallows the rest via try/catch.

2. **`bindRatings(which)` is called inside `reveal()` at every layer** that replaces the ratings HTML. In the 12-deep reveal chain, `bindRatings` is called between 3 and 6 times per answer reveal (confirmed at lines 421, 545, 1518, 1627, 1980, 2218, 4424). Each call uses `document.querySelectorAll('[data-rate]').forEach(b => b.onclick = ...)`, which reassigns `.onclick` and is idempotent — but only if the DOM hasn't been rebuilt between calls. If any reveal layer rebuilds `innerHTML` after a prior layer already bound it, the binding is stale.

3. **`answerAutoAdvanceHandle` / `answerAuto` / `answerAutoAdvanceHandle` are three separate timeout variables** across three patches (lines 507, 1503, 1628). Each patch clears only the one it knows about. A 7-second auto-advance set by the v17513 patch (line 1628 `answerAuto`) is not cleared by the v175157 patch (line 1958 which only clears `answerAutoAdvanceHandle`). This can cause double-advance: the card advances once from user input and again 7 seconds later from the stale timeout.

4. **Click-outside-to-continue is registered via three separate mechanisms** in File 1:
   - `outsideAdvanceHandler` on DOMContentLoaded at line 497 (v17.5.8 patch)
   - `clickOutsideReveal` registered in `patchWire1759` at line 597
   - `clickRevealAdvance` registered in v175157 `install()` at line 2035 (with `dataset.v175157Click` guard)
   - `pointerdown` capture at line 1522 (v175153) and again at line 1633 (v17.5.15.8)
   
   Files 2–4 have two of these mechanisms. File 1 has all five, meaning a single outside click fires up to 5 advance handlers. The `advance(which)` function is idempotent only if the reveal is already hidden after the first call — which it will be, since the first handler hides it. But `nextCard()` is called inside `advance()`, meaning 4 extra `advance()` calls each try to increment the card index. Gates 2–5 are guarded by `hp<=0` check, but the `nextCard()` call itself runs unconditionally.

5. **`continueHint175153`, `continueHint175157`, `continueHint175158` are injected by three successive patches** into the reveal overlay. Each injects a `div` on every reveal call without checking if one already exists. The v175158 patch at line 2178 adds a cleanup function `cleanRevealHints()`, but it is only called at the top of `reveal175158`. If the reveal chain calls an older reveal layer that injects a hint first, then `reveal175158` cleans then adds one, there may still be duplicate hints from the non-last layers.

---

## DIAGNOSTIC LIST 2: Cross-File Comparisons

### A. File 2 vs File 3 (Old Prior vs Earlier Prior)

1. Files 2 and 3 are **functionally identical at the patch layer** (lines 1–~2265). The only difference is the embedded `DATA.cards[]` payload at the bottom of each file. All JS functions, variable initializations, and patch IIFEs are byte-for-byte identical.

2. Both use `bionicOn=true` at line 389 — bionic is ON by default. This is the correct user-facing default and was **regressed to `false` in File 1**.

3. Both files correctly wire `spacedBtn` and `exportBtn` in `wire()` at line 438. File 1 dropped both buttons from HTML and `wire()`.

4. `makeChoices()` in Files 2 and 3 (line 403) uses `selected=Math.max(0, choices.indexOf(dx))` — the selected cursor starts on the correct answer. File 1 line 402 uses `selected=Math.floor(Math.random()*4)` — a random initial selection. This is a deliberate behavioral difference but potentially confusing for accessibility.

5. `renderSolo` in Files 2–3 (line 409) reads `timerMax=parseInt($('soloTimerInput')?.value || 9)` — defaults to 9 seconds, consistent with the global `timerMax=9` declaration. File 1 reads `|| 7` — inconsistency introduced in File 1.

### B. File 3 vs File 4 (Earlier Prior vs Blank Import)

1. Files 3 and 4 share the identical patch stack. The only structural difference is `DATA.cards` size (File 3 has a full medical deck; File 4 has `"cards_embedded":0, "cards":[]`).

2. Both correctly set `bionicOn=true`, use `soloStudyingState_v1757` as the state key, and wire `spacedBtn`/`exportBtn`.

3. File 4 has `"import_ready":true` in its metadata, making it the correct shell for import-only workflows. File 1 also has `"import_ready":true` but removed the embedded cards at line 387.

4. No functional differences between Files 3 and 4 at the JS level — File 4 is a strict subset.

### C. File 2 vs File 4 (Old Prior vs Blank Import)

1. Same patch stack, same behavior. The presence or absence of `DATA.cards` does not affect any patch logic since all patches guard with `cards||[]` or `getCards()`.

2. The `loadState()` / `saveState()` key `soloStudyingState_v1757` is identical in both — player progress is portable between these files.

3. Both correctly handle empty-card state: `cardPool()` returns `cards` (empty array), `nextCard()` would fail with `current=undefined`. Both Files 2 and 4 lack the `hasCardsOrWarn()` guard that File 1 added at line 1757. This means in Files 2/4 with no cards loaded, clicking Solo launches and immediately crashes at `$('soloSystem').textContent=current.system` with a null reference error.

### D. File 1 vs All (Current vs all others — 5–10 errors each)

1. **`bionicOn=false` init (File 1 only, line 388)**: All other files use `true`. First-session users see unbolded text. No migration code exists.

2. **Removed `spacedBtn` and `exportBtn` from HTML (File 1 only, line 386)**: Files 2–4 have both. `wire()` in File 1 does not wire `spacedBtn`, breaking Spaced Repetition direct access. Patches at line 1365 try to re-add it dynamically but only if the button already exists in DOM, which it does not.

3. **`heroSub` text set to "BOARD PREP-MEDICINE" (File 1 line 386)** — the subtitle duplicates the title. Files 2–4 use "Solo Studying · Knowledge Expansion" which is meaningfully different.

4. **`promptField` default in base `wire()` Apply handler (File 1 line 1660)**: `promptField='presentation'` is hardcoded, ignoring the dropdown value. Files 2–4 read `$('promptField').value`. File 1 forces presentation mode regardless of settings.

5. **`makeChoices()` is called with a `c` argument in `startCard(c)` at line 1338** but the base `makeChoices()` takes no arguments and uses the global `current`. The call `choices=makeChoices(c)` assigns the return value of `makeChoices()` (which returns `undefined`) to `choices`, silently clearing the choices array. This bug exists in Files 2–4 as well at the equivalent `startCard` line (~1338), but it is particularly dangerous in File 1 because `startCard` is the entry point for both Shadow Dungeon and review-item clicks.

6. **Twelve persistent `setInterval` polling loops (File 1 only)**: Lines 1807, 2668, 2915, 3817, 4077, 4110, 4735, 4894, 5187, 7660, 12213 — none of these exist in Files 2–4. They fire continuously regardless of what screen is visible, consuming CPU and causing layout thrash.

7. **`render175158` (final `reveal` override, File 1 line 2196)** appends a `continueHint175158` div to the reveal element on every call. The reveal element persists between cards (it is hidden, not removed). Over a session of 50 cards, 50 hint divs accumulate in the DOM. File 1 has `cleanRevealHints()` but it only cleans `.continueHint175153`, `.continueHint175157`, `.continueHint175158` — there are also `.reveal::after` CSS pseudo-elements from three separate CSS blocks that all try to show the same hint text.

8. **`canonicalCardId` at line 10957 (File 1 only)**: This function exists in a PHASE2-only FSRS patch block and uses 8 fallback fields (`qid_unique`, `card_id`, `qid`, `id`, `original_qid`, `legacy_id`, `json_id`, `qid`). The base `record()` function at line 423 uses `c.id||c.qid` as the state key. These are different ID resolution strategies. If `canonicalCardId` returns a value that differs from `c.id||c.qid` for any card, FSRS state and base state are stored under different keys and never reconciled.

9. **`window.show` is wrapped by v175153 at line 1539**: `show=function(id){prevShow(id); if(id==='settings') setTimeout(enhanceSettingsFinal,0);}`. This means every call to `show()` throughout the app — including mid-game calls — triggers a settings enhancement check. `enhanceSettingsFinal` at line 1467 reads DOM elements and sets event handlers. This runs even during Solo gameplay when settings are not visible.

---

## TOP 5 HIGH-IMPACT ERRORS (cross-validated across all files)

### #1 — `selectSolo` is overridden 13 times; stale timer handles cause double-advance

**Files affected:** File 1 only (lines 865, 1058, 1229, 2790, 3100, 4316, 4429, 4585, 4757, 5826, 7235, 8098 plus base at 412).

**Root cause:** Every drop-mechanic patch wraps `selectSolo` to cancel its own timer on answer. But each patch uses a different local variable for its rAF/timeout handle: `dropTimer` (v17514), `autoHandle` + `warnHandle` + `tickHandle` (v17515), `raf` (v175151). A wrapper from patch N cancels only its own handle. Handles from patch N-1 are in different closure scope and are never cancelled.

**How it manifests:** After answering correctly, the reveal card appears, the user clicks Continue — and then 0–7 seconds later the game advances a second time on its own, skipping a card. Streak and gate counter jump unexpectedly. Hard to reproduce consistently because timing depends on which rAF loop happened to be running.

**Frequency × impact:** High frequency (reproducible every session), maximum gameplay impact.

---

### #2 — `bindRatings` accumulates duplicate click handlers across the 12-deep reveal chain

**Files affected:** File 1 primarily; Files 2–4 have 4-deep chain with the same structural problem but less severe.

**Root cause:** `bindRatings` at line 421 uses `document.querySelectorAll('[data-rate]').forEach(b => b.onclick = ...)`. The `innerHTML` of `soloRevealRatings` is reset by each reveal layer before `bindRatings` is called, so the buttons are new DOM nodes each time — `.onclick` assignment is safe. But when `spacedOn=false`, some reveal layers inject a simpler ratings HTML (just a Continue button) and some inject the full 6-button set, then call `bindRatings` again. The result: after a wrong answer with `spacedOn=false`, the Continue button's onclick fires `advance()`, which is correct, but the auto-advance timeout (`answerAutoAdvanceHandle`) set 2–3 layers deep in the chain is not cleared — so `advance()` fires a second time 7 seconds later.

**How it manifests:** After answering, clicking Continue works, next card loads, then 7 seconds later the app auto-advances again mid-question, skipping the new card.

**Frequency × impact:** Reproducible whenever `spacedOn=false`, high impact on study flow.

---

### #3 — Timer setting in Settings has no effect (Apply never writes `cozyQuestionSeconds351`)

**Files affected:** All four files share this bug in the base `wire()` Apply handler.

**Root cause:** `wire()` Apply (line 437 in File 1) reads `deckMode`, `promptField`, `autoSelect`, `bionicOn` from the UI but never calls `localStorage.setItem('cozyQuestionSeconds351', $('soloTimerInput').value)`. The `renderSolo` function reads `cozyQuestionSeconds351` from localStorage as its primary source. If the key is never written, `renderSolo` always falls back to `7` (File 1) or the UI input default of `9` (Files 2–4) — whichever the fallback chain provides, never the user's saved value.

**How it manifests:** User opens Settings, changes timer to 15 seconds, clicks Apply, starts game — timer is still 7 seconds. User assumes the setting worked; it did not.

**Frequency × impact:** 100% reproducible, moderate impact (timer preference silently ignored).

---

### #4 — `bionicOn` default regression + 3-key split-brain persistence

**Files affected:** File 1 (regression from Files 2–4).

**Root cause:** File 1 declares `bionicOn=false` at line 388. Files 2–4 declare `bionicOn=true`. Additionally, File 1 has three localStorage keys in use simultaneously for bionic state: `cozyBionic351`, `bionicOn_v1751523`, and `soloStudying_spacedOn_v175153` (the last one is a typo-class error where a bionic read may accidentally read the spaced-rep key). At DOMContentLoaded, at least 4 patches try to hydrate `bionicToggle.checked` from different keys in non-deterministic order. The last patch to run wins.

**How it manifests:** Bionic emphasis is OFF on every fresh load regardless of user preference. Changing it in Settings and applying correctly saves it — but on the next page reload, if the hydration patches fire in an order where the key-null path runs last, it resets to false again. This is intermittent and hard to diagnose.

**Frequency × impact:** 100% on first load (wrong default), intermittent on reload (non-deterministic key race).

---

### #5 — `makeChoices()` return value used as array assignment in `startCard()`

**Files affected:** Files 1, 2, 3, 4 all have this bug at the `startCard` equivalent (line 1338 in File 1).

**Root cause:** Base `makeChoices()` signature (line 402) takes no parameters and returns `undefined` (it mutates the global `choices` array as a side effect). The `startCard` function at line 1338 calls `choices=makeChoices(c)` — assigning `undefined` to `choices`. The game then reads `choices[0..3]` which are all `undefined`, rendering blank answer buttons.

**How it manifests:** Launching a card from Shadow Dungeon or review list shows blank choice buttons. The correct answer is `undefined`, so auto-select fires and `selectSolo(0)` runs with `choices[0]===undefined`, which never equals `clean(current.diagnosis)`, so the answer is always marked wrong.

**Frequency × impact:** 100% reproducible on any Shadow Dungeon / review-launched card, high impact on the review workflow.

---

## DIFFERENTIAL — 20-Step Rectifier Plan

*Ordered: each step unblocks or cleans up the next.*

---

**Step 1 — Fix `makeChoices` call signature in `startCard`**
- Location: File 1, line 1338
- Change: `choices=makeChoices(c)` → `current=c; makeChoices(); mode='solo';`
- Expected outcome: Review/Shadow Dungeon cards show correct choices
- Validation: `current={diagnosis:'Test',presentation:'Q',quick_recall:'Q',system:''}; makeChoices(); choices.length === 4` in console

**Step 2 — Fix `bionicOn` initial declaration**
- Location: File 1, line 388
- Change: `bionicOn=false` → `bionicOn=true`
- Expected outcome: Fresh-load sessions start with bionic ON (matching Files 2–4 behavior)
- Validation: Reload with cleared localStorage; `bionicOn === true` in console on first load

**Step 3 — Consolidate bionic persistence to one key**
- Location: File 1, all patches that write/read bionic state
- Change: Remove reads from `cozyBionic351` and remove writes to `cozyBionic351`; use `bionicOn_v1751523` exclusively throughout. Remove the `cozyBionic351` read at line 5182.
- Expected outcome: One key, one truth, no race between patches
- Validation: `localStorage.setItem('bionicOn_v1751523','1'); location.reload();` — bionic should be ON

**Step 4 — Fix `soloTimerInput` Apply: write to `cozyQuestionSeconds351`**
- Location: File 1, the effective Apply handler (whichever runs last — approximately the `applySettings175157` function at line 1868, or wherever `applyBtn.onclick` is last assigned)
- Change: Add `localStorage.setItem('cozyQuestionSeconds351', $('soloTimerInput')?.value || 7)` inside the Apply function
- Expected outcome: Setting timer to 12s and clicking Apply causes game to use 12s
- Validation: Set input to 12, Apply, start Solo, watch timer bar — should drain over ~12 seconds

**Step 5 — Normalize `timerMax` hardcoded literals**
- Location: File 1 lines 826, 848, 1040, 1164, 1195 — replace each `DURATION_MS/1000` and literal `7` with `parseInt(localStorage.getItem('cozyQuestionSeconds351')||7)||7`
- Expected outcome: All drop-mechanic patches respect the saved timer setting
- Validation: Same as Step 4

**Step 6 — Cancel ALL drop-mechanic handles in a single `stopAllDropTimers()` helper**
- Location: File 1, create one shared function that clears `dropTimer`, `autoHandle`, `warnHandle`, `tickHandle`, `raf`, `raf175164`, `answerAutoAdvanceHandle`, `answerAuto`
- Change: Each `selectSolo` override calls `stopAllDropTimers()` before calling the base
- Expected outcome: No stale timer fires after answer; no double-advance
- Validation: Answer a card, immediately click Continue; wait 10s; card does not auto-advance again

**Step 7 — Remove the v17513 and v17514 rAF drop patches entirely**
- Location: File 1, lines 606–725 (v17513 behavior patch for falling lanes) and lines 771–876 (v17514 drop mechanics)
- Rationale: v175151 (lines 1122–1262) is the final and correct implementation. v17513 and v17514 are superseded and their `updateSoloVisuals`, `renderSolo`, `selectSolo`, `loopSolo` overrides compete with v175151.
- Expected outcome: 4 fewer function wrappers in the call chain; timer state managed by one patch only
- Validation: Game starts; choices drop from top; choices freeze on selection

**Step 8 — Remove the v17515 CSS-drop patch**
- Location: File 1, lines 880–1073 (style block + script block for `v17515-css-drop-final`)
- Rationale: CSS `animation` approach competes with v175151's rAF `transform`. The CSS animation class `v17515-css-drop` is explicitly removed by v175151's `renderSolo` (line 1044), but the `autoHandle` setTimeout (line 1027) that fires after `DURATION_MS+30` is in this patch's closure — not cleared by v175151. This is the primary source of double-advance (Error #1 above).
- Expected outcome: Eliminates the most common double-advance scenario
- Validation: Play 20 cards; no spontaneous card skips

**Step 9 — Consolidate `spacedOn` persistence to one key: `soloStudying_spacedOn_v175157`**
- Location: Patches at lines 515, 1390, 1394, 1608, 1614, 1794, 1856, 1861
- Change: All reads fall back `v175157 ?? v175153 ?? v1759`; all writes go to `v175157` only. Remove the `soloStudying_spacedOn_v17.5.15.8` key check at line 1794 (uses dots in key name, which is valid but confusing).
- Expected outcome: spaced-rep toggle persists correctly across reloads
- Validation: Check spacedOn, reload, verify it matches

**Step 10 — Reduce `bindRatings` to one call per reveal**
- Location: Final `reveal` implementation (reveal175158 at line 2196)
- Change: After setting `innerHTML` on the ratings container, call `bindRatings(which)` exactly once at the end. Add `return` to prevent prior reveal layers from calling `bindRatings` a second time after the final layer already did.
- Expected outcome: Rating buttons work with exactly one handler per button
- Validation: Click "Again" — card advances once only; no second advance fires

**Step 11 — Consolidate click-outside-to-continue to one handler**
- Location: Remove the `outsideAdvanceHandler` DOMContentLoaded at line 497 and the `patchWire1759` click binding at line 597. Keep only the v175157 `clickRevealAdvance` at line 2035 (it has the `dataset.v175157Click` guard).
- Expected outcome: One click fires `advance(which)` exactly once
- Validation: Click outside reveal on Solo; advance fires once; wait 5s; no second advance

**Step 12 — Remove duplicate keydown handlers for reveal continuation**
- Location: File 1 lines 436 (base keydown), 703 (install17510 keydown, capture=true), 1528 (v175153 keydown, capture=true), 1639 (v17.5.15.8 keydown, capture=true), 2036 (v175157 keydown, capture=true)
- Change: Keep only line 2036 (v175157, capture=true, most complete logic). Remove the others' reveal-continuation branches.
- Expected outcome: ArrowRight/Enter advance the reveal once
- Validation: During reveal, press ArrowRight once — card advances once

**Step 13 — Fix `applyBtn` to have exactly one onclick**
- Location: File 1. The final effective Apply handler is `applySettings175157` at line 1868. Wire it directly: `q('applyBtn').onclick = applySettings175157` at one place only.
- Change: Add a `dataset.wiredApply` guard so no subsequent patch overwrites it
- Expected outcome: Apply saves all settings including timer
- Validation: Change all settings, click Apply, refresh page, open Settings — values persist

**Step 14 — Fix settings "Continue" to exactly one button**
- Location: File 1, settings panel
- Change: `cleanupSettingsButtons()` at line 1904 is correct but only fires on `openSettings175157`. Move cleanup to the settings panel's first render, not just on open. Keep only `settingsContinue175157`.
- Expected outcome: Settings panel shows one Continue button
- Validation: Open Settings — count Continue buttons in DOM: `document.querySelectorAll('#settings button').length` should decrease

**Step 15 — Stop the 12 persistent `setInterval` polling loops**
- Location: Lines 1807, 2668, 2915, 3817, 4077, 4110, 4735, 4894, 5187, 7660, 12213
- Change: For each interval, evaluate its purpose:
  - `wireSettingsReturn` (1807): Convert to one-time DOMContentLoaded call — the re-wire logic only needs to run once
  - `normalizeTitle`/`standardHud` (2668, 2915): Convert to event-driven calls inside `home()` and `show()`
  - `syncRunner`/`dedupeRunner` (4077, 4110): Convert to one-time init in `renderSolo`
  - All others: Convert to one-time calls or remove
- Expected outcome: CPU usage drops; no more periodic DOM thrash
- Validation: `performance.now()` across 30s shows no layout reflows during idle gameplay

**Step 16 — Add `|| ''` fallbacks to `fullCard()` base**
- Location: File 1, line 430
- Change: Wrap each field reference: `current.qid||''`, `current.test||''`, `current.system||''`, `current.one_thing||''`, `current.board_trigger||''`, `current.explanation||''`
- Expected outcome: Full Card modal never shows the word "undefined"
- Validation: Import a CSV deck, play a card, open Full Card — no "undefined" text

**Step 17 — Fix `renderSolo` timerMax to read `soloTimerInput` consistently**
- Location: File 1, line 408 base `renderSolo`
- Change: `timerMax=parseInt(localStorage.getItem('cozyQuestionSeconds351') || $('soloTimerInput')?.value || 9) || 9` — use `9` as fallback to match Files 2–4 and the global init declaration
- Expected outcome: No discrepancy between global `timerMax=9` and render-time value

**Step 18 — Restore `spacedBtn` to home HTML**
- Location: File 1, line 386 HTML
- Change: Add `<button id="spacedBtn" class="btn">Spaced Repetition</button>` back to the home `.controls` div
- Wire it in `wire()`: `on('spacedBtn', showReview)`
- Expected outcome: Direct access to review deck from home screen
- Validation: Click Spaced Repetition from home — review screen opens

**Step 19 — Consolidate `reveal` overrides to one authoritative implementation**
- Location: File 1. `reveal175158` at line 2196 is the most complete and correct implementation.
- Change: Make `reveal175158` the only active override. Remove `window.reveal = reveal =` at lines 525, 1511, 1957, 3120, 3391, 3541, 4405, 4765, 5804. Keep 9636 and 9960 only if FSRS integration requires them.
- Expected outcome: One `reveal()` implementation; one `bindRatings()` call; no chained promise of prior layers
- Validation: `window.reveal.toString().length < 1500` (single implementation, not a chain)

**Step 20 — Add `|| ''` to `reveal` field reads and guard `current` nullcheck**
- Location: File 1, final `reveal` implementation
- Change: Add `if(!current) return;` guard at top. Ensure `current.diagnosis || current.answer || ''` pattern used throughout.
- Expected outcome: No crash if `reveal` fires after `home()` clears state
- Validation: `current=null; reveal('solo',true)` — should no-op, not throw

---

## GOAL Condition

**Done looks like:** `browser: window.runFSRSValidation() → 17/17`

For pre-FSRS gameplay verification: after Steps 1–12 are applied, the basic game loop validates as:

```
browser: selectSolo(0); setTimeout(()=>console.assert(!document.getElementById('soloReveal').classList.contains('hidden')), 700)
→ Expected: assertion passes (reveal visible after 700ms)

browser: let count=0; const orig=advance; window.advance=function(w){count++;orig(w)}; /* click Continue */ ; setTimeout(()=>console.assert(count===1,'advance fired '+count+' times'),8000)
→ Expected: count === 1 (no double-advance within 8 seconds)
```

---

## Codex Browser Testing Prompts

**1. Bionic default check**
```
Run: localStorage.clear(); location.reload();
// After reload:
console.log('bionicOn default:', typeof bionicOn !== 'undefined' ? bionicOn : 'UNDEFINED');
Expected: true
If fails: bionicOn=false — bionic initial value regression (Step 2 in plan)
```

**2. Timer setting persistence check**
```
Run: document.getElementById('soloTimerInput').value = 12; document.getElementById('applyBtn').click(); console.log('saved key:', localStorage.getItem('cozyQuestionSeconds351'));
Expected: "12"
If fails: Apply button never writes cozyQuestionSeconds351 (Step 4 in plan)
```

**3. Double-advance check**
```
Run: let advances=[]; const orig=window.advance; window.advance=function(w){advances.push({w,t:Date.now()});return orig(w);}; startSolo();
// Answer any card, then click Continue. Wait 10 seconds, then:
console.log('advance calls:', advances.length, advances.map(a=>a.t));
Expected: advances.length === 1
If fails (2+): Stale timer handle firing after answer (Steps 6-8 in plan)
```

**4. makeChoices return-value check (Shadow Dungeon launch)**
```
Run: if(!cards.length){console.warn('No cards loaded — import a deck first'); } else { current=cards[0]; choices=makeChoices(current); console.log('choices:', choices, 'valid:', Array.isArray(choices) && choices.length===4 && choices.every(c=>typeof c==='string')); }
Expected: valid: true
If fails (valid: false, or choices=undefined): makeChoices return-value bug (Step 1 in plan)
```

**5. bindRatings call-count check**
```
Run: let bindCount=0; const origBind=window.bindRatings; window.bindRatings=function(w){bindCount++;console.log('bindRatings call #'+bindCount);return origBind(w);}; startSolo();
// Answer a card. Check console after reveal appears.
Expected: bindRatings called 1 time
If fails (2+ calls): Duplicate binding across reveal chain layers (Steps 10, 19 in plan)
```

**6. Polling interval audit**
```
Run: let intervals=[]; const origSI=window.setInterval; window.setInterval=function(fn,ms){const id=origSI(fn,ms); intervals.push({id,ms,fn:fn.toString().slice(0,60)}); return id;}; /* reload page, then: */ console.table(intervals.filter(x=>x.ms>=500));
Expected: 0–3 entries (notify countdown, gameplay ticker, maybe one UI sync)
If fails (10+ entries): Polling loop accumulation (Step 15 in plan)
```

**7. Full Card modal undefined-field check**
```
Run: current=cards[0]; fullCard(); const text=document.getElementById('modalText').textContent; console.log('has undefined:', text.includes('undefined'), 'text length:', text.length);
Expected: has undefined: false
If fails: Missing || '' fallbacks in fullCard (Step 16 in plan)
```

**8. Settings Continue button count**
```
Run: show('settings'); setTimeout(()=>{ const btns=[...document.querySelectorAll('#settings .controls button, #settings button')].filter(b=>/^continue$/i.test(b.textContent.trim())); console.log('Continue buttons:', btns.length, btns.map(b=>b.id)); }, 100);
Expected: 1 button with id="settingsContinue175157"
If fails (2+): Duplicate Continue buttons from multi-patch injection (Step 14 in plan)
```

---

## Summary: What a Clean Rewrite Would Look Like

- **One flat initialization block** (~40 lines): declare all globals with correct defaults (`bionicOn=true`, `timerMax=9`), load state from `soloStudyingState_v1757`, hydrate all settings from exactly one localStorage key per setting at page load — no per-patch hydration races.

- **One `reveal(which, ok)` implementation** (~40 lines): reads `window.spacedOn` once, builds ratings HTML once, calls `bindRatings(which)` once, sets one auto-advance timeout stored in one variable (`autoAdvanceHandle`). No chained prior-reveal calls.

- **One drop-mechanic implementation** for Solo: a single `requestAnimationFrame` loop started by `loopSolo()` and cancelled by `selectSolo()`. No CSS animation, no competing setInterval. `timerMax` always read from `parseInt(localStorage.getItem('cozyQuestionSeconds351') || 9)`.

- **Event-driven settings wiring**: `applyBtn.onclick` assigned once in `wire()`, never overwritten. `show('settings')` triggers one settings-enhance call with idempotency flag. No `setInterval` re-wiring loops.

- **Patch code that can be deleted entirely** (do not refactor, delete): v17513 behavior patch (lines 606–725), v17514 drop patch (lines 771–876), v17515 CSS-drop patch (lines 880–1073), the `outsideAdvanceHandler` DOMContentLoaded block (lines 488–501), `patchWire1759` (lines 589–601), and `wireSettingsReturn` setInterval (line 1807). These are all superseded by later patches that already exist in the file.

---

## Execution Log

### Steps 1 + 6–8 — DONE 2026-05-26

**Commits:** `d162708` (code), `8741251` (validation + undo)

**What was executed:**
- Step 1: Removed `choices=` assignment from `makeChoices()` call sites at `renderReviewList` onclick (line 690) and `startCard()` (line 1338). `makeChoices()` already mutates the global `choices` array; assigning its `undefined` return was wiping choices on every Shadow Dungeon / review-launched card.
- Step 6: Added `window.loopSolo = loopSolo = function(){ clearInterval(ticker); }` override inside v175151 (renderSolo already starts the rAF drop via `startDrop()` — base ticker no longer competes). Added `window.stopAllDropTimers` helper.
- Step 7: Deleted v17513 drop-mechanic overrides (`updateSoloVisuals` + `renderSolo` overrides within the IIFE). Deleted v17514 `<style>` + `<script>` blocks entirely.
- Step 8: Deleted v17515 `<style>` + `<script>` blocks entirely. This eliminates the `autoHandle = setTimeout(selectSolo, DURATION_MS+30)` that was the primary source of double-advance — v175151's `safeClear()` only cancelled v175151's own `raf`, not v17515's `autoHandle`.
- Smoke tests updated: `previewInterval('good')` expected `'3d'` (FSRS); `rateCard hard` expected FSRS interval/ease.
- **Bonus (user prompt):** Added `v175372-rectifier-undo-makechoices-smoke` script — Cmd/Ctrl+Z and iOS shake-to-undo restore the last selected Solo card to its pre-answer state, reverting both FSRS progress and `state` entries. Exposed as `window.undoReview()`.

**Validation results (browser, 2026-05-26):**
| Check | Result |
|-------|--------|
| `choices` is Array(4) of strings after startCard | ✅ PASS |
| No double-advance (advance fired exactly once in 10s) | ✅ PASS |
| Cmd/Ctrl+Z restores prior card | ✅ PASS |
| `loopSolo` does not restart base ticker | ✅ PASS |
| No legacy choiceRow classes (`v17514-live-drop`, `v17515-css-drop`) | ✅ PASS |
| `window.runFSRSValidation()` | ✅ 17/17 |
| `window.runCozySmokeTests()` | ✅ 6/6 |

### Step 2 — DONE 2026-05-26

**What was executed:**
- Changed base `bionicOn` default to `true`.
- Consolidated all `localStorage.getItem/setItem('cozyBionic351')` paths to `bionicOn_v1751523`.
- Updated bionic hydration defaults so missing storage means ON, not OFF.
- Created/updated the settings drawer at boot so `drawerBionic351` is available and mirrors the single key after reload.

**Validation results (browser, 2026-05-26):**
| Check | Result |
|-------|--------|
| Fresh load after `localStorage.clear()` → `bionicOn === true` | ✅ PASS |
| `bionicOn_v1751523='1'` reload → `bionicOn` true + drawer checked | ✅ PASS |
| `bionicOn_v1751523='0'` reload → `bionicOn` false + drawer unchecked | ✅ PASS |
| Applying bionic toggle writes only `bionicOn_v1751523` | ✅ PASS |
| `window.runFSRSValidation()` | ✅ 17/17 |
| `window.runCozySmokeTests()` | ✅ 6/6 |

**Next:** Step 3 — fix the `patchSettingsText()` 1200ms interval so it does not race settings state.

---

## 2026-06-15 — Render Glitch Root Cause Analysis (No Code Changes)

**Session type:** Diagnosis + audit only. No index.html changes. FSRS 17/17 / smoke 6/6 confirmed pre-session.

**Method:** Combined Claude static analysis of index.html (~14,500 lines) + Codex headless Chrome/CDP browser audit (6m 33s, port 8897, PHASE2). Instrumented: `selectSolo` call events + timestamps, CSS variable `--soloDropY` and `--soloDropY351` mutations, `document.body.className` changes, `soloQuestion.innerHTML` write events.

### Findings

**Claude pre-audit claims (static analysis):**
- System 1 RAF (`DROP_MS=7000`) fires `selectSolo(0)` at 7s hardcoded → premature auto-select
- Font flicker = two competing writers: `bionic()` vs `bionicHTML351()`
- Primary body class clear = line ~832 (System 1 renderSolo)

**Codex browser audit results — corrections to Claude's static analysis:**

| Claim | Result |
|---|---|
| System 1 `DROP_MS=7000` causes premature auto-select | **DISPROVED** — with 13s setting, `selectSolo` fired at ~13.0s. System 3 (`soloStableRaf351`) is the live timer, not System 1. |
| Font flicker = two writers | **INCOMPLETE** — Codex found THREE writers. `installBionicQuestionPatch352` (~line 7438) is a third writer that re-applies plain text AFTER bionic pass. |
| Body class clear at line ~832 | **INCOMPLETE** — active clear is at ~line 3939 (System 2 render path), not only line ~832. |

**New confirmed root causes:**

| ID | Root Cause | Browser Evidence |
|---|---|---|
| FQ-RENDER-1 | System 2 + System 3 drop engines both run simultaneously; `selectSolo` fires twice ~42ms apart per card; all 10 outer selectSolo wrappers execute twice (undo, rating, energy) | Both `--soloDropY` and `--soloDropY351` CSS vars animated; two `selectSolo` events 42ms apart |
| FQ-RENDER-2 | `document.body.className=''` at ~line 3939 is the live active clear (System 2 path), drops layout classes | Body className observed going empty and returning on each card advance |
| FQ-RENDER-3 | `installBionicQuestionPatch352` (~line 7438) re-writes `soloQuestion.innerHTML` as plain text after `rerenderVisibleBionic351` has written bionic HTML | Three `innerHTML` write events per card; last write = plain text, strips `<b>` |
| FQ-RENDER-4 | 700ms debounce at layer 11 (last of 11 selectSolo wrappers) — outer 10 wrappers bypass it per dual-fire | Static analysis confirmed; undo + rating outer layers always fire twice |

### Fix Targets (Pending — Next Codex Code Task)

| Fix | Location | Change |
|---|---|---|
| FQ-RENDER-1 | `startStableSoloDrop351` (~line 6948) | `clearSoloDrop()` at top — cancel System 2 RAF before System 3 starts |
| FQ-RENDER-2 | ~line 3939 | Save/restore `cozy*`/`na-*`/Drawer classes around `document.body.className=''` |
| FQ-RENDER-3 | `installBionicQuestionPatch352` (~line 7438) | Guard: skip write if `soloQuestion.innerHTML` contains `<b>` |
| FQ-RENDER-4 | debounce layer | Structural — move to outermost call site; defer until FQ-RENDER-1–3 stable |

All fixes = **inline source edits in existing code**. No new `<script>` blocks. No new wrappers.
Validation gate: `runFSRSValidation()` 17/17 + `runCozySmokeTests()` 6/6 after each fix.

---

## 2026-06-15 (session 2) — FSRS Rating Path Overwrite Fix — commit 048d073

**Symptom reported:** Cards showing as Good/Easy too soon after being rated "Again." Explicit Again button appeared to be ignored.

**Root cause confirmed (browser probe):** The base `selectSolo` function (line ~408) fired an anonymous `setTimeout(rateCard(id, ok?'good':'again'), 8000)`. Because the timer was anonymous, no handle was stored and it could NOT be cancelled. When a user correctly answered a card (ok=true) and clicked "Again" explicitly, the explicit `rateCard(id,'again')` ran correctly (10m relearning), but 8 seconds later the anonymous timer fired `rateCard(id,'good')` — overwriting the schedule to 3 days. This is the "Good/Easy too soon" bug.

**Secondary risk from `pendingFor()` (rating path rectifier, line 14341):** The rectifier also sets `window.__cozyAutoRateHandle20260603` at 8200ms in `pendingFor()`. Before this patch, both the base selectSolo timer and the rectifier's timer competed, making explicit cancellation impossible.

**Changes — commit 048d073:**

| Location | Change |
|---|---|
| `selectSolo` base (~line 408) | Changed anonymous `setTimeout` → `window.__cozyAutoRateHandle20260603=setTimeout(...)` — handle now stored, cancellable |
| New script `cozy-explicit-rating-stabilizer-2026-06-11` | Added after existing rectifier script |
| `pool351` calc (~line 7280) | Added `selectedOrder` fallback guard before `sessionPool()` call |

**New script details (`cozy-explicit-rating-stabilizer-2026-06-11`):**
- `clearDeferredAutoRate()` — clears `__cozyAutoRateHandle20260603` + `__cozyPendingRating20260603`
- `requeueAgainCard(card, rating)` — for 'again': if card has future `next_due_at`, clears `poolKey` (forces next pool rebuild) and returns; if due/null, deletes from `seenThisSession` only. Does NOT splice card back into current session pool.
- `wrapRate()` — wraps `rate(card, rating)`, calls `clearDeferredAutoRate()` on any explicit rating, then `requeueAgainCard()`
- `wrapRateCard()` — wraps `rateCard(cardId, rating)`, calls `clearDeferredAutoRate()` on any explicit rating
- Installs at page load + 700/1600/3200/5200/8000ms

**Probe validation results:**

| Scenario | Result |
|---|---|
| Again → stage/interval | relearning / 10m ✅ |
| Hard → interval | 1d ✅ |
| Good → interval | 3d ✅ |
| Easy → interval | 15d ✅ |
| `runFSRSValidation()` | 17/17 ✅ |
| `runCozySmokeTests()` | 6/6 ✅ |

**SW version bumped:** `cozy-arcade-PHASE2-v18`

**Remaining open risks after this patch:**

| Risk | Detail |
|---|---|
| `repair_point=true` on wrong answers + E7G pool | `record()` sets `repair_point=true` when ok===false. E7G makes repair_point cards always immediately due in Review Deck. So "again" cards appear in next Review Deck session before their 10-minute due time. By design but may feel "too soon." |
| 18 review-stage rows with `next_due_at=null` in data | `isDue()` returns true when next_due_at=null and seen_count>0 → these cards are always "due" → appear in every session, creating illusion of accelerated review |
| 56 ghost-seen rows in export | Cards with seen/reviewed counts but null rating/stability — behave unpredictably in pool |
| Wrapper accumulation on `rate()` | Both `installRatingPathHooks20260603` and explicit stabilizer reinstall at overlapping timeouts; each pair can add layers to the chain; functionally idempotent but architecturally messy |
| "Again" not in current session pool | `requeueAgainCard` removes from seenThisSession but does NOT splice into current pool → true Anki learning-step behavior (failed card back in ~10 min in same session) is not implemented |
| FQ-RENDER-1 dual-fire still present | selectSolo still fires twice per card via dual drop engines; outer rating wrappers may double-write FSRS (these are the render bugs, separate issue) |

---

## 2026-06-16/17 — FQ-RENDER-1 Root Cause Confirmed + DOM Guard Fix

**Session type:** Active bug fixing. 3 failed attempts before correct fix.
**FSRS validation:** 17/17 pre-session ✅ | smoke 6/6 pre-session ✅

### Root Cause (confirmed by Codex browser stack traces)

System 2 (`raf175164`) and System 3 (`soloStableRaf351`) run simultaneously for every card. Both expire at ~7s, System 2 fires `selectSolo` first (line 3924), System 3 fires 40ms later (line 6985). Prior fix attempts could not cancel System 2 because `clearSoloDrop()` is IIFE-scoped inside System 2's block — calling it from System 3's IIFE throws a silent ReferenceError.

### Attempt 1 — INSUFFICIENT (commit 8a22e66 PHASE2 / 243f182 PHASE1)
Prepended `window.stopAllDropTimers&&window.stopAllDropTimers()` before `try{clearSoloDrop();}catch(e){}` in `startStableSoloDrop351`. Also fixed FQ-RENDER-3: all soloQuestion bionic writes now use `(window.bionic||bionic)()`. Added `<b>` guard to PHASE1 `installBionicQuestionPatch352` (already in PHASE2 from dfb2ecc). SW PHASE2 v21→v22 / PHASE1 v56→v57. **Codex browser re-test: selectSolo still fired twice. clearSoloDrop() was a ReferenceError in System 3's scope.**

### Attempt 2 — INSUFFICIENT (commit ebeef5e PHASE2 / 767b0f1 PHASE1)
Added `window.loopSolo=loopSolo=function(){startStableSoloDrop351();}` at end of `startStableSoloDrop351` so `loopSolo()` calls restart stable mode instead of System 2. SW PHASE2 v22→v23 / PHASE1 v57→v58. **Codex browser re-test: still two fires. System 2's renderSolo wrapper calls `startDrop()` directly — bypasses loopSolo entirely.**

### Fix Applied — DOM class guard (commit 948abe7 PHASE2 / 2e04efd PHASE1)

In System 2's tick expiry (PHASE2 line 3924 / PHASE1 line 3936), replaced:
```
if(elapsed>=ms){ raf175164=null; if(typeof autoSelect==='undefined'||autoSelect) selectSolo(selectedIdx()); return; }
```
With:
```
if(elapsed>=ms){ raf175164=null; try{const _r=q('choiceRow');if((!_r||!_r.classList.contains('soloStableDrop351'))&&(typeof autoSelect==='undefined'||autoSelect)) selectSolo(selectedIdx());}catch(e){} return; }
```

`startStableSoloDrop351` adds `.soloStableDrop351` to choiceRow at card start. This class is present for the full ~7s duration. System 2's tick now checks this DOM signal before calling selectSolo — no cross-IIFE variable access, no scoping dependency. If stable mode is absent (class not on row), System 2 fires as fallback. SW PHASE2 v23→v24 / PHASE1 v58→v59.

**Status: Awaiting Codex browser validation (expect SS#1 once from System 3).**

### FQ-RENDER-3 Status
`(window.bionic||bionic)(getPrompt(current))` confirmed in browser: final soloQuestion HTML contains `<b>` tags. Write count still 3 (multi-writer churn ongoing), but bionic final state is correct. Deeper write-sequence fix deferred.

### What NOT to try again
- `clearSoloDrop()` from outside System 2's IIFE → always ReferenceError, always silent
- loopSolo reassignment alone → doesn't prevent direct `startDrop()` calls
- Static analysis to confirm cross-IIFE behavior → must use browser

### SW versions after this session
- PHASE2: `cozy-arcade-PHASE2-v24`
- PHASE1: `cozy-arcade-v59`

### Browser Validation — 2026-06-17 (Codex audit)

**Result: FQ-RENDER-1 CONFIRMED FIXED**

| Metric | PHASE2 | PHASE1 |
|--------|--------|--------|
| selectSolo fires | 1 (System3 line 6985) | 1 (System3 line 7017) |
| System2 at expiry | silent (line 3924) | silent (line 3936) |
| runFSRSValidation() | 17/17 ✅ | 17/17 ✅ |
| runCozySmokeTests() | 6/6 ✅ | 6/6 ✅ |
| Final bionic HTML | <b> present ✅ | <b> present ✅ |
| soloQuestion mutations | 3 (churn present but not blocking) | 3 |

Notes from audit:
- `String(window.renderSolo).includes('startStableSoloDrop351')` = false — later wrappers hide inner stable ref; this check is UNRELIABLE, removed from validation gates
- Domain mode not exercised — one domain smoke recommended before P5; source analysis suggests low regression risk
- Minor 404 (app-shell asset/favicon noise) — non-blocking
