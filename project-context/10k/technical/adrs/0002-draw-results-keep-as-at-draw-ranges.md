---
title: "ADR-0002: Draw results keep the ranges and status they had when drawn"
shortDescription: Each stored biomarker result carries its own status and reference ranges as at the draw; ingest classifies against current definitions and merges by biomarker ID.
tags: [biomarkers, data-store]
---

## Summary
A `BiomarkerResult` stores its `status` and `ranges` as they were when the draw happened. The same biomarker can therefore carry different ranges across a member's history, and these can differ from the current `BiomarkerDefinition`. Status: accepted (existing behaviour).

## Context
- Reference ranges change over time, and a historical result should read as it was reported. Evidence: `README.md:169-174`, `app/models.py:62-76`.
- Seeded draws keep their stored ranges and statuses. Bootstrap does not reclassify them (`scripts/bootstrap.py`).

## Decision
- The source of truth for a result's ranges and status is the result itself, not the current definition. `/api/home` returns `result.ranges` and `result.status` (`app/routes/home.py:51-65`).
- Ingest (`POST /api/users/{id}/biomarkers/draws`) rejects the whole draw if any biomarker is unknown or its unit differs from the definition. It classifies with `band_for` against the *current* definition (optimal → good → improve, inclusive bounds, falling back to improve), stamps the current ranges and sets `source: "draw_import"`. Evidence: `app/routes/ingest.py:39-99`.
- Re-posting the same `tested_at` merges by biomarker ID: incoming results replace their counterparts, omitted ones are preserved, and results are sorted by ID.
- The definition supplies only name, category, description and direction. If a definition is missing, the result falls back to its ID, the category `other` and the direction `in_range`.

## Consequences
- History charts must draw each point against *its own* ranges, or explicitly choose and document another policy (for example current ranges as the band, with per-point status). That choice goes in `NOTES.md`.
- A biomarker may be absent from any draw, so histories have gaps and must be built per biomarker across all of a member's draws.
- Imported draws can't restore historical classifications.

## Related
- [ADR-0001: Partitioned document store](/project-context/10k/technical/adrs/0001-partitioned-document-store.md)
- [Business constraints](/project-context/10k/business-constraints.md)
- [C4 context and containers](/project-context/10k/technical/architecture/c4-context-containers.md)
