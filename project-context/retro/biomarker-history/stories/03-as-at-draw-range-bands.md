---
title: As-at-draw range bands
shortDescription: Stepped improve/good/optimal bands behind the history line, each draw using its own as-at-draw ranges
tags: [biomarkers, codebase]
status: done
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
- Y-axis widened to cover the values and every valid band (deferred from 02).
- Tooltip adds that draw's optimal range (deferred from 02).

## Links
- [C4 code: client](../c4/4-code.md#client-appstatic)
- [Plan: risks](../plan.md#risks)
- [Data survey](../data-survey.md)
- [ADR-0002](/project-context/10k/technical/adrs/0002-draw-results-keep-as-at-draw-ranges.md)

## Done when
- Every Guide checkbox is ticked by Zac during `/implement-story` (or ✂ with a recorded reason). `/review-story` checks none are left unticked.
- `scripts/test` is still green; this story makes no server changes.
- `git diff` touches only `app/static/app.js` (and `styles.css` only if a band needs a style hook).
- If the fallback was taken, a deviation note says so and names the limitation for story 04.

## Acceptance criteria
- Given an open history chart, when it draws, then improve/good/optimal bands paint behind the line and points, never over them.
- Given a biomarker whose ranges drift (user-1 `vitamin_d`), when its chart draws, then each band steps at the draw where its ranges changed (optimal 50–80 → 60–90 at 2026-09-01).
- Given the latest draw, when bands draw, then its segment runs from its x to the right edge of the chart area.
- Given a single-point history, when it draws, then its bands run from the point to the right edge of the padded domain and nothing throws.
- Given a point whose band is missing, null, non-finite, or has `max <= min`, when bands draw, then that band is skipped for that segment, the other bands and the point still draw, and nothing throws.
- Given a value outside every band or bands wider than the values, when the chart draws, then the y-axis covers both, so neither the point nor the bands are clipped.
- Given a point is hovered, when the tooltip shows, then it adds "Optimal {min}–{max} {unit}" from that point's own ranges; if that point has no valid optimal band the line is omitted.
- Given the fallback is taken, when any chart draws, then only the latest point's optimal band shows, across the full chart width.

## Test plan
- **Unit/integration:** none. Same call as 02 and `plan.md#test-strategy`: there's no JS harness, and adding one for a canvas plugin doesn't pay back in the time-box. This overrides the data survey's "each guard gets a test" for the UI-side guards; NOTES.md (story 04) says they're checked by hand. Server-side as-at-draw ranges are already covered by `tests/test_history.py:75`.
- **E2E:** the manual Guide below.
- **Won't test:** Chart.js drawing internals, colours/alpha, CSS.

## Implementation notes
- **`app/static/app.js`:**
  - `validBand(band)`: true when `band` exists and `Number.isFinite(min) && Number.isFinite(max) && max > min`. This is the one guard for the missing/null/one-sided/inverted cases. Don't reuse `scaleFor` here; it assumes all three bands exist.
  - `bandPlugin = { id: "asAtDrawBands", beforeDatasetsDraw(chart) {...} }`:
    - Read points from `chart.data.datasets[0].data` (`{x, y, point}`), already oldest → newest.
    - `const { ctx, chartArea, scales: { x, y } } = chart`. `ctx.save()`, clip to `chartArea`, `ctx.restore()` at the end.
    - For each point `i`: `x0 = x.getPixelForValue(data[i].x)`, `x1 = i + 1 < n ? x.getPixelForValue(data[i + 1].x) : chartArea.right`. For each band in `BAND_ORDER` that passes `validBand`, `fillRect(x0, y.getPixelForValue(max), x1 - x0, y.getPixelForValue(min) - y.getPixelForValue(max))`.
    - Colours: read `--optimal`, `--good`, `--improve` once via `getComputedStyle(document.documentElement)` and paint at low alpha (`ctx.globalAlpha ≈ 0.15`) so the line stays legible. No new colours.
    - Space left of the first draw stays empty: no range applied before the first draw.
  - Register per chart: `new Chart(canvas, { ..., plugins: [bandPlugin] })`. Don't use `Chart.register`, so `perf.js` charts are unaffected.
  - `historyChartOptions(points)`:
    - Add `scales.y = { suggestedMin, suggestedMax }` computed from every value plus every valid band's min/max across all points. `suggested*` lets Chart.js still round to nice ticks.
    - Tooltip: add `afterLabel` returning `Optimal {min}–{max} {unit}` from `ctx.raw.point.ranges.optimal` when `validBand`, else `""`.
  - **Fallback** (only if the stepped plugin overruns): the same plugin, but draw only the last point's optimal band from `chartArea.left` to `chartArea.right`. No annotation plugin needed; it isn't loaded. Record it as a deviation.
- **Edge cases:**
  - Same-day draws: a zero/near-zero width segment is fine.
  - Unit change: bands use each point's own numbers with no conversion; NOTES.md flags it (already a known limitation).
  - Contiguous bands in the seed data don't overlap, so paint order doesn't matter. Paint improve → good → optimal anyway so optimal wins if real data overlaps.
- **Deviation (Guide step 2):** the x-axis now pads past the latest draw (`suggestedMax` = last + max(30 days, 15% of span)). Without it, the latest draw sat on the right edge and its stepped segment was a sliver.
- **Out of scope:** pinning one-sided bands to the axis edge (plan extras), a band legend, the screen-reader list (05), server changes, a JS harness.

## Guide
Walk it with the agent during `/implement-story`, in the browser as user-1 against `dev.db`. Tick each box as it passes. If one fails, leave it unticked and fix it before moving on.

- [x] 1. Run the dev server, sign in as user-1 and open History on **Vitamin D**. Three coloured bands sit behind the line; the line and points draw on top.
- [x] 2. On Vitamin D, the bands step at the 2026-09-01 draw: optimal moves up (50–80 → 60–90) and good/improve shift with it. The last segment reaches the right edge.
- [x] 3. Hover each Vitamin D point. The tooltip adds that draw's optimal range (50–80 on the first two, 60–90 on the last).
- [x] 4. Open a non-drifting marker (agent names one below). Its bands are flat across the chart.
- [x] 5. Open another drifted marker (LDL or ApoB). The bands step where the agent says its ranges change.
- [x] 6. Out-of-band marker (agent names one below, or ✂ if none): the out-of-band point and the full bands are both visible, with nothing clipped.
- [x] 7. Missing-band guard: in DevTools, break one point's `ranges.good` (the agent gives a snippet that patches the response before the chart draws). That band is skipped for that segment, everything else draws, and there are no console errors.
- [x] 8. Earlier checks still hold: re-open/close makes no new request, keyboard toggle works, and the blocked CDN still shows "Chart unavailable".

Test markers (filled in by the agent before the walkthrough): flat: Total cholesterol · second drifted: LDL cholesterol (changes at 2026-03-04: optimal 0–100 → 0–110) · out-of-band: Homocysteine (65.6 on 2024-10-01, above improve's 15–60)

## Agent prepares
- Query `dev.db` for user-1: one non-drifting marker, the draw date where LDL/ApoB ranges change, and any point whose value sits outside all of its bands. Fill in the "Test markers" line, or write "none" so that step is ✂.
- A DevTools snippet for step 7 (e.g. a temporary `fetch` wrapper pasted in the console that nulls `points[1].ranges.good` on `/history` responses), so Zac doesn't have to write it.

## Record afterwards
- The ticked Guide boxes and the Test markers line are the record. Add a deviation note under `## Implementation notes` if the fallback was taken or a step needed a change. No accounts or credentials are involved.

## Review
Done-when met: all 8 Guide boxes ticked, `scripts/test` green (57 passed, 1 xfailed), and the code diff touches only `app/static/app.js`. Every AC holds; the fallback wasn't needed. Matches C4 `bandPlugin` and the plan. No security or correctness red flags.

- **must-fix:** none.
- **should-fix:** none.
- **nit:** `app/static/app.js:115`: "widest-first" is wrong. The bands sit side by side rather than nested, so improve isn't the widest. Just say optimal paints last so it wins on overlap. **Fixed:** the comment is reworded.
- **nit:** `app/static/app.js:125`: `getComputedStyle` and the colour map run on every draw, including each hover redraw. The notes said to read them once. It's cheap, but hoisting it to a lazy module-level read matches the spec. **Fixed:** `bandColours()` now reads them once and caches the result.

## Related
- [Epic hub](../README.md)
- [02 Inline history chart](02-inline-history-chart.md)
- [04 NOTES.md](04-notes-md.md)
