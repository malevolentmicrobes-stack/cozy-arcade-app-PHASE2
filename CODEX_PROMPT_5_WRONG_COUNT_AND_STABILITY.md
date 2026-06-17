# CODEX PROMPT 5 — FQ-DATA-2 wrong_count (migration bloat) + FQ-ALGO-5 verify
**Paste block below into Codex. ~65 lines.**

**Pre-mortem findings (do not re-investigate):**
- FQ-ALGO-5 (stability/difficulty): rateCard() already computes newS/newD for all 4 ratings and passes them to setProgress(). NOT a bug. Verify wrapper order only.
- wrong_count bloat source: `legacyToProgress()` at line ~10873 adds `wrong_count: wrong + (rating==='again'?1:0)` on every coercion. If migration runs multiple times, wrong_count inflates. rateCard() also increments for both again+hard. Runtime double-click is NOT the primary cause.
- STATE-B (0 cards): FIXED in 98b5254 — do not re-investigate.

---

```
AUDIT + FIX: FQ-DATA-2 wrong_count migration bloat + FQ-ALGO-5 wrapper audit.
REPOS: PHASE2=/Users/rebekahbetar/Documents/GitHub/cozy-arcade-app-PHASE2
       PHASE1=/Users/rebekahbetar/Documents/GitHub/cozy-arcade-app
SW NOW: PHASE2 v29 (22260dc) | PHASE1 v64 (3a921fc)
RULES: No cardPool/nextCard wrappers. No <script> blocks. No cross-push.
       cd /repo && git add in ONE bash call. Under 80 lines.

──── STEP 0: DEPLOYMENT GATE ────
curl -s https://malevolentmicrobes-stack.github.io/cozy-arcade-app-PHASE2/sw.js | head -2
→ must contain: cozy-arcade-PHASE2-v29. STOP if not.
curl -s https://malevolentmicrobes-stack.github.io/cozy-arcade-app-PHASE2/ | grep -c 'atlas_sysmap_v1'
→ must return ≥1 (confirms STATE-B fix is live). STOP if 0.

──── STEP 1: AUDIT legacyToProgress migration guard ────
grep -n "legacyToProgress\|wrong_count.*wrong\|wrong.*rating.*again" index.html | head -20
Find legacyToProgress(). Check:
  A. Does it have a guard to run only ONCE (e.g., checking existing progress.schema_version)?
  B. Is it called on every page load, or only when legacy data is detected?
  C. Can it be called multiple times for the same card across reloads?
If called every load with no guard: adding `if(p.schema_version==='fsrs5') return p;`
before the coercion would prevent re-inflation. Report finding.

──── STEP 2: AUDIT rateCard wrong_count ────
grep -n "wrong_count" index.html | head -20
Confirm rateCard() increments wrong_count for: again? hard? both?
If BOTH again and hard increment wrong_count, that is intentional — hard cards
are wrong answers too. Do NOT remove hard from wrong_count.
Only flag if wrong_count is incremented MORE THAN ONCE per rateCard call.

──── STEP 3: AUDIT FQ-ALGO-5 rate() wrapper chain ────
grep -n "window\.rate\s*=\|window\.rateCard\s*=" index.html | head -20
List all wrapper reassignments in order. Note if any wrapper:
  - Calls the previous rate/rateCard without passing through rating
  - Bypasses the FSRS write in rateCard()
Do NOT patch — report findings to Claude if any wrapper breaks the chain.

──── STEP 4: FIX (only migration guard if STEP 1 confirms no guard) ────
If legacyToProgress runs every load with no schema guard:
  At start of legacyToProgress, add:
    if(p?.schema_version==='fsrs5' && p?.stability) return p;
  where p is the existing progress object being coerced.
  This skips re-coercion for cards already migrated to FSRS5.
Port to PHASE1. Bump PHASE2 sw v29→v30, PHASE1 v64→v65.
Commit PHASE2 then PHASE1 separately.
git push origin main && git push origin main:public --force

──── STEP 5: REPORT ────
SW after: PHASE2 v[N] ([commit]) | PHASE1 v[N] ([commit])
STEP 1 migration guard: [present / missing — coercion runs every load]
STEP 2 wrong_count paths: [list + intentional/bloat verdict]
STEP 3 wrapper chain: [intact / broken at wrapper X line Y]
STEP 4 fix: [applied at line X / "guard already present, no fix needed"]
New differentials: [list or "none"]
```
