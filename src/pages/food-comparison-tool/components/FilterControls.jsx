import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';

const FilterControls = ({ onFilterChange, activeFilters }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const filterCategories = [
    {
      id: 'focus',
      label: 'Focus Area',
      icon: 'Target',
      options: [
        { value: 'all', label: 'All Metrics' },
        { value: 'macronutrients', label: 'Macronutrients' },
        { value: 'micronutrients', label: 'Micronutrients' },
        { value: 'sustainability', label: 'Environmental Impact' },
        { value: 'allergens', label: 'Allergen Information' }
      ]
    },
    {
      id: 'dietary',
      label: 'Dietary Restrictions',
      icon: 'Heart',
      options: [
        { value: 'none', label: 'No Restrictions' },
        { value: 'vegan', label: 'Vegan' },
        { value: 'vegetarian', label: 'Vegetarian' },
        { value: 'gluten-free', label: 'Gluten-Free' },
        { value: 'dairy-free', label: 'Dairy-Free' },
        { value: 'keto', label: 'Keto-Friendly' },
        { value: 'low-sodium', label: 'Low Sodium' }
      ]
    },
    {
      id: 'sortBy',
      label: 'Sort By',
      icon: 'ArrowUpDown',
      options: [
        { value: 'calories', label: 'Calories (Low to High)' },
        { value: 'protein', label: 'Protein (High to Low)' },
        { value: 'sustainability', label: 'Eco Score (High to Low)' },
        { value: 'fiber', label: 'Fiber (High to Low)' },
        { value: 'sugar', label: 'Sugar (Low to High)' }
      ]
    }
  ];

  const quickFilters = [
    { id: 'high-protein', label: 'High Protein', icon: 'Zap' },
    { id: 'low-calorie', label: 'Low Calorie', icon: 'Minus' },
    { id: 'eco-friendly', label: 'Eco-Friendly', icon: 'Leaf' },
    { id: 'allergen-free', label: 'Allergen-Free', icon: 'Shield' }
  ];

  const handleFilterChange = (category, value) => {
    onFilterChange({
      ...activeFilters,
      [category]: value
    });
  };

  const handleQuickFilter = (filterId) => {
    const newQuickFilters = activeFilters?.quickFilters || [];
    const isActive = newQuickFilters?.includes(filterId);
    
    const updatedFilters = isActive
      ? newQuickFilters?.filter(f => f !== filterId)
      : [...newQuickFilters, filterId];

    onFilterChange({
      ...activeFilters,
      quickFilters: updatedFilters
    });
  };

  const clearAllFilters = () => {
    onFilterChange({
      focus: 'all',
      dietary: 'none',
      sortBy: 'calories',
      quickFilters: []
    });
  };

  const hasActiveFilters = () => {
    return activeFilters?.focus !== 'all' || 
           activeFilters?.dietary !== 'none' || 
           (activeFilters?.quickFilters && activeFilters?.quickFilters?.length > 0);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl border border-glass-border p-6 mb-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-secondary to-primary flex items-center justify-center">
            <Icon name="Filter" size={20} className="text-primary-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Comparison Filters</h3>
            <p className="text-sm text-muted-foreground">Customize your analysis view</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {hasActiveFilters() && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllFilters}
              iconName="X"
              iconPosition="left"
            >
              Clear All
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-muted-foreground hover:text-accent"
          >
            <Icon name={isExpanded ? "ChevronUp" : "ChevronDown"} size={16} />
          </Button>
        </div>
      </div>
      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {quickFilters?.map((filter) => {
          const isActive = activeFilters?.quickFilters?.includes(filter?.id);
          return (
            <button
              key={filter?.id}
              onClick={() => handleQuickFilter(filter?.id)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-accent text-background shadow-neon'
                  : 'bg-muted/20 text-muted-foreground hover:bg-muted/40 hover:text-foreground'
              }`}
            >
              <Icon name={filter?.icon} size={14} />
              <span>{filter?.label}</span>
            </button>
          );
        })}
      </div>
      {/* Advanced Filters */}
      <motion.div
        initial={false}
        animate={{ height: isExpanded ? 'auto' : 0, opacity: isExpanded ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-glass-border">
          {filterCategories?.map((category) => (
            <div key={category?.id} className="space-y-2">
              <label className="flex items-center space-x-2 text-sm font-medium text-foreground">
                <Icon name={category?.icon} size={16} className="text-accent" />
                <span>{category?.label}</span>
              </label>
              <Select
                options={category?.options}
                value={activeFilters?.[category?.id] || category?.options?.[0]?.value}
                onChange={(value) => handleFilterChange(category?.id, value)}
                placeholder={`Select ${category?.label?.toLowerCase()}`}
              />
            </div>
          ))}
        </div>

        {/* Filter Summary */}
        <div className="mt-4 p-3 bg-muted/10 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Icon name="Info" size={16} className="text-accent" />
            <span className="text-sm font-medium text-foreground">Active Filters</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(activeFilters)?.map(([key, value]) => {
              if (key === 'quickFilters') {
                return value?.map(filter => (
                  <span key={filter} className="text-xs px-2 py-1 bg-accent/20 text-accent rounded-md">
                    {quickFilters?.find(f => f?.id === filter)?.label}
                  </span>
                ));
              } else if (value && value !== 'all' && value !== 'none') {
                const category = filterCategories?.find(c => c?.id === key);
                const option = category?.options?.find(o => o?.value === value);
                return (
                  <span key={key} className="text-xs px-2 py-1 bg-primary/20 text-primary rounded-md">
                    {option?.label}
                  </span>
                );
              }
              return null;
            })}
            {!hasActiveFilters() && (
              <span className="text-xs text-muted-foreground">No active filters</span>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default FilterControls;