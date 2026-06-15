# Cozy Arcade Board Prep — Ultimate Goals
*Updated 2026-05-27 — reflects both session compactions + current session.*

---

## What Must Never Break (Invariants)

- **localStorage keys**: `soloStudyingState_v1757`, `cozy_arcade_progress_v1`, `cozy_arcade_persona_v1`, `cozyQuestionSeconds351`, `cozy_arcade_limitless_cards_v1`, `bionicOn_v1751523`
- **Protected functions**: `rate()`, `rateCard()`, `advance()`, `fullCard()`, `saveState()`, `updateKpis()`, `canonicalCardId()`, `importDeck()`
- **Working features — do not regress**: Top HUD bar · Prompt AI · Import/Export (JSON + CSV) · FSRS v5 scoring · Undo (Cmd+Z / shake) · Drop mechanic (v175151) · Neural Atlas inline
- **Never add `<script>` outside existing patch pattern — edit in-place only**
- **Always push to BOTH `origin main` AND `phase2 main`**

---

## Priority 1 — Active Rectifier (Complete)

| # | Goal | Status |
|---|------|--------|
| R1 | Bionic toggle persists (localStorage round-trip) | ✅ DONE |
| R2 | Settings Apply does not auto-close | ✅ DONE |
| R3 | Bionic contrast visible in gameplay | ✅ DONE |
| R4 | Timer bar does not overlap question text | ✅ DONE |
| R5 | Settings shows keyboard controls, not Advanced Merge | ✅ DONE |
| R6 | Apply writes `cozyQuestionSeconds351` | ✅ DONE |
| R7 | `timerMax` reads from localStorage everywhere | ✅ DONE |

---

## Priority 2 — Display & Layout (Complete)

| # | Goal | Status |
|---|------|--------|
| D1 | Card/prompt box proportional to screen | ✅ DONE |
| D2 | Bionic re-renders on new card load | ✅ DONE |
| D3 | Home screen controls visible | ✅ DONE |
| D4 | Settings bar clean layout | ✅ DONE |

---

## Priority 2b — Schema / Export / Undo (Complete)

| # | Goal | Status | Commit |
|---|------|--------|--------|
| E1 | Undo review (Cmd/Ctrl+Z + shake) — 5-deep stack, "Undone (N more)" toast | ✅ DONE | `92b9be8` |
| E2 | Export strips ALL legacy alias fields from deck exports | ✅ DONE | `698ebe9` |
| E3 | Settings Export → Deck Only — canonical fields only | ✅ CODE | browser verify |
| E4 | Settings Export → Progress Only — FSRS fields only, no aliases | ✅ DONE | `35cd2b4` |
| E5 | Settings Export → Deck + Progress — clean cards + clean progress | ✅ DONE | `35cd2b4` |
| E6 | `canonicalizeCard(raw, opts)` — single source of truth for all field normalization | ✅ DONE | `698ebe9` |
| E7 | `one_thing` persists in progress export through save/reload | ✅ DONE | `92b9be8` |
| E8 | Home "Download" → `exportDeckWithProgress` (deck+progress combined) | ✅ DONE | `2dd12a1` |
| E9 | Home labels: "Upload" / "Download" (clean) | ✅ DONE | `2dd12a1` |

**`canonicalizeCard` export allowlist (14 canonical fields):**
`card_id · qid · sys · diagnosis · presentation · one_thing · educational_objective · board_trigger · explanation · why_not_others · test · quick_recall · cloze_source_text · cloze_enabled · tags`

**Fields stripped from all exports (derived aliases — must NOT appear):**
`level_1_presentation · level_2_three_second_exposure · prompt · clinical_vignette_summary · answer · subject · qid_unique · treatment · next_step · seen · reviewed · correct · rating · last`

---

## Priority 3 — Neural Atlas Inline (Complete)

| # | Goal | Status | Commit |
|---|------|--------|--------|
| A1 | Embed Neural Atlas as `#atlas` screen inside index.html | ✅ DONE | `74ce963` |
| A2 | Progress button opens Atlas inline (no new tab) | ✅ DONE | `74ce963` |
| A3 | ← Home button returns to home screen; RAF halts | ✅ DONE | `c7e5c01` |
| A4 | Atlas reads live deck from `window.appCards()` | ✅ DONE | `c7e5c01` |
| A5 | Atlas reads live progress from `window.phase3State.progress` | ✅ DONE | `c7e5c01` |
| A6 | Orphan progress pruning — no `'—'` node when deck loaded | ✅ DONE | `20df845` |
| A7 | All IDs `na-` prefixed; CSS scoped to `#atlas` | ✅ DONE | `74ce963` |
| A8 | Prompt AI — all 3 locations updated to v3 full schema | ✅ DONE | `65f1074` |

**Atlas architecture (embedded):**
- Screen div: `id="atlas" class="screen hidden"` — participates in existing `show()` system
- Canvas: `id="na-canvas"` inside `id="na-canvas-wrap"`
- Public API: `window.showAtlasScreen()` / `window.hideAtlasScreen()`
- Data: reads live from `window.appCards()` + `window.phase3State.progress` — no localStorage round-trip needed
- RAF loop: auto-stops when `#atlas.hidden`; `naInit()` resets state on each open

---

## Priority 4 — Feature Goals

| # | Goal | Status | Gate |
|---|------|--------|------|
| F1 | Due-count widget on home ("X due · Y new") | ✅ CODE (`d830094`) | browser verify KPI row |
| F2 | PWA service worker + self-host fonts | ⏳ P7 | Chrome DevTools → Application → SW registered |
| F3 | XSS audit + CSP headers (`vercel.json`) | ⏳ P8 | `curl -I` shows `Content-Security-Policy` |
| F4 | Stripe Payment Link | ⏳ M2 | Test purchase + `localStorage.getItem('cozy_paid_v1') === '1'` |
| F5 | Capacitor iOS scaffold | ⏳ iOS1 | `npx cap sync` exits 0 |

---

## What Broke and Why (Root Cause Log)

| Date | What | Why | Fix |
|------|------|-----|-----|
| 2026-05-26 | Bionic toggle always checked | `window.enhanceSettings` undefined | Export from IIFE-A |
| 2026-05-26 | Settings auto-closed on Apply | `setTimeout(returnFromSettings352,0)` | Removed |
| 2026-05-26 | Font increase caused overlap | `clamp(22px,2.6vw,36px)` exceeded soloTrack inset | Reverted font; soloTrack→240px |
| 2026-05-26 | Bionic visually invisible | `.promptText{font-weight:950}` + `<b>` = zero contrast | CSS: base 500/dim, `b` 950/white |
| 2026-05-27 | Export had alias fields | `cleanDeckCard` used blacklist; `deduplicateProgress` re-added aliases | `canonicalizeCard` allowlist; removed double-dedup |
| 2026-05-27 | `one_thing` missing from progress export | `phase3State.progress[cardId] = p` before `p.one_thing` was set | Moved assignment before write |
| 2026-05-27 | Atlas `'—'` system node | Orphan progress entries (old card IDs) have no deckMap match → no sys | Prune before buildSysMap |
| 2026-05-27 | Atlas home button did nothing | `#atlas` not in `screens[]` so `show('home')` didn't hide it | Explicit `classList.add('hidden')` before `window.home()` |
| 2026-05-27 | Atlas showed blank constellation | `atlasLoadDeck()` read sys-map stub from localStorage (no sys on cards) | Read `window.appCards()` live instead |

---

## Guiding Principles (User-Stated)

- **Derive fixes from prior functioning state** — when something breaks, check reference before patching forward
- **Preserve working features above all** — top bar, Prompt AI, Import/Export, FSRS scoring, Atlas
- **Fit-to-screen > larger text** — card proportions matter more than font size
- **Caution on quick fixes** — one culprit at a time, validate after each
- **Goals are directional** — "fix the settings" means "make settings work like before the drawer patch broke it"
- **Single-file constraint** — all code in index.html; no separate JS files; patch IIFEs appended sequentially

---

## Quick Validation Suite

```javascript
window.runFSRSValidation()   // 17/17
window.runCozySmokeTests()   // 6/6
localStorage.getItem('bionicOn_v1751523')       // '0' or '1'
localStorage.getItem('cozyQuestionSeconds351')  // matches timer
document.documentElement.dataset.cozyBionic     // '1' or '0'
// Atlas:
window.showAtlasScreen()   // opens inline, constellation visible with sys nodes
window.hideAtlasScreen()   // returns to home
```

---

*Full step-by-step history: `RECTIFIER_PLAN_2026_05_26.md`*
*Active gate tracking: `GOAL.md`*

---

## Root Cause Log — 2026-06-15 (Codex Browser Audit)

**Method:** Headless Chrome/CDP against PHASE2 local HTTP server. Instrumented `selectSolo` call count, CSS variable mutations, `document.body.className`, and `soloQuestion.innerHTML` write events.

### New Root Causes Confirmed

**RC-6 — Dual drop engines running concurrently**
System 2 (`raf175164`, `--soloDropY`) and System 3 (`soloStableRaf351`, `--soloDropY351`) both animate simultaneously. Both `--soloDropY` and `--soloDropY351` CSS variables moved during a single card drop. `selectSolo` fired **twice within 42ms** at timer expiry. The 700ms debounce (layer 11) suppresses the inner re-select but ALL outer wrappers fire twice: undo snapshot, rating rectifier, energy tracker. Root effect: potential double FSRS write, double undo snapshots, double energy charge per card answer.

**RC-7 — `installBionicQuestionPatch352` is a third prompt writer**
Sequence on each card: (1) plain write via renderSolo/applyPromptText, (2) bionic write via `rerenderVisibleBionic351()` at setTimeout(0), (3) repeated plain rewrites via `installBionicQuestionPatch352` at ~line 7438. Step (3) runs after step (2) and strips `<b>` markup back to plain text. This is the cause of the persistent "font flickers back and forth" glitch that a hard reset does not fix, because the writer is installed permanently at page load.

**RC-8 — `document.body.className=''` in the live render path is ~line 3939 (System 2), not only ~line 832 (System 1)**
Claude's static analysis targeted line ~832. Codex browser trace showed the active clear is in System 2's render path. Both paths exist and must be fixed, but the live symptom originates from ~3939.

### Diagnosis Correction (Claude Static Analysis Was Wrong On)

| Claim | Correction |
|---|---|
| System 1 RAF fires `selectSolo(0)` at 7s hardcoded | System 1's RAF is not the live timer path. With 13s setting, selectSolo fired at ~13.0s — System 3 is active. |
| Font flicker = two writers (bionic vs plain) | Three writers. `installBionicQuestionPatch352` is the third and the primary cause. A guard in `rerenderVisibleBionic351` alone would not fix it. |
| Body class clear at line ~832 | Active clear is at ~3939 (System 2 path). Line ~832 also clears but is not the primary symptom source. |

### Protected Invariants — Still In Force

All prior invariants remain unchanged. Specifically:
- Do NOT add new `cardPool` or `nextCard` wrappers
- Do NOT add new `<script>` blocks — all fixes are inline edits to existing source
- `runFSRSValidation()` 17/17 + `runCozySmokeTests()` 6/6 required after every change
- Bump SW CACHE version after every code change
- NEVER cross-push between PHASE1 and PHASE2 repos

---

## Root Cause Log — 2026-06-15 (Session 2) — FSRS Algorithm Bug

**Symptom:** Cards scheduled as Good/Easy too soon. Explicit "Again" button had no effect on interval.

**RC-9 — Anonymous deferred `rateCard(good)` timer overwrote explicit "Again" (FQ-ALGO-1)**
Base `selectSolo` (line ~408) fired `setTimeout(rateCard(id,'good'), 8000)` as an anonymous timer with no stored handle. When user clicked "Again" explicitly, the explicit `rateCard('again')` ran first (correct), but 8.2 seconds later the anonymous timer fired `rateCard('good')`, overwriting the FSRS schedule to 3 days. The prior rating-path-rectifier could not cancel it because it stored its OWN handle separately; the base selectSolo timer was a different object.

**Fix:** Changed anonymous setTimeout to `window.__cozyAutoRateHandle20260603=setTimeout(...)` in base selectSolo. New `cozy-explicit-rating-stabilizer-2026-06-11` wraps `rate()` and `rateCard()` to call `clearDeferredAutoRate()` before any explicit rating commits. Commit 048d073. Probe: Again→10m ✅, Hard→1d ✅, Good→3d ✅, Easy→15d ✅.

**RC-10 — repair_point + E7G causes again-rated cards to appear immediately (FQ-ALGO-2)**
`record()` sets `repair_point=true` when answer is wrong. E7G design: Review Deck always shows repair_point cards as immediately due, bypassing `next_due_at`. So a card rated "Again" (next_due_at=10min) reappears in the very next Review Deck session, which feels like it came back too fast. This is by design (repair workflow) but conflicts with Anki 10-minute step behavior. Status: open design decision.

**RC-11 — 18 review-stage rows with null next_due_at in progress data (FQ-ALGO-3)**
`isDue(p)` returns `(seen_count||reviewed_count)>0` when `next_due_at=null`. Cards in this state are always considered due. With 18 such rows in the current export, these cards surface at the top of every session, creating the illusion of no spacing. Status: requires data repair (replay through rateCard or assign valid next_due_at).

**RC-12 — "Again" not requeued in current session (FQ-ALGO-4 — Anki gap)**
`requeueAgainCard` removes cards from seenThisSession but does NOT splice into the live session pool. Failed cards only return in the NEXT session, not within 10 minutes in the current session. Anki brings failed learning-step cards back within the same review session. Fix: add `sess.pool.splice(at, 0, ...)` in the due/null path of `requeueAgainCard`. Status: open architectural gap.

**GOAL: Function like Anki FSRS** — Full Anki parity requires all four: correct intervals ✅ (RC-9 fixed), same-session requeue ❌ (RC-12 open), no immediate repair bypass ❌ (RC-10 open by design), clean data ❌ (RC-11 open).
