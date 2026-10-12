---
title: History endpoint
shortDescription: GET /api/biomarkers/{id}/history returns the signed-in member's points for one biomarker, oldest first, with as-at-draw ranges
tags: [biomarkers, codebase]
status: done
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

## Done when
- `scripts/test` is green, with the new `tests/test_history.py` cases passing alongside the existing suite.
- With the dev server running and a `peak_session` cookie for user-1, `curl /api/biomarkers/vitamin_d/history` returns user-1's 5 points oldest first, and the `ranges` differ between draws.
- `git diff` shows no changes to `app/routes/home.py`, `app/auth.py` or `app/store.py`.

## Acceptance criteria
- Given a signed-in member with draws containing biomarker X, when they GET `/api/biomarkers/X/history`, then they get `200` and `{data: {biomarker: {id, name, unit}, points: [...]}, meta: {count}}`, with points oldest first by `tested_at`.
- Given draws stored out of order, including two on the same day at different times, when history is requested, then every draw appears and they are ordered by `tested_at`.
- Given X's ranges changed between draws, when history is requested, then each point carries the `ranges` and `status` stored on its own draw, with nothing recomputed.
- Given a draw that lacks X, when history is requested, then that draw contributes no point.
- Given another member also has X results, when member A requests history, then only A's points come back.
- Given a valid biomarker id and a member with no results for it, when history is requested, then they get `200` with `points: []` and `meta.count: 0`.
- Given an id with no biomarker definition, when history is requested, then they get `404`.
- Given no session cookie, or a cookie for an unknown member, when history is requested, then they get `401` from `current_user`.

## Test plan
- **Unit (`history_points`, pure):** ordering from out-of-order draws (same-day different times included), missing-from-draw skipped, per-point ranges/status preserved from drifted draws, empty input → `[]`.
- **Integration (`TestClient` via conftest `client`/`signed_in`, `home_data`-style seeding fixture):** happy path shape plus `meta.count`, member scoping (user-1 vs user-2, both logged in on the same client), `404` for an unknown id, empty `200`, and `401` parametrized over `session` = [None, "missing-member"] as in `test_home.py`.
- **E2E:** none. The manual curl check in Done when covers it, and chart behaviour belongs to story 02.
- **Won't test:** Pydantic serialisation/validation, store `query` ordering, the `current_user` internals, unit handling (it is a straight copy, and there is no conversion by design), and router registration beyond what the integration tests already exercise.

## Implementation notes
- **`app/models.py`:** add `HistoryPoint {tested_at: str, value: float, unit: str, status: str, ranges: Ranges}`, `HistoryBiomarker {id, name, unit}` and `HistoryPayload {biomarker, points: list[HistoryPoint]}` in the response models section. Reuse the existing `Ranges`.
- **`app/routes/history.py` (new, flat module, no service layer per d5):** copy `home.py`'s shape:
  - Module setup: `router = APIRouter(prefix="/api")` and `DEFINITIONS = "biomarker"`.
  - `history_points(draws, biomarker_id)` takes an iterable of `ResultsDocument`. For each draw it finds the result whose `biomarker_id` matches and copies `value/unit/status/ranges` with the draw's `tested_at`. Sort by `tested_at`, which is cheap insurance even though `store.query` already yields in sk order.
  - `biomarker_history(biomarker_id, member=Depends(current_user), store=Depends(get_store))` uses `@router.get("/biomarkers/{biomarker_id}/history", response_model=Envelope[HistoryPayload])`. It loads the definition with `store.get(DEFINITIONS, biomarker_id, BiomarkerDefinition)` and raises `HTTPException(404)` if that returns None. Then it reads the draws from `store.query(f"results:{member.id}", ResultsDocument)` and returns `Envelope(data=..., meta={"count": len(points)})`.
  - `HistoryBiomarker.unit` comes from the definition. Each point keeps its own result unit.
- **`app/main.py`:** `include_router(history.router)`.
- **Edge cases (d3):** a draw with an identical `tested_at` merges at the store (ADR-0002), so only same-day draws at different times can occur, and ISO string order handles them. Each guard gets one test and is listed in NOTES.md (story 04).
- **Status:** copied straight from the stored result. Don't call `band_for` (ADR-0002).
- **Deviation (Done when):** user-1 has 5 draws but vitamin_d is in only 3 of them (2025-03-18 and 2026-03-04 lack it), so the curl check returns 3 points, not 5. The optimal band drifts from 50–80 to 60–90 at the 2026-09-01 draw. That's the expected missing-from-draw behaviour, and the story's "5 points" was a misreading of the survey.
- **Out of scope:** `/api/home`, ingest, the store API, `auth.py`, unit conversion, the frontend, and u5 (wearable docs in `results:{id}` are a Task 2 performance concern, not behaviour).

## Review
`scripts/test`: 57 passed, 1 xfailed. Every acceptance criterion has a test. Implementation matches C4 4-code and the plan. `home.py`, `auth.py` and `store.py` are untouched. A TestClient run against `dev.db` as user-1 returned 3 vitamin_d points oldest first, and optimal moved from 50–80 to 60–90 at 2026-09-01, which matches the Deviation note.

- **must-fix:** none.
- **should-fix:** none.
- **nit (fixed):** `tests/test_history.py:150-172`: the integration happy path re-asserts drifted ranges and status. The unit test at `tests/test_history.py:75` already covers that. Order, shape and `meta.count` would be enough here.

## Related
- [Epic hub](../README.md)
- [02 Inline history chart](02-inline-history-chart.md)
