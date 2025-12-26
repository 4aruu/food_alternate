import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Icon from '../AppIcon';

// Ensure these exist or comment them out if not used yet
import SearchBar from './SearchBar';
import UserMenu from './UserMenu';
import MobileNavigation from './MobileNavigation';

const Header = ({ user = null, searchProps = {} }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const navigationItems = [
    {
      label: 'Discover',
      path: '/',
      icon: 'Search',
    },
    {
      label: 'Compare',
      path: '/food-comparison-tool',
      icon: 'GitCompare',
    },
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: 'LayoutGrid', // Updated icon to match "Dashboard" feel
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
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  const isActivePath = (path) => {
    if (path === '/' || path === '/landing-page') {
      return location.pathname === '/' || location.pathname === '/landing-page';
    }
    return location.pathname === path;
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'backdrop-blur-xl bg-black/80 border-b border-white/10 shadow-lg shadow-emerald-900/5'
            : 'backdrop-blur-md bg-transparent border-b border-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">

            {/* 1. LOGO AREA */}
            <div className="flex-shrink-0 flex items-center">
              <button
                onClick={() => handleNavigation('/')}
                className="flex items-center gap-3 group focus:outline-none"
              >
                <div className="relative w-10 h-10 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-xl flex items-center justify-center text-black shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-xl">🍃</span>
                </div>
                <div className="hidden sm:block text-left">
                  <h1 className="text-xl font-bold text-white tracking-tight group-hover:text-emerald-400 transition-colors">
                    NutriSwap
                  </h1>
                  <p className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold group-hover:text-gray-400 transition-colors">
                    Alt Food Discovery
                  </p>
                </div>
              </button>
            </div>

            {/* 2. DESKTOP NAVIGATION (The Pill Design) */}
            <nav className="hidden lg:flex items-center gap-2">
              {navigationItems.map((item) => {
                const active = isActivePath(item.path);
                return (
                  <button
                    key={item.path}
                    onClick={() => handleNavigation(item.path)}
                    className={`
                      relative px-5 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2 transition-all duration-300 border
                      ${active
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                        : 'bg-transparent border-transparent text-gray-400 hover:text-white hover:bg-white/5'
                      }
                    `}
                  >
                    <Icon name={item.icon} size={18} className={active ? "animate-pulse" : ""} />
                    {item.label}
                  </button>
                );
              })}
            </nav>

            {/* 3. SEARCH & ACTIONS */}
            <div className="flex items-center gap-4 flex-1 justify-end max-w-md">

              {/* Search Bar */}
              <div className="hidden md:flex items-center w-full max-w-[280px] group transition-all duration-300 focus-within:max-w-full">
                <div className="relative w-full">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Icon name="Search" size={16} className="text-gray-500 group-focus-within:text-emerald-400 transition-colors" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search for food alternatives..."
                    className="block w-full pl-10 pr-3 py-2.5 border border-white/10 rounded-full leading-5 bg-white/5 text-gray-300 placeholder-gray-500 focus:outline-none focus:bg-black focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 sm:text-sm transition-all duration-300"
                    // If you have SearchBar logic, connect it here:
                    // onChange={(e) => searchProps.onSearch?.(e.target.value)}
                  />
                </div>
              </div>

              {/* Sign In Button */}
              <button className="hidden sm:flex items-center gap-2 bg-[#1a1a1a] hover:bg-[#222] border border-white/10 text-white px-5 py-2.5 rounded-full text-sm font-bold transition-all hover:scale-105 hover:border-emerald-500/30 active:scale-95">
                <Icon name="User" size={18} className="text-emerald-400" />
                <span>Sign In</span>
                <Icon name="ChevronDown" size={14} className="text-gray-500" />
              </button>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 text-gray-400 hover:text-white transition-colors"
              >
                <Icon name={isMobileMenuOpen ? 'X' : 'Menu'} size={24} />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav (Optional, included for completeness) */}
        <MobileNavigation
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          navigationItems={navigationItems}
          currentPath={location.pathname}
          onNavigate={handleNavigation}
          user={user}
        />

      </header>

      {/* Spacer to prevent content from hiding behind fixed header */}
      <div className="h-16 lg:h-20" />
    </>
  );
};

export default Header;