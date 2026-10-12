---
name: retro
description: Distils a completed epic's full nested context into durable 10k knowledge, raises genuine follow-ups and workflow improvements, then archives the epic folder. Use when the user runs /retro.
disable-model-invocation: true
argument-hint: "[optional epic folder or slug]"
---

# /retro: what's now true and worth keeping?

The main job is curating `10k/`. Everything else is secondary.

## 1. Move
Check that every story is `done` (`node .claude/scripts/ctx.mjs status execution`), then run `ctx.mjs move <epic> project-context/retro/`.

## 2. Distil (protect your context)
Read the epic hub, `plan.md` and `ctx.mjs state show <epic>` yourself. Then spawn subagents in parallel, each digging down its slice of the tree:
- **technical**: `c4/`, stories (including Implementation notes and Review sections) and spikes → durable decisions, architecture deltas against `10k/technical`, and structure changes;
- **business**: `origins/` (all nested content) and business stories → durable product, market, competitor, sales, legal and financial knowledge.
Each returns candidate durable facts with source paths, plus anything contradicting current `10k/`.

## 3. Propose 10k changes, 5 at a time
For each change: the target doc (new, rewrite or delete), the department, the fact, and why it will still matter months from now. Include only what changes how future work gets done. Rewrite current docs in place, with no history. Typical changes:
- ADRs for candidate ADRs that held up in delivery;
- `10k/technical/architecture/` C4 context and container updates;
- `project-structure.md`;
- department docs.
Apply each batch once I agree.

## 4. Secondary outputs (only when genuinely warranted)
- **New ideas or follow-ups** worth feeding back into the funnel: list them for me first. If I agree, write `project-context/raw/retro-<epic>.md` (plain markdown). If there are none, write nothing. If `ideas/parked.md` exists, skim it and mention any trigger this epic looks to have fired.
- **Workflow improvements:** for each friction point with these commands or agents that I agree is worth fixing, invoke `raise-workflow-improvement` with a concrete description.

## 5. Validate and hand over
Run `ctx.mjs validate` and fix errors. Ask me to review and commit.

## 6. Archive
Once I confirm the commit: delete `project-context/retro/<epic>/`, run `ctx.mjs validate`, and commit with the message `retro: archive <epic> (full context in git history)`. This commit is yours to make. Remind me to merge `epic/<slug>` into main.
