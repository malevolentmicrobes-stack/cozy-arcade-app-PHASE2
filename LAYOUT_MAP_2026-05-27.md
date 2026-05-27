# Layout Map — Cozy Arcade Board Prep
*Snapshot of confirmed-working visual state as of 2026-05-27 (commit 04bc878)*
*Reference this before any CSS/layout change. If positioning breaks, restore these values.*

---

## Global Chrome

| Element | Position / Size | Notes |
|---------|----------------|-------|
| `#gearBtn` (.settingsGear) | `position:fixed; top:12px; right:14px` | Opens settings drawer |
| `#homeTopBtn` (.homeTopBtn) | `display:none!important` — hidden in gameplay | Shown only on home |
| `.hud` | `top:10px; left:12px; right:12px; z-index:330` | Spans full width, ~48px tall |
| `.hud .hudGroup:last-child` | `padding-right:62px` | Clears gear button |

---

## Solo Mode (`#solo`)

```
┌─────────────────────────────────────────────────────┐ ← top:0
│  HUD (HP · Score · Streak · Gate | Pause · Exit)    │ ← height ~48px
├─────────────────────────────────────────────────────┤ ← top:58px
│  promptBox                                           │
│   • width: min(1680px, 94vw)                        │
│   • top: 58px (absolute)                            │
│   • min-height: clamp(280px, 38vh, 42vh)            │
│   • max-height: 42vh                                │
│   • padding: 26px clamp(28px,4vw,64px) 24px         │
│   • border-radius: 0 0 28px 28px                    │
│  ┌───────────────────────────────────────────────┐  │
│  │ systemBadge (top:18px left:20px absolute)     │  │
│  │ promptText (margin-top:32px)                  │  │
│  │  • font-size: clamp(24px, 2.05vw, 30px)      │  │
│  │  • font-weight: 900 (base); 500/dim if bionic │  │
│  │  • line-height: 1.36                          │  │
│  │ timer bar (height:7px; margin-top:12px)       │  │
│  └───────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────┤ ← inset: 240px 0 0
│  soloTrack                                           │
│  ┌──┬──┬──┬──────────────────────────────────────┐  │
│  │  │  │  │  choiceRow (top:0; left:3vw; right:3vw) │
│  │  │  │  │  • 4 columns, gap:14px              │  │
│  │  │  │  │  • choice: min-height:76px          │  │
│  └──┴──┴──┴──────────────────────────────────────┘  │
│                                                      │
│  runner/hunter (bottom:46px) — sprints across lanes │
│  groundGlow (bottom:0)                              │
│  mobileControls (← Select →) bottom:14px           │
└─────────────────────────────────────────────────────┘
```

**Key constraint**: `promptBox` min-height + timer + margin ~≤ 230px or it overlaps soloTrack (timer covers choices). At `clamp(280px,38vh,42vh)` on 1440px screen = ~518px max-height cap keeps this safe. soloTrack inset:240px gives 240-58=182px of clear track above choices.

**Reveal overlay** (`#soloReveal`): `position:absolute` over the track; width: min(1040px,92vw); max-height:82vh. Shows diagnosis, educational objective trigger, rating bar.

---

## Domain / Knowledge Expansion Mode (`#domain`)

```
┌─────────────────────────────────────────────────────┐
│  HUD (Round · Score · Streak | Pause · Exit)        │ ← z-index:330
├─────────────────────────────────────────────────────┤ ← top:80px
│  promptBox                                           │
│   • top: 80px; max-height: 30vh                     │
│   • font-size: clamp(24px, 2.05vw, 30px)            │
├─────────────────────────────────────────────────────┤ ← inset: 225–248px 0 0
│  orbArena (fills rest of viewport)                  │
│                                                      │
│  Orbs start centered (cx=50vw, cy=63vh, r=60px)     │
│  and expand outward over timerMax seconds           │
│  • 4 orbs at N/E/S/W angles (+/- 90° each)         │
│  • position computed by positionOrbs(p) p=0→1       │
│  • orb: min-width:140px; border-radius:22px         │
└─────────────────────────────────────────────────────┘
```

**Orb drop timing**: `timer` ticks down from `timerMax` (seconds) at –0.08/tick (80ms interval = 1 tick/80ms). `p = 1 – timer/timerMax`. Orbs reach border when p=1. Selecting 5s → faster expansion; 10s → slower. `applyQuestionSeconds351()` sets `timerMax` live.

---

## Settings Drawer (`#cozySettingsDrawer351`)

```
                              ┌──────────────────────┐
                              │  Settings & Gameplay  │ ← 480px wide (desktop)
                              │                       │   slides in from right
                              │  ▼ Advanced Import    │
                              │  ─────────────────── │
                              │  Gameplay Controls    │
                              │  Game timing [▾ 7s]  │
                              │  □ Bionic Reading     │
                              │  [Apply] [Import▾]    │
                              │          [Export▾]    │
                              └──────────────────────┘
```

- Opens via gear click (intercepted by `document.addEventListener('click', ..., true)` at line 9272)
- Drawer gets class `open` via `requestAnimationFrame` → `drawer.classList.add('open')`
- Body gets class `cozyDrawerOpen351` → promptBox narrows to `min(760px, calc(100vw - 520px))`
- Closes: `closeDrawer351()` removes `open` class, removes body class, restores promptBox width

**700ms interval guard** (fixed 04bc878): while `drawer.classList.contains('open')`, `updateDrawer351()` no longer resets the bionic checkbox or timer dropdown — only the card-count stats update.

---

## Home Screen (`#home`)

```
┌─────────────────────────────────────────────────────┐
│  [⌂]                                    [⚙]        │ ← fixed buttons
│  heroIcon  COZY ARCADE                              │
│            BOARD PREP-MEDICINE                      │
│                                                      │
│  ┌─────────────┐  ┌─────────────┐                  │
│  │ ⚔️ Solo     │  │ 🌀 Domain   │                  │
│  │ Studying    │  │ Knowledge   │                  │
│  └─────────────┘  └─────────────┘                  │
│                                                      │
│  [Settings]                                          │
│  [Upload Deck] [Download Deck]                       │
│                                                      │
│  Cards: 0   Reviewed: 0   Due: 0   New: 0   Pinned: 0│
└─────────────────────────────────────────────────────┘
```

---

## Timer Behavior (confirmed)

| Setting | `timerMax` | Effect |
|---------|-----------|--------|
| 3s | 3 | Very fast — orbs/bar drain in 3s |
| 5s | 5 | Fast |
| 7s | 7 | **Default** — moderate pace |
| 10s | 10 | Slow — full 10s to border |

`timerMax` is set on Apply via `applyQuestionSeconds351()`. Lives in `timerMax` global (line 384). Each tick: `timer -= 0.08` every 80ms. Timer bar: `width = (timer/timerMax * 100)%`.

---

## Bionic Reading CSS (confirmed working)

| State | CSS | Visual |
|-------|-----|--------|
| OFF | `[data-cozy-bionic]` absent / `='0'` | `.promptText` = 900 weight, white |
| ON | `[data-cozy-bionic="1"]` on `<html>` | `.promptText` base = 500 weight + rgba(160,200,255,0.62); `<b>` = 950 + #fff |

Rule location: `<style id="v175374-rectifier-font-bionic-fix">` near end of file (~line 12687).
Unconditional legacy rule at line 5708 (`.solo .promptText b { font-weight:950; color:#fff }`) — present but only visible when `<b>` tags exist in DOM.

---

## Key localStorage Keys (never rename)

| Key | Default | Controls |
|-----|---------|----------|
| `bionicOn_v1751523` | `null` → true | Bionic reading ON/OFF |
| `cozyQuestionSeconds351` | `null` → 7 | Timer seconds (3–10) |
| `soloStudyingState_v1757` | — | Active card session state |
| `cozy_arcade_progress_v1` | — | FSRS progress |
| `cozy_arcade_persona_v1` | — | User persona |
| `cozy_arcade_limitless_cards_v1` | — | Uploaded deck |

---

*Before ANY layout/CSS change: screenshot the solo game at 1440px wide and compare against this map. If soloTrack inset moves, check that promptBox max-height + 58px top ≤ soloTrack inset top.*
