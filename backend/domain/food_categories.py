"""Category data: the only place that defines which categories swap together."""

MEAL_CATEGORIES = [
    "Lunch", "Dinner", "Main Course", "Chinese", "Indian", "Arabic",
    "Fast Food", "Restaurant/Global", "Kerala Native", "Continental",
    "Seafood", "Meat Alternative",
]
SNACK_CATEGORIES = ["Snack"]
DESSERT_CATEGORIES = ["Dessert"]
BREAKFAST_CATEGORIES = ["Breakfast"]
DRINK_CATEGORIES = ["Drink"]
SIDE_CATEGORIES = ["Side Dish"]
DAIRY_CATEGORIES = ["Dairy", "Dairy Alternative"]
GRAIN_CATEGORIES = ["Grain"]
SWEETENER_CATEGORIES = ["Sweetener"]
PROTEIN_CATEGORIES = ["Plant Protein"]
SALAD_CATEGORIES = ["Salad"]

# Map a food's category to the group of categories it can swap into
CATEGORY_SWAP_GROUPS = {
    **{c: MEAL_CATEGORIES + BREAKFAST_CATEGORIES for c in MEAL_CATEGORIES},
    **{c: BREAKFAST_CATEGORIES + MEAL_CATEGORIES for c in BREAKFAST_CATEGORIES},
    **{c: SNACK_CATEGORIES for c in SNACK_CATEGORIES},
    **{c: DESSERT_CATEGORIES + SNACK_CATEGORIES for c in DESSERT_CATEGORIES},
    **{c: DRINK_CATEGORIES for c in DRINK_CATEGORIES},
    **{c: SIDE_CATEGORIES for c in SIDE_CATEGORIES},
    **{c: DAIRY_CATEGORIES for c in DAIRY_CATEGORIES},
    **{c: GRAIN_CATEGORIES for c in GRAIN_CATEGORIES},
    **{c: SWEETENER_CATEGORIES for c in SWEETENER_CATEGORIES},
    **{c: PROTEIN_CATEGORIES for c in PROTEIN_CATEGORIES},
    **{c: SALAD_CATEGORIES + SIDE_CATEGORIES for c in SALAD_CATEGORIES},
}

SCOPE_SOURCE_SWAP_GROUP = "swap_group"
SCOPE_SOURCE_UNMAPPED = "unmapped_same_category_only"


def category_scope(category: str | None) -> tuple[list[str], str]:
    """Return (categories a food of this category may swap into, scope source).

    A mapped category gets its swap group. An unmapped category is limited to
    itself. A food with no category has an empty scope.
    """
    group = CATEGORY_SWAP_GROUPS.get(category)
    if group is not None:
        return list(group), SCOPE_SOURCE_SWAP_GROUP
    if category is None:
        return [], SCOPE_SOURCE_UNMAPPED
    return [category], SCOPE_SOURCE_UNMAPPED
