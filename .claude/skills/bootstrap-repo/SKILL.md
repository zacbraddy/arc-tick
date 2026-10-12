---
name: bootstrap-repo
description: Seeds an empty 10k view once, from founding inputs (the founder's goals and constraints) or by surveying an established codebase adopting the workflow (architecture, existing ADRs, project structure, business facts), then sets up quality tooling if there's code. The one sanctioned way to write 10k before any epic has run. Use when the user runs /bootstrap-repo.
disable-model-invocation: true
argument-hint: "[founding|brownfield] [optional input files or paths]"
---

# /bootstrap-repo: seed 10k with what's already true

`10k/` normally changes only through `/retro`, because facts become trustworthy once delivered. Some facts are true before any epic runs: a founder's goals and limits, or the architecture and decisions of a codebase that already exists. Without them, every early agent works blind. This command writes them once. After that, `/retro` and `/curate-10k` own 10k.

The bar is the same as retro's: **true now, and it changes how future work gets done.** Plans, hopes, open questions and TODOs aren't current truth. They go to `raw/` for `/ideate`.

Conventions are in `project-context/README.md` (Document format, Hub templates for the ADR shape, Indexing & tags). Read those sections as you need them.

## 1. Check this is a bootstrap
- Run `node .claude/scripts/ctx.mjs init`. It's safe to re-run and fills in whatever folders or `tags.json` are missing.
- List what's in `project-context/10k/` (ignore `index.json` and `.gitkeep`). If it already holds docs, the repo is past bootstrapping. Say so, and point me at `/retro` for delivered work or `/curate-10k` for drift. Carry on only if I explicitly say this is a top-up of a seed that was never finished.

## 2. Pick the mode
From $ARGUMENTS or by asking me. Both can apply, for example an established codebase whose owner also has business constraints.
- **founding:** the inputs are what I tell you or point you at: a brain dump in `raw/` (including any `raw/seed-10k.md` that `/ideate` set aside), a pasted doc, or answers to your questions.
- **brownfield:** the input is the codebase plus whatever docs it already has.

## 3. Gather candidate facts

**Founding.** Read the inputs. Pull out statements of intent or constraint: the goal and success milestones, spend limits, legal and operating setup, working style, ethical lines, capacity, and anything already decided (a chosen stack, an existing customer, a signed contract). The founders' own statements of intent are tier A evidence. Everything that's still a question or an idea is a thread for `/ideate`, not a 10k fact. If something important is obviously missing (no spend limit, no definition of success), ask me rather than leave a gap I'll trip over later.

**Brownfield.** Protect your context: spawn parallel subagents with `isolation: "worktree"`, one per slice. Each one returns candidate facts as rows of `fact | evidence (file:line or doc path) | target doc`, plus anything it found that contradicts itself:
- **architecture:** C4 context (users, external systems) and containers (deployables, datastores, queues), from code, infra-as-code, deploy and CI config;
- **decisions:** existing ADRs or decision docs, plus decisions that only live in the code and still bind future work (framework, persistence, auth, hosting, module boundaries);
- **structure:** where things live in the codebase and why, taken from the actual tree, not an old README;
- **business:** README, docs, marketing copy, pricing, terms, licences, `package.json` metadata → product, sales, legal and financial facts.

Describe what is *implemented*. A README that disagrees with the code loses: record the code's truth and tell me about the gap. Commented-out code, TODOs, roadmap docs and half-done branches are raw material, not 10k.

The repo's own docs (README, `docs/adr/`, wikis) stay as they are. They may belong to a team, and editing them isn't this command's job. Gaps between them and the code go in leftovers.

## 4. Propose 10k docs, 5 at a time
For each proposal give: the target doc (new path), department, the facts it will hold, the evidence, and why it will still matter months from now. Flag anything only I can confirm. Prefer fewer, well-linked docs over many thin ones: one constraints doc beats six one-liners. Typical targets:
- `10k/technical/architecture/` C4 context and container views (component views only for complex areas);
- `10k/technical/adrs/NNNN-slug.md`, one per decision that binds future work, numbered from 0001. Rewrite imported ADRs into the house shape and drop superseded ones rather than carrying them over;
- `10k/technical/project-structure.md`;
- department docs, e.g. `10k/business-constraints.md` or `10k/product/…`.

Write each batch once I agree.

## 5. Write
- Every doc: frontmatter (`title`, `shortDescription`, `tags`), `## Summary` first, `## Related` last. Founding docs say in their Summary that the facts are my own statements of intent (tier A). Brownfield docs cite the code they describe as backticked repo paths (`src/db/sqlite.ts`).
- Tags: reuse existing ones from `tags.json` first. A fresh repo will have few or none, so add the minimum with `ctx.mjs tags add`. Aim each at a slice future work will grow into (`tech-stack`, `pricing`), not at one doc's title.
- Link the new docs to each other in Related.

## 6. Validate
Run `ctx.mjs validate` and fix everything it reports, so the 10k seed is complete before you touch tooling.

## 7. Quality tooling
If the repo has code, invoke the `bootstrap-quality` skill and follow it, including its go-ahead checkpoint. It extends whatever lint, test, pre-commit and CI setup already exists. Existing code rarely passes new rules on day one. Set the offending rules to warn rather than rewriting code in this session, and list that debt as a leftover. If the tooling adds files worth knowing about, update `10k/technical/project-structure.md` to match and validate again.
No code yet (a founding-only repo)? Skip this and tell me to run `/bootstrap-quality` once the first technical epic creates some.

## 8. Leftovers and hand over
- Leftovers: list the threads you set aside across every step: ideas, open questions, gaps between docs and code, risks, and tooling debt. If I want them carried, write them to `project-context/raw/bootstrap-leftovers.md` as plain markdown for `/ideate`.
- Delete the raw inputs you've fully processed. Their facts are now in 10k and their open threads are in leftovers, so `/ideate` won't process them a second time.
- List the docs written, the leftovers file and the tooling added, with paths. Changes are unstaged for me to review and commit. Suggest `/ideate` as the next step if `raw/` has anything in it.
