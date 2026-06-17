# Open Differentials — Cozy Arcade Browser Test Log
**Format:** Never delete rows. Close items by changing status + adding commit. Append new rows as Codex finds them.
**Last updated:** 2026-06-17 | SW PHASE2 v24 | SW PHASE1 v59

---

## STATUS KEY
- ✅ CONFIRMED FIXED — browser-validated with commit
- ⚠️ MITIGATED — partially addressed, residual risk noted
- ❌ OPEN — confirmed by browser, not yet fixed
- 🔍 MONITORING — not confirmed in browser yet, worth watching
- ⬛ BY DESIGN — intentional behavior, not a bug
- ✗ DISPROVED — static analysis claim proven wrong by browser

---

## RENDER — Timer / Drop Engine

| ID | Status | First Found | Browser Evidence | Description | Fix |
|----|--------|------------|-----------------|-------------|-----|
| FQ-RENDER-1 | ✅ 948abe7 | 2026-06-15 audit | selectSolo fired twice, ~42ms apart; both CSS vars `--soloDropY` and `--soloDropY351` animated | System 2 (`raf175164`) and System 3 (`soloStableRaf351`) ran simultaneously; `selectSolo` fired twice per card; all 11 wrapper layers executed twice | System 2 tick expiry now checks `choiceRow.classList.contains('soloStableDrop351')` before calling selectSolo. Confirmed: SS#1 once from System3 line 6985 (PHASE2) / 7017 (PHASE1) |
| FQ-RENDER-1-A | ✗ DISPROVED | 2026-06-15 static | — | Static claim: System 0 `DROP_MS=7000` hardcoded was cause of premature auto-select | Browser showed selectSolo fired at ~13s with 13s setting → System 0 is NOT the live timer; System 3 (`soloStableRaf351`) is |
| FQ-RENDER-1-B | ✗ DISPROVED | 2026-06-16 attempt | Codex stack trace: SS#1 still from System2 | Attempt: `clearSoloDrop()` called from stable mode IIFE → believed to cancel System2 | `clearSoloDrop()` is IIFE-scoped in System2; call from stable mode throws ReferenceError silently |
| FQ-RENDER-1-C | ✗ DISPROVED | 2026-06-16 attempt | Codex stack trace: SS#1 still from System2 | Attempt: reassign `loopSolo` at end of SS351 → believed to prevent System2 restart | System2 renderSolo calls `startDrop()` DIRECTLY, not via loopSolo; reassignment had no effect |
| D2 | ✅ 948abe7 | 2026-06-16 design | — | 3 RAF handles (`raf`/`raf175164`/`soloStableRaf351`), only 2 cancel functions; `clearSoloDrop` only kills `raf175164` | Mitigated via DOM class guard; System0 raf handled separately by `stopAllDropTimers` |
| D3 | ⚠️ mitigated | 2026-06-16 design | — | Timer drift: System 0 `DROP_MS=7000` hardcoded; System 3 reads localStorage; both fire at 7s ±10ms causing near-simultaneous expiry | System 2 silenced by DOM guard; System 0 not the live timer; residual: if DOM guard fails, both fire again |
| FQ-RENDER-4 | 🔍 deferred | 2026-06-15 audit | Static analysis only | 700ms debounce at selectSolo layer 11 (outermost) — outer 10 wrappers bypassed it when dual-fire occurred; undo + rating outer layers fired twice per card | Resolved by FQ-RENDER-1 fix (single fire). Structural: debounce should be at outermost call site. Revisit if dual-fire recurs. |
| DOM-GUARD-FRAG | 🔍 monitoring | 2026-06-17 audit | Not reproduced, theoretical | DOM class guard depends on `choiceRow.soloStableDrop351` being present before System2 expires (~7s). If a future render clears `choiceRow.className` after stable start, System2 could fire again | No fix needed now. If recurs: expose System2 cancel handle on `window` or use explicit ownership flag |
| SILENT-CATCH | 🔍 monitoring | 2026-06-17 audit | Not reproduced | System2 guard wraps in `try/catch(e){}` — if `q`, `choiceRow`, or classList logic breaks, code silently returns without selecting (card stuck) | Long-term: replace with explicit ownership flag (`window.__cozyStableOwnsTimer=true`) instead of DOM class check |
| DOMAIN-TIMER | 🔍 monitoring | 2026-06-17 audit | Source-only, not browser-tested | Domain mode (`renderDomain`/`loopDomain`/`orbArena`) not exercised in any browser audit. DOM class guard only affects `choiceRow` which is solo-only. Lower risk. | Run one domain round before P5 to confirm no regression |

---

## RENDER — Bionic / Write Churn

| ID | Status | First Found | Browser Evidence | Description | Fix |
|----|--------|------------|-----------------|-------------|-----|
| FQ-RENDER-3 | ✅ 8a22e66 | 2026-06-15 audit | 3 innerHTML write events per card; last write = plain text stripping `<b>` | `installBionicQuestionPatch352` re-wrote `soloQuestion.innerHTML` as plain text AFTER bionic pass. Three writers: base renderSolo + System0 + System2. All used closure-captured `bionic()` instead of patched `window.bionic` | All soloQuestion writes now use `(window.bionic||bionic)()`. Added `<b>` guard to installBionicQuestionPatch352 in PHASE1. Final HTML confirmed `<b>` present. |
| D1 | ✅ 8a22e66 | 2026-06-16 design | — | Closure capture: System 0/2 `bionic` = old ref captured at IIFE definition; `window.bionic` updated later by `installBionicQuestionPatch352` | Fixed by `(window.bionic\|\|bionic)()` |
| D4-MUTATION | ⚠️ open | 2026-06-15 audit | 8 MutationObserver callbacks per card (not 8 distinct writes); write count still 3 in 2026-06-17 audit | MutationObserver inflation: 1 innerHTML swap → N callbacks (one per child node). 3 writes confirmed per card despite fixes. Final state correct but first-frame flicker possible | Not blocking. Future: count writes explicitly in validation, not just check final `<b>` |
| RENDER-STR-INVALID | ✗ DISPROVED | 2026-06-17 audit | `renderSoloStringHasStable:false` in browser | `String(window.renderSolo).includes('startStableSoloDrop351')` used as validation gate | **REMOVED from all validation gates.** Later wrappers hide inner stable reference. Always false at runtime. |
| FQ-RENDER-2 | ✅ line 3939 | 2026-06-15 audit | Body className observed going empty and returning on each card advance | `document.body.className=''` at System 2 render path (~line 3939) dropped layout classes | Save/restore `cozy*`/`na-*`/Drawer classes around the clear |
| DOMAIN-BIONIC | 🔍 open | 2026-06-15 audit | Static only | `domainQuestion` bionic writes (lines 410/445 PHASE2) still use closure `bionic()`. FQ-RENDER-3 scope was solo only. | Separate fix, not blocking. Do not mix with solo bionic fix. |

---

## ALGORITHM — FSRS Scheduling

| ID | Status | First Found | Browser Evidence | Description | Fix |
|----|--------|------------|-----------------|-------------|-----|
| FQ-ALGO-1 | ✅ 048d073 | 2026-06-15 | Again→10m ✅, Hard→1d ✅, Good→3d ✅, Easy→15d ✅ | Anonymous `setTimeout(rateCard(id,'good'), 8000)` in base selectSolo overwrote explicit Again at 8.2s | Timer stored as `window.__cozyAutoRateHandle20260603`; `cozy-explicit-rating-stabilizer-2026-06-11` wraps rate/rateCard to cancel on explicit rating |
| FQ-ALGO-2 | ⬛ BY DESIGN | 2026-06-15 | — | `repair_point=true` on wrong answers + E7G immediate-due pool → again cards appear in Review Deck before 10-min due time | Intentional. May need configuring if user finds it jarring. |
| FQ-ALGO-3 | ❌ OPEN | 2026-06-15 | `isDue()=true` always for these 18 cards; every session feels accelerated | 18 review-stage rows with `next_due_at=null`; always due | P5 — one-time repair block in Phase3 init |
| FQ-ALGO-4 | ❌ OPEN | 2026-06-15 | — | "Again" cards not requeued in current session; sessionPool built at session start; no splice | P6 — splice again card to front of pool in rateCard() again branch |
| FQ-ALGO-5 | 🔍 open | 2026-06-15 | — | Wrapper accumulation: rating-path-rectifier + explicit-stabilizer both reinstall `rate()` at overlapping timeouts; layered chains on rate() | Functionally idempotent; architectural risk only. Monitor. |
| FQ-ALGO-6 / K | ❌ OPEN | 2026-06-15 | — | `wrong_count` conflates lane accuracy + self-rating (explicit Again) — inflated wrong counts | Deferred |

---

## DATA — Integrity

| ID | Status | First Found | Browser Evidence | Description | Fix |
|----|--------|------------|-----------------|-------------|-----|
| FQ-POOL-1/2 | ✅ 83079db | 2026-06-15 | — | Pinned cards passed `isDue\|\|pinned` every pool pass with no `buriedToday` protection; Shadow Dungeon scopes didn't filter seen/buried | `isSessionBlockedCard()` added; filters applied to all pool scopes + Shadow Dungeon |
| FQ-DATA-1 | ✅ 83079db | 2026-06-15 | — | `repair_point=true` never cleared when answer was correct | `record(ok=true)` now clears `repair_point:false` |
| FQ-DATA-2 | ❌ OPEN | 2026-06-15 | — | `wrong_count` bloat from legacy counter (incremented by multiple paths) | Deferred |
| D8 | ❌ OPEN | 2026-06-16 | Source only | 18 null `next_due_at` rows invisible in source; `isDue()=true` always | Same as FQ-ALGO-3; P5 |

---

## ARCHITECTURE — Structural Risks

| ID | Status | First Found | Browser Evidence | Description | Fix |
|----|--------|------------|-----------------|-------------|-----|
| D9-CHAIN | 🔍 monitoring | 2026-06-16 | — | selectSolo chain = 11 layers; each has own cancel logic; not all cross-cancel; adding layer 12 could reintroduce dual-fire | Hard constraint: do NOT add layer 12 |
| D10 | ✅ 948abe7 | 2026-06-16 | — | Both drop engines called `record()` on same card when selectSolo fired twice → double FSRS write | Resolved by FQ-RENDER-1 single-fire fix |
| D6 | ❌ OPEN | 2026-06-16 | — | sessionPool stale: pool built at session start; again cards don't splice back in same session | FQ-ALGO-4 / P6 |
| D7 | ⚠️ mitigated | 2026-06-16 | — | `seenThisSession` Set grows all session; new session needed to reset | Mitigated by `isSessionBlockedCard()` (83079db) |
| INSTALL-BURIED | 🔍 monitoring | 2026-06-15 | Static only | `installBuriedPoolFilter` setInterval(120ms) still running after E7 guard flags — may re-wrap pool over time | Not confirmed in browser. Watch for pool behavior regressions. |
| LOOP-DOMAIN | 🔍 monitoring | 2026-06-15 | Static only | Knowledge Expansion (domain) mode has same dual-engine timer pattern as solo — untested in browser | Run domain smoke before P5 |
| APPLY-PROMPT | 🔍 monitoring | 2026-06-15 | Static only | `applyPromptText` always writes plain text first regardless of `bionicOn` state | Not yet browser-confirmed as user-visible |
| STATE-B | ❌ OPEN | 2026-06-15 | — | Deck restore after hard reload: "Cards 0 / Reviewed 93 / Pinned 41" — deck/progress desync | `cozy_arcade_limitless_cards_v1` parse + `normalizeDeckIdentities()` must succeed; deferred |

---

## NON-BLOCKING NOISE

| ID | Status | First Found | Description |
|----|--------|------------|-------------|
| 404-ASSET | 🔍 monitoring | 2026-06-17 audit | Both repos log one 404 resource error per load (app-shell asset or favicon). Non-blocking. Confirm it's not a missing icon that affects PWA install. |
| D5-SW | ✅ ongoing | 2026-06-16 | SW cache stale if CACHE string not bumped. Managed: bump on every code-change commit. |

---

## HOW TO USE THIS FILE

**Codex:** Before any fix, check this file for related open items. After browser validation, update the status column and add the commit hash. Do not re-investigate items marked ✗ DISPROVED — they were proven wrong by browser.

**Claude:** After each Codex session, append new differentials from the audit report and close confirmed items. Never delete rows.

**Add a new row:**
```
| NEW-ID | ❌ OPEN | YYYY-MM-DD | [browser evidence] | [description] | — |
```
