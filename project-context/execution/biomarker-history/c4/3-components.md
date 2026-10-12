---
title: Biomarker history C4 level 3 (components)
shortDescription: Components inside the API and browser client that the history epic adds or changes, and the existing ones it leans on
tags: [architecture, biomarkers]
---

## Summary
In the API, a **new** history router depends on the existing `current_user` and `get_store` dependencies plus **new** payload models, and it never touches the home router. In the client, the marker card renderer **changes** to add a toggle, and a **new** history chart component fetches the data and draws the line, the stepped as-at-draw bands (d2) and the tooltips.

## API
```mermaid
C4Component
  Container_Boundary(api, "API (FastAPI)") {
    Component(main, "App wiring", "app/main.py", "CHANGED. include_router(history.router)")
    Component(history, "History router", "app/routes/history.py", "NEW. GET /api/biomarkers/{id}/history: 404 unknown id, member-scoped, oldest first")
    Component(models, "Models", "app/models.py", "CHANGED. Adds HistoryPoint, HistoryBiomarker, HistoryPayload")
    Component(home, "Home router", "app/routes/home.py", "Existing. Untouched")
    Component(auth, "current_user", "app/auth.py", "Existing. Do not change")
    Component(store, "Store + get_store", "app/store.py", "Existing. Frozen API")
  }
  Rel(main, history, "Registers")
  Rel(history, auth, "Depends(current_user)")
  Rel(history, store, "get(biomarker, id); query(results:{member.id})")
  Rel(history, models, "Builds Envelope[HistoryPayload]")
```

## Browser client
```mermaid
C4Component
  Container_Boundary(client, "Browser client (app/static)") {
    Component(api_fn, "api()", "app.js", "Existing. Same-origin fetch wrapper")
    Component(card, "renderMarker", "app.js", "CHANGED. Adds History toggle (aria-expanded) and an empty panel")
    Component(chart, "History chart", "app.js", "NEW. Lazy fetch on first expand; Chart.js line, stepped band plugin, tooltips, empty state")
    Component(styles, "styles.css", "CSS", "CHANGED. Panel and toggle styles")
  }
  Component_Ext(chartjs, "Chart.js 4.5.1", "CDN global")
  Rel(card, chart, "Toggles open/closed")
  Rel(chart, api_fn, "GET /api/biomarkers/{id}/history")
  Rel(chart, chartjs, "new Chart(canvas, config)")
```

| Component | Status | Responsibility |
| --- | --- | --- |
| History router | **new** | Validate the id against the catalogue, filter the member's draws to one biomarker, return points oldest first |
| Models | **changed** | Response payload types only; stored-document models are untouched |
| App wiring | **changed** | One `include_router` line |
| `renderMarker` | **changed** | Card keeps the latest value and unit visible (k1) and gains the toggle |
| History chart | **new** | Fetch once per card, render the chart or "No history yet", keep the chart instance for re-expanding |
| Home router, auth, store | existing | Not modified |

## Related
- [Containers (level 2)](2-containers.md)
- [Code (level 4)](4-code.md)
- [Data survey](../data-survey.md)
