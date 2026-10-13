"""
Pydantic Schemas — Input/Output Validation Layer
=================================================
All API responses pass through these schemas for type safety.
"""


from pydantic import BaseModel, Field, field_validator


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
    def validate_non_negative(cls, v):
        if v is not None and v < 0:
            return 0.0  # Clamp negative values to 0 rather than erroring
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
    allergens: AllergenSchema | None = None
    sustainability: SustainabilitySchema | None = None

    class Config:
        from_attributes = True  # Updated for Pydantic V2


class SwapExplanationResponse(BaseModel):
    """Response schema for the explain-swap endpoint."""
    explanation: str
    all_benefits: list[str] = Field(default_factory=list)
    benefit_count: int = 0


class HealthGoalSchema(BaseModel):
    """Schema for individual health goal metadata."""
    key: str
    description: str


class HealthGoalsResponse(BaseModel):
    """Response schema for the health-goals metadata endpoint."""
    goals: list[HealthGoalSchema]


class ErrorResponse(BaseModel):
    """Standard error response format."""
    detail: str
    error_code: str | None = None
