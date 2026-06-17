# CODEX PROMPT 8 — iOS1 Capacitor Scaffold
**Paste block below into Codex. ~65 lines.**

**Context:** iOS1 milestone = basic Capacitor scaffold so the PWA can be wrapped as a native iOS app.
Minimal scope: capacitor.config.json, package.json (Capacitor deps only), and confirm existing
manifest.json + sw.js are Capacitor-compatible. Do NOT touch index.html. Do NOT add native code.

---

```
SCAFFOLD: iOS1 Capacitor for Cozy Arcade PHASE2.
REPO: PHASE2=/Users/rebekahbetar/Documents/GitHub/cozy-arcade-app-PHASE2
SW NOW: PHASE2 v29+ (post-P5/P6/P7)
RULES: No index.html changes. No new <script> blocks. No cardPool/nextCard wrappers.
       cd /repo && git add in ONE bash call. Under 80 lines.
       DO NOT cross-push to PHASE1 (Capacitor scaffold is PHASE2 only).

──── STEP 0: DEPLOYMENT GATE ────
curl -s https://malevolentmicrobes-stack.github.io/cozy-arcade-app-PHASE2/sw.js | head -2
→ must contain current version. STOP if stale.

──── STEP 1: AUDIT existing PWA assets ────
Check manifest.json exists and has required fields:
  cat /Users/rebekahbetar/Documents/GitHub/cozy-arcade-app-PHASE2/manifest.json
Verify: name, short_name, start_url, display, icons (512x512 required for Capacitor).
Check sw.js exists (already confirmed from prior prompts).
Check if package.json already exists:
  ls /Users/rebekahbetar/Documents/GitHub/cozy-arcade-app-PHASE2/package.json
Report: manifest status, sw status, package.json status.

──── STEP 2: CREATE capacitor.config.json ────
Create /Users/rebekahbetar/Documents/GitHub/cozy-arcade-app-PHASE2/capacitor.config.json:
{
  "appId": "com.cozyarcade.boardprep",
  "appName": "Cozy Arcade Board Prep",
  "webDir": ".",
  "bundledWebRuntime": false,
  "server": {
    "hostname": "malevolentmicrobes-stack.github.io",
    "androidScheme": "https"
  },
  "ios": {
    "scheme": "CozyArcade",
    "contentInset": "automatic"
  }
}

──── STEP 3: CREATE/UPDATE package.json ────
If package.json does not exist, create minimal:
{
  "name": "cozy-arcade-phase2",
  "version": "1.0.0",
  "description": "ABIM board prep PWA",
  "private": true,
  "dependencies": {
    "@capacitor/core": "^6.0.0",
    "@capacitor/ios": "^6.0.0",
    "@capacitor/cli": "^6.0.0"
  }
}
If package.json exists: add capacitor deps to existing dependencies only.
Do NOT run npm install — just write the file.

──── STEP 4: VALIDATE manifest.json ────
Confirm manifest.json has icons array with at least one 512x512 entry.
If missing 512x512 icon: report "MANIFEST-ICON-MISSING — need 512x512 PNG before npx cap add ios"
to Claude. Do NOT create placeholder icons.

──── STEP 5: COMMIT ────
Stage ONLY: capacitor.config.json, package.json (or package.json change), manifest.json (if updated).
Do NOT stage index.html, sw.js, or docs.
cd /path/PHASE2 && git add capacitor.config.json package.json manifest.json
git commit -m "iOS1: Capacitor scaffold (capacitor.config.json + package.json)"
git push origin main && git push origin main:public --force

──── STEP 6: REPORT ────
STEP 1 audit: [manifest fields / sw status / package.json was/was-not present]
STEP 2: [capacitor.config.json created / error]
STEP 3: [package.json created or updated / error]
STEP 4: [512x512 icon present / MANIFEST-ICON-MISSING]
Next step for user: npx cap add ios → npx cap sync → open ios/ in Xcode
```
