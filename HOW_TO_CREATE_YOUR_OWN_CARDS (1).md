# How to Create Your Own Cards
### Cozy Arcade Board Prep · v3 Schema

---

## The Simplest Card (3 fields)

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

## Method 1 — AI Conversion (fastest)

### Step 1
Open the app → click **🤖 AI Cards** in the header → copy the prompt.

### Step 2
Open Claude, ChatGPT, or any AI. Paste the prompt, then add your notes below it:

```
[paste the AI prompt from the app]

--- MY NOTES ---
Aortic stenosis:
- Classic triad: angina, syncope, heart failure
- Severe: AVA < 1.0 cm², mean gradient > 40 mmHg
- Treatment: symptomatic severe AS → TAVR or surgical AVR
- No effective medical therapy
```

### Step 3
The AI returns valid JSON. Drag it into the app.

### Rules the AI follows (and you should too)
- `presentation` = the question shown during testing
- `diagnosis` = the correct answer
- `one_thing` = **your own words** — the single most important takeaway
- Medical facts (doses, cutoffs, criteria) are not copyrightable — use exactly
- Explanatory prose → rephrase in your own words

---

## Method 2 — Manual (full control)

Copy this template, fill it in, save as `my_cards.json`:

```json
{
  "meta": {
    "schema": "cozy-arcade-v3",
    "total": 1
  },
  "cards": [
    {
      "qid": "MY-001",
      "sys": "CV",
      "test": "MY NOTES — CARDIOLOGY",
      "diagnosis": "Aortic stenosis",

      "presentation": "70-year-old with exertional syncope, harsh systolic murmur at RUSB radiating to carotids.",
      "one_thing": "Aortic stenosis triad: angina + syncope + dyspnea (HF). Severe + symptomatic → valve replacement.",

      "educational_objective": "Severe symptomatic AS requires valve replacement. TAVR preferred for high surgical risk; surgical AVR otherwise. No effective medical therapy for severe AS.",
      "board_trigger": "IF exertional syncope + crescendo-decrescendo murmur RUSB → AS → Echo → if severe + symptomatic → AVR/TAVR",
      "why_not_others": "HCM: dynamic obstruction, worsens with Valsalva. MR: holosystolic murmur at apex. HOCM: young patient, family history sudden death.",
      "explanation": "AS triad develops in order: angina → syncope → HF. Each symptom = worse prognosis. AVA <1.0 cm² = severe. Mean gradient >40 mmHg = severe. TAVR now preferred for most patients over surgical AVR.",
      "quick_recall": "AS: angina/syncope/dyspnea + RUSB murmur → Echo → severe + symptomatic → TAVR or AVR",

      "tags": "CV, aortic stenosis, valvular, murmur"
    }
  ]
}
```

---

## Field Reference

### Required
| Field | What it is |
|-------|-----------|
| `qid` | Unique ID — any string, no spaces (e.g. "MY-001") |
| `sys` | Organ system — see list below |
| `diagnosis` | The correct answer choice |
| `presentation` | The clinical question / stem |
| `one_thing` | Key takeaway — shown immediately on reveal |

### Strongly Recommended
| Field | What it is |
|-------|-----------|
| `test` | Group name for filtering (e.g. "TEST 1", "MY CARDIOLOGY") |
| `educational_objective` | Full teaching point — shown in expanded full card |
| `board_trigger` | IF [finding] → [diagnosis] → [action] |

### Full Card (shown on demand)
| Field | What it is |
|-------|-----------|
| `why_not_others` | Why the distractors are wrong |
| `explanation` | Verbose full explanation |
| `quick_recall` | One-sentence fallback if `one_thing` is blank |

### Accepted Aliases (app normalizes automatically)
```
presentation  ← also: prompt, front, question, clinical_vignette_summary
diagnosis     ← also: answer, back
one_thing     ← also: takeaway, quick_recall, level_2_three_second
sys           ← also: system, subject
```

---

## System Values

Use any of these for `sys`:

```
CV        Cardiology
ID        Infectious Disease
GI        Gastroenterology
ENDO      Endocrinology
NEURO     Neurology
RHEUM     Rheumatology
RENAL     Nephrology
PSYCH     Psychiatry
DERM      Dermatology
PULM      Pulmonology / Critical Care
HEME      Hematology / Oncology
OB/GYN    Obstetrics / Gynecology
ENT       Ear, Nose, Throat
ETHICS    Ethics / Professionalism
STATS     Biostatistics / Epidemiology
OPHTHO    Ophthalmology
ALLERGY   Allergy / Immunology
```

The app normalizes case variants automatically (Pulm, PULM, pulm/cc → all become PULM).

---

## Adding Multiple Cards

```json
{
  "meta": { "schema": "cozy-arcade-v3", "total": 3 },
  "cards": [
    { "qid": "MY-001", "sys": "CV", ... },
    { "qid": "MY-002", "sys": "GI", ... },
    { "qid": "MY-003", "sys": "NEURO", ... }
  ]
}
```

Rules:
- Comma between cards, no comma after the last one
- Every `qid` must be unique
- Validate at [jsonlint.com](https://jsonlint.com) if unsure

---

## Converting Existing Notes

### From Anki
```
Anki Front  →  presentation
Anki Back   →  one_thing + educational_objective
Anki Tags   →  tags + sys
```

### From lecture slides / textbook
```
Slide title / bold heading  →  diagnosis
Clinical scenario           →  presentation
"Key point" / bottom line   →  one_thing (in your words)
Management section          →  educational_objective + board_trigger
```

### From UpToDate highlights
```
Section heading    →  diagnosis
Opening summary    →  one_thing (paraphrase)
Key paragraph      →  educational_objective (paraphrase)
Management table   →  board_trigger
```

---

## Validation Checklist

Before importing:

- [ ] File saved as `.json` (not `.json.txt`)
- [ ] Every `qid` is unique
- [ ] No trailing comma after the last card
- [ ] All strings in double quotes
- [ ] Use `null` (not `""`) for empty optional fields
- [ ] Validate at jsonlint.com if you get an import error

---

## Copyright

Medical facts — doses, diagnostic criteria, cutoff values, lab ranges — are not copyrightable and can be used exactly.

What requires paraphrasing:
- Explanatory prose from question banks
- Specific vignette wording from commercial sources
- Original narrative explanations

Your `one_thing` field is always your own words. Everything else can be close to source for the `educational_objective`.

---

*v3 · May 2026 · cozy-arcade-app*
