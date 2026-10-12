---
title: Inline history chart
shortDescription: History toggle on each marker card expands into a Chart.js line with inspectable tooltips and an empty state
tags: [biomarkers, codebase]
status: draft
owner: both
dependsOn: [01]
---

## Summary
The client half of the thinnest slice (d4). Each marker card gets a History toggle that expands inline, lazily fetches the endpoint once, and draws a Chart.js line. Bands come in story 03.

## Outcome
In the browser, clicking History on any card shows that biomarker's history as a line in date order. Hovering a point shows its value, unit, date and status. A biomarker with no points shows "No history yet". The card still shows the latest value and unit (k1). Zac checks it by hand.

## Scope
- `renderMarker`: History button (`aria-expanded`, `aria-controls`) and a hidden panel holding a canvas.
- `toggleHistory`: flips the state, loads on first open, reuses the chart afterwards.
- `loadHistory`: `api(...)`, empty state, `new Chart` on a linear epoch-ms x-axis with `formatDate` ticks (no date adapter).
- `.history-*` styles in `styles.css`.

## Links
- [C4 code: client](../c4/4-code.md#client-appstatic)
- [C4 components: browser client](../c4/3-components.md#browser-client)
- [Plan: layout and interaction](../plan.md#layout-and-interaction-u3)

## Related
- [Epic hub](../README.md)
- [01 History endpoint](01-history-endpoint.md)
- [03 As-at-draw range bands](03-as-at-draw-range-bands.md)
