# CODEX_PROMPT_20 — Validate Space/Enter Continue on the Game Completed (#end) screen
# PHASE2: /Users/rebekahbetar/Documents/GitHub/cozy-arcade-app-PHASE2
# PHASE1: /Users/rebekahbetar/Documents/GitHub/cozy-arcade-app

HARD RULES — never violate:
- No new cardPool / nextCard / selectSolo / reveal() wrappers. No new <script> blocks.
- runFSRSValidation() 17/17 + runCozySmokeTests() 6/6 after confirming the SW version.
- Do NOT touch FSRS math, rateCard, or rating paths.
- Both repos changed identically this session (same diff, same insertion point) — validate both.

---

CONTEXT
Claude found the "Game Completed" (#end) overlay had zero keyboard handling — none of
the ~16 existing keydown listeners reference #end. Worse: pressing Space/Enter while
#end was showing fell through to the oldest global handler (~line 432, window, bubble
phase) and could silently fire selectSolo() on the hidden card underneath, since
endRun() never changes `mode` away from 'solo'/'domain'.

Fix (uncommitted, local only, NOT live-browser-validated): added one capture-phase
`document` keydown listener directly inside the `v175159-end-atlas-ux` script (same
block that owns the `endContinue` button, right after `fixEndScreen()`'s closing brace).
It guards on input focus like every other handler, no-ops unless `#end` is visible,
and on Space/Enter calls preventDefault + stopPropagation + stopImmediatePropagation
then `document.getElementById('endContinue').click()` — reuses the existing Continue
button's own onclick rather than duplicating its logic.

PHASE2 sw.js CACHE bumped v69→v70. PHASE1 sw.js CACHE bumped v116→v117. Neither
committed yet.

---

PRE-TEST — SW freshness
Fetch sw.js text, confirm cozy-arcade-PHASE2-v70 (P2) / cozy-arcade-v117 (P1).
If stale, clear site data and hard reload. Stop if wrong — results will be fake.
Run runFSRSValidation() → 17/17. Run runCozySmokeTests() → 6/6. Stop if either fails.

---

STEP 1 — Reach the Game Completed screen
Upload any deck. Play Solo until HP hits 0 (or force it: `hp=0; endRun('Game Completed')`
in console is acceptable ONLY to reach the screen faster — the actual key-press test
below must still be a real keyboard event, not a function call).

STEP 2 — Test Space and Enter separately (2 runs)
With #end visible, press Space (not click). Confirm:
  PASS: overlay hides, gameplay resumes/advances (same effect as clicking Continue).
  FAIL: overlay stays open, OR the card underneath visibly changes/selects before
        the overlay closes (this would mean the old line-432 handler still fired).
Repeat with Enter key instead of Space.

STEP 3 — Regression check on the per-card Reveal screens
Space/Enter already had established behavior on #soloReveal / #domainReveal via
several other listeners (activeReveal(), continueReveal(), etc.) — this change must
not touch that path. Do 3 normal Solo reveal cycles with Space, confirm unchanged
behavior (card advances once per press, no double-advance, no stuck reveal).

STEP 4 — Report
PASS/FAIL for Space and Enter on #end, both repos. If FAIL, report exactly which
existing listener still fired (check event.defaultPrevented and add a temporary
console.trace inside the line-432 handler if needed — remove before reporting done).
Confirm STEP 3 regression check is clean.
If all PASS: commit both repos separately (index.html + sw.js), report SHAs. Do not push.
