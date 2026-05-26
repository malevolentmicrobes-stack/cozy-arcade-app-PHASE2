# Cozy Arcade Board Prep Medicine — Project Status

**Date:** 2026-05-26 (updated this session)
**Repo:** `cozy-arcade-app- PHASE2` · `malevolentmicrobes-stack/cozy-arcade-app`
**Primary files:** `index.html` (~12,811 lines), `progress_beta.html`
**Git HEAD (main):** `20b166a` — fix(shadow-dungeon): gear double-fire + fallback guard
**Origin sync:** ✅ Local = origin/main · public branch = `c889df9` (live site updated)

### Two-Repo Deployment Map

| Remote | Repo | Branch | Purpose |
|--------|------|--------|---------|
| `origin` | `cozy-arcade-app` | `public` | Git history, SRS fixes, all code |
| `phase2` | `cozy-arcade-app-PHASE2` | `public` | **Live GitHub Pages site** (`malevolentmicrobes-stack.github.io/cozy-arcade-app-PHASE2/`) |

> ⚠️ **Always push Pages syncs to BOTH remotes:**
> ```
> git push origin public      # keeps cozy-arcade-app in sync
> git push phase2 public      # updates the live site
> ```
> The `public` branch was first pushed to `phase2` on 2026-05-26. GitHub Pages source must be set to `public` branch in `cozy-arcade-app-PHASE2` repo settings.

### Pending: GitHub Pages Source Config
Go to `https://github.com/malevolentmicrobes-stack/cozy-arcade-app-PHASE2/settings/pages` → set Branch = `public` → Save. Then verify:
```bash
curl -s "https://malevolentmicrobes-stack.github.io/cozy-arcade-app-PHASE2/" | grep -c "runSRSValidation"
# Expected: 2
```

---

## ⚡ Premortem Corrections (read before any terminal session)

| # | Correction |
|---|---|
| 1 | Phase 2 mobile shell is **already done** — commit `5b2154e` on origin/main, pulled via rebase. Do not treat as pending. |
| 2 | Git is **clean and synced** at `fb5f98f`. Nothing to push. |
| 3 | ~~**Active Task A** = Atlas/deck hydration persistence.~~ ✅ **DONE** — `fb5f98f` |
| 4 | ~~**Active Task B** = SRS Again timing.~~ ✅ **DONE** — commits `b8dc61b`–`5f243f5` |
| 5 | ~~Task B must NOT start until Task A is diagnosed and patched.~~ ✅ Both complete. |
| 6 | SRS math (`rate()`, `rateCard()`) is protected and verified 13/13. Do not rewrite. |
| 7 | Task B always starts with `window.runSRSValidation()` in browser — not a Codex grep task. |
| 8 | **Two-repo deploy:** push Pages syncs to BOTH `origin public` AND `phase2 public`. |

**Immediate next terminal session order:**
```
1. Confirm .gitignore exists (not just gitignore.txt) and private files are ignored
   → git check-ignore -v <exported JSON> <RTF continuity prompt>
2. graphify update .
3. Task A diagnosis only — no edits
4. Patch only if exact failing branch confirmed
5. Browser validate Atlas reload with deck_with_progress
6. Then Task B browser-first SRS Again timing
```

---

## Workflow Convention

> **One canonical status file.** Discard dated duplicates after merge.
> - `VALIDATION` docs → merge PASS/FAIL results here, then delete.
> - `CODEX_HANDOFF` docs → extract completed items here, then delete.
> - Rule: if Phase N is ✅, it lives only in **Completed Log**.

**Tool routing:**

| Task | Tool |
|------|------|
| grep, git diff, git status, graphify | Claude Code terminal |
| Read/patch index.html / progress_beta.html | Claude Code terminal |
| Validate patches, commit, push | Claude Code terminal |
| Pitch, product strategy, prompt design | Claude web / ChatGPT |
| Architecture discussion, status planning | Claude web (here) |

> **Rule:** Repo → Claude Code terminal. Judgment/planning/wording → Claude web.

---

## Graphify Status

**Active:** ✅ Graphify skill loaded and confirmed working in Claude Code.
- Graph built at commit `27a0a3e`. Current HEAD is `ab9d206` (2 commits ahead).
- Graph covers 17 communities, 236 nodes. Community 13 = highest-risk code cluster.
- **Action needed in terminal before next deep analysis:**
  ```
  graphify update .
  ```

---

## Completed Log

### This Session — Step-by-Step Build Plan + Premortem (2026-05-26)
**Status:** ✅ Committed and pushed.

**Key findings this session:**
- Node.js / npm NOT installed — required before Capacitor/Tauri can proceed
- XSS surface: card content already wrapped in `escHTML()` in most render paths — lower risk than initially estimated
- `previewInterval` easy formula fixed: `1.6→1.3` (`9552cb3`)
- Gear button double-fire fixed: `wireGearButtons()` had duplicate capture listener (`20b166a`)
- Shadow Dungeon fallback guard hardened with `!start.onclick` (`20b166a`)
- Full step-by-step plan written: P3 FSRS v5 → P3.5 due-count → LLC → Vercel → PWA → Security → Stripe → iOS Capacitor — each with pre-mortem difficulty flags

**Critical pre-ship sequence:**
```
Node.js install → FSRS v5 → due-count widget → LLC ($102) → Vercel deploy →
PWA + self-host fonts → Security audit → Stripe Payment Link →
iOS Capacitor (requires Mac + Apple Developer $99) → App Store submission
```

---

### This Session — Production Roadmap + Gear/Shadow Dungeon Fixes (2026-05-26)
**Status:** ✅ Committed and pushed.

| Commit | Fix |
|--------|-----|
| `20b166a` | fix(shadow-dungeon): remove gear double-fire (`wireGearButtons` had `.onclick` + capture `addEventListener` both calling `toggleSettingsGear351`) + harden Shadow Dungeon fallback guard with `!start.onclick` |
| `8c45291` | docs: session log — runner fix, SRS 17/17, public cleanup, gitignore |

**`previewInterval` easy formula fix** (`1.6→1.3` multiplier): pending commit + public sync.

**Production deployment roadmap added** to this status file: Tier 0 (SRS parity) → Tier 1 (web) → Tier 2 (monetization) → Tier 3 (Tauri desktop) → Tier 4 (iOS Capacitor) → Tier 5 (bug checklist) → Tier 6 (architecture notes).

**Gear bug confirmed:** `wireGearButtons()` was setting both `.onclick` and a capture `addEventListener` on `#gearBtn` — settings toggled open then immediately closed on every click. One-line fix: removed the duplicate `addEventListener`.

---

### This Session — Gameplay + Deployment + Gitignore (2026-05-26)
**Status:** ✅ Completed and pushed.

| Commit | Fix |
|--------|-----|
| `79b75e5` | `window.runSRSValidation()` — SM-2 assertion suite inside Phase 3 IIFE |
| `0d1d2f0` | docs: correct SM-2 easy interval spec (test 8 = 14, not 13) |
| `fb5f98f` | fix(atlas): quota guard + remove dead sessionStorage retry (Task A final) |
| `bba1559` | **Codex:** Fix mobile board prep layout — orbArena buried selector override |
| `b572c12` | fix(gameplay): runner starts at random lane (not correct answer); SRS display uses `results.length` (17/17); `Study Mode Selectable.png` tracked |
| `0a63c2e` | chore: `.gitignore` now excludes `graphify-out/`, `.agents/`, `.codex/`, `test-fixtures/`, `cozy-arcade-app-PHASE2/` |

**Runner bug root cause:** All 4 `makeChoices()` variants set `selected = choices.indexOf(dx)` — the correct answer's index. Replaced with `Math.floor(Math.random()*4)` across all instances.

**SRS validation:** `window.runSRSValidation()` → `✅ SRS: 17/17 passed`. `window.runCozySmokeTests()` → `6/6`. All assertions passing. Total was hardcoded as 13; corrected to `results.length`.

**Public branch cleanup:** `git add -A` accidentally swept graphify cache, private progress JSON, .agents, .codex, submodule ref into public. Removed with `63d8306`. Public now contains only: `index.html`, `progress_beta.html`, 5 PNGs, `README.md`, `example_deck_template.json`, `.gitignore`.

**Game end confirmed:** No card count cap. Game only ends when HP=0 (wrong answer drain). `index % pool.length` wraps indefinitely. Nuclear fallback prevents empty pool.

**Two-remote sync rule (updated):** Never use `git add -A` on public branch. Always use explicit file checkout:
```bash
git checkout main -- index.html progress_beta.html
```

---

### Phase 1.1 — Settings Drawer / Import-Export Label Cleanup
**Status:** ✅ Completed, tested, validated, pushed.
- `Upload JSON Deck` → `Upload Deck` · `Download JSON` → `Download Deck` · `Progress ↗` → `Progress`
- Settings drawer: primary `Import ▾`, secondary `Export ▾`
- Import routes through `importObjectPhase3` · Export: Deck / Progress / Full Deck + Progress
- **Note:** Old `cozy-arcade-app-PHASE2/index.html` subdirectory copy had "Full Import Settings" single button — this was an OLD file, not a regression. Main file is correct.

### Phase 1.2 — Progress Link Mutation Fix
**Status:** ✅ Completed, tested, validated, pushed. Commit `dafabbb` regression-checked.
- `#limitlessImportStatus` stable as Progress navigation only.
- `updateImportButtons()` does not write deck-count text, set onclick=null, or disable Progress.
- `ensureImportPanel()` preserves Progress node/listener.
- `wireUi()` wires Progress to `progress_beta.html` only.
- `progress_beta.html` reads `cozy_arcade_state_v3` defensively.
- Phase 1.1 labels preserved. Non-blocking: dead code in `ensureHomeImport()` ~line 8863 (defer).

### Phase 1.2.2 — Review Deck Filtering / New-Card Launch Scope
**Status:** ✅ Filtering logic validated. Random-new excludes reviewed/relearning cards.
- Fixed: `stateFor()`, `getCardIdentityKeys()`, `progressForCard()`, `isReviewedCard()`, `isNewCard()`
- Fixed: `isReviewCandidate()`, `normalizeMode()`, `basePlayableCards()`, `getStudyPool()`, `startSolo()`
- Fixed: `progress_beta.html` `storeHydratedPayload()`
- Identity aliases checked: `qid_unique`, `card_id`, `original_qid`, `legacy_id`

### Phase 2 — Mobile Top-Bar / Game Shell (cozy-mobile-shell-371)
**Status:** ✅ Already committed on origin/main as `5b2154e`. Pulled into local via rebase.
- `cozy-mobile-shell-371-css` — lines 12091–12466 (375 lines, pure CSS)
- `cozy-mobile-shell-371-js` — lines 12467–12692 (226 lines, IIFE)
- Breakpoints: ≤900px, ≤480px, landscape ≤560px, ≤760px
- Functions: `normalizeHud()`, `wrapGameMain()`, `patchDomainGeometry()`, `ensureSettingsButton()`
- **Phase 1.2 regression confirmed clear** — shell does not touch `#limitlessImportStatus`, import/export, or settings drawer.

### localStorage Contract (finalized)
- Main app owns import + persistence: `cozy_arcade_limitless_cards_v1` (deck) + `cozy_arcade_state_v3` + `cozy_arcade_progress_v1`
- Atlas (`progress_beta.html`) is a pure reader — auto-hydrates `deckMap` from shared keys.
- One "Export Full Backup" button → single JSON roundtrips everything.

---

## ✅ Completed: Task A — Atlas / Deck Hydration Fix

**Status:** ✅ All patches applied, committed `fb5f98f`, pushed to both remotes. Browser retest recommended.

| Commit | File | Fix |
|--------|------|-----|
| `318f1ce` | `progress_beta.html` | `writeAtlasDeckCache`: 4th `sys-map only` fallback attempt |
| `bae4f2e` | `index.html` | Progress button: flush compact sys-map before `window.open` |
| `4af9aed` | both | Payload serialization; confirmed sessionStorage retry is dead (tab-scoped) |
| `fb5f98f` | both | **Final polish:** quota guard (removeItem before setItem), removed dead sessionStorage line, surfaced quota errors via `console.warn('[Atlas] localStorage quota or write error:', qe)`, removed dead retry block from `progress_beta.html` init() |

---

## Completed: Task B — SRS Timing / Study Pool

**Status:** ✅ All fixes applied, committed, pushed. Browser retest recommended.

### Commits this session

| Commit | Fix |
|--------|-----|
| `b8dc61b` | `isDue()`: check `next_due_at` before `repair_point/relearning`; `getStudyPool` due mode removes redundant `\|\| stage=relearning`; smoke test corrected |
| `68d3b36` | `new_first`: repair_point bucket added between due and not-due; `review_deck` reads all non-suspended cards (including buried hard cards); session truncation prevention: `random_new` falls through on empty; nuclear fallback auto-calls `clearSessionBuried()` + reshuffles when pool exhausts |
| `6f2bcf3` | Strict SM-2 interval enforcement: `isDue()` treats unscheduled `stage:review` cards (null `next_due_at`) as overdue; `new_first` bucket 4 (reviewed-not-due) removed — easy/good/hard cards with future intervals hidden until due; bucket 3 restricted to `stage:'relearning'` only (10-min again cards) |
| `5f243f5` | **Codex:** Added `hasFutureDue()` guard; `review_deck` and `hard` modes now block future-dated repair/candidate cards; `reviewed_first` restricted to `isDue` only; nuclear fallback made schedule-aware so `clearSessionBuried()` never reintroduces future easy/good/hard cards — each scheduled mode rebuilds its own filtered pool after reset; `shuffleCards(basePlayableCards())` fallback now only fires for unscheduled modes. Validated against `cozy_arcade_progress_2026-05-26 copy.json`: future easy/good/hard = `[]` in all modes; again/relearning due cards included correctly; smoke 6/6. |

### Final `getStudyPool` — new_first bucket order (Anki-aligned)

```
1. New (unseen)
2. Due reviewed (past next_due_at — including legacy null-next_due_at review-stage cards)
3. Relearning in 10-min cooldown (stage=relearning, not yet due — rated again this session)
[removed] reviewed-but-not-due — easy/good/hard cards hidden until their due date
Nuclear fallback: clearSessionBuried() + reshuffle when all three exhaust
```

### `isDue()` — current implementation

```js
function isDue(progress) {
  if (!progress) return false;
  if (progress.next_due_at) {
    const t = Date.parse(progress.next_due_at);
    if (!isNaN(t)) return t <= Date.now();
  }
  if ((progress.stage === 'review' || progress.stage === 'relearning') && !progress.next_due_at) return true;
  return !!(progress.repair_point);
}
```

### Test data verification (`cozy_arcade_progress_2026-05-26 copy.json`)

| Card | Rating | Due | Session behavior |
|---|---|---|---|
| `7-7735`, `8-8088`, `9-7898` | easy | May 30 | Hidden ✓ |
| `10-8121`, `11-8398`, `12-8462` | good | June 6 | Hidden ✓ |
| `1-8118`, `2-13381` | hard | May 27 | Hidden until tomorrow ✓ |
| `3-7988`, `4-8508`, `5-8377` | again/relearning | 12:22 AM | Bucket 2 (past timer) or 3 (within 10 min) ✓ |
| `card-0001` to `card-0010` | legacy (no `next_due_at`) | — | Bucket 2 — treated as overdue ✓ |

### Browser validation
```
window.runCozySmokeTests()   → expect 6/6
window.runSRSValidation()    → expect 13/13
```
**Retest status:** ⏳ Pending browser confirmation (2026-05-26).

---

## Next Step — Full Validation Checklist

Import `cozy_arcade_progress_2026-05-26 copy.json` into the app (Settings → Import Progress), then run each check in order.

### 1. Smoke test (console)
```js
window.runCozySmokeTests()   // must be 6/6
```

### 2. Pool composition check (console — paste after import)
```js
// Should show only: new cards + due/legacy reviewed + relearning in cooldown
const pool = window.cozyPhase3.getStudyPool('new_first', 'solo');
const p = id => window.cozyPhase3 && phase3State.progress[id];
console.table(pool.slice(0,20).map(c => {
  const id = c.qid_unique || c.card_id || c.id;
  const pr = phase3State.progress[id] || {};
  return { id, last_rating: pr.last_rating, stage: pr.stage, next_due_at: pr.next_due_at, isDue: window.isDue ? window.isDue(pr) : '?' };
}));
```

**Expected — cards that must NOT appear in pool:**
- `7-7735`, `8-8088`, `9-7898` (easy, due May 30)
- `10-8121`, `11-8398`, `12-8462` (good, due June 6)
- `1-8118`, `2-13381` (hard, due May 27 — tomorrow)

**Expected — cards that MUST appear:**
- All `stage: "new"` cards → bucket 1
- `card-0001` through `card-0010` (legacy, `next_due_at: null`, `stage: "review"`) → bucket 2
- `3-7988`, `4-8508`, `5-8377` (relearning, past 12:22 AM timer) → bucket 2

### 3. General Study Mode — live gameplay
1. Set dropdown to **All cards** (→ `new_first`)
2. Click **Review deck** → start session
3. Rate a card **Easy** → it should NOT reappear in this session
4. Rate a card **Again** → it should reappear within ~10 cards (bucket 3 within 10-min window)
5. After 10+ minutes, the **Again** card should move to bucket 2 (due)
6. Session should never show "No cards available" — nuclear fallback reshuffles if all exhausted

### 4. Review Deck mode
1. Set dropdown to **Review deck: pinned / missed / hard**
2. `again`-rated cards (e.g. `3-7988`, `4-8508`, `5-8377`) — past their 10-min timer → should appear
3. `hard`-rated cards (`1-8118`, `2-13381`) — `next_due_at = May 27` → should NOT appear (future-due gate via `hasFutureDue()`)
4. `easy`/`good` cards — should never appear in this mode

### 5. Progress → Atlas handoff
1. Import deck + progress
2. Click **Progress** button
3. In Atlas console: `Object.keys(deckMap).length` → should be > 0
4. System nodes should render (not "No deck loaded")

---

## Phase 2 Mobile Shell — Risk Monitoring (no action needed now)

Post-rebase notes from Claude Code review. Watch during mobile testing:

| Risk | Area | Severity |
|------|------|----------|
| MutationObserver on `document.body` (subtree:true) fires on every DOM change; `run()` called continuously | `cozy-mobile-shell-371-js` | Medium — appendIf guard prevents actual churn, but callbacks still execute at high frequency |
| `wrapGameMain()` reparents `.promptBox` — any code using `#solo > .promptBox` (direct child selector) silently fails | `cozy-mobile-shell-371-js` | Medium — grep needed if display issues arise |
| `patchDomainGeometry()` monkey-patches `window.positionOrbs` — any later reassignment of `positionOrbs` silently loses geometry correction | `cozy-mobile-shell-371-js` | Medium — graceful fallback exists |
| `:has(.reveal:not(.hidden)) > .promptBox { display:none !important }` — race condition could blank game screen | `cozy-mobile-shell-371-css` | Low-medium |

---

## Premortem Analysis — 6 / 12 / 18 Months

> Finance-constrained. All costs are real numbers. This is a realistic pessimist's read so nothing blindsides you.

---

### Cost Structure — Every Service You Will Touch

| Service | Cost | Pay model | Notes |
|---------|------|-----------|-------|
| Vercel / Netlify | **$0** | Free tier | 100 GB/month bandwidth — sufficient for v1 |
| Custom domain | **$12/yr** | Annual | Namecheap or Porkbun |
| Apple Developer Program | **$99/yr** | Annual | Required for App Store. No Mac = blocked. |
| Google Play Console | **$25 once** | One-time | Only if Android |
| Stripe | **2.9% + $0.30** | Per transaction | No monthly fee. $20 sale = $19.12 net. |
| RevenueCat (iOS IAP) | **$0** until $2,500 MRR | % of revenue | Handles StoreKit receipt hell. Use it. |
| Tauri (desktop) | **$0** | Open source | Binary ~3 MB. No Electron bloat. |
| Capacitor (iOS) | **$0** | Open source | Wraps your HTML in WKWebView |
| Google AdSense | **$0 to join** | CPM ~$2–6 | Medical vertical pays better than average |
| Supabase | **$0** (free tier) | Per project | 500 MB DB, 50K MAU free. Paid = $25/month |
| LLC filing (Wyoming) | **$102 one-time** | State fee | Cheapest + no state income tax + privacy |
| Registered agent | **$0–$50/yr** | Annual | Wyoming lets you be your own if resident; else use Northwest ($39/yr) |
| EIN | **$0** | IRS.gov | Same-day online. Required before Stripe/bank. |
| Business bank (Mercury) | **$0** | Free | Best free business checking. Apply with EIN. |
| Wave accounting | **$0** | Free | Handles invoices, P&L, tax prep exports |
| Privacy policy + TOS | **$0** | Generator | TermsFeed free tier is sufficient for v1 |
| Windows EV code-signing cert | **$200–300/yr** | Annual | Skip for v1 — self-signed for beta is fine |
| Apple notarization | **$0** (included in $99) | — | Required to ship Mac .app via Gatekeeper |

**Hard floor to ship iOS + web + LLC: ~$213 first year** (`$99 Apple + $102 Wyoming + $12 domain`)

---

### Revenue Model — Realistic Projections

Market: ABIM internal medicine board prep. ~24,000 candidates/year. Adjacent: USMLE Step, IM shelf, hospitalist recertification.

Competing price points: Amboss $300+/yr · Boards & Beyond $149/yr · UWorld $380/yr · Anki free (but medical decks sell $20–50 each).

**Your price point: $19.99 one-time** (lowest barrier, avoids subscription fatigue, matches Anki deck market)

| Milestone | Est. MAU | Conversion | Monthly revenue | Running total |
|-----------|----------|------------|-----------------|---------------|
| 6 months | 150 | 3% | **~$90** | ~$300 |
| 12 months | 600 | 4% | **~$480** | ~$2,700 |
| 18 months | 1,800 | 5% | **~$1,800** | ~$9,000 |

> These are conservative. A single Reddit r/medicalschool or r/Step1 post that hits front page can spike 10x in a week. One attendings-at-large Twitter/X thread can too. The deck quality is the product.

**Ad revenue (web free tier):**
- 150 MAU × 5 sessions/week × 4 weeks × $4 CPM / 1000 = ~$12/month at 6 months
- Not meaningful until 5,000+ MAU. Treat ads as a nuisance tax on free users, not a revenue line.

---

### 6-Month Premortem (By Nov 2026)

**Target state:** Web app live on custom domain, LLC formed, iOS in review or shipped.

**What kills it:**
1. **FSRS v5 not shipped** → experienced Anki users dismiss the app immediately. SM-2 is visibly inferior for high-volume review decks. This is the #1 feature gate.
2. **iOS App Store rejection** → Medical category has strict review. If the app is rejected for "limited functionality" (common for single-purpose apps) you need to add: a study statistics screen, a settings screen, and a help/about screen. Plan for 2–3 rejection cycles (~2–3 weeks each).
3. **No discovery** → GitHub Pages URL shared with 10 classmates ≠ product launch. Need at least one of: Reddit post, Discord server (medstudents), Product Hunt launch, or a single X/Twitter post from a med influencer.
4. **Mac not available for iOS build** → Capacitor + Xcode requires macOS. If you don't own a Mac: MacStadium cloud Mac starts at $59/month (2 months = $118 to get through App Store submission). Or use a friend's Mac for the final Xcode build.
5. **Stripe purchase flag bypassable** → `localStorage.setItem('cozy_paid_v1','1')` is client-side. Any user who opens DevTools can unlock. For v1 with <1,000 users this is acceptable (honor system). By 12 months, gate via Supabase JWT instead.

**What works in your favor:**
- The app already works and is polished. Most indie medical apps don't get this far.
- JSON deck format is a real differentiator (Anki uses SQLite .apkg, which requires a desktop export step).
- You own the content pipeline (ABIM JSON schema already documented).

---

### 12-Month Premortem (By May 2027)

**Target state:** $300–600/month revenue, 500+ MAU, iOS stable, Mac/PC desktop shipped.

**What kills it:**
1. **App Store 30% cut** → IAP through App Store costs 30% (15% if under $1M/year under Small Business Program). $19.99 → Apple takes $6 → you get $13.99. Plan for this in pricing. Web Stripe is 2.9% → you get $19.40. Encourage web purchase over iOS purchase.
2. **Content staleness** → Medicine changes. If your ABIM deck has outdated guidelines (e.g., HTN targets, statin thresholds), users will post corrections publicly and it damages credibility. Schedule quarterly content review.
3. **Single-file architecture debt** → 13,000-line HTML files become painful to debug. Not blocking at 12 months but plan a structured build step (separate CSS/JS files compiled to single HTML) for v2.
4. **No multi-device sync** → Users want to study on phone AND laptop. Without Supabase sync, they have to manually export/import JSON. This is the #1 churn driver at 12 months. Supabase free tier handles this.
5. **LLC taxes** → First year with revenue means quarterly estimated taxes (IRS Form 1040-ES). Wyoming LLC taxed as sole proprietorship by default (pass-through). Set aside 25–30% of net revenue for federal + state taxes immediately.

**Survival threshold:** $300/month (~15 paid users/month) covers Apple Developer + domain + covers a few hours of your time. This is very achievable with 500 MAU.

---

### 18-Month Premortem (By Nov 2027)

**Target state:** $1,500–3,000/month, multi-device sync, v2 architecture underway, possibly a second deck (Step 2/3 or subspecialty).

**What kills it:**
1. **Burnout on solo maintenance** → At 1,500 MAU you will get support emails, bug reports, and deck correction requests weekly. This is a real job. Either hire a VA ($5–10/hour for support triage) or set expectations clearly (async support, no SLA).
2. **RevenueCat fee kicks in** → At $2,500 MRR, RevenueCat charges 1% of tracked revenue. At $3,000 MRR that's $30/month — trivial. Not a kill factor.
3. **Supabase paid tier** → At >50,000 MAU (well past 18 months at this pace) you'd hit the paid tier ($25/month). Not a concern until then.
4. **Competitor clones your JSON format** → Your deck schema is public. A competitor could clone the format and offer a similar app with better marketing. Differentiation: your SRS implementation quality, the ABIM-specific content depth, and the game mechanic (runner/dungeon) are hard to clone quickly.
5. **LLC → S-Corp election** → At $40K+ annual profit, electing S-Corp status (Form 2553) saves meaningful self-employment tax (15.3% SE tax on pass-through income). At $50K profit: S-Corp saves ~$5,000–7,000/year. File the election before March 15 of the tax year you want it to apply.

---

### LLC — Exact Timeline (Wyoming, DIY, ~$100 total)

| Day | Action | Cost | Where |
|-----|--------|------|-------|
| Day 1 | Choose LLC name (check `wyomingbusiness.gov` availability) | $0 | wyomingbusiness.gov |
| Day 1 | File Articles of Organization online | **$102** | wyomingbusiness.gov/LLC |
| Day 2 | Get EIN (Employer ID) | **$0** | irs.gov → "Apply for EIN Online" |
| Day 3 | Open Mercury business checking | **$0** | mercury.com — requires EIN |
| Day 5 | Write single-page Operating Agreement | **$0** | Template: northwestregisteredagent.com |
| Day 7 | Set up Stripe with business info | **$0** | stripe.com — needs EIN + bank |
| Day 30 | Connect Stripe to app (Payment Link, no backend needed) | $0 | |
| Month 3 | File FinCEN Beneficial Ownership Report (required 2024+) | **$0** | fincen.gov — 90 days from formation |
| Jan 2027 | File Wyoming Annual Report | **$60** | wyomingbusiness.gov |

**Why Wyoming over Delaware:**
- Wyoming: $102 formation, $60/year renewal, no state income tax, no public member disclosure, no minimum franchise tax
- Delaware: $90 formation + $50 registered agent + **$400 minimum franchise tax** → $540/year. Only worth it if you're raising VC (you're not yet).

**Bank: Mercury** (not a traditional bank)
- No minimum balance, no monthly fee
- ACH, wires, Stripe payouts all work
- Gives you a real routing/account number same week

**Tax obligations (Wyoming LLC, pass-through):**
- Federal: self-employment tax 15.3% on net profit + income tax bracket
- Wyoming: **$0 state income tax** ← this is why Wyoming
- IRS quarterly estimated payments: April 15, June 15, Sept 15, Jan 15
- Track all software costs, Apple Developer fee, domain, any equipment as business expenses

---

### Decision Tree — What to Build When

```
NOW (today – month 2):
  ├── P3 FSRS v5                    ← code, ~1 week
  ├── P3.5 due-count widget          ← code, ~2 hours
  ├── LLC formation (Wyoming)        ← $102, 1 day
  └── Vercel deploy + custom domain  ← $12, 2 hours

MONTH 2–4:
  ├── PWA service worker (offline)   ← code, ~1 day
  ├── Security: XSS + CSP            ← code, ~2 days
  ├── Stripe Payment Link            ← no code, 30 min
  └── iOS Capacitor build            ← code + Mac, ~1 week

MONTH 4–6:
  ├── App Store submission            ← 1–3 weeks review
  ├── Reddit / Discord launch post   ← $0 marketing
  └── Tauri Mac/PC build             ← code, ~3 days

MONTH 6–12:
  ├── Supabase sync (if churn from no sync)  ← code, ~1 week
  ├── Second deck (Step 2 or subspecialty)   ← content, ~2 weeks
  └── S-Corp election if profit >$40K/yr    ← $0, IRS Form 2553

SKIP UNTIL REVENUE PROVES IT:
  ├── Windows EV cert ($300)         ← skip until desktop demand proven
  ├── Android                        ← skip until iOS stable
  └── Subscription model             ← skip until v1 retention data
```

---

## Next Active Task

**P3 — FSRS v5 SRS Upgrade** (production blocker — highest value)

- Replace SM-2 `rateCard()` with FSRS v5 (~50 lines inline)
- New fields: `stability`, `difficulty`, `retrievability`
- No external library, backward-compatible with existing progress records
- Prerequisite: browser confirm `window.runSRSValidation()` → `✅ 17/17` on live site

**Also queued — previewInterval easy formula fix** (`20b166a` pending public sync):
- `previewInterval` easy was using multiplier `1.6` instead of `1.3` — showed wrong preview vs actual interval scheduled by `rateCard`. Fixed.

---

## Production Deployment Roadmap

> Objective: move from GitHub Pages test deployment → real iOS app + web product (ad-supported + one-time purchase).

### Deployment Targets

| Target | Status | Est. effort |
|--------|--------|-------------|
| Web (Vercel/Netlify, custom domain) | 🔜 Next after PWA | 1–2 days |
| Mac/PC desktop (Tauri wrapper) | 🔜 After web stable | 2–3 days |
| iOS (Capacitor + App Store) | 🔜 After desktop | 1–2 weeks |
| Android | Future | After iOS |

### Monetization Model (First Batch)

| Tier | What | Gate |
|------|------|------|
| Free web | 50 cards, no SRS history | Ad-supported (Google AdSense) |
| One-time web purchase | Full deck + full SRS | Stripe Checkout ($9.99–$29.99) |
| iOS one-time IAP | Full deck + offline | StoreKit 2 non-consumable ($14.99) |
| Future: subscription | Deck updates + sync | After v1 stable |

---

## Production Readiness — Tier Breakdown

### Tier 0 — SRS Parity (pre-deployment blocker)

Anki gap analysis vs current implementation:

| Feature | Anki | Current | Gap |
|---------|------|---------|-----|
| Algorithm | FSRS v5 | SM-2 | ❌ P3 needed |
| Again timing | configurable learning steps | 10 min hardcoded | ⚠️ acceptable for v1 |
| Hard/Good/Easy intervals | FSRS formula | SM-2 formula | ❌ P3 |
| Review count on home | ✅ deck browser | ❌ not shown | ⚠️ P3.5 |
| Workload forecast | ✅ (reviews/day chart) | ❌ | P4+ |
| Deck stats (retention %) | ✅ | ❌ | P4+ |
| `.apkg` import | ✅ | ❌ (JSON only) | Future |
| Interval modifier | ✅ user setting | ❌ | P3.5 |

**Gate:** P3 FSRS v5 must ship before App Store submission.

- [ ] **P3** — FSRS v5 drop-in for `rateCard()`. Fields: `stability`, `difficulty`, `retrievability`. Preserve all SM-2 fields for backward compatibility.
- [ ] **P3.5** — Due-count widget on home screen: "5 due · 12 new". Read from `getStudyPool('due')` + `getStudyPool('new_only')`.
- [ ] **previewInterval fix** — ✅ Fixed `1.6→1.3` multiplier (`20b166a`, pending public sync).

### Tier 1 — Web Production

- [ ] **P7** — PWA / Offline
  - `sw.js` service worker: cache `index.html`, `progress_beta.html`, fonts, images
  - `manifest.json`: standalone display, app icons, theme color
  - Self-host Orbitron + DM Sans (remove Google Fonts CDN dependency — hospital wifi blocks external CDN)
  - Add to home screen on iOS Safari

- [ ] **P8** — Security Audit
  - Card content XSS review: `innerHTML` used for card render — must sanitize `diagnosis`, `presentation`, `educational_objective` fields against injected `<script>` tags
  - Content Security Policy header: `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'`
  - localStorage scope: no PII stored, deck content stays single-origin — acceptable
  - Import validation: reject malformed JSON at boundary — currently `parseJsonLoose()` is lenient; add schema check on `importDeck()`
  - No hardcoded secrets: Supabase keys via localStorage user input only ✅ already enforced

- [ ] **P8.5** — Custom domain + HTTPS
  - Deploy to Vercel or Netlify (free tier adequate for v1)
  - Custom domain: `cozyarcade.app` or similar
  - Redirect GitHub Pages URL to new domain
  - HTTPS enforced

### Tier 2 — Monetization (Web)

- [ ] **M1** — Ad integration (web free tier)
  - Google AdSense `async` script — insert after `</body>` in a wrapper, never inside game shell
  - Ad units: home screen only (not during active study session)
  - Gate: hide ads for authenticated paid users via localStorage flag `cozy_paid_v1`

- [ ] **M2** — One-time Stripe Checkout
  - Stripe Checkout (hosted) — no backend required; use Stripe Payment Links
  - After payment: Stripe redirects back with `?purchased=1`; app sets `localStorage.setItem('cozy_paid_v1', '1')`
  - Full deck unlock gated on `cozy_paid_v1`
  - Note: localStorage purchase flag = client-side only. Acceptable for v1 (no real entitlement server). For v2 add Supabase auth.

- [ ] **M3** — Free vs paid card gating
  - Free: first 50 cards of any imported deck
  - Paid: full deck + SRS history export
  - Implementation: `basePlayableCards()` filter — if `!isPaid() && cards.length > 50` → slice to 50 with toast

### Tier 3 — Mac/PC Desktop (Tauri)

Tauri wraps the single-file HTML app in a native shell. Smaller than Electron (~3MB vs ~120MB).

- [ ] **D1** — Tauri project scaffold
  - `npm create tauri-app@latest` — select existing web assets
  - Point Tauri at local `index.html`
  - Build: `cargo tauri build` → `.app` (Mac), `.exe` (Windows)

- [ ] **D2** — File system integration
  - Tauri `@tauri-apps/api/fs` replaces browser file picker for deck/progress import
  - Auto-save progress to `~/Library/Application Support/CozyArcade/progress.json` (Mac)
  - Remove localStorage size constraints — write directly to disk

- [ ] **D3** — Auto-update
  - Tauri updater plugin — checks GitHub Releases for new `.app`
  - Notify user in-app, one-click install

- [ ] **D4** — Code signing
  - Mac: Apple Developer Program ($99/yr) — notarize with `codesign` + `xcrun notarytool`
  - Windows: EV certificate ($300/yr) or self-signed for beta
  - Required for: Mac Gatekeeper bypass, Windows SmartScreen

### Tier 4 — iOS (Capacitor)

- [ ] **iOS1** — Capacitor scaffold
  - `npm init @capacitor/app` — wrap `index.html`
  - iOS: `npx cap add ios` → opens in Xcode
  - Replace `localStorage` with `@capacitor/preferences` (maps to iOS Keychain-backed storage)

- [ ] **iOS2** — In-App Purchase (StoreKit 2)
  - Product: `com.cozyarcade.fullaccess` — non-consumable, one-time
  - RevenueCat SDK for cross-platform IAP management (iOS + future Android)
  - Price: $14.99 (matches medical flashcard app market)
  - Restore purchases button required by App Store guidelines

- [ ] **iOS3** — App Store compliance
  - Medical content disclaimer (required): "For educational purposes only. Not a substitute for clinical judgment."
  - Privacy policy URL (required): no PII collected → minimal policy
  - App category: Education → Medical
  - Age rating: 4+ (no objectionable content)
  - Required screenshots: iPhone 6.7", iPad 12.9"

- [ ] **iOS4** — App Store metadata
  - Title: "Cozy Arcade Board Prep"
  - Subtitle: "ABIM · Step · Medical SRS"
  - Keywords: board exam, ABIM, USMLE, flashcard, spaced repetition, medicine

### Tier 5 — Known Bugs / Pre-ship Checklist

| Bug | Status | Severity | Fix |
|-----|--------|----------|-----|
| `previewInterval` easy multiplier `1.6` vs `1.3` | ✅ Fixed `20b166a` | Low | Done |
| Gear button double-fire (`toggleSettingsGear351` twice) | ✅ Fixed `20b166a` | Medium | Done |
| Shadow Dungeon fallback `addEventListener` without `!onclick` guard | ✅ Fixed `20b166a` | Low | Done |
| Runner starts at correct answer lane | ✅ Fixed `b572c12` | High | Done |
| SRS display `17/13` hardcoded total | ✅ Fixed `b572c12` | Low | Done |
| Card content `innerHTML` render — XSS risk on untrusted decks | ❌ Open | Medium | P8 |
| `importDeck()` no schema validation | ❌ Open | Low | P8 |
| `previewInterval` hard: `Math.round(interval * 1.2) \|\| 1` — `\|\| 1` means 0-interval card shows "1d" not "10m" | ❌ Open | Low | P3.5 |

### Tier 6 — Architecture Notes for Production

**Single-file constraint:**
- All JS in one HTML file is fine for Tauri/Capacitor (they bundle the file locally)
- For web CDN hosting: consider splitting CSS/JS into separate files at build time using a simple `node build.js` script — reduces TTFB for repeat visitors
- Do NOT refactor inline — keep editing directly as per iron rules

**localStorage → file system migration path:**
- Web: keep localStorage (quota: ~5MB, sufficient for 1000-card decks)
- Desktop (Tauri): migrate to file system using `@tauri-apps/api/fs`
- iOS (Capacitor): migrate to `@capacitor/preferences`
- Keep `cozy_arcade_progress_v1` key name as canonical identifier across all platforms

**Backend (when needed — v2):**
- Supabase (Postgres + auth) — progress sync across devices
- Schema: `user_id`, `card_id`, `progress_json` — simple upsert
- No backend needed for v1

---

## Future Roadmap (post-mobile, pre-publishing)

### P3 — SRS Algorithm Upgrade (FSRS v5)
Replace SM-2 in `rateCard()` with FSRS v5 (~50 lines inline). New fields: `stability`, `difficulty`, `retrievability`. No external library. Do after SRS timing (Task B) is validated.

### P4 — End Screen Per-System Breakdown
`endRun()` currently shows flat score. Enhance to per-system breakdown. Add `let sessionStart = Date.now()` to `resetRun()`. Group cards seen this session by `sys`.

### P5 — CSV Import
Replace stub toast in `importDeck()` with real CSV parser. Headers → card fields. Use `parseJsonLoose()` equivalently for field cleanup.

### P6 — Energy Rank Display (optional backport)
Restore 6-tier rank system from `cozy-energy-theme-352`:
`Training Grade → Grade 4 → Grade 3 → Grade 2 → Grade 1 → Special Grade`
Energy per rating: easy=30, good=20, hard=10, again=4.

### P7 — PWA / Offline
- `sw.js` service worker caching `index.html`
- `manifest.json` with standalone display
- Self-hosted Orbitron + DM Sans (replace Google Fonts CDN)
- Required before: no hospital WiFi dependency

### P8 — Security Audit (before publishing)
- Review localStorage exposure (no PII, but deck content is sensitive)
- Content Security Policy headers if hosted
- No hardcoded secrets (Supabase keys must stay in localStorage user input only)

### P9 — Supabase Sync (optional)
- `syncWithSupabase()` called after `boot()` + `loadProgress()`
- POST progress to `user_progress` table, merge remote with local
- Keys via `localStorage.getItem('cozy_supabase_url')` — never hardcoded

### P10 — Capacitor iOS / Android
- Wrap single-file HTML in Capacitor project
- Haptic feedback via `@capacitor/haptics` on correct/wrong
- Local filesystem storage via `@capacitor/filesystem` for deck files
- Prerequisite: PWA must be clean first

### P11 — Payments / Publishing
- Gate: P7 (PWA), P8 (security) must be done
- Stripe or RevenueCat for subscription gating
- App Store / Play Store review compliance: medical content disclaimer required

---

## Graphify — When to Use Where

| Need | Use |
|------|-----|
| Architecture map of current code | Graphify in Claude Code terminal |
| Risk cluster analysis | Graphify in Claude Code terminal |
| Grep for function/variable | Claude Code terminal |
| "What does this function do?" | Claude Code terminal (read file) |
| Planning next patch | Claude web (here) — upload status + relevant docs |
| Prompt design for Codex/terminal | Claude web or ChatGPT |
| Slide text, pitch, user copy | Claude web or ChatGPT |

> Graphify = AST + graph traversal over the actual repo. Use it in terminal.
> Claude web = judgment, planning, status synthesis. Does not see your repo unless you upload files.


---

## Iron Rules — DO NOT TOUCH (from MASTER_CONTINUITY_PROMPT v3)

These functions/elements must never be rewritten or renamed. Any Codex output that modifies them must be rejected.

| Function / Element | Reason |
|---|---|
| `rate()` | Core SRS engine — any rewrite breaks all ratings |
| `rateCard()` | SM-2 math — verified 13/13 tests passing |
| `advance()` | Card progression — rewriting causes reveal glitches |
| `fullCard()` | Full Card toggle — wired via `fullInlineBtn` at runtime |
| `saveState()` | localStorage persistence — key is `soloStudyingState_v1757` |
| `updateKpis()` | Live KPI counters — called after every state change |
| `canonicalCardId()` | Progress key deduplication — `qid_unique → qid → hash` |
| `importDeck()` | Deck loading with merge support |
| One Thing textarea | `data-rate` keydown guard must remain; spacebar must not advance |
| `id="soloFull"` / `id="domainFull"` | Full Card — do not remove |
| `id="runner"` | Runner sprite — renaming breaks CSS animations |
| `id="choiceRow"` | Answer row — CSS drop animation targets this id |

**localStorage keys — NEVER change these:**
- `soloStudyingState_v1757` — base game state
- `cozy_arcade_progress_v1` — Phase 3 progress records
- `cozy_arcade_persona_v1` — persona selection
- `cozyQuestionSeconds351` — timer setting
- `cozy_arcade_limitless_cards_v1` — deck card data (Atlas contract)

**Architecture rules:**
1. Search the ENTIRE file for every target string — fix ALL instances (same function may appear in base HTML + 2–4 later injection blocks)
2. Do NOT add a new script block — edit existing blocks in-place
3. All changes must be additive or in-place only — never destructive
4. `node --check` on ALL script blocks must pass before any commit
5. If a visual change requires new JS, skip and report it — do not invent new logic

**Reject any Codex output containing these patterns:**

| Pattern | Problem |
|---|---|
| `card.presentation` used as answer | Mapping swap — presentation IS the question |
| `educational_objective` as question | Same swap — reject immediately |
| `rate()` or `rateCard()` rewritten | Breaks SM-2 math and 13/13 test suite |
| localStorage key changed | State permanently lost |
| `stage = 'learning'` in rateCard | Invalid stage — only `new` / `review` / `relearning` |
| `id="soloFull"` or `id="domainFull"` removed | Full Card breaks entirely |
| New script block added at bottom | Violates patch architecture |
| `abim-NNN` keys written anywhere | Progress key collision |

---

## SM-2 SRS Spec (verified 13/13 — do not re-implement)

| Rating | ease_factor Δ | interval formula | stage after | repair_point |
|--------|--------------|-----------------|-------------|-------------|
| again | −0.20 | 0 days (relearn in 10 min) | relearning | true |
| hard | −0.15 | max(1, round(i × 1.2)) | review | true |
| good | ±0 | i≤0 → 1d else max(1, round(i×e)) | review | false |
| easy | +0.15 | i≤0 → 4d else max(4, round(i×**e′**×1.3)) | review | false |
| pin | none | unchanged | unchanged | unchanged |

> **easy interval note:** ease is updated first (`e′ = min(4.0, e+0.15)`), then used in the interval formula.
> Example: interval=4, ease=2.5 → e′=2.65 → `max(4, round(4×2.65×1.3))` = **14**, not 13.
> Confirmed by `window.runSRSValidation()` test 8 (`79b75e5`).

ease_factor: floor 1.3 · default 2.5 · ceiling 4.0

**Browser validation (run in console, not in Codex):**
```
window.runSRSValidation()   → must output: ✅ SRS: 13/13 passed
window.runCozySmokeTests()  → must output: 20/20 passed
```

---

## Correction to Task B — SRS Validation Protocol

> ⚠️ Error in previous status draft: Task B was framed as a Claude Code terminal grep task.
> The master continuity prompt explicitly says: **"Run in browser only (not Codex) → console test suite."**

**Correct Task B protocol:**

**Step 1 — Browser first (always):**
```
1. Open index.html in Chrome/Firefox
2. Upload your deck
3. Open DevTools console
4. Run: window.runSRSValidation()   → expect 13/13
5. Run: window.runCozySmokeTests()  → expect 20/20
6. Play one card, rate Again
7. Check in console: Does card reappear immediately? Or in 10 minutes?
```

**Step 2 — Only if browser test fails, then use Claude Code terminal:**
```
Use Graphify first. Run: graphify update .

Read:
1. CLAUDE.md
2. COZY_ARCADE_PROJECT_STATUS_2026-05-25.md

SM-2 math is already verified 13/13. Do NOT re-verify rateCard() math.

Specific failing test: [paste exact console output / symptom here]

Inspect only the failing function — suspected: isDue()

Check ONLY:
- Does isDue() check next_due_at first?
- Or does repair_point/stage='relearning' override timing immediately?

Output:
- exact line/function where timing gate fails
- smallest safe patch (no edits unless approved)
- no other changes
```

**Step 3 — If patch confirmed safe:**
- Apply in-place edit only (no new script block)
- `node --check` all script blocks
- `git diff --check`
- Browser retest: `window.runSRSValidation()` → 13/13
- Commit: `Fix isDue: respect next_due_at for relearning cards`

---

## User-Facing Docs Status

| File | Status |
|------|--------|
| `HOW_TO_CREATE_YOUR_OWN_CARDS (1).md` | ✅ Canonical — v3 schema, full field reference, AI conversion + manual methods |
| `HOW_TO_CREATE_YOUR_OWN_CARDS(1).md` | Older/simpler version — superseded by v3 above |
| `5_23_MASTER_CONTINUITY_PROMPT.rtf` | ✅ Iron rules reference — last validated commit `053b14c`. Update Section 5 to reflect commits through `ab9d206`. |
