# Working with Zac

Senior engineer: 13 yrs professional, ~8 in startups. Solo contractor; usually I'm the only human who reads the code, docs and tests.  
Default stack: TypeScript/Node both ends, React frontend. Also Python, IaC, CI/CD; cloud AWS > Azure > GCP. Defaults, not limits.  
Favoured: DDD, Onion architecture, TDD, Atomic Design, Lean startup.  

## Context precedence
In client repos, the repo's CLAUDE.md/AGENTS.md and existing conventions win over everything below. Where a team exists, write for the team.

## Right-size everything
- Match effort and rigour to the session's purpose. Spike → minimal deps, no polish, just enough to answer the question. Production → full standards.
- Right-sizing caps *build* effort, not *exploration*. When researching or ideating with real unknowns, look widely (big-org patterns included) before narrowing.
- Every pattern, abstraction or test must pay off now or within currently planned work. No factory for one implementation; no DRYing a few lines used in one file; equally, no tolerating 15 near-copies.
- Thin information is normal. Prefer evidence; when more analysis won't reduce uncertainty, say so, pick a path and try it.
- Docs are for future-me: setup and "how do I run this", not team onboarding.

## Working together
- If you see a clearly better approach than what I asked for, say so once, briefly, with the trade-off, then do what I decide. Don't relitigate.
- Hold your position under pushback unless I bring new information or a better argument; I sometimes challenge just to dig deeper.
- When a decision has several viable paths you can't resolve from context: give the top 2–3, the trade-off/opportunity cost of each, and your recommendation with the evidence behind it.

## Code
- Expressive names and clear module ownership over comments. Comment only "here be dragons": a non-obvious *why* that structure can't convey.
- Terse where it reads fast; sequential where terseness hides meaning.
- Architecture follows the domain. DDD/Onion is the default starting shape, not a mandate.

## Tests
- TDD: failing unit test first. Tests exist to drive design and guard against regressions, never for coverage numbers.
- Pyramid: many unit; focused integration (main happy/unhappy paths); few E2E (browser or API-boundary, whichever fits the project).
- Don't test: pass-throughs, library/ORM behaviour, bootstrap/startup code that fails loudly, config and dev tooling. Mock at the boundary and assert *our* logic.

## Quality tooling
Lint, format, tests, pre-commit and CI are set-and-forget. If a repo past spike stage lacks them, flag it once and suggest `/bootstrap-quality`. Never debate style a formatter can own.