# CODEX PROMPT 7 — Domain Writer Order + Synthetic Domain Smoke Test
**Paste block below into Codex. ~70 lines.**

**Context:**
- DOMAIN-WRITER-ORDER: later domain writers could overwrite bionic fix after base render — unverified.
- LIVE-NO-DECK: domain timer auto-select couldn't be browser-tested (0 cards on public URL).
- Fix: add window.runDomainSmokeTest() that seeds a minimal domain state and validates timer path.
  This closes both gaps without needing an imported deck.

---

```
AUDIT + FIX: DOMAIN-WRITER-ORDER + synthetic domain smoke test.
REPOS: PHASE2=/Users/rebekahbetar/Documents/GitHub/cozy-arcade-app-PHASE2
       PHASE1=/Users/rebekahbetar/Documents/GitHub/cozy-arcade-app
SW NOW: PHASE2 v30 (3104391) | PHASE1 v65 (63c1407)
RULES: No cardPool/nextCard wrappers. No <script> blocks. No cross-push.
       cd /repo && git add in ONE bash call. Under 80 lines.

──── STEP 0: DEPLOYMENT GATE ────
curl -s https://malevolentmicrobes-stack.github.io/cozy-arcade-app-PHASE2/sw.js | head -2
→ must contain: cozy-arcade-PHASE2-v30. STOP if not.

──── STEP 1: AUDIT domain question write order ────
In PHASE2/index.html, find all writes to domainQuestion:
  grep -n "domainQuestion\|'domainQuestion'\|\"domainQuestion\"\|q('domainQuestion')\|\$('domainQuestion')" index.html
List every .innerHTML write. For each one note:
  A. Line number
  B. Does it use (window.bionic||bionic)() or raw bionic() or neither
  C. What triggers it (render path name if visible)
Order by line number. If any write AFTER the bionic-fixed writes (lines ~410, ~445) uses
plain text without bionic, that's DOMAIN-WRITER-ORDER confirmed.
Report the list.

──── STEP 2: ADD window.runDomainSmokeTest() ────
Find where window.runFSRSValidation is defined (line ~X):
  grep -n "window\.runFSRSValidation\s*=" index.html | head -3
Add window.runDomainSmokeTest IMMEDIATELY AFTER runFSRSValidation definition (same scope).

```javascript
window.runDomainSmokeTest = function() {
  const results = [];
  try {
    // Seed minimal orbData so loopDomain timer can run without a real deck
    if(!window.orbData||!window.orbData.length) {
      window.orbData=[{x:50,y:50,label:'TEST',idx:0}];
      window.cursor={x:50,y:50};
    }
    // Verify domain auto-select code path exists
    const ld = String(window.loopDomain||'');
    results.push(ld.includes('selectDomain')?'PASS domain-auto-select code present':'FAIL missing selectDomain in loopDomain');
    // Verify domain bionic fix
    results.push(ld.includes('window.bionic')||String(window.renderDomain||'').includes('window.bionic')?
      'PASS domain bionic fixed':'WARN domain bionic not confirmed in loopDomain string');
    // Verify PATCH-LANG-WALKER ancestor skip
    results.push(String(window.patchVisibleLanguage||'').includes('closest')?
      'PASS walker ancestor check present':'FAIL walker ancestor check missing');
  } catch(e) { results.push('ERROR '+e.message); }
  console.log('[DOMAIN-SMOKE]', results.join(' | '));
  return results;
};
```

──── STEP 3: IF DOMAIN-WRITER-ORDER confirmed → FIX ────
If a plain-text write to domainQuestion exists AFTER the bionic write:
  Apply (window.bionic||bionic)() to that write.
  Port same fix to PHASE1.
If no overwrite found: report "DOMAIN-WRITER-ORDER: not confirmed, safe" to Claude.

──── STEP 4: VALIDATE + COMMIT ────
curl -s <URL> | grep -c 'runDomainSmokeTest'  → expect ≥1 after deploy
Bump SW. Commit PHASE2 then PHASE1 separately.
git push origin main && git push origin main:public --force

──── STEP 5: REPORT ────
SW after: PHASE2 v[N] ([commit]) | PHASE1 v[N] ([commit])
STEP 1 domain write sites: [list in order, bionic status per write]
STEP 2 runDomainSmokeTest: [added at line X / error: reason]
STEP 3 writer-order fix: [applied at line / "not confirmed, safe"]
New differentials: [list or "none"]
```
