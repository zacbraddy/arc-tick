---
title: Biomarker history plan
shortDescription: Scope, thin vertical slices, test strategy, risks and candidate ADRs for Task 1's biomarker history chart
tags: [biomarkers, architecture, constraints, performance]
---

## Summary
Each marker card on home gets a "History" toggle. It expands inline, lazily fetches `GET /api/biomarkers/{id}/history` and draws a Chart.js line. Each point sits on stepped bands showing that draw's own ranges, and the tooltip carries the value, unit, date and status. Build order is API slice, then chart slice, then NOTES.md, and each one leaves working software. `/api/home`, the store API and `app/auth.py` stay untouched.

## Scope
- `GET /api/biomarkers/{id}/history` returns `{biomarker: {id, name, unit}, points: [{tested_at, value, unit, status, ranges}]}`, oldest point first, for the signed-in member only.
- A "History" toggle on each marker card that expands inline and shows the chart below it.
- The chart: a linear time x-axis (epoch ms with formatted ticks, so there's no date-adapter dependency), stepped as-at-draw bands, and tooltips with value, unit, date and status.
- A screen-reader list of the same points next to the canvas, which costs about 5 lines.
- The edge-case guards in [data-survey](data-survey.md).
- NOTES.md covering the assumptions, the edge cases and known limitations.

## Out of scope
- Any change to `/api/home` (d1), ingest code, the store API or `auth.py`.
- Unit conversion, a modal or detail route, comparing biomarkers, wearables (Task 2).

## Approach
### Layout and interaction (u3)
| Option | Cost | Verdict |
|---|---|---|
| **Inline expand under the card** | One toggle button with `aria-expanded` (the perf.js pattern) and one canvas | ✅ Cheapest. Keeps the latest value visible, no focus trap |
| Modal | Focus trap, escape handling, scroll lock | Too costly for the time-box |
| Detail view or route | Routing plus back navigation | Too costly, and it hides the home context |

### Thinnest slice (u1)
1. **API slice:** route in `app/routes/history.py` plus Pydantic payload models in `app/models.py`. Reads `results:{id}` and filters to the biomarker. Tests first. *Working at the end:* curl the endpoint and get history.
2. **Chart slice:** toggle, fetch, Chart.js line with points and tooltips, plus the empty state. Bands are drawn by a small inline plugin that paints a rect from each draw to the next for each band. *Working at the end:* the history chart opens and shows in the browser.
3. **NOTES.md** with assumptions and edge cases.
4. *Extras if there's time:* the screen-reader list, pinning bands to the axis edge when they're one-sided, and a bench check that home p95 hasn't moved.

## Test strategy
- **Unit or integration (pytest, FastAPI TestClient, as in `tests/test_home.py`):** points in date order; scoped to the member (another member's results never appear); biomarker missing from some draws is left out; `404` for an unknown id; `200` with empty points; each point keeps its as-at-draw ranges (a drifted biomarker such as `vitamin_d` shows different ranges per point); `401` without a session.
- **Frontend:** no JS test harness exists and adding one costs more than it gives back in 20 minutes. We check it by hand in the browser and say so in NOTES.md.
- **Not tested:** Chart.js rendering, Pydantic validation.

## Risks
- **Time:** the band plugin is the riskiest bit. Fallback: draw only the latest draw's optimal band as a box annotation, and note it.
- **Read cost:** history reads the whole partition and reaches about 35 ms at around 200 draws (see history-api-shape). Fine for now.
- **Task 2 sharing `results:{id}`** (u5) would slow history reads. That gets decided in Task 2.

## Success measures
- Every Task 1 requirement (k1, k2) is met, and you can check each one by hand in the browser.
- The new tests pass, the existing suite stays green, and home p95 hasn't changed.

## Candidate ADRs
- Per-biomarker history endpoint; `/api/home` stays lean (d1).
- History charts plot each point against its as-at-draw ranges, not the catalogue ranges (d2, which applies ADR-0002 to the UI).

## Related
- [Epic hub](README.md)
- [Data survey](data-survey.md)
- [History API shape](origins/biomarker-history/shaping-content/history-api-shape.md)
- [Task 1 brief](/TASK_1.md)
