---
title: Biomarker history
shortDescription: What members get from the biomarker history chart, what their data looks like, and the known gaps (screen-reader equivalent, one-sided bands, unit changes).
tags: [biomarkers, constraints]
---

## Summary
Every marker card on home has a "History" toggle. It opens an inline chart of that biomarker over time: one point per draw, reference bands that step to each draw's own ranges, and tooltips with value, unit, date, status and the optimal range. The latest value stays visible on the card. The open gaps are a screen-reader equivalent, one-sided bands and unit changes.

## What members get
- An inline panel under the card, not a modal or a separate page. The data loads the first time it's opened. If it fails, the panel shows the error, and opening it again retries.
- Each value is shown against the ranges it was reported with, not today's catalogue ([ADR-0004](/project-context/10k/technical/adrs/0004-charts-use-as-at-draw-ranges.md)).
- "No history yet" and "Chart unavailable" messages replace the chart when it can't be drawn.

## What member data looks like
- Members have 2–6 draws, with 2–5 points per biomarker. A biomarker can be missing from some draws.
- Each biomarker uses one unit per member. Ingest rejects any draw whose unit doesn't match.
- Reference ranges drift between draws for 6 of the 30 biomarkers: `ldl`, `apob`, `hs_crp`, `hba1c`, `fasting_insulin` and `vitamin_d`.
- Real lab data is expected to bring single draws, gaps, same-date draws, one-sided ranges and unit changes. The endpoint and chart guard the cheap ones.

## Known gaps
- **No screen-reader equivalent.** [TASK_1](/TASK_1.md) says a table alone isn't enough, but the chart itself is tooltip-only. Planned fix: a visually hidden list of the same points in each panel.
- **One-sided bands aren't drawn.** For example, a range with only "< 100" is skipped.
- **Unit changes between draws** can't happen yet, and nothing handles them.

## Related
- [ADR-0003: Per-series history endpoint](/project-context/10k/technical/adrs/0003-per-series-history-endpoint.md)
- [ADR-0004: Charts use as-at-draw ranges](/project-context/10k/technical/adrs/0004-charts-use-as-at-draw-ranges.md)
- [Business constraints](/project-context/10k/business-constraints.md)
