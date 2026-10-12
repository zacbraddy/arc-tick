---
name: implement-story
description: Implements the next ready story against its spec. Test-first for code; a guided walkthrough for stories Zac owns. Use when the user runs /implement-story.
disable-model-invocation: true
argument-hint: "[optional story path]"
---

# /implement-story

1. Pick $ARGUMENTS, or the lowest-numbered `ready` story whose dependencies are done. Read the story and only the C4 or plan sections it links to. Confirm you're on `epic/<slug>`.
2. Work by owner.

**`agent` (code):**
- TDD loop for each acceptance criterion: failing test → pass → refactor. Follow the test plan.
- Finish by running the project's full test, lint and typecheck commands. Everything passes, or you tell me exactly what doesn't and why.

**`agent` (non-code artefact):** produce the artefact, then check it against every acceptance criterion.

**`zac` / `both`:**
- Prepare everything you can first.
- Walk me through the Guide one step at a time, waiting for me to confirm each step.
- Record the outcome as the **Done when** evidence asks (never secrets).

3. Deviations: a small one gets a line under `## Implementation notes`. A significant one (it changes the plan, C4 or a decision) means **stop and ask me**.
4. Set `status: implemented` (or `blocked` with `blockedReason` and `revisit` if something external stalls it). Run `ctx.mjs validate`.
5. Report: files changed, test results, and what I should look at with my own eyes. **Don't stage or commit.** I review, iterate with you, then stage it myself.

Next: `/review-story` in a fresh session.
