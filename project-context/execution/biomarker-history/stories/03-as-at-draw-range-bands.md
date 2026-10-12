---
title: As-at-draw range bands
shortDescription: Stepped improve/good/optimal bands behind the history line, each draw using its own as-at-draw ranges
tags: [biomarkers, codebase]
status: draft
owner: both
dependsOn: [02]
---

## Summary
Draws the reference ranges on the chart (k1) as stepped bands, one set per draw, applying ADR-0002 to the UI (d2). This is the epic's riskiest piece, so it has its own story with a fallback.

## Outcome
In the browser, each history chart shows improve/good/optimal bands behind the points. A drifted biomarker such as `vitamin_d` shows the bands stepping where its ranges changed. Tooltips show that draw's optimal range.

**Fallback** if the plugin overruns: draw only the latest draw's optimal band as a box, and record the limitation for NOTES.md.

## Scope
- `bandPlugin` (`beforeDatasetsDraw`): for each point, fill rects from this draw's x to the next draw's x. The last one runs to the chart edge.
- Skip a missing band without failing (d3).

## Links
- [C4 code: client](../c4/4-code.md#client-appstatic)
- [Plan: risks](../plan.md#risks)
- [Data survey](../data-survey.md)
- [ADR-0002](/project-context/10k/technical/adrs/0002-draw-results-keep-as-at-draw-ranges.md)

## Related
- [Epic hub](../README.md)
- [02 Inline history chart](02-inline-history-chart.md)
