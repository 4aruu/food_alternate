import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Header from '../../components/ui/Header';
import HeroSection from './components/HeroSection';
import FeatureHighlights from './components/FeatureHighlights';
import TrustSignals from './components/TrustSignals';
import UserTestimonials from './components/UserTestimonials';
import CallToAction from './components/CallToAction';

const LandingPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Mock user data - set to null for non-authenticated state
  const mockUser = null;

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement?.scrollHeight - window.innerHeight;
      const currentProgress = window.scrollY;
      setScrollProgress((currentProgress / totalScroll) * 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    // Store search query for use in search results page
    sessionStorage.setItem('searchQuery', query);
  };

  const handleSearchToggle = () => {
    setIsSearchExpanded(!isSearchExpanded);
  };

  const searchProps = {
    onSearch: handleSearch,
    onSearchToggle: handleSearchToggle,
    placeholder: "Search for food alternatives...",
    suggestions: [],
    isLoading: false
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <Header 
        user={mockUser}
        onNavigate={handleNavigation}
        searchProps={searchProps}
      />
      {/* Scroll Progress Indicator */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent to-secondary z-50"
        style={{ scaleX: scrollProgress / 100 }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: scrollProgress / 100 }}
        transition={{ duration: 0.1 }}
      />
      {/* Mobile Search Overlay */}
      {isSearchExpanded && (
        <motion.div
          className="fixed inset-0 z-40 md:hidden glass backdrop-blur-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="flex items-center justify-center min-h-screen p-6">
            <div className="w-full max-w-md">
              <div className="glass rounded-2xl p-6 border border-glass-border">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-foreground">Search Alternatives</h3>
                  <button
                    onClick={handleSearchToggle}
                    className="p-2 rounded-lg text-muted-foreground hover:text-foreground"
                  >
                    ×
                  </button>
                </div>
                <form onSubmit={(e) => {
                  e?.preventDefault();
                  if (searchQuery?.trim()) {
                    handleSearch(searchQuery);
                    handleNavigation('/food-search-results');
                    setIsSearchExpanded(false);
                  }
                }}>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e?.target?.value)}
                    placeholder="Search for food alternatives..."
                    className="w-full bg-input text-foreground placeholder-muted-foreground p-4 rounded-xl border border-border focus:outline-none focus:border-accent"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="w-full mt-4 bg-accent text-slate-900 font-semibold py-3 rounded-xl hover:shadow-neon transition-all duration-300"
                  >
                    Search
                  </button>
                </form>
              </div>
            </div>
          </div>
        </motion.div>
      )}
      {/* Main Content */}
      <main className="relative">
        {/* Hero Section */}
        <HeroSection 
          onNavigate={handleNavigation}
          onSearch={handleSearch}
        />

        {/* Feature Highlights */}
        <FeatureHighlights 
          onNavigate={handleNavigation}
        />

        {/* Trust Signals */}
        <TrustSignals />

        {/* User Testimonials */}
        <UserTestimonials />

        {/* Call to Action */}
        <CallToAction 
          onNavigate={handleNavigation}
        />
      </main>
      {/* Footer */}
      <footer className="bg-slate-900 border-t border-glass-border py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-lg">S</span>
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-lg">Smart Alternatives Finder</h3>
                  <p className="text-sm text-muted-foreground">Discover healthier food choices</p>
                </div>
              </div>
              <p className="text-muted-foreground mb-4 max-w-md">
                Empowering you to make informed food choices with comprehensive nutrition analysis, 
                allergen warnings, and sustainability scoring.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold text-foreground mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li>
                  <button 
                    onClick={() => handleNavigation('/food-search-results')}
                    className="text-muted-foreground hover:text-accent transition-colors duration-200"
                  >
                    Search Foods
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => handleNavigation('/food-comparison-tool')}
                    className="text-muted-foreground hover:text-accent transition-colors duration-200"
                  >
                    Compare Foods
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => handleNavigation('/nutrition-explorer-modal')}
                    className="text-muted-foreground hover:text-accent transition-colors duration-200"
                  >
                    Nutrition Explorer
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => handleNavigation('/user-dashboard')}
                    className="text-muted-foreground hover:text-accent transition-colors duration-200"
                  >
                    Dashboard
                  </button>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="font-semibold text-foreground mb-4">Support</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-muted-foreground hover:text-accent transition-colors duration-200">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-accent transition-colors duration-200">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-accent transition-colors duration-200">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-accent transition-colors duration-200">
                    Contact Us
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-glass-border mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-muted-foreground text-sm">
              © {new Date()?.getFullYear()} Smart Alternatives Finder. All rights reserved.
            </p>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <a href="#" className="text-muted-foreground hover:text-accent transition-colors duration-200">
                Privacy
              </a>
              <a href="#" className="text-muted-foreground hover:text-accent transition-colors duration-200">
                Terms
              </a>
              <a href="#" className="text-muted-foreground hover:text-accent transition-colors duration-200">
                Support
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;