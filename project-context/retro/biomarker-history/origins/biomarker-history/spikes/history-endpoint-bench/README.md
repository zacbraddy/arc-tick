---
title: History endpoint bench spike
shortDescription: Throwaway bake-off of /api/home with inline history against a per-biomarker history endpoint
tags: [biomarkers, performance]
---

## Summary
Throwaway code for u2. The per-biomarker endpoint (B) wins. With 50 draws, A puts `/api/home` at 55 ms p95, over the 35 ms budget, while B's history endpoint is 10.5 ms. Full findings: [history-api-shape](../../shaping-content/history-api-shape.md).

## How to run (from repo root)
```
D=$(mktemp -d)
PYTHONPATH=. uv run python project-context/shaping/biomarker-history/spikes/history-endpoint-bench/make_dbs.py $D
project-context/shaping/biomarker-history/spikes/history-endpoint-bench/run.sh $D 2>&1 | grep -E "^(=====|---|/api|  p95)"
```
- `make_dbs.py` makes `seed.db`, a straight copy of `dev.db`, and `padded.db`, where user-1 has 50 draws.
- `spike_app.py` is the real app plus `/api/spike/home-a` (Option A) and `/api/spike/history/{id}` (Option B), on port 8001.
- `run.sh` runs `scripts/bench.py --n 200` for each member and endpoint.

## Related
- [Findings](../../shaping-content/history-api-shape.md)
