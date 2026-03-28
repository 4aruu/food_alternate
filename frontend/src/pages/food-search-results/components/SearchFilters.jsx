import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { Checkbox } from '../../../components/ui/Checkbox';
import Select from '../../../components/ui/Select';

const SearchFilters = ({ 
  filters = {}, 
  onFiltersChange = () => {}, 
  isVisible = true,
  onToggle = () => {},
  isMobile = false 
}) => {
  const [localFilters, setLocalFilters] = useState({
    dietary: [],
    allergens: [],
    sustainability: 'all',
    sortBy: 'relevance',
    ...filters
  });

  const dietaryOptions = [
    { id: 'vegan', label: 'Vegan', icon: 'Leaf' },
    { id: 'vegetarian', label: 'Vegetarian', icon: 'Sprout' },
    { id: 'gluten-free', label: 'Gluten-Free', icon: 'Wheat' },
    { id: 'keto', label: 'Keto', icon: 'Zap' },
    { id: 'paleo', label: 'Paleo', icon: 'Mountain' },
    { id: 'dairy-free', label: 'Dairy-Free', icon: 'Milk' },
    { id: 'low-sodium', label: 'Low Sodium', icon: 'Droplets' },
    { id: 'organic', label: 'Organic', icon: 'TreePine' }
  ];

  const allergenOptions = [
    { id: 'nuts', label: 'Tree Nuts', icon: 'Nut' },
    { id: 'peanuts', label: 'Peanuts', icon: 'Circle' },
    { id: 'dairy', label: 'Dairy', icon: 'Milk' },
    { id: 'eggs', label: 'Eggs', icon: 'Egg' },
    { id: 'soy', label: 'Soy', icon: 'Bean' },
    { id: 'wheat', label: 'Wheat', icon: 'Wheat' },
    { id: 'fish', label: 'Fish', icon: 'Fish' },
    { id: 'shellfish', label: 'Shellfish', icon: 'Shell' }
  ];

  const sustainabilityOptions = [
    { value: 'all', label: 'All Options' },
    { value: 'eco-friendly', label: 'Eco-Friendly Only' },
    { value: 'carbon-neutral', label: 'Carbon Neutral' },
    { value: 'locally-sourced', label: 'Locally Sourced' },
    { value: 'minimal-packaging', label: 'Minimal Packaging' }
  ];

  const sortOptions = [
    { value: 'relevance', label: 'Most Relevant' },
    { value: 'nutrition-score', label: 'Nutrition Score' },
    { value: 'sustainability', label: 'Sustainability Rating' },
    { value: 'popularity', label: 'Most Popular' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' }
  ];

  useEffect(() => {
    onFiltersChange(localFilters);
  }, [localFilters, onFiltersChange]);

  const handleDietaryChange = (optionId, checked) => {
    setLocalFilters(prev => ({
      ...prev,
      dietary: checked 
        ? [...prev?.dietary, optionId]
        : prev?.dietary?.filter(id => id !== optionId)
    }));
  };

  const handleAllergenChange = (optionId, checked) => {
    setLocalFilters(prev => ({
      ...prev,
      allergens: checked 
        ? [...prev?.allergens, optionId]
        : prev?.allergens?.filter(id => id !== optionId)
    }));
  };

  const handleSustainabilityChange = (value) => {
    setLocalFilters(prev => ({
      ...prev,
      sustainability: value
    }));
  };

  const handleSortChange = (value) => {
    setLocalFilters(prev => ({
      ...prev,
      sortBy: value
    }));
  };

  const clearAllFilters = () => {
    setLocalFilters({
      dietary: [],
      allergens: [],
      sustainability: 'all',
      sortBy: 'relevance'
    });
  };

  const getActiveFilterCount = () => {
    return localFilters?.dietary?.length + 
           localFilters?.allergens?.length + 
           (localFilters?.sustainability !== 'all' ? 1 : 0) +
           (localFilters?.sortBy !== 'relevance' ? 1 : 0);
  };

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Sort Options */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center">
            <Icon name="ArrowUpDown" size={16} className="mr-2 text-accent" />
            Sort By
          </h3>
        </div>
        <Select
          options={sortOptions}
          value={localFilters?.sortBy}
          onChange={handleSortChange}
          placeholder="Select sorting option"
        />
      </div>

      {/* Dietary Preferences */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center">
            <Icon name="Leaf" size={16} className="mr-2 text-accent" />
            Dietary Preferences
          </h3>
          <span className="text-xs text-muted-foreground bg-muted/30 px-2 py-1 rounded-md">
            {localFilters?.dietary?.length} selected
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {dietaryOptions?.map((option) => (
            <Checkbox
              key={option?.id}
              label={
                <div className="flex items-center space-x-2">
                  <Icon name={option?.icon} size={14} className="text-muted-foreground" />
                  <span className="text-sm">{option?.label}</span>
                </div>
              }
              checked={localFilters?.dietary?.includes(option?.id)}
              onChange={(e) => handleDietaryChange(option?.id, e?.target?.checked)}
              size="sm"
            />
          ))}
        </div>
      </div>

      {/* Allergen Exclusions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center">
            <Icon name="AlertTriangle" size={16} className="mr-2 text-warning" />
            Exclude Allergens
          </h3>
          <span className="text-xs text-muted-foreground bg-muted/30 px-2 py-1 rounded-md">
            {localFilters?.allergens?.length} excluded
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {allergenOptions?.map((option) => (
            <Checkbox
              key={option?.id}
              label={
                <div className="flex items-center space-x-2">
                  <Icon name={option?.icon} size={14} className="text-muted-foreground" />
                  <span className="text-sm">{option?.label}</span>
                </div>
              }
              checked={localFilters?.allergens?.includes(option?.id)}
              onChange={(e) => handleAllergenChange(option?.id, e?.target?.checked)}
              size="sm"
            />
          ))}
        </div>
      </div>

      {/* Sustainability Filter */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center">
            <Icon name="Recycle" size={16} className="mr-2 text-success" />
            Sustainability
          </h3>
        </div>
        <Select
          options={sustainabilityOptions}
          value={localFilters?.sustainability}
          onChange={handleSustainabilityChange}
          placeholder="Select sustainability filter"
        />
      </div>

      {/* Clear Filters */}
      {getActiveFilterCount() > 0 && (
        <div className="pt-4 border-t border-glass-border">
          <Button
            variant="outline"
            onClick={clearAllFilters}
            iconName="RotateCcw"
            iconPosition="left"
            fullWidth
            size="sm"
          >
            Clear All Filters ({getActiveFilterCount()})
          </Button>
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <AnimatePresence>
        {isVisible && (
          <>
            {/* Mobile Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
              onClick={onToggle}
            />
            
            {/* Mobile Filter Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 w-80 max-w-[85vw] glass border-r border-glass-border z-50 overflow-y-auto"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-foreground flex items-center">
                    <Icon name="Filter" size={20} className="mr-2 text-accent" />
                    Filters
                  </h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onToggle}
                    iconName="X"
                  />
                </div>
                
                <FilterContent />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-xl border border-glass-border p-6 mb-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-foreground flex items-center">
          <Icon name="Filter" size={20} className="mr-2 text-accent" />
          Refine Your Search
        </h2>
        {getActiveFilterCount() > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">
              {getActiveFilterCount()} active filter{getActiveFilterCount() !== 1 ? 's' : ''}
            </span>
            <div className="w-2 h-2 bg-accent rounded-full animate-pulse-glow"></div>
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <FilterContent />
      </div>
    </motion.div>
  );
};

export default SearchFilters;