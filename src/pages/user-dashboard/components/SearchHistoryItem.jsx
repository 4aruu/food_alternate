import React from 'react';
import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const SearchHistoryItem = ({ 
  search, 
  onReSearch, 
  onRemove,
  className = "" 
}) => {
  const {
    id,
    query,
    timestamp,
    resultsCount,
    filters = [],
    category
  } = search;

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date?.toLocaleDateString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className={`glass rounded-lg p-4 hover:shadow-glass-lg transition-all duration-300 group ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <Icon name="Search" size={16} className="text-accent" />
            <h4 className="font-medium text-foreground">{query}</h4>
            {category && (
              <span className="px-2 py-1 rounded-md bg-primary/20 text-primary text-xs font-medium">
                {category}
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
            <span>{formatTimestamp(timestamp)}</span>
            <span>•</span>
            <span>{resultsCount} results found</span>
          </div>

          {filters?.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {filters?.map((filter, index) => (
                <span
                  key={index}
                  className="px-2 py-1 rounded-md bg-secondary/20 text-secondary text-xs"
                >
                  {filter}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2 ml-4">
          <Button
            variant="ghost"
            size="sm"
            iconName="RotateCcw"
            onClick={() => onReSearch(search)}
            className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          >
            Re-search
          </Button>
          <button
            onClick={() => onRemove(id)}
            className="w-8 h-8 rounded-lg text-muted-foreground hover:text-error hover:bg-error/10 flex items-center justify-center transition-all duration-200"
            aria-label="Remove from history"
          >
            <Icon name="X" size={16} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default SearchHistoryItem;