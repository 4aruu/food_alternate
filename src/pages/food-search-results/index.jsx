import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; // Added useLocation
import { motion, AnimatePresence } from 'framer-motion';
import Header from '../../components/ui/Header';
import Icon from '../../components/AppIcon';
// 1. IMPORT THE HISTORY HELPER
import { addToHistory } from '../../utils/history';

// --- SUB-COMPONENTS ---

const FilterBadge = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 border backdrop-blur-md ${
      active
      ? 'bg-emerald-500 text-black border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
      : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:text-white'
    }`}
  >
    {label}
  </button>
);

const ResultCard = ({ item, onClick }) => (
  <motion.div
    layout
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    whileHover={{ y: -5 }}
    onClick={onClick}
    className="group relative h-80 rounded-3xl overflow-hidden cursor-pointer border border-white/10 hover:border-emerald-500/50 transition-all duration-300 bg-[#1a1a1a]"
  >
    {/* --- IMAGE BACKGROUND --- */}
    <div className="absolute inset-0">
      <img
        src={item.image}
        alt={item.name}
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = "/assets/images/no_image.png";
        }}
      />
      {/* Dark Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90" />
    </div>

    {/* SCORE BADGE */}
    <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 z-10 flex items-center gap-1">
      <span className={`text-xs font-bold ${item.nutrition_score > 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
        {item.nutrition_score}
      </span>
      <span className="text-[10px] text-gray-400 uppercase">Score</span>
    </div>

    {/* TEXT CONTENT */}
    <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
      <h3 className="text-xl font-bold text-white mb-1 leading-tight group-hover:text-emerald-400 transition-colors">
        {item.name}
      </h3>
      <p className="text-sm text-gray-300 mb-4">{item.category}</p>

      <div className="flex gap-4 text-xs text-gray-400 border-t border-white/20 pt-4">
        <span className="flex items-center gap-1">
            <Icon name="Activity" size={12} className="text-emerald-500"/>
            {item.nutrition?.calories || 0} cal
        </span>
        <span className="flex items-center gap-1">
            <Icon name="Zap" size={12} className="text-yellow-500"/>
            {item.nutrition?.protein || 0}g prot
        </span>
      </div>
    </div>
  </motion.div>
);

// --- MAIN PAGE ---

const FoodSearchResults = () => {
  const navigate = useNavigate();
  const location = useLocation(); // Hook to read URL

  // State for Real Data
  const [allFoods, setAllFoods] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // 1. Fetch from Backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/foods/'); // Added trailing slash for safety
        const data = await response.json();
        setAllFoods(data);
        // Don't set filteredResults here immediately, let the filter effect handle it
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching foods:", error);
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // 2. Sync URL Search to State (Connecting Header to Page)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get("q");
    if (q) {
        setSearchTerm(q);
    } else {
        setSearchTerm("");
    }
  }, [location.search]);

  // 3. Filter Logic (Category + Search)
  useEffect(() => {
    if (allFoods.length === 0) return;

    let results = allFoods;

    // Filter by Category Button
    if (activeFilter !== 'All') {
        if (activeFilter === 'High Protein') {
            results = results.filter(item => (item.nutrition?.protein || 0) > 15);
        } else if (activeFilter === 'Low Calorie') {
            results = results.filter(item => (item.nutrition?.calories || 0) < 300);
        } else {
            results = results.filter(item => item.category === activeFilter);
        }
    }

    // Filter by Search Term
    if (searchTerm) {
        const lowerTerm = searchTerm.toLowerCase();
        results = results.filter(item =>
            item.name.toLowerCase().includes(lowerTerm) ||
            item.category.toLowerCase().includes(lowerTerm)
        );
    }

    setFilteredResults(results);
  }, [activeFilter, searchTerm, allFoods]);

  // Categories for Filter Bar
  const filters = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Snack', 'High Protein', 'Low Calorie'];

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-emerald-500/30">

      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px]" />
      </div>

      <Header onNavigate={(path) => navigate(path)} />

      <main className="relative z-10 pt-28 px-6 pb-20 max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-12">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold mb-4"
          >
            {searchTerm ? (
                <>Results for "<span className="text-emerald-400">{searchTerm}</span>"</>
            ) : (
                <>Found <span className="text-emerald-400">{filteredResults.length}</span> Alternatives</>
            )}
          </motion.h1>
          <p className="text-gray-400 text-lg">
            Browse our database of healthy, sustainable, and native foods.
          </p>
        </div>

        {/* Filters Bar */}
        <div className="flex gap-3 overflow-x-auto pb-8 mb-4 scrollbar-hide">
          {filters.map(filter => (
            <FilterBadge
              key={filter}
              label={filter}
              active={activeFilter === filter}
              onClick={() => setActiveFilter(filter)}
            />
          ))}
        </div>

        {/* Results Grid */}
        {isLoading ? (
            <div className="text-center py-20 text-gray-500">Loading foods...</div>
        ) : (
            <motion.div
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
            <AnimatePresence>
                {filteredResults.map((item) => (
                // ... inside src/pages/food-search-results/index.jsx ...

                <ResultCard
                    key={item.id}
                    item={item}
                    onClick={() => {
                        addToHistory(item);
                        console.log("Saved to history:", item.name); // Debug log

                        // Then navigate
                        navigate('/nutrition-explorer-modal', { state: { food: item } });
                    }}
                />
                ))}
            </AnimatePresence>
            </motion.div>
        )}

        {/* Empty State */}
        {!isLoading && filteredResults.length === 0 && (
          <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10">
             <div className="text-6xl mb-4">🔍</div>
             <h3 className="text-2xl font-bold text-white">No matches found</h3>
             <p className="text-gray-400 mt-2">Try adjusting your search or filters.</p>
          </div>
        )}
      </main>
      <footer className="py-12 border-t border-white/10 text-center text-gray-500 text-sm">
        <p>&copy; 2025 NutriSwap. Designed for the future.</p>
      </footer>
    </div>
  );
};

export default FoodSearchResults;