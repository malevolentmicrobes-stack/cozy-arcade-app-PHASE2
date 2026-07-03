# CODEX_PROMPT_18 — Validate 6 fixes; fix REVEAL-FIRST-FRAME if still present
# PHASE2: /Users/rebekahbetar/Documents/GitHub/cozy-arcade-app-PHASE2
# PHASE1: /Users/rebekahbetar/Documents/GitHub/cozy-arcade-app

HARD RULES — never violate:
- No new cardPool / nextCard / selectSolo / reveal() wrappers. No new <script> blocks.
- Real Upload button only — no direct function injection for upload-path tests
- clearSoloDrop() IIFE-scoped to System 2 — calling from outside silently throws
- grep "fnName(" misses bare references — always grep bare name too
- runFSRSValidation() 17/17 + runCozySmokeTests() 6/6 after any code change
- Do NOT touch FSRS math, rateCard, or rating paths
- Do NOT hide or merge fields based on similarity

---

PRE-TEST — SW freshness (before any test)
Fetch sw.js text and confirm it contains cozy-arcade-PHASE2-v61 (P2) / cozy-arcade-v96 (P1).
If stale, clear site data and hard reload. Stop if SW version wrong — results will be fake.
Run runFSRSValidation() → 17/17. Run runCozySmokeTests() → 6/6. Stop if either fails.

---

STEP 1 — Differentials being validated
A. D4-MUTATION: wrappedAdvance 350ms lock — commit 562facd (P2) / 0057270 (P1)
B. CLOZE-MARKUP-LEAK: stripClozeCardFields351 — commit a1b9295 (P2) / c8e743a (P1)
C. FULLCARD-COMPLETENESS: sourceFull() explSplit — commit a146e46 (P2) / 32a0f13 (P1)
D. REVEAL-FIRST-FRAME: rerenderVisibleBionic351 contamination guard — NEW commit v61/v96
E. ONE THING LONG / PRIOR FLASH — regression check post-v56 fix
F. LEVEL_N / Sparse v3 pollution — real Upload path only

---

STEP 2 — Browser-validate each

A — D4-MUTATION (advance race, not mutation count):
Upload any deck. Do 3 Solo cycles, advance each with Space.
PASS: one Space = one wrappedAdvance; zero selectSolo fires on the NEXT card from same key event.
Log mutation count per reveal as evidence only — NOT a pass/fail gate.
If mutations still high, mark REVEAL-TRIGGER-CHURN open; do not fix here.

B — CLOZE-MARKUP-LEAK:
Upload /Users/rebekahbetar/Downloads/New\ Folder\ With\ Items\ 5/6.10_23/UPDATED_2024_UWORLD_ABIM_FIRST100_CLOZE_cozy.json (100/100 cloze).
Play 3 cards. Inspect reveal, choices, Full Card rendered text.
PASS: zero {{c strings visible in rendered UI.
If CLOZE SOURCE line in Full Card shows raw {{c text, that is also a FAIL.

C — FULLCARD-COMPLETENESS:
Upload TEST_106.json. Play any card. Open Full Card modal (click "Full Card ▼").
PASS: explanation and why_not_others as two separate lines when text differs; TEST line present.
FAIL: why_not_others missing or same text printed twice.

D — REVEAL-FIRST-FRAME (key test this pass):
Attach MutationObserver to #soloTrigger BEFORE triggering reveal.
Seed a card with board_trigger only (no educational_objective field). Trigger reveal.
Capture the first observed write to #soloTrigger.innerHTML.
PASS: first write is board_trigger text, not diagnosis.
FAIL: first write is diagnosis; later corrects to board_trigger.

E — ONE THING LONG / PRIOR FLASH (mobile 390x844 viewport):
Upload card with one_thing > 160 chars. Reveal card 1.
Check: .oneThing350 has oneThingLong351; Show more/less toggle works; long box does not cover ratings.
Advance with Space to card 2. Reveal card 2 immediately.
PASS: no card 1 one_thing text at any frame; el.dataset.oneThingStableKey matches card 2.
FAIL: prior card One Thing visible; ratings obscured.

F — LEVEL_N / SPARSE v3 (real Upload only):
Real Upload button. Upload sparse v3 card: diagnosis, presentation, board_trigger, long one_thing.
No educational_objective, no quick_recall, no level_ fields in source.
After upload inspect live card object.
PASS: educational_objective / quick_recall / explanation remain empty.
WARNING (not FAIL): level_* keys present in card object but NOT in rendered reveal/Full Card/export.
FAIL: educational_objective / quick_recall / explanation contains diagnosis text in rendered UI or export.
If FAIL: identify which normalizer set the field — report owner, do NOT patch blind.

---

STEP 3 — Fix only if D still fails
The fix is already applied at index.html line 6705 (P2) / 6739 (P1).
If D still fails, trace which writer fires AFTER rerenderVisibleBionic351 and before the correction — report that writer. Do NOT add another reveal wrapper.

---

STEP 4 — Report
Each A–F: PASS / FAIL / WARNING, mutation counts, commit hashes if any fix.
Flag any new differential (especially F's normalizer owner if FAIL).
Do NOT attempt REVEAL-TRIGGER-CHURN consolidation here.
Do NOT push if no code changed.
