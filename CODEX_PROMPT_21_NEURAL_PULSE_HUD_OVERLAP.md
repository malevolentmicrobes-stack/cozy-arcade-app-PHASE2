# CODEX_PROMPT_21 — Reserve space for #neuralPulse371, do NOT hide it
# PHASE1 ONLY: /Users/rebekahbetar/Documents/GitHub/cozy-arcade-app
# (Confirmed: PHASE2 has no #neuralPulse371/vNeuralPulseJS — nothing to change there.)

HARD RULES — never violate:
- Do NOT hide, remove, or gate #neuralPulse371's visibility during gameplay.
  index.html:14870-14876 documents 3 rounds of direct user feedback (v1→v3) that
  arrived at "fixed to true viewport top, independent of any card/HUD" on purpose.
  Your own proposed `body.cozyGameShellActive371 #neuralPulse371{display:none}`
  would delete that feature — cozyGameShellActive371 is true in exactly the same
  window inject() shows the strip (index.html:14990, 13294), so that rule is not
  cosmetic, it's a functional revert. Do not apply it.
- Do NOT touch renderHudControls() (index.html:13139) — CLAUDE.md rectifier rule 3
  says it's the single HUD-content owner. This is a spacing-only fix, not a
  content change, so it must not add/move HUD content through any other path.
- CSS-only fix preferred. No new <script> blocks.
- runFSRSValidation() 17/17 + runCozySmokeTests() 6/6 after any change.

---

DIAGNOSIS (confirmed via source read, needs your live measurement to finish)
#neuralPulse371: position:fixed; top:0; z-index:300 (index.html:14878-14895).
.gameHud: position:sticky; top:0; z-index:120; min-height:52px (index.html:12487).
renderHudControls() adds .gameHud class onto the *existing* .hud div
(index.html:13145, hud.classList.add('gameHud')) — it's the first child of
#solo/#domain, so a real margin-top on it reserves real layout space at the true
top of the game area, which is where the fixed strip paints. Because z-index 300
> 120, the strip currently paints over the top slice of the HUD bar instead of
sitting above it.

---

STEP 1 — Measure the real strip height
In a live page with #solo visible (so #neuralPulse371 is injected), run:
  document.getElementById('neuralPulse371').getBoundingClientRect().height
Record the exact number (expect roughly 16-20px given font-size:9px + padding:3px
0, but use the real measured value, not this estimate).

STEP 2 — Apply the fix
Add one rule near the existing cozyGameShellActive371-scoped block at
index.html:12692-12693 (same file, same pattern):
  body.cozyGameShellActive371 .gameHud { margin-top: <measured>px; }
Comment above it: why (reserves space for the intentionally-fixed neural pulse
strip, index.html:14870 explains why it can't be hidden or moved into the HUD).

STEP 3 — Browser-validate at 393x852 DPR 3, both #solo and #domain
PASS:
- #neuralPulse371 fully visible, its rect does NOT intersect .gameHud's rect.
- .gameHud content (score/streak/gate pills, pause button) fully visible, not
  clipped or shifted off-screen.
- No new horizontal overflow on .gameHud.
- Prompt card / choice grid position unchanged (do not touch .promptBox/.soloTrack).
- Repeat with reveal open then closed — margin must not reflow/jump on reveal.

STEP 4 — Secondary check (only after STEP 3 passes)
Confirm body.cozyGameShellActive371 is present during actual gameplay (not just
in devtools) and that #gearBtn/#homeTopBtn are hidden per the existing
index.html:12692-12693 rule. If they leak, that's a separate, already-diagnosed
issue (HUD-ICON-BLANK/OLD-SETTINGS-LEAK family, see project memory) — report but
do not fix here.

STEP 5 — Report
Measured strip height, final margin-top value applied, PASS/FAIL per gate above,
FSRS/smoke results, commit hash if all pass. Do not push.
