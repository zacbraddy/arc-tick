---
title: Inline history chart
shortDescription: History toggle on each marker card expands into a Chart.js line with inspectable tooltips and an empty state
tags: [biomarkers, codebase]
status: ready
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

## Done when
- Every Guide checkbox is ticked by Zac during `/implement-story`. `/review-story` then checks that none are left unticked.
- `scripts/test` is still green, because this story makes no server changes.
- `git diff` touches only `app/static/app.js` and `app/static/styles.css`.

## Acceptance criteria
- Given a signed-in member on the dashboard, when the page renders, then every marker card still shows its latest value, unit and status (k1), plus a collapsed History button (`aria-expanded="false"`, `aria-controls` → its panel id).
- Given a collapsed card, when History is clicked, then the panel opens, `aria-expanded` flips to `"true"`, one request goes to `/api/biomarkers/{id}/history`, and a line chart draws the points oldest → newest on a time-proportional x-axis.
- Given an open chart, when a point is hovered, then the tooltip shows that point's value, its own unit, `formatDate(tested_at)` and its status label (`BAND_LABEL`).
- Given an opened card, when History is closed and opened again, then no new request is made and the same chart is shown.
- Given a biomarker with `points: []`, when History is opened, then the panel shows "No history yet" and no chart.
- Given a biomarker with a single point, when History is opened, then that point draws in the middle of a padded x-domain and the axis doesn't collapse.
- Given the history request fails (network, 401, 404), when History is opened, then the panel shows the `api()` error message and the next open retries.
- Given `Chart` is undefined because the CDN is blocked, when History is opened, then the panel shows a "Chart unavailable" message and doesn't throw.

## Test plan
- **Unit/integration:** none. The repo has no JS harness (`plan.md`, `c4/4-code.md`), and adding one for three DOM functions won't pay off inside the time-box. The endpoint is already covered by `tests/test_history.py`.
- **E2E:** none automated. The manual Guide is the E2E check.
- **Won't test:** Chart.js rendering, tooltip positioning, CSS, or `api()`/`formatDate` (existing and unchanged).

## Implementation notes
- **`app/static/app.js`:**
  - `renderMarker(result)` (`app.js:43`): append a `.history` block after `.scale-labels`. It holds `<button type="button" class="history-toggle" aria-expanded="false" aria-controls="history-{biomarker_id}">History</button>` and `<div class="history-panel" id="history-{biomarker_id}" hidden>`. Wire the click to `toggleHistory(button, panel, result.biomarker_id)`. The id comes from `result.biomarker_id`, which is safe in an attribute because ids are slugs. Set text with `textContent` as the existing code does.
  - `toggleHistory(button, panel, biomarkerId)`: copy the perf.js pattern (`perf.js:65-68`): flip `hidden` and `aria-expanded`. Track the state on the panel (e.g. `panel.dataset.loaded`) so `loadHistory` runs only on the first open, or after a failure.
  - `loadHistory(panel, biomarkerId)`:
    - `await api(\`/api/biomarkers/${encodeURIComponent(id)}/history\`)`.
    - On `catch`, write `err.message` into a `.history-message` and leave the panel unloaded so the next open retries.
    - If `points` is empty, show "No history yet".
    - If `typeof Chart === "undefined"`, show "Chart unavailable".
    - Otherwise build `<div class="history-chart"><canvas role="img" aria-label="{name} history, {unit}"></canvas></div>` and call `new Chart(canvas, {type: "line", data: {datasets: [{data: points.map(p => ({x: Date.parse(p.tested_at), y: p.value, point: p}))}]}, options})`.
  - Chart options:
    - `animation: false`, `maintainAspectRatio: false`, legend off.
    - `scales.x`: `{type: "linear", ticks: {callback: ms => formatDate(new Date(ms).toISOString())}}`.
    - For a single point, set `x.min/max` = `x ± 30 days` in ms.
    - Y-axis: Chart.js auto-scales for now. Story 03 widens it to cover the bands.
    - `plugins.tooltip.callbacks`:
      - `title` → `formatDate(point.tested_at)`.
      - `label` → `"{value} {unit} · {BAND_LABEL[status] ?? status}"`, read from `ctx.raw.point`.
  - Leave a seam for story 03: keep the options in one place inside `loadHistory` so `bandPlugin` can join `plugins` without restructuring. Don't build the plugin now.
- **`app/static/styles.css`:** add a "History" section after the dashboard marker styles (~line 210):
  - `.history-toggle`, styled like the existing small buttons.
  - `.history-panel` with a top margin.
  - `.history-chart {height: 200px; position: relative}`, which follows `.perf-chart`.
  - `.history-message`, using `--muted`.
  - Reuse the CSS vars and add no new colours.
- **`index.html`:** no change. Chart.js 4.5.1 is already loaded before `app.js`.
- **Edge cases:**
  - Missing-from-draw gaps: the linear axis keeps the spacing honest.
  - Unit change between draws: the tooltip reads each point's own unit.
  - Same-day draws: two close points, which is fine.
- **Out of scope:**
  - Range bands, the optimal range in the tooltip, and widening the y-axis (story 03).
  - The screen-reader list and the home bench check (story 05).
  - Server changes and a JS test harness.
- **Fetch failure (d6):** show the `api()` error inline and retry on the next open, using the dashboard's existing plain-message style.

## Guide
Walked with the agent during `/implement-story`, in the browser as user-1 against `dev.db`. Tick each box as it passes. If one fails, leave it unticked and fix the problem before moving on.

- [ ] 1. Run the dev server and sign in as user-1. Every card still shows its latest value, unit and status, plus a History button.
- [ ] 2. Open DevTools → Network and click History on **Vitamin D**. 3 points appear, oldest on the left, spaced by date. The gaps where draws lack vitamin D are visibly wider.
- [ ] 3. Hover each point. The tooltip shows the date, value, unit and status label.
- [ ] 4. Close and reopen History. No second `/history` request appears.
- [ ] 5. Open History on two other cards. Each loads its own chart.
- [ ] 6a. Single-point marker (named below by the agent, or skip ✂ if none): the point sits centred and the axis doesn't collapse.
- [ ] 6b. Zero-point marker (named below by the agent, or skip ✂ if none): the panel shows "No history yet".
- [ ] 6c. Unit-change marker (named below by the agent, or skip ✂ if none): each tooltip shows its own point's unit.
- [ ] 7. Block `cdn.jsdelivr.net` in DevTools and reload. History shows "Chart unavailable", with no uncaught console errors.
- [ ] 8. Go Network → Offline and open an unopened card's History, and an error message shows. Go back online, close and reopen it, and the chart loads.
- [ ] 9. Keyboard: Tab to History and press Enter/Space. It toggles and `aria-expanded` flips.

Test markers (filled in by the agent before the walkthrough): single-point: _tbd_ · zero-point: _tbd_ · unit-change: _tbd_

## Agent prepares
- Before the walkthrough, query `dev.db` for user-1's markers with 1 point, 0 points, and a unit change between draws. Write their names into the "Test markers" line above, or write "none" so that step gets ✂.

## Record afterwards
- The ticked Guide boxes and the Test markers line are the record. Add a one-line deviation under `## Implementation notes` only if a step needed a change. No accounts or credentials are involved.

## Related
- [Epic hub](../README.md)
- [01 History endpoint](01-history-endpoint.md)
- [03 As-at-draw range bands](03-as-at-draw-range-bands.md)
