# CODEX_PROMPT_24 — Validate runner direction-of-travel facing fix
# PHASE1: /Users/rebekahbetar/Documents/GitHub/cozy-arcade-app
# PHASE2: /Users/rebekahbetar/Documents/GitHub/cozy-arcade-app-PHASE2

HARD RULES:
- Implementation already applied, identical in both repos, new patch block only
  (`v175165-runner-facing-css`/`-js`, right after `v175163-runner-dedup-js`).
  Does not touch dir-left/dir-right (used by 3 other unrelated systems), does
  not touch moveHunter()'s own source, does not revive the hidden SVG poses.
- runFSRSValidation() 17/17 + runCozySmokeTests() 6/6.

---

CONTEXT
Runner didn't face direction of travel — confirmed via source read (not
guessed): the live visible runner is a sprite-strip background-image on
`#runner.hunter` (cozy-v24-patch), which had zero facing logic. The old
dir-left/dir-right classes (syncRunner(), ~index.html:3701) are side-of-screen
(lane 0/1 = dir-left, lane 2/3 = dir-right) and only ever drove a now-hidden
SVG pose system (de-dup patch hides all `#runner` children).

Fix: new `.faceLeft351` class toggled by comparing the runner's lane before
vs after each `moveHunter()` call (wrapped, same idiom as the existing
`hookMoveHunter()`/`syncRunner` pattern already in this file). The flip
(`scaleX(-1)`) is composed directly into a new keyframe set
(`narutoSpriteBobFlip351`, copied from the live `narutoSpriteBob` keyframes
with scaleX(-1) inserted) rather than applied as a plain class transform,
because `#runner.hunter` already runs `narutoSpriteBob` via the `animation`
shorthand every frame — a separate static transform would be silently
overwritten by that running animation.

**CORRECTION after first Codex validation pass:** v1 of this patch tried to
switch the animation via a stylesheet rule (`#runner.hunter.faceLeft351{
animation:...!important}`). Codex's browser check found the class toggled
correctly but the visual flip never rendered — computed animation/transform
never changed. Root cause: `enforceRunnerSprite()` (cozy-v24-patch-js) writes
`#runner`'s `animation` directly into its `style` attribute with `!important`,
and an inline `!important` declaration always wins over a stylesheet
`!important` rule regardless of selector specificity. Fixed: the stylesheet
rule is gone (only the `@keyframes narutoSpriteBobFlip351` declaration
remains, since keyframe names still have to be defined somewhere); `applyFacing()`
now writes the animation switch the same way — `r.style.setProperty('animation',
value, 'important')` — matching the actual owner instead of fighting it.

**Known unknown, needs your visual check:** I could not determine the sprite
sheet's native/unflipped facing direction from source alone (no image
inspection available). Current logic: moving to a LOWER lane index (right→left)
adds `.faceLeft351` (flips). If the sprite's neutral state already faces left,
this is backwards. This is a one-line fix if so: in `v175165-runner-facing-js`,
`applyFacing()`, flip the comparison from `newLane<oldLane` to `newLane>oldLane`
(both repos, identical change).

---

STEP 1 — SW freshness
Confirm sw.js: PHASE1 cozy-arcade-v126, PHASE2 cozy-arcade-PHASE2-v74 (not
v125/v73 — those were the pre-correction build that failed to render the flip).
runFSRSValidation() 17/17. runCozySmokeTests() 6/6.

STEP 2 — Visual facing check (this is the step that FAILED before — focus here)
Verify via getComputedStyle(runner).animation, not just visually — confirm it
actually reads "...narutoSpriteBobFlip351..." when facing left, not just
that .faceLeft351 is present on the class list (that was the false-negative
last time: class toggled, animation didn't).
Start Solo, answer several questions moving between lanes in both directions
(use arrow keys to move without locking in, or let auto-select land on
different lanes across questions). Screenshot or observe:
- PASS: sprite visibly mirrors (faces opposite horizontal direction) when
  moving left vs right, and the mirror direction matches actual travel
  direction (moving toward lane 0 = character visually faces left/that way).
- FAIL (wrong polarity): character visually faces the OPPOSITE of travel
  direction — apply the one-line fix described above, re-test, do not add a
  second competing class/rule.

STEP 3 — Animation smoothness regression
Confirm the run-cycle (background-position stepping through the 4-frame
sprite) and the bob (vertical bounce) both keep playing smoothly through a
facing flip — no visible freeze/reset/pop when `.faceLeft351` toggles on or
off mid-animation.

STEP 4 — First-question / reset check
New question resets `selected` to lane 0 (`makeChoices()`), which can trigger
a facing change purely from the reset, not user input. Confirm this looks
reasonable (character faces the direction it's visually jumping to lane 0
from) rather than glitchy or backwards.

STEP 5 — Regression
- dir-left/dir-right classes still present on the runner as before (this
  patch doesn't remove them, just ignores them) — confirm no visual change
  to anything that might still reference them elsewhere.
- Domain mode: confirm no runner-facing-related change (this patch only
  targets `#runner`, used by Solo; Domain has its own separate orb UI).
- No console errors from the new script block.

STEP 6 — Report
PASS/FAIL per step, both repos. If polarity was backwards, confirm the fix
was applied identically in both repos and re-tested. FSRS/smoke results.
Commit hash if all pass. Do not push.
