---
title: "ADR-0004: History charts plot each point against its own as-at-draw ranges"
shortDescription: Biomarker history charts draw stepped reference bands from each draw's stored ranges and show stored status; nothing is reclassified against the current catalogue.
tags: [biomarkers, architecture]
---

## Summary
A history chart draws each point against the reference ranges stored on that draw's result, as bands that step at each draw date. The status shown is the stored status. Nothing is recomputed from the current `BiomarkerDefinition`. Status: accepted (resolves the open consequence in [ADR-0002](/project-context/10k/technical/adrs/0002-draw-results-keep-as-at-draw-ranges.md)).

## Context
- In the seed data, ranges drift between draws for 6 of the 30 biomarkers: `ldl`, `apob`, `hs_crp`, `hba1c`, `fasting_insulin` and `vitamin_d`. Plotting them against the catalogue's current ranges would misreport past results.
- A past result should read the way it was reported.

## Decision
- The history endpoint returns each point's `ranges` and `status` exactly as stored, and the server never calls `band_for`.
- `bandPlugin` in `app/static/app.js` paints each band from one draw date to the next. It's registered per chart, so the `perf.js` charts aren't affected. Band colours come from CSS variables, and `validBand` skips malformed or one-sided bands.
- The tooltip shows value, unit, date, status and that draw's optimal range.

## Consequences
- Any future chart of past results follows this rule.
- One-sided bands aren't drawn at all yet. Pinning them to the axis edge is a known follow-up.
- A unit change between draws isn't handled. Ingest rejects unit mismatches today, so it can't happen yet.

## Related
- [ADR-0002: Draw results keep as-at-draw ranges](/project-context/10k/technical/adrs/0002-draw-results-keep-as-at-draw-ranges.md)
- [ADR-0003: Per-series history endpoint](/project-context/10k/technical/adrs/0003-per-series-history-endpoint.md)
