---
title: "ADR-0003: Biomarker history is fetched on demand from its own endpoint"
shortDescription: GET /api/biomarkers/{id}/history serves one biomarker's history lazily; /api/home carries only latest values. Includes the measured per-draw cost of growing home.
tags: [architecture, performance, biomarkers, data-store]
---

## Summary
One biomarker's history is served by `GET /api/biomarkers/{id}/history` and fetched by the client only when a member opens that chart. `/api/home` carries only the latest values, which protects its 35 ms p95 budget. Status: accepted.

## Context
- History of one biomarker means reading every draw document in `results:{member_id}` ([ADR-0001](/project-context/10k/technical/adrs/0001-partitioned-document-store.md)), and the cost grows with how long a member has been with us.
- Bench at 50 draws: putting all history in home gives **55.1 ms p95**, over budget, at roughly **1 ms per draw** on the budgeted path. A separate endpoint gives **10.5 ms**, and home stays at **3.5 ms**. Inline history breaks the budget at around 35 draws.
- Reading a whole partition costs about **0.17 ms per draw**, so a history read reaches about 35 ms at around 200 draws.

## Decision
- `app/routes/history.py` handles the route. It reads one partition query on `results:{current_user.id}`, passes the result to the pure function `history_points(draws, biomarker_id)` to filter and sort it, and returns `Envelope{data: HistoryPayload, meta: {count}}`. It returns 404 for an unknown biomarker, 200 with no points when there are none, and 401 without a session.
- The client fetches on first open, retries on the next open after a failure, and keeps the chart instance for re-opening.
- `/api/home` doesn't change for history.

## Consequences
- Home's cost stays flat however long a member's history gets. Each chart open costs one round trip.
- **Task 2 is different:** [TASK_2.md](/TASK_2.md) requires the wearable chart data to come through `/api/home`. Don't copy this lazy pattern there. Size the 30-day series against home's ~1 ms per draw cost, and give wearables their own partition (for example `wearables:{member_id}`) so history reads don't pay for them.
- Past a few hundred draws per member, history needs a per-biomarker partition or a per-series document.

## Related
- [ADR-0001: Partitioned document store](/project-context/10k/technical/adrs/0001-partitioned-document-store.md)
- [ADR-0004: Charts use as-at-draw ranges](/project-context/10k/technical/adrs/0004-charts-use-as-at-draw-ranges.md)
- [Business constraints](/project-context/10k/business-constraints.md)
- [C4 context and containers](/project-context/10k/technical/architecture/c4-context-containers.md)
