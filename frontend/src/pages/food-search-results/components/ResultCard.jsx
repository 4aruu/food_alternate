import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';
import { Checkbox } from '../../../components/ui/Checkbox';

/* -----------------------------------------
   Normalize backend → UI fields
------------------------------------------ */
function normalizeFood(food) {
  if (!food) return food;

  const allergenList = food.allergens
    ? Object.keys(food.allergens).filter(k => food.allergens[k] === true)
    : [];

  return {
    ...food,

    calories: food?.nutrition?.calories ?? 0,
    protein: food?.nutrition?.protein ?? 0,
    carbs: food?.nutrition?.carbohydrates ?? 0,
    fat: food?.nutrition?.fat ?? 0,

    nutritionScore:
      food?.nutrition_score ??
      food?.nutritionScore ??
      70,

    sustainabilityScore:
      food?.sustainability_score ??
      food?.sustainability?.sustainability_score ??
      0,

    allergens: allergenList,

    priceRange: food?.price_range ?? food?.priceRange ?? "$$",

    dietaryTags: food?.dietaryTags || []
  };
}

const ResultCard = ({
  food: rawFood = {},
  onNutritionExplore = () => {},
  onAddToFavorites = () => {},
  onShare = () => {},
  onCompareToggle = () => {},
  isSelected = false,
  showComparison = false,
  index = 0
}) => {

  const food = normalizeFood(rawFood);
  const [isHovered, setIsHovered] = useState(false);
  const [isFavorited, setIsFavorited] = useState(food?.isFavorited || false);

  const handleFavoriteClick = () => {
    setIsFavorited(!isFavorited);
    onAddToFavorites(food?.id, !isFavorited);
  };

  const handleCompareChange = (checked) => {
    onCompareToggle(food?.id, checked);
  };

  const getSustainabilityColor = (score) => {
    if (score >= 8) return 'text-success';
    if (score >= 6) return 'text-warning';
    return 'text-error';
  };

  const getSustainabilityBg = (score) => {
    if (score >= 8) return 'bg-success/20';
    if (score >= 6) return 'bg-warning/20';
    return 'bg-error/20';
  };

  const getNutritionGrade = (score) => {
    if (score >= 90) return { grade: 'A+', color: 'text-success' };
    if (score >= 80) return { grade: 'A', color: 'text-success' };
    if (score >= 70) return { grade: 'B+', color: 'text-accent' };
    if (score >= 60) return { grade: 'B', color: 'text-accent' };
    if (score >= 50) return { grade: 'C', color: 'text-warning' };
    return { grade: 'D', color: 'text-error' };
  };

  const nutritionGrade = getNutritionGrade(food?.nutritionScore);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      whileHover={{ y: -5 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={`glass rounded-xl border border-glass-border overflow-hidden group transition-all duration-300 ${
        isHovered ? 'shadow-glass-lg neon-glow-primary' : 'shadow-glass'
      } ${isSelected ? 'ring-2 ring-accent' : ''}`}
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <Image
          src={food?.image}
          alt={food?.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />

        {/* Hover Actions */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-t from-background/80 via-transparent to-transparent transition-opacity duration-300">
          <div className="absolute top-3 right-3 flex space-x-2">
            <Button variant="ghost" size="icon" onClick={handleFavoriteClick}>
              <Icon name="Heart" size={18} className={isFavorited ? 'text-error fill-current' : 'text-muted-foreground'} />
            </Button>

            <Button variant="ghost" size="icon" onClick={() => onShare(food)}>
              <Icon name="Share2" size={18} />
            </Button>
          </div>

          {showComparison && (
            <div className="absolute top-3 left-3">
              <Checkbox checked={isSelected} onChange={(e) => handleCompareChange(e.target.checked)} />
            </div>
          )}
        </div>

        {/* Sustainability */}
        <div className="absolute bottom-3 left-3">
          <div className={`px-2 py-1 rounded-lg glass-subtle ${getSustainabilityBg(food.sustainabilityScore)} flex items-center space-x-1`}>
            <Icon name="Leaf" size={14} className={getSustainabilityColor(food.sustainabilityScore)} />
            <span className="text-xs font-medium">{food.sustainabilityScore}/10</span>
          </div>
        </div>

        {/* Nutrition Grade */}
        <div className="absolute bottom-3 right-3">
          <div className={`w-10 h-10 rounded-full glass-subtle flex items-center justify-center ${nutritionGrade.color}`}>
            {nutritionGrade.grade}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-bold">{food.name}</h3>
          <p className="text-sm text-muted-foreground">Alternative to: {food?.alternativeTo || 'Unknown'}</p>
        </div>

        {/* Nutrition */}
        <div className="grid grid-cols-2 gap-2 text-xs mb-4">
          <div className="flex justify-between">
            <span>Calories:</span>
            <span>{food.calories}</span>
          </div>
          <div className="flex justify-between">
            <span>Protein:</span>
            <span>{food.protein}g</span>
          </div>
          <div className="flex justify-between">
            <span>Carbs:</span>
            <span>{food.carbs}g</span>
          </div>
          <div className="flex justify-between">
            <span>Fat:</span>
            <span>{food.fat}g</span>
          </div>
        </div>

        {/* Allergens */}
        {food.allergens.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-warning">Allergens</h4>
            <div className="flex flex-wrap gap-1">
              {food.allergens.map((a, idx) => (
                <span key={idx} className="px-2 py-1 bg-warning/20 text-warning text-xs rounded-md">
                  {a}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <Button variant="default" size="sm" className="flex-1" onClick={() => onNutritionExplore(food)}>
            Explore Nutrition
          </Button>
          <Button variant="outline" size="sm" onClick={() => onShare(food)}>
            <Icon name="Share2" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default ResultCard;
