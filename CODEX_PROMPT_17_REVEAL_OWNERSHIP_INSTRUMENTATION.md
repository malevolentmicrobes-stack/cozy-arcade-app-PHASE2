# CODEX_PROMPT_17 — Reveal Ownership Instrumentation (PHASE2, then PHASE1)

**Diagnostic only. Do not fix anything until the report comes back. Fix only the
first confirmed writer conflict — do not patch all reveal functions blindly.**

**Update 2026-06-24 (later same day) — user reconfirmed visible card flashing
AFTER today's unrelated HUD fix (`b571eb3`/`80cf287`, icon-paint + gearBtn-hide
only). That fix is confirmed NOT the cause — this is the same
REVEAL-TRIGGER-CHURN/D4-MUTATION family, still open. Per the user's direct
ask, the observer below now also watches `#soloQuestion`/`#choiceRow`/
`.promptBox` (the live question card, not just the reveal panel) since the
flashing symptom was never confirmed to be reveal-panel-only, and now logs
target selector + old/new text + call stack per mutation, not just a count.
Goal unchanged: find the first writer that mutates content after paint, then
consolidate to one idempotent owner or suppress post-settle writes. Do not
add another wrapper layer to do this.**

**Update 2026-06-24 (full retest against `main` 2ff95d2/v49, supersedes the older
v46/`fee324a` framing below):** duplicate board-trigger rendering and the "Gate
Completed"→"Learning Moment" title flip did NOT reproduce on a normal card this
round, and stale-visible-dx-after-Space is now confirmed fixed. Don't treat
"didn't reproduce" as "fixed for good" — re-check under the original 06-22
repro conditions (board-trigger-only card, longer dwell) during this
instrumentation pass, not just a fresh normal-card flow. Mutation count
re-measured at **89** for one normal reveal — still high, still the reason this
prompt exists. New, sharper finding to fold in: hidden reveal content still
mutates to the next card's trigger/board text after Space while the panel is
hidden — log writes even while `#soloReveal` is hidden, don't assume "hidden"
means "inert." Also: `window.current` was observed null/absent (not just
disagreeing) while rendered DOM was correct — log whether `window.current` is
even defined at each `[INSTR]` point, don't only compare its value.

## Static groundwork already done (verify, don't re-derive)

Read the source directly before this prompt so the instrumentation targets the
right lines. Findings, to confirm or refute live:

1. **`window.reveal` is hard-replaced at ~line 7125** (`window.reveal=function(which,ok){...}`,
   no call to a prior reference). This DISCARDS an earlier wrapper at ~line 4430
   that did: `const save=current; if(answeredCard17521) current=answeredCard17521;
   try{return oldReveal17521.apply(...)} finally{current=save;}` — i.e. a
   purpose-built safety net that swapped `current` to "the card that was just
   answered" before showing the reveal, then restored it. **The live reveal()
   at 7125 reads `current` directly with no such protection.** This is the
   leading hypothesis for the `window.current`-vs-rendered-question desync
   Codex found last round. Check whether `answeredCard17521`/`bindRatings`
   (~4436) are themselves still live or also superseded further down the file
   — same "is this really the last one" check needed for `reveal()` itself.
2. **`renderRevealSections()`'s board-trigger write has no idempotency guard**
   (unlike its own `trigger`/`dx` write, which checks a `revealSectionsSig`
   dataset key first). It's called via `setTimeout(...,0)` on every `reveal()`
   call AND via a 900ms `setInterval` for as long as a reveal stays open —
   unconditionally rewriting `.boardTrigger350` every single tick. Leading
   hypothesis for mutation count scaling with dwell time (302 mutations on a
   longer-viewed card vs 54 on a quick one).
3. **`ensureBoard()` (~6746) and `ensureFull()` (~6761) both run on a separate
   250ms `setInterval`** (~line 7350) AND are called directly inside the live
   `reveal()` at the end of its body (~7149-7150) — same call, same tick, so
   `reveal()`'s own board write (~7143-7146) and `ensureBoard()`'s board write
   should be deduplicated by `ensureBoard()`'s own `v350Key` guard for that
   first call. The 250ms interval's later, independent calls are not
   guaranteed to interact the same way — verify live.
4. `soloRevealTitle`/`soloRevealDx` have 7 separate textual writer sites across
   the file (~415, 527, 1620, 1858, 2769, 4064, 5484) — per the existing
   `AGENTS.md` "reveal() Chain" table, all but the last 4 (7125→8913→9380→9718)
   are believed dead. Re-confirm this is still true, don't assume.
5. **`reveal('solo',ok)` is scheduled via `setTimeout(...,650)` from at least 3
   separate call sites** (~407, ~873, ~4104), each inside a different historical
   `selectSolo` wrapper layer, each computing its own `ok` independently at the
   moment ITS layer ran. If more than one of these layers is actually live
   (matching the documented 11-layer `selectSolo` chain) and they don't resolve
   in lockstep, the later-firing `reveal()` call would overwrite the title with
   whatever `ok` it computed — a direct hypothesis for the "Gate Completed" →
   "Learning Moment" flip with no new user action. Verify how many of these 3
   sites actually fire per click, and whether their `ok` values ever disagree.
6. **Resolved without live testing:** the "duplicate board trigger" visible
   text is explained by the existing, already-accepted `board_trigger` →
   `educational_objective` fallback (`renderRevealSections` line ~8902: when
   `educational_objective` is empty or equals `diagnosis`, the `#soloTrigger`
   box — labeled "EDUCATIONAL OBJECTIVE" — shows `board_trigger`'s content too,
   on top of `.boardTrigger350`'s own separate "BOARD TRIGGER" box showing the
   same text). This is by design for decks with empty `educational_objective`,
   not a new glitch — don't spend live-test time re-confirming this one.

**Already fixed without live testing (low-risk, self-contained, JXA-verified):**
added an idempotency guard to `renderRevealSections()`'s board-trigger write
(PHASE2 `fee324a` / PHASE1 `ddf3d72`), mirroring the trigger/dx write's existing
`revealSectionsSig` pattern — it was unconditionally rewriting `.boardTrigger350`
every 900ms tick. This should reduce but not eliminate the measured mutation
counts; re-measure rather than assume it's fully resolved.

## Live instrumentation (real browser, real UI controls)

Inject before any user action:
```js
['reveal','ensureBoard','renderRevealSections','ensureFull','nextCard','advance']
  .forEach(name => {
    const orig = window[name];
    if (typeof orig !== 'function') return;
    window[name] = function(...args) {
      console.log(`[INSTR] ${name}`, {
        t: performance.now(), args,
        currentDefined: 'current' in window, currentQid: window.current?.qid_unique || window.current?.qid,
        soloQuestionText: document.getElementById('soloQuestion')?.textContent?.slice(0,60),
        soloRevealTitle: document.getElementById('soloRevealTitle')?.textContent,
        soloRevealDx: document.getElementById('soloRevealDx')?.textContent?.slice(0,60),
        soloTrigger: document.getElementById('soloTrigger')?.textContent?.slice(0,60),
        boardTrigger: document.querySelector('.boardTrigger350')?.textContent?.slice(0,60),
        oneThing: document.querySelector('.oneThing350')?.textContent?.slice(0,60),
        soloRevealRatings: document.getElementById('soloRevealRatings')?.textContent?.slice(0,60),
        revealHidden: document.getElementById('soloReveal')?.hidden ?? document.getElementById('soloReveal')?.style.display === 'none',
        stack: new Error().stack.split('\n').slice(1,4).join(' | ')
      });
      return orig.apply(this, args);
    };
  });
['#soloReveal','#soloQuestion','#choiceRow','.promptBox','.boardTrigger350','.oneThing350']
  .forEach(sel => {
    const el = document.querySelector(sel);
    if (!el) return;
    new MutationObserver(muts => muts.forEach(m => console.log('[MUT]', performance.now(), sel, {
      type: m.type,
      target: m.target.nodeName + (m.target.className ? '.' + m.target.className : ''),
      oldText: (m.oldValue || '').slice(0, 60),
      newText: (m.target.textContent || '').slice(0, 60),
      stack: new Error().stack.split('\n').slice(1, 4).join(' | ')
    }))).observe(el, {childList: true, subtree: true, characterData: true, characterDataOldValue: true});
  });
```

Then run exactly this flow once, logging every `[INSTR]`/`[MUT]` line with
timestamps: **Upload a real deck → Start Solo → answer a question → let the
reveal sit for 1200ms → press Space to advance.** Repeat once for a
board-trigger-only card and once for a fully-populated card.

## Report format

For each `[INSTR]`/`[MUT]` entry in order: which function, at what timestamp,
what `current`/rendered-text state it saw, and whether the title/board content
it wrote matches what was already on screen. Flag the exact moment (if any)
`currentQid` stops matching `soloQuestionText`'s card, and the exact moment (if
any) the title flips after the initial reveal with no logged user action in
between. Also flag: any `[INSTR]` entry where `revealHidden` is true but the
function still wrote new dx/trigger/board/oneThing/ratings text (proves the
hidden-but-still-mutating finding from 2026-06-24), and any entry where
`currentDefined` is false (proves `window.current` is absent rather than just
disagreeing).

**Run the flow on an iPhone-size viewport with a real uploaded deck** (matches
the user's exact repro conditions for the flashing report). State explicitly:
the first `[MUT]` entry that fires after the user's last input with no
further input in between (the candidate root cause of visible flashing), and
whether it targets the reveal panel, the live question card, or both. End
with one of: (a) one specific writer to make idempotent or remove, or (b) "no
single writer found, needs another pass" — do not guess past what the log
shows.
