import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';
import { Checkbox } from '../../../components/ui/Checkbox';

const ResultCard = ({ 
  food = {}, 
  onNutritionExplore = () => {}, 
  onAddToFavorites = () => {}, 
  onShare = () => {},
  onCompareToggle = () => {},
  isSelected = false,
  showComparison = false,
  index = 0 
}) => {
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

  const nutritionGrade = getNutritionGrade(food?.nutritionScore || 75);

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
      {/* Image Section */}
      <div className="relative h-48 overflow-hidden">
        <Image
          src={food?.image || `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop`}
          alt={food?.name || 'Food substitute'}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        
        {/* Overlay Actions */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute top-3 right-3 flex space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleFavoriteClick}
              className={`glass-subtle ${isFavorited ? 'text-error' : 'text-muted-foreground hover:text-error'}`}
            >
              <Icon name={isFavorited ? "Heart" : "Heart"} size={18} className={isFavorited ? 'fill-current' : ''} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onShare(food)}
              className="glass-subtle text-muted-foreground hover:text-accent"
            >
              <Icon name="Share2" size={18} />
            </Button>
          </div>
          
          {showComparison && (
            <div className="absolute top-3 left-3">
              <Checkbox
                checked={isSelected}
                onChange={(e) => handleCompareChange(e?.target?.checked)}
                label=""
                className="glass-subtle"
              />
            </div>
          )}
        </div>

        {/* Sustainability Badge */}
        <div className="absolute bottom-3 left-3">
          <div className={`px-2 py-1 rounded-lg glass-subtle ${getSustainabilityBg(food?.sustainabilityScore || 8.5)} flex items-center space-x-1`}>
            <Icon name="Leaf" size={14} className={getSustainabilityColor(food?.sustainabilityScore || 8.5)} />
            <span className={`text-xs font-medium ${getSustainabilityColor(food?.sustainabilityScore || 8.5)}`}>
              {food?.sustainabilityScore || 8.5}/10
            </span>
          </div>
        </div>

        {/* Nutrition Grade */}
        <div className="absolute bottom-3 right-3">
          <div className={`w-10 h-10 rounded-full glass-subtle flex items-center justify-center ${nutritionGrade?.color}`}>
            <span className="text-sm font-bold">{nutritionGrade?.grade}</span>
          </div>
        </div>
      </div>
      {/* Content Section */}
      <div className="p-6">
        {/* Header */}
        <div className="mb-4">
          <h3 className="text-lg font-bold text-foreground mb-1 group-hover:text-accent transition-colors duration-200">
            {food?.name || 'Organic Almond Milk'}
          </h3>
          <p className="text-sm text-muted-foreground">
            Alternative to: <span className="text-accent font-medium">{food?.alternativeTo || 'Dairy Milk'}</span>
          </p>
        </div>

        {/* Nutrition Highlights */}
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center">
            <Icon name="Zap" size={14} className="mr-1 text-accent" />
            Nutrition Highlights
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Calories:</span>
              <span className="text-foreground font-medium">{food?.calories || '60'}/cup</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Protein:</span>
              <span className="text-foreground font-medium">{food?.protein || '1g'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Carbs:</span>
              <span className="text-foreground font-medium">{food?.carbs || '8g'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fat:</span>
              <span className="text-foreground font-medium">{food?.fat || '2.5g'}</span>
            </div>
          </div>
        </div>

        {/* Allergen Warnings */}
        {food?.allergens && food?.allergens?.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-warning mb-2 flex items-center">
              <Icon name="AlertTriangle" size={14} className="mr-1" />
              Allergen Warnings
            </h4>
            <div className="flex flex-wrap gap-1">
              {food?.allergens?.map((allergen, idx) => (
                <span key={idx} className="px-2 py-1 bg-warning/20 text-warning text-xs rounded-md">
                  {allergen}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Dietary Tags */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-1">
            {(food?.dietaryTags || ['Vegan', 'Gluten-Free', 'Non-GMO'])?.map((tag, idx) => (
              <span key={idx} className="px-2 py-1 bg-accent/20 text-accent text-xs rounded-md">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Price Range */}
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Price Range:</span>
          <span className="text-sm font-medium text-foreground">
            ${food?.priceRange || '$3.99 - $5.49'}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <Button
            variant="default"
            onClick={() => onNutritionExplore(food)}
            iconName="BarChart3"
            iconPosition="left"
            className="flex-1"
            size="sm"
          >
            Explore Nutrition
          </Button>
          <Button
            variant="outline"
            onClick={() => onShare(food)}
            iconName="Share2"
            size="sm"
          />
        </div>
      </div>
    </motion.div>
  );
};

export default ResultCard;