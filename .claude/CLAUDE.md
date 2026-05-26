# graphify
- **graphify** (`.claude/skills/graphify/SKILL.md`) - any input to knowledge graph. Trigger: `/graphify`
When the user types `/graphify`, invoke the Skill tool with `skill: "graphify"` before doing anything else.

# goal
- **goal** (`.claude/skills/goal/SKILL.md`) - check, set, or advance the current project goal. Enforces gate conditions before proceeding. Trigger: `/goal`
When the user types `/goal`, invoke the Skill tool with `skill: "goal"` before doing anything else.
Active goal and gate conditions are always in `GOAL.md` at project root.
The gate condition for the current P3 FSRS task is: `window.runFSRSValidation()` must return 17/17 in browser before Phase 4 (`rateCard()` swap) can proceed.
currentDate
Today's date is 2026-05-26.
