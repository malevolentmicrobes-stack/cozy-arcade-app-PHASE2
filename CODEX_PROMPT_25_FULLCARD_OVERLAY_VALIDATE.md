# CODEX_PROMPT_25 — Validate PHASE1 Full Card overlay port from PHASE2
# PHASE1 ONLY: /Users/rebekahbetar/Documents/GitHub/cozy-arcade-app
# (PHASE2 already had the correct behavior — no PHASE2 code changed.)

HARD RULES:
- Implementation already applied. Do NOT touch sourceFull(), medical content
  fields, rating controls, or reveal content ordering — this was a pure
  layout-owner port, not a content change.
- runFSRSValidation() 17/17 + runCozySmokeTests() 6/6.

---

CONTEXT
Full Card ("UP TO CLOSE") opened as a lower inline panel inside the reveal
card in PHASE1, instead of PHASE2's clean full-overlay covering the reveal.
Root cause (source-confirmed, not guessed): PHASE1 had 3 things PHASE2 doesn't:
1. `.fullDropdown350` CSS was `position:relative` with a `max-height:34vh`
   inline panel style, not `position:absolute;inset:0` overlay.
2. `.fullClose351` ("UP TO CLOSE" button) was a small top-right pill
   (`position:absolute;right:12px;top:10px`), not a full-width sticky bar.
3. Opening it called `box.scrollIntoView({behavior:'smooth',block:'nearest'})`
   — PHASE2 has no equivalent call, doesn't need one since the overlay covers
   the reveal in place.
4. A SEPARATE function (~index.html:9074, inside the reveal-render path) had
   `if(fullBox && !fullBox.classList.contains('hidden')) fullBox.innerHTML=...`
   — unconditionally rewriting the open Full Card's content on every
   re-render. Real bug beyond what was reported: the rewritten HTML never
   rebinds `.fullClose351`'s `onclick`, so the close button goes dead after
   the first re-render that happens while the panel is open (this codebase
   has multiple ~1s periodic normalizers, so this could fire often).

Fix: ported PHASE2's `.fullDropdown350`/`.fullDropdown350 pre`/`.fullClose351`
CSS verbatim (index.html ~5820-5826), removed the `scrollIntoView()` call
(~6931), and replaced the unconditional rewrite at ~9077 with PHASE2's no-op
comment (never rewrite an open fullDropdown350 at all — matches PHASE2 exactly,
line for line). sw.js bumped to cozy-arcade-v127.

---

STEP 1 — SW freshness
Confirm sw.js contains cozy-arcade-v127. Hard reload if stale.
runFSRSValidation() 17/17. runCozySmokeTests() 6/6.

STEP 2 — Visual overlay check, both Solo and Domain, desktop (~1920x1280) and mobile
Answer a card, reveal it, click "Full Card ▼".
PASS: Full Card covers the reveal cleanly (position:absolute;inset:0), "UP TO
CLOSE" is a full-width sticky bar at the top of the panel, old reveal content
(diagnosis/board trigger/one thing) is NOT visible behind/around it.
Compare against PHASE2's same interaction — should now look the same.

STEP 3 — Close button stays functional after a delay
Open Full Card, wait ~2-3s (long enough for this codebase's periodic ~1s
normalizers to run at least once), then click "UP TO CLOSE".
PASS: panel closes normally.
FAIL: click does nothing (this was the exact latent bug the stale-rewrite
line caused — confirm it's actually gone, not just visually not-yet-triggered).

STEP 4 — No unwanted scroll jump
Open Full Card. Confirm the page/reveal does NOT scroll/jump on open (no more
scrollIntoView call). Confirm scroll position inside the Full Card panel
itself (if content is long enough to need overflow-y:auto) is preserved
normally, not reset, while it stays open across any background re-render.

STEP 5 — Regression
- Reveal content (diagnosis, board trigger, one thing, rating buttons)
  unchanged in appearance/position when Full Card is closed.
- sourceFull() output itself unchanged (this was layout-only).
- Full Card ▼/▲ button label still toggles correctly.

STEP 6 — Report
PASS/FAIL per step. FSRS/smoke results. Commit hash if all pass. Do not push.
