# COZY ARCADE BOARD PREP MEDICINE
## Senior Developer Refactor Plan — v1.0
### Based on direct analysis of: `index.html` (10,604 lines, 654KB), `ABIM_DATABASE_first_10_cards_in_order.json`, `ABIM_DATABASE_random_20_cards_seed_20260521_PRETTY.json`

---

## PROJECT DIAGNOSIS

### Hard Numbers First

| Metric | Count | Risk Level |
|---|---|---|
| HTML file size | 654 KB / 10,604 lines | 🔴 Critical |
| `<style>` blocks | **40 separate blocks** | 🔴 Critical |
| `<script>` blocks | **46 separate blocks** | 🔴 Critical |
| Duplicate/re-defined JS functions | **101 functions** | 🔴 Critical |
| `reveal()` re-definitions | **14×** | 🔴 Critical |
| `cardPool()` re-definitions | **12×** | 🔴 Critical |
| `selectSolo()` re-definitions | **10×** | 🔴 Critical |
| `boot()` re-definitions | **10×** | 🔴 Critical |
| LocalStorage keys in use | **12 fragmented keys** | 🟡 High |
| CSS `!important` overrides | Pervasive across 40 blocks | 🟡 High |
| `three.js` (r134) imported | **Never called** (0 uses of `THREE.`) | 🟡 Medium |
| PWA manifest / Service Worker | **None** | 🟡 Medium |
| `one_thing` in live reveal | **Not shown** (only in fullCard modal) | 🟡 High |
| `sys` vs `system` field | Inconsistent — data uses `sys`, code checks both | 🟡 Medium |

---

### What Is Working

1. **Core gameplay loop (both modes)** — Solo Studying (falling MCQ rows + runner) and Knowledge Expansion (orbiting orb arena) both function. The last-defined function wins the override chain, and the v3.5.x patches have stabilized both.
2. **JSON import** — `importDeck()` (last definition in `cozy-public-v18-drawer-js`) correctly handles `{ metadata, cards }` format and raw arrays. Field normalization maps loose aliases to canonical names.
3. **State persistence** — `soloStudyingState_v1757` in localStorage holds seen/correct/pinned/rating per `card.id || card.qid`. Save/load works.
4. **Keyboard navigation** — Arrow keys, 1–4, A–D all functional in Solo mode.
5. **Rating system** — Pin / Again / Hard / Good / Easy per card.
6. **Bionic reading** — Toggle functional via `bionicOn` / localStorage.
7. **Export session** — Downloads JSON blob of current state.
8. **Spaced repetition review list** — Shows pinned + `rating='again'` cards.
9. **Aesthetic shell** — Dark neon blue/cyan/purple, Orbitron + DM Sans, animated HUD, fireworks, cursor glow, runner character. This is distinctive and worth preserving exactly.
10. **`board_trigger` display** — Appears in solo reveal (combined with `educational_objective`).
11. **Mobile breakpoints** — 760px / 820px responsive layouts exist.

---

### What Is Fragile

**CRITICAL — Function Override Chain:**
The current architecture works only because every patch block uses `window.functionName = functionName = function(...)` to overwrite the previous definition. This means:
- The browser must parse all 46 script blocks sequentially on every load
- A single syntax error in any late block silently breaks everything downstream
- Debugging requires knowing *which* of 14 `reveal()` definitions is currently active
- Adding a new patch requires reading the last-appended block to understand the current state

**CSS Specificity Wars:**
40 `<style>` blocks pile `!important` on top of `!important`. The last `!important` wins, but earlier `!important` declarations for the same properties cause the browser to evaluate the full cascade on every repaint. Visual glitches in future changes are near-certain.

**LocalStorage Fragmentation:**
12 separate keys across versioned name changes (`soloStudying_spacedOn_v175153`, `soloStudying_spacedOn_v175157`, `soloStudying_spacedOn_v17.5.15.8`) mean old data is orphaned silently. Users who've been using the app for multiple sessions may have state spread across 3+ incompatible keys.

**`one_thing` Not In Live Reveal:**
Despite `one_thing` being designated as the core back-of-card takeaway, it only appears in the `fullCard()` modal (behind a button click). The primary reveal shows `educational_objective || board_trigger`. This is a UX mismatch with the declared card flow: `presentation → diagnosis → one_thing → [expand to full card]`.

**State Key Uses `c.id || c.qid`:**
Actual card data has no `id` field — only `qid` and `qid_unique`. The key lookup falls back to `qid` correctly, but `qid` values like `"1 - 107216"` with spaces and hyphens are valid localStorage keys, so this works — but it's fragile if any future deck omits `qid`.

**Three.js Loaded and Unused:**
`<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js">` adds a network dependency and parse cost for a library with zero active usage. This is a leftover from a previous visual concept.

**No Graceful Offline Fallback:**
No PWA manifest, no service worker. The app requires network for the Google Fonts CDN and the (unused) three.js CDN. On a spotty hospital WiFi, the font will flash unstyled.

**`sys` / `system` Inconsistency:**
All 30 analyzed cards use `sys` (e.g., `"HEM/ONC"`, `"CV"`). The code checks `current.system || current.sys` in most places but `current.sys` in others. `fullCard()` displays `current.system` and gets empty string. The system badge in-game works only because the late patch blocks added `sys` fallback.

**`sys` Normalization Values Are Mixed Case:**
Values across 30 cards: `HEM/ONC`, `RENAL`, `CV`, `ID`, `PULM`, `RHEUM`, `Neuro`, `OB/GYN`, `Psych`, `GI`, `Rheum`, `PSYCH`, `STATS`, `Heme`. `RHEUM` and `Rheum` are the same system; `Psych` and `PSYCH` are the same. A future filter UI will produce silent mismatches.

---

### What Is Duplicated

- **`clean()` / `cleanText()` / `safeClean()` / `cleanText352()`**: 4 slightly different implementations of the same `trim + strip "NOT SPECIFIED IN SOURCE"` logic. They differ only in whether they also strip HTML tags or handle `null`.
- **`escHTML()` / `esc()` / `escapeHTML()` / `escapeText352()`**: Same HTML entity escaping, 4 definitions.
- **`bionic()` / `bionicQuestionHTML352()`**: Same bionic bold logic, 2 implementations.
- **`importDeck()`**: 5 definitions — each successive one adds more field aliases. Only the last runs.
- **`renderDomain()`**: 9 definitions — each tweaks orb positioning. Only the last runs.
- **`cardPool()`**: 12 definitions — each adjusts sort/filter logic. Only the last runs.
- **`decodeEntities352()`**: Implements a 5-pass entity decode loop. This is necessary but should live in one place.

---

### What Likely Causes Future Bugs

1. **Adding a new patch that accidentally shadows a variable** — e.g., `let cards = ...` in a new IIFE will shadow the global `cards` array within that function, breaking the entire deck for that block's duration without any error.
2. **Importing a deck with `system` instead of `sys`** — The normalization in `normalizeLimitlessCard` handles this, but `fullCard()` still reads `current.system` directly and will show blank.
3. **LocalStorage key mismatch on a new device** — A user on a new device will start fresh with 0 progress. Expected. But a returning user after a version update may have state under an old key that is never migrated.
4. **`index` counter never resets relative to `cardPool()` size** — `current = pool[index % pool.length]` is correct modulo arithmetic, but if `deckMode` changes mid-session (e.g., switch to `pinned` with 3 cards), `index` may be at 847, and `847 % 3 = 2`, which may feel non-sequential.
5. **`makeChoices()` pulls distractors from the full `cards` global** — If only 4 total cards are loaded, `[...new Set(others)].slice(0,3)` returns < 3 distractors and `choices` has < 4 items. `choices[selected]` may be `undefined`, causing `selectSolo()` to incorrectly compare `undefined === clean(current.diagnosis)`.

---

## NON-NEGOTIABLES

These must be preserved exactly across all refactor work:

1. **Medical content is untouched.** No field values in `presentation`, `diagnosis`, `educational_objective`, `board_trigger`, `one_thing`, `quick_recall`, `explanation`, `why_not_others` are modified, reformatted, or rewritten.
2. **Zero embedded cards by default.** The shipped HTML file contains `cards: []`. Decks are always imported by the user.
3. **Single-file HTML output for Phase 1–2.** No build step, no npm, no bundler. The output must be a droppable `.html` file.
4. **Existing state keys are migrated, not deleted.** Any refactor that changes the localStorage schema must read old keys and migrate them on first load.
5. **Dark neon blue/cyan/purple aesthetic is preserved.** CSS variable names, color values, and the overall visual identity do not change.
6. **`one_thing` / ONE THING TAKEAWAY is the primary back-of-card reveal**, not a secondary modal. This is a UX fix, not a content change.
7. **"Repair Point" replaces all failure/miss language.** No "Wrong", "Failed", "Incorrect" in UI copy.
8. **`sys` normalization is canonical** — the field `sys` is the source of truth for system. `system` is an alias. Both are accepted on import but stored/read as `sys`.
9. **`qid_unique` is the primary deduplication key** when present, then `qid`, then `hash(presentation + diagnosis)`.

---

## REFACTOR PLAN

### Phase 1 — Consolidate Without Breaking (1–2 sessions)
**Goal: One clean script block, one clean style block. Zero behavior change.**

#### 1A. CSS Consolidation

**Method:**
1. Extract all 40 `<style>` blocks into a temp file.
2. For each property that appears with `!important` in a later block and without in an earlier block, keep only the last-defined value and drop `!important` where it's now unnecessary.
3. Remove all duplicate selectors that set the same property to the same value.
4. Preserve all unique property values and all responsive breakpoints.

**Expected output:** ~1 consolidated `<style>` block of ~400–500 lines (down from 2,084+ lines across 40 blocks). No visual change.

**Sections to mark clearly in the single block:**
```css
/* === 1. CSS VARIABLES / ROOT === */
/* === 2. BASE RESET === */
/* === 3. SCREENS / LAYOUT === */
/* === 4. HOME PAGE === */
/* === 5. HUD === */
/* === 6. PROMPT BOX === */
/* === 7. SOLO GAME (choiceRow, choices, runner, track) === */
/* === 8. KNOWLEDGE EXPANSION (orbArena, orbs) === */
/* === 9. REVEAL OVERLAY === */
/* === 10. MODALS / PAUSE / NOTIFY / END === */
/* === 11. REVIEW / SETTINGS SCREENS === */
/* === 12. FX / SPARKS / TOAST === */
/* === 13. RESPONSIVE 760px === */
/* === 14. RESPONSIVE 820px === */
```

#### 1B. JS Consolidation

**Method:**
1. Extract all 46 script blocks. The "winning" implementation of each duplicate function is always the **last definition** in document order.
2. For each of the 101 duplicate functions: keep the last definition, delete all earlier ones.
3. Merge all IIFEs into a single top-level `<script>` block organized by logical section.
4. Preserve the `DATA` object literal and `loadState()` call at the very top.

**Sections to mark clearly in the single script block:**
```js
// === SECTION 1: APP DATA (DATA object, cards, state) ===
// === SECTION 2: UTILITIES (clean, escHTML, bionic, shuffle, toast) ===
// === SECTION 3: STORAGE (loadState, saveState, exportSession) ===
// === SECTION 4: CARD ENGINE (cardPool, nextCard, makeChoices, getPrompt) ===
// === SECTION 5: SOLO STUDYING (renderSolo, loopSolo, selectSolo, updateSoloVisuals) ===
// === SECTION 6: KNOWLEDGE EXPANSION (renderDomain, loopDomain, selectDomain, makeOrbs, positionOrbs) ===
// === SECTION 7: REVEAL + RATING (reveal, ratingsHTML, bindRatings, fullCard) ===
// === SECTION 8: PROGRESS (record, rate, updateKpis, showReview) ===
// === SECTION 9: IMPORT (importDeck, normalizeLimitlessCard) ===
// === SECTION 10: GAME FLOW (startSolo, startDomain, advance, pauseGame, resumeGame, endRun) ===
// === SECTION 11: FX (fireworks, runGateBanner) ===
// === SECTION 12: WIRING (wire, DOMContentLoaded) ===
```

**Remove:** `<script src="three.js">` — zero usage confirmed.

---

### Phase 2 — Fix Known Bugs + UX Gaps (1 session)
**Goal: Fix the issues identified in diagnosis without adding features.**

#### 2A. `one_thing` in Live Reveal (Priority: HIGH)

**Current behavior:** `one_thing` only appears in the `fullCard()` modal.

**Required fix:** The reveal flow should be:
```
1. Diagnosis title (large)         → diagnosis
2. ONE THING TAKEAWAY             → one_thing (primary, always visible)
3. [↓ Expand: Full Signal]        → toggle reveals educational_objective + board_trigger + explanation
```

**Implementation:** In `reveal(which, ok)`, inject `one_thing` between the diagnosis heading and the board trigger section. No content change — just display order.

```js
// In reveal():
const oneThing = clean(current.one_thing);
const boardTrigger = clean(current.board_trigger);
const eduObj = clean(current.educational_objective);
// Show: diagnosis title → one_thing → [expand toggle]
// Expand shows: board_trigger, edu_obj, explanation, why_not_others
```

#### 2B. `sys` Normalization

**Fix:** In `importDeck()`, after loading cards, run a single normalization pass:
```js
function normalizeSys(val) {
  // Uppercase, merge aliases
  const map = { 'Neuro':'NEURO','neuro':'NEURO','Rheum':'RHEUM','rheum':'RHEUM',
                'Psych':'PSYCH','psych':'PSYCH','Heme':'HEM/ONC','heme':'HEM/ONC',
                'GI':'GI','CV':'CV','ID':'ID','PULM':'PULM','RENAL':'RENAL',
                'OB/GYN':'OB/GYN','STATS':'STATS' };
  return map[val] || String(val||'').toUpperCase();
}
```
Store as `c.sys = normalizeSys(c.sys || c.system)`. The display badge truncates to fit — this is a display concern handled by CSS, not content.

#### 2C. `makeChoices()` Minimum Guard

**Fix:** Guard against < 4 available cards:
```js
function makeChoices() {
  const dx = clean(current.diagnosis);
  const pool = [...new Set(cards.map(c => clean(c.diagnosis)).filter(d => d && d !== dx))];
  const distractors = shuffle(pool).slice(0, 3);
  // Pad with placeholders if < 3 distractors available
  while (distractors.length < 3) distractors.push('—');
  choices = shuffle([dx, ...distractors]);
  selected = Math.max(0, choices.indexOf(dx));
}
```

#### 2D. LocalStorage Migration

**Fix:** On `loadState()`, read from all known legacy keys and merge:
```js
const LEGACY_STATE_KEYS = [
  'soloStudyingState_v1757',       // current primary — keep
  'soloStudying_spacedOn_v175153', // old
  'soloStudying_spacedOn_v175157', // old
  'soloStudying_spacedOn_v17.5.15.8', // old
];
const CURRENT_STATE_KEY = 'cozyArcade_progress_v1';

function loadState() {
  // Try current key first
  try {
    const v = localStorage.getItem(CURRENT_STATE_KEY);
    if (v) return JSON.parse(v);
  } catch(_) {}
  // Migrate from legacy keys
  const merged = {};
  LEGACY_STATE_KEYS.forEach(k => {
    try {
      const v = localStorage.getItem(k);
      if (v) Object.assign(merged, JSON.parse(v));
    } catch(_) {}
  });
  if (Object.keys(merged).length) {
    localStorage.setItem(CURRENT_STATE_KEY, JSON.stringify(merged));
    LEGACY_STATE_KEYS.forEach(k => localStorage.removeItem(k));
  }
  return merged;
}
```

#### 2E. Remove three.js

One line. Delete: `<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js"></script>`

---

### Phase 3 — Add Separated Progress Object (1 session)
**Goal: Decouple user progress from card data completely.**

See "Review/Spaced Repetition Data Model" section below for the full schema.

**Implementation:** `progress` is a separate object in localStorage, keyed by canonical card ID. The `cards` array and `DATA` object are never mutated with progress data. All progress reads/writes go through:

```js
function getProgress(cardId) {
  return state.progress?.[cardId] || defaultProgress(cardId);
}
function setProgress(cardId, patch) {
  state.progress = state.progress || {};
  state.progress[cardId] = { ...getProgress(cardId), ...patch, updated_at: new Date().toISOString() };
  saveState();
}
```

---

### Phase 4 — PWA / Offline (1 session)
**Goal: App works with zero network after first load.**

1. Add `<link rel="manifest" href="manifest.json">` — ship alongside the HTML.
2. Register a Service Worker that caches the HTML, Orbitron/DM Sans fonts (after first load), and the user's current deck.
3. Use a `Cache-First` strategy for fonts, `Network-First` with offline fallback for the HTML itself.

---

### Phase 5 — Supabase Sync (future)
**Goal: Progress syncs across devices for logged-in users.**

- Supabase `auth` for optional login.
- Single `user_progress` table: `(user_id, card_id, ...progress fields)`.
- Sync on session end, not on every answer.
- Offline-first: local state is authoritative; sync is additive merge.

---

### Phase 6 — Capacitor iOS / Android (future)
**Goal: Native app from the single HTML file.**

- Capacitor wraps the PWA shell.
- No code changes needed if PWA is clean.
- Haptic feedback on answer select via Capacitor Haptics plugin.
- Local filesystem storage for deck files via Capacitor Filesystem plugin.

---

## CANONICAL SCHEMA

### v1 Card Schema (source-of-truth, never mutated)

```json
{
  "id": "string | null",
  "qid": "string",
  "qid_unique": "string",
  "test": "string",
  "sys": "string (normalized uppercase, e.g. CV, GI, HEM/ONC)",
  "system": "string (alias for sys, populated from sys on import)",
  "tags": "string[] (empty array if not in source)",
  "presentation": "string (required — question stem / prompt)",
  "diagnosis": "string (required — answer / reveal title)",
  "educational_objective": "string (required if quick_recall absent)",
  "board_trigger": "string (IF → THINK → DO formatted text)",
  "one_thing": "string (primary back-of-card takeaway)",
  "quick_recall": "string (required if educational_objective absent)",
  "explanation": "string (longer distractor/rationale explanation)",
  "why_not_others": "string (distractor reasoning)",
  "cloze_source_text": "string | null",
  "cloze_enabled": "Y | N | null",
  "level_1_presentation": "string | null",
  "level_2_three_second_exposure": "string | null",
  "level_3_active_recall": "string | null",
  "treatment": "string | null",
  "next_step": "string | null",
  "source": "string | null",
  "created_at": "ISO string | null",
  "updated_at": "ISO string | null",
  "_imported_at": "ISO string (added on import, not from source)",
  "_deck_name": "string (from metadata.name, not from source)",
  "_incomplete": "boolean (true if required fields are missing/empty)"
}
```

**Required fields validation (flag as `_incomplete: true`, do not delete):**
- `presentation` must be non-empty after `clean()`
- `diagnosis` must be non-empty after `clean()`
- At least one of `educational_objective` or `quick_recall` must be non-empty

**Field aliases accepted on import (normalized to canonical name):**

| Import alias | Canonical field |
|---|---|
| `clinical_vignette_summary`, `clinical_vignette`, `prompt`, `front`, `question`, `vignette` | `presentation` |
| `answer`, `title`, `topic` | `diagnosis` |
| `educational_obj`, `reveal`, `back`, `output` | `educational_objective` |
| `takeaway`, `userOneThing` | `one_thing` |
| `level_2_three_second`, `level_2` | `level_2_three_second_exposure` |
| `system`, `subject` | `sys` |

---

### v1 User Progress Schema (separate object, never in card data)

```json
{
  "card_id": "string (canonical: qid_unique > qid > hash(presentation+diagnosis))",
  "seen_count": "integer",
  "correct_count": "integer",
  "wrong_count": "integer",
  "last_seen_at": "ISO string | null",
  "next_due_at": "ISO string | null",
  "interval_days": "float (SM-2 interval)",
  "ease_factor": "float (SM-2 EF, default 2.5)",
  "lapses": "integer",
  "stability": "float | null (FSRS stability)",
  "difficulty": "float | null (FSRS difficulty)",
  "last_rating": "again | hard | good | easy | null",
  "pinned": "boolean",
  "needs_repair": "boolean (true when last_rating === 'again')",
  "signal_strength": "0–100 (composite: correct_count / seen_count * ease_factor * interval_bonus)"
}
```

**`signal_strength` formula (Phase 3):**
```js
function signalStrength(p) {
  if (!p.seen_count) return 0;
  const accuracy = p.correct_count / p.seen_count;
  const intervalBonus = Math.min(1, p.interval_days / 30);
  const lapsesPenalty = Math.max(0, 1 - p.lapses * 0.15);
  return Math.round(accuracy * intervalBonus * lapsesPenalty * 100);
}
```

---

## IMPLEMENTATION ROADMAP

### Phase 1: Stabilize Import + Schema
**Target: 1–2 focused sessions**

- [ ] Extract all CSS into one consolidated block (~400 lines)
- [ ] Extract all JS into one consolidated script block (~2,500 lines)
- [ ] Remove 44 of 46 script tags, 39 of 40 style tags
- [ ] Remove three.js CDN dependency
- [ ] Implement canonical `normalizeLimitlessCard()` with all field aliases
- [ ] Add `_incomplete` flag for cards missing required fields
- [ ] Add `sys` normalization (case normalization + alias merge)
- [ ] Add minimum-4-choices guard in `makeChoices()`
- [ ] Implement `loadState()` with legacy key migration
- [ ] Single localStorage key: `cozyArcade_progress_v1`
- [ ] All code is readable without patch archaeology

**Test after Phase 1:**
- Import `first_10_cards_in_order.json` → 10 cards loaded
- Import `random_20_cards_seed_20260521_PRETTY.json` → 20 cards loaded
- Both imports show correct system badges (CV, GI, etc.)
- Both games start and present cards
- Progress saves and loads on refresh

---

### Phase 2: Stabilize Gameplay
**Target: 1 session**

- [ ] Fix `one_thing` as primary reveal content (not buried in modal)
- [ ] Add `board_trigger` as expandable section (IF → THINK → DO label)
- [ ] Ensure reveal flow: `presentation → diagnosis → one_thing → [↓ expand]`
- [ ] Fix `fullCard()` to read `sys` for system display
- [ ] End screen shows: Score, Repair Points, Systems reviewed, ONE THING retained
- [ ] Import status shows deck name from `metadata.name`
- [ ] Home page KPI: Cards / Reviewed / Repair Points / Pinned
- [ ] "No Idea" button creates `needs_repair: true` in progress
- [ ] Empty deck state: clear prompt to upload deck (not broken empty screen)

**Test after Phase 2:**
- Solo Studying: answer correctly → see `one_thing` in reveal → Next card
- Solo Studying: miss → "Repair Point" created → visible in Review
- Knowledge Expansion: slash orb → correct → see `one_thing` in reveal
- `board_trigger` appears as expandable section with IF→THINK→DO formatting
- End screen shows correct system breakdown

---

### Phase 3: Progress / Review Object
**Target: 1 session**

- [ ] Implement separated `progress` object (see schema above)
- [ ] SM-2 interval scheduling (basic: again=1d, hard=3d, good=7d, easy=21d)
- [ ] `signal_strength` computed value per card
- [ ] Review screen: sortable by signal_strength, due date, system
- [ ] Review screen: filter by system (uses normalized `sys` values)
- [ ] Energy Level display on home (aggregate signal_strength across reviewed cards)
- [ ] Export includes both cards loaded + full progress object
- [ ] Import state: accepts exported progress JSON and merges

---

### Phase 4: PWA / Offline
**Target: 1 session**

- [ ] `manifest.json` with name, icons, theme_color `#030713`, display `standalone`
- [ ] Service Worker: cache-first for fonts, network-first for HTML
- [ ] Deck stored in `localStorage` as stringified JSON (already done via `DATA.cards`)
- [ ] Offline indicator in HUD (small dot, green = online, gray = cached)
- [ ] "Install App" prompt surfaced in Settings

---

### Phase 5: Supabase Sync
**Target: future sprint**

- [ ] Supabase project setup
- [ ] Optional login (email magic link only, no password)
- [ ] `user_progress` table mirrors local progress schema
- [ ] Sync on game end, not on every card
- [ ] Conflict resolution: last_seen_at wins

---

### Phase 6: Capacitor iOS / Android
**Target: future sprint**

- [ ] Capacitor init on the cleaned PWA
- [ ] Haptics on answer select
- [ ] Filesystem plugin for larger decks (> localStorage quota)
- [ ] App store submission

---

## CODEX HANDOFF PROMPT

Use this prompt verbatim when handing off to a coding agent for Phase 1:

---

```
You are implementing Phase 1 of a refactor of a single-file HTML app called "Cozy Arcade Board Prep Medicine."

CRITICAL CONSTRAINTS:
1. DO NOT change any medical content (presentation, diagnosis, educational_objective, board_trigger, one_thing, quick_recall, explanation, why_not_others).
2. DO NOT change gameplay behavior. Both game modes (Solo Studying, Knowledge Expansion) must work identically before and after.
3. DO NOT add any frameworks, build tools, or npm packages.
4. Output must be a single .html file.
5. The visual aesthetic (dark neon, blue/cyan/purple, Orbitron + DM Sans) must be pixel-identical.

YOUR TASK: CSS and JS consolidation only.

INPUT FILE: index.html (provided)

STEP 1 — CSS:
- Extract all 40 <style> blocks
- Consolidate into ONE <style> block
- Remove !important overrides where the same property is set in a later rule without !important
- Remove duplicate selectors
- Preserve all unique values and all breakpoints
- Organize into 14 labeled sections (see refactor plan for section names)

STEP 2 — JS:
- Extract all 46 <script> blocks
- For each of the 101 duplicate function names, keep ONLY the last definition in document order (this is the active one)
- Merge into ONE <script> block organized into 12 labeled sections
- Remove <script src="three.js"> — it is confirmed unused
- Keep DATA object (with empty cards array) at the very top of the script
- Keep all IIFE guard patterns that check window.__cozyFlag before running (these prevent double-execution)

STEP 3 — Bug fixes (implement these exactly as specified):
- makeChoices(): add minimum-4-choices guard (pad with '—' if fewer than 3 distractors available)
- loadState(): add legacy key migration (read from 'soloStudyingState_v1757' and other old keys, write to 'cozyArcade_progress_v1')
- normalizeSys(): normalize sys field to uppercase, merge case aliases (Rheum→RHEUM, Psych→PSYCH, Heme→HEM/ONC, Neuro→NEURO)
- importDeck(): after loading, run normalizeSys on each card's sys field

STEP 4 — Verify:
- File loads in a browser with no console errors
- Home screen shows COZY ARCADE BOARD PREP-MEDICINE title
- Upload JSON deck button works
- Solo Studying starts after deck import
- Knowledge Expansion starts after deck import
- Answers reveal correctly
- board_trigger text appears in reveal
- Export session downloads a JSON file

DO NOT add any new features. DO NOT fix anything not listed above. DO NOT rewrite medical content.
```

---

## TESTING PLAN

### Smoke Tests (run after every phase)

```
TEST 1: Import first_10_cards_in_order.json
  Expected: "Deck loaded: 10" toast
  Expected: cardCount KPI shows 10
  Expected: No console errors

TEST 2: Import random_20_cards_seed_20260521_PRETTY.json
  Expected: "Deck loaded: 20" toast
  Expected: cardCount KPI shows 20

TEST 3: No cards embedded by default
  Expected: DATA.cards.length === 0 before any import
  Expected: Home screen shows "0" for card count

TEST 4: LocalStorage save/load
  Expected: Answer one card, refresh page, reviewedCount > 0

TEST 5: Solo Studying starts
  Expected: Prompt box visible, 4 choices visible, runner visible, timer running

TEST 6: Knowledge Expansion starts
  Expected: Prompt box visible, 4 orbs visible, orbs animate outward, cursor glow follows mouse

TEST 7: Answer reveal
  Expected: After selecting answer, diagnosis text appears in reveal
  Expected: one_thing text appears in reveal (primary position)
  Expected: board_trigger text appears in reveal (expandable)

TEST 8: Export progress
  Expected: JSON file downloads on button click
  Expected: File contains { exportedAt, state } keys

TEST 9: Bad JSON fails gracefully
  Expected: Import non-JSON file → toast "Import failed" (not crash)
  Expected: Import JSON without cards array → toast "Import failed"

TEST 10: Spaced Repetition / Review screen
  Expected: After marking a card "No Idea", it appears in Review list
  Expected: Pinned card appears in Review list

TEST 11: System badge
  Expected: System badge shows sys value (e.g. "CV", "GI", "HEM/ONC") during gameplay
  Expected: Not empty string

TEST 12: Minimum cards guard
  Expected: Import 3 cards, start Solo Studying → 4 choices appear (1 correct + 3 padded with "—")
  Expected: No crash
```

---

*Plan generated by direct analysis of index.html (654KB, 10,604 lines, 40 style blocks, 46 script blocks, 101 duplicate functions), ABIM_DATABASE_first_10_cards_in_order.json (10 cards), and ABIM_DATABASE_random_20_cards_seed_20260521_PRETTY.json (20 cards). Medical content not read or analyzed beyond field structure. Version: 2026-05-21.*
