---
name: bootstrap-quality
description: Sets up set-and-forget quality tooling (linting, formatting, test runner, pre-commit hooks, CI checks) for the repo's languages. Use when the user runs /bootstrap-quality, asks to set up linting, formatting, pre-commit or CI checks, or when /bootstrap-repo reaches its quality tooling step. Don't run it unprompted just because a repo lacks tooling; flag that instead.
---

# Bootstrap quality tooling

1. Detect languages, package manager and anything already configured. Report in ≤5 bullets. Extend existing setups; never replace without asking.
2. Propose the minimal set per language, preferring what the repo/ecosystem already uses. Defaults: TS → ESLint + Prettier + Vitest; Python → Ruff + pytest; .NET → dotnet format + xUnit. Wait for go-ahead.
3. Install and configure. The formatter owns style; lint rules only for correctness and real smells.
4. Pre-commit (Husky + lint-staged for JS/TS; pre-commit for Python): format + lint staged files only. Keep it fast; full tests run in CI.
5. CI: one workflow running lint, typecheck and tests on push/PR, using the repo's existing CI provider if there is one.
6. Verify: run every command once, show it passing, and add a short "Running checks" note to the README setup section.
7. Don't write tests for any of this tooling.