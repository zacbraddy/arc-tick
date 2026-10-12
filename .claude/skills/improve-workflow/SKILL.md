---
name: improve-workflow
description: Implements one workflow improvement item (or a handful of small related ones) from workflow-improvements/, using skill-creator for skill changes. Use when the user runs /improve-workflow.
disable-model-invocation: true
argument-hint: "[optional item file]"
---

# /improve-workflow

1. List `workflow-improvements/`. Pick $ARGUMENTS, or propose either the highest-value item or a batch of small, related items that fit comfortably in one session. Agree the pick with me.
2. Read the item(s) and the files involved. Restate the change in up to 3 bullets and confirm it with me before editing.
3. Implement:
   - **Skill changes** (`.claude/skills/*`): use the `skill-creator` skill to draft and sanity-check the change, including the description when triggering is the problem. If skill-creator isn't installed, say so and continue carefully by hand.
   - **Script changes** (`ctx.mjs`): keep it zero-dependency. Test the changed command against a throwaway copy of `project-context/` in `/tmp`.
   - Keep always-loaded files (`.claude/rules/*`) lean. Every line added should replace or justify itself.
4. Delete the implemented item file(s).
5. Report what changed and how to try it. Everything is unstaged; I review and commit the changes and deletions together.
