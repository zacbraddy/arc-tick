---
title: Biomarker history
shortDescription: Epic for Task 1. Per-biomarker history endpoint and an inspectable chart against reference ranges, reachable from home
tags: [biomarkers, constraints, performance]
---

## Summary
Delivers Task 1: members open a chart of any biomarker's history from the home screen, with inspectable values plotted against reference ranges. It is backed by a new `GET /api/biomarkers/{id}/history` endpoint, and `/api/home` stays untouched to protect its 35 ms p95 budget. The chart and endpoint pattern is the one Task 2 (wearables) will reuse.

## What's here
- API shape (d1): [history-api-shape](origins/biomarker-history/shaping-content/history-api-shape.md)
- Bench spike: [history-endpoint-bench](origins/biomarker-history/spikes/history-endpoint-bench/README.md)
- Data survey (u2, u4: ranges and edge cases): [data-survey](data-survey.md)
- Plan (scope, slices, tests, risks): [plan](plan.md)
- Stories: [01 endpoint](stories/01-history-endpoint.md), [02 chart](stories/02-inline-history-chart.md), [03 bands](stories/03-as-at-draw-range-bands.md), [04 NOTES.md](stories/04-notes-md.md), [05 extras](stories/05-extras-sr-list-and-home-bench.md)
- C4: [context](c4/1-context.md), [containers](c4/2-containers.md), [components](c4/3-components.md), [code](c4/4-code.md)

## Related
- [Task 1 brief](/TASK_1.md)
- [Business constraints](/project-context/10k/business-constraints.md)
- [ADR-0002: Draw results keep as-at-draw ranges](/project-context/10k/technical/adrs/0002-draw-results-keep-as-at-draw-ranges.md)
