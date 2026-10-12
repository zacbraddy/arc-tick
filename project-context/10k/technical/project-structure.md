---
title: Project structure
shortDescription: Where code, client, seed data, scripts and tests live in the Peak dashboard repo, and how to run, test, lint and benchmark it.
tags: [codebase]
---

## Summary
This is a small Python 3.14 / FastAPI app managed with `uv`. Server code is in `app/`, the static client is in `app/static/`, seed JSON is in `data/`, executable dev tasks are in `scripts/`, and pytest tests are in `tests/`. Lint is ruff and types are ty. There's no pre-commit and no CI yet.

## Layout
| Path | Owns |
| --- | --- |
| `app/main.py` | App wiring: routers, timing middleware, static mount, `/` → `index.html` |
| `app/models.py` | All Pydantic models: stored documents (docstrings give pk/sk), request bodies and response payloads |
| `app/store.py` | `Store`, the partitioned document store (public API frozen), plus the `get_store` dependency |
| `app/auth.py` | Fake auth: `current_user` from the `peak_session` cookie. Do not change |
| `app/routes/auth.py` | `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/me` |
| `app/routes/home.py` | `GET /api/home` (budgeted) and `GET /api/biomarkers`; builds `BiomarkerView`s from the latest draw |
| `app/routes/ingest.py` | `POST …/biomarkers/draws` (implemented) and `POST …/wearables` (shell returning `stored: false`) |
| `app/timing.py` | `X-Response-Time-Ms` middleware |
| `app/static/` | `index.html`, `app.js` (API calls, sign-in, rendering), `perf.js` (timing panel, Chart.js example), `styles.css` |
| `data/members.json`, `data/biomarkers.json` | 4 members; 30 biomarker definitions across 8 categories |
| `data/biomarkers/{user_id}/*.json` | Seeded draws (`ResultsDocument` shape) |
| `data/wearables/{user_id}/*.json` | Provider deliveries, one per day; `_r2` suffix = redelivery |
| `scripts/` | Dev tasks (below) |
| `tests/` | `conftest.py`, `test_home.py`, `test_biomarker_ingest.py`, `test_wearables.py` (strict xfail until ingest persists), `test_store_api.py` (do not edit) |

## Commands
| Command | Does |
| --- | --- |
| `scripts/bootstrap.py` | Wipe `dev.db` (including imported wearables and extra draws) and load the seed data |
| `scripts/dev` | `uvicorn app.main:app --reload --port 8000` |
| `scripts/test` | `uv run pytest -q` |
| `scripts/lint` | `ruff check`, `ruff format --check`, `ty check` |
| `scripts/fmt` | `ruff check --fix` + `ruff format` |
| `scripts/bench.py [--email …]` | Benchmark `/api/home` over HTTP against a running server; non-zero exit over 35 ms p95 |
| `scripts/ingest-wearable-data.py --user user-N` | Replay a member's wearable files in filename order to a running server |

Ruff config is in `pyproject.toml`: rules `E,F,I,UP,B,SIM`, `B008` ignored for FastAPI `Depends`, line length 88.

## Related
- [C4 context and containers](/project-context/10k/technical/architecture/c4-context-containers.md)
- [Business constraints](/project-context/10k/business-constraints.md)
- [ADR-0001: Partitioned document store](/project-context/10k/technical/adrs/0001-partitioned-document-store.md)
