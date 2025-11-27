import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

/* -------------------------------------------
   NORMALIZE BACKEND → FRONTEND FOOD MODEL
--------------------------------------------*/
function normalizeFood(food) {
  if (!food) return food;

  // Convert allergens object to array → ["nuts", "dairy"]
  const allergenList = food.allergens
    ? Object.keys(food.allergens).filter(key => food.allergens[key] === true)
    : [];

  return {
    ...food,

    // fallback UI values
    nutritionScore: food.nutrition_score ?? food.nutrition?.calories ?? 0,
    sustainabilityScore:
      food.sustainability_score ??
      food.sustainability?.sustainability_score ??
      0,

    allergens: allergenList,

    nutrition: {
      calories: food?.nutrition?.calories ?? 0,
      protein: food?.nutrition?.protein ?? 0,
      fat: food?.nutrition?.fat ?? 0,
      carbohydrates: food?.nutrition?.carbohydrates ?? 0,

      macros: {
        protein: food?.nutrition?.protein ?? 0,
        carbs: food?.nutrition?.carbohydrates ?? 0,
        fat: food?.nutrition?.fat ?? 0
      }
    }
  };
}

/* -------------------------------------------
   CATEGORY FILTERS
--------------------------------------------*/
const categories = [
  { value: 'all', label: 'All Categories' },
  { value: 'Grain', label: 'Grains' },
  { value: 'Protein', label: 'Protein' },
  { value: 'Dairy', label: 'Dairy' },
  { value: 'Dairy Alternative', label: 'Dairy Alternative' },
  { value: 'Vegetable', label: 'Vegetables' },
  { value: 'Snack', label: 'Snacks' }
];

const AddFoodModal = ({ isOpen, onClose, onAddFood, allFoods = [], existingFoods = [] }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // NORMALIZE foods ONCE
  const normalizedFoods = useMemo(
    () => allFoods.map(normalizeFood),
    [allFoods]
  );

  /* -------------------------------------------
     FILTER FOODS BASED ON SEARCH + CATEGORY
  --------------------------------------------*/
  const filteredFoods = useMemo(() => {
    let filtered = normalizedFoods.filter(
      food => !existingFoods.some(ex => ex.id === food.id)
    );

    // search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        f =>
          f.name.toLowerCase().includes(q) ||
          f.category.toLowerCase().includes(q)
      );
    }

    // category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(f => f.category === selectedCategory);
    }

    return filtered;
  }, [normalizedFoods, searchQuery, selectedCategory, existingFoods]);

  const handleAddFood = food => {
    onAddFood(food);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="glass rounded-2xl border border-glass-border w-full max-w-2xl max-h-[80vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-glass-border">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-secondary flex items-center justify-center">
                <Icon name="Plus" size={20} className="text-background" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  Add Food to Compare
                </h2>
                <p className="text-sm text-muted-foreground">
                  Search and select foods to add to your comparison
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <Icon name="X" size={20} />
            </Button>
          </div>

          {/* Search + category */}
          <div className="p-6 border-b border-glass-border">
            <div className="flex flex-col sm:flex-row gap-4">
              <Input
                type="search"
                placeholder="Search for foods..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />

              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="sm:w-48 px-3 py-2 bg-input border border-border rounded-lg"
              >
                {categories.map(c => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto p-6">
            {filteredFoods.length === 0 ? (
              <div className="text-center py-12">
                <Icon name="Search" size={48} className="text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">No foods found</h3>
                <p className="text-muted-foreground">
                  Try different keywords or category filters.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredFoods.map(food => (
                  <motion.div
                    key={food.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-subtle rounded-xl p-4 hover:bg-muted/20 cursor-pointer"
                    onClick={() => handleAddFood(food)}
                  >
                    <div className="flex items-start space-x-3">
                      <Image
                        src={food.image}
                        alt={food.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />

                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{food.name}</h3>
                        <p className="text-sm text-muted-foreground">{food.category}</p>

                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-xs text-orange-400">
                            {food.nutrition.calories} cal
                          </span>
                          <span className="text-xs text-blue-400">
                            {food.nutrition.macros.protein}g protein
                          </span>
                          <span className="flex items-center text-xs text-green-400 gap-1">
                            <Icon name="Leaf" size={12} />
                            {food.sustainabilityScore}
                          </span>
                        </div>

                        {food.allergens.length > 0 && (
                          <div className="flex items-center gap-1 mt-1 text-yellow-400 text-xs">
                            <Icon name="AlertTriangle" size={12} />
                            Contains: {food.allergens.join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AddFoodModal;
