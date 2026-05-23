# Cozy Arcade Board Prep — Medicine

A single-file offline flashcard game for medical board prep. JJK/Shadow Dungeon aesthetic. No server. No account. Open `index.html` → drag your JSON deck → study.

```
malevolentmicrobes-stack/cozy-arcade-app
├── main    private ABIM version (not public)
├── public  GitHub Pages — blank shell, no private decks
└── dev     working branch
```

---

## Quick Start

1. Download `index.html`
2. Open it in any browser (Chrome, Safari, Firefox)
3. Drag `example_deck_template.json` onto the app to see a demo
4. Replace with your own cards (see below)

**GitHub Pages:** `https://malevolentmicrobes-stack.github.io/cozy-arcade-app/`

---

## How It Works

```
Upload JSON deck → Study (Solo Studying game) → Reveal answer
         ↓                                              ↓
   Filters by:                              Shows immediately:
   • Organ system                           • one_thing (key takeaway)
   • Test group (TEST 1–100)               On demand (tap ▼):
   • New / Reviewed / Pinned / Missed      • Educational objective
   • Free text search                      • Board trigger (IF→DO)
                                           • Why not others
                                           • Full explanation
```

**Keyboard controls:**
`← →` move · `1–4` select · `Space/Enter` confirm · `F` full card · `Enter` next card

---

## Card Schema (v3)

Minimum working card — only 3 fields required:

```json
{
  "cards": [
    {
      "qid": "MY-001",
      "sys": "CV",
      "diagnosis": "STEMI",
      "presentation": "Crushing chest pain, ST elevation in II/III/aVF.",
      "one_thing": "Inferior STEMI → emergent PCI <90 min."
    }
  ]
}
```

**Full card fields:**

| Field | Required | What it is |
|-------|----------|------------|
| `qid` | ✅ | Unique ID — used for progress tracking |
| `sys` | ✅ | Organ system (CV, ID, GI, ENDO, NEURO, RHEUM, RENAL, PSYCH, DERM, PULM, HEME…) |
| `diagnosis` | ✅ | The correct answer shown to user |
| `presentation` | ✅ | The question / clinical stem |
| `one_thing` | ✅ | Key takeaway — shown on reveal |
| `test` | recommended | Group name (e.g. "TEST 1", "MY DECK") — for filtering |
| `educational_objective` | recommended | Full teaching point — behind "Show Full Card" |
| `board_trigger` | recommended | IF [finding] → [diagnosis] → [action] |
| `why_not_others` | optional | Distractor explanations |
| `explanation` | optional | Verbose explanation |
| `quick_recall` | optional | One-sentence recall (fallback for one_thing) |
| `tags` | optional | Comma-separated keywords |

The importer also accepts these aliases:
- `prompt`, `front`, `question` → maps to `presentation`
- `answer`, `back` → maps to `diagnosis`
- `takeaway`, `quick_recall` → maps to `one_thing`
- `system`, `subject` → maps to `sys`

---

## Create Cards From Your Notes (AI method)

Open the app → click **🤖 AI Cards** → copy the prompt → paste into Claude or ChatGPT with your notes → drag the returned JSON into the app.

The prompt instructs the AI to:
- Put clinical stems in `presentation`
- Put diagnoses in `diagnosis`
- Write `one_thing` in your own words
- Keep `educational_objective` as the full teaching point

See `HOW_TO_CREATE_YOUR_OWN_CARDS.md` for the manual method.

---

## Progress

Progress is saved automatically to browser `localStorage` (keyed by `qid`).

**Export:** click **Export Progress** → saves `cozy_progress_YYYY-MM-DD.json`

**Import:** click **Import Progress** → merge with any previous export (keeps newer record on conflict)

**New cards:** when you upload a deck, the app automatically shows how many cards are new vs already reviewed, and adds a **Study New Cards** button.

---

## Files in This Repo

```
index.html                        ← The full app (no private cards inside)
example_deck_template.json        ← 3 demo cards to test the app
README.md                         ← This file
HOW_TO_CREATE_YOUR_OWN_CARDS.md  ← Step-by-step card creation guide
ABIM_JSON_SCHEMA_REFERENCE.txt   ← Full schema reference for developers
MODE PURPLE SIGIL.png             ← App asset
EXPANSION SIGAL.png               ← App asset
DNAHELIX_ORB_SIGAL.png           ← App asset
4_POINT_RUNNER_SPRITE.png         ← App asset (4-frame animation)
.gitignore                        ← Blocks all private decks from this branch
```

Private decks (`*ABIM*`, `*MGH*`, `*SOURCE*`) are blocked by `.gitignore` and never appear in this branch.

---

## For Developers

The app is a single HTML file (~187 KB). All assets (images, fonts) are either embedded as base64 or loaded from Google Fonts CDN. No build step. No dependencies.

State is stored in `localStorage` under key `cazy_v3`.

The `norm()` function on import normalizes all field name variants, so any reasonable card format will load correctly.

---

*Schema: cozy-arcade-v3 · May 2026 · For board prep, not medical advice*
