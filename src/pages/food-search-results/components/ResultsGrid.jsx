import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../../../components/AppIcon';
import ResultCard from './ResultCard';
import LoadingSkeleton from './LoadingSkeleton';

const ResultsGrid = ({ 
  results = [], 
  isLoading = false,
  onNutritionExplore = () => {},
  onAddToFavorites = () => {},
  onShare = () => {},
  showComparison = false,
  selectedItems = [],
  onCompareToggle = () => {},
  onLoadMore = () => {},
  hasMore = false,
  loadingMore = false
}) => {
  const [visibleResults, setVisibleResults] = useState([]);
  const [displayCount, setDisplayCount] = useState(12);

  useEffect(() => {
    setVisibleResults(results?.slice(0, displayCount));
  }, [results, displayCount]);

  const handleLoadMore = () => {
    if (hasMore && !loadingMore) {
      setDisplayCount(prev => prev + 12);
      onLoadMore();
    }
  };

  const handleScroll = () => {
    if (
      window.innerHeight + document.documentElement?.scrollTop
      >= document.documentElement?.offsetHeight - 1000
    ) {
      handleLoadMore();
    }
  };

  useEffect(() => {
    if (hasMore) {
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, [hasMore, loadingMore]);

  if (isLoading && results?.length === 0) {
    return <LoadingSkeleton count={12} />;
  }

  if (!isLoading && results?.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-16"
      >
        <div className="glass rounded-xl border border-glass-border p-12 max-w-md mx-auto">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted/30 flex items-center justify-center">
            <Icon name="Search" size={32} className="text-muted-foreground" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">
            No alternatives found
          </h3>
          <p className="text-muted-foreground mb-6">
            We couldn't find any food alternatives matching your search criteria. Try adjusting your filters or search terms.
          </p>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• Try broader search terms</p>
            <p>• Remove some filters</p>
            <p>• Check spelling and try again</p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <AnimatePresence mode="popLayout">
          {visibleResults?.map((food, index) => (
            <ResultCard
              key={food?.id}
              food={food}
              index={index}
              onNutritionExplore={onNutritionExplore}
              onAddToFavorites={onAddToFavorites}
              onShare={onShare}
              showComparison={showComparison}
              isSelected={selectedItems?.includes(food?.id)}
              onCompareToggle={onCompareToggle}
            />
          ))}
        </AnimatePresence>
      </div>
      {/* Load More Section */}
      {(hasMore || loadingMore) && (
        <div className="text-center py-8">
          {loadingMore ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-2">
                <Icon name="Loader2" size={20} className="animate-spin text-accent" />
                <span className="text-muted-foreground">Loading more alternatives...</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <LoadingSkeleton count={4} />
              </div>
            </div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLoadMore}
              className="glass rounded-xl border border-glass-border px-8 py-4 text-foreground hover:text-accent transition-all duration-200 hover:shadow-glass-lg group"
            >
              <div className="flex items-center space-x-2">
                <Icon name="ChevronDown" size={20} className="group-hover:animate-bounce" />
                <span className="font-medium">Load More Alternatives</span>
              </div>
            </motion.button>
          )}
        </div>
      )}
      {/* Results Summary */}
      <div className="text-center py-4 border-t border-glass-border">
        <p className="text-sm text-muted-foreground">
          Showing {visibleResults?.length} of {results?.length} alternatives
          {hasMore && ` • ${results?.length - visibleResults?.length} more available`}
        </p>
      </div>
    </div>
  );
};

export default ResultsGrid;