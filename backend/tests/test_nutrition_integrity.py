"""Nutrition integrity: invalid and missing values on the food endpoints, seed guard."""

import ast
import json
import math
from pathlib import Path
from types import SimpleNamespace

import pytest
from sqlalchemy import event
from sqlalchemy.orm.attributes import set_committed_value

from conftest import seed_food
from models import Food, Nutrition
from schemas import FoodSchema

SEED_PATH = Path(__file__).resolve().parent.parent / "seed.py"
FIELDS = ("calories", "protein", "fat", "carbohydrates", "fiber", "sugar", "sodium")

EXPECTED_NUTRITION = {
    "calories": None, "protein": None, "fat": None, "carbohydrates": 40.0,
    "fiber": None, "sugar": 3.0, "sodium": None,
}
EXPECTED_QUALITY = {
    "nutrition_record_present": True,
    "missing_fields": ["sodium"],
    "invalid_fields": ["calories", "protein", "fat", "fiber"],
}


def strict_loads(text):
    """JSON parser that rejects NaN, Infinity, -Infinity and duplicate keys."""
    def reject_constant(name):
        raise ValueError(f"non-finite JSON constant: {name}")

    def reject_duplicates(pairs):
        keys = [key for key, _ in pairs]
        if len(keys) != len(set(keys)):
            raise ValueError("duplicate key")
        return dict(pairs)

    return json.loads(text, parse_constant=reject_constant, object_pairs_hook=reject_duplicates)


def test_strict_parser_rejects_non_finite_constants_and_duplicates():
    for bad in ('{"a": NaN}', '{"a": Infinity}', '{"a": -Infinity}', '{"a": 1, "a": 2}'):
        with pytest.raises(ValueError):
            strict_loads(bad)


@pytest.fixture
def nan_fields():
    """Make chosen nutrition fields load as NaN.

    SQLite stores NaN as NULL, so a row that holds NaN (as PostgreSQL can) is
    reproduced by setting the value when the record is loaded.
    """
    targets: dict[int, tuple[str, ...]] = {}

    def on_load(target, _context):
        for field in targets.get(target.food_id, ()):
            set_committed_value(target, field, math.nan)

    event.listen(Nutrition, "load", on_load)
    yield targets
    event.remove(Nutrition, "load", on_load)


@pytest.fixture
def bad_food(db, nan_fields):
    """A row holding -1, NaN, +inf, -inf and a null."""
    food = seed_food(
        db, "Broken Values", category="Lunch",
        calories=-1, protein=-math.inf, fiber=math.inf, sodium=None,
    )
    nan_fields[food.id] = ("fat",)
    return food


# ── Schema level ─────────────────────────────────────────────
def _record(**nutrition):
    values = {"calories": 300, "protein": 15, "fat": 8, "carbohydrates": 40, "fiber": 5, "sugar": 3, "sodium": 200}
    values.update(nutrition)
    return SimpleNamespace(
        id=1, name="X", brand=None, category="Lunch", image=None, description=None,
        serving_size="1 Portion", price_range=None, nutrition_score=50, sustainability_score=50,
        nutrition=SimpleNamespace(**values), allergens=None, sustainability=None,
    )


@pytest.mark.parametrize("bad", [-1, -0.5, math.nan, math.inf, -math.inf])
def test_invalid_value_is_null_and_listed_never_zero(bad):
    dumped = FoodSchema.model_validate(_record(sugar=bad)).model_dump()
    assert dumped["nutrition"]["sugar"] is None
    assert dumped["nutrition_quality"] == {
        "nutrition_record_present": True, "missing_fields": [], "invalid_fields": ["sugar"],
    }


def test_valid_zero_stays_zero():
    dumped = FoodSchema.model_validate(_record(sugar=0)).model_dump()
    assert dumped["nutrition"]["sugar"] == 0
    assert dumped["nutrition_quality"]["invalid_fields"] == []


def test_missing_value_is_null_and_listed():
    dumped = FoodSchema.model_validate(_record(sodium=None)).model_dump()
    assert dumped["nutrition"]["sodium"] is None
    assert dumped["nutrition_quality"]["missing_fields"] == ["sodium"]


def test_no_nutrition_record():
    record = _record()
    record.nutrition = None
    dumped = FoodSchema.model_validate(record).model_dump()
    assert dumped["nutrition"] is None
    assert dumped["nutrition_quality"] == {
        "nutrition_record_present": False, "missing_fields": list(FIELDS), "invalid_fields": [],
    }


def test_quality_survives_a_second_validation():
    # GET /foods caches model_dump() output and validates it again on the way out.
    first = FoodSchema.model_validate(_record(sugar=-4, sodium=None)).model_dump()
    second = FoodSchema.model_validate(first).model_dump()
    assert second == first
    assert second["nutrition_quality"]["invalid_fields"] == ["sugar"]


def test_quality_is_computed_for_a_plain_dict_without_it():
    payload = {"id": 1, "name": "X", "nutrition": {"calories": -3, "protein": 2}}
    dumped = FoodSchema.model_validate(payload).model_dump()
    assert dumped["nutrition"]["calories"] is None
    assert dumped["nutrition_quality"] == {
        "nutrition_record_present": True,
        "missing_fields": ["fat", "carbohydrates", "fiber", "sugar", "sodium"],
        "invalid_fields": ["calories"],
    }


def test_schema_json_is_accepted_by_a_strict_parser():
    record = _record(calories=-1, fat=math.nan, fiber=math.inf, protein=-math.inf, sodium=None)
    parsed = strict_loads(FoodSchema.model_validate(record).model_dump_json())
    assert parsed["nutrition"] == EXPECTED_NUTRITION
    assert parsed["nutrition_quality"] == EXPECTED_QUALITY


# ── Endpoint level (criterion 45) ────────────────────────────
def _assert_bad_food(item):
    assert item["nutrition"] == EXPECTED_NUTRITION
    assert item["nutrition_quality"] == EXPECTED_QUALITY


def test_list_endpoint_with_invalid_values(client, bad_food):
    response = client.get("/foods/")
    assert response.status_code == 200
    data = strict_loads(response.text)
    assert len(data) == 1
    _assert_bad_food(data[0])

    cached = client.get("/foods/")  # second call is served from the cache
    assert cached.status_code == 200
    _assert_bad_food(strict_loads(cached.text)[0])


def test_search_endpoint_with_invalid_values(client, bad_food):
    response = client.get("/foods/search", params={"q": "Broken"})
    assert response.status_code == 200
    data = strict_loads(response.text)
    assert len(data) == 1
    _assert_bad_food(data[0])


def test_detail_endpoint_with_invalid_values(client, bad_food):
    response = client.get(f"/foods/{bad_food.id}")
    assert response.status_code == 200
    _assert_bad_food(strict_loads(response.text))


def test_endpoints_for_a_food_without_a_nutrition_record(client, db):
    food = Food(name="No Record", category="Lunch")
    db.add(food)
    db.commit()
    db.refresh(food)

    expected = {"nutrition_record_present": False, "missing_fields": list(FIELDS), "invalid_fields": []}
    for url, params in (("/foods/", None), ("/foods/search", {"q": "No Record"}), (f"/foods/{food.id}", None)):
        response = client.get(url, params=params)
        assert response.status_code == 200
        body = strict_loads(response.text)
        item = body[0] if isinstance(body, list) else body
        assert item["nutrition"] is None
        assert item["nutrition_quality"] == expected


def test_endpoints_report_a_complete_record(client, db):
    food = seed_food(db, "Complete", category="Lunch")
    item = strict_loads(client.get(f"/foods/{food.id}").text)
    assert item["nutrition_quality"] == {
        "nutrition_record_present": True, "missing_fields": [], "invalid_fields": [],
    }
    assert all(item["nutrition"][field] is not None for field in FIELDS)


# ── Seed guard (criterion 50) ────────────────────────────────
def _seed_literals():
    """Read seed.py with ast. seed.py is never imported."""
    tree = ast.parse(SEED_PATH.read_text(encoding="utf-8"))
    found = {}
    for node in tree.body:
        if isinstance(node, ast.Assign):
            for target in node.targets:
                if isinstance(target, ast.Name) and target.id in ("REAL_NUTRITION_DB", "raw_native_list"):
                    found[target.id] = ast.literal_eval(node.value)
    assert set(found) == {"REAL_NUTRITION_DB", "raw_native_list"}
    return found["REAL_NUTRITION_DB"], found["raw_native_list"]


def test_every_seed_food_has_complete_non_negative_nutrition():
    nutrition_db, raw_list = _seed_literals()
    names = [row.split("|")[0] for row in raw_list if len(row.split("|")) >= 4]
    assert names

    problems = []
    for name in names:
        entry = nutrition_db.get(name)
        if entry is None:
            problems.append(f"{name}: no REAL_NUTRITION_DB entry")
            continue
        for field in FIELDS:
            value = entry.get(field)
            is_number = isinstance(value, (int, float)) and not isinstance(value, bool)
            if not is_number or not math.isfinite(value) or value < 0:
                problems.append(f"{name}: {field}={value!r}")
    assert problems == []
