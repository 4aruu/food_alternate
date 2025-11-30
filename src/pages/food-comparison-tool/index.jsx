import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../../components/ui/Header';
import Icon from '../../components/AppIcon';

// --- SUB-COMPONENTS ---

// 1. The Add Food Modal (Now with SEARCH!)
const AddFoodModal = ({ isOpen, onClose, onAdd, currentIds, allFoods }) => {
  const [searchTerm, setSearchTerm] = useState("");

  if (!isOpen) return null;

  // Filter 1: Remove items already in comparison
  // Filter 2: Match the search term (Name or Category)
  const availableFoods = allFoods
    .filter(f => !currentIds.includes(f.id))
    .filter(f =>
      f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-[#111] border border-white/10 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]"
      >
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#1a1a1a]">
          <h3 className="text-xl font-bold text-white">Add to Comparison</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><Icon name="X" /></button>
        </div>

        {/* --- SEARCH BAR --- */}
        <div className="p-4 border-b border-white/5 bg-[#111]">
          <div className="relative">
            <Icon name="Search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search foods (e.g., Biryani, Burger)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-emerald-500 transition-colors"
              autoFocus
            />
          </div>
        </div>

        <div className="p-4 overflow-y-auto space-y-3 custom-scrollbar">
          {availableFoods.length === 0 ? (
            <div className="text-center py-8">
               <p className="text-gray-500">No matching foods found.</p>
               {searchTerm && <p className="text-xs text-gray-600 mt-2">Try a different keyword.</p>}
            </div>
          ) : (
            availableFoods.map(food => (
              <div key={food.id} onClick={() => onAdd(food)} className="flex items-center gap-4 p-3 hover:bg-white/5 rounded-xl cursor-pointer transition-colors group border border-transparent hover:border-white/10">
                {/* Food Image */}
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-800 shrink-0">
                    <img
                        src={food.image}
                        alt={food.name}
                        className="w-full h-full object-cover"
                        onError={(e) => e.target.src = "https://placehold.co/100?text=Food"}
                    />
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-medium truncate group-hover:text-emerald-400 transition-colors">{food.name}</h4>
                  <p className="text-xs text-gray-400 truncate">{food.category}</p>
                </div>

                <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity bg-emerald-500/10">
                    <Icon name="Plus" size={16} />
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
};

// 2. Comparison Card (Top Row Visuals)
const ComparisonCard = ({ food, onRemove }) => (
  <motion.div
    layout
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className="min-w-[200px] w-full bg-white/5 border border-white/10 rounded-3xl overflow-hidden relative group"
  >
    <div className="h-40 relative">
      <img
        src={food.image}
        alt={food.name}
        className="w-full h-full object-cover"
        onError={(e) => e.target.src = "https://placehold.co/400?text=No+Image"}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />

      <button
        onClick={() => onRemove(food.id)}
        className="absolute top-3 right-3 p-1.5 bg-black/40 hover:bg-red-500/80 backdrop-blur-md rounded-full text-white transition-colors border border-white/10"
      >
        <Icon name="X" size={14} />
      </button>

      <div className="absolute bottom-3 left-3 right-3">
        <h3 className="font-bold text-lg text-white leading-tight mb-0.5">{food.name}</h3>
        <p className="text-xs text-gray-400 uppercase tracking-wider">{food.category}</p>
      </div>
    </div>
  </motion.div>
);

// 3. Stat Row (The Data Matrix)
const StatRow = ({ label, property, foods, unit = "", lowerIsBetter = false }) => {
  const values = foods.map(f => {
    // Navigate deeply nested properties (e.g., sustainability.sustainability_score)
    const parts = property.split('.');
    let val = f;
    for (const part of parts) {
        val = val ? val[part] : 0;
    }
    return val || 0;
  });

  // Determine winner
  const bestValue = lowerIsBetter ? Math.min(...values) : Math.max(...values);

  return (
    <div className="grid grid-cols-[120px_1fr] md:grid-cols-[150px_1fr] gap-4 py-4 border-b border-white/5 last:border-0 items-center hover:bg-white/5 transition-colors">
      <div className="text-gray-400 font-medium text-sm pl-4 flex items-center gap-2">
          {label}
      </div>
      <div className="grid" style={{ gridTemplateColumns: `repeat(${foods.length}, minmax(0, 1fr))` }}>
        {foods.map((f, i) => {
           const isWinner = values[i] === bestValue;
           return (
            <div key={i} className={`text-center px-2 flex flex-col items-center justify-center ${isWinner ? 'scale-110' : ''}`}>
              <span className={`text-sm font-bold ${isWinner ? 'text-emerald-400' : 'text-white'}`}>
                {values[i]}{unit}
              </span>
              {isWinner && <div className="h-1 w-1 rounded-full bg-emerald-500 mt-1" />}
            </div>
           );
        })}
      </div>
    </div>
  );
};

// --- MAIN PAGE ---
const FoodComparisonTool = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // State
  const [allFoods, setAllFoods] = useState([]); // Database Data
  const [comparedFoods, setComparedFoods] = useState([]); // Selected Foods
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Fetch ALL foods from Backend on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/foods');
        const data = await response.json();
        setAllFoods(data);

        // If items were passed via navigation (e.g. from Search), load them
        if (location.state?.foods) {
            setComparedFoods(location.state.foods);
        }
      } catch (error) {
        console.error("Error fetching foods:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [location.state]);

  const handleRemove = (id) => {
    setComparedFoods(prev => prev.filter(f => f.id !== id));
  };

  const handleAdd = (food) => {
    setComparedFoods(prev => [...prev, food]);
    setIsModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-emerald-500/30">

      {/* Background Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[30%] w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px] animate-blob" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px]" />
      </div>

      <Header onNavigate={(path) => navigate(path)} />

      <main className="relative z-10 pt-28 px-6 pb-20 max-w-7xl mx-auto">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
          <div>
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-4xl font-bold mb-2"
            >
              Comparison <span className="text-emerald-400">Lab</span>
            </motion.h1>
            <p className="text-gray-400">Compare nutrition, sustainability, and safety.</p>
          </div>

          <div className="flex gap-3">
             <button
                onClick={() => setIsModalOpen(true)}
                disabled={comparedFoods.length >= 4}
                className="px-6 py-3 bg-emerald-500 text-black font-bold rounded-full hover:bg-emerald-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                <Icon name="Plus" size={18} /> Add Food
             </button>
             {comparedFoods.length > 0 && (
               <button
                  onClick={() => setComparedFoods([])}
                  className="px-6 py-3 border border-white/20 rounded-full hover:bg-white/10 transition-colors text-sm font-medium"
               >
                 Clear
               </button>
             )}
          </div>
        </div>

        {/* --- COMPARISON VIEW --- */}
        {comparedFoods.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 bg-white/5 rounded-3xl border border-white/10 border-dashed backdrop-blur-sm">
            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6 text-emerald-400">
                <Icon name="GitCompare" size={40} />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Start Your Comparison</h3>
            <p className="text-gray-400 mb-8 max-w-md text-center">Select foods from our database to analyze their nutritional and environmental impact side-by-side.</p>
            <button
                onClick={() => setIsModalOpen(true)}
                className="px-8 py-3 bg-white text-black font-bold rounded-full hover:scale-105 transition-transform"
            >
                Add Your First Food
            </button>
          </div>
        ) : (
          <div className="bg-[#0a0a0a]/80 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl shadow-2xl">

            {/* 1. Visual Cards Row */}
            <div className="grid p-6 gap-6 border-b border-white/10 bg-black/40" style={{ gridTemplateColumns: `150px repeat(${comparedFoods.length}, minmax(0, 1fr))` }}>
              <div className="flex items-center text-gray-400 font-bold text-xs uppercase tracking-widest">Selected Items</div>
              {comparedFoods.map(food => (
                <ComparisonCard key={food.id} food={food} onRemove={handleRemove} />
              ))}
            </div>

            {/* 2. Stats Grid */}
            <div className="bg-transparent">
               <div className="py-4 px-6 bg-white/5 text-xs font-bold text-emerald-400 uppercase tracking-widest border-y border-white/5 flex items-center gap-2">
                   <Icon name="Activity" size={14} /> Nutrition
               </div>
               <StatRow label="Calories" property="nutrition.calories" foods={comparedFoods} unit=" kcal" lowerIsBetter={true} />
               <StatRow label="Protein" property="nutrition.protein" foods={comparedFoods} unit="g" />
               <StatRow label="Fats" property="nutrition.fat" foods={comparedFoods} unit="g" lowerIsBetter={true} />
               <StatRow label="Carbs" property="nutrition.carbohydrates" foods={comparedFoods} unit="g" lowerIsBetter={true} />

               <div className="py-4 px-6 bg-white/5 text-xs font-bold text-blue-400 uppercase tracking-widest border-y border-white/5 mt-4 flex items-center gap-2">
                   <Icon name="Leaf" size={14} /> Sustainability
               </div>
               <StatRow label="Eco Score" property="sustainability_score" foods={comparedFoods} unit="/100" />
               <StatRow label="CO2" property="sustainability.carbon_footprint" foods={comparedFoods} unit=" kg" lowerIsBetter={true} />
               <StatRow label="Water" property="sustainability.water_usage" foods={comparedFoods} unit=" L" lowerIsBetter={true} />
            </div>

            {/* 3. Recommendation Panel */}
            <div className="p-8 text-center bg-gradient-to-b from-emerald-900/10 to-transparent border-t border-white/10">
              <h4 className="text-emerald-400 font-bold mb-2 flex items-center justify-center gap-2">
                  <Icon name="Cpu" size={18} /> AI Analysis
              </h4>
              <p className="text-gray-300 text-sm max-w-2xl mx-auto leading-relaxed">
                 <span className="text-white font-bold">{comparedFoods[0].name}</span> is being compared against <span className="text-white font-bold">{comparedFoods.length - 1} other items</span>.
                 Check the green highlights above to see which item wins in each category!
              </p>
            </div>

          </div>
        )}
      </main>

      {/* The Modal */}
      <AddFoodModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAdd}
        currentIds={comparedFoods.map(f => f.id)}
        allFoods={allFoods}
      />
    </div>
  );
};

export default FoodComparisonTool;