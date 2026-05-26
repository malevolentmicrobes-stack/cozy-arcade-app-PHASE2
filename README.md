# COZY ARCADE BOARD PREP — MEDICINE

> A gamified ABIM board-prep app that runs entirely in one HTML file. Drag in your JSON deck, choose a game mode, and let spaced repetition do the rest. No accounts, no servers, no install — just open and study.

![Single File](https://img.shields.io/badge/single--file-HTML-67e8f9?style=flat-square)
![No Build Step](https://img.shields.io/badge/no%20build%20step-vanilla%20JS-c084fc?style=flat-square)
![SM-2 SRS](https://img.shields.io/badge/spaced%20repetition-SM--2%20→%20FSRS%20v5-4ade80?style=flat-square)
![ABIM](https://img.shields.io/badge/board%20prep-ABIM%20·%20Internal%20Medicine-fbbf24?style=flat-square)

---

## Quick Start

```bash
# No install required
1. Download index.html
2. Open in Chrome or Firefox
3. Drag in a .json deck file
4. Pick a game mode and start studying

# Debug mode
localStorage.setItem("cozy_debug", "1")
location.reload()

# Run smoke tests (browser console — upload a deck first)
window.runCozySmokeTests()
```

---

## Game Modes

### Solo Studying
Falling MCQ lane mechanic. A runner sprite navigates toward your answer orb as choices drop from the top of the screen. Timer auto-selects when it expires. Keyboard arrows + Enter or click to answer.

### Knowledge Expansion
Answer orbs orbit outward from the center of the screen. Cursor proximity auto-selects as the timer counts down. Tests pattern recognition under pressure — the closest analog to clinical recall speed.

Both modes share: SM-2 spaced repetition, repair point tracking, Energy bar, pinned cards, per-system filtering, and full progress export.

---

## Reveal Order

After answering, content surfaces in this fixed sequence — built to match how the board-trained brain consolidates:

```
diagnosis → educational_objective → board_trigger → one_thing → why_not_others (collapsible) → ratings
```

`one_thing` is your single anchor takeaway, shown prominently before the full explanation every time.

---

## Spaced Repetition

### Current: SM-2

| Button | Rating | Interval | Ease Δ | Returns |
|--------|--------|----------|--------|---------|
| 🔴 Again | `again` | reset → relearn | −0.20 | 10 minutes |
| 🟠 Hard | `hard` | × 1.2 | −0.15 | days |
| 🟢 Good | `good` | × ease | none | days |
| 🔵 Easy | `easy` | × ease × 1.3 | +0.15 | days |

- `ease_factor` default: **2.5** · floor: **1.3** (never drops lower)
- New card + `good` → graduates immediately to `review` at 1 day
- `again` → enters `relearning`, returns in ~10 minutes
- Progress stored in `localStorage` key: `cozy_arcade_progress_v1`

### Phase 3: FSRS v5 (replacing SM-2)

FSRS v5 delivers significantly more accurate recall scheduling than SM-2, especially for medical knowledge with irregular study patterns. Implementation is ~50 lines of inline JS — no external library.

New fields added to the progress record:

| Field | Description |
|-------|-------------|
| `stability` | Estimated memory stability in days |
| `difficulty` | Per-card difficulty estimate (0–1) |
| `retrievability` | Probability of recall at review time |

The FSRS transition is backward-compatible: existing SM-2 progress records are migrated on first load. No data loss.

**Interval preview on rating buttons** (also Phase 3) — each button will display its projected next-due date at time of answer, exactly as Anki does:

```
🔴 Again · 10 min    🟠 Hard · 3d    🟢 Good · 8d    🔵 Easy · 21d
```

Implementation in `previewInterval(cardId, rating)` — called from `bindRatings()` in the reveal builder.

---

## Card Schema

Cards are supplied as JSON. The app never embeds cards in the HTML — you always upload your own deck.

### Required Fields

| Field | Description |
|-------|-------------|
| `qid` | Unique question ID — any string, no spaces |
| `sys` | Organ system — see list below, auto-normalized |
| `presentation` | Clinical vignette shown during gameplay |
| `diagnosis` | Correct answer choice |
| `one_thing` | Single most important takeaway — shown first on reveal |

### Strongly Recommended

| Field | Description |
|-------|-------------|
| `qid_unique` | Stable unique ID used as the progress key (falls back to `qid`) |
| `educational_objective` | Full teaching point |
| `board_trigger` | `IF [finding] → [diagnosis] → [action]` |
| `test` | Group label for filtering (e.g. `"TEST 1"`, `"MY CARDIOLOGY"`) |

### Full Card Fields

| Field | Description |
|-------|-------------|
| `why_not_others` | Why the distractor choices are wrong (collapsible on reveal) |
| `explanation` | Verbose full explanation |
| `quick_recall` | One-sentence fallback if `one_thing` is blank |
| `cloze_source_text` | Source text for future cloze mode |
| `cloze_enabled` | `Y` or `N` |

### Accepted Field Aliases

```
presentation  ←  prompt, front, question, clinical_vignette_summary
diagnosis     ←  answer, back
one_thing     ←  takeaway, quick_recall, level_2_three_second
sys           ←  system, subject
```

---

## Supported Systems

Case variants are normalized automatically — `Rheum`, `rheum`, `RHEUM` all resolve to `RHEUM`.

```
CV          Cardiology
ID          Infectious Disease
GI          Gastroenterology
ENDO        Endocrinology
NEURO       Neurology
RHEUM       Rheumatology
RENAL       Nephrology
PSYCH       Psychiatry
DERM        Dermatology
PULM        Pulmonology / Critical Care
HEM/ONC     Hematology / Oncology
OB/GYN      Obstetrics / Gynecology
ENT         Ear, Nose, Throat
ETHICS      Ethics / Professionalism
STATS       Biostatistics / Epidemiology
OPHTHO      Ophthalmology
ALLERGY     Allergy / Immunology
EMERGENCY   Emergency Medicine
TOX         Toxicology
UROLOGY     Urology
```

---

## Minimum Viable Card

```json
{
  "cards": [
    {
      "qid": "MY-001",
      "sys": "CV",
      "diagnosis": "STEMI",
      "presentation": "Crushing chest pain, diaphoresis, ST elevation in II/III/aVF.",
      "one_thing": "Inferior STEMI → right coronary artery → PCI within 90 minutes."
    }
  ]
}
```

Save as `.json`, drag into the app. Done.

---

## Full Card Example

```json
{
  "meta": {
    "schema": "cozy-arcade-v3",
    "total": 1
  },
  "cards": [
    {
      "qid": "MY-001",
      "qid_unique": "cv-stemi-inferior-001",
      "sys": "CV",
      "test": "TEST 1",
      "diagnosis": "STEMI — Inferior",
      "presentation": "62-year-old man with 45 minutes of crushing substernal chest pain, diaphoresis, and ST elevation in leads II, III, aVF.",
      "one_thing": "ST elevation in inferior leads (II, III, aVF) = inferior STEMI from RCA → emergent PCI within 90 min.",
      "educational_objective": "Inferior STEMI is caused by occlusion of the right coronary artery. Emergent PCI is the treatment of choice when available within 90 minutes of first medical contact.",
      "board_trigger": "IF ST elevation in II + III + aVF → inferior STEMI → activate cath lab → PCI <90 min",
      "why_not_others": "Unstable angina has no ST elevation and no biomarker rise. Pericarditis causes diffuse saddle-shaped ST elevation across multiple leads, not a contiguous territory.",
      "explanation": "The RCA supplies the inferior wall. Occlusion causes ST elevation in inferior leads. Screen for right heart involvement with right-sided leads — RV infarct changes management (avoid nitrates).",
      "quick_recall": "Inferior STEMI: ST elevation II/III/aVF → RCA → PCI <90 min"
    }
  ]
}
```

---

## Architecture

| Constraint | Detail |
|---|---|
| **Single file** | All CSS and JS live in `index.html`. No external JS files, no imports. |
| **No build tooling** | Vanilla JS only. No TypeScript, no bundling, no npm. |
| **Medical content is read-only** | `presentation`, `diagnosis`, `educational_objective`, `board_trigger`, `one_thing`, `explanation`, `why_not_others` — displayed verbatim from uploaded JSON. Never rewritten by the app. |
| **`parseJsonLoose()`** | All deck parsing tolerates `NaN` values in source data (a known issue in some `why_not_others` fields from certain export pipelines). |
| **`canonicalCardId()`** | Progress keys use: `qid_unique → card_id → qid → id → hash(presentation + diagnosis)`. Array index is never used as a key. |
| **No embedded cards** | `DATA.cards` is empty by default. The app always starts blank. |
| **Deck Loading** | Drag-and-drop JSON upload · CSV import |
| **Deduplication** | `qid_unique → qid → card_id → hash(presentation + diagnosis)` — first seen wins |
| **Export** | Session progress · full deck · per-system report · JSON downloads |
| **Review** | Filter by repair point / pinned / system / search · sort by due date |

---

## Importing Cards

### Drag and Drop
Drag any `.json` or `.csv` file onto the app window. An import summary displays: total cards, valid, incomplete, duplicates skipped, and a breakdown by system.

### CSV Import
Headers must match the field names in the schema above. Quoted fields with embedded commas and newlines are handled. Empty `why_not_others` cells are stored as `null`.

### Using AI (fastest method)
Open the app → click **🤖 AI Cards** → copy the prompt → paste into Claude or ChatGPT with your notes below it. The AI returns valid JSON. Drag it in.

### Converting Existing Notes

**From Anki:**
```
Anki Front  →  presentation
Anki Back   →  one_thing + educational_objective
Anki Tags   →  tags + sys
```

**From lecture slides / textbooks:**
```
Slide title / bold heading  →  diagnosis
Clinical scenario           →  presentation
Key point / bottom line     →  one_thing (in your own words)
Management section          →  educational_objective + board_trigger
```

---

## Progress & Export

- **Session export** — JSON snapshot of all cards seen this session with ratings
- **Deck export** — Full normalized card deck as JSON
- **Full report** — Per-system breakdown with correct / wrong / repair counts
- **Progress persistence** — `localStorage: cozy_arcade_progress_v1` survives page close and reload

### Review Mode Filters
- Repair Points (cards rated `again` or `hard`)
- Pinned cards
- By organ system
- Free-text search
- Sort by due date, system, or last seen

---

## PWA / Offline (Phase 4)

Phase 4 adds a service worker and manifest so the app installs and runs completely offline.

### Service Worker (`sw.js`)

```js
const CACHE = 'cozy-arcade-v4';
const ASSETS = ['./', './index.html'];
self.addEventListener('install', e =>
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)))
);
self.addEventListener('fetch', e =>
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)))
);
```

### Manifest (`manifest.json`)

```json
{
  "name": "Cozy Arcade Board Prep Medicine",
  "short_name": "Cozy Arcade",
  "start_url": "./",
  "display": "standalone",
  "background_color": "#030713",
  "theme_color": "#67e8f9",
  "icons": [
    { "src": "./icon-192.png", "sizes": "192x192", "type": "image/png" }
  ]
}
```

### Self-Hosted Fonts (Phase 4)

The app currently loads Orbitron and DM Sans from Google Fonts, which requires an internet connection. Phase 4 replaces the `<link>` tag with `@font-face` declarations using base64-encoded or locally bundled font files, making the app fully offline-capable.

---

## Roadmap

| Phase | Status | What Ships |
|-------|--------|------------|
| **P1** | ✅ Complete | Architecture consolidation (40 style blocks → 1, 101 duplicate functions removed), SM-2 SRS, legacy progress migration, 20/20 smoke tests passing |
| **P2** | 🔄 In Progress | Browser gameplay verification, falling mechanic timing fix, CSV import, end-screen per-system breakdown |
| **P3** | Planned | FSRS v5 algorithm replaces SM-2, review reveal overlay, interval preview on rating buttons (`previewInterval()`) |
| **P4** | Planned | PWA manifest + service worker, self-hosted Orbitron + DM Sans, full offline mode |
| **P5** | Optional | Supabase progress sync (cloud backup across devices) |
| **P6** | Optional | Capacitor wrapper for iOS / Android with haptic feedback on correct/wrong |

---

## Non-Negotiables

These constraints are intentional and must not be changed in PRs:

- **Single-file HTML.** No build step, no npm, no bundler.
- **Medical content fields are never rewritten.** `presentation`, `diagnosis`, `educational_objective`, `board_trigger`, `one_thing`, `why_not_others`, `explanation` — displayed verbatim from the uploaded JSON.
- **Cards are never embedded in the HTML.** The app always starts blank.
- **App title:** `COZY ARCADE BOARD PREP-MEDICINE`
- **Mode names:** `Solo Studying`, `Knowledge Expansion`

---

## Debug & Testing

```javascript
// Enable debug panel
localStorage.setItem("cozy_debug", "1");
location.reload();

// Run in-browser smoke tests (upload a deck first)
window.runCozySmokeTests();
// Expected: 15–20 tests passing

// Inspect SRS state for any card
window.getCardProgress("your-qid-unique-here");

// Force a card due immediately (useful for testing)
window.updateCardProgress("card-id", { next_due_at: new Date().toISOString() });
```

---

## Copyright

Medical facts — doses, diagnostic criteria, cutoff values, lab ranges — are not copyrightable and may be used exactly.

What requires paraphrasing: explanatory prose from commercial question banks, specific vignette wording from copyrighted sources.

The `one_thing` field is always the card author's own words.

---

## License

MIT — open source, fork freely, no franchise IP.

---

*Medical content: Cards are user-supplied. The app stores and displays them verbatim — no AI rewriting of clinical content.*  
*Built for: ABIM board prep · internal medicine · extensible to any MCQ domain*  
*Aesthetic: Dark neon · cyan / purple / blue · game-like but clinical-systems tone*

*v4.0 · May 2026 · Built for the generation that will face the next pandemic prepared.*
