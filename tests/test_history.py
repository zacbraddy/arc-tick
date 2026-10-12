import pytest

from app.models import (
    Band,
    BiomarkerDefinition,
    BiomarkerResult,
    Ranges,
    ResultsDocument,
)
from app.routes.history import history_points


def make_ranges(optimal_max: float = 20) -> Ranges:
    return Ranges(
        optimal=Band(min=10, max=optimal_max),
        good=Band(min=5, max=25),
        improve=Band(min=0, max=30),
    )


def result(
    biomarker_id: str,
    value: float,
    status: str = "good",
    ranges: Ranges | None = None,
) -> BiomarkerResult:
    return BiomarkerResult(
        biomarker_id=biomarker_id,
        value=value,
        unit="mg/L",
        status=status,
        ranges=ranges or make_ranges(),
    )


def draw(tested_at: str, *results: BiomarkerResult) -> ResultsDocument:
    return ResultsDocument(user_id="user-1", tested_at=tested_at, results=list(results))


# ------------------------------------------------------------ history_points


def test_history_points_is_empty_without_draws():
    assert history_points([], "a") == []


def test_history_points_orders_out_of_order_draws_oldest_first():
    draws = [
        draw("2026-09-10T09:00:00", result("a", 3)),
        draw("2026-03-01T09:00:00", result("a", 1)),
        draw("2026-09-10T08:00:00", result("a", 2)),
    ]

    points = history_points(draws, "a")

    assert [(p.tested_at, p.value) for p in points] == [
        ("2026-03-01T09:00:00", 1),
        ("2026-09-10T08:00:00", 2),
        ("2026-09-10T09:00:00", 3),
    ]


def test_history_points_skips_draws_without_the_biomarker():
    draws = [
        draw("2026-01-01T09:00:00", result("a", 1)),
        draw("2026-02-01T09:00:00", result("b", 99)),
        draw("2026-03-01T09:00:00", result("b", 98), result("a", 3)),
    ]

    points = history_points(draws, "a")

    assert [p.value for p in points] == [1, 3]


def test_history_points_keeps_each_draws_own_ranges_and_status():
    draws = [
        draw("2026-01-01T09:00:00", result("a", 22, status="good")),
        draw(
            "2026-06-01T09:00:00",
            result("a", 22, status="optimal", ranges=make_ranges(optimal_max=24)),
        ),
    ]

    first, second = history_points(draws, "a")

    assert (first.status, first.ranges.optimal.max) == ("good", 20)
    assert (second.status, second.ranges.optimal.max) == ("optimal", 24)


# ------------------------------------------------------------------ endpoint


@pytest.fixture
def history_data(store):
    for user_id in ("user-1", "user-2"):
        for key in list(store.keys(f"results:{user_id}")):
            store.delete(f"results:{user_id}", key)
    store.put(
        "biomarker",
        "a",
        BiomarkerDefinition(
            id="a",
            name="Zinc",
            category="minerals",
            unit="mg/L",
            direction="in_range",
            description="About Zinc",
            ranges=make_ranges(),
        ),
    )

    def add_draw(user_id, tested_at, value, **overrides):
        store.put(
            f"results:{user_id}",
            tested_at,
            ResultsDocument(
                user_id=user_id,
                tested_at=tested_at,
                results=[result("a", value, **overrides)],
            ),
        )

    return add_draw


@pytest.mark.parametrize("session", [None, "missing-member"])
def test_history_requires_a_valid_session(client, session):
    if session is not None:
        client.cookies.set("peak_session", session)
    assert client.get("/api/biomarkers/a/history").status_code == 401


def test_history_for_an_unknown_biomarker_is_not_found(signed_in, history_data):
    assert signed_in.get("/api/biomarkers/no-such-marker/history").status_code == 404


def test_history_without_results_is_empty(signed_in, history_data):
    response = signed_in.get("/api/biomarkers/a/history")

    assert response.status_code == 200
    assert response.json() == {
        "data": {
            "biomarker": {"id": "a", "name": "Zinc", "unit": "mg/L"},
            "points": [],
        },
        "meta": {"count": 0},
    }


def test_history_returns_the_members_points_oldest_first(signed_in, history_data):
    history_data("user-1", "2026-09-10T09:00:00", 22)
    history_data("user-1", "2026-03-01T09:00:00", 12)

    response = signed_in.get("/api/biomarkers/a/history")

    assert response.status_code == 200
    body = response.json()
    assert body["meta"] == {"count": 2}
    assert body["data"]["biomarker"] == {"id": "a", "name": "Zinc", "unit": "mg/L"}
    old, new = body["data"]["points"]
    assert old == {
        "tested_at": "2026-03-01T09:00:00",
        "value": 12,
        "unit": "mg/L",
        "status": "good",
        "ranges": {
            "optimal": {"min": 10, "max": 20},
            "good": {"min": 5, "max": 25},
            "improve": {"min": 0, "max": 30},
        },
    }
    assert new["tested_at"] == "2026-09-10T09:00:00"


def test_history_only_returns_the_signed_in_members_points(client, history_data):
    history_data("user-1", "2026-09-10T09:00:00", 12)
    history_data("user-2", "2026-09-11T09:00:00", 24)
    history_data("user-2", "2026-09-12T09:00:00", 25)
    for email, values in (
        ("james.chen@example.com", [12]),
        ("priya.raman@example.com", [24, 25]),
    ):
        assert client.post("/api/auth/login", json={"email": email}).status_code == 200
        response = client.get("/api/biomarkers/a/history")
        assert response.status_code == 200
        assert [p["value"] for p in response.json()["data"]["points"]] == values
