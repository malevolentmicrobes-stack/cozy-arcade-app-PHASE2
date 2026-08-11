# CODEX_PROMPT_22 — Validate bionic suffix contrast bump (implementation done, validate only)
# PHASE2 ONLY: /Users/rebekahbetar/Documents/GitHub/cozy-arcade-app-PHASE2

HARD RULES:
- Implementation is already applied — do not re-edit unless validation finds a real problem.
- Do NOT touch bionic() (index.html:392), prompt/answer sizing, or PHASE1. Any of those changing is a FAIL of scope, not something to "also fix."
- runFSRSValidation() 17/17 + runCozySmokeTests() 6/6.

---

CONTEXT
User reported PHASE2 prompt text looking like mixed fonts. Root cause (source-confirmed,
not a font/fallback bug): bionic() (index.html:392) splits words into <b>prefix</b>+suffix;
v175374-rectifier-font-bionic-fix (index.html:13342) colored the suffix
rgba(160,200,255,.62) weight 500 against a white weight-950 prefix. PHASE2 also has an
unrelated, intentional v17.5.8 change (index.html:6-38, comment "reduce oversized
prompts") that shrinks .promptText to clamp(18px,2.05vw,29px) vs PHASE1's
clamp(24px,3vw,42px) — smaller text made the same contrast pattern read as harsher/more
"broken-font"-looking. Decision: keep the intentional smaller sizing, only raise the
suffix contrast. Applied 2026-08-11: suffix is now rgba(215,230,255,.82) weight 700,
prefix unchanged (#fff/950). SW bumped to cozy-arcade-PHASE2-v71.

---

STEP 1 — SW freshness
Confirm sw.js contains cozy-arcade-PHASE2-v71. Hard reload if stale.
runFSRSValidation() 17/17. runCozySmokeTests() 6/6.

STEP 2 — Bionic ON, before/after comparison
Load a Solo card with bionic ON (data-cozy-bionic="1" on :root).
PASS: prompt text still shows a visible bold/regular emphasis split (bionic effect
intact), but the regular portion no longer reads as a different/broken font — should
look like intentional reading emphasis, not garbled text.
Compare against the reported screenshots (ENDO/RHEUM cards, this same session) if
still available — check the same visual complaint is resolved.

STEP 3 — Regression checks (must be unchanged)
- Bionic OFF: prompt text uniform white, no <b> fragments — unchanged from before.
- Answer choice cards: font size/weight/color unchanged (only .promptText's rule
  changed, choices use a separate CSS path — confirm, don't assume).
- .promptText font-size: still clamp(18px,2.05vw,29px) at desktop width, still
  shrinks under the 760px media query — confirm v17.5.8 sizing untouched.
- Domain mode prompt: same contrast fix should apply there too since it targets
  .promptText generically — confirm domain reads correctly, not just Solo.

STEP 4 — Report
PASS/FAIL per step. If FAIL on legibility, propose ONE incremental contrast value
(do not touch prefix or sizing). FSRS/smoke results. Do not push.
