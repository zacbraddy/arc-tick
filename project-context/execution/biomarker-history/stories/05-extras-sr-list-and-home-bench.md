---
title: "Extras: screen-reader list and home bench"
shortDescription: Optional polish. Screen-reader list of history points and a bench check that /api/home p95 hasn't moved
tags: [biomarkers, performance]
status: draft
owner: agent
dependsOn: [02]
---

## Summary
Optional. Only do this if the time-box allows after 01–04.

## Outcome
Each history panel includes a visually hidden list of the same points (date, value, unit, status) for screen readers. A bench run shows `/api/home` p95 is unchanged and within 35 ms (k4).

## Scope
- About 5 lines in `loadHistory` plus a visually hidden style.
- Re-run the existing bench spike against home.
- Optional: pin one-sided bands to the axis edge.

## Links
- [Plan: thinnest slice extras](../plan.md#thinnest-slice-u1)
- [Bench spike](../origins/biomarker-history/spikes/history-endpoint-bench/README.md)

## Related
- [Epic hub](../README.md)
- [02 Inline history chart](02-inline-history-chart.md)
