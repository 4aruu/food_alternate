import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const mockFoods = [
];

const categories = [
  { value: 'all', label: 'All Categories' },
  { value: 'Grains', label: 'Grains' },
  { value: 'Legumes', label: 'Legumes' },
  { value: 'Vegetables', label: 'Vegetables' },
  { value: 'Dairy', label: 'Dairy' },
  { value: 'Seafood', label: 'Seafood' },
  { value: 'Plant Protein', label: 'Plant Protein' }
];

const AddFoodModal = ({ isOpen, onClose, onAddFood, existingFoods }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const filteredFoods = useMemo(() => {
    let filtered = mockFoods.filter(food =>
      !existingFoods.some(existing => existing.id === food.id)
    );
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(food =>
        food.name.toLowerCase().includes(query) ||
        food.category.toLowerCase().includes(query)
      );
    }
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(food => food.category === selectedCategory);
    }
    return filtered;
  }, [searchQuery, selectedCategory, existingFoods]);

  useEffect(() => {
    if (searchQuery.trim() || selectedCategory !== 'all') {
      setIsLoading(true);
      const timer = setTimeout(() => {
        setSearchResults(filteredFoods);
        setIsLoading(false);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, selectedCategory, existingFoods, filteredFoods]);

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
                <h2 className="text-xl font-semibold text-foreground">Add Food to Compare</h2>
                <p className="text-sm text-muted-foreground">Search and select foods to add to your comparison</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <Icon name="X" size={20} />
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="p-6 border-b border-glass-border">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  type="search"
                  placeholder="Search for foods..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="sm:w-48">
                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin">
                  <Icon name="Loader2" size={24} className="text-accent" />
                </div>
                <span className="ml-2 text-muted-foreground">Searching...</span>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {searchResults.map(food => (
                  <motion.div
                    key={food.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-subtle rounded-xl p-4 hover:bg-muted/20 transition-all duration-200 cursor-pointer"
                    onClick={() => handleAddFood(food)}
                  >
                    <div className="flex items-start space-x-3">
                      <Image
                        src={food.image}
                        alt={food.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-foreground truncate">{food.name}</h3>
                        <p className="text-sm text-muted-foreground">{food.category}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className="text-xs text-orange-400">
                            {food.nutrition.calories} cal
                          </span>
                          <span className="text-xs text-blue-400">
                            {food.nutrition.macros.protein}g protein
                          </span>
                          <div className="flex items-center space-x-1">
                            <Icon name="Leaf" size={12} className="text-green-400" />
                            <span className="text-xs text-green-400">
                              {food.sustainabilityScore}
                            </span>
                          </div>
                        </div>
                        {food.allergens.length > 0 && (
                          <div className="flex items-center space-x-1 mt-1">
                            <Icon name="AlertTriangle" size={12} className="text-yellow-400" />
                            <span className="text-xs text-yellow-400">
                              Contains: {food.allergens.join(', ')}
                            </span>
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-accent hover:bg-accent/20"
                      >
                        <Icon name="Plus" size={16} />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Icon name="Search" size={48} className="text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  {searchQuery || selectedCategory !== 'all' ? 'No foods found' : 'Start searching'}
                </h3>
                <p className="text-muted-foreground">
                  {searchQuery || selectedCategory !== 'all'
                    ? 'Try adjusting your search terms or category filter'
                    : 'Enter a food name or select a category to see available options'}
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AddFoodModal;