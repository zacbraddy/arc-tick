---
name: raise-workflow-improvement
description: Records one concrete improvement to the dev workflow (its skills, agents, rules, script or conventions) as an action item in workflow-improvements/. Use after Zac agrees to raise friction you noticed, when /retro finds workflow issues, or when Zac runs it with a description of a change he wants.
context: fork
argument-hint: "<what happened / what should change>"
---

# Raise a workflow improvement

Input: $ARGUMENTS, a description of the problem or the desired change.

1. Find the files involved: `.claude/skills/*/SKILL.md`, `.claude/agents/*.md`, `.claude/rules/*.md`, `.claude/scripts/ctx.mjs`, `project-context/README.md`. Read only what's needed to make the item concrete.
2. Check `workflow-improvements/` for an existing item covering the same thing. If there is one, add to it rather than duplicating.
3. Write `workflow-improvements/<kebab-slug>.md` in plain markdown:

```markdown
# <short title>

**Problem:** what went wrong or felt clunky, in 1–3 lines
**Example:** the concrete moment it happened (command, step, what the agent did)
**Proposed change:** what should change, specific enough to implement in one session
**Files:** paths likely to change
**Size:** small | medium | large
```

4. Return one line: the file path and its title.

Never edit the workflow files themselves. This skill only records.
