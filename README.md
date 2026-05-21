# Cozy Arcade Board Prep — Medicine

A single-file offline flashcard game for medical board prep. No server. No account. Open `index.html`, drag in a JSON deck, and study.

```text
malevolentmicrobes-stack/cozy-arcade-app
├── main    current publication branch
├── public  optional GitHub Pages branch
└── dev     working branch
```

## Quick Start

1. Open `index.html` in any browser.
2. Drag `example_deck_template.json` onto the app to test the flow.
3. Replace the example cards with your own JSON deck.
4. Use **Export Progress** after studying if you want a portable backup.

GitHub Pages URL:
`https://malevolentmicrobes-stack.github.io/cozy-arcade-app/`

## Study Flow

```text
Upload JSON deck -> Solo Studying / Knowledge Expansion -> answer -> reveal
                                                      -> Full Card for objective/explanation
```

The app supports:

- Solo Studying runner-lane game
- Knowledge Expansion orb game
- Shadow Dungeon review mode
- System filter: `sys`
- Study scope filter: new, random, review, hard, pinned, tagged, due-weighted
- Local JSON/CSV upload with browser-only storage
- Export deck/progress JSON
- Settings and Game Play panel with AI prompt guidance

Keyboard controls:
`←` / `→` move, `1`-`4` select/rate, `Enter` continue, `Down` full card, `Up` close full card.

## Card Schema

Minimum working card:

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

Full card fields:

| Field | Required | Purpose |
| --- | --- | --- |
| `qid` | yes | Unique ID used for progress tracking |
| `sys` | yes | Organ system, normalized on import |
| `diagnosis` | yes | Correct answer choice |
| `presentation` | yes | Question or clinical stem shown first |
| `one_thing` | yes | Main reveal after answering |
| `test` | recommended | Deck/test group for filtering |
| `educational_objective` | recommended | Full teaching point in expanded card |
| `board_trigger` | recommended | IF finding -> diagnosis -> action |
| `why_not_others` | optional | Distractor explanations |
| `explanation` | optional | Longer full explanation |
| `quick_recall` | optional | One-sentence recall fallback |
| `tags` | optional | Comma-separated keywords |

Accepted aliases:

- `prompt`, `front`, `question`, `clinical_vignette_summary` -> `presentation`
- `answer`, `back` -> `diagnosis`
- `takeaway`, `quick_recall`, `level_2_three_second` -> `one_thing`
- `system`, `subject` -> `sys`

## Create Cards From Notes

Open **Settings and Game Play**. Copy the AI prompt, paste it into Claude or ChatGPT with your notes, then drag the returned JSON into the app.

The prompt enforces:

- `presentation` is the testing prompt
- `diagnosis` is the correct answer
- `one_thing` is the key takeaway in your own words
- `educational_objective` and `explanation` stay behind the full-card expansion

Manual instructions are in `HOW_TO_CREATE_YOUR_OWN_CARDS(1).md`.

## Progress

Progress and uploaded decks are saved locally in the browser. Use export as your portable backup.

Export:
`cozy_arcade_deck_export.json` or the app's progress export file

Import:
Use the settings/import controls to upload deck JSON/CSV or merge progress JSON.

No private cards are embedded in `index.html`; users upload their own deck locally.

## Public Files

```text
index.html                       app shell, no private cards embedded
example_deck_template.json       public demo deck
README.md                        this file
HOW_TO_CREATE_YOUR_OWN_CARDS(1).md
ABIM_JSON_SCHEMA_REFERENCE.txt   schema reference, ignored from public commits when private
MODE PURPLE SIGIL.png            mode sigil asset
EXPANSION SIGAL.png              expansion sigil asset
DNAHELIX_ORB_SIGAL.png           DNA orb asset
4_POINT_RUNNER_SPRITE.png        runner sprite asset
.gitignore                       blocks private decks and exports
```

Private decks matching `*ABIM*`, `*MGH*`, and `*SOURCE*` are ignored and should not be committed to public releases.

## Developer Notes

`index.html` is intentionally standalone. No build step. No package install. The restored publication shell uses the richer prior gameplay engine with a blank public deck (`cards_embedded: 0`).
