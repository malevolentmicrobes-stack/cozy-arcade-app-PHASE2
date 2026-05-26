# /goal

Check, set, or advance the current project goal. Enforces gate conditions before proceeding.

## Usage

```
/goal                        # show current goal + condition status
/goal set <description>      # set a new active goal
/goal check                  # evaluate whether gate condition is met
/goal done                   # mark current goal complete, advance to next
/goal block <reason>         # explicitly block advancement with a reason
```

## What /goal does

When invoked:
1. Read `GOAL.md` in the project root — this is the single source of truth
2. Show: active goal, gate condition, current status (BLOCKED / READY / DONE)
3. If `check`: evaluate the condition programmatically where possible
4. If `done`: update GOAL.md, mark gate as passed, surface the next goal

## Gate condition enforcement

A goal with `condition:` set MUST NOT be marked done until the condition evaluates true.

Condition types:
- `browser:<expression>` — must be confirmed by user running expression in browser console
- `test:<function>` — must show passing output in terminal or browser
- `file:<path exists>` — file must exist
- `manual:<description>` — requires explicit user confirmation

## GOAL.md format

```markdown
## Active Goal
**Goal:** <one sentence>
**Phase:** <phase number>
**Condition:** <condition type>:<expression or description>
**Status:** BLOCKED | READY | DONE
**Blocked by:** <what is preventing this — omit if not blocked>

## Gate Log
| Date | Goal | Condition | Result |
|------|------|-----------|--------|
```

## Behavior rules

- Never mark a goal DONE if its condition has not been verified
- Never skip a gate — if condition is `browser:`, explicitly ask the user to run it and report back
- When a goal is marked DONE, immediately surface the next goal from the project roadmap
- If no GOAL.md exists, create one from the "Next Active Task" section of the project status file
