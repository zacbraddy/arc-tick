---
title: "ADR-0001: Partitioned document store is the only persistence"
shortDescription: All persistence goes through Store's frozen pk/sk API with no indexes; documents the current key layout and what it makes cheap or expensive.
tags: [data-store, architecture, constraints]
---

## Summary
All application data lives in `Store` (`app/store.py`), a DynamoDB-style partitioned document store over SQLite. Its public API is frozen, and there are no field queries, joins or secondary indexes, so every read pattern has to be designed into the keys. Status: accepted (imposed by the brief).

## Context
- The brief forbids changing the public API, bypassing it with SQL or adding another database. `tests/test_store_api.py` pins the surface. Evidence: `README.md:205-209`, `app/store.py:1-40`.
- `/api/home` has a 35 ms p95 budget, so how many documents a request touches, and how big they are, matters. Reads are lazy (except `get`), and decoding cost scales with documents read.

## Decision
- Persist only through `get`, `query(pk, start, end)`, `keys(pk, start, end)`, `scan(pk_prefix)`, `put`, `put_many` (one transaction) and `delete`. Keys are strings ordered lexicographically; ranges are start-inclusive and end-exclusive.
- Read through typed models (`store.get(pk, sk, Model)`) so drifted documents fail loudly.
- Handlers obtain a store via `Depends(get_store)`, which closes it after the request.
- The current key layout:

| pk | sk | Document |
| --- | --- | --- |
| `user` | member ID | `Member` |
| `email` | lower-cased email | `EmailPointer` (login lookup) |
| `biomarker` | biomarker ID | `BiomarkerDefinition` |
| `results:{user_id}` | ISO draw timestamp (`2026-09-01T09:00:00`) | `ResultsDocument`: one doc per draw, partial panels allowed |

## Consequences
- **Cheap:** one member's draws in time order (`query`/`keys` on `results:{id}`), the latest draw (last key), and all definitions (one small partition).
- **Expensive:** anything across members (`scan`), and "history of one biomarker", which means reading every draw doc for the member and picking out one result from each.
- Per-member partitions give member isolation by construction. Every user-scoped read must build its pk from the signed-in member's ID.
- Sort keys must sort chronologically as strings, so use zero-padded ISO dates/timestamps in one consistent format.
- New data (wearables) means choosing pk/sk for the home-screen read pattern, and `NOTES.md` must explain that choice.

## Related
- [Business constraints](/project-context/10k/business-constraints.md)
- [C4 context and containers](/project-context/10k/technical/architecture/c4-context-containers.md)
- [ADR-0002: Draw results keep as-at-draw ranges](/project-context/10k/technical/adrs/0002-draw-results-keep-as-at-draw-ranges.md)
