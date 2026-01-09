import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Icon from '../AppIcon';
import UserMenu from './UserMenu';
import MobileNavigation from './MobileNavigation';

const Header = ({ user = null }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // --- SEARCH STATES ---
  const [searchTerm, setSearchTerm] = useState("");
  const [allFoods, setAllFoods] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const searchRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  const navigationItems = [
    { label: 'Discover', path: '/', icon: 'Search' },
    { label: 'Compare', path: '/food-comparison-tool', icon: 'GitCompare' },
    { label: 'Dashboard', path: '/dashboard', icon: 'LayoutGrid' }
  ];

  // 1. Scroll Effect
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 2. FETCH DATABASE ON MOUNT (Hardcoded URL)
  useEffect(() => {
    // ✅ FIXED: Using direct localhost URL
    fetch('http://127.0.0.1:8000/foods/')
      .then(res => res.json())
      .then(data => setAllFoods(data))
      .catch(err => console.error("Header Search Error:", err));
  }, []);

  // 3. Filter Logic (As you type)
  useEffect(() => {
    if (searchTerm.trim().length > 0) {
      const lowerTerm = searchTerm.toLowerCase();
      const matches = allFoods.filter(food =>
        food.name.toLowerCase().includes(lowerTerm) ||
        food.category.toLowerCase().includes(lowerTerm)
      ).slice(0, 6); // Limit to top 6 results
      setSuggestions(matches);
      setShowDropdown(true);
    } else {
      setSuggestions([]);
      setShowDropdown(false);
    }
  }, [searchTerm, allFoods]);

  // 4. Hide Dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNavigation = (path) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter' || e.type === 'click') {
      if (searchTerm.trim()) {
        setShowDropdown(false);
        if (searchTerm.toLowerCase().includes(' vs ')) {
            const parts = searchTerm.toLowerCase().split(' vs ');
            navigate(`/food-comparison-tool?item1=${encodeURIComponent(parts[0])}&item2=${encodeURIComponent(parts[1])}`);
        } else {
            navigate(`/food-search-results?q=${encodeURIComponent(searchTerm)}`);
        }
      }
    }
  };

  const handleSuggestionClick = (food) => {
    setSearchTerm(food.name);
    setShowDropdown(false);
    navigate('/nutrition-explorer-modal', { state: { food } });
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

            {/* LOGO */}
            <div className="flex-shrink-0 flex items-center">
              <button onClick={() => handleNavigation('/')} className="flex items-center gap-3 group focus:outline-none">
                <div className="relative w-10 h-10 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-xl flex items-center justify-center text-black shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-xl">🍃</span>
                </div>
                <div className="hidden sm:block text-left">
                  <h1 className="text-xl font-bold text-white tracking-tight group-hover:text-emerald-400 transition-colors">
                    NutriAI
                  </h1>
                  <p className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold group-hover:text-gray-400 transition-colors">
                    Food Discovery
                  </p>
                </div>
              </button>
            </div>

            {/* DESKTOP NAV */}
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

            {/* SEARCH & ACTIONS */}
            <div className="flex items-center gap-4 flex-1 justify-end max-w-md">

              {/* SEARCH BAR WITH DROPDOWN */}
              <div ref={searchRef} className="hidden md:flex items-center w-full max-w-[280px] group transition-all duration-300 focus-within:max-w-full relative">
                <div className="relative w-full">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Icon name="Search" size={16} className="text-gray-500 group-focus-within:text-emerald-400 transition-colors" />
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={handleSearchSubmit}
                    onFocus={() => { if(searchTerm) setShowDropdown(true); }}
                    placeholder="Search foods..."
                    className="block w-full pl-10 pr-3 py-2.5 border border-white/10 rounded-full leading-5 bg-white/5 text-gray-300 placeholder-gray-500 focus:outline-none focus:bg-black focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 sm:text-sm transition-all duration-300"
                  />
                </div>

                {/* DROPDOWN LIST */}
                {showDropdown && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-[#111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">
                    <div className="py-2">
                        {suggestions.map((food) => (
                            <button
                                key={food.id}
                                onClick={() => handleSuggestionClick(food)}
                                className="w-full text-left px-4 py-3 hover:bg-white/5 flex items-center gap-3 transition-colors border-b border-white/5 last:border-0"
                            >
                                <img
                                  src={food.image || "/assets/images/no_image.png"}
                                  alt=""
                                  className="w-8 h-8 rounded-md object-cover bg-white/10"
                                />
                                <div>
                                    <p className="text-sm font-bold text-white">{food.name}</p>
                                    <p className="text-xs text-gray-500">{food.category}</p>
                                </div>
                                <div className="ml-auto text-xs font-bold text-emerald-400">
                                    {food.nutrition_score}
                                </div>
                            </button>
                        ))}
                    </div>
                  </div>
                )}
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

        <MobileNavigation
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          navigationItems={navigationItems}
          currentPath={location.pathname}
          onNavigate={handleNavigation}
          user={user}
        />

      </header>
      <div className="h-16 lg:h-20" />
    </>
  );
};

export default Header;