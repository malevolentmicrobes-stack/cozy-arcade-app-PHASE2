# Cozy Arcade Board Prep Medicine — Progress Atlas Handoff Status

Date: 2026-05-25
Status: Diagnosis complete. No final patch applied yet unless explicitly stated in git diff.

## Current Bug
Progress / Neural Atlas sometimes opens with "No deck loaded" after full deck import.

## Relevant Files
- index.html
- progress_beta.html
- cozy_arcade_deck_with_progress_backup-4(1).json
- cozy_arcade_progress_2026-05-25-2(1).json

## Confirmed Findings
- Full deck backup is large: about 10MB, 1249 cards, 1259 progress entries.
- Full-deck localStorage write is quota-risk.
- Progress handler in index.html writes compact sys-map to:
  cozy_arcade_limitless_cards_v1
- Compact sys-map shape:
  { qid_unique, sys }
- progress_beta.html can hydrate from this shape.
- atlasLoadDeck() runs unconditionally during init().
- There is no minimum card threshold.
- "No deck loaded" is triggered only when deckMap is empty.
- sessionStorage flag cozy_atlas_pending_refresh is broken across window.open('_blank') and redundant.
- The real risk is catch(_){} silently swallowing localStorage.setItem failure.
- If quota is exhausted, compact sys-map is not written and progress_beta opens with empty deckMap.

## Most Likely Root Cause
The key cozy_arcade_limitless_cards_v1 may already contain or attempt to contain the full deck. When Progress tries to write the compact sys-map, localStorage.setItem can throw QuotaExceededError. The catch block hides this, so Atlas opens without a deck cache.

## Safest Minimal Patch Next
Patch only the existing Progress button onclick handler in index.html.

Before writing compact sys-map:
localStorage.removeItem('cozy_arcade_limitless_cards_v1');

Then write compact sys-map.

Remove:
sessionStorage.setItem('cozy_atlas_pending_refresh', '1');

Replace silent catch with:
console.warn('[Atlas handoff] compact sys-map write failed', err);
alert('Progress map could not be cached. Export a full backup, then clear browser site storage and re-import.');

Do not touch:
- setAppCards()
- rating/spaced repetition logic
- import/export schema
- progress_beta rendering
- progress schema
- medical card content

## Validation After Patch
1. Import full deck_with_progress backup.
2. Click Progress.
3. In progress_beta console:
   Object.keys(deckMap).length
   should be > 0.
4. Confirm "No deck loaded" is hidden.
5. Confirm systems render.
6. Confirm no QuotaExceededError.
7. Confirm localStorage key cozy_arcade_limitless_cards_v1 contains compact sys-map, not the full 10MB deck.

## Strategic Decision
Do not build inline Atlas yet. It is likely the long-term clean solution, but too risky while credits are low. Finish the minimal handoff patch first.
