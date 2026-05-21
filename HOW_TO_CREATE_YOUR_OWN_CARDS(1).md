# How to Create Your Own Cards

Cozy Arcade uses a simple v3 JSON schema. The goal is: question first, answer after testing, then deeper explanation only when you ask for the full card.

## Simplest Card

```json
{
  "cards": [
    {
      "qid": "MY-001",
      "sys": "CV",
      "diagnosis": "STEMI",
      "presentation": "Crushing chest pain, diaphoresis, ST elevation in II/III/aVF.",
      "one_thing": "Inferior STEMI -> right coronary artery -> PCI within 90 minutes."
    }
  ]
}
```

Save the file as `.json`, then drag it into the app.

## Field Map

| Field | Use |
| --- | --- |
| `qid` | Unique ID. This is how progress is remembered. |
| `sys` | Organ system. Examples: `CV`, `ID`, `GI`, `PULM`, `RENAL`. |
| `test` | Optional deck/test group. Examples: `TEST 1`, `MY CARDIOLOGY`. |
| `diagnosis` | Correct answer choice. |
| `presentation` | Question, clinical stem, or front of card. |
| `one_thing` | The main reveal in your own words. |
| `educational_objective` | Full teaching point in the Full Card dropdown. |
| `board_trigger` | Pattern: IF finding -> diagnosis -> action. |
| `why_not_others` | Distractor explanations. |
| `explanation` | Long explanation. |
| `quick_recall` | One-sentence recall fallback. |
| `tags` | Comma-separated keywords. |

## AI Conversion

Open the app and click **AI Cards**. Copy the prompt and paste it into Claude, ChatGPT, Gemini, or another AI with your notes below it.

Use this structure when giving notes:

```text
[paste the AI Cards prompt from the app]

--- MY NOTES ---
Aortic stenosis
- Classic triad: angina, syncope, heart failure
- Severe: AVA <1.0 cm2, mean gradient >40 mmHg
- Symptomatic severe AS: TAVR or surgical AVR
- No effective medical therapy for severe symptomatic disease
```

The AI should return valid JSON only. Drag that JSON into the app.

## Manual Template

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
      "test": "MY NOTES - CARDIOLOGY",
      "diagnosis": "Aortic stenosis",
      "presentation": "70-year-old with exertional syncope and harsh systolic murmur at the right upper sternal border radiating to the carotids.",
      "one_thing": "Symptomatic severe aortic stenosis needs valve replacement.",
      "educational_objective": "Severe symptomatic aortic stenosis requires valve replacement. TAVR is often preferred for older or higher-risk patients; surgical AVR remains appropriate for selected lower-risk patients.",
      "board_trigger": "IF exertional syncope + crescendo-decrescendo RUSB murmur -> aortic stenosis -> echo -> valve replacement if severe and symptomatic",
      "why_not_others": "Hypertrophic cardiomyopathy worsens with Valsalva and is often seen in younger patients. Mitral regurgitation causes a holosystolic murmur at the apex.",
      "explanation": "Aortic stenosis causes fixed outflow obstruction. Symptoms mark worse prognosis and should prompt echocardiography and definitive valve intervention.",
      "quick_recall": "AS: angina/syncope/dyspnea + RUSB murmur -> echo -> TAVR/AVR if severe and symptomatic.",
      "tags": "CV, aortic stenosis, valvular, murmur"
    }
  ]
}
```

## Accepted Aliases

The app normalizes common field names:

```text
prompt, front, question, clinical_vignette_summary -> presentation
answer, back -> diagnosis
takeaway, quick_recall, level_2_three_second -> one_thing
system, subject -> sys
source_sheet -> test
```

## System Values

Use one of these where possible:

```text
CV, ID, GI, ENDO, NEURO, RHEUM, RENAL, PSYCH, DERM, PULM,
HEME, OB/GYN, ENT, ETHICS, STATS, OPHTHO, ALLERGY, UROLOGY,
EMERGENCY, TOX
```

The app normalizes common variants. For example: `Pulm`, `PULM`, `pulm/cc`, and `puml/cc` all become `PULM`.

## Validation Checklist

- File ends in `.json`.
- JSON has a top-level `cards` array.
- Every `qid` is unique.
- No trailing comma after the last card.
- Strings use double quotes.
- Empty optional values can be omitted or set to `null`.
- `presentation` is the question, not the answer.
- `diagnosis` is the answer.
- `one_thing` is your own wording.

## Copyright Note

Medical facts, criteria, cutoffs, doses, and timelines can be used exactly.

Rephrase:

- Commercial question stems
- Original explanatory prose
- Distinctive narrative examples from books, question banks, or paid courses

The safest workflow is to make `one_thing` your own wording and keep deeper explanation in your own study voice.
