# CODEX_PROMPT_17 — Reveal Ownership Instrumentation (PHASE2, then PHASE1)

**Diagnostic only. Do not fix anything until the report comes back. Fix only the
first confirmed writer conflict — do not patch all reveal functions blindly.**

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
        currentQid: window.current?.qid_unique || window.current?.qid,
        soloQuestionText: document.getElementById('soloQuestion')?.textContent?.slice(0,60),
        soloRevealTitle: document.getElementById('soloRevealTitle')?.textContent,
        soloTrigger: document.getElementById('soloTrigger')?.textContent?.slice(0,60),
        boardTrigger: document.querySelector('.boardTrigger350')?.textContent?.slice(0,60),
        stack: new Error().stack.split('\n').slice(1,4).join(' | ')
      });
      return orig.apply(this, args);
    };
  });
new MutationObserver(muts => console.log('[MUT]', performance.now(), muts.length))
  .observe(document.getElementById('soloReveal'), {childList:true, subtree:true, characterData:true});
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
between.
