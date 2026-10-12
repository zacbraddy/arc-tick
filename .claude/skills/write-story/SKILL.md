---
name: write-story
description: Turns the next draft story into an implementable spec with "done when" evidence, acceptance criteria, and a test plan or guide. Use when the user runs /write-story.
disable-model-invocation: true
argument-hint: "[optional story path]"
---

# /write-story

1. Pick $ARGUMENTS, or the lowest-numbered `draft` story whose dependencies are done (see `node .claude/scripts/ctx.mjs status execution`).
2. Spawn `context-scout` for the C4 or plan sections this story links to, plus (for code) the existing code areas it touches: paths, key types, conventions.
3. Write into the story:
   - **Done when**: the concrete evidence that proves completion.
   - **Acceptance criteria**: terse Given/When/Then lines covering the main happy and unhappy paths.
   - Code stories:
     - **Test plan**: which unit, integration and E2E tests, and what we deliberately won't test (per my testing rules).
     - **Implementation notes**: files, modules, C4 code elements, edge cases, out of scope.
   - `zac`/`both` stories:
     - **Guide**: numbered steps for me.
     - What the agent prepares in advance (copy, configs, checklists).
     - What to record afterwards (account exists, where credentials live — never the credentials).
4. Ask me only about genuine ambiguity. Don't invent requirements.
5. Set `status: ready` and run `ctx.mjs validate`.

Next: I review and commit, then run `/implement-story` in a fresh session.
