---
title: NOTES.md
shortDescription: Re-bench /api/home against the 35 ms budget, then write the submission's NOTES.md (assumptions, storage, left out, AI usage)
tags: [biomarkers, constraints, performance]
status: ready
owner: agent
dependsOn: [01, 02]
---

## Summary
Writes the `NOTES.md` that the submission requires (see `/README.md` "Submission", plus k2). It covers what was built, what was assumed, how storage reads cost, what was left out, and how AI was used. It first re-benches `/api/home` so the note can state k4 (35 ms p95) holds after the build. That bench was pulled forward from story 05; the rest of 05 is skipped (see Implementation notes).

## Outcome
A fresh bench shows `/api/home` p95 within 35 ms for every seed member after the history work. `NOTES.md` exists at the repo root, quotes those numbers, and has the four sections that `/README.md` asks for, and it records the assumptions, the edge-case guards (d3), the decisions (d1, d2, d4–d6) and the known limits.

## Scope
- Run `scripts/bench.py` against the real app. No new code.
- One short file of bullets.

## Done when
- Bench output for `/api/home` (serial and `--concurrency 8`) for all four seed members, each serial p95 ≤ 35 ms, plus one `/api/biomarkers/vitamin_d/history` run for comparison.
- `NOTES.md` is at the repo root with these sections: Assumptions, Storage layout, Left out / next, AI usage.
- Every edge case in the [data survey](../data-survey.md) appears with its guard, and the guard matches the code.
- Story 05 and Task 2 are listed as not done, with the reasons why.
- `ctx.mjs validate` passes.

## Acceptance criteria
- Given a reviewer reads only `NOTES.md`, when they look for why history has its own endpoint, then they find d1 and the spike numbers (home p95 55 ms with history inlined vs 3.5 ms without; endpoint 10.5 ms).
- Given an edge case such as a one-sided band, when the reviewer checks the note, then it names the guard (`validBand` skips the band and the point still plots).
- Given the app is running on `dev.db`, when `scripts/bench.py --email <member>` runs for each seed member, then serial p95 for `/api/home` is ≤ 35 ms and the numbers go in NOTES.md.
- Given any member's home p95 is over 35 ms, when the bench finishes, then stop and flag it to Zac before writing NOTES.md (`/api/home` is meant to be untouched, so this means a regression to find, not a note to write).
- Given Task 2 wasn't started, when the reviewer reads Left out / next, then they see the wearables plan (u5: prefer a separate partition from `results:{id}`).

## Test plan
- No new tests. The bench run is the evidence for k4.
- The agent checks each code reference it cites against the code (file and function names, no line numbers).

## Implementation notes
- **Bench first** (from repo root):
  - Start the server in the background with `scripts/dev`, wait for it to come up, and stop it afterwards.
  - For each of `james.chen`, `priya.raman`, `tom.okafor`, `sofia.marek` `@example.com`: `uv run scripts/bench.py --email <m> --n 200`, then the same with `--concurrency 8`.
  - Once for comparison: `uv run scripts/bench.py --path /api/biomarkers/vitamin_d/history --n 200`.
  - Seed data only. The 50-draw padded run stays in the [spike](../origins/biomarker-history/spikes/history-endpoint-bench/README.md) numbers. (That README's paths still say `shaping/`; they now live under this epic's `origins/`.)
- **Don't repeat `/README.md`**: run steps, the data model and the storage API are already there. Link to them instead.
- **Assumptions**:
  - Points use their as-at-draw ranges (d2, ADR-0002).
  - Status is the stored status; `band_for` is not recomputed.
  - Units are not converted, and each point carries its own unit.
  - The chart is inline, with no modal (d4).
  - A failed fetch shows the error inline and retries on the next open (d6).
- **Edge cases**: take the list from the context summary in the [data survey](../data-survey.md). The guards are in `app/routes/history.py` (`history_points`), `app/static/app.js` (`validBand`, `valueExtent`, single-point ±30-day padding) and `tests/test_history.py`.
- **Storage layout**:
  - History reads the whole `results:{id}` partition. This is cheap for one member's draws, and about 35 ms at around 200 draws ([plan risks](../plan.md)).
  - `/api/home` is untouched, so its budget is protected (d1).
  - u5: if wearables are written into the same partition, history reads pay for them.
- **Left out / next**:
  - Task 2 (wearables) wasn't started.
  - Story 05 was skipped: screen-reader list and pinning one-sided bands. (Its home re-bench moved into this story.)
  - No JS test harness, so the frontend was checked by hand. Story 02's single-point, zero-point and unit-change cases were checked by reading the code only.
  - No unit conversion.
- **AI usage**: describe the agent workflow as it was actually run.
  - `project-context/` was the knowledge base.
  - The stages ran ideate/shape → plan-epic → write/implement/review-story, with subagents for context and review.
  - Zac reviewed and committed each story.
  - Keep it factual. Zac edits the tone in review.
- **Story 05 skipped (time-box)**:
  - The hour is up. The home re-bench moved here because it proves the task still meets k4. The rest of 05 was a "cherry on top" (it said "only if the time-box allows").
  - Dropping polish to land working core slices is the intended call under a tight deadline.
  - **At retro**: move story 05's content back into the workflow as an idea or shaping item (whichever fits `/retro`'s conventions), so a future dev-workflow run can pick it up. Don't just close it with the epic.
- **Out of scope**: Task 2 content beyond the "not started" note and the u5 plan.

## Links
- [Plan](../plan.md)
- [Data survey](../data-survey.md)
- [API shape (d1 numbers)](../origins/biomarker-history/shaping-content/history-api-shape.md)
- [Task 1 brief](/TASK_1.md)
- [Submission requirements](/README.md)

## Related
- [Epic hub](../README.md)
- [01 History endpoint](01-history-endpoint.md)
- [02 Inline history chart](02-inline-history-chart.md)
- [03 As-at-draw range bands](03-as-at-draw-range-bands.md)
- [05 Extras (skipped, bench moved here)](05-extras-sr-list-and-home-bench.md)
