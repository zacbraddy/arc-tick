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

## Related
- [Task 1 brief](/TASK_1.md)
- [Business constraints](/project-context/10k/business-constraints.md)
- [ADR-0002: Draw results keep as-at-draw ranges](/project-context/10k/technical/adrs/0002-draw-results-keep-as-at-draw-ranges.md)
