import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import Header from '../../components/ui/Header';
import NavigationBreadcrumbs from '../../components/ui/NavigationBreadcrumbs';
import SearchHeader from './components/SearchHeader';
import SearchFilters from './components/SearchFilters';
import ResultsGrid from './components/ResultsGrid';
import QuickActions from './components/QuickActions';

const FoodSearchResults = () => {
  const navigate = useNavigate();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    dietary: [],
    allergens: [],
    sustainability: 'all',
    sortBy: 'relevance'
  });

  const [results, setResults] = useState([]);
  const [backupResults, setBackupResults] = useState([]); // to reset
  const [isLoading, setIsLoading] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);

  //  Fetch all foods on first load
  useEffect(() => {
    const fetchResults = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("http://127.0.0.1:8000/foods");
        const data = await response.json();
        setResults(data);
        setBackupResults(data);
      } catch (error) {
        console.error("Failed to load foods:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, []);

  //  Backend search handler
  const performSearch = async (query) => {
    setSearchQuery(query);
    setIsLoading(true);

    try {
      const res = await fetch(`http://127.0.0.1:8000/foods/search?q=${query}`);
      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Called by Search Header
  const handleSearch = (query) => {
    setSearchQuery(query);
    performSearch(query);

    window.history.pushState(null, '', `/food-search-results?q=${encodeURIComponent(query)}`);
  };

  const handleSearchChange = (query) => {
    setSearchQuery(query);
  };


  //  Local filtering based on backend fields
  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);

    let filtered = [...backupResults];

    // dietary = NOT IMPLEMENTED IN BACKEND YET
    // allergens = implemented → check allergens table
    if (newFilters.allergens.length > 0) {
      filtered = filtered.filter(item => {
        return !newFilters.allergens.some(allergen => {
          return item.allergens && item.allergens[allergen] === true;
        });
      });
    }

    // sustainability filter
    if (newFilters.sustainability !== "all") {
      filtered = filtered.filter(item => {
        const score = item.sustainability?.sustainability_score || 0;
        if (newFilters.sustainability === "eco-friendly") return score >= 70;
        if (newFilters.sustainability === "carbon-neutral") return score >= 90;
        return true;
      });
    }

    // sorting
    if (newFilters.sortBy === "nutrition-score") {
      filtered.sort((a, b) => (b.nutrition_score || 0) - (a.nutrition_score || 0));
    }
    if (newFilters.sortBy === "sustainability") {
      filtered.sort(
        (a, b) =>
          (b.sustainability?.sustainability_score || 0) -
          (a.sustainability?.sustainability_score || 0)
      );
    }

    setResults(filtered);
  };

  // Navigation handlers
  const handleNavigation = (path) => navigate(path);

  const handleNutritionExplore = (food) => {
    navigate('/nutrition-explorer-modal', { state: { food } });
  };

  const handleCompareToggle = (foodId, isSelected) => {
    if (isSelected) {
      setSelectedItems(prev => [...prev, foodId]);
    } else {
      setSelectedItems(prev => prev.filter(id => id !== foodId));
    }
  };

  const handleCompareSelected = () => {
    const selectedFoods = results.filter(item => selectedItems.includes(item.id));
    navigate('/food-comparison-tool', { state: { foods: selectedFoods } });
  };

  const handleClearSelection = () => setSelectedItems([]);

  return (
    <div className="min-h-screen bg-background">
      <Header
        onNavigate={handleNavigation}
        searchProps={{
          onSearch: handleSearch,
          onSearchToggle: () => setShowMobileFilters(true)
        }}
      />

      <main className="pt-20 pb-8">
        <div className="container mx-auto px-6 lg:px-8">

          <NavigationBreadcrumbs onNavigate={handleNavigation} />

          <SearchHeader
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            onSearch={handleSearch}
            resultCount={results.length}
            isLoading={isLoading}
            onFilterToggle={() => setShowMobileFilters(!showMobileFilters)}
            showMobileFilters={showMobileFilters}
            onComparisonToggle={() => setShowComparison(!showComparison)}
            showComparison={showComparison}
            selectedCount={selectedItems.length}
          />

          <div className="hidden lg:block">
            <SearchFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
              isVisible={true}
            />
          </div>

          <SearchFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            isVisible={showMobileFilters}
            onToggle={() => setShowMobileFilters(!showMobileFilters)}
            isMobile={true}
          />

          <ResultsGrid
            results={results}
            isLoading={isLoading}
            onNutritionExplore={handleNutritionExplore}
            showComparison={showComparison}
            selectedItems={selectedItems}
            onCompareToggle={handleCompareToggle}
            hasMore={false}
          />
        </div>
      </main>

      <QuickActions
        selectedCount={selectedItems.length}
        onCompareSelected={handleCompareSelected}
        onClearSelection={handleClearSelection}
        isVisible={showComparison || selectedItems.length > 0}
      />
    </div>
  );
};

export default FoodSearchResults;
