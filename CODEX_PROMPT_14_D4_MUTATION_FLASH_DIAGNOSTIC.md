# CODEX PROMPT 14 — D4-MUTATION reopened: card glitch/flashing, zero-cache repro
**Paste block below into Codex. ~50 lines. Diagnostic only — do not write a fix this prompt.**

**Context:** User reported "card glitch/flashing" with a screen recording + 5 screenshots, on a
complete new browser/computer with zero cache, during JSON import. Claude reviewed the static
evidence and could NOT confirm a content-corruption bug — stills show consistent, correct content
(same reveal card throughout). Claude has no ffmpeg in its environment to inspect the video's
actual motion, so a real rapid flicker invisible in stills can't be ruled out. The session in the
evidence was at Gate 12, not the first card, so don't assume this is first-import-only.

This may be the same root cause as the existing D4-MUTATION differential (MutationObserver write
churn: 1 innerHTML swap fans out to ~8 callbacks, 3 actual writes per card, "first-frame flicker
possible" — known since 2026-06-15, previously deprioritized as "not blocking"). Or it may be
something specific to a genuinely empty/fresh profile. Don't assume which — confirm live.

---

```
DIAGNOSTIC ONLY — D4-MUTATION reopened. PHASE2 primary, then PHASE1. No source edits this prompt.

GATES: curl deployment gate, confirm live SW, before testing.

STEP 1 — REPRODUCE UNDER THE USER'S ACTUAL CONDITION:
Launch a genuinely clean browser context (incognito/private, or a fresh temp profile — NOT your
existing reusable test profile, it likely already has cached state from today's other prompts).
Import a deck via the actual Upload button / importLimitlessDeck path (not localStorage seeding
shortcuts) so the import path itself runs cold. Play at least 10 cards across a mix of correct/
incorrect answers, through several reveal screens, watching for any visible flash/flicker.

STEP 2 — INSTRUMENT (if you can't see it by eye, instrument before concluding it's not there):
- MutationObserver on #soloQuestion, #soloReveal, #choiceRow, and document.body (attribute +
  childList + subtree), logging every mutation with a timestamp during STEP 1's session.
- Specifically log every time document.body.className is set to '' and what it's restored to
  immediately after, and the time gap between clear and restore (even a few ms gap can visibly
  flash if it strips a background/theme class).
- Count actual innerHTML writes to #soloQuestion per card (this is D4-MUTATION's original
  concern — confirm whether it's still 3 writes per card, or different under a cold profile).
- Take a screenshot or DOM snapshot every ~80ms for 2 seconds around each reveal transition,
  not just before/after — diff consecutive snapshots for anything that appears then disappears.

STEP 3 — REPORT (this prompt's entire deliverable, no fix):
- Did you observe an actual visible flash/flicker? Describe exactly what flashed (whole screen
  blank? specific element? layout jump? color change?) and for how long.
- If yes: which mutation(s) from STEP 2's log correspond to the timing of the flash?
- Is this reproducible on a warm/cached profile too, or only on a genuinely fresh one? This
  determines whether it's D4-MUTATION (general) or a new zero-cache-specific differential.
- Repeat once in PHASE1.

Send this report to Claude. Do not propose or write a fix until the actual visible mechanism is
confirmed — D4-MUTATION was deprioritized as "not blocking" once already; don't re-guess at a fix
for it without first confirming what the user is now seeing is the same thing.
```
