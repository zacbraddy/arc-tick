---
name: refine-ideas
description: Makes one unknown known on an idea through sourced research or conversation, then checks whether the idea is ready for shaping. Use when the user runs /refine-ideas.
disable-model-invocation: true
argument-hint: "[optional idea folder or slug]"
---

# /refine-ideas: one unknown per session

An idea exists to answer landscape questions just well enough to start shaping. Technical: "What already solves this?" Business: "Who has this problem? Is there appetite? What do they pay today?" Move on as early as that's honest. Lingering is navel-gazing.

## 1. Pick the idea
If $ARGUMENTS names one, use it. Otherwise spawn `prioritiser` with stage `ideas`, tell me its pick and why in 2 lines, and carry on unless I redirect. If `ideas/parked.md` exists, skim it and mention any trigger that looks to have fired.

## 2. Pick the unknown
Run `node .claude/scripts/ctx.mjs state show <idea>` and read the hub's Summary. Usually the top unknown is the one; if another clearly moves the idea further toward shaping, say why and reorder. Say how you'll answer it: research, asking me, or both. One unknown per session.

## 3. Answer it with facts
- Match the method to the question. Use web research for market, prior art, user sentiment, pricing and technology landscape. Ask me for intent, constraints and knowledge only I have.
- Follow "Evidence standard" in `project-context/README.md`. Cast a wide net: we're mapping the landscape, not choosing solutions. Note candidate approaches for shaping to test.
- Tier each claim by its author's motivation, not just by source type: how likely is it that they have reason to spin or overstate *this* claim? A vendor's docs prove a feature exists, not that it's quick to adopt. Spell this check out in any research agent's brief, because agents skim references to the README.
- Note any unknown unknowns that surface.

## 4. Record
- Write the findings to `<idea>/ideas-content/<slug>.md`.
- `ctx.mjs unknown answer <idea> <uId> "<fact in one line>" ideas-content/<slug>.md`
- Add new unknowns with `unknown add` and reorder them if needed. Update the hub's Summary and "What's here" only if understanding changed.

## 5. Gate
Spawn `stage-gate` with the idea's path and the target `shaping`. Relay its verdict.

## 6. Wrap up
Up to 5 bullets: what's now known, new unknowns, the gate verdict (and new path if it moved), and the recommended next session. Run `ctx.mjs validate` and fix errors. Changes are unstaged for me to review and commit.
