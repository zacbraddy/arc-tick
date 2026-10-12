---
title: History API shape bake-off
shortDescription: u2 answer. A per-biomarker history endpoint beats inlining history in /api/home, which goes over the 35 ms budget at 50 draws
tags: [biomarkers, performance, data-store]
---

## Summary
We tested inlining every biomarker's history in `GET /api/home` (Option A) against adding `GET /api/biomarkers/{id}/history` and leaving home alone (Option B). On seed data both pass easily. With a member padded to 50 draws, A's p95 is 55 ms, over the 35 ms budget, while B's history endpoint is 10.5 ms and home is unchanged at 3.5 ms. **Decision: Option B.** Task 2 can reuse the same per-series endpoint pattern. Evidence tier A (our own measurements).

## Setup
- Spike: [spikes/history-endpoint-bench/](../spikes/history-endpoint-bench/README.md). Both options are mounted beside the real app, running on copies of `dev.db` on port 8001.
- Each option reads the whole `results:{id}` partition with `store.query` and walks every draw. A returns the history for all 30 markers. B filters to one marker (`ldl_cholesterol`).
- `scripts/bench.py --n 200`, serial, with request logging on (the same for every option). Local laptop.
- Padded DB: user-1 had 5 seed draws. We re-dated copies of them to reach 50 draws, which stands in for a long-tenured member.

## Results (p95, ms)
| Member (draws) | `/api/home` today | A: home + all history | B: one-marker history |
|---|---|---|---|
| James (5) | 5.0 | 8.4 | 2.5 |
| Priya (3) | 2.9 | 6.7 | 2.9 |
| Tom (6) | 2.6 | 7.9 | 2.8 |
| Sofia (2) | 3.1 | 7.4 | 3.2 |
| James padded (50) | 3.5 | **55.1** ❌ | 10.5 |

## What it means
- A costs about 1 ms per draw on the budgeted endpoint. That's mostly Pydantic validation of 30 results × ranges for every draw. It passes today and fails once a member has roughly 35 or more draws.
- B costs about 0.17 ms per draw. That cost is off the home budget and is only paid when a member opens a chart.
- B still reads the whole partition because the store has no per-biomarker index. It would reach about 35 ms at roughly 200 draws. That's fine for now, but it's the ceiling if history ever goes on a budget.

## Unknown unknowns
- Task 2's wearable persistence may write into `results:{id}` (`ReadingPayload.created_draw` hints at that) or into its own partition. If it shares the partition, every history read pays for wearable docs too. Logged as a new unknown.

## Related
- [Hub](../README.md)
- [Business constraints](/project-context/10k/business-constraints.md)
- [ADR-0001: Partitioned document store](/project-context/10k/technical/adrs/0001-partitioned-document-store.md)
