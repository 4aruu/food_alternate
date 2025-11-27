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

  // Mock initial comparison data
  // Expanded initial comparison data with more categories and correct images
  const initialFoods = [
    // Dairy Alternatives
    {
      id: 'almond-milk',
      name: 'Almond Milk',
      category: 'Dairy Alternative',
      image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400',
      nutrition: {
        calories: 17,
        macros: { protein: 0.6, carbs: 0.6, fat: 1.1, fiber: 0.3, sugar: 0.6, sodium: 1 }
      },
      sustainabilityScore: 72,
      sustainabilityFactors: [
        { name: 'Water Usage', score: 65 },
        { name: 'Carbon Footprint', score: 80 },
        { name: 'Land Use', score: 71 }
      ],
      allergens: ['Nuts']
    },
    {
      id: 'oat-milk',
      name: 'Oat Milk',
      category: 'Dairy Alternative',
      image: 'https://images.unsplash.com/photo-1519864600265-abb23847ef2c?w=400',
      nutrition: {
        calories: 47,
        macros: { protein: 3.0, carbs: 6.7, fat: 1.5, fiber: 0.8, sugar: 4.1, sodium: 101 }
      },
      sustainabilityScore: 85,
      sustainabilityFactors: [
        { name: 'Water Usage', score: 90 },
        { name: 'Carbon Footprint', score: 82 },
        { name: 'Land Use', score: 83 }
      ],
      allergens: ['Gluten']
    },
    {
      id: 'soy-milk',
      name: 'Soy Milk',
      category: 'Dairy Alternative',
      image: 'https://images.unsplash.com/photo-1464306076886-debede1a7b8c?w=400',
      nutrition: {
        calories: 33,
        macros: { protein: 2.9, carbs: 1.2, fat: 1.8, fiber: 0.4, sugar: 1.0, sodium: 51 }
      },
      sustainabilityScore: 78,
      sustainabilityFactors: [
        { name: 'Water Usage', score: 75 },
        { name: 'Carbon Footprint', score: 85 },
        { name: 'Land Use', score: 74 }
      ],
      allergens: ['Soy']
    },
    {
      id: 'rice-milk',
      name: 'Rice Milk',
      category: 'Dairy Alternative',
      image: 'https://images.unsplash.com/photo-1502741338009-cac2772e18bc?w=400',
      nutrition: {
        calories: 47,
        macros: { protein: 0.3, carbs: 10.0, fat: 1.0, fiber: 0.2, sugar: 5.0, sodium: 15 }
      },
      sustainabilityScore: 65,
      sustainabilityFactors: [
        { name: 'Water Usage', score: 60 },
        { name: 'Carbon Footprint', score: 70 },
        { name: 'Land Use', score: 65 }
      ],
      allergens: []
    },
    // Dairy
    {
      id: 'cow-milk',
      name: 'Cow Milk',
      category: 'Dairy',
      image: 'https://images.unsplash.com/photo-1519864600265-abb23847ef2c?w=400',
      nutrition: {
        calories: 61,
        macros: { protein: 3.2, carbs: 4.8, fat: 3.3, fiber: 0, sugar: 5.0, sodium: 43 }
      },
      sustainabilityScore: 40,
      sustainabilityFactors: [
        { name: 'Water Usage', score: 30 },
        { name: 'Carbon Footprint', score: 35 },
        { name: 'Land Use', score: 55 }
      ],
      allergens: ['Dairy']
    },
    {
      id: 'cheddar-cheese',
      name: 'Cheddar Cheese',
      category: 'Dairy',
      image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400',
      nutrition: {
        calories: 113,
        macros: { protein: 7.0, carbs: 0.4, fat: 9.4, fiber: 0, sugar: 0.1, sodium: 180 }
      },
      sustainabilityScore: 35,
      sustainabilityFactors: [
        { name: 'Water Usage', score: 25 },
        { name: 'Carbon Footprint', score: 30 },
        { name: 'Land Use', score: 50 }
      ],
      allergens: ['Dairy']
    },
    // Grains
    {
      id: 'brown-rice',
      name: 'Brown Rice',
      category: 'Grain',
      image: 'https://images.unsplash.com/photo-1502741338009-cac2772e18bc?w=400',
      nutrition: {
        calories: 111,
        macros: { protein: 2.6, carbs: 23.0, fat: 0.9, fiber: 1.8, sugar: 0.2, sodium: 5 }
      },
      sustainabilityScore: 70,
      sustainabilityFactors: [
        { name: 'Water Usage', score: 60 },
        { name: 'Carbon Footprint', score: 75 },
        { name: 'Land Use', score: 70 }
      ],
      allergens: []
    },
    {
      id: 'whole-wheat-bread',
      name: 'Whole Wheat Bread',
      category: 'Grain',
      image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400',
      nutrition: {
        calories: 69,
        macros: { protein: 3.6, carbs: 12.0, fat: 1.1, fiber: 1.9, sugar: 1.6, sodium: 134 }
      },
      sustainabilityScore: 80,
      sustainabilityFactors: [
        { name: 'Water Usage', score: 85 },
        { name: 'Carbon Footprint', score: 80 },
        { name: 'Land Use', score: 80 }
      ],
      allergens: ['Gluten']
    },
    // Fruits
    {
      id: 'banana',
      name: 'Banana',
      category: 'Fruit',
      image: 'https://images.unsplash.com/photo-1574226516831-e1dff420e8f8?w=400',
      nutrition: {
        calories: 89,
        macros: { protein: 1.1, carbs: 23.0, fat: 0.3, fiber: 2.6, sugar: 12.0, sodium: 1 }
      },
      sustainabilityScore: 90,
      sustainabilityFactors: [
        { name: 'Water Usage', score: 95 },
        { name: 'Carbon Footprint', score: 90 },
        { name: 'Land Use', score: 90 }
      ],
      allergens: []
    },
    {
      id: 'apple',
      name: 'Apple',
      category: 'Fruit',
      image: 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=400',
      nutrition: {
        calories: 52,
        macros: { protein: 0.3, carbs: 14.0, fat: 0.2, fiber: 2.4, sugar: 10.0, sodium: 1 }
      },
      sustainabilityScore: 92,
      sustainabilityFactors: [
        { name: 'Water Usage', score: 95 },
        { name: 'Carbon Footprint', score: 92 },
        { name: 'Land Use', score: 92 }
      ],
      allergens: []
    },
    // Vegetables
    {
      id: 'broccoli',
      name: 'Broccoli',
      category: 'Vegetable',
      image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400',
      nutrition: {
        calories: 34,
        macros: { protein: 2.8, carbs: 6.6, fat: 0.4, fiber: 2.6, sugar: 1.7, sodium: 33 }
      },
      sustainabilityScore: 95,
      sustainabilityFactors: [
        { name: 'Water Usage', score: 98 },
        { name: 'Carbon Footprint', score: 95 },
        { name: 'Land Use', score: 95 }
      ],
      allergens: []
    },
    {
      id: 'carrot',
      name: 'Carrot',
      category: 'Vegetable',
      image: 'https://images.unsplash.com/photo-1464306076886-debede1a7b8c?w=400',
      nutrition: {
        calories: 41,
        macros: { protein: 0.9, carbs: 10.0, fat: 0.2, fiber: 2.8, sugar: 4.7, sodium: 69 }
      },
      sustainabilityScore: 97,
      sustainabilityFactors: [
        { name: 'Water Usage', score: 99 },
        { name: 'Carbon Footprint', score: 97 },
        { name: 'Land Use', score: 97 }
      ],
      allergens: []
    },
    // Meats
    {
      id: 'chicken-breast',
      name: 'Chicken Breast',
      category: 'Meat',
      image: 'https://images.unsplash.com/photo-1519864600265-abb23847ef2c?w=400',
      nutrition: {
        calories: 165,
        macros: { protein: 31.0, carbs: 0.0, fat: 3.6, fiber: 0, sugar: 0, sodium: 74 }
      },
      sustainabilityScore: 50,
      sustainabilityFactors: [
        { name: 'Water Usage', score: 45 },
        { name: 'Carbon Footprint', score: 50 },
        { name: 'Land Use', score: 55 }
      ],
      allergens: []
    },
    {
      id: 'beef-steak',
      name: 'Beef Steak',
      category: 'Meat',
      image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=400',
      nutrition: {
        calories: 271,
        macros: { protein: 25.0, carbs: 0.0, fat: 19.0, fiber: 0, sugar: 0, sodium: 58 }
      },
      sustainabilityScore: 20,
      sustainabilityFactors: [
        { name: 'Water Usage', score: 15 },
        { name: 'Carbon Footprint', score: 10 },
        { name: 'Land Use', score: 35 }
      ],
      allergens: []
    },
    // Seafood
    {
      id: 'salmon',
      name: 'Salmon',
      category: 'Seafood',
      image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400',
      nutrition: {
        calories: 206,
        macros: { protein: 22.0, carbs: 0.0, fat: 13.0, fiber: 0, sugar: 0, sodium: 59 }
      },
      sustainabilityScore: 60,
      sustainabilityFactors: [
        { name: 'Water Usage', score: 55 },
        { name: 'Carbon Footprint', score: 60 },
        { name: 'Land Use', score: 65 }
      ],
      allergens: ['Fish']
    },
    {
      id: 'shrimp',
      name: 'Shrimp',
      category: 'Seafood',
      image: 'https://images.unsplash.com/photo-1464306076886-debede1a7b8c?w=400',
      nutrition: {
        calories: 99,
        macros: { protein: 24.0, carbs: 0.2, fat: 0.3, fiber: 0, sugar: 0, sodium: 111 }
      },
      sustainabilityScore: 55,
      sustainabilityFactors: [
        { name: 'Water Usage', score: 50 },
        { name: 'Carbon Footprint', score: 55 },
        { name: 'Land Use', score: 60 }
      ],
      allergens: ['Shellfish']
    },
    // Legumes
    {
      id: 'lentils',
      name: 'Lentils',
      category: 'Legume',
      image: 'https://images.unsplash.com/photo-1502741338009-cac2772e18bc?w=400',
      nutrition: {
        calories: 116,
        macros: { protein: 9.0, carbs: 20.0, fat: 0.4, fiber: 8.0, sugar: 1.8, sodium: 2 }
      },
      sustainabilityScore: 90,
      sustainabilityFactors: [
        { name: 'Water Usage', score: 92 },
        { name: 'Carbon Footprint', score: 90 },
        { name: 'Land Use', score: 90 }
      ],
      allergens: []
    },
    {
      id: 'chickpeas',
      name: 'Chickpeas',
      category: 'Legume',
      image: 'https://images.unsplash.com/photo-1464306076886-debede1a7b8c?w=400',
      nutrition: {
        calories: 164,
        macros: { protein: 8.9, carbs: 27.0, fat: 2.6, fiber: 7.6, sugar: 4.8, sodium: 24 }
      },
      sustainabilityScore: 88,
      sustainabilityFactors: [
        { name: 'Water Usage', score: 90 },
        { name: 'Carbon Footprint', score: 88 },
        { name: 'Land Use', score: 88 }
      ],
      allergens: []
    },
    // Nuts & Seeds
    {
      id: 'walnuts',
      name: 'Walnuts',
      category: 'Nut',
      image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400',
      nutrition: {
        calories: 185,
        macros: { protein: 4.3, carbs: 3.9, fat: 18.5, fiber: 1.9, sugar: 0.7, sodium: 1 }
      },
      sustainabilityScore: 65,
      sustainabilityFactors: [
        { name: 'Water Usage', score: 60 },
        { name: 'Carbon Footprint', score: 70 },
        { name: 'Land Use', score: 65 }
      ],
      allergens: ['Nuts']
    },
    {
      id: 'chia-seeds',
      name: 'Chia Seeds',
      category: 'Seed',
      image: 'https://images.unsplash.com/photo-1502741338009-cac2772e18bc?w=400',
      nutrition: {
        calories: 137,
        macros: { protein: 4.4, carbs: 12.0, fat: 8.6, fiber: 10.6, sugar: 0, sodium: 5 }
      },
      sustainabilityScore: 80,
      sustainabilityFactors: [
        { name: 'Water Usage', score: 85 },
        { name: 'Carbon Footprint', score: 80 },
        { name: 'Land Use', score: 80 }
      ],
      allergens: []
    }
  ];

  useEffect(() => {
    setComparedFoods(initialFoods);
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