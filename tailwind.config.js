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

  const isLandingPage = location?.pathname === '/' || location?.pathname === '/landing-page';

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'backdrop-blur-xl bg-black/50 border-b border-white/10'
            : isLandingPage
            ? 'backdrop-blur-xl bg-transparent'
            : 'backdrop-blur-xl bg-black/50 border-b border-white/10'
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
                <div className="relative w-10 h-10 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center font-bold text-black">
                  🍃
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors duration-200">
                    AltFinder
                  </h1>
                  <p className="text-xs text-gray-400 font-medium">
                    Food Discovery
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
                  className={`relative px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    isActivePath(item?.path)
                      ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                  aria-current={isActivePath(item?.path) ? 'page' : undefined}
                >
                  <div className="flex items-center space-x-2">
                    <Icon name={item?.icon} size={18} />
                    <span>{item?.label}</span>
                  </div>
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
                className="md:hidden p-2 rounded-lg text-gray-400 hover:text-emerald-400 hover:bg-white/10 transition-all duration-200"
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
                className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-emerald-400 hover:bg-white/10 transition-all duration-200"
                aria-label="Toggle mobile menu"
                aria-expanded={isMobileMenuOpen}
              >
                <Icon name={isMobileMenuOpen ? 'X' : 'Menu'} size={20} />
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
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
};

export default Header;