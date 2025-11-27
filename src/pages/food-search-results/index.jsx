import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import Header from '../../components/ui/Header';
import NavigationBreadcrumbs from '../../components/ui/NavigationBreadcrumbs';
import SearchHeader from './components/SearchHeader';
import SearchFilters from './components/SearchFilters';
import ResultsGrid from './components/ResultsGrid';
import QuickActions from './components/QuickActions';

const FoodSearchResults = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    dietary: [],
    allergens: [],
    sustainability: 'all',
    sortBy: 'relevance'
  });
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
  const fetchResults = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/foods");
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error("Failed to load foods:", error);
    }
  };

  fetchResults();
}, []);

  // Perform search with loading states
  const performSearch = async (query) => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      let filteredResults = mockResults?.filter(item =>
        item?.name?.toLowerCase()?.includes(query?.toLowerCase()) ||
        item?.alternativeTo?.toLowerCase()?.includes(query?.toLowerCase()) ||
        item?.dietaryTags?.some(tag => tag?.toLowerCase()?.includes(query?.toLowerCase()))
      );
      
      setResults(filteredResults);
      setIsLoading(false);
    }, 1000);
  };

  // Handle search changes
  const handleSearchChange = (query) => {
    setSearchQuery(query);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    performSearch(query);
    
    // Update URL
    const newUrl = `/food-search-results?q=${encodeURIComponent(query)}`;
    window.history?.pushState(null, '', newUrl);
  };

  // Handle filter changes
  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    // Apply filters to results
    applyFilters(newFilters);
  };

  const applyFilters = (filterOptions) => {
    let filteredResults = [...mockResults];

    // Apply dietary filters
    if (filterOptions?.dietary?.length > 0) {
      filteredResults = filteredResults?.filter(item =>
        filterOptions?.dietary?.some(diet =>
          item?.dietaryTags?.some(tag =>
            tag?.toLowerCase()?.includes(diet?.toLowerCase())
          )
        )
      );
    }

    // Apply allergen exclusions
    if (filterOptions?.allergens?.length > 0) {
      filteredResults = filteredResults?.filter(item =>
        !filterOptions?.allergens?.some(allergen =>
          item?.allergens?.some(itemAllergen =>
            itemAllergen?.toLowerCase()?.includes(allergen?.toLowerCase())
          )
        )
      );
    }

    // Apply sustainability filter
    if (filterOptions?.sustainability !== 'all') {
      filteredResults = filteredResults?.filter(item => {
        switch (filterOptions?.sustainability) {
          case 'eco-friendly':
            return item?.sustainabilityScore >= 8.5;
          case 'carbon-neutral':
            return item?.sustainabilityScore >= 9.0;
          default:
            return true;
        }
      });
    }

    // Apply sorting
    filteredResults?.sort((a, b) => {
      switch (filterOptions?.sortBy) {
        case 'nutrition-score':
          return b?.nutritionScore - a?.nutritionScore;
        case 'sustainability':
          return b?.sustainabilityScore - a?.sustainabilityScore;
        case 'popularity':
          return b?.id - a?.id; // Mock popularity
        default:
          return 0;
      }
    });

    setResults(filteredResults);
  };

  // Navigation handlers
  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleNutritionExplore = (food) => {
    navigate('/nutrition-explorer-modal', { state: { food } });
  };

  const handleAddToFavorites = (foodId, isFavorited) => {
    setResults(prev =>
      prev?.map(item =>
        item?.id === foodId ? { ...item, isFavorited } : item
      )
    );
  };

  const handleShare = (food) => {
    if (navigator.share) {
      navigator.share({
        title: `${food?.name} - Smart Alternatives Finder`,
        text: `Check out this healthy alternative: ${food?.name} as a substitute for ${food?.alternativeTo}`,
        url: window.location?.href
      });
    } else {
      // Fallback to clipboard
      navigator.clipboard?.writeText(
        `${food?.name} - A healthy alternative to ${food?.alternativeTo}. Find more at ${window.location?.href}`
      );
    }
  };

  // Comparison handlers
  const handleComparisonToggle = () => {
    setShowComparison(!showComparison);
    if (!showComparison) {
      setSelectedItems([]);
    }
  };

  const handleCompareToggle = (foodId, isSelected) => {
    if (isSelected) {
      setSelectedItems(prev => [...prev, foodId]);
    } else {
      setSelectedItems(prev => prev?.filter(id => id !== foodId));
    }
  };

  const handleCompareSelected = () => {
    const selectedFoods = results?.filter(food => selectedItems?.includes(food?.id));
    navigate('/food-comparison-tool', { state: { foods: selectedFoods } });
  };

  // Load more functionality
  const handleLoadMore = () => {
    setLoadingMore(true);
    // Simulate loading more results
    setTimeout(() => {
      setLoadingMore(false);
      setHasMore(false); // For demo purposes
    }, 1000);
  };

  // Quick actions
  const handleExportResults = () => {
    console.log('Exporting results...');
  };

  const handleShareResults = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Food Search Results - Smart Alternatives Finder',
        text: `Found ${results?.length} healthy food alternatives for "${searchQuery}"`,
        url: window.location?.href
      });
    }
  };

  const handleSaveSearch = () => {
    console.log('Saving search...');
  };

  const handleClearSelection = () => {
    setSelectedItems([]);
  };

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
          {/* Breadcrumbs */}
          <NavigationBreadcrumbs onNavigate={handleNavigation} />

          {/* Search Header */}
          <SearchHeader
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            onSearch={handleSearch}
            resultCount={results?.length}
            isLoading={isLoading}
            onFilterToggle={() => setShowMobileFilters(!showMobileFilters)}
            showMobileFilters={showMobileFilters}
            onComparisonToggle={handleComparisonToggle}
            showComparison={showComparison}
            selectedCount={selectedItems?.length}
          />

          {/* Desktop Filters */}
          <div className="hidden lg:block">
            <SearchFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
              isVisible={true}
            />
          </div>

          {/* Mobile Filters */}
          <SearchFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            isVisible={showMobileFilters}
            onToggle={() => setShowMobileFilters(!showMobileFilters)}
            isMobile={true}
          />

          {/* Results Grid */}
          <ResultsGrid
            results={results}
            isLoading={isLoading}
            onNutritionExplore={handleNutritionExplore}
            onAddToFavorites={handleAddToFavorites}
            onShare={handleShare}
            showComparison={showComparison}
            selectedItems={selectedItems}
            onCompareToggle={handleCompareToggle}
            onLoadMore={handleLoadMore}
            hasMore={hasMore}
            loadingMore={loadingMore}
          />
        </div>
      </main>
      {/* Quick Actions */}
      <QuickActions
        selectedCount={selectedItems?.length}
        onCompareSelected={handleCompareSelected}
        onExportResults={handleExportResults}
        onShareResults={handleShareResults}
        onClearSelection={handleClearSelection}
        onSaveSearch={handleSaveSearch}
        onNavigate={handleNavigation}
        isVisible={showComparison || selectedItems?.length > 0}
      />
    </div>
  );
};

export default FoodSearchResults;