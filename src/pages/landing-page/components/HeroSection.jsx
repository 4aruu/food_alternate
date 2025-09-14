import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';

const HeroSection = ({ onNavigate = () => {}, onSearch = () => {} }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  const mockSuggestions = [
    { id: 1, text: 'Almond milk alternatives', category: 'Dairy' },
    { id: 2, text: 'Gluten-free bread options', category: 'Grains' },
    { id: 3, text: 'Plant-based protein sources', category: 'Protein' },
    { id: 4, text: 'Sugar substitutes', category: 'Sweeteners' },
    { id: 5, text: 'Vegan cheese alternatives', category: 'Dairy' }
  ];

  const floatingFoods = [
    { id: 1, name: 'Apple', image: 'https://images.pexels.com/photos/102104/pexels-photo-102104.jpeg', x: 10, y: 20, delay: 0 },
    { id: 2, name: 'Avocado', image: 'https://images.pexels.com/photos/557659/pexels-photo-557659.jpeg', x: 80, y: 15, delay: 1 },
    { id: 3, name: 'Quinoa', image: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg', x: 15, y: 70, delay: 2 },
    { id: 4, name: 'Almonds', image: 'https://images.pexels.com/photos/1295572/pexels-photo-1295572.jpeg', x: 85, y: 75, delay: 0.5 },
    { id: 5, name: 'Blueberries', image: 'https://images.pexels.com/photos/357573/pexels-photo-357573.jpeg', x: 50, y: 10, delay: 1.5 },
    { id: 6, name: 'Spinach', image: 'https://images.pexels.com/photos/2325843/pexels-photo-2325843.jpeg', x: 25, y: 45, delay: 2.5 }
  ];

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    if (searchQuery?.trim()) {
      onSearch(searchQuery);
      onNavigate('/food-search-results');
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion?.text);
    setShowSuggestions(false);
    onSearch(suggestion?.text);
    onNavigate('/food-search-results');
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900">
      {/* Animated Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-blue-900/80 to-purple-900/90 animate-pulse-glow"></div>
      {/* Floating Food Items */}
      {floatingFoods?.map((food) => (
        <motion.div
          key={food?.id}
          className="absolute w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden shadow-glass opacity-80"
          style={{
            left: `${food?.x}%`,
            top: `${food?.y}%`,
            transform: `translateY(${scrollY * 0.1}px)`
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ 
            opacity: 0.8, 
            scale: 1,
            y: [0, -20, 0]
          }}
          transition={{
            duration: 2,
            delay: food?.delay,
            y: {
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }
          }}
        >
          <Image
            src={food?.image}
            alt={food?.name}
            className="w-full h-full object-cover"
          />
        </motion.div>
      ))}
      {/* Main Content */}
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 leading-tight">
            Discover
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-secondary ml-4">
              Smarter
            </span>
            <br />
            Food Alternatives
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
            Find healthier, allergen-free, and eco-friendly food substitutes with our intelligent discovery platform
          </p>
        </motion.div>

        {/* Glassmorphic Search Bar */}
        <motion.div
          className="relative max-w-2xl mx-auto mb-12"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <form onSubmit={handleSearchSubmit} className="relative">
            <div className="glass rounded-2xl border border-glass-border shadow-glass-lg p-2">
              <div className="flex items-center">
                <div className="pl-6 pr-4">
                  <Icon name="Search" size={24} className="text-accent" />
                </div>
                
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e?.target?.value);
                    setShowSuggestions(e?.target?.value?.length > 0);
                  }}
                  onFocus={() => searchQuery?.length > 0 && setShowSuggestions(true)}
                  placeholder="Search for food alternatives..."
                  className="flex-1 bg-transparent text-foreground placeholder-muted-foreground py-4 text-lg focus:outline-none"
                />

                <Button
                  type="submit"
                  variant="default"
                  size="lg"
                  className="mr-2 neon-glow-primary"
                  iconName="ArrowRight"
                  iconPosition="right"
                >
                  Search
                </Button>
              </div>
            </div>

            {/* Search Suggestions */}
            {showSuggestions && mockSuggestions?.length > 0 && (
              <motion.div
                className="absolute top-full left-0 right-0 mt-2 glass rounded-xl border border-glass-border shadow-glass-lg z-50"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="p-2">
                  {mockSuggestions?.map((suggestion) => (
                    <button
                      key={suggestion?.id}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full text-left px-4 py-3 rounded-lg text-foreground hover:bg-accent/20 hover:text-accent transition-all duration-200"
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
              </motion.div>
            )}
          </form>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <Button
            variant="outline"
            size="lg"
            onClick={() => onNavigate('/user-registration')}
            iconName="UserPlus"
            iconPosition="left"
            className="glass border-accent/30 hover:bg-accent/10 text-accent"
          >
            Create Free Account
          </Button>
          
          <Button
            variant="ghost"
            size="lg"
            onClick={() => onNavigate('/food-comparison-tool')}
            iconName="GitCompare"
            iconPosition="left"
            className="text-muted-foreground hover:text-accent"
          >
            Compare Foods
          </Button>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex flex-col items-center text-muted-foreground"
          >
            <span className="text-sm mb-2">Scroll to explore</span>
            <Icon name="ChevronDown" size={20} />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;