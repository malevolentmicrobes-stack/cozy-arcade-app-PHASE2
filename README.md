# Cozy Arcade App

Cozy Arcade Board Prep Medicine is a single-file offline study app. This public version ships as a blank app: no private ABIM deck, no MGH deck, and no connected database.

## Branch Model

```text
malevolentmicrobes-stack/cozy-arcade-app
├── main    private ABIM version
├── public  sanitized GitHub Pages version
└── dev     working branch before PRs
```

This branch is prepared for the sanitized/public flow: open `index.html`, upload your own JSON deck, study offline, then export progress or deck JSON from the app.

## Public Files

```text
index.html
example_deck_template.json
README.md
.gitignore
HOW_TO_CREATE_YOUR_OWN_CARDS(1).md
```

`mgh_whitebook_cards_v17_index.json`, ABIM exports, and other source decks are intentionally ignored and should not be pushed to the public branch.

## Quick Start

Open `index.html` directly in a browser, or publish the branch with GitHub Pages.

For GitHub Pages:

1. Push the sanitized branch to GitHub.
2. In the repository settings, enable Pages from the branch root.
3. Open the Pages URL.
4. Use `Upload JSON Deck` in the app.
5. Use `Download Example JSON` or `example_deck_template.json` as the template for your own cards.

## JSON Import

The app accepts a JSON object with a `cards` array. Minimal card shape:

```json
{
  "meta": {
    "schema": "cozy-arcade-v1",
    "total": 1
  },
  "cards": [
    {
      "id": "demo-001",
      "sys": "CV",
      "diagnosis": "Myocardial infarction",
      "prompt": "Patient with chest pain, diaphoresis, and ST elevation.",
      "one_thing": "STEMI needs emergent PCI.",
      "board_trigger": "IF ST elevation with ischemic symptoms -> activate cath lab"
    }
  ]
}
```

The importer also normalizes nearby field names such as `front`, `question`, `back`, `answer`, `topic`, `system`, `tags`, `level_1`, `level_2`, `level_3_recall`, `level_3_treatment`, and `level_3_next_step`.

## Offline Use

Uploaded cards are stored in browser localStorage for this temporary database-free beta. Export your deck or progress JSON from the app if you want a portable backup.
