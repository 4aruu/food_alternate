from pydantic import BaseModel
from typing import Optional

class NutritionSchema(BaseModel):
    calories: Optional[float]
    protein: Optional[float]
    fat: Optional[float]
    carbohydrates: Optional[float]
    fiber: Optional[float]
    sugar: Optional[float]
    sodium: Optional[float]

    class Config:
        from_attributes = True  # Updated for Pydantic V2


class AllergenSchema(BaseModel):
    dairy: Optional[bool]
    nuts: Optional[bool]
    gluten: Optional[bool]
    soy: Optional[bool]
    eggs: Optional[bool]
    shellfish: Optional[bool]

    class Config:
        from_attributes = True  # Updated for Pydantic V2


class SustainabilitySchema(BaseModel):
    carbon_footprint: Optional[float]
    water_usage: Optional[float]
    land_use: Optional[float]
    sustainability_score: Optional[float]

    class Config:
        from_attributes = True  # Updated for Pydantic V2


class FoodSchema(BaseModel):
    id: int
    name: str
    brand: Optional[str]
    category: Optional[str]
    image: Optional[str]
    description: Optional[str]
    serving_size: Optional[str]
    price_range: Optional[str]
    nutrition_score: Optional[float]
    sustainability_score: Optional[float]

    nutrition: Optional[NutritionSchema]
    allergens: Optional[AllergenSchema]
    sustainability: Optional[SustainabilitySchema]

    class Config:
        from_attributes = True  # Updated for Pydantic V2