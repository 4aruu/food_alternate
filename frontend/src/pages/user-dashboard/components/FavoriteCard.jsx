import React from 'react';
import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';

const FavoriteCard = ({ 
  food, 
  onRemove, 
  onViewDetails, 
  onCompare,
  className = "" 
}) => {
  const {
    id,
    name,
    image,
    category,
    nutritionScore,
    sustainabilityScore,
    allergens = [],
    savedDate,
    isOrganic = false
  } = food;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className={`glass rounded-xl overflow-hidden hover:shadow-glass-lg transition-all duration-300 group ${className}`}
    >
      <div className="relative h-48 overflow-hidden">
        <Image
          src={image}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        
        <button
          onClick={() => onRemove(id)}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-error/20 backdrop-blur-sm flex items-center justify-center text-error hover:bg-error/30 transition-all duration-200"
          aria-label="Remove from favorites"
        >
          <Icon name="Heart" size={16} className="fill-current" />
        </button>

        {isOrganic && (
          <div className="absolute top-3 left-3 px-2 py-1 rounded-lg bg-success/20 backdrop-blur-sm">
            <span className="text-xs font-medium text-success">Organic</span>
          </div>
        )}

        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="text-lg font-bold text-foreground mb-1">{name}</h3>
          <p className="text-sm text-muted-foreground">{category}</p>
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className={`text-lg font-bold ${
                nutritionScore >= 8 ? 'text-success' : 
                nutritionScore >= 6 ? 'text-warning' : 'text-error'
              }`}>
                {nutritionScore}/10
              </div>
              <p className="text-xs text-muted-foreground">Nutrition</p>
            </div>
            <div className="text-center">
              <div className={`text-lg font-bold ${
                sustainabilityScore >= 8 ? 'text-success' : 
                sustainabilityScore >= 6 ? 'text-warning' : 'text-error'
              }`}>
                {sustainabilityScore}/10
              </div>
              <p className="text-xs text-muted-foreground">Eco Score</p>
            </div>
          </div>
          
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Saved</p>
            <p className="text-sm font-medium text-foreground">{savedDate}</p>
          </div>
        </div>

        {allergens?.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-muted-foreground mb-2">Allergen Alerts:</p>
            <div className="flex flex-wrap gap-1">
              {allergens?.map((allergen, index) => (
                <span
                  key={index}
                  className="px-2 py-1 rounded-md bg-warning/20 text-warning text-xs font-medium"
                >
                  {allergen}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            iconName="Eye"
            iconPosition="left"
            onClick={() => onViewDetails(food)}
            className="flex-1"
          >
            Details
          </Button>
          <Button
            variant="secondary"
            size="sm"
            iconName="GitCompare"
            iconPosition="left"
            onClick={() => onCompare(food)}
            className="flex-1"
          >
            Compare
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default FavoriteCard;