# CODEX_PROMPT_23 — Validate HUD label collapse fix inside vHUD-compression-fix
# PHASE1 ONLY: /Users/rebekahbetar/Documents/GitHub/cozy-arcade-app

HARD RULES:
- Implementation already applied, scoped entirely inside vHUD-compression-fix
  (index.html:14727) — no new <style> block, no touch to vHUD-simplify/
  vHUD-single-row/vHUD-polish-2/neural-pulse spacing/renderHudControls().
- Do NOT hide #neuralPulse371. Do NOT re-widen the fix beyond this one block.
- runFSRSValidation() 17/17 + runCozySmokeTests() 6/6.

---

CONTEXT
Premortem (this session, browser-confirmed) found: vHUD-simplify (index.html:14447)
already built a working icon-only mobile HUD — font-size:0 on .hudPill collapses
the raw "Energy Level"/"Score"/"Streak" text nodes, font-size:11px restores only
the value-carrying > span / > .hpWrap children, plus emoji ::before labels via
:has(). vHUD-compression-fix (added later, same session, commit 3b1b924) set
font-size:11px/10px directly on the whole .hudPill at 3 spots, which — same
selector target, higher specificity via body.cozyGameShellActive371 — silently
overrode vHUD-simplify's font-size:0 and re-exposed the verbose labels. That's
why the screenshot showed "Energy Level", "Score 0", "Streak 0" spelled out again.

Fix applied 2026-08-11: at all 3 spots (900px block ~14766, 480px block ~14795
and ~14808), replaced the blanket .hudPill font-size with the same 0/restore-on-
children split vHUD-simplify already uses. sw.js bumped to cozy-arcade-v121.

CORRECTION after first Codex validation pass (v121): Domain's .energyHud352
FAILED — it also carries the .hudPill class (ensureEnergyPill(), index.html:13121,
flat text "Energy Lv 1 · +0 CE", no span to restore), so the v121 collapse
selector matched it too and a same-block follow-up override wasn't enough to
save it (collapse rule came later, same specificity, won). Fixed in v122: both
collapse selectors now read `.hudPill:not(.energyHud352)` /
`.hudPill:not(.hudIconButton371):not(.energyHud352)` directly, with a separate
`.hudStats371 .energyHud352{font-size:11px/10px}` rule. sw.js bumped to
cozy-arcade-v122. Re-validate Domain specifically against this correction.

---

STEP 1 — SW freshness
Confirm sw.js contains cozy-arcade-v122 (not v121 — that was the pre-correction
build). Hard reload if stale.
runFSRSValidation() 17/17. runCozySmokeTests() 6/6.

STEP 2 — Mobile Solo, question state (390x844 and 393x852 DPR3)
PASS: HUD shows emoji + number only (❤️/⚔️/🔥/🏁), no "Energy Level"/"Score"/
"Streak"/"Gate" text spelled out. #neuralPulse371 still visible at top (17px),
.gameHud still starts below it, two-row structure intact, no horizontal overflow.

STEP 3 — Mobile Solo, reveal state
Same checks as STEP 2 with reveal open. Confirm reveal panel position/bottom
controls unaffected (this fix should not touch anything below the HUD).

STEP 4 — Domain mode (this is the step that FAILED at v121 — focus here)
Same checks. Confirm .energyHud352 computed font-size is 11px (900px block) or
10px (480px block), NOT 0px. This is the exact regression Codex's v121 pass
caught via computed-style inspection — verify with getComputedStyle, not just
a visual glance, since 0px text can still occupy layout space and look "present."

STEP 5 — Regression / premortem checks
- Exactly one visible control per role (pause/undo/home/settings) — this fix
  doesn't touch renderHudControls()'s dedupe logic, but confirm nothing broke.
- No doubled pseudo-icons (vHUD-simplify's ::before emoji vs any other icon path).
- Bottom controls (choice row / mobile nav) still fully reachable, not covered.
- At width just above 900px (e.g. 920px) and just above 480px (e.g. 500px),
  confirm labels are NOT collapsed (this fix is scoped to the ≤900px/≤480px
  media queries only, matching vHUD-compression-fix's existing scope) — desktop
  should be unaffected either way since it's outside these media queries.

STEP 6 — Report
PASS/FAIL per step with screenshots if available. FSRS/smoke results.
If any FAIL, report which selector is losing the specificity fight — do not
add a 4th font-size override to "win" the fight, report the conflict instead.
Commit hash if all pass. Do not push.
