import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Icon from '../AppIcon';
import SearchBar from './SearchBar';
import UserMenu from './UserMenu';
import MobileNavigation from './MobileNavigation';

const Header = ({ user = null, onNavigate = () => {}, searchProps = {} }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  const navigationItems = [
    {
      label: 'Discover',
      path: '/landing-page',
      icon: 'Search',
      description: 'Find food alternatives and explore options'
    },
    {
      label: 'Compare',
      path: '/food-comparison-tool',
      icon: 'GitCompare',
      description: 'Side-by-side comparison of food substitutes'
    },
    {
      label: 'Dashboard',
      path: '/user-dashboard',
      icon: 'LayoutDashboard',
      description: 'Your personalized nutrition hub'
    }
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavigation = (path) => {
    onNavigate(path);
    setIsMobileMenuOpen(false);
  };

  const isActivePath = (path) => {
    if (path === '/landing-page') {
      return location?.pathname === '/' || location?.pathname === '/landing-page';
    }
    return location?.pathname === path;
  };

  return (
    <>
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? 'glass shadow-glass' 
            : 'bg-transparent'
        }`}
      >
        <div className="w-full px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-18">
            {/* Logo */}
            <div className="flex items-center">
              <button
                onClick={() => handleNavigation('/landing-page')}
                className="flex items-center space-x-3 group transition-all duration-200 hover:scale-105"
                aria-label="Smart Alternatives Finder Home"
              >
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-glass">
                    <Icon 
                      name="Zap" 
                      size={24} 
                      className="text-primary-foreground group-hover:animate-pulse-glow" 
                    />
                  </div>
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-accent/20 to-secondary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-xl font-bold text-foreground group-hover:text-accent transition-colors duration-200">
                    Smart Alternatives
                  </h1>
                  <p className="text-xs text-muted-foreground font-medium">
                    Finder
                  </p>
                </div>
              </button>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-1" role="navigation">
              {navigationItems?.map((item) => (
                <button
                  key={item?.path}
                  onClick={() => handleNavigation(item?.path)}
                  className={`relative px-4 py-2 rounded-lg font-medium transition-all duration-200 group ${
                    isActivePath(item?.path)
                      ? 'text-accent bg-accent/10 shadow-neon'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                  aria-current={isActivePath(item?.path) ? 'page' : undefined}
                  title={item?.description}
                >
                  <div className="flex items-center space-x-2">
                    <Icon 
                      name={item?.icon} 
                      size={18} 
                      className={`transition-colors duration-200 ${
                        isActivePath(item?.path) ? 'text-accent' : 'group-hover:text-accent'
                      }`}
                    />
                    <span>{item?.label}</span>
                  </div>
                  {isActivePath(item?.path) && (
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1/2 h-0.5 bg-accent rounded-full"></div>
                  )}
                </button>
              ))}
            </nav>

            {/* Search Bar - Desktop */}
            <div className="hidden md:block flex-1 max-w-md mx-8">
              <SearchBar {...searchProps} />
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-4">
              {/* Search Icon - Mobile */}
              <button
                className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-accent hover:bg-muted/50 transition-all duration-200"
                onClick={() => searchProps?.onSearchToggle?.()}
                aria-label="Open search"
              >
                <Icon name="Search" size={20} />
              </button>

              {/* User Menu */}
              <UserMenu user={user} onNavigate={handleNavigation} />

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg text-muted-foreground hover:text-accent hover:bg-muted/50 transition-all duration-200"
                aria-label="Toggle mobile menu"
                aria-expanded={isMobileMenuOpen}
              >
                <Icon name={isMobileMenuOpen ? "X" : "Menu"} size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>
      {/* Mobile Navigation */}
      <MobileNavigation
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        navigationItems={navigationItems}
        currentPath={location?.pathname}
        onNavigate={handleNavigation}
        user={user}
        searchProps={searchProps}
      />
      {/* Backdrop for mobile menu */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
};

export default Header;