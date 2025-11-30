import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '../../components/ui/Header';
import Icon from '../../components/AppIcon';


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
    className="group relative h-80 rounded-3xl overflow-hidden cursor-pointer border border-white/10 hover:border-emerald-500/50 transition-all duration-300"
  >
    {/* --- IMAGE BACKGROUND --- */}
    <div className="absolute inset-0">
      <img
        src={item.image}
        alt={item.name}
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = "https://placehold.co/600x400/1a1a1a/FFF?text=No+Image"; // Fallback if image fails
        }}
      />
      {/* Dark Overlay so text is readable */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-90" />
    </div>

    {/* MATCH BADGE */}
    <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 z-10">
      <span className={`text-xs font-bold ${item.nutrition_score > 90 ? 'text-emerald-400' : 'text-amber-400'}`}>
        {item.nutrition_score}% Match
      </span>
    </div>

    {/* TEXT CONTENT (Pushed to bottom) */}
    <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
      <h3 className="text-xl font-bold text-white mb-1 group-hover:text-emerald-400 transition-colors">
        {item.name}
      </h3>
      <p className="text-sm text-gray-300 mb-4">{item.category}</p>

      <div className="flex gap-4 text-sm text-gray-400 border-t border-white/20 pt-4">
        <span>⚡ {item.nutrition?.calories || 0} cal</span>
        <span>💪 {item.nutrition?.protein || 0}g prot</span>
      </div>
    </div>
  </motion.div>
);

const FoodSearchResults = () => {
  const navigate = useNavigate();
  const [results, setResults] = useState(MOCK_DATA);
  const [activeFilter, setActiveFilter] = useState('All');

  // Filter Logic
  const handleFilterClick = (filter) => {
    setActiveFilter(filter);
    if (filter === 'All') {
      setResults(MOCK_DATA);
    } else {
      setResults(MOCK_DATA.filter(item => item.tags.includes(filter)));
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-emerald-500/30">

      {/* Background Ambience (The Aurora Glow) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px]" />
      </div>

      <Header
        onNavigate={(path) => navigate(path)}
        searchProps={{ onSearch: () => {} }}
      />

      <main className="relative z-10 pt-28 px-6 pb-20 max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-12">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold mb-4"
          >
            Found <span className="text-emerald-400">{results.length}</span> Alternatives
          </motion.h1>
          <p className="text-gray-400 text-lg">
            AI-sorted based on nutritional value and sustainability.
          </p>
        </div>

        {/* Filters */}
        <div className="flex gap-3 overflow-x-auto pb-8 mb-4 scrollbar-hide">
          {['All', 'High Protein', 'Vegan', 'Dairy-Free'].map(filter => (
            <FilterBadge
              key={filter}
              label={filter}
              active={activeFilter === filter}
              onClick={() => handleFilterClick(filter)}
            />
          ))}
        </div>

        {/* Results Grid */}
        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence>
            {results.map((item) => (
              <ResultCard
                key={item.id}
                item={item}
                onClick={() => navigate('/nutrition-explorer-modal')}
              />
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Empty State (Only shows if filters hide everything) */}
        {results.length === 0 && (
          <div className="text-center py-20">
             <div className="text-6xl mb-4">🔍</div>
             <h3 className="text-2xl font-bold text-gray-300">No matches found</h3>
          </div>
        )}
      </main>
    </div>
  );
};

export default FoodSearchResults;