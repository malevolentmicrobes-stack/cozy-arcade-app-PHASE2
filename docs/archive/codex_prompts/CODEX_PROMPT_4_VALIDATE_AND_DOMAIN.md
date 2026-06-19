# CODEX PROMPT 4 — Validate v26 + Fix DOMAIN-BIONIC
**Paste the block below directly into Codex. ~65 lines. Do not add to it.**

**Root cause from prior run:** Live GitHub Pages was serving v25 (stale `public` branch).
Now fixed: `public` branch updated via `git push origin main:public --force` (5debeb8).
`window.run*` globals are NOT callable from Codex browser eval (isolated world) — use curl for gates.

---

```
VALIDATE v26 + FIX DOMAIN-BIONIC. PHASE2+PHASE1.
REPOS: PHASE2=/Users/rebekahbetar/Documents/GitHub/cozy-arcade-app-PHASE2
       PHASE1=/Users/rebekahbetar/Documents/GitHub/cozy-arcade-app
URL: https://malevolentmicrobes-stack.github.io/cozy-arcade-app-PHASE2/
SW NOW: PHASE2 v26 (5debeb8) | PHASE1 v61 (65ddcdf)
RULES: No cardPool/nextCard wrappers. No <script> blocks. No cross-push.
       cd /repo && git add in ONE bash call. Under 80 lines.

──── STEP 0: DEPLOYMENT GATE (curl — not browser JS eval) ────
NOTE: window.run* cannot be called from Codex browser tool (isolated world).
Verify deployment and fix presence via curl. STOP if any check fails.

curl -s https://malevolentmicrobes-stack.github.io/cozy-arcade-app-PHASE2/sw.js | head -2
  → must contain: cozy-arcade-PHASE2-v26

export U=https://malevolentmicrobes-stack.github.io/cozy-arcade-app-PHASE2/
curl -s "$U" | grep -c '__cozyNullDueRepaired'     # FQ-ALGO-3 → expect ≥1
curl -s "$U" | grep -c 'session\.pool\.unshift'    # FQ-ALGO-4 → expect ≥1
curl -s "$U" | grep -c 'selectDomain.*_n'           # DOMAIN-AUTO-SELECT → expect ≥1
curl -s "$U" | grep -c 'parentElement.*closest'     # PATCH-LANG-WALKER → expect ≥1
curl -s "$U" | grep -c 'runFSRSValidation'          # gate fn defined → expect ≥1
curl -s "$U" | grep -c 'runCozySmokeTests'          # gate fn defined → expect ≥1

──── STEP 1: DIFFERENTIAL LIST (list only — do NOT fix) ────
Review commits 0d12676 (null-due repair, again-requeue, domain-auto-select,
walker DOM skip) and ca70006 (\b word boundaries). List top 5 probable
browser-runtime-only failures, ranked HIGH/MED/LOW:
  Format: [PROB:HIGH] ID — symptom — why grep misses it

──── STEP 2: DOMAIN-AUTO-SELECT visual test ────
Open URL in browser (hard reload Cmd+Shift+R first).
Navigate to Knowledge Expansion (domain/orb mode).
IF orbs appear: let timer count to 0% without clicking.
  PASS: domain auto-selects, screen advances.
  FAIL: timer hits 0%, nothing happens.
IF "Import a deck first" or 0 orbs: note it and skip to STEP 3.
(No deck required for the timer-expiry code path to work if orbs exist.)

──── STEP 3: FIX DOMAIN-BIONIC (only after STEP 0 passes) ────
PROBLEM: domainQuestion bionic writes (~lines 410, 445 PHASE2) use closure
bionic() not window.bionic — same root cause as FQ-RENDER-3 (solo, fixed).
installBionicQuestionPatch352 sets window.bionic later; closure has old ref.

FIX (2 occurrences in domain render path only — NOT solo, already fixed):
  FIND:    bionic(q.presentation)   [lines ~410 and ~445, domain render only]
  REPLACE: (window.bionic||bionic)(q.presentation)
Verify local FSRS/smoke from source: grep 'runFSRSValidation' index.html | wc -l → expect ≥1
Port same 2-line change to PHASE1. Bump PHASE2 sw.js v26→v27. Bump PHASE1 v61→v62.
Commit PHASE2: cd /path/PHASE2 && git add index.html sw.js && git commit
Commit PHASE1: cd /path/PHASE1 && git add index.html sw.js && git commit
Then: cd /path/PHASE2 && git push origin main && git push origin main:public --force

──── STEP 4: REPORT FORMAT (send verbatim to Claude) ────
SW after: PHASE2 v[N] ([commit]) | PHASE1 v[N] ([commit])
STEP 0 curl results: [each check: value returned]
STEP 1 differentials: [list]
STEP 2 domain timer: [PASS / FAIL / SKIPPED-no-deck + reason]
STEP 3 domain-bionic: [applied at lines X,Y / skipped: reason]
New differentials not in OPEN_DIFFERENTIALS.md: [list or "none"]
```

---

## After Codex returns
Claude will:
1. Update OPEN_DIFFERENTIALS.md with STEP 1 differentials + STEP 2/3 results
2. Update AGENTS.md SW versions + mark DOMAIN-BIONIC ✅
3. Push PHASE2 public branch: `git push origin main:public --force`
