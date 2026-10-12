---
title: Biomarker data survey
shortDescription: What data/biomarkers actually contains for history charts — range drift across draws and which edge cases are real
tags: [biomarkers]
---

## Summary
Ranges drift between draws for 6 of 30 biomarkers, so each point is plotted against its own as-at-draw range, as ADR-0002 requires. The seed data is clean (no single draws, nulls or one-sided ranges), but we still guard cheaply against the common edge cases real lab data would bring, and stop short of trying to be infallible.

## Findings (4 members, 30 catalogue biomarkers)
| Member | Draws | Points per biomarker | Ranges change across draws |
|---|---|---|---|
| user-1 | 5 | 3–5 | ldl, apob, hs_crp, hba1c, fasting_insulin, vitamin_d |
| user-2 | 3 | 2–3 | ldl, apob, fasting_insulin, vitamin_d |
| user-3 | 6 | 2–5 | ldl, apob, hs_crp, hba1c, fasting_insulin, vitamin_d |
| user-4 | 2 | 2 | apob, vitamin_d |

- Every result has the same shape: `biomarker_id, value, unit, status, ranges, source`. No nulls.
- Every band (`optimal`/`good`/`improve`) has both `min` and `max`, both in results and in the catalogue.
- Each biomarker has one unit per member, so there's no unit conversion.
- The ranges in the latest results drift away from the catalogue's `ranges`, so the catalogue isn't the truth for any given point.

## Choices
- **u2:** plot each point against its own as-at-draw bands, drawn as stepped bands that change at each draw date. The tooltip shows the value, unit, date, status and that draw's optimal range.
- **u4:** the seed data is clean, but real lab data won't stay that way. We guard against the common failures it hints at, with one cheap guard each, and stop short of trying to be infallible. Each guard gets a test, and NOTES.md lists all of them.

| Edge case | Where | Handling |
|---|---|---|
| Unknown biomarker id | API | `404` |
| No results for this biomarker | API → UI | `200` with empty `points`; UI shows "No history yet" |
| Single draw | UI | Plot the one point with its bands; pad the x-domain so it doesn't collapse |
| Biomarker missing from some draws | API → UI | Leave that draw out; the linear time x-axis keeps the spacing honest |
| Two draws on the same date | API | Sort by `tested_at` and keep both |
| Band one-sided, null or missing | UI | Skip that band and still plot the point (`Ranges` validates at ingest, so this is belt and braces) |
| Unit changes between draws | API → UI | No conversion. Each point carries its own unit in the tooltip; NOTES flags it as a known limitation |
| Value outside every band | UI | The y-axis covers both the values and the bands, so outliers aren't clipped |
| Another member's data | API | Read scoped to `current_user`; tested |

## Related
- [Epic hub](README.md)
- [ADR-0002: Draw results keep as-at-draw ranges](/project-context/10k/technical/adrs/0002-draw-results-keep-as-at-draw-ranges.md)
- [History API shape](origins/biomarker-history/shaping-content/history-api-shape.md)
