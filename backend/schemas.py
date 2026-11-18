"""
Pydantic Schemas — Input/Output Validation Layer
=================================================
All API responses pass through these schemas for type safety.
"""

from typing import Literal

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    field_validator,
    model_serializer,
    model_validator,
)

from domain.nutrition_rules import (
    VALUE_VALID,
    classify_value,
    nutrition_quality,
    nutrition_values,
)

# ── Shared vocabularies ───────────────────────────────────────
AllergenCode = Literal[
    "milk", "eggs", "peanuts", "tree_nuts", "fish", "shellfish",
    "soy", "wheat", "gluten", "sesame", "sulfites",
]
AllergenStatus = Literal["present", "possible", "absent", "unknown"]
IngredientProvenance = Literal[
    "legacy_seed_heuristic", "legacy_default_false", "legacy_null",
    "no_allergen_record", "not_tracked", "derived_from_wheat",
]
CrossContactProvenance = Literal[
    "no_source", "insufficient_preparation_evidence", "verified_preparation_source",
]
NutritionField = Literal[
    "calories", "protein", "fat", "carbohydrates", "fiber", "sugar", "sodium",
]
HealthGoalKey = Literal["diabetic", "heart", "weight", "muscle", "kidney", "cholesterol"]

_STRICT = ConfigDict(extra="forbid")


class NutritionQuality(BaseModel):
    model_config = _STRICT

    nutrition_record_present: bool
    missing_fields: list[NutritionField]
    invalid_fields: list[NutritionField]


class NutritionSchema(BaseModel):
    calories: float | None = None
    protein: float | None = None
    fat: float | None = None
    carbohydrates: float | None = None
    fiber: float | None = None
    sugar: float | None = None
    sodium: float | None = None

    @field_validator('calories', 'protein', 'fat', 'carbohydrates', 'fiber', 'sugar', 'sodium', mode='before')
    @classmethod
    def invalid_becomes_null(cls, v):
        # Negative, NaN and infinite values are returned as null, never as 0.
        # FoodSchema lists them in nutrition_quality.invalid_fields.
        if classify_value(v) != VALUE_VALID:
            return None
        return v

    class Config:
        from_attributes = True  # Updated for Pydantic V2


class AllergenSchema(BaseModel):
    dairy: bool | None = False
    nuts: bool | None = False
    gluten: bool | None = False
    soy: bool | None = False
    eggs: bool | None = False
    shellfish: bool | None = False

    class Config:
        from_attributes = True  # Updated for Pydantic V2


class SustainabilitySchema(BaseModel):
    carbon_footprint: float | None = None
    water_usage: float | None = None
    land_use: float | None = None
    sustainability_score: float | None = None

    @field_validator('carbon_footprint', 'water_usage', 'land_use', 'sustainability_score', mode='before')
    @classmethod
    def validate_non_negative(cls, v):
        if v is not None and v < 0:
            return 0.0
        return v

    class Config:
        from_attributes = True  # Updated for Pydantic V2


class FoodSchema(BaseModel):
    id: int
    name: str
    brand: str | None = None
    category: str | None = None
    image: str | None = None
    description: str | None = None
    serving_size: str | None = None
    price_range: str | None = None
    nutrition_score: float | None = None
    sustainability_score: float | None = None

    nutrition: NutritionSchema | None = None
    nutrition_quality: NutritionQuality
    allergens: AllergenSchema | None = None
    sustainability: SustainabilitySchema | None = None

    @model_validator(mode="before")
    @classmethod
    def add_nutrition_quality(cls, data):
        """Describe the stored nutrition values before invalid ones become null."""
        if isinstance(data, BaseModel):
            return data
        if isinstance(data, dict):
            if data.get("nutrition_quality") is not None:
                return data
            nutrition = data.get("nutrition")
            if nutrition is not None and not isinstance(nutrition, dict):
                nutrition = nutrition_values(nutrition)
            return {**data, "nutrition_quality": nutrition_quality(nutrition)}
        payload = {
            name: getattr(data, name, None)
            for name in cls.model_fields
            if name != "nutrition_quality"
        }
        payload["nutrition_quality"] = nutrition_quality(nutrition_values(payload["nutrition"]))
        return payload

    class Config:
        from_attributes = True  # Updated for Pydantic V2


class ErrorResponse(BaseModel):
    """Standard error response format."""
    detail: str
    error_code: str | None = None


class MethodNotAllowed(BaseModel):
    """FastAPI's standard 405 body."""
    model_config = _STRICT

    detail: str


# ── GET /foods/meta/health-goals ──────────────────────────────
class PresetFilter(BaseModel):
    model_config = _STRICT

    field: NutritionField
    op: Literal["lt", "gt"]
    value: float
    unit: Literal["g", "mg", "kcal"]


class Preset(BaseModel):
    model_config = _STRICT

    key: HealthGoalKey
    label: str
    kind: Literal["exploratory_filter"]
    basis: Literal["as_stored_unstandardized"]
    filters: list[PresetFilter] = Field(min_length=1)


class HealthGoalsResponse(BaseModel):
    """Response schema for the health-goals metadata endpoint."""
    model_config = _STRICT

    presets: list[Preset] = Field(min_length=6, max_length=6)
    disclaimer: str


# ── GET /foods/meta/allergens ─────────────────────────────────
class AllergenInfo(BaseModel):
    model_config = _STRICT

    code: AllergenCode
    label: str
    aliases: list[str]


class GroupAlias(BaseModel):
    model_config = _STRICT

    alias: str
    expands_to: list[AllergenCode]


class AllergenDimensions(BaseModel):
    model_config = _STRICT

    ingredient: list[AllergenStatus]
    cross_contact: list[AllergenStatus]


class ProvenanceValues(BaseModel):
    model_config = _STRICT

    ingredient: list[IngredientProvenance]
    cross_contact: list[CrossContactProvenance]


class MetaAllergensResponse(BaseModel):
    model_config = _STRICT

    allergens: list[AllergenInfo] = Field(min_length=11, max_length=11)
    group_aliases: list[GroupAlias]
    dimensions: AllergenDimensions
    provenance: ProvenanceValues
    preparation_warning: str


# ── POST /foods/{food_id}/alternatives ────────────────────────
class AlternativesRequest(BaseModel):
    model_config = _STRICT

    allergen_profile_status: str | None = None
    avoid: list[str] = Field(default_factory=list)
    health_goals: list[str] = Field(default_factory=list)
    limit: int = Field(default=10, ge=1, le=50)


class Applied(BaseModel):
    model_config = _STRICT

    allergen_profile_status: Literal["restrictions", "none_confirmed"]
    allergen_filtering: Literal["applied", "not_applied"]
    avoid: list[AllergenCode]
    health_goals: list[HealthGoalKey]
    category_scope: list[str]
    category_scope_source: Literal["swap_group", "unmapped_same_category_only"]
    nutrition_basis: Literal["as_stored_unstandardized"]


class PrimaryReasonCounts(BaseModel):
    model_config = _STRICT

    allergen_ingredient_present: int
    allergen_cross_contact_present: int
    allergen_ingredient_possible: int
    allergen_cross_contact_possible: int
    allergen_ingredient_unknown: int
    allergen_cross_contact_unknown: int
    nutrition_invalid: int
    nutrition_missing: int
    failed_filter: int


class IngredientUnknownByProvenance(BaseModel):
    model_config = _STRICT

    legacy_default_false: int
    legacy_null: int
    no_allergen_record: int
    not_tracked: int


class CrossContactUnknownByProvenance(BaseModel):
    model_config = _STRICT

    no_source: int
    insufficient_preparation_evidence: int


class IngredientDimCounts(BaseModel):
    model_config = _STRICT

    present: int
    possible: int
    absent: int
    unknown: int
    unknown_by_provenance: IngredientUnknownByProvenance


class CrossContactDimCounts(BaseModel):
    model_config = _STRICT

    present: int
    possible: int
    absent: int
    unknown: int
    unknown_by_provenance: CrossContactUnknownByProvenance


class AllergenPairCounts(BaseModel):
    model_config = _STRICT

    ingredient: IngredientDimCounts
    cross_contact: CrossContactDimCounts


class AllergenDetail(BaseModel):
    model_config = _STRICT

    unit: Literal["candidate_allergen_pairs"]
    additive_across_allergens: Literal[False]
    by_allergen: dict[AllergenCode, AllergenPairCounts]


class Excluded(BaseModel):
    model_config = _STRICT

    total: int
    by_primary_reason: PrimaryReasonCounts
    allergen_detail: AllergenDetail


class Outcome(BaseModel):
    model_config = _STRICT

    code: Literal[
        "no_candidates", "alternatives_found",
        "no_verified_alternatives", "no_matching_alternatives",
    ]
    text: str


class Comparability(BaseModel):
    model_config = _STRICT

    cross_food_nutrition_comparable: Literal[False]
    reason: Literal["unknown_and_inconsistent_measurement_basis"]


class AlternativeNutrition(BaseModel):
    model_config = _STRICT

    calories: float | None
    protein: float | None
    fat: float | None
    carbohydrates: float | None
    fiber: float | None
    sugar: float | None
    sodium: float | None


class NutritionBasis(BaseModel):
    model_config = _STRICT

    code: Literal["as_stored_unstandardized"]
    standardized: Literal[False]
    source_portion: None
    source_portion_known: Literal[False]
    serving_label_as_stored: str | None
    serving_label_reliable: Literal[False]
    value_provenance: Literal["unverified_manual_entry"]


class CodeStatus(BaseModel):
    model_config = _STRICT

    ingredient: AllergenStatus
    ingredient_provenance: IngredientProvenance
    cross_contact: AllergenStatus
    cross_contact_provenance: CrossContactProvenance


class AllergenStatusMap(BaseModel):
    """All 11 codes, in canonical order."""
    model_config = _STRICT

    milk: CodeStatus
    eggs: CodeStatus
    peanuts: CodeStatus
    tree_nuts: CodeStatus
    fish: CodeStatus
    shellfish: CodeStatus
    soy: CodeStatus
    wheat: CodeStatus
    gluten: CodeStatus
    sesame: CodeStatus
    sulfites: CodeStatus


class Preparation(BaseModel):
    model_config = _STRICT

    details_known: bool


class AlternativeFood(BaseModel):
    model_config = _STRICT

    id: int
    name: str
    brand: str | None
    category: str | None
    image: str | None
    serving_size: str | None
    nutrition: AlternativeNutrition
    nutrition_quality: NutritionQuality
    nutrition_basis: NutritionBasis
    allergen_status: AllergenStatusMap
    preparation: Preparation


class Reason(BaseModel):
    model_config = _STRICT

    code: Literal["filter_threshold", "category", "swap_group"]
    field: NutritionField | None = None
    text: str

    @model_validator(mode="after")
    def field_only_for_filter_threshold(self):
        if (self.code == "filter_threshold") != (self.field is not None):
            raise ValueError("'field' is present only for filter_threshold")
        return self

    @model_serializer(mode="wrap")
    def omit_absent_field(self, handler):
        data = handler(self)
        if data.get("field") is None:
            data.pop("field", None)
        return data


_ALLERGEN_UNCERTAINTY_CODES = (
    "allergen_ingredient_flagged", "allergen_ingredient_unverified",
    "allergen_cross_contact_flagged", "allergen_cross_contact_unverified",
)


class Uncertainty(BaseModel):
    model_config = _STRICT

    code: Literal[
        "allergen_ingredient_flagged", "allergen_ingredient_unverified",
        "allergen_cross_contact_flagged", "allergen_cross_contact_unverified",
        "preparation_dependent", "nutrition_unstandardized", "nutrition_incomplete",
    ]
    allergens: list[AllergenCode] | None = None
    fields: list[NutritionField] | None = None
    text: str

    @model_validator(mode="after")
    def lists_match_the_code(self):
        if (self.code in _ALLERGEN_UNCERTAINTY_CODES) != (self.allergens is not None):
            raise ValueError("'allergens' is present only for the allergen codes")
        if (self.code == "nutrition_incomplete") != (self.fields is not None):
            raise ValueError("'fields' is present only for nutrition_incomplete")
        return self

    @model_serializer(mode="wrap")
    def omit_absent_lists(self, handler):
        data = handler(self)
        for key in ("allergens", "fields"):
            if data.get(key) is None:
                data.pop(key, None)
        return data


class Result(BaseModel):
    model_config = _STRICT

    rank: int = Field(ge=1)
    eligibility: Literal["eligible"]
    food: AlternativeFood
    reasons: list[Reason]
    uncertainty: list[Uncertainty]


class AlternativesResponse(BaseModel):
    model_config = _STRICT

    applied: Applied
    candidates_considered: int
    eligible_total: int
    results: list[Result]
    excluded: Excluded
    outcome: Outcome
    comparability: Comparability
    disclaimer: str
