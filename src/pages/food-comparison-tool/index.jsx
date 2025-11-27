import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';

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
  const location = useLocation();

  // Foods selected from search page
  const initialFoods = location.state?.foods || [];

  // State
  const [comparedFoods, setComparedFoods] = useState(initialFoods);
  const [allFoods, setAllFoods] = useState([]);        // full DB list
  const [hoveredNutrient, setHoveredNutrient] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [activeFilters, setActiveFilters] = useState({
    focus: 'all',
    dietary: 'none',
    sortBy: 'calories',
    quickFilters: []
  });

  // Load all foods (for Add Food modal & recommendations)
  useEffect(() => {
    fetch("http://127.0.0.1:8000/foods")
      .then(res => res.json())
      .then(data => setAllFoods(data))
      .catch(err => console.error("Failed to load foods:", err));
  }, []);

  // Navigation handler
  const handleNavigation = (path) => navigate(path);

  // Remove food
  const handleRemoveFood = (id) => {
    setComparedFoods(prev => prev.filter(f => f.id !== id));
  };

  // Add new food
  const handleAddFood = (food) => {
    if (!comparedFoods.some(f => f.id === food.id) && comparedFoods.length < 5) {
      setComparedFoods(prev => [...prev, food]);
    }
  };

  const handleAddRecommendation = (food) => handleAddFood(food);

  const handleViewDetails = (food) =>
    navigate('/nutrition-explorer-modal', { state: { food } });

  //  Sorting using backend fields
  const handleSort = (metric, order) => {
    const sorted = [...comparedFoods].sort((a, b) => {
      let aValue = 0, bValue = 0;

      if (metric === 'calories') {
        aValue = a?.nutrition?.calories || 0;
        bValue = b?.nutrition?.calories || 0;
      }
      else if (metric === 'protein') {
        aValue = a?.nutrition?.protein || 0;
        bValue = b?.nutrition?.protein || 0;
      }
      else if (metric === 'sustainability') {
        aValue = a?.sustainability?.sustainability_score || 0;
        bValue = b?.sustainability?.sustainability_score || 0;
      }

      return order === 'asc' ? aValue - bValue : bValue - aValue;
    });

    setComparedFoods(sorted);
  };

  // Export JSON
  const handleExportComparison = () => {
    const obj = {
      timestamp: new Date().toISOString(),
      foods: comparedFoods,
      filters: activeFilters
    };

    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "comparison.json";
    a.click();

    URL.revokeObjectURL(url);
  };

  // Share
  const handleShareComparison = async () => {
    if (navigator.share) {
      navigator.share({
        title: 'Food Comparison Results',
        text: comparedFoods.map(f => f.name).join(", "),
        url: window.location.href
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header
        onNavigate={handleNavigation}
        searchProps={{
          onSearch: () => {},
          onSuggestionSelect: () => {}
        }}
      />

      <main className="pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">

          <NavigationBreadcrumbs onNavigate={handleNavigation} />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold">Food Comparison Tool</h1>
                <p className="text-lg text-muted-foreground max-w-2xl">
                  Compare nutrition, sustainability, and allergens across multiple foods.
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  onClick={handleExportComparison}
                  disabled={comparedFoods.length === 0}
                  iconName="Download"
                >
                  Export
                </Button>

                <Button
                  variant="outline"
                  onClick={handleShareComparison}
                  disabled={comparedFoods.length === 0}
                  iconName="Share2"
                >
                  Share
                </Button>

                <Button
                  variant="default"
                  onClick={() => setIsAddModalOpen(true)}
                  disabled={comparedFoods.length >= 5}
                  iconName="Plus"
                >
                  Add Food
                </Button>
              </div>
            </div>
          </motion.div>

          <FilterControls
            onFilterChange={setActiveFilters}
            activeFilters={activeFilters}
          />

          {comparedFoods.length === 0 ? (
            <motion.div className="text-center py-16">
              <div className="glass border p-12 rounded-xl max-w-md mx-auto">
                <h2 className="text-2xl font-semibold mb-4">Start Your Comparison</h2>
                <Button onClick={() => setIsAddModalOpen(true)}>
                  Add Your First Food
                </Button>
              </div>
            </motion.div>
          ) : (
            <div className="space-y-8">

              {/* Comparison cards */}
              <div className="flex overflow-x-auto space-x-6 pb-4">
                {comparedFoods.map((food, index) => (
                  <ComparisonCard
                    key={food.id}
                    food={food}
                    index={index}
                    onRemove={handleRemoveFood}
                    onNutrientHover={setHoveredNutrient}
                    hoveredNutrient={hoveredNutrient}
                    onViewDetails={handleViewDetails}
                  />
                ))}

                {/* Add more card */}
                {comparedFoods.length < 5 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass border-dashed border p-6 rounded-xl cursor-pointer"
                    onClick={() => setIsAddModalOpen(true)}
                  >
                    <Icon name="Plus" size={24} />
                    <p className="mt-2 text-sm">Add More</p>
                  </motion.div>
                )}
              </div>

              {/* Comparison matrix */}
              {comparedFoods.length >= 2 && (
                <ComparisonMatrix foods={comparedFoods} onSort={handleSort} />
              )}

              {/* Recommendations */}
              <RecommendationPanel
                comparedFoods={comparedFoods}
                onAddRecommendation={handleAddRecommendation}
              />
            </div>
          )}

          <div className="mt-12 flex justify-center gap-4">
            <Button onClick={() => handleNavigation('/food-search-results')} iconName="Search">
              Search More Foods
            </Button>
            <Button onClick={() => handleNavigation('/landing-page')} iconName="Home">
              Back to Home
            </Button>
          </div>
        </div>
      </main>

      {/* Add Food Modal */}
      <AddFoodModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddFood={handleAddFood}
        allFoods={allFoods}
      />
    </div>
  );
};

export default FoodComparisonTool;
