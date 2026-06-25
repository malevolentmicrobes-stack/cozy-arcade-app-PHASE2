## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, invoke the `skill` tool with `skill: "graphify"` before doing anything else.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

---

## Codex Agent Instructions — 2026-06-17 (updated end-of-day)

**File convention (added 2026-06-19):** active/queued `CODEX_PROMPT_N_*.md` files live at repo root — there should only ever be a small, current set. Once a prompt's fix lands (commit) or its diagnostic report is received and acted on, move it to `docs/archive/codex_prompts/` (`git mv` if tracked, `mv` if not yet committed). Don't leave completed prompts at root — that's how this got to 12 files needing a cleanup pass today.

**Current SW (2026-06-24, confirmed via direct git fetch + sw.js read, not just this doc):** PHASE2 `cozy-arcade-PHASE2-v49` (commit `43f6a93`, `main`==`public`) | PHASE1 `cozy-arcade-v85` (commit `450c084`). Both repos fully pushed, working trees clean. See "Current Task" below for the 2026-06-24 retest against this exact build.

**Current SW (2026-06-19, ~6:30pm) — superseded, kept for history:** PHASE2 `cozy-arcade-PHASE2-v36` (commit `34697f4`) | PHASE1 `cozy-arcade-v72` (commit `02e4d23`)
**2026-06-22 Codex correction:** PHASE2 sparse-card pollution was still live after `e5e6f6d`. Real Upload button/browser validation found two confirmed mutators: old `normalizeLimitlessCard()` still treated `back`/`answer`/`output` as soft learning-field fallbacks, and `normalizeCardFields352()` copied `answer` into `educational_objective`, `quick_recall`, and `level_2_three_second_exposure` after import. Current PHASE2 fix makes optional learning fields source-preserving in both live normalizers and bumps SW to `cozy-arcade-PHASE2-v41`. Validate with `/private/tmp/cozy_live_upload_glitch_retest.mjs` or equivalent real-file-chooser upload, not direct function injection.
**Next tasks (2026-06-19, ~6:30pm):**
1. **Re-test FQ-ALGO-8** (wrong auto-select rated 'good') — fix applied (see below), but the underlying race trigger was never pinned down, so this is a safety-net fix, not a proven root-cause fix. `CODEX_PROMPT_13` is now mostly superseded but worth running once more specifically to try reproducing the original sequence against the fix.
2. `CODEX_PROMPT_14_D4_MUTATION_FLASH_DIAGNOSTIC.md` — diagnostic only, largely superseded by today's reveal-panel fixes but left open in case residual flicker remains after re-testing.
3. **REVEAL-TRIGGER-CHURN / DATA-EO-ALIAS — mitigated, not consolidated.** Both the settled-state and first-frame flash symptoms are fixed at the display layer. The root architecture (most of `reveal()`'s 17 reassignments are dead code, 900ms reveal interval, 8 separate occurrences of the answer/board_trigger aliasing anti-pattern) is documented but NOT consolidated — deliberate, larger future task.

**FQ-ALGO-8 fix detail (2026-06-19, ~6:30pm, PHASE2 `34697f4` / PHASE1 `02e4d23`):** re-traced the full `advance()` chain and ruled out a stale-closure `selectSolo` theory — found no deterministic logic bug, meaning the trigger is most likely a genuine intermittent race. Rather than guess at it, hardened `wrappedAdvance`'s fallback: it used to default to rating 'good' whenever no pending rating existed. That's correct ONLY for the literal Continue button (confirmed: the live `installRatings()` Continue handler has no rating logic of its own, relies entirely on this fallback). Added `window.__cozyExplicitContinueClick351`, set only by that button, so the fallback now distinguishes "explicit Continue click" (stays 'good') from "Space/Arrow dismissed the reveal" (now computes the real rating via `ratingForSelection`). Verified via JXA simulation, not yet live-browser-validated.

FQ-ALGO-7, FQ-RENDER-5, DOMAIN-AGAIN-DUPE, FQ-DATA-2 (genuinely this time) are closed from earlier today. M2 Stripe stays paused. iOS1 finish is user-run.

**Reveal-panel fix (2026-06-19, ~5:00pm):** `renderRevealSections()` now falls back to `board_trigger||quick_recall` when `educational_objective` is empty or contaminated-equal-to-`diagnosis`, and skips its `dx`/`trigger` DOM write when content is unchanged from last paint (same pattern as the existing `oneThingStableRenderSig` guard). PHASE2 `7bf4273` / PHASE1 `b91cf8f`. Verified via 5-scenario JXA simulation against Codex's exact repro case before applying. Did not touch selectSolo/advance/rateCard/FSRS. Did not attempt the other 7 occurrences of the aliasing anti-pattern, or the broader chain consolidation — see OPEN_DIFFERENTIALS.md REVEAL-TRIGGER-CHURN/DATA-EO-ALIAS for the full scope of what's deliberately left undone.

PROMPT_10 (FQ-RENDER-5) and PROMPT_12 (DOMAIN-AGAIN-DUPE diagnostic) both ran 2026-06-19 with Codex. PROMPT_12's diagnostic correctly found the real mechanism was a stale PHASE1-only `requeueAgainCard()` (not the `selectDomain` chain itself, which fires repeatedly but harmlessly) — Claude applied that fix directly since Codex's session had ended. See OPEN_DIFFERENTIALS.md DOMAIN-AGAIN-DUPE row for the full writeup.
**M2 Stripe: PAUSED by user decision 2026-06-18** ("too many glitches") — do not resume without explicit request, regardless of Stripe link availability.
iOS1 scaffold is done — remaining iOS steps (`npx cap add ios` → `npx cap sync` → open in Xcode) are user-run, not Codex tasks.

---

### STOP — Read Before Any Render Work

**Patch history for FQ-RENDER-1 (do not repeat these mistakes):**

| Attempt | What was tried | Why it failed |
|---------|---------------|---------------|
| d5a470b (2026-05-30) | "dedup dropdown injection + kill dual-drop animation jitter" | Same symptom family, predates the FQ-RENDER-1 name; did not stop System2's loop either |
| dfb2ecc | `clearSoloDrop()` at top of startStableSoloDrop351 | `clearSoloDrop()` is IIFE-scoped inside System 2; silently throws ReferenceError from stable mode's IIFE |
| 8a22e66 | `window.stopAllDropTimers()` before `clearSoloDrop()` | stopAllDropTimers cancels System 0 raf only; clearSoloDrop still failed silently |
| ebeef5e | `window.loopSolo=function(){startStableSoloDrop351();}` at end of SS351 | System 2 renderSolo calls `startDrop()` directly, not via loopSolo; reassignment had no effect |
| 948abe7 | DOM class guard in System 2 tick expiry — but only guards the final `selectSolo()` call | Partial — fixed double auto-select, but every earlier line in tick() (warning text/class toggle, drop position, timerFill) still ran unconditionally. This was FQ-RENDER-5. |
| **fb09afa / 2c8f4ce (2026-06-19)** | Explicit `window.__cozyStableOwnsSoloTimer351` flag checked at the TOP of tick()/startDrop() (not just gating the final action), claimed at the earliest synchronous point (`oldRenderSolo351` wrapper, before the setTimeout(0) deferral), reset every card | **Fixed — validated: 3 consecutive Solo cycles, 0 AUTO-SELECT mutations, FSRS 17/17, smoke 6/6, both repos, before push.** |

**The invariant Codex must never violate:**
`clearSoloDrop()` cannot be called from outside System 2's IIFE. Any attempt will throw ReferenceError silently.

**New lesson from FQ-RENDER-5 (4th attempt at this exact symptom family):** Guarding only the final action at the end of a loop does not stop the loop's other side effects. `stopAllDropTimers()` and the `clearSoloDrop()` call inside `startStableSoloDrop351()` have never actually cancelled System2's `raf175164` loop — three prior commits (d5a470b, 948abe7, and the ebeef5e loopSolo reassignment) all assumed one of these worked. Before declaring a drop-engine fix done: (1) verify the *entire* loop body is suppressed, not just its terminal call, (2) instrument the actual DOM node with a MutationObserver, not just confirm "selectSolo fired once."

---

### Three Drop Engines (memorize this)

| System | Handle | Lines (PHASE2 / PHASE1) | cancel fn | selectSolo at |
|--------|--------|------------------------|-----------|---------------|
| 0 | `raf` | 756 / 756 | `safeClear()` via `window.stopAllDropTimers` | 809 / 809 |
| 2 | `raf175164` | 3887 IIFE / same | `clearSoloDrop()` — **IIFE-scoped only** | 3924 / 3936 |
| 3 | `soloStableRaf351` | 6948 / 6981 | `clearTimeout(soloStableRaf351)` inside SS351 | 6985 / 7017 |

---

### Browser Testing — Isolated World Warning

**CRITICAL:** Browser automation (Playwright, CDP, WebDriver evaluate()) runs in an **isolated world**.
`window.runFSRSValidation` and `window.runCozySmokeTests` appear "missing" there even though they exist.

**Solutions (in order of preference):**
1. `osascript` (macOS built-in, main-world access — requires Safari > Develop > Allow JavaScript from Apple Events):
   ```bash
   osascript -e 'tell application "Safari" to do JavaScript "JSON.stringify(window.runFSRSValidation())" in current tab of window 1'
   ```
2. Local HTTP server + manual console: `python3 -m http.server 8897` → open in browser → paste probe in DevTools console
3. Playwright `page.evaluate()` with `{ world: 'main' }` option (Playwright v1.39+)

**Always test LOCAL (127.0.0.1:8897), NOT GitHub Pages — CDN cache can lag 5–15 min behind push.**

---

### Hard Constraints (Never Violate)

- All edits inline in `index.html` — no new `<script>` blocks, no new files
- Do NOT add `cardPool` or `nextCard` wrappers
- Do NOT cross-push between PHASE1 and PHASE2 — separate repos, separate commits
- Bump `sw.js` CACHE version after any code change
- Apply fix to BOTH repos in same Codex session (PHASE2 primary, PHASE1 port)
- Prompts under 80 lines; no CDP infra; no safaridriver gate (requires user Safari pre-enable)
- Validate `runFSRSValidation()` 17/17 + `runCozySmokeTests()` 6/6 after every change
- `cd /path/to/repo && git add ...` in single command — shell has no directory persistence between calls
- PHASE2 public deploy: `git push origin main:public --force` — "public" is a branch on `origin`, NOT a remote named "public"
- selectSolo chain = 11 layers — do NOT add layer 12

---

### Completed This Session (2026-06-17)

| Task | Status | Commit |
|------|--------|--------|
| FQ-RENDER-1 System2 DOM class guard | ✅ browser-confirmed | 948abe7 |
| DOMAIN-AUTO-SELECT loopDomain wrapper | ✅ fixed | 0d12676 |
| FQ-ALGO-3 null next_due_at repair | ✅ applied (needs browser validate) | 0d12676 |
| FQ-ALGO-4 again requeue via pool rebuild | ✅ fixed (pool-rebuild replaces broken splice) | 22260dc |
| FQ-DATA-2 migration guard (legacyToProgress schema check) | ✅ fixed | 3104391 |
| PROMPT_7 domain audit | ✅ browser-confirmed (no code commit) — DOMAIN-WRITER-ORDER disproved; DOMAIN-AUTO-SELECT confirmed working; new differential DOMAIN-RECORD-ZERO added | — |
| PROMPT_8 iOS1 Capacitor scaffold | ✅ done (2026-06-18) — capacitor.config.json + package.json created, manifest.json icon-512.png (512x512) added, index.html/sw.js untouched, PHASE2 only | 918ef92 |
| PROMPT_9 revert FQ-ALGO-7 | ✅ done (2026-06-18), pushed + browser-confirmed correct 2026-06-19 via PROMPT_11 | PHASE2 c2807ac / PHASE1 b9168f5 |
| PROMPT_11 browser specifics audit | ✅ done (2026-06-19) — live Playwright against deployed URLs, both repos. Closed FQ-ALGO-7. Re-confirmed FQ-RENDER-5 live. Found new: DOMAIN-AGAIN-DUPE (card 4x-duplicated in pool after Domain Again), RENDER-STALE-REVEAL (low priority, not confirmed user-visible). | — (diagnostic, no commit) |
| PROMPT_10 fix FQ-RENDER-5 | ✅ done (2026-06-19) — ownership flag, validated 3 consecutive Solo cycles both repos before push, 0 warning mutations | PHASE2 fb09afa / PHASE1 2c8f4ce |
| PROMPT_12 DOMAIN-AGAIN-DUPE diagnostic | ✅ done (2026-06-19) — instrumented selectDomain chain + rating path live, found the real cause was PHASE1's stale additive `requeueAgainCard()`, not the chain itself. Fix applied separately by Claude (Codex session had ended). | PHASE1 2b84281 (PHASE2 needed no change) |
| PATCH-LANG-MEDICAL \b word boundaries | ✅ browser-confirmed | ca70006 |
| PATCH-LANG-WALKER DOM skip content nodes | ✅ source-confirmed (LIVE-NO-DECK prevented runtime test) | 0d12676 |
| DOMAIN-BIONIC (window.bionic\|\|bionic) in domain render | ✅ source-confirmed | f345dda |
| STATE-B deck restore (atlas sysmap → canonical deck key) | ✅ fixed | 98b5254 |

### Current Task: HUD-ICON-BLANK / OLD-SETTINGS-LEAK corrected after Codex's cross-repo browser probe — PHASE1 ≠ PHASE2, do not copy-paste the fix (2026-06-24)

**Codex independently browser-probed both repos (real Chrome, real uploaded deck, three breakpoints) before this commit got pushed, and caught a real inaccuracy in the entry below — re-verified directly by Claude before accepting, not just taken on Codex's word.** Claude's prior commit (`38b44f5`) said "both findings hold identically in PHASE1 at the matching line numbers" — **that's wrong.** PHASE2's icon/gear media gate is `@media (max-width:900px), (orientation:landscape) and (max-height:560px)` (an OR); PHASE1's equivalent is `@media (max-width:900px)` only — confirmed via direct `sed` read of both files, no landscape clause in PHASE1 at all. Practical effect: PHASE2 is only broken at desktop-normal/portrait (its OR-clause saves it at short-landscape); **PHASE1 stays broken at short-landscape too.** Lesson for future cross-repo claims: matching line numbers is not proof of matching behavior — diff the actual rule content, not just confirm both repos have a hit at roughly the same line. Full correction, plus two new subfindings, is in `OPEN_DIFFERENTIALS.md`'s `HUD-ICON-BLANK / OLD-SETTINGS-LEAK` row:
- **PHASE2-only:** HUD settings button renders partially offscreen on iPhone viewport (`rect x=-27, w=34`), browser-measured, root cause not yet pinned (candidate area: `.hudActions371` rules at `:12438/:12451/:12800/:12804`).
- **PHASE1-only:** an unconditional (not media-gated at all) `<style id="vHUD-polish-2">` block (`:14518-14521`) permanently hides PHASE1's in-HUD home/exit button — PHASE2 has no equivalent. Plausibly related to `COZY-HOME-DUPE-MOBILE` (not confirmed causally).

**Also reconfirmed, not contradicted:** the blank-icon + dual-settings bug itself is real in both repos at desktop-normal (1028x768) — browser-measured, not just static theory. REVEAL-TRIGGER-CHURN mutation counts re-measured much higher under a real-uploaded-deck/iPhone-viewport probe (PHASE2 493/620, PHASE1 457/589 — at-reveal/post-advance) than today's earlier desktop figure (89) — different test conditions, not a contradiction; logged both in `OPEN_DIFFERENTIALS.md`. Still no code changed — this is all analysis/doc correction. **Do not push `38b44f5` (or this follow-up commit) as final without re-reading the corrected `OPEN_DIFFERENTIALS.md` row first** — the fix recommendation for (a) the icon rule now explicitly warns against copying PHASE2's exact media condition onto PHASE1.

### Prior Task: HUD-ICON-BLANK / OLD-SETTINGS-LEAK found and source-verified, fix not yet applied (2026-06-24) — superseded by the correction above

User reviewed the prior retest writeup and gave explicit sign-off + a new finding. **Accepted, don't reopen without new evidence:** runner click interception, PHASE2 homeTopBtn CSS cascade, Space-advance stale-visible-reveal — all closed in `OPEN_DIFFERENTIALS.md`. **Confirmed correct priority call:** REVEAL-TRIGGER-CHURN stays top priority as a real bug, not cosmetic.

**New item, explicitly NOT to be bundled under the closed homeTopBtn task** (same HUD-shell breakpoint neighborhood, different root cause): `HUD-ICON-BLANK` (in-game icon buttons render blank — screenshot "Undo" text is the native title-attribute tooltip, not app text) + `OLD-SETTINGS-LEAK` (legacy `#gearBtn` floating circle can render alongside the newer in-HUD settings button). Claude source-verified every line number from the writeup before logging — all checked out or were corrected to the actual line:
- `.hudIconButton371::before` (PHASE2 `:12500`, PHASE1 `:12486`) is the only icon-paint rule in either file, and it's confined inside `@media (max-width:900px), (orientation:landscape) and (max-height:560px)` — no base/unconditional rule exists. That's the actual reason the icon is blank outside that one breakpoint, not just "doesn't apply at this breakpoint" as originally phrased.
- The `body.cozyGameShellActive371 #gearBtn` hide rule (PHASE2 `:12506-12508`, PHASE1 `:12492`) is gated inside the *same* media query — so on normal desktop-width portrait, `#gearBtn` never hides during gameplay, coexisting with the new HUD settings proxy (`:12989`).
- `window.undoReview` (PHASE2 `:13403`, PHASE1 `:13300`) is unrelated to either bug — confirmed not implicated.
Full writeup with both recommended fixes (icon rule needs to move/duplicate outside the media gate; settings ownership needs a product-intent pick between `#gearBtn` and the HUD proxy) is in `OPEN_DIFFERENTIALS.md`'s `HUD-ICON-BLANK / OLD-SETTINGS-LEAK` row. **Not yet fixed — analysis only.**

**Pages deploy status (2026-06-24):** PHASE2 switched its Pages source from `public` to `main` (the `public` branch split had no privacy/curation purpose — confirmed both repos are public on GitHub regardless, and `public`'s file tree was just a lagging mirror of `main`). Confirmed live at v49. The `git push origin main:public --force` step is retired for PHASE2 — don't include it in future deploy instructions. **PHASE1 is still stuck on `cozy-arcade-v65`** (local `main` is at `v85`) despite `.nojekyll` being present and one Pages-settings re-save attempt — a same-value re-save (`main`→`main`) likely didn't register as a change. Next step: toggle source to "None" (or another branch), save, wait, switch back to `main`, save — a genuine value change, not yet tried.

### Prior Task: PHASE2 browser retest at v49 (`main` 2ff95d2) confirms most prior fixes live; reveal ownership instrumentation is next (2026-06-24)

Codex ran a full local Chrome retest (real Upload → Solo → reveal → Space advance, iPhone-sized viewport, Domain mode) against current `main`/v49 — **explicitly not the older v46/`fee324a` handoff below; the auth block described there resolved the same evening (two more commits, `43f6a93`/`2ff95d2`, landed after that entry was written).**

**Confirmed fixed/live now:**
1. `#homeTopBtn` — computed `display:none`, `pointer-events:none`, rect 0x0 at startup and in-game. Re-confirms the 06-23 specificity fix independently.
2. Stale visible reveal after Space — fixed. Previous-card diagnosis does not stay visible after advance.
3. Duplicate board-trigger rendering — did not reproduce this round (one `.boardTrigger350`, one occurrence).
4. "Gate Completed"→"Learning Moment" title flip — did not reproduce, title stayed `GATE COMPLETED`.
5. `#runner` tap interception — fixed at both 390x844 and 375x667; `pointer-events:none`, choice centers unblocked.
6. Gates: `runFSRSValidation()` 17/17, `runCozySmokeTests()` 6/6, no page errors.

**Still present, ranked (see `OPEN_DIFFERENTIALS.md` for full detail):**
1. **REVEAL-TRIGGER-CHURN remains top priority** — 89 reveal-subtree mutations for one normal reveal even though content is now correct; reveal is still multi-writer, no single idempotent owner.
2. Hidden reveal content still mutates to the next card's trigger/board text after Space while the panel is hidden — not user-visible now, but proves reveal state isn't fully inert post-advance.
3. `window.current` is unreliable as a validation signal (observed null/absent while rendered DOM was correct) — future diagnostics should bind to rendered DOM + fixture IDs, or the card object at selection time, not `window.current`. Re-read the 06-22 "window.current disagrees with rendered question" finding through this lens — may have been an absent-probe artifact, not a real desync.
4. Domain orb normal click is unstable under Playwright automation (3s timeout, forced click works, reveal renders correctly) — possible touch-target/moving-target UX risk, not confirmed user-facing. See `OPEN_DIFFERENTIALS.md` `DOMAIN-TIMER`.
5. Console noise: only `/favicon.ico` 404, non-blocking.

**Next recommended work (not yet started):**
- Do NOT add another reveal wrapper, and do NOT re-fix homeTopBtn or runner pointer-events — both are browser-confirmed fixed at v49.
- Reveal ownership instrumentation: count and label every writer to `#soloRevealTitle`, `#soloRevealDx`, `#soloTrigger`, `.boardTrigger350`, `.oneThing350`, `#soloRevealRatings`. Goal: one idempotent reveal render owner, or at minimum suppress writes once reveal has settled. `CODEX_PROMPT_17` already queues this — updated with this exact element list, ready to send.
- Separately inspect Domain orb animation/clickability — if real user taps prove unreliable, consider reducing motion on pointerdown or expanding the stable hit zone. Not yet queued as its own prompt.

### Prior Task: deploy blocked on git auth (2026-06-23) — RESOLVED same evening, kept for history

**Git push is currently broken with an auth error** ("Invalid username or token" then "could not read Username... Device not configured") — confirmed by BOTH Claude's and Codex's independent push attempts (including Codex's "escalation" retry), all hitting the identical error. This rules out a sandbox-specific issue — the credential itself is genuinely invalid at the account level. User is refreshing it; do not keep retrying the push blindly in the meantime. Status as of right now:
- PHASE2 `main`: 2 commits ahead of `origin/main` (`915df4d` docs, `1dc3983` Codex's CSS specificity correction).
- PHASE2 `public` (what Pages actually serves): further behind, still at `1ac4cd4` — needs `git push origin main:public --force` once auth works.
- PHASE1 `main`: 2 commits ahead of `origin/main` (`1b8e9f4`, `8465ee9`) — push never succeeded once.
**Codex independently caught and corrected a real bug in Claude's first CSS fix** (the home-button kill-rule) — see `OPEN_DIFFERENTIALS.md` `HOME-BUTTON-CSS-CASCADE` for the full specificity explanation. Verified correct via direct specificity calculation before accepting it.
**First thing once auth is restored:** `git push origin main` (PHASE2) → `git push origin main:public --force` (PHASE2) → `git push origin main` (PHASE1) → verify both live via the SW-version curl check before doing anything else.

Two fixes landed today (committed, partially pushed — see above): (1) Codex's live test confirmed actual stale cross-card reveal content (not just churn) after Space-advance — `wrappedAdvance` now explicitly clears/hides the reveal panel (dx/trigger/board text + their idempotency dataset keys) right before the next card renders. Did NOT attempt Codex's other suggestion (reveal() capturing the answered-card identity explicitly) — that needs touching `selectSolo`'s own ~11-layer chain plus a new cross-script global, which is the exact "add another wrapper" anti-pattern Codex's feedback warned against; deferred to live instrumentation (`CODEX_PROMPT_17`). (2) Fixed the homeTopBtn CSS cascade bug Codex's screenshot cross-check confirmed live (inline `display:none`, computed `display:grid`, a real clickable box) — added one final, unambiguous `!important` kill-rule at the absolute end of the file rather than untangling the existing cascade conflict. Neither fix is live-browser-validated yet.

**RESOLVED (confirmed 2026-06-24):** auth was fixed, all three pushes completed (`43f6a93`/`2ff95d2` on top of these). PHASE2 `main`==`public` at v49, PHASE1 `main` at v85. Both fixes above are now live-browser-validated — see Current Task above for the full retest.

### Prior Task: REVEAL-TRIGGER-CHURN consolidation (2026-06-22) — not started, now top-ranked by live evidence

level_N legacy-field removal is complete across **4** confirmed-live sites now (not 3): `normalizeCardFields352`, `normalizeSourceCard`, `normalizeLimitlessCard`, and a 4th found by Codex's sparse-v3-fixture retest — the `v1751528-final-js` script block's `revealFor`/`promptFor`/`normalizeCard` trio (self-labeled "Authoritative mapping... LOCKED," overwrites `window.getPrompt`/`getRevealText`/`makeChoices`/`nextCard`). PHASE2 `ffdd76e`, PHASE1 `2cc1a35`. JXA-verified against board-trigger-only/empty/full fixtures. **Do not say "fully gone" without "for the fixtures tested" — Codex correctly challenged that framing once already; assume there could be a 5th site until proven otherwise by a fresh fixture sweep, not by re-asserting confidence.**

Codex's broader retest surfaced 3 more findings, very likely the same underlying multi-writer reveal problem rather than 3 new bugs: reveal DOM churn even higher on a normal card (302 mutations, unprompted "Gate Completed"→"Learning Moment" title change ~1s after reveal with no new input), stale mixed reveal content surviving a Space-advance to the next card, and `window.current` disagreeing with the rendered question in a multi-card sequence. None fixed tonight. This is the already-documented `REVEAL-TRIGGER-CHURN` from 2026-06-19 (`ensureBoard()` ~6746 and `renderRevealSections()` ~8896 both independently write to `.boardTrigger350`, different idempotency keys, no single owner) — deliberately deferred, same reasoning as the original 2026-06-19 deferral, now with a larger confirmed blast radius (title flips, stale cross-card content, current/render desync). Next session's natural starting point.

### Prior Task: none queued (2026-06-20) — sparse-card pollution fix applied, not yet live-validated

Codex retested the field-duplication finding through the ACTUAL Upload button + browser file chooser (not direct function injection) and proved Claude's prior "the JSON-upload path is clean" conclusion was incomplete: a sparse card (`diagnosis` only) came back with `educational_objective`/`quick_recall`/`explanation`/`level_4_full_card` all set to the diagnosis text. Claude's trace of `importObjectPhase3` → `normalizeCardIdentity` was correct as far as it went — that specific path genuinely never touches those fields — but a SEPARATE, older `wire()` (~line 8565) also owns the same 5 upload input IDs and unconditionally calls `normalizeDeck()` (~8445) → `normalizeLimitlessCard` (~8396) on every invocation, which DOES fall back to diagnosis. Depending on exact event-listener-ownership timing (same class of race as FQ-ALGO-9, now for `change` events), either path can be the one that actually processes a real upload.

**Fixed (PHASE2 `e5e6f6d` / PHASE1 `0ee3bf8`):** did not touch the listener race (needs live instrumentation, not a guess — same discipline as FQ-ALGO-9). Fixed the actual fabrication bug at its source: `normalizeLimitlessCard`'s `reveal` chain bottoms out at `c.diagnosis`; added `revealSoft` (same chain, minus the diagnosis fallback) and pointed `educational_objective`/`quick_recall`/`explanation`/`level_4_full`/`level_4_full_card` at it. `output`/`answer`/`diagnosis` untouched; existing `board_trigger`→`educational_objective` fallback preserved. JXA-verified, 10 scenarios. **Not live-browser-validated** — recommend Codex re-run the exact real-upload sparse-card test against this fix.

At least 6 more occurrences of this same anti-pattern exist elsewhere in the file (`normalizeCard` ×2, the `normalizeDeck(arr)` that calls one of them, `normalizeDeckFields352`, `canonicalizeCard`) — traced today and confirmed NOT live for JSON uploads (CSV-only, dead code, or export-only respectively). Left alone — see `SPARSE-CARD-DIAGNOSIS-POLLUTION` in OPEN_DIFFERENTIALS.md for the full site-by-site trace.

### Prior Task: Full Card completeness fix applied (2026-06-20)

Codex live-CDP-re-tested the field-duplication symptom and proposed a similarity-based suppression fix (hide a field if it's "high-overlap" with one shown above it). User explicitly redirected before any suppression logic was written: function like the current display, show the FULL uploaded JSON, no hiding/merging, no glitches. Re-grounded in `ULTIMATE_GOALS.md` (14-field `canonicalizeCard` allowlist treats `educational_objective`/`board_trigger`/`explanation`/`why_not_others` as distinct fields by design) and `GOAL.md` (E8 precedent: Full Card's correct pattern is a fixed whitelist, not heuristics) before designing anything.

Codex live-CDP-re-tested the field-duplication symptom and proposed a similarity-based suppression fix (hide a field if it's "high-overlap" with one shown above it). User explicitly redirected before any suppression logic was written: function like the current display, show the FULL uploaded JSON, no hiding/merging, no glitches. Re-grounded in `ULTIMATE_GOALS.md` (14-field `canonicalizeCard` allowlist treats `educational_objective`/`board_trigger`/`explanation`/`why_not_others` as distinct fields by design) and `GOAL.md` (E8 precedent: Full Card's correct pattern is a fixed whitelist, not heuristics) before designing anything.

Fixed (PHASE2 `a146e46` / PHASE1 `32a0f13`): `sourceFull()` was silently OR-collapsing `explanation`/`why_not_others` into one line, dropping `why_not_others` whenever `explanation` was present, even though both survive `normalizeSourceCard` as distinct values. Added `TEST` and `CLOZE SOURCE` lines (shown only when present). **Caught a self-introduced bug before applying:** a naive "show both whenever both are non-empty" rule would have manufactured a NEW duplicate-text glitch, because `why_not_others = first(c.why_not_others, explanation)` in `normalizeSourceCard` means it silently copies `explanation` when no separate value exists in source — added an `explSplit` check (only split into two lines when they're genuinely different text) to avoid that trap. Reveal screen untouched entirely. JXA-verified across 8 scenarios including the trap case. **Not live-browser-validated.**

**Cross-repo divergence found while porting, flagged not resolved:** PHASE1's `sourceFull()` already has `LEVEL 1`/`LEVEL 2` lines PHASE2 doesn't — likely `GOAL.md`'s E8 fix removed them from PHASE2 only and was never ported back. Kept them in PHASE1 as-is; did not delete (wasn't asked) or backport the removal to PHASE1 (wasn't asked either). Worth a future decision: for cards lacking explicit `level_1`/`level_2` source fields, `normalizeSourceCard`'s own fallback chain makes `LEVEL 1` equal `PRESENTATION` — i.e., PHASE1 may still be showing a duplicate today that PHASE2 already removed once.

**Separately found, explicitly NOT a code bug — do not "fix" this in index.html if it resurfaces:** `educational_objective`/`board_trigger`/`quick_recall` showing near-identical text is, for the decks checked, genuinely present in the source JSON — even the user's "FIXED" 1249-card reference database has this in 46-68% of cards. The app is correctly rendering bad/duplicate upstream data. This is a deck-generation/prompt-pipeline problem, not something `index.html` can fix. (`DECK-FIELD-DUPE-TEST106` in OPEN_DIFFERENTIALS.md.)

### Prior Task: FQ-ALGO-9 closed, live-validated (2026-06-20)

`CODEX_PROMPT_15` found the root cause and Claude's fix; Codex then re-ran the exact 5-cycle Space-at-reveal reproduction against the live fix in both repos: `postAdvanceNewCardSelectCount: 0` every cycle, FSRS 17/17, smoke 6/6. **FQ-ALGO-9 is closed for the reproduced symptom.**

**Explicitly not claiming clean architecture — three accepted, un-actioned risks, by choice, not oversight:**
1. The `Event.prototype.stopImmediatePropagation` shim (~line 5876) is unchanged. It still lets handlers run after reveal-dismiss keys when other code expects them blocked. Any future stale consumer added to this file could reproduce the same bug class.
2. The fix is a 50ms timing guard, not a structural one. Empirical margin is large (observed ~3-4ms actual gap) but it's not a proof against an arbitrarily-delayed async path.
3. Line ~5616's redundant `selectSolo` call on Enter/Space while reveal is open remains — confirmed harmless, still unnecessary churn.

**Continue-button flag question (from FQ-ALGO-8): mostly answered, not cleanly proven.** Codex's test (clear `pending`/`lastRated`, click literal Continue) returned 'good' in both repos, consistent with the flag working — but the forced setup also double-rated the card, so it's not a clean proof. Low priority, not pursuing further unless something else surfaces it.

Timeline today: PROMPT_9 (revert ALGO-7) → PROMPT_11 (live audit, closed ALGO-7, found DOMAIN-AGAIN-DUPE) → PROMPT_10 (fixed RENDER-5) → PROMPT_12 (diagnosed + Claude fixed DOMAIN-AGAIN-DUPE) → user caught FQ-DATA-2 was never really fixed, Claude fixed it for real → user reported "card glitch/flashing," Claude reviewed evidence directly, reopened D4-MUTATION, queued PROMPT_14 → user asked for deep-think analysis; Claude found `renderRevealSections()`'s missing fallback + 17-layer `reveal()` chain → Codex independently ran a pre-mortem with a live browser harness, confirmed 55-57 DOM mutations per reveal AND found a second, deeper bug: `educational_objective` getting contaminated to equal `diagnosis` → Claude verified directly, found the anti-pattern recurs in 8 places (not 1), applied one targeted fix at the display layer. PHASE2 `7bf4273` / PHASE1 `b91cf8f` → **Codex validated the live fix and found it real but partial:** the settled state is correct (~20ms), but the *first frame* still flashes the uncorrected content, because base `reveal()` (the earliest writer) runs before `renderRevealSections` (the last writer, where Claude's fix lives) and isn't corrected. Codex also flagged `runSRSValidation()` at 11/17 as a possible regression risk.

**Claude verified the SRS-validation flag and it was a false alarm — important, read before reacting to any future "X/17" report:** `runSRSValidation` is a different, obsolete function (added 2026-05-25, commit message "13 SM-2 assertions") testing the pre-FSRS algorithm, not the project's real gate. The real gate, `runFSRSValidation`, was extracted and *actually executed* via JXA against the current source: **17/17, empirically confirmed.** Marked ✗ DISPROVED in OPEN_DIFFERENTIALS. Do not treat `runSRSValidation` results as meaningful — it is unrelated to anything in this project's current scheduling algorithm.

**"Earliest writer" turned out to require finding the actual live one — applied 2026-06-19 ~6:00pm (PHASE2 `57a8f0e` / PHASE1 `b69fa21`):** tracing the chain found most of it is dead code. `reveal175158` (~1878) and the function at ~7125 are both hard-replacements with no call to any prior — meaning only the LAST one of those two (line ~7125, confirmed by checking nothing after it does the same thing) is actually live, feeding into 8913→9380→9718. Applied the contamination guard there. Full table now in "reveal() Chain" below. **Re-test needed before calling the first-frame flash fully closed** — same as the original fix, this needs a live check, not just static confidence.

**Not done, by design:** the other 7 contamination sites, the 900ms reveal interval, and full reveal-chain consolidation into one idempotent owner. These are real, documented (OPEN_DIFFERENTIALS.md), and deliberately deferred — see RECTIFIER_PLAN's running rule against bulk/unconsolidated patching.

PROMPT_13 (FQ-ALGO-8, wrong auto-select rated 'good') is still queued, unrelated to today's reveal fix — instruments the `advance()` chain + ≥6 competing keydown listeners + `rateOnce`/`alreadyRated`/`pendingFor`. PROMPT_14 is largely superseded by the reveal fix but left open pending re-test.

Remaining Priority 4 work:
- iOS1 finish: user runs `npx cap add ios` → `npx cap sync` → opens `ios/` in Xcode (not a Codex task)
- M2 Stripe: **PAUSED by user 2026-06-18** — not blocked, paused. Do not resume.
- DOMAIN-RECORD-ZERO (OPEN_DIFFERENTIALS.md): needs user intent decision before any fix is scoped — this is the one remaining stop-and-ask item

---

### P5 — FQ-ALGO-3: 18 null next_due_at (run after FQ-RENDER-1 confirmed)

**Known bugs in prior prompt version — all fixed below:**
- Used `window.phase3State?.progress` — window.phase3State not yet assigned at init; use local `phase3State`
- Used `p.interval` — wrong field; canonical is `p.interval_days`
- Called `savePhase3State()` unconditionally — must only save if rows changed

```
DATA REPAIR — 18 null next_due_at. PHASE2+PHASE1.
REPOS: PHASE2=/Users/rebekahbetar/Documents/GitHub/cozy-arcade-app-PHASE2
       PHASE1=/Users/rebekahbetar/Documents/GitHub/cozy-arcade-app
GATES: runFSRSValidation()17/17 runCozySmokeTests()6/6 first.

NOTE: null rows exist in user's persisted localStorage, not in clean seeded deck.
Run null count check AFTER real app loads (with actual stored progress):
  const nullDue=Object.entries(window.phase3State?.progress||{})
    .filter(([k,v])=>v.stage==='review'&&!v.next_due_at);
  console.log('null count:',nullDue.length);

ADD one-time auto-repair block in index.html, in Phase3 init, immediately AFTER the line
where phase3State is assigned from loadPhase3State() (local variable, not window):
  if(!window.__cozyNullDueRepaired){
    window.__cozyNullDueRepaired=true;
    let _repairCount=0;
    const _now=new Date().toISOString();
    Object.values(phase3State?.progress||{}).forEach(p=>{
      if(p.stage==='review'&&!p.next_due_at){
        p.next_due_at=_now;
        p.interval_days=p.interval_days||1;
        _repairCount++;
      }
    });
    if(_repairCount>0) try{savePhase3State();}catch(_){}
  }

Validate:
  → runFSRSValidation()17/17 + runCozySmokeTests()6/6
  → Reload page. Rerun null count → expect 0 (repair persisted)
  → Confirm _repairCount logged > 0 (if user's real data has the 18 rows)
Port to PHASE1. Bump PHASE2 sw v24→v25, PHASE1 sw v59→v60. Commit both repos separately.
```

---

### P6 — FQ-ALGO-4: Again Requeue (run after P5)

```
AGAIN REQUEUE — FQ-ALGO-4. PHASE2+PHASE1.
GATES: runFSRSValidation()17/17 runCozySmokeTests()6/6 first.

In rateCard() again branch, after FSRS update and session.buriedToday.delete(cardId):
  try{
    const pool=window.cozyPhase3Session?.pool;
    if(Array.isArray(pool)){
      const idx=pool.findIndex(c=>window.canonicalCardId(c)===cardId);
      if(idx>0){ const [card]=pool.splice(idx,1); pool.unshift(card); }
      else if(idx===-1&&window.cards){
        const card=window.cards.find(c=>window.canonicalCardId(c)===cardId);
        if(card) pool.unshift(card);
      }
    }
  }catch(_){}

Validate:
  delete window.phase3State.progress['requeue-test'];
  window.rateCard('requeue-test','again');
  const pool=window.cozyPhase3Session?.pool||[];
  console.log('first:',window.canonicalCardId(pool[0]),'expect: requeue-test');

Port to PHASE1. Bump PHASE2 sw v25→v26, PHASE1 sw v60→v61. Commit both repos separately.
```

---

### selectSolo Chain (11 layers — do not add layer 12)

| Layer | Line (PHASE2) | Purpose |
|-------|--------------|---------|
| 1 | ~408 | Base game selectSolo |
| 2 | ~860 | Knowledge Pulse / shadow queue advance |
| 3 | ~2431 | Rating-path rectifier |
| 4 | ~2741 | Bionic/stable-random wrapper |
| 5 | ~3958 | Shadow dungeon queue advance v2 |
| 6 | ~4071 | Unlisted wrapper |
| 7 | ~4227 | Unlisted wrapper |
| 8 | ~6893 | Energy scope wrapper |
| 9 | ~7752 | Energy tracker |
| 10 | ~13303 | Undo snapshot |
| 11 | ~14199 | 700ms debounce guard |

---

### selectDomain Chain (≥13 layers — found 2026-06-19, never documented before now — do NOT add layer 14)

**This existed the whole time and was never mapped.** Domain mode's wrapper chain is deeper than Solo's and had zero guardrails until DOMAIN-AGAIN-DUPE surfaced it. Treat with the same caution as selectSolo above.

| Layer | Line (PHASE2) | Note |
|-------|--------------|------|
| 1 | ~414 | Base game selectDomain |
| 2 | ~2441 | Unmapped wrapper |
| 3 | ~2747 | Unmapped wrapper |
| 4 | ~3199 | Adds 650ms select-lock (`domainSelectLockUntil`) |
| 5 | ~3442 | Unmapped wrapper |
| 6 | ~4085 | Unmapped wrapper |
| 7 | ~4358 | Gates on `canDomainSelect()` |
| 8 | ~4413 | Records `answeredCard17521`/`answeredMode17521` |
| 9 | ~5497 | Unmapped wrapper |
| 10 | ~6873 | Unmapped wrapper |
| 11 | ~7778 | Energy-tracker wrapper (`__energyTrack352`, mirrors selectSolo layer 8/9) |
| 12 | ~13391 | Unmapped wrapper |

Layers marked "Unmapped wrapper" have not been read in full — only located by grep. Before any fix to Domain's rating/select path, read each one; do not assume layer order matches call order without checking `oldSelectDomain`/`priorSelectDomain` chaining at each site.

**Related, not yet mapped:** `bindRatings()` is also redefined at least 3 times (~419, ~7060, ~7794) and calls BOTH `rate()` (wrapped to also call `requeueAgainCard`) AND `rateCard()` for a single rating click — two independent pool-touching paths per press. See DOMAIN-AGAIN-DUPE in OPEN_DIFFERENTIALS.md.

---

### advance() Chain (≥7 layers — found 2026-06-19, never documented before now)

Found while investigating FQ-ALGO-8 (wrong auto-select rated 'good'). Same "deep undocumented chain" pattern as selectDomain above.

| Layer | Line (PHASE2) | Note |
|-------|--------------|------|
| 1 | ~418 | Base: `nextCard()` + render/loop, no rating call |
| 2 | ~884 | Unmapped wrapper |
| 3 | ~2450 | Unmapped wrapper |
| 4 | ~2753 | Unmapped wrapper |
| 5 | ~12175 | Unmapped wrapper |
| 6 | ~14279 | Unmapped wrapper |
| 7 (final, live) | ~14422 (`wrappedAdvance`) | Part of `cozy-rating-path-rectifier-2026-06-03`. If reveal is open and no matching pending rating exists for the current card, **defaults to rating 'good'**, gated by a global single-value `alreadyRated`/`markRated(id)` check. |

**Also found:** at least 6 independent `keydown` listeners bound to Space/Enter/ArrowRight at the reveal screen (lines 432, 682, 1180, 1288-1289, 1695-1696, 3184), calling 3 different function names (`advance`, `continueReveal` — itself redefined 3x at 1278/3277/6809, `advanceReveal`). Only the line-3184 listener uses capture phase + `stopImmediatePropagation()`. See FQ-ALGO-8 in OPEN_DIFFERENTIALS.md — not yet confirmed which path actually misfires.

---

### reveal() Chain (17 reassignments — found 2026-06-19 — most are DEAD CODE, only the last 4 are live)

Found while fixing the reveal-panel first-frame flash. **Unlike every other chain documented above, most of this one is unreachable.** A chain of wrapper layers assumes each one calls the prior; this one has TWO unconditional hard-replacements partway through that discard everything before them.

| Reassignment | Line (PHASE2) | Live? |
|---|---|---|
| 1-9 | ~412, 521, 1157, 1265, 1612 | **DEAD** — all run before the first hard-replace below |
| 10 | ~1878 (`reveal175158`) | **DEAD** — hard replace, no call to any prior `reveal` |
| 11-13 | ~2483, 2761, 3032, 3182, 4059, 4429, 5479 | **DEAD** — run after `reveal175158` but before the second hard-replace below |
| 14 (true root) | ~7125 | **LIVE.** Hard replace, no prior call. Computes `dx`/`trigger` content directly from `current`. This is where the user's actual first-frame content comes from. Fixed 2026-06-19 (`57a8f0e`/`b69fa21`): added the same `educational_objective`-vs-`diagnosis` contamination guard already proven at `renderRevealSections`. |
| 15 | ~8913 | **LIVE.** `previousReveal.apply()` then `setTimeout(()=>renderRevealSections(which),0)` — this is where the OTHER fix (commit `7bf4273`) lives, correcting the *settled* state ~20ms later. |
| 16 | ~9380 | **LIVE.** Adds deferred `syncOneThing351`/`updateDrawer351` (80ms/120ms). |
| 17 | ~9718 | **LIVE.** Adds `addXP()`/sprite level update on correct answer. |

**Before touching this chain again:** confirm which assignment is currently the last hard-replace before assuming a fix anywhere in layers 1-13 will ever execute — re-grep for `window.reveal=function` (no `reveal=` before `function`, no `prior`/`previousReveal`/`_prior` call inside) every time, don't assume the structure is stable across sessions.
