# 🎮 cozy-arcade-app

**Cozy Arcade Board Prep — Medicine**  
Solo studying web app for Internal Medicine board prep.  
Single-file HTML · No server required · Drag-and-drop JSON import · Works offline.

---

## 📁 Repo Structure

```
cozy-arcade-app/
├── index.html                          ← The full app (open in any browser)
├── mgh_whitebook_cards_v17_index.json  ← MGH Whitebook deck — drag & drop to load
├── README.md                           ← This file
└── .gitignore
```

---

## 🚀 Quick Start

### Option A — GitHub Pages (recommended)
1. Fork or push this repo to GitHub
2. Go to **Settings → Pages → Source → main / root**
3. Your app is live at `https://<your-username>.github.io/cozy-arcade-app/`
4. Open the URL → drag **`mgh_whitebook_cards_v17_index.json`** onto the app to load cards

### Option B — Run locally
```bash
open index.html          # macOS
start index.html         # Windows
xdg-open index.html      # Linux
```
Or serve with any static server:
```bash
npx serve .
python3 -m http.server
```

---

## 📦 Included Deck

| File | Cards | Source |
|------|-------|--------|
| `mgh_whitebook_cards_v17_index.json` | 99 | MGH Whitebook 2023–2024 (APKG first 99) |

**Accepted import formats:** `.json` · `.csv`

---

## 🃏 Card Schema

Cards follow the **v17 source-truth schema**. Key identity fields:

```
card_id · json_id · qid_unique · original_qid · qid
```

Content layers (progressive disclosure):

| Field | Level | Description |
|-------|-------|-------------|
| `presentation` | 0 | Raw stem / question |
| `level_1_presentation` | 1 | One-liner |
| `level_2_three_second` | 2 | 3-second recall answer |
| `level_3_quick_recall` | 3a | Quick recall |
| `level_3_treatment` | 3b | Treatment |
| `level_3_next_step` | 3c | Next step |
| `level_4_full_card` | 4 | Full structured card |

---

## ➕ Bring Your Own Cards

Any JSON matching the schema (or close — the importer normalizes flexibly) can be drag-dropped in.

Minimal card example:

```json
{
  "card_id": "1",
  "json_id": 1,
  "qid_unique": "MY-001",
  "test": "MY DECK",
  "sys": "CV",
  "diagnosis": "Aortic stenosis",
  "presentation": "Exertional syncope + harsh systolic murmur at RUSB...",
  "answer": "Aortic stenosis",
  "board_trigger": "IF exertional syncope + murmur → AS → Echo → AVR/TAVR",
  "bundle_namespace": "cards",
  "json_schema_version": "v17_source_truth_append_only"
}
```

Wrap in `{ "meta": { ... }, "cards": [ ... ] }` for a full import bundle.

---

## 🗄️ Session Exports (from app)

The app exports your session — these are gitignored automatically:

| Export | File pattern |
|--------|-------------|
| Cards only | `solo_studying_cards_only_*.json` |
| Progress patch | `solo_studying_progress_patch_*.json` |
| Entire bundle | `solo_studying_entire_bundle_*.json` |
| Shadow dungeon subset | `solo_studying_shadow_dungeon_subset_*.json` |

---

## 🔧 Version

| Item | Value |
|------|-------|
| App | v3.5.3 LIMITLESS |
| Schema | v17_source_truth_append_only |
| Card ID patch | 2026-05-16 |
| MGH deck | 99 cards (APKG first 99) |
| Source | AnkiBrain MGH Whitebook 2023–2024.apkg |

---

## 📄 License

Personal study tool. Card content sourced from MGH Whitebook board prep materials.  
App code © Solo Studying / Cozy Arcade. Not for commercial redistribution.
