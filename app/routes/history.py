from collections.abc import Iterable

from fastapi import APIRouter, Depends, HTTPException

from ..auth import current_user
from ..models import (
    BiomarkerDefinition,
    Envelope,
    HistoryBiomarker,
    HistoryPayload,
    HistoryPoint,
    Member,
    ResultsDocument,
)
from ..store import Store, get_store

router = APIRouter(prefix="/api")


DEFINITIONS = "biomarker"


def history_points(
    draws: Iterable[ResultsDocument], biomarker_id: str
) -> list[HistoryPoint]:
    """Each point keeps the status and ranges stored on its own draw (ADR-0002)."""
    points = [
        HistoryPoint(
            tested_at=draw.tested_at,
            value=result.value,
            unit=result.unit,
            status=result.status,
            ranges=result.ranges,
        )
        for draw in draws
        for result in draw.results
        if result.biomarker_id == biomarker_id
    ]
    points.sort(key=lambda p: p.tested_at)
    return points


@router.get(
    "/biomarkers/{biomarker_id}/history", response_model=Envelope[HistoryPayload]
)
def biomarker_history(
    biomarker_id: str,
    member: Member = Depends(current_user),
    store: Store = Depends(get_store),
):
    definition = store.get(DEFINITIONS, biomarker_id, BiomarkerDefinition)
    if definition is None:
        raise HTTPException(status_code=404, detail="Unknown biomarker")

    draws = (draw for _sk, draw in store.query(f"results:{member.id}", ResultsDocument))
    points = history_points(draws, biomarker_id)
    return Envelope(
        data=HistoryPayload(
            biomarker=HistoryBiomarker(
                id=definition.id, name=definition.name, unit=definition.unit
            ),
            points=points,
        ),
        meta={"count": len(points)},
    )
