---
title: Biomarker history C4 level 2 (containers)
shortDescription: The browser client and API change; the document store and its frozen public API do not. History is a separate lazy request, so /api/home stays on budget
tags: [architecture, biomarkers, performance]
---

## Summary
The browser client and the API both **change**, while the document store stays as it is. The client lazily calls a **new** `GET /api/biomarkers/{id}/history` only when a member expands a card, so `/api/home` and its 35 ms p95 budget don't move (d1, k4). The API reads with the store's existing `get` and `query` calls, so there's no store change and no new partition.

```mermaid
C4Container
  Person(member, "Member")
  Container(client, "Browser client", "HTML/CSS/vanilla JS, no build", "CHANGED. app/static/: adds the History toggle and the inline Chart.js history chart")
  Container(api, "API", "Python 3.14, FastAPI, uvicorn", "CHANGED. Adds the history router")
  ContainerDb(db, "Document store", "SQLite dev.db via app/store.py", "Existing. Public API frozen; reads biomarker and results:{id}")
  Rel(member, client, "Uses")
  Rel(client, api, "Existing: GET /api/me, /api/home. NEW: GET /api/biomarkers/{id}/history (lazy, on expand)", "same-origin JSON")
  Rel(api, db, "Existing calls only: get, query")
```

| Container | Status | Change |
| --- | --- | --- |
| Browser client | **changed** | History toggle on each marker card, lazy fetch, chart and empty state (`app.js`, `styles.css`) |
| API | **changed** | New `history` router wired in `app/main.py`; `/api/home` untouched |
| Document store | existing | Reads `get("biomarker", id)` and `query("results:{id}")`. No new partition or write path |

## Related
- [Context (level 1)](1-context.md)
- [Components (level 3)](3-components.md)
- [History API shape](../origins/biomarker-history/shaping-content/history-api-shape.md)
- [ADR-0001: Partitioned document store](/project-context/10k/technical/adrs/0001-partitioned-document-store.md)
