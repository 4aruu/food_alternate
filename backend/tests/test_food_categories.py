"""Category ownership: the moved mapping, scopes and seed coverage."""

import ast
from pathlib import Path

import pytest

from domain import food_categories as C

SEED_PATH = Path(__file__).resolve().parent.parent / "seed.py"

_MEALS = [
    "Lunch", "Dinner", "Main Course", "Chinese", "Indian", "Arabic", "Fast Food",
    "Restaurant/Global", "Kerala Native", "Continental", "Seafood", "Meat Alternative",
]

# Snapshot of CATEGORY_SWAP_GROUPS taken from routers/foods.py before the move.
ORIGINAL_SWAP_GROUPS = {
    **{category: _MEALS + ["Breakfast"] for category in _MEALS},
    "Breakfast": ["Breakfast"] + _MEALS,
    "Snack": ["Snack"],
    "Dessert": ["Dessert", "Snack"],
    "Drink": ["Drink"],
    "Side Dish": ["Side Dish"],
    "Dairy": ["Dairy", "Dairy Alternative"],
    "Dairy Alternative": ["Dairy", "Dairy Alternative"],
    "Grain": ["Grain"],
    "Sweetener": ["Sweetener"],
    "Plant Protein": ["Plant Protein"],
    "Salad": ["Salad", "Side Dish"],
}


def _seed_categories():
    """Categories in seed.py, read with ast. seed.py is never imported."""
    tree = ast.parse(SEED_PATH.read_text(encoding="utf-8"))
    for node in tree.body:
        if isinstance(node, ast.Assign) and any(
            isinstance(target, ast.Name) and target.id == "raw_native_list"
            for target in node.targets
        ):
            rows = ast.literal_eval(node.value)
            return sorted({row.split("|")[1] for row in rows if len(row.split("|")) >= 4})
    raise AssertionError("raw_native_list not found in seed.py")


def test_moved_mapping_equals_the_original_snapshot():
    assert len(ORIGINAL_SWAP_GROUPS) == 23
    assert C.CATEGORY_SWAP_GROUPS == ORIGINAL_SWAP_GROUPS
    assert list(C.CATEGORY_SWAP_GROUPS) == list(ORIGINAL_SWAP_GROUPS)


@pytest.mark.parametrize("category", sorted(ORIGINAL_SWAP_GROUPS))
def test_mapped_category_reports_swap_group(category):
    scope, source = C.category_scope(category)
    assert scope == ORIGINAL_SWAP_GROUPS[category]
    assert source == "swap_group"
    assert category in scope


def test_unmapped_category_is_limited_to_itself():
    assert C.category_scope("Street Food") == (["Street Food"], "unmapped_same_category_only")


def test_food_without_a_category_has_an_empty_scope():
    assert C.category_scope(None) == ([], "unmapped_same_category_only")


def test_scope_is_a_copy():
    scope, _ = C.category_scope("Snack")
    scope.append("Lunch")
    assert C.CATEGORY_SWAP_GROUPS["Snack"] == ["Snack"]
    assert C.category_scope("Snack")[0] == ["Snack"]


def test_every_seed_category_maps_to_a_scope():
    categories = _seed_categories()
    assert categories
    for category in categories:
        scope, source = C.category_scope(category)
        assert category in scope
        if category in C.CATEGORY_SWAP_GROUPS:
            assert source == "swap_group"
        else:
            assert scope == [category]
            assert source == "unmapped_same_category_only"
