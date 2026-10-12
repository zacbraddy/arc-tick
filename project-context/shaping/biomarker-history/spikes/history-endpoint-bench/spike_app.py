"""Throwaway: both u2 options mounted beside the real app, on a copy of dev.db.

    SPIKE_DB=/path/to/copy.db uv run uvicorn spike_app:app --app-dir <this dir> --port 8001
"""

import os

from fastapi import Depends

import app.store as store_module
from app.auth import current_user
from app.main import app
from app.models import Member, ResultsDocument
from app.routes.home import home, latest_results
from app.store import Store, get_store

store_module.DB_PATH = os.environ["SPIKE_DB"]


def history_for_all(store: Store, user_id: str) -> dict[str, list[dict]]:
    series: dict[str, list[dict]] = {}
    for tested_at, draw in store.query(f"results:{user_id}", ResultsDocument):
        for r in draw.results:
            series.setdefault(r.biomarker_id, []).append(
                {"tested_at": tested_at, "value": r.value, "status": r.status,
                 "ranges": r.ranges.model_dump()}
            )
    return series


@app.get("/api/spike/home-a")
def home_a(member: Member = Depends(current_user), store: Store = Depends(get_store)):
    """Option A: today's /api/home plus every biomarker's history inline."""
    envelope = home(member, store)
    payload = envelope.model_dump()
    payload["data"]["history"] = history_for_all(store, member.id)
    return payload


@app.get("/api/spike/history/{biomarker_id}")
def history_b(
    biomarker_id: str,
    member: Member = Depends(current_user),
    store: Store = Depends(get_store),
):
    """Option B: one biomarker's series; /api/home untouched."""
    points = [
        {"tested_at": tested_at, "value": r.value, "status": r.status,
         "ranges": r.ranges.model_dump()}
        for tested_at, draw in store.query(f"results:{member.id}", ResultsDocument)
        for r in draw.results
        if r.biomarker_id == biomarker_id
    ]
    return {"data": {"biomarker_id": biomarker_id, "points": points}}
