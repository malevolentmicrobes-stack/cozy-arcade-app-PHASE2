# Cozy Arcade Board Prep — Ultimate Goals
*Single source of truth. Updated 2026-05-26.*

---

## What Must Never Break (Invariants)

- **localStorage keys**: `soloStudyingState_v1757`, `cozy_arcade_progress_v1`, `cozy_arcade_persona_v1`, `cozyQuestionSeconds351`, `cozy_arcade_limitless_cards_v1`, `bionicOn_v1751523`
- **Protected functions**: `rate()`, `rateCard()`, `advance()`, `fullCard()`, `saveState()`, `updateKpis()`, `canonicalCardId()`, `importDeck()`
- **Working features — do not regress**: Top HUD bar · Prompt AI · Import/Export (JSON + CSV) · FSRS v5 scoring · Undo (Cmd+Z / shake) · Drop mechanic (v175151)
- **Never add `<script>` outside existing patch pattern — edit in-place only**

---

## Priority 1 — Active Rectifier (Must Complete)

| # | Goal | Status | Validation |
|---|------|--------|------------|
| R1 | Bionic toggle persists correctly (localStorage round-trip) | ✅ DONE | `localStorage.getItem('bionicOn_v1751523')` matches checkbox after Apply |
| R2 | Settings Apply does not auto-close | ✅ DONE | Click Apply → panel stays open |
| R3 | Bionic contrast visible in gameplay | ✅ DONE (CSS) | Bold first-letters white, rest dim blue — needs re-render on new card |
| R4 | Timer bar does not overlap question text | ✅ DONE | soloTrack inset:240px clears promptBox |
| R5 | Settings shows keyboard controls, not "Advanced Merge" panel | ✅ DONE | Controls hint visible in settings |
| R6 | Apply writes `cozyQuestionSeconds351` | ⚡ VERIFY | `localStorage.getItem('cozyQuestionSeconds351')` after changing timer + Apply |
| R7 | `timerMax` reads from localStorage everywhere | ⏳ TODO | Set 5s → start game → timer drains in 5s not 7s |

---

## Priority 2 — Display & Layout

| # | Goal | Status | Notes |
|---|------|--------|-------|
| D1 | Card/prompt box proportional to screen (fit-to-screen, not overflow) | ✅ DONE | soloTrack nudge; font stays at accumulated patch values |
| D2 | Bionic re-renders on new card load (not just on Apply) | ⏳ TODO | `renderSolo()` calls `bionic()` which checks `bionicOn` — verify dataset.cozyBionic is set at load |
| D3 | Home screen controls visible (not hidden by `display:none!important`) | ⏳ TODO | `cozy_v350_rescue_css` line 5685 hides `.homeWrap>.controls` |
| D4 | Settings bar shows prior clean layout (no side-drawer overrides) | ✅ PARTIAL | Advanced panel hidden; controls hint added |

---

## Priority 2b — Export / Undo (Active)

| # | Goal | Status | Validation |
|---|------|--------|------------|
| E1 | Undo review (Cmd/Ctrl+Z + iOS shake) returns prior card as if not answered | ✅ CODE (v175372) — browser verify | Play card → answer → Cmd+Z → prior card reappears, FSRS state reverted |
| E2 | "Download Deck" (home) no longer includes legacy alias fields (`level_1_presentation`, `level_2_three_second_exposure`, `prompt`, `clinical_vignette_summary`, `answer`, `subject`, `qid_unique`, `treatment`, `next_step`) | ✅ FIXED `cleanDeckCard()` | Export clean deck → JSON contains only canonical source fields |
| E3 | Settings Export → Deck Only clean | ⚡ VERIFY | `cozy_arcade_clean_deck.json` fields match source schema |
| E4 | Settings Export → Progress Only | ⚡ VERIFY | `cozy_arcade_progress_*.json` contains only FSRS state, no card data |
| E5 | Settings Export → Deck + Progress | ⚡ VERIFY | `cozy_arcade_deck_with_progress_backup.json` cards clean + progress accurate |

**Export field schema (canonical — what should appear in any card export):**
`qid · sys · diagnosis · presentation · one_thing · educational_objective · board_trigger · explanation · why_not_others · test · quick_recall · cloze_source_text · cloze_enabled · tags · card_id`

**Fields stripped by `cleanDeckCard()` (derived aliases — must NOT appear in export):**
`level_1_presentation · level_2_three_second_exposure · prompt · clinical_vignette_summary · answer · subject · qid_unique · treatment · next_step`

---

## Priority 3 — Feature Goals

| # | Goal | Status | Gate |
|---|------|--------|------|
| F1 | Due-count widget on home ("5 due · 12 new") | ⏳ P3.5 | Visual confirm in browser |
| F2 | PWA service worker + self-host fonts | ⏳ P7 | Chrome DevTools → Application → Service Workers registered |
| F3 | XSS audit + CSP headers (vercel.json) | ⏳ P8 | `curl -I` shows `Content-Security-Policy` header |
| F4 | Stripe Payment Link | ⏳ M2 | Test purchase + `localStorage.getItem('cozy_paid_v1') === '1'` |
| F5 | Capacitor iOS scaffold | ⏳ iOS1 | `npx cap sync` exits 0, Xcode opens |

---

## What Broke and Why (Root Cause Log)

| Date | What | Why | Fix |
|------|------|-----|-----|
| 2026-05-26 | Bionic toggle always showed checked | `window.enhanceSettings` was undefined — gear called IIFE-B's openSettings which resolved to stale global fn that returns early | Export IIFE-A's `enhanceSettings` to `window` |
| 2026-05-26 | Settings auto-closed on Apply | `setTimeout(returnFromSettings352,0)` in `applyReturn352` listener | Removed the setTimeout |
| 2026-05-26 | "Advanced Merge" panel cluttered settings | `enhanceSettings()` at line 943 creates v175152 panels at boot; newly visible after bionic fix | Hide via CSS query in enhanceSettings on every open |
| 2026-05-26 | Font increase caused promptBox/timer overlap | My `clamp(22px,2.6vw,36px)` grew promptBox past soloTrack inset:230px | Reverted font, soloTrack → 240px |
| 2026-05-26 | Bionic visually invisible | `.promptText{font-weight:950}` + `<b>` = zero contrast | CSS: `[data-cozyBionic="1"]` base 500/dim, `b` 950/white |

---

## Guiding Principles (User-Stated)

- **Derive fixes from prior functioning state** — when something breaks, check reference (`2026-05-16/index.html`) before patching forward
- **Preserve working features above all** — top bar, Prompt AI, Import/Export, FSRS scoring are non-negotiable
- **Fit-to-screen > larger text** — card proportions matter more than font size
- **Caution on quick fixes** — one culprit at a time, validate with `runFSRSValidation()` after each
- **Goals are directional**, not always literal — "fix the settings" means "make settings work like before the drawer patch broke it"

---

## Quick Validation Suite (run after any change)

```javascript
window.runFSRSValidation()   // must return 17/17
window.runCozySmokeTests()   // must return 6/6
localStorage.getItem('bionicOn_v1751523')       // '0' or '1', matches checkbox
localStorage.getItem('cozyQuestionSeconds351')  // matches timer input value after Apply
document.documentElement.dataset.cozyBionic     // '1' when bionic ON, '0' when OFF
```

---

*Full step-by-step history: `Chronological_Patch_Hx_RECTIFIER_PLAN_2026_05_26.md`*  
*Detailed root causes + 10-step plan: `RECTIFIER_PLAN_2026_05_26.md`*  
*Active gate tracking: `GOAL.md`*
