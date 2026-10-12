---
title: Business constraints — Peak take-home
shortDescription: The Peak assessment brief, its submission rules and evaluation criteria, and the hard technical rules Zac has adopted as binding.
tags: [constraints, performance]
---

## Summary
This repo is Zac's submission for Peak's engineering take-home. Phase 1 is one hour of solo work, followed the same day by a one-hour paired walkthrough and live-coding session (Phase 2). The brief's rules are binding constraints, confirmed by Zac (tier A). No other limits are known outside the brief. Source: `README.md`, `TASK_1.md`, `TASK_2.md`.

## The assessment
| Phase | Duration | Format |
| --- | --- | --- |
| 1: Independent development | 1 hour | Take home; submit a public Git repo link at the end of the hour |
| 2: Presentation & live coding | 1 hour | Paired with a Peak engineer; walkthrough, then extending the code live |

- There are two tasks: [Task 1](/TASK_1.md) (biomarker history charts) and [Task 2](/TASK_2.md) (wearable ingest and 30-day charts). The guide is roughly 20 min for task 1 and the rest for task 2. Task 2 changes what a sensible task 1 looks like.
- Not finishing is expected. Phase 2 picks up wherever we stop, so the repo must be coherent at the hour: "three things that work and a clear account of the fourth".
- Phase 2 involves making changes live. Zac must understand everything submitted, so don't vibe-code.

## Submission
- Push to a public Git repository and share the link at the end of Phase 1.
- Put a `NOTES.md` at the repo root covering: assumptions where the brief was ambiguous (and why); the storage layout and what it makes cheap or expensive to read; what was left out and what comes next; and how AI tools were used. Bullets and brevity are fine.

## What's evaluated
- **Product behaviour:** readable charts, useful labels, inspectable values, sensible empty states.
- **Correctness:** member isolation, coherent date handling, API and UI agreeing.
- **Understanding of the code**, which is tested live in Phase 2.
- **Data modelling:** what the key layout makes cheap and expensive (there are no indexes or joins).
- **Product judgement:** the data holds more than the tasks ask for, and some of it disagrees with itself. Decide, and say what was decided.
- **Prioritisation:** how far we got, and whether it works. Omissions we can name are fine; unexplained half-work is not.
- **AI tool usage:** be ready to explain how and where AI was used.

## Hard rules
- **Store API is frozen.** Preserve `Store`'s public API (`app/store.py`) and use it for all persistence. No raw SQL bypass, and no second database. Internals may change. `tests/test_store_api.py` must not be edited. See [ADR-0001](/project-context/10k/technical/adrs/0001-partitioned-document-store.md).
- **`GET /api/home` ≤ 35 ms p95**, measured serially over HTTP on localhost by `scripts/bench.py` (`BUDGET_MS = 35`). It exits non-zero when over budget, and it must still pass once wearable data is imported, for every member.
- **Auth stays fake.** `app/auth.py` is deliberately simplified (the cookie holds the member ID) and must not be changed. Ingest endpoints stay unauthenticated.
- Everything else may change: document layouts, application logic and the client.

## Related
- [C4 context and containers](/project-context/10k/technical/architecture/c4-context-containers.md)
- [Project structure](/project-context/10k/technical/project-structure.md)
- [ADR-0001: Partitioned document store](/project-context/10k/technical/adrs/0001-partitioned-document-store.md)
- [ADR-0002: Draw results keep as-at-draw ranges](/project-context/10k/technical/adrs/0002-draw-results-keep-as-at-draw-ranges.md)
