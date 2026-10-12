# Project context library

All project knowledge, technical and business, lives in `project-context/`. Conventions are in `project-context/README.md`; read only the section you need.

## Reading
- `10k/` is current truth. Every other stage is in flight and provisional.
- Before any task that needs project context, spawn `context-scout` and work from its summary and links.
- Beyond that: load only linked docs, read Summary sections before whole docs, and follow at most 5 link hops per question. Still stuck? Spawn `context-scout` for a wide search (tags + every `index.json`) rather than searching yourself.
- Navigate with `jq`/`grep` over `index.json`, `tags.json` and `state.json`. Never bulk-read folders.

## Writing
- Every doc gets frontmatter (`title`, `shortDescription`, `tags`), opens with `## Summary` and ends with `## Related`.
- Hubs (`README.md` in an item) are signposts only. Item progress lives in `state.json` and story status lives in story frontmatter.
- Script-managed, never hand-edited: `index.json` and `state.json`. Use `node .claude/scripts/ctx.mjs` (`state`, `unknown`, `known`, `decision`, `move`, `merge`, `tags`). Finish every workflow command with `ctx.mjs validate` and fix what it reports.
- Links inside an item folder are relative. All other links start with `/project-context/`.
- Reuse tags from `tags.json`. Add one with `ctx.mjs tags add` only when none fit.
- Document only what matters beyond this session. Replace outdated content; git is the history.
- Never write secrets (logins, API keys, customer personal data) anywhere in the repo.

## Git
Workflow commands leave changes unstaged for Zac to review and commit. Exceptions: committing raw files he approves in `/ideate`, the deletion commits in `/kill` and `/retro`, and epic branch creation in `/break-down-epic`.

## Workflow friction
If you notice the workflow itself causing problems, or Zac seems frustrated with how a workflow command played out, ask: "Want me to raise that as a workflow improvement?" If he says yes, invoke `raise-workflow-improvement` with a concrete description: what happened, which command or file, and what would have been better.
