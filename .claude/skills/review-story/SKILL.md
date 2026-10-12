---
name: review-story
description: Reviews an implemented story with fresh eyes, treating the staged changes as the implementation, and leaves its fixes unstaged so the two layers can be compared. Use when the user runs /review-story.
disable-model-invocation: true
argument-hint: "[optional story path]"
---

# /review-story

Run this in a session that didn't implement the story.

1. Pick $ARGUMENTS, or the lowest-numbered `implemented` story. The implementation is the **staged** changeset: `git diff --staged`. If nothing is staged, stop and ask.
2. Read the story and its linked C4 or plan sections. For code, run the tests.
3. Review against:
   - **all stories:**
     - the Done-when evidence is present;
     - the acceptance criteria are met;
     - it conforms to the plan.
   - **code:**
     - conformance to C4;
     - my coding and testing rules (right-sized tests, no testing libraries, comments only where there be dragons);
     - correctness, security and performance red flags;
     - simplicity, and whether every abstraction earns its place.
   - **non-code artefacts:**
     - accuracy against the evidence in `origins/` and `10k/`;
     - clarity and fitness for the audience;
     - no secrets or personal data committed.
4. Write `## Review` into the story with findings ranked **must-fix / should-fix / nit**, each with a file:line reference. Keep it short.
5. Ask which to fix, then apply them **without staging**, so I can compare unstaged (review) against staged (implementation). Re-run the tests.
6. Set `status: done` and run `ctx.mjs validate`. If every story in the epic is done, say so: next is `/retro` in a fresh session.
