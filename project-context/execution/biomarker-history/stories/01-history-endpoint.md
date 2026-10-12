---
title: History endpoint
shortDescription: GET /api/biomarkers/{id}/history returns the signed-in member's points for one biomarker, oldest first, with as-at-draw ranges
tags: [biomarkers, codebase]
status: draft
owner: agent
dependsOn: []
---

## Summary
Adds the per-biomarker history endpoint (d1), built test-first. `/api/home`, the store API and `app/auth.py` stay untouched.

## Outcome
`curl /api/biomarkers/{id}/history` with a session returns `{biomarker: {id, name, unit}, points: [{tested_at, value, unit, status, ranges}]}` oldest first, and `tests/test_history.py` is green alongside the existing suite.

## Scope
- `app/models.py`: `HistoryPoint`, `HistoryBiomarker`, `HistoryPayload`.
- `app/routes/history.py`: the pure `history_points(draws, biomarker_id)` plus the `biomarker_history` route (`404` for an unknown id, `meta: {count}`).
- `app/main.py`: `include_router(history.router)`.
- `tests/test_history.py`: order, member scoping, missing-from-draw, `404`, empty `200`, drifted per-point ranges, `401`.

## Links
- [C4 code: server](../c4/4-code.md#server)
- [C4 code: tests](../c4/4-code.md#tests-testshistorypy-new)
- [Plan: test strategy](../plan.md#test-strategy)
- [Data survey](../data-survey.md)

## Related
- [Epic hub](../README.md)
- [02 Inline history chart](02-inline-history-chart.md)
