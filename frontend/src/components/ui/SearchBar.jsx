import React, { useState, useRef, useEffect } from 'react';
import Icon from '../AppIcon';

const SearchBar = ({ 
  onSearch = () => {}, 
  onSuggestionSelect = () => {},
  placeholder = "Search for food alternatives...",
  suggestions = [],
  isLoading = false,
  className = ""
}) => {
  const [query, setQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  const mockSuggestions = [
    { id: 1, text: 'Almond milk alternatives', category: 'Dairy' },
    { id: 2, text: 'Gluten-free bread options', category: 'Grains' },
    { id: 3, text: 'Plant-based protein sources', category: 'Protein' },
    { id: 4, text: 'Sugar substitutes', category: 'Sweeteners' },
    { id: 5, text: 'Vegan cheese alternatives', category: 'Dairy' }
  ];

  const displaySuggestions = suggestions?.length > 0 ? suggestions : mockSuggestions;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        inputRef?.current && 
        !inputRef?.current?.contains(event?.target) &&
        suggestionsRef?.current &&
        !suggestionsRef?.current?.contains(event?.target)
      ) {
        setShowSuggestions(false);
        setIsExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const value = e?.target?.value;
    setQuery(value);
    setShowSuggestions(value?.length > 0);
    setSelectedIndex(-1);
    
    // Debounced search
    const timeoutId = setTimeout(() => {
      if (value?.trim()) {
        onSearch(value);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions) return;

    switch (e?.key) {
      case 'ArrowDown':
        e?.preventDefault();
        setSelectedIndex(prev => 
          prev < displaySuggestions?.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e?.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : displaySuggestions?.length - 1
        );
        break;
      case 'Enter':
        e?.preventDefault();
        if (selectedIndex >= 0) {
          handleSuggestionClick(displaySuggestions?.[selectedIndex]);
        } else if (query?.trim()) {
          handleSearch();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setIsExpanded(false);
        inputRef?.current?.blur();
        break;
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion?.text);
    setShowSuggestions(false);
    setIsExpanded(false);
    onSuggestionSelect(suggestion);
  };

  const handleSearch = () => {
    if (query?.trim()) {
      onSearch(query);
      setShowSuggestions(false);
    }
  };

  const handleFocus = () => {
    setIsExpanded(true);
    if (query?.length > 0) {
      setShowSuggestions(true);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setShowSuggestions(false);
    inputRef?.current?.focus();
  };

  return (
    <div className={`relative ${className}`}>
      <div 
        className={`relative transition-all duration-300 ${
          isExpanded ? 'glass shadow-glass' : 'bg-input/50 hover:bg-input'
        } rounded-xl border border-border`}
      >
        <div className="flex items-center">
          <div className="pl-4 pr-2">
            <Icon 
              name="Search" 
              size={20} 
              className={`transition-colors duration-200 ${
                isExpanded ? 'text-accent' : 'text-muted-foreground'
              }`}
            />
          </div>
          
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            placeholder={placeholder}
            className="flex-1 bg-transparent text-foreground placeholder-muted-foreground py-3 pr-4 focus:outline-none"
            aria-label="Search for food alternatives"
            aria-expanded={showSuggestions}
            aria-haspopup="listbox"
            role="combobox"
            aria-activedescendant={selectedIndex >= 0 ? `suggestion-${selectedIndex}` : undefined}
          />

          <div className="flex items-center pr-2 space-x-1">
            {isLoading && (
              <div className="animate-spin">
                <Icon name="Loader2" size={16} className="text-accent" />
              </div>
            )}
            
            {query && (
              <button
                onClick={clearSearch}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200"
                aria-label="Clear search"
              >
                <Icon name="X" size={16} />
              </button>
            )}

            <button
              onClick={handleSearch}
              disabled={!query?.trim() || isLoading}
              className="p-1 rounded-md text-muted-foreground hover:text-accent hover:bg-accent/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              aria-label="Search"
            >
              <Icon name="ArrowRight" size={16} />
            </button>
          </div>
        </div>
      </div>
      {/* Suggestions Dropdown */}
      {showSuggestions && displaySuggestions?.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-2 glass rounded-xl border border-glass-border shadow-glass-lg z-50 max-h-80 overflow-y-auto"
          role="listbox"
        >
          <div className="p-2">
            {displaySuggestions?.map((suggestion, index) => (
              <button
                key={suggestion?.id}
                id={`suggestion-${index}`}
                onClick={() => handleSuggestionClick(suggestion)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-200 ${
                  index === selectedIndex
                    ? 'bg-accent/20 text-accent border border-accent/30' :'text-foreground hover:bg-muted/50 hover:text-accent'
                }`}
                role="option"
                aria-selected={index === selectedIndex}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{suggestion?.text}</span>
                  <span className="text-xs text-muted-foreground bg-muted/30 px-2 py-1 rounded-md">
                    {suggestion?.category}
                  </span>
                </div>
              </button>
            ))}
          </div>
          
          <div className="border-t border-glass-border p-3">
            <div className="flex items-center justify-center text-xs text-muted-foreground">
              <Icon name="Lightbulb" size={14} className="mr-1" />
              Press Enter to search or click a suggestion
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;