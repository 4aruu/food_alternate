import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../../components/AppIcon';
import Header from '../../components/ui/Header';
import { addToHistory } from '../../utils/history';

// --- 🧠 SMART ENGINE: CONTEXT & RELATABILITY LOGIC ---
const getSmartSwaps = (currentFood, allFoods, filterMode) => {
  if (!currentFood || !allFoods || !allFoods.length) return [];

  // 1. Remove the item itself
  let candidates = allFoods.filter(f => f.id !== currentFood.id);

  // 2. 🛡️ RELATABILITY FILTER
  // Define what counts as a "Meal" vs "Non-Meal"
  const MEAL_CATEGORIES = [
      'Breakfast', 'Lunch', 'Dinner', 'Main Course',
      'Arabic', 'Chinese', 'Indian', 'Fast Food', 'Seafood', 'Meat Alternative'
  ];
  // Things that should NEVER be swapped for a Meal
  const SIDE_CATEGORIES = ['Drink', 'Dessert', 'Sweetener', 'Condiment', 'Side Dish', 'Snack'];

  // LOGIC:
  if (MEAL_CATEGORIES.includes(currentFood.category)) {
      // If viewing a Meal (e.g., Puttu), HIDE Drinks, Condiments, etc.
      candidates = candidates.filter(f => !SIDE_CATEGORIES.includes(f.category));
  } else if (currentFood.category === 'Drink') {
      // If viewing a Drink, ONLY show other Drinks
      candidates = candidates.filter(f => f.category === 'Drink');
  } else if (currentFood.category === 'Dessert') {
      // If viewing Dessert, ONLY show Desserts or Sweet Snacks
      candidates = candidates.filter(f => f.category === 'Dessert' || f.category === 'Snack');
  }

  // 3. Apply Health Goals (Strict Math)
  switch (filterMode) {
    case 'Diabetic':
      candidates = candidates.filter(f =>
        (f.nutrition?.sugar || 0) < 5 ||
        (f.nutrition?.fiber || 0) > 3 ||
        (f.nutrition?.carbohydrates || 0) < 30
      );
      break;

    case 'Heart Safe':
      candidates = candidates.filter(f =>
        (f.nutrition?.fat || 0) < 10 &&
        (f.nutrition?.sodium || 0) < 400
      );
      break;

    case 'Weight Loss':
      const currentCals = currentFood.nutrition?.calories || 500;
      candidates = candidates.filter(f =>
        (f.nutrition?.calories || 0) < (currentCals * 0.85) ||
        (f.nutrition?.calories || 0) < 200
      );
      break;

    default: // 'All' - Show generally healthier items
      candidates = candidates.filter(f => f.nutrition_score > (currentFood.nutrition_score || 0));
      break;
  }

  // 4. SORTING
  candidates.sort((a, b) => {
    // Priority 1: Exact Category Match (Breakfast vs Breakfast)
    const aSameCat = a.category === currentFood.category ? 1 : 0;
    const bSameCat = b.category === currentFood.category ? 1 : 0;
    if (aSameCat !== bSameCat) return bSameCat - aSameCat;

    // Priority 2: Nutrition Score
    return b.nutrition_score - a.nutrition_score;
  });

  // 5. Return Top 10 matches (The Fix)
  return candidates.slice(0, 10);
};

// --- VISUAL COMPONENT: METRIC BAR ---
const MetricBar = ({ label, value, max, color, unit }) => (
  <div className="mb-3">
    <div className="flex justify-between text-xs mb-1 text-gray-400">
      <span>{label}</span>
      <span>{value}{unit}</span>
    </div>
    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min((value / max) * 100, 100)}%` }}
        className={`h-full bg-gradient-to-r ${color}`}
      />
    </div>
  </div>
);

const NutritionExplorerModal = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const passedFood = location.state?.food;

  const [foodItem, setFoodItem] = useState(passedFood || null);
  const [activeTab, setActiveTab] = useState("swaps");
  const [activeNeed, setActiveNeed] = useState('All');

  const [allFoods, setAllFoods] = useState([]);
  const [swaps, setSwaps] = useState([]);

  // 1. Fetch Database
  useEffect(() => {
    fetch('http://127.0.0.1:8000/foods/')
      .then(res => res.json())
      .then(data => setAllFoods(data))
      .catch(err => console.error("Failed to load foods", err));
  }, []);

  // 2. Recalculate Swaps
  useEffect(() => {
    if (foodItem && allFoods.length > 0) {
        const results = getSmartSwaps(foodItem, allFoods, activeNeed);
        setSwaps(results);
    }
  }, [foodItem, allFoods, activeNeed]);

  // 3. Update view if new food selected
  useEffect(() => {
    if(location.state?.food) setFoodItem(location.state.food);
  }, [location.state]);

  if (!foodItem) return null;

  return (
    <div className="min-h-screen bg-black/95 backdrop-blur-xl font-sans text-white fixed inset-0 z-50 flex flex-col">

      {/* HEADER */}
      <div className="max-w-5xl w-full mx-auto pt-6 px-6 flex justify-between items-center shrink-0">
          <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white flex items-center gap-2 transition-colors">
              <Icon name="ArrowLeft" size={20} /> Back
          </button>
          <div className="flex bg-[#111] rounded-full p-1 border border-white/10">
             {['swaps', 'nutrition', 'safety'].map(tab => (
                 <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`text-xs font-bold px-5 py-2 rounded-full capitalize transition-all ${
                        activeTab === tab ? 'bg-white text-black' : 'text-gray-500 hover:text-white'
                    }`}
                 >
                    {tab}
                 </button>
             ))}
          </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-5xl mx-auto mt-8 px-6 grid grid-cols-1 md:grid-cols-12 gap-8 pb-20">

            {/* LEFT COLUMN: Hero */}
            <div className="md:col-span-5 space-y-6">
                <motion.div
                    layoutId={`image-${foodItem.id}`}
                    className="aspect-square rounded-3xl overflow-hidden border border-white/10 relative group"
                >
                    <img src={foodItem.image} alt={foodItem.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent flex flex-col justify-end p-6">
                        <h1 className="text-3xl font-bold leading-tight mb-1">{foodItem.name}</h1>
                        <p className="text-gray-400">{foodItem.category} • {foodItem.nutrition?.calories} cal</p>
                    </div>
                </motion.div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-[#111] rounded-2xl border border-white/10 text-center">
                        <div className="text-2xl font-bold text-emerald-400">{foodItem.nutrition_score}</div>
                        <div className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Health Score</div>
                    </div>
                    <div className="p-4 bg-[#111] rounded-2xl border border-white/10 text-center">
                        <div className="text-2xl font-bold text-blue-400">{foodItem.sustainability_score}</div>
                        <div className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Eco Impact</div>
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN: Scrollable Content */}
            <div className="md:col-span-7">

                {/* --- TAB: SWAPS --- */}
                {activeTab === 'swaps' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

                        <div className="bg-[#111] p-1.5 rounded-xl border border-white/10 inline-flex w-full overflow-x-auto scrollbar-hide">
                            {['All', 'Diabetic', 'Heart Safe', 'Weight Loss'].map(mode => (
                                <button
                                    key={mode}
                                    onClick={() => setActiveNeed(mode)}
                                    className={`flex-1 min-w-[100px] py-2.5 rounded-lg text-xs font-bold transition-all ${
                                        activeNeed === mode
                                        ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }`}
                                >
                                    {mode}
                                </button>
                            ))}
                        </div>

                        <div className="space-y-3">
                            {swaps.length > 0 ? (
                                swaps.map((swap) => (
                                    <div key={swap.id} className="flex items-center gap-4 p-3 bg-[#111] border border-white/5 rounded-2xl hover:border-emerald-500/40 hover:bg-white/5 transition-all group cursor-pointer"
                                         onClick={() => { addToHistory(swap); setFoodItem(swap); }}
                                    >
                                        <img src={swap.image} className="w-16 h-16 rounded-xl object-cover bg-gray-800" alt="" />

                                        <div className="flex-1">
                                            <div className="flex justify-between items-center mb-1">
                                                <h4 className="font-bold text-white group-hover:text-emerald-400 transition-colors">{swap.name}</h4>
                                                <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-md">
                                                    {swap.nutrition_score}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {swap.category === foodItem.category && (
                                                    <span className="text-[10px] font-bold text-gray-400 bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                                                        Same Category
                                                    </span>
                                                )}
                                                {activeNeed !== 'All' && (
                                                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/10">
                                                        {activeNeed} Friendly
                                                    </span>
                                                )}
                                                <span className="text-xs text-gray-500 ml-auto">{swap.nutrition?.calories} cal</span>
                                            </div>
                                        </div>

                                        <button className="w-8 h-8 flex items-center justify-center rounded-full border border-white/10 text-gray-400 group-hover:bg-emerald-500 group-hover:text-black group-hover:border-emerald-500 transition-all">
                                            <Icon name="ArrowRight" size={16} />
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div className="py-16 text-center text-gray-500 border border-dashed border-white/10 rounded-2xl">
                                    <Icon name="Search" size={32} className="mx-auto mb-3 opacity-30" />
                                    <p className="text-sm">No <strong>{activeNeed}</strong> matches found in this category.</p>
                                    <button onClick={() => setActiveNeed('All')} className="text-emerald-500 text-xs font-bold mt-3 hover:underline">
                                        View all options
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* --- TAB: NUTRITION --- */}
                {activeTab === 'nutrition' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-[#111] p-6 rounded-3xl border border-white/10">
                        <h3 className="text-lg font-bold mb-6">Nutritional Profile</h3>
                        {foodItem.nutrition && (
                            <>
                                <MetricBar label="Protein" value={foodItem.nutrition.protein} max={30} unit="g" color="from-emerald-500 to-teal-400" />
                                <MetricBar label="Carbohydrates" value={foodItem.nutrition.carbohydrates} max={60} unit="g" color="from-blue-500 to-indigo-400" />
                                <MetricBar label="Fats" value={foodItem.nutrition.fat} max={20} unit="g" color="from-amber-500 to-orange-400" />
                                <MetricBar label="Sugar" value={foodItem.nutrition.sugar} max={20} unit="g" color="from-pink-500 to-rose-400" />
                                <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-2 gap-4">
                                    <div>
                                        <span className="text-gray-500 text-xs uppercase font-bold tracking-wider">Calories</span>
                                        <p className="text-3xl font-bold text-white mt-1">{foodItem.nutrition.calories}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500 text-xs uppercase font-bold tracking-wider">Sodium</span>
                                        <p className="text-3xl font-bold text-white mt-1">{foodItem.nutrition.sodium}<span className="text-lg text-gray-500">mg</span></p>
                                    </div>
                                </div>
                            </>
                        )}
                    </motion.div>
                )}

                {/* --- TAB: SAFETY --- */}
                {activeTab === 'safety' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                        <div className="bg-[#111] p-6 rounded-3xl border border-white/10">
                            <h3 className="text-lg font-bold mb-4">Allergen Safety</h3>
                            <div className="flex flex-wrap gap-2">
                                {foodItem.allergens && Object.entries(foodItem.allergens).map(([key, value]) => (
                                    value ? (
                                        <span key={key} className="px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-sm font-bold capitalize flex items-center gap-2">
                                            <Icon name="AlertTriangle" size={16} /> Contains {key}
                                        </span>
                                    ) : null
                                ))}
                                {(!foodItem.allergens || Object.values(foodItem.allergens).every(v => !v)) && (
                                    <span className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg text-sm font-bold flex items-center gap-2">
                                        <Icon name="CheckCircle" size={16} /> Safe / No Major Allergens
                                    </span>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}

            </div>
        </div>
      </div>
    </div>
  );
};

export default NutritionExplorerModal;