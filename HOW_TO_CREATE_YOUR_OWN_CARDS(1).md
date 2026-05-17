# 📝 How to Create Your Own Cards
### Cozy Arcade Board Prep — v17 Schema
### From your notes → drag-and-drop into the app

---

## ⚡ The 2-Field Rule

You only need **2 fields** from your notes to make a working card:

| Field | What it is | Where it comes from |
|-------|-----------|---------------------|
| `presentation` | The question / clinical stem | Your **PRESENTATION** notes |
| `educational_objective` | The one thing to know | Your **EDUCATIONAL OBJECTIVE** notes |

Everything else is optional. The app normalizes and fills defaults.

---

## 🗂️ Step-by-Step: Notes → Card File

### STEP 1 — Gather your notes

From any source (lecture, textbook, Anki, UpToDate highlight):

```
MY NOTES:
PRESENTATION:     "Patient with chest pain, ST elevations in inferior leads"
EDUCATIONAL OBJ:  "STEMI → activate cath lab → PCI <90 min"
```

---

### STEP 2A — Text editor (manual)

Notepad, TextEdit, VS Code, anything. Create a new file, save as:
```
my_cards.json
```

---

### STEP 2B — OR: Use AI to convert your notes automatically

Upload your note file (PDF, Word doc, text, screenshot) to any AI and paste this prompt:

---

**⬇️ COPY THIS PROMPT INTO CLAUDE / CHATGPT / GEMINI /AI software:**

```
I am uploading my study notes. Convert them into a JSON card file 
using this exact schema.

Output a valid JSON file with this structure:

{
  "meta": {
    "export_date": "TODAY'S DATE",
    "json_schema_version": "v17_source_truth_append_only",
    "bundle_namespace": "cards",
    "total_cards": NUMBER,
    "source_file": "my_cards.json"
  },
  "cards": [
    {
      "card_id": "1",
      "json_id": 1,
      "qid_unique": "MY-001",
      "qid": "MY-001",
      "original_qid": null,
      "test": "MY NOTES",
      "sys": "ORGAN SYSTEM",
      "diagnosis": "TOPIC NAME",
      "presentation": "clinical stem or question in my own words",
      "educational_objective": "the one key concept in my own words",
      "answer": "short answer",
      "board_trigger": "IF [finding] → THINK [diagnosis] → DO [action]",
      "level_1_presentation": "one-liner",
      "level_2_three_second": "3-second answer",
      "level_3_quick_recall": "bullet recall facts",
      "level_3_treatment": "treatment steps",
      "level_3_next_step": "next best step",
      "tags": "system, topic, keywords",
      "bundle_namespace": "cards",
      "updated_at": "TODAY'S DATE",
      "json_schema_version": "v17_source_truth_append_only",
      "source_truth_status": "MY NOTES",
      "source_sheet": "My Notes",
      "source_row": 1
    }
  ]
}

Rules:
- One card per concept / diagnosis
- Write presentation and educational_objective in my own words
- Medical facts (doses, criteria, timelines) are fine to use exactly
- Set null for any field you cannot fill from my notes
- Output only valid JSON — no extra text, no markdown fences
```

---

> ⚠️ **Copyright note:** Medical facts cannot be copyrighted — "door-to-balloon <90 min" is free to use.  
> What IS protected: exact question stems, specific explanatory prose, and original phrasing from books or question banks.  
> Write in your own words.

---

### STEP 3 — Paste template manually (if not using AI)

```json
{
  "meta": {
    "export_date": "2026-05-16",
    "json_schema_version": "v17_source_truth_append_only",
    "bundle_namespace": "cards",
    "total_cards": 1,
    "source_file": "my_cards.json"
  },
  "cards": [
    {
      "card_id": "1",
      "json_id": 1,
      "qid_unique": "MY-001",
      "qid": "MY-001",
      "original_qid": null,

      "test": "MY DECK",
      "sys": "CV",
      "diagnosis": "STEMI",

      "presentation": "← PASTE YOUR PRESENTATION NOTE HERE",
      "educational_objective": "← PASTE YOUR EDUCATIONAL OBJECTIVE HERE",

      "answer": "← same as educational objective, or shorter",
      "board_trigger": "IF [finding] → THINK [diagnosis] → DO [action]",

      "tags": "CV, cardiology",
      "bundle_namespace": "cards",
      "updated_at": "2026-05-16",
      "json_schema_version": "v17_source_truth_append_only",
      "source_truth_status": "MY NOTES",
      "source_sheet": "My Notes",
      "source_row": 1
    }
  ]
}
```

---

### STEP 4 — Add more cards

Copy the card block, paste after the first, separated by a comma.
Update card_id, json_id, qid_unique for each. Update total_cards in meta.

```json
"cards": [
  { "card_id": "1", "qid_unique": "MY-001", ... },
  { "card_id": "2", "qid_unique": "MY-002", ... },
  { "card_id": "3", "qid_unique": "MY-003", ... }
]
```

---

### STEP 5 — Drag and drop into the app

1. Open index.html in your browser (or your GitHub Pages URL)
2. Drag my_cards.json onto the app
3. Cards load instantly — no server needed

---

## 🔑 Field Quick Reference

### Required (minimum viable card)
```
presentation          ← your PRESENTATION note
educational_objective ← your EDUCATIONAL OBJECTIVE note
```

### Strongly recommended
```
card_id       ← "1", "2", "3"... (string)
json_id       ← 1, 2, 3... (integer)
qid_unique    ← unique ID, e.g. "MY-001"
diagnosis     ← topic/diagnosis name
sys           ← CV | RENAL | GI | PULM | NEURO | ID | ENDO | RHEUM | HEM/ONC | MSK
test          ← deck name, e.g. "MY NOTES — CARDIOLOGY"
```

### Optional but powerful (progressive disclosure layers)
```
level_1_presentation   ← one-liner
level_2_three_second   ← 3-second answer
level_3_quick_recall   ← bullet recall facts
level_3_treatment      ← treatment steps
level_3_next_step      ← next best step
board_trigger          ← IF → THINK → DO pattern
why_not_others         ← distractor explanations
tags                   ← "CV, STEMI, must-know"
cloze_source_text      ← fill-in-the-blank version
cloze_enabled          ← "Y" if cloze card
```

---

## 🧠 Converting Your Notes Format

### From Anki cards
```
Anki Front  →  presentation + level_1_presentation
Anki Back   →  answer + educational_objective + level_2_three_second
Anki Tags   →  tags
```

### From Lecture Notes / PDF highlights
```
Bold heading / topic     →  diagnosis
Clinical scenario        →  presentation
"Key point:" / takeaway  →  educational_objective
"Treatment:" section     →  level_3_treatment
"Next step:" question    →  level_3_next_step
```

### From UpToDate / textbook
```
Section title    →  diagnosis
Opening summary  →  level_1_presentation
Key paragraph    →  educational_objective (paraphrase in your own words)
Management table →  level_3_treatment
```

---

## ✅ Validation Checklist Before Import

- [ ] File saved as .json (not .json.txt)
- [ ] total_cards in meta matches actual number of cards
- [ ] Each card has a unique qid_unique
- [ ] No trailing comma after the last card
- [ ] All strings in double quotes
- [ ] Null fields use null not "" or "null"

Quick validator: paste your JSON at jsonlint.com before importing.

---

## 📋 Full Worked Example

Notes:
  PRESENTATION: Exertional syncope, harsh systolic murmur at RUSB, radiates to carotids
  EDUCATIONAL OBJECTIVE: Severe symptomatic AS → TAVR or surgical AVR

Becomes:

```json
{
  "meta": {
    "export_date": "2026-05-16",
    "json_schema_version": "v17_source_truth_append_only",
    "bundle_namespace": "cards",
    "total_cards": 1,
    "source_file": "my_cards.json"
  },
  "cards": [
    {
      "card_id": "1",
      "json_id": 1,
      "qid_unique": "MY-AS-001",
      "qid": "MY-AS-001",
      "original_qid": null,
      "test": "MY NOTES — CARDIOLOGY",
      "sys": "CV",
      "diagnosis": "Aortic stenosis",
      "presentation": "Exertional syncope, harsh systolic murmur at RUSB, radiates to carotids, diminished S2.",
      "educational_objective": "Severe symptomatic AS requires valve replacement — TAVR (preferred if high surgical risk) or surgical AVR. No effective medical therapy for severe AS.",
      "answer": "Severe symptomatic aortic stenosis → TAVR or surgical AVR",
      "board_trigger": "IF exertional syncope + crescendo-decrescendo murmur RUSB → AS → Echo → severe + symptomatic → AVR/TAVR",
      "level_1_presentation": "Exertional syncope + harsh murmur at RUSB → aortic stenosis",
      "level_2_three_second": "Aortic stenosis",
      "level_3_quick_recall": "AS triad: Angina · Syncope · dyspnea (HF)\nSevere: AVA <1.0cm², gradient >40mmHg",
      "level_3_treatment": "Symptomatic severe AS → TAVR or surgical AVR\nNo effective medical therapy",
      "level_3_next_step": "TTE → confirm severity → refer to valve team",
      "tags": "CV, aortic stenosis, murmur, valvular",
      "bundle_namespace": "cards",
      "updated_at": "2026-05-16",
      "json_schema_version": "v17_source_truth_append_only",
      "source_truth_status": "MY NOTES",
      "source_sheet": "My Cardiology Notes",
      "source_row": 1
    }
  ]
}
```

---

Schema version: v17_source_truth_append_only · Patched 2026-05-16
