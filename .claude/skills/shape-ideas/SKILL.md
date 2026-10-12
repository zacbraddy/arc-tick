---
name: shape-ideas
description: Answers one "how could we do it" unknown on a shaping item through spikes, experiments, research or outreach, then checks readiness for planning. Use when the user runs /shape-ideas.
disable-model-invocation: true
argument-hint: "[optional shaping folder or slug]"
---

# /shape-ideas: one "how could we?" per session

Shaping turns candidate directions into a confident "this is viable for us, and here's the approach". The questions are sharper than in ideas. Technical: "Which candidate actually performs in *this* project?" Business: "Which price point converts? Which channel reaches them?"

## 1. Pick the item
If $ARGUMENTS names one, use it. Otherwise spawn `prioritiser` with stage `shaping`, tell me its pick and why in 2 lines, and carry on unless I redirect.

## 2. Pick the unknown
Run `node .claude/scripts/ctx.mjs state show <item>` and read the hub's Summary. Pick the unknown that most moves this toward planning and propose how to answer it:
- **spike or bake-off**: throwaway code in `<item>/spikes/<name>/`, right-sized to answer the question and nothing more. Agree the success measure with me before building.
- **business experiment**: landing page, survey, price test, outreach. Draft the materials; I run anything that needs a human.
- **desk research**: per "Evidence standard" in `project-context/README.md`. Tier each claim by its author's motivation, not just by source type: a vendor's docs prove a feature exists, not that it's quick to adopt. Spell this check out in any research agent's brief.
- **ask me**

## 3. Do it
Record setup, what was measured, and the results. Numbers beat impressions. Note any unknown unknowns along the way. If `ideas/moonshots.md` exists and the approach touches one, mention any cheap opening it could leave; don't build toward it.

## 4. Record
- Write the findings to `<item>/shaping-content/<slug>.md`, and give each spike a `README.md` with its findings.
- `ctx.mjs unknown answer <item> <uId> "<fact>" shaping-content/<slug>.md`. If it settled a choice: `ctx.mjs decision add <item> "<decision — why>" shaping-content/<slug>.md`. Add new unknowns with `unknown add`.

## 5. Moving forward without perfect information
If an unknown is blocked by the real world (no survey replies, an early adopter pulled out), record the best guess as a decision with its evidence and risk, and move on. Never guess where we *could* find out. For example, don't pick an unspiked technology unless I've made that call myself.

## 6. Gate
Spawn `stage-gate` with the item path and the target `planning`. If ready, it marks the item `ready-for-planning`; it doesn't move it. Relay the verdict, including its next step for me.

## 7. Wrap up
Up to 5 bullets: what we learned, new unknowns, the gate verdict, and the next session. Run `ctx.mjs validate` and fix errors. Changes are unstaged for me to review and commit.
