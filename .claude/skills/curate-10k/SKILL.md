---
name: curate-10k
description: Verifies the 10k view against the implemented code and current reality, then prunes stale, duplicated or no-longer-binding content (old ADRs included). Use when the user runs /curate-10k.
disable-model-invocation: true
argument-hint: "[optional department or path to limit scope]"
---

# /curate-10k: true, current, lean

1. Run `node .claude/scripts/ctx.mjs validate` and fix the mechanical issues first.
2. Use `project-context/10k/index.json` to split the in-scope docs into slices. Spawn parallel subagents, one per slice. Each one checks every claim:
   - **technical**: against the code. Grep, read files, run cheap commands. Evidence is a file:line reference.
   - **other departments**: for internal consistency and against recent work. Claims only I can confirm get flagged for me.
   Each subagent returns rows of `claim | verdict (true / stale / wrong / unverifiable) | evidence | doc path`.
3. Also look for:
   - ADRs that no longer bind future work, because the code or a later decision overtook them;
   - facts duplicated across docs (keep one and link to it);
   - docs over ~300 lines (split them);
   - orphans with no inbound links and no tag overlap.
4. Show me fixes 5 at a time (rewrite / merge / delete, plus the evidence). Apply the ones I agree. Replace content; never annotate it with history.
5. Run `ctx.mjs validate`, then summarise what changed and what still needs my confirmation. Changes are unstaged.
