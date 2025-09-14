import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';

const ComparisonCard = ({ 
  food, 
  index, 
  onRemove, 
  onNutrientHover, 
  hoveredNutrient, 
  onViewDetails 
}) => {
  const [activeTab, setActiveTab] = useState('nutrition');

  const tabs = [
    { id: 'nutrition', label: 'Nutrition', icon: 'BarChart3' },
    { id: 'sustainability', label: 'Eco Score', icon: 'Leaf' },
    { id: 'allergens', label: 'Allergens', icon: 'AlertTriangle' }
  ];

  const getNutrientColor = (nutrient, value) => {
    const colors = {
      protein: 'text-blue-400',
      carbs: 'text-orange-400',
      fat: 'text-purple-400',
      fiber: 'text-green-400',
      sugar: 'text-red-400',
      sodium: 'text-yellow-400'
    };
    return colors?.[nutrient] || 'text-gray-400';
  };

  const getSustainabilityColor = (score) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getAllergenSeverity = (allergen) => {
    const severity = {
      'Gluten': 'high',
      'Dairy': 'high',
      'Nuts': 'high',
      'Soy': 'medium',
      'Eggs': 'medium',
      'Fish': 'low'
    };
    return severity?.[allergen] || 'low';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="glass rounded-2xl border border-glass-border p-6 min-w-[320px] max-w-[400px]"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Image
              src={food?.image}
              alt={food?.name}
              className="w-12 h-12 rounded-xl object-cover"
            />
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-accent rounded-full flex items-center justify-center">
              <span className="text-xs font-bold text-background">
                {index + 1}
              </span>
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{food?.name}</h3>
            <p className="text-sm text-muted-foreground">{food?.category}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onRemove(food?.id)}
          className="text-muted-foreground hover:text-error"
        >
          <Icon name="X" size={16} />
        </Button>
      </div>
      {/* Tabs */}
      <div className="flex space-x-1 mb-4 bg-muted/20 rounded-lg p-1">
        {tabs?.map((tab) => (
          <button
            key={tab?.id}
            onClick={() => setActiveTab(tab?.id)}
            className={`flex-1 flex items-center justify-center space-x-1 py-2 px-3 rounded-md text-xs font-medium transition-all duration-200 ${
              activeTab === tab?.id
                ? 'bg-accent text-background shadow-neon'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon name={tab?.icon} size={14} />
            <span className="hidden sm:inline">{tab?.label}</span>
          </button>
        ))}
      </div>
      {/* Content */}
      <div className="space-y-4">
        {activeTab === 'nutrition' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Per 100g</span>
              <span className="text-sm font-medium text-foreground">
                {food?.nutrition?.calories} cal
              </span>
            </div>
            
            {Object.entries(food?.nutrition?.macros)?.map(([nutrient, value]) => (
              <div
                key={nutrient}
                className={`flex justify-between items-center p-2 rounded-lg transition-all duration-200 cursor-pointer ${
                  hoveredNutrient === nutrient 
                    ? 'bg-accent/20 border border-accent/30' :'hover:bg-muted/30'
                }`}
                onMouseEnter={() => onNutrientHover(nutrient)}
                onMouseLeave={() => onNutrientHover(null)}
              >
                <span className={`text-sm font-medium ${getNutrientColor(nutrient)}`}>
                  {nutrient?.charAt(0)?.toUpperCase() + nutrient?.slice(1)}
                </span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-foreground">{value}g</span>
                  <div className="w-16 h-2 bg-muted/30 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getNutrientColor(nutrient)?.replace('text-', 'bg-')} transition-all duration-300`}
                      style={{ width: `${Math.min((value / 50) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'sustainability' && (
          <div className="space-y-4">
            <div className="text-center">
              <div className={`text-3xl font-bold ${getSustainabilityColor(food?.sustainabilityScore)}`}>
                {food?.sustainabilityScore}
              </div>
              <p className="text-sm text-muted-foreground">Eco Score</p>
            </div>
            
            <div className="space-y-3">
              {food?.sustainabilityFactors?.map((factor, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{factor?.name}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-12 h-2 bg-muted/30 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          factor?.score >= 80 ? 'bg-green-400' :
                          factor?.score >= 60 ? 'bg-yellow-400' : 'bg-red-400'
                        }`}
                        style={{ width: `${factor?.score}%` }}
                      />
                    </div>
                    <span className="text-xs text-foreground w-8">{factor?.score}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'allergens' && (
          <div className="space-y-3">
            {food?.allergens?.length > 0 ? (
              food?.allergens?.map((allergen, idx) => (
                <div
                  key={idx}
                  className={`flex items-center justify-between p-2 rounded-lg ${
                    getAllergenSeverity(allergen) === 'high' ?'bg-red-500/10 border border-red-500/30' :
                    getAllergenSeverity(allergen) === 'medium' ?'bg-yellow-500/10 border border-yellow-500/30' :'bg-blue-500/10 border border-blue-500/30'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Icon 
                      name="AlertTriangle" 
                      size={16} 
                      className={
                        getAllergenSeverity(allergen) === 'high' ?'text-red-400' :
                        getAllergenSeverity(allergen) === 'medium' ?'text-yellow-400' :'text-blue-400'
                      }
                    />
                    <span className="text-sm font-medium text-foreground">
                      {allergen}
                    </span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    getAllergenSeverity(allergen) === 'high' ?'bg-red-500/20 text-red-400' :
                    getAllergenSeverity(allergen) === 'medium' ?'bg-yellow-500/20 text-yellow-400' :'bg-blue-500/20 text-blue-400'
                  }`}>
                    {getAllergenSeverity(allergen)}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <Icon name="CheckCircle" size={24} className="text-green-400 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No known allergens</p>
              </div>
            )}
          </div>
        )}
      </div>
      {/* Actions */}
      <div className="flex space-x-2 mt-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onViewDetails(food)}
          className="flex-1"
          iconName="Eye"
          iconPosition="left"
        >
          Details
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-accent"
        >
          <Icon name="Share2" size={16} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-accent"
        >
          <Icon name="Bookmark" size={16} />
        </Button>
      </div>
    </motion.div>
  );
};

export default ComparisonCard;