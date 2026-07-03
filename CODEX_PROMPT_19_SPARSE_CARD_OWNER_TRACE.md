# CODEX_PROMPT_19 — Trace sparse-v3 pollution owner (F); sanitize Full Card CLOZE SOURCE (B)
# PHASE2: /Users/rebekahbetar/Documents/GitHub/cozy-arcade-app-PHASE2
# PHASE1: /Users/rebekahbetar/Documents/GitHub/cozy-arcade-app

HARD RULES — never violate:
- Real Upload button only — no direct function injection for upload-path tests
- No new cardPool / nextCard / selectSolo / reveal() wrappers. No new <script> blocks.
- grep "fnName(" misses bare references — always grep the bare name too
- runFSRSValidation() 17/17 + runCozySmokeTests() 6/6 after any code change
- Do NOT patch F blind. Find owner first, report, then fix.
- Do NOT delete cloze_source / cloze_source_text from card object (source provenance)

---

PRE-TEST
Fetch sw.js text — confirm cozy-arcade-PHASE2-v61 (P2) / cozy-arcade-v96 (P1).
Hard reload + clear site data if stale. Run runFSRSValidation() 17/17, smoke 6/6. Stop if fail.

---

STEP 1 — F: Find the normalizer that pollutes sparse v3 cards

Instrument BEFORE any upload. Override these 4 confirmed-live normalizers plus any
unidentified change-event listener to log which function first writes EO/quick/explanation:

const _watch = (name, fn) => function(...args) {
  const card = args[0];
  const before = {eo: card?.educational_objective, qr: card?.quick_recall, ex: card?.explanation};
  const result = fn.apply(this, args);
  const after = {eo: card?.educational_objective, qr: card?.quick_recall, ex: card?.explanation};
  if (before.eo !== after.eo || before.qr !== after.qr || before.ex !== after.ex)
    console.warn('[OWNER]', name, 'changed fields', {before, after});
  return result;
};
Wrap: normalizeCardFields352, normalizeSourceCard, normalizeLimitlessCard,
and the normalizeCard/revealFor/promptFor trio in the v1751528-final-js block.
Also log any change-event on the upload inputs BEFORE it calls its handler.

Then upload this exact sparse v3 card via the real Upload button:
{ "diagnosis": "Test Diagnosis 351", "presentation": "Test presentation",
  "board_trigger": "Test board trigger value", "one_thing": "Test one thing" }
No educational_objective, no quick_recall, no explanation, no level_* fields.

After upload, inspect the console: which [OWNER] fired?
Log the exact function name, the field that changed, and what value it wrote.

PASS: no [OWNER] warning fires — sparse fields stay empty.
FAIL: at least one [OWNER] fires — report function name + written value. Stop. Do not fix yet.

---

STEP 2 — B: Fix CLOZE SOURCE display sanitization in sourceFull()

Find the line in sourceFull() / window.full that renders the CLOZE SOURCE output line.
It currently outputs cloze_source_text or cloze_source raw (confirmed showing {{c1::...}} in Full Card).
Apply a display-only strip at that single render point:
  const clozeDisplay = (raw) => String(raw||'').replace(/\{\{c\d+::(.*?)(::.*?)?\}\}/g,'$1').trim();
Use clozeDisplay() when building the CLOZE SOURCE line — nowhere else.
Do NOT modify card.cloze_source_text or card.cloze_source in the card object.

After edit: open Full Card on a cloze card. PASS: CLOZE SOURCE line shows plain answer text, no {{c markup.
Run runFSRSValidation() 17/17, smoke 6/6. Bump SW (sw.js, both repos). Push.

---

STEP 3 — F fix (only if STEP 1 identifies owner)
If owner confirmed: apply the same source-preserving fix used in SPARSE-CARD-DIAGNOSIS-POLLUTION (ff98200):
  remove the optional-learning-field fallback chain from the identified function so
  educational_objective / quick_recall / explanation are not set from diagnosis/answer.
Do NOT remove answer/diagnosis/output fallbacks from those fields — those are appropriate there.
One function, one change. JXA-verify against sparse-v3 fixture before applying.
Run runFSRSValidation() 17/17, smoke 6/6. Bump SW (both repos if ported). Push.

---

STEP 4 — Report
B: PASS or FAIL; commit hash if fixed.
F: owner function name + field + value if found; fix commit if applied; or "owner not found" if no [OWNER] fires.
Any new differential found.
Do NOT touch REVEAL-TRIGGER-CHURN. Do NOT consolidate normalizers.
