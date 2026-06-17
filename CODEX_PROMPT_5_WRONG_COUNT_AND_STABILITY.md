# CODEX PROMPT 5 — FQ-DATA-2 wrong_count + FQ-ALGO-5 FSRS write audit
**Paste block below into Codex. ~70 lines.**

---

```
AUDIT + FIX: FQ-DATA-2 wrong_count bloat + FQ-ALGO-5 FSRS stability/difficulty write.
REPOS: PHASE2=/Users/rebekahbetar/Documents/GitHub/cozy-arcade-app-PHASE2
       PHASE1=/Users/rebekahbetar/Documents/GitHub/cozy-arcade-app
SW NOW: PHASE2 v27 (f345dda) | PHASE1 v62 (3dcbe0a)
RULES: No cardPool/nextCard wrappers. No <script> blocks. No cross-push.
       cd /repo && git add in ONE bash call. Under 80 lines.

──── STEP 0: DEPLOYMENT GATE (curl, no browser eval) ────
curl -s https://malevolentmicrobes-stack.github.io/cozy-arcade-app-PHASE2/sw.js | head -2
→ must contain: cozy-arcade-PHASE2-v27. STOP if not.
curl -s https://malevolentmicrobes-stack.github.io/cozy-arcade-app-PHASE2/ | grep -c 'runFSRSValidation'
→ must return ≥1. STOP if 0.

──── STEP 1: AUDIT wrong_count write paths ────
In PHASE2/index.html:
  grep -n "wrong_count" index.html
List every line. Categorize each as READ or WRITE (increment/assign).
We expect at most ONE write per card appearance.
Identify any path where wrong_count increments twice for one wrong answer
(e.g., auto-select fires first, then explicit Again rating increments again).
If ≤1 write path: report "no bloat found" and skip FIX-A.

──── STEP 2: AUDIT FSRS stability/difficulty writes ────
In PHASE2/index.html, find rateCard() function:
  grep -n "function rateCard\|newS\|newD\|stability\|difficulty" index.html | head -40
For the good/hard/easy branches in rateCard():
  - Does each branch compute newS (new stability)?
  - Does each branch compute newD (new difficulty)?
  - Does setProgress() receive stability and difficulty fields?
Check setProgress() signature:
  grep -n "function setProgress\|setProgress(" index.html | head -10
Report: are stability/difficulty correctly written for all 4 ratings (again/hard/good/easy)?

──── STEP 3: FIX (only what's broken from STEP 1 + STEP 2) ────
FIX-A wrong_count (if double-increment confirmed):
  Add a per-session guard: before incrementing wrong_count, check
  window.__cozyLastWrongCardId !== cardId. If same card, skip increment.
  Set window.__cozyLastWrongCardId = cardId after incrementing.
  Reset window.__cozyLastWrongCardId = null on card advance (new card load).
  Minimal change only — if >6 lines, report candidate to Claude instead.

FIX-B FSRS fields (if stability/difficulty missing from good/hard/easy setProgress):
  In each missing branch, ensure setProgress receives: stability: newS, difficulty: newD.
  Do NOT change FSRS math — only ensure existing computed values are passed through.
  If rateCard is >200 lines and risky, report the exact missing lines to Claude instead.

──── STEP 4: VALIDATE + COMMIT ────
Source-check after any edits:
  grep -c 'runFSRSValidation' index.html  → expect ≥1 (confirms function still defined)
  grep -c 'runCozySmokeTests' index.html  → expect ≥1
Bump PHASE2 sw v27→v28, PHASE1 v62→v63.
Commit PHASE2 (cd PHASE2 && git add index.html sw.js), then PHASE1 separately.
git push origin main && git push origin main:public --force

──── STEP 5: REPORT ────
SW after: PHASE2 v[N] ([commit]) | PHASE1 v[N] ([commit])
STEP 1 wrong_count write sites: [list with line numbers and category]
STEP 2 FSRS stability/difficulty: [present/missing per rating branch]
STEP 3 fixes applied: [FIX-A at line X / FIX-B at lines Y,Z / deferred: reason]
New differentials not in OPEN_DIFFERENTIALS.md: [list or "none"]
```
