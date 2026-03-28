import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import SearchBar from '../../../components/ui/SearchBar';

const SearchHeader = ({ 
  searchQuery = '', 
  onSearchChange = () => {}, 
  onSearch = () => {},
  resultCount = 0,
  isLoading = false,
  onFilterToggle = () => {},
  showMobileFilters = false,
  onComparisonToggle = () => {},
  showComparison = false,
  selectedCount = 0
}) => {
  const [currentQuery, setCurrentQuery] = useState(searchQuery);

  useEffect(() => {
    setCurrentQuery(searchQuery);
  }, [searchQuery]);

  const handleSearchChange = (query) => {
    setCurrentQuery(query);
    onSearchChange(query);
  };

  const handleSearchSubmit = (query) => {
    onSearch(query);
  };

  const mockSuggestions = [
    { id: 1, text: 'Almond milk alternatives', category: 'Dairy' },
    { id: 2, text: 'Gluten-free bread options', category: 'Grains' },
    { id: 3, text: 'Plant-based protein sources', category: 'Protein' },
    { id: 4, text: 'Sugar substitutes', category: 'Sweeteners' },
    { id: 5, text: 'Vegan cheese alternatives', category: 'Dairy' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      {/* Search Bar Section */}
      <div className="glass rounded-xl border border-glass-border p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Search Input */}
          <div className="flex-1 max-w-2xl">
            <SearchBar
              onSearch={handleSearchSubmit}
              onSuggestionSelect={(suggestion) => handleSearchSubmit(suggestion?.text)}
              placeholder="Search for food alternatives..."
              suggestions={mockSuggestions}
              isLoading={isLoading}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            {/* Mobile Filter Toggle */}
            <Button
              variant="outline"
              onClick={onFilterToggle}
              iconName="Filter"
              iconPosition="left"
              className="lg:hidden"
            >
              Filters
            </Button>

            {/* Comparison Toggle */}
            <Button
              variant={showComparison ? "default" : "outline"}
              onClick={onComparisonToggle}
              iconName="GitCompare"
              iconPosition="left"
              className="hidden sm:flex"
            >
              Compare
              {selectedCount > 0 && (
                <span className="ml-2 px-2 py-1 bg-accent/20 text-accent text-xs rounded-full">
                  {selectedCount}
                </span>
              )}
            </Button>

            {/* Advanced Search */}
            <Button
              variant="ghost"
              iconName="Settings"
              size="icon"
              className="hidden lg:flex"
            />
          </div>
        </div>
      </div>
      {/* Results Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Results Info */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Icon name="Search" size={18} className="text-accent" />
            <span className="text-foreground font-medium">
              {isLoading ? (
                <span className="flex items-center space-x-2">
                  <Icon name="Loader2" size={16} className="animate-spin" />
                  <span>Searching...</span>
                </span>
              ) : (
                `${resultCount} alternatives found`
              )}
            </span>
          </div>
          
          {currentQuery && (
            <div className="flex items-center space-x-2">
              <span className="text-muted-foreground">for</span>
              <span className="px-3 py-1 bg-accent/20 text-accent rounded-lg font-medium">
                "{currentQuery}"
              </span>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex items-center space-x-2">
          {showComparison && selectedCount > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center space-x-2"
            >
              <Button
                variant="default"
                size="sm"
                iconName="ArrowRight"
                iconPosition="right"
                onClick={() => {/* Navigate to comparison */}}
              >
                Compare Selected ({selectedCount})
              </Button>
            </motion.div>
          )}

          <Button
            variant="ghost"
            size="sm"
            iconName="Download"
            iconPosition="left"
            className="hidden sm:flex"
          >
            Export Results
          </Button>

          <Button
            variant="ghost"
            size="sm"
            iconName="Share2"
            iconPosition="left"
            className="hidden sm:flex"
          >
            Share Search
          </Button>
        </div>
      </div>
      {/* Search Tips */}
      {!isLoading && resultCount === 0 && currentQuery && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 glass-subtle rounded-lg p-4 border border-glass-border"
        >
          <div className="flex items-start space-x-3">
            <Icon name="Lightbulb" size={20} className="text-accent mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">
                No results found. Try these tips:
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Check your spelling or try different keywords</li>
                <li>• Use broader terms (e.g., "milk" instead of "organic almond milk")</li>
                <li>• Try searching for the food category instead of specific brands</li>
                <li>• Remove some filters to see more options</li>
              </ul>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default SearchHeader;