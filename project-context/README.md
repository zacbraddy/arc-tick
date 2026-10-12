# project-context conventions

Everything we know about this project, technical and business, lives here. Read only the section you need.

## Stages

| Folder | Holds | Question it answers |
| --- | --- | --- |
| `raw/` | Brain dumps, pasted docs, leftovers | Unprocessed input for `/ideate` |
| `ideas/` | Items with *whether/what* unknowns | Is this worth doing, and what is it? |
| `shaping/` | Items with *how* unknowns | How could we do it? (spikes, research) |
| `planning/` | Epics | How are we *actually* doing it? |
| `execution/` | Epics with stories | Build it |
| `retro/` | Delivered epics awaiting harvest | What became true? |
| `10k/` | Current truth, by department | What is true now? |

`10k/` is the only trusted stage; everything else is provisional. It changes through `/bootstrap-repo` (once), `/retro` and `/curate-10k`.

`10k/` departments: `technical/` (with `architecture/` and `adrs/`), `product/`, `sales/`, `marketing/`, `legal/`, `financial/`, `competitor-intelligence/`. Cross-department docs sit at the `10k/` root.

## Document format

Every doc in a stage folder:

```markdown
---
title: Human title
shortDescription: One line, used by indexes and the context-scout.
tags: [tag-a, tag-b]
---

## Summary
Two to five lines: the facts a reader needs without reading on.

...body...

## Related
- [Other doc](/project-context/10k/technical/project-structure.md)
```

- Links inside an item folder are relative; all others start with `/project-context/`. Repo code is cited as backticked paths (`app/store.py`).
- Facts carry evidence: a file path, a doc link or a URL, plus its evidence tier where it matters.
- No secrets, credentials or customer personal data, ever.
- Replace outdated content rather than appending; git is the history.

## Evidence standard

Tier every non-trivial claim by how likely its author is to spin or overstate *this* claim, not just by source type:

- **A**: direct and unmotivated. Our own code, measurements, experiments, Zac's own statements of intent, primary data.
- **B**: credible with mild motive. Independent reviews, practitioner write-ups, official docs about what a product *does*.
- **C**: motivated or second-hand. Vendor marketing, claims about ease or speed of adoption, forum anecdotes, AI summaries.

Decisions should rest on A/B. Where only C exists, say so and record the best guess as provisional.

## Item anatomy

An item is a folder in `ideas/`, `shaping/`, `planning/`, `execution/` or `retro/`, named by a kebab-case slug.

```
<item>/
  README.md            signpost hub (see Hub templates)
  state.json           script-managed: status, unknowns, knowns, decisions, lineage
  ideas-content/       findings from /refine-ideas
  shaping-content/     findings from /shape-ideas
  spikes/<name>/       throwaway code, each with a README.md of findings
  origins/             items merged in during planning (ctx.mjs merge --nest origins)
  plan.md              planning deliverable (epics)
  c4/                  1-context.md … 4-code.md (technical/mixed epics)
  stories/NN-slug.md   execution stories
```

Create only the folders you need.

## Item state

`state.json` is never hand-edited. Use `node .claude/scripts/ctx.mjs`:

- `state init|status|type|lineage|remove|show`
- `unknown add|answer|order`: unknowns are kept in priority order; the top one is next.
- `known add <item> "<fact>" <source>` and `decision add <item> "<decision — why>" <evidence>`. Sources and evidence must be existing paths or URLs.

Status is `active`, `ready-for-planning` or `blocked`. Epic type is `technical`, `business` or `mixed`.

## Hub templates

Hubs are signposts only. Progress lives in `state.json`; story status lives in story frontmatter.

**Item hub (`<item>/README.md`)**

```markdown
---
title: …
shortDescription: …
tags: […]
---

## Summary
What this item is and why it matters, in a few lines.

## What's here
- [finding](ideas-content/slug.md): one line

## Related
```

**ADR (`10k/technical/adrs/NNNN-slug.md`, numbered from 0001)**

```markdown
---
title: "ADR-NNNN: Decision in a few words"
shortDescription: …
tags: […]
---

## Summary
The decision in one or two sentences. Status: accepted | superseded by ADR-XXXX.

## Context
The forces and constraints that made a decision necessary, with evidence.

## Decision
What we do, stated so it can be checked against code.

## Consequences
What gets easier, what gets harder, and what future work must respect.

## Related
```

Superseded ADRs are deleted once their replacement lands, rather than kept around.

## Stories

`stories/NN-slug.md`, two-digit numbers. Frontmatter adds to the standard fields:

- `status`: `draft` → `ready` → `implemented` → `done` (or `blocked`, which needs `blockedReason` and ideally `revisit`).
- `owner`: `agent`, `zac` or `both`.
- `dependsOn`: `[01, 03]`, story numbers that must be `done` first.

Body: Summary, Outcome, scope and links (from `/break-down-epic`), then Done when, Acceptance criteria, Test plan / Implementation notes or Guide (from `/write-story`), and `## Review` (from `/review-story`).

## Stage exit criteria

The `stage-gate` agent judges whether the *next* stage can start in a sensible direction. Open unknowns are fine if they belong to the next stage, or if they're blocked by the real world and have a recorded best guess.

- **ideas → shaping:** we know it's worth doing and roughly what it is: who has the problem, what exists already, and why now. What remains is only *how*.
- **shaping → planning:** at least one viable approach has evidence behind it (spike, research or outreach), the main risks are named, and appetite is agreed. The item is marked `ready-for-planning`, not moved.
- **planning → execution:** `plan.md` is complete (scope, out of scope, approach, sequencing, risks, success measures, candidate ADRs). Technical/mixed epics also have consistent C4 levels and a test strategy. There are no unresolved conflicts with `10k/`.

## Promotion & merging

- **Move** (`ctx.mjs move <item> <stageDir>`) relocates an item, rewrites absolute links and logs lineage.
- **Merge** (`ctx.mjs merge <incoming> <target> [--nest origins]`) is the mechanical half: it moves files, re-ids state entries and deletes the incoming folder. The judgement half is ours: dedupe and reword state entries, reorder unknowns into one priority list, and rewrite the target hub's Summary.
- Ideas merge into a cohesive in-flight shaping item when one exists. Planning is the last stage where items merge.

## Moonshots & parked work

- `ideas/moonshots.md`: long-range visions we never work on directly; we watch for cheap openings.
- `ideas/parked.md`: doable but deferred until a named trigger fires. Give each entry its raw filename and the commit hash that holds it, if it was committed.

## Indexing & tags

- `index.json` per stage is generated from frontmatter by `ctx.mjs index` and `validate`. Never hand-edit it.
- `tags.json` is the tag registry: `{tag, shortDescription, department[]}`. Reuse a tag first. Add one only with `ctx.mjs tags add <tag> "<desc>" <dept,…>`. Aim tags at a slice future work will grow into (`data-store`), not at one doc's title. Use `/curate-tags` past ~50 tags.
- Navigate with `jq`/`grep` over `index.json`, `tags.json` and `state.json`; never bulk-read folders.
- Finish every workflow command with `ctx.mjs validate` and fix what it reports.
