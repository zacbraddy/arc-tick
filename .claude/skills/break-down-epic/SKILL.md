---
name: break-down-epic
description: Creates the epic branch and slices an epic in execution/ into small, ordered stories with owners and dependencies. Use when the user runs /break-down-epic.
disable-model-invocation: true
argument-hint: "[optional epic folder or slug]"
---

# /break-down-epic

1. Pick the epic ($ARGUMENTS, or the epic in `execution/` that has no `stories/` yet). Read the hub, `plan.md`, and for technical/mixed epics `c4/` levels 3–4.
2. **Branch.** If the working tree is dirty, stop and ask. Otherwise run `git checkout main && git pull --ff-only` (skip the pull if there's no remote), then `git checkout -b epic/<slug>`.
3. Slice the epic into stories that are:
   - **outcome-focused**: each one delivers something observable. For code, vertical end-to-end slices where possible. For business work, a concrete result ("Mailing list live with double opt-in").
   - **small**: one implement session each.
   - **ordered**: risky or blocking work early. Enabling stories (scaffolding, migrations, account setup) are fine when genuinely needed.
   Give each story an `owner` (agent / zac / both) and its `dependsOn` story numbers.
4. Show me the list: number, title, owner, depends on, one-line outcome, and the C4 elements or deliverables touched. Revise until I agree.
5. Create `stories/NN-slug.md` for each one per "Stories" in `project-context/README.md`: `status: draft`, Summary, Outcome, rough scope, and links to the relevant C4 sections or plan sections. Add `stories/` to the hub's "What's here".
6. Run `node .claude/scripts/ctx.mjs validate`, then `ctx.mjs status execution` to show the result. Changes are unstaged.

Next: review and commit, then `/write-story` in a fresh session.
