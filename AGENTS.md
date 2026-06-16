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

## Codex Agent Instructions — 2026-06-16 (UPDATED)

**IMPORTANT — read before any render work:**

Fixes 1–3 from the 2026-06-15 version of this file were applied in commit `dfb2ecc`
(clearSoloDrop guard in startStableSoloDrop351; bionic guard in installBionicQuestionPatch352).
Browser validation on 2026-06-16 confirmed BOTH still fail: SS#2 fires 10ms after SS#1;
soloQuestion gets 8 MutationObserver callbacks. The dfb2ecc fixes are insufficient.

**Current diagnosis (see CODEX_DAY_PLAN_2026-06-16.md for full analysis):**

FQ-RENDER-1: Three concurrent drop engines exist (System 0 line 756 `let raf`, System 2
line 3887 `raf175164`, System 3 line 6918 `soloStableRaf351`). clearSoloDrop() cancels
System 2 only. window.stopAllDropTimers (line 880) calls safeClear() which cancels System 0.
Whether System 0 or a loopSolo()-restarted System 2 is the live second firer is not yet
confirmed by browser stack trace — the stopAllDropTimers addition is defensive cancellation
of all engines, not an overclaim of root cause.

FQ-RENDER-3: System 0 renderSolo (line 838) and System 2 renderSolo (line 3943) use
closure-captured bionic() from their IIFE scope. installBionicQuestionPatch352 (called at
init, lines 8143/8291) sets window.bionic to bionicQuestionHTML352 AFTER those IIFEs run.
By the time the user clicks startSolo, window.bionic is the patched version. Fixing the
two renderSolo writes to use (window.bionic||bionic) ensures the first write is already
correct. The <b> guard in installBionicQuestionPatch352 remains as defense-in-depth.

FQ-RENDER-3 SCOPE LIMIT: This fix covers soloQuestion only. domainQuestion at line 410
still uses closure bionic — separate issue, separate fix later.

### Hard Constraints (Never Violate)

- All edits inline in `index.html` — no new `<script>` blocks, no new files
- Do NOT add `cardPool` or `nextCard` wrappers
- Do NOT cross-push between PHASE1 and PHASE2 — separate repos, separate commits
- Bump `sw.js` CACHE version after any code change
- Apply fix to BOTH repos in same Codex prompt (PHASE2 primary, PHASE1 port)
- Prompts under 80 lines; no CDP infra; no safaridriver (requires user pre-enable)
- Validate `runFSRSValidation()` 17/17 + `runCozySmokeTests()` 6/6 after every change

### Current Render Task (Codex P4 Path B)

3 edits, both repos. See CODEX_DAY_PLAN_2026-06-16.md for prompt.

Fix 1 — line ~6951 startStableSoloDrop351:
  BEFORE clearSoloDrop(), add: window.stopAllDropTimers&&window.stopAllDropTimers();

Fix 2 — line ~838 System0 renderSolo:
  bionic(getPrompt(current)) → (window.bionic||bionic)(getPrompt(current))

Fix 3 — line ~3943 System2 renderSolo:
  bionic(getPrompt(current)) → (window.bionic||bionic)(getPrompt(current))

### Validation (no safaridriver)

Node static (run in each repo dir):
  node -e "const s=require('fs').readFileSync('index.html','utf8');
    console.log('F1:',s.includes('stopAllDropTimers&&window.stopAllDropTimers'));
    console.log('F23:',(s.match(/\(window\.bionic\|\|bionic\)\(getPrompt/g)||[]).length);"
  Expect: F1:true F23:2

Browser console (manual, after starting Solo):
  // Confirm System 3 wrapper is active renderSolo:
  String(window.renderSolo).includes('startStableSoloDrop351')  // expect true

  // FQ-RENDER-1 timer probe (enable bionic first):
  localStorage.setItem('bionicOn_v1751523','1'); location.reload();
  // Then: let n=0,o=window.selectSolo;window.selectSolo=function(){n++;console.log('SS#'+n);return o.apply(this,arguments)};
  // Wait for timer. Expect: SS#1 once. FAIL if SS#2 within 500ms.

  // FQ-RENDER-3 first-write check:
  document.getElementById('soloQuestion').innerHTML.includes('<b>')  // expect true on first load

### selectSolo Chain (11 layers — do not add layer 12)

| Layer | Line | Purpose |
|---|---|---|
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

### selectSolo Chain Reference (11 layers — do not add a 12th)

| Layer | Line | Purpose |
|---|---|---|
| 1 | ~408 | Base game selectSolo |
| 2 | ~860 | Knowledge Pulse / shadow queue advance |
| 3 | ~2431 | Rating-path rectifier (`__cozyRatingPath20260603`) |
| 4 | ~2741 | Bionic/stable-random wrapper |
| 5 | ~3958 | Shadow dungeon queue advance v2 |
| 6 | ~4071 | Unlisted wrapper |
| 7 | ~4227 | Unlisted wrapper |
| 8 | ~6893 | Energy scope wrapper |
| 9 | ~7752 | Energy tracker (`__energyTrack352`) |
| 10 | ~13303 | Undo snapshot (`__rectifierUndo372`) |
| 11 | ~14199 | 700ms debounce guard |

Do NOT add layer 12. If a fix requires new selectSolo behavior, edit an existing layer in-place.
