import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/ui/Header';
import NavigationBreadcrumbs from '../../components/ui/NavigationBreadcrumbs';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import ComparisonCard from './components/ComparisonCard';
import ComparisonMatrix from './components/ComparisonMatrix';
import FilterControls from './components/FilterControls';
import AddFoodModal from './components/AddFoodModal';
import RecommendationPanel from './components/RecommendationPanel';

const FoodComparisonTool = () => {
  const navigate = useNavigate();
  const [comparedFoods, setComparedFoods] = useState([]);
  const [hoveredNutrient, setHoveredNutrient] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    focus: 'all',
    dietary: 'none',
    sortBy: 'calories',
    quickFilters: []
  });

useEffect(() => {
  fetch("http://127.0.0.1:8000/foods")
    .then(res => res.json())
    .then(data => setFoodsList(data));
}, []);


  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleRemoveFood = (foodId) => {
    setComparedFoods(prev => prev?.filter(food => food?.id !== foodId));
  };

  const handleAddFood = (food) => {
    if (comparedFoods?.length < 5 && !comparedFoods?.some(f => f?.id === food?.id)) {
      setComparedFoods(prev => [...prev, food]);
    }
  };

  const handleAddRecommendation = (food) => {
    handleAddFood(food);
  };

  const handleViewDetails = (food) => {
    // Navigate to nutrition explorer with food data
    navigate('/nutrition-explorer-modal', { state: { food } });
  };

  const handleSort = (metric, order) => {
    const sorted = [...comparedFoods]?.sort((a, b) => {
      let aValue, bValue;
      
      if (metric === 'calories') {
        aValue = a?.nutrition?.calories;
        bValue = b?.nutrition?.calories;
      } else if (metric === 'sustainabilityScore') {
        aValue = a?.sustainabilityScore;
        bValue = b?.sustainabilityScore;
      } else {
        aValue = a?.nutrition?.macros?.[metric] || 0;
        bValue = b?.nutrition?.macros?.[metric] || 0;
      }

      return order === 'asc' ? aValue - bValue : bValue - aValue;
    });

    setComparedFoods(sorted);
  };

  const handleExportComparison = () => {
    const data = {
      timestamp: new Date()?.toISOString(),
      foods: comparedFoods,
      filters: activeFilters
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `food-comparison-${new Date()?.toISOString()?.split('T')?.[0]}.json`;
    document.body?.appendChild(a);
    a?.click();
    document.body?.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShareComparison = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Food Comparison Results',
          text: `Compare ${comparedFoods?.map(f => f?.name)?.join(', ')} - Smart Alternatives Finder`,
          url: window.location?.href
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard?.writeText(window.location?.href);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header 
        onNavigate={handleNavigation}
        searchProps={{
          onSearch: (query) => console.log('Search:', query),
          onSuggestionSelect: (suggestion) => console.log('Selected:', suggestion)
        }}
      />
      <main className="pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          {/* Breadcrumbs */}
          <NavigationBreadcrumbs onNavigate={handleNavigation} />

          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-2">
                  Food Comparison Tool
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl">
                  Compare nutritional profiles, sustainability scores, and allergen information across multiple food alternatives side-by-side.
                </p>
              </div>
              
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  onClick={handleExportComparison}
                  disabled={comparedFoods?.length === 0}
                  iconName="Download"
                  iconPosition="left"
                >
                  Export
                </Button>
                <Button
                  variant="outline"
                  onClick={handleShareComparison}
                  disabled={comparedFoods?.length === 0}
                  iconName="Share2"
                  iconPosition="left"
                >
                  Share
                </Button>
                <Button
                  variant="default"
                  onClick={() => setIsAddModalOpen(true)}
                  disabled={comparedFoods?.length >= 5}
                  iconName="Plus"
                  iconPosition="left"
                >
                  Add Food
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Filter Controls */}
          <FilterControls
            onFilterChange={setActiveFilters}
            activeFilters={activeFilters}
          />

          {comparedFoods?.length === 0 ? (
            /* Empty State */
            (<motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <div className="glass rounded-2xl border border-glass-border p-12 max-w-md mx-auto">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-6">
                  <Icon name="GitCompare" size={32} className="text-primary-foreground" />
                </div>
                <h2 className="text-2xl font-semibold text-foreground mb-4">
                  Start Your Comparison
                </h2>
                <p className="text-muted-foreground mb-6">
                  Add foods to compare their nutritional profiles, sustainability scores, and allergen information side-by-side.
                </p>
                <Button
                  variant="default"
                  size="lg"
                  onClick={() => setIsAddModalOpen(true)}
                  iconName="Plus"
                  iconPosition="left"
                >
                  Add Your First Food
                </Button>
              </div>
            </motion.div>)
          ) : (
            <div className="space-y-8">
              {/* Comparison Cards */}
              <div className="overflow-x-auto pb-4">
                <div className="flex space-x-6 min-w-max">
                  {comparedFoods?.map((food, index) => (
                    <ComparisonCard
                      key={food?.id}
                      food={food}
                      index={index}
                      onRemove={handleRemoveFood}
                      onNutrientHover={setHoveredNutrient}
                      hoveredNutrient={hoveredNutrient}
                      onViewDetails={handleViewDetails}
                    />
                  ))}
                  
                  {/* Add More Card */}
                  {comparedFoods?.length < 5 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="glass rounded-2xl border-2 border-dashed border-glass-border p-6 min-w-[320px] max-w-[400px] flex flex-col items-center justify-center cursor-pointer hover:border-accent/50 transition-all duration-200"
                      onClick={() => setIsAddModalOpen(true)}
                    >
                      <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mb-4">
                        <Icon name="Plus" size={24} className="text-accent" />
                      </div>
                      <h3 className="font-medium text-foreground mb-2">Add Another Food</h3>
                      <p className="text-sm text-muted-foreground text-center">
                        Compare up to 5 foods simultaneously
                      </p>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Comparison Matrix */}
              {comparedFoods?.length >= 2 && (
                <ComparisonMatrix
                  foods={comparedFoods}
                  onSort={handleSort}
                />
              )}

              {/* Recommendations */}
              {comparedFoods?.length >= 1 && (
                <RecommendationPanel
                  comparedFoods={comparedFoods}
                  onAddRecommendation={handleAddRecommendation}
                />
              )}
            </div>
          )}

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-12 flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button
              variant="outline"
              onClick={() => handleNavigation('/food-search-results')}
              iconName="Search"
              iconPosition="left"
            >
              Search More Foods
            </Button>
            <Button
              variant="outline"
              onClick={() => handleNavigation('/user-dashboard')}
              iconName="LayoutDashboard"
              iconPosition="left"
            >
              View Dashboard
            </Button>
            <Button
              variant="outline"
              onClick={() => handleNavigation('/landing-page')}
              iconName="Home"
              iconPosition="left"
            >
              Back to Home
            </Button>
          </motion.div>
        </div>
      </main>
      {/* Add Food Modal */}
      <AddFoodModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddFood={handleAddFood}
        existingFoods={comparedFoods}
      />
    </div>
  );
};

export default FoodComparisonTool;