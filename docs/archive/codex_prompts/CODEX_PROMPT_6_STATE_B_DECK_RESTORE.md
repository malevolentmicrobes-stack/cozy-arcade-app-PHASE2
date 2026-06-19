# CODEX PROMPT 6 — STATE-B Deck Restore After Hard Reload
**Paste block below into Codex. ~65 lines.**

**Context:** After hard reload, app shows "Cards 0 / Reviewed 93 / Pinned 41".
Progress loads (93/41 from cozy_arcade_progress_v1) but card array is empty.
Root cause: cozy_arcade_limitless_cards_v1 parse or normalizeDeckIdentities() fails silently.

---

```
AUDIT + FIX: STATE-B deck restore after hard reload.
REPOS: PHASE2=/Users/rebekahbetar/Documents/GitHub/cozy-arcade-app-PHASE2
       PHASE1=/Users/rebekahbetar/Documents/GitHub/cozy-arcade-app
SW NOW: PHASE2 v27 (f345dda) | PHASE1 v62 (3dcbe0a)
RULES: No cardPool/nextCard wrappers. No <script> blocks. No cross-push.
       cd /repo && git add in ONE bash call. Under 80 lines.

──── STEP 0: DEPLOYMENT GATE ────
curl -s https://malevolentmicrobes-stack.github.io/cozy-arcade-app-PHASE2/sw.js | head -2
→ must contain: cozy-arcade-PHASE2-v27. STOP if not.

──── STEP 1: AUDIT deck load path ────
Find where cozy_arcade_limitless_cards_v1 is read from localStorage:
  grep -n "cozy_arcade_limitless_cards_v1\|limitless_cards" index.html | head -20
Find normalizeDeckIdentities():
  grep -n "function normalizeDeckIdentities\|normalizeDeckIdentities" index.html | head -10
Find where cards array is populated from stored data on initial load:
  grep -n "window\.cards\s*=\|let cards\s*=\|var cards\s*=" index.html | head -10

Read the deck-load section (20 lines around the cozy_arcade_limitless_cards_v1 read).
Identify:
  A. Is JSON.parse wrapped in try/catch? If it throws, does it silently set cards=[]?
  B. Does normalizeDeckIdentities() return empty array on any parse error?
  C. Is the localStorage key EXACTLY 'cozy_arcade_limitless_cards_v1' everywhere?
     (frozen key — do NOT rename)
  D. Is there a version migration that could wipe cards on first load of new SW?

──── STEP 2: FIX (minimal, targeted) ────
Based on audit: patch the specific failure point only.
Do NOT refactor the deck loading flow.
Common patterns to fix:
  - Silent JSON.parse failure: add console.warn on catch so user can diagnose
  - Empty-array fallback missing: if parsed result is null/undefined, use []
    BUT log a warning: console.warn('[DECK] limitless_cards loaded empty')
  - Version migration wipe: add guard to skip wipe if progress exists
If the root cause requires >10 lines to fix, report the finding to Claude instead.

──── STEP 3: VALIDATE + COMMIT ────
Source verification after any edits:
  grep -c 'cozy_arcade_limitless_cards_v1' index.html  → expect count unchanged (key not renamed)
  grep -c 'runFSRSValidation' index.html               → expect ≥1
Bump PHASE2 sw v27→v28 (or next after P5), PHASE1 v62→v63 (or next).
Commit PHASE2, then PHASE1 separately.
git push origin main && git push origin main:public --force

──── STEP 4: REPORT ────
SW after: PHASE2 v[N] ([commit]) | PHASE1 v[N] ([commit])
STEP 1 findings:
  A. JSON.parse try/catch: [present/missing]
  B. normalizeDeckIdentities empty return: [can/cannot happen]
  C. localStorage key consistent: [yes/no + lines]
  D. SW migration wipe risk: [yes/no + reason]
STEP 2 fix applied: [description + line / deferred: reason]
New differentials not in OPEN_DIFFERENTIALS.md: [list or "none"]
```
