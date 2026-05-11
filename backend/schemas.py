"""
Pydantic Schemas — Input/Output Validation Layer
=================================================
All API responses pass through these schemas for type safety.
"""

from pydantic import BaseModel, field_validator
from typing import Optional, List


class NutritionSchema(BaseModel):
    calories: Optional[float] = None
    protein: Optional[float] = None
    fat: Optional[float] = None
    carbohydrates: Optional[float] = None
    fiber: Optional[float] = None
    sugar: Optional[float] = None
    sodium: Optional[float] = None

    @field_validator('calories', 'protein', 'fat', 'carbohydrates', 'fiber', 'sugar', 'sodium', mode='before')
    @classmethod
    def validate_non_negative(cls, v):
        if v is not None and v < 0:
            return 0.0  # Clamp negative values to 0 rather than erroring
        return v

    class Config:
        from_attributes = True  # Updated for Pydantic V2


class AllergenSchema(BaseModel):
    dairy: Optional[bool] = False
    nuts: Optional[bool] = False
    gluten: Optional[bool] = False
    soy: Optional[bool] = False
    eggs: Optional[bool] = False
    shellfish: Optional[bool] = False

    class Config:
        from_attributes = True  # Updated for Pydantic V2


class SustainabilitySchema(BaseModel):
    carbon_footprint: Optional[float] = None
    water_usage: Optional[float] = None
    land_use: Optional[float] = None
    sustainability_score: Optional[float] = None

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
    brand: Optional[str] = None
    category: Optional[str] = None
    image: Optional[str] = None
    description: Optional[str] = None
    serving_size: Optional[str] = None
    price_range: Optional[str] = None
    nutrition_score: Optional[float] = None
    sustainability_score: Optional[float] = None

    nutrition: Optional[NutritionSchema] = None
    allergens: Optional[AllergenSchema] = None
    sustainability: Optional[SustainabilitySchema] = None

    class Config:
        from_attributes = True  # Updated for Pydantic V2


class SwapExplanationResponse(BaseModel):
    """Response schema for the explain-swap endpoint."""
    explanation: str
    all_benefits: List[str] = []
    benefit_count: int = 0


class HealthGoalSchema(BaseModel):
    """Schema for individual health goal metadata."""
    key: str
    description: str


class HealthGoalsResponse(BaseModel):
    """Response schema for the health-goals metadata endpoint."""
    goals: List[HealthGoalSchema]


class ErrorResponse(BaseModel):
    """Standard error response format."""
    detail: str
    error_code: Optional[str] = None