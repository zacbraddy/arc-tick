---
title: Biomarker history C4 level 1 (context)
shortDescription: System context for the biomarker history epic. Nothing new at this level; the member gets a new capability inside the existing dashboard
tags: [architecture, biomarkers]
---

## Summary
Nothing changes at context level. No new people or external systems are involved: the member gets a new capability (biomarker history) inside the existing dashboard, Chart.js still comes from the CDN, and ingest is untouched (k2). The **changed** marker below is the dashboard system, because it gains behaviour.

```mermaid
C4Context
  Person(member, "Member", "Existing. Now also opens a chart of any biomarker's history")
  System(dash, "Peak member dashboard", "CHANGED. Adds the history endpoint and inline history chart")
  System_Ext(lab, "Blood draw source", "Existing. Ingest unchanged")
  System_Ext(wear, "Wearable providers", "Existing. Out of scope (Task 2)")
  System_Ext(cdn, "jsDelivr CDN", "Existing. Serves Chart.js 4.5.1")
  Rel(member, dash, "Views latest values and history", "HTTPS, session cookie")
  Rel(lab, dash, "POST /api/users/{id}/biomarkers/draws")
  Rel(wear, dash, "POST /api/users/{id}/wearables")
  Rel(member, cdn, "Browser loads Chart.js")
```

| Element | Status | Note |
| --- | --- | --- |
| Member | existing | Same sign-in and session cookie |
| Peak member dashboard | **changed** | See [containers](2-containers.md) |
| Blood draw source, wearable providers, CDN | existing | No new dependency; no date adapter needed (linear time axis, k8) |

## Related
- [Containers (level 2)](2-containers.md)
- [10k C4 context and containers](/project-context/10k/technical/architecture/c4-context-containers.md)
- [Plan](../plan.md)
