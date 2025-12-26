import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Icon from "../../components/AppIcon";
import Header from "../../components/ui/Header";
import SmartSwapButton from "../../components/SmartSwapButton";

// --- 1. METRIC BARS (Visuals) ---
const MetricBar = ({ label, value, max, color, unit }) => (
  <div className="mb-4">
    <div className="flex justify-between text-sm mb-1">
      <span className="text-gray-400 font-medium">{label}</span>
      <span className="text-white font-bold">{value}{unit}</span>
    </div>
    <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min((value / max) * 100, 100)}%` }}
        transition={{ duration: 1, ease: "easeOut" }}
        className={`h-full bg-gradient-to-r ${color}`}
      />
    </div>
  </div>
);

// --- 2. NUTRITION VIEW ---
const NutritionView = ({ food }) => (
  <div className="space-y-6">
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <Icon name="Activity" size={20} className="text-emerald-400" /> Macro Breakdown
      </h3>
      {food.nutrition && (
        <>
          <MetricBar label="Protein" value={food.nutrition.protein} max={30} unit="g" color="from-emerald-500 to-teal-400" />
          <MetricBar label="Carbs" value={food.nutrition.carbohydrates || food.nutrition.carbs} max={50} unit="g" color="from-blue-500 to-indigo-400" />
          <MetricBar label="Fats" value={food.nutrition.fat} max={20} unit="g" color="from-amber-400 to-orange-400" />
          <MetricBar label="Calories" value={food.nutrition.calories} max={800} unit=" kcal" color="from-pink-500 to-rose-400" />
        </>
      )}
    </div>

    {/* Data Reference Badge */}
    <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-sm text-blue-200">
      <Icon name="Info" size={18} className="mt-0.5 shrink-0" />
      <div>
        <p className="mb-1 font-medium">Data Methodology</p>
        <p className="opacity-80 leading-relaxed">
          Nutritional estimates aligned with data from the <span className="underline">USDA FoodData Central</span> and <span className="underline">OpenFoodFacts</span>.
        </p>
      </div>
    </div>
  </div>
);

// --- 3. SUSTAINABILITY VIEW ---
const SustainabilityView = ({ food }) => (
  <div className="text-center">
    <div className="relative w-48 h-48 mx-auto mb-6 flex items-center justify-center">
       <svg className="w-full h-full transform -rotate-90">
         <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-white/10" />
         <motion.circle
           initial={{ pathLength: 0 }}
           animate={{ pathLength: (food.sustainability_score || 0) / 100 }}
           transition={{ duration: 1.5, ease: "easeOut" }}
           cx="96" cy="96" r="88"
           stroke="currentColor" strokeWidth="12"
           fill="transparent"
           strokeDasharray="1 1"
           className="text-emerald-500"
         />
       </svg>
       <div className="absolute inset-0 flex flex-col items-center justify-center">
         <span className="text-5xl font-bold text-white">{food.sustainability_score || 0}</span>
         <span className="text-sm text-emerald-400 font-medium">Eco Score</span>
       </div>
    </div>
    <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
            <div className="text-2xl font-bold text-white">{food.sustainability?.carbon_footprint || "?"}kg</div>
            <div className="text-xs text-gray-400 uppercase">CO2 Emission</div>
        </div>
        <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
            <div className="text-2xl font-bold text-white">{food.sustainability?.water_usage || "?"}L</div>
            <div className="text-xs text-gray-400 uppercase">Water Usage</div>
        </div>
    </div>
  </div>
);

// --- 4. ALLERGENS VIEW ---
const AllergensView = ({ food }) => {
  let activeAllergens = [];
  if (Array.isArray(food.allergens)) {
      activeAllergens = food.allergens;
  } else if (food.allergens && typeof food.allergens === 'object') {
      activeAllergens = Object.keys(food.allergens).filter(key => food.allergens[key] === true);
  }

  const commonAllergens = ["dairy", "nuts", "gluten", "soy", "eggs", "fish"];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {commonAllergens.map(allergen => {
        const hasAllergen = activeAllergens.map(a => a.toLowerCase()).includes(allergen.toLowerCase());
        return (
          <div key={allergen} className={`p-4 rounded-xl border flex flex-col items-center gap-2 ${
            hasAllergen
            ? 'bg-red-500/10 border-red-500/30 text-red-200'
            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
          }`}>
             <Icon name={hasAllergen ? "AlertTriangle" : "CheckCircle"} size={24} />
             <span className="font-medium capitalize">{allergen}</span>
             <span className="text-xs opacity-70">{hasAllergen ? "Contains" : "Free From"}</span>
          </div>
        )
      })}
    </div>
  );
};

// --- ⭐ 5. NEW: HEALTH-SMART ALTERNATIVES ENGINE ⭐ ---
const HealthSmartAlternatives = ({ originalFoodId, originalFoodName }) => { // <--- ADDED originalFoodName
  const [alternatives, setAlternatives] = useState([]);
  const [activeGoal, setActiveGoal] = useState("general");
  const [allergies, setAllergies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAlternatives = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (activeGoal !== 'general') params.append('health_goal', activeGoal);
        allergies.forEach(a => params.append('avoid', a));

        const res = await fetch(`http://127.0.0.1:8000/foods/${originalFoodId}/alternatives?${params.toString()}`);
        const data = await res.json();
        setAlternatives(data);
      } catch (err) {
        console.error("Failed to load alternatives");
      } finally {
        setIsLoading(false);
      }
    };
    fetchAlternatives();
  }, [originalFoodId, activeGoal, allergies]);

  const toggleAllergen = (allergen) => {
    setAllergies(prev =>
      prev.includes(allergen) ? prev.filter(a => a !== allergen) : [...prev, allergen]
    );
  };

  return (
    <div className="space-y-6">

      {/* CONTROL PANEL */}
      <div className="bg-[#111] p-5 rounded-2xl border border-white/10">
        <h4 className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-widest">Select Your Needs</h4>

        {/* Goals */}
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { id: 'general', label: 'All', icon: 'Sparkles' },
            { id: 'diabetic', label: 'Diabetic', icon: 'Activity' },
            { id: 'heart', label: 'Heart Safe', icon: 'Heart' },
            { id: 'weight', label: 'Weight Loss', icon: 'Scale' },
          ].map(goal => (
            <button
              key={goal.id}
              onClick={() => setActiveGoal(goal.id)}
              className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
                activeGoal === goal.id
                ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/5'
              }`}
            >
              <Icon name={goal.icon} size={14} /> {goal.label}
            </button>
          ))}
        </div>

        {/* Allergen Toggles */}
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-white/10">
          <span className="text-xs text-gray-500 mr-2">Exclude:</span>
          {['Dairy', 'Gluten', 'Nuts', 'Fish', 'Eggs'].map(allergen => (
            <button
              key={allergen}
              onClick={() => toggleAllergen(allergen)}
              className={`px-3 py-1 rounded-full text-xs border transition-all ${
                allergies.includes(allergen)
                ? 'bg-red-500/20 border-red-500 text-red-400'
                : 'border-white/10 text-gray-500 hover:border-white/30 hover:text-white'
              }`}
            >
              {allergies.includes(allergen) ? 'No ' : ''}{allergen}
            </button>
          ))}
        </div>
      </div>

      {/* RESULTS LIST */}
      {isLoading ? (
        <div className="text-center py-10 opacity-50">Thinking...</div>
      ) : (
        <div className="grid gap-3">
          {alternatives.length === 0 ? (
            <div className="text-center py-10 text-gray-500 bg-white/5 rounded-2xl border border-dashed border-white/10">
              <p>No matches found for these strict filters.</p>
              <button onClick={() => {setActiveGoal('general'); setAllergies([])}} className="text-emerald-400 text-sm mt-2 underline">Reset Filters</button>
            </div>
          ) : (
            alternatives.map((alt) => (
              <div
                key={alt.id}
                onClick={() => navigate('/nutrition-explorer-modal', { state: { food: alt } })}
                className="flex items-start gap-4 p-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:scale-[1.01] cursor-pointer transition-all group"
              >
                <img src={alt.image} alt={alt.name} className="w-16 h-16 rounded-xl object-cover bg-gray-800" />
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                      <h4 className="font-bold text-white group-hover:text-emerald-400 transition-colors">{alt.name}</h4>
                      {/* Dynamic Badge */}
                      {activeGoal === 'diabetic' && <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-500/30">Low Sugar</span>}
                      {activeGoal === 'heart' && <span className="text-[10px] bg-red-500/20 text-red-300 px-2 py-0.5 rounded border border-red-500/30">Low Sodium</span>}
                      {activeGoal === 'weight' && <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">Low Cal</span>}
                  </div>

                  {/* ⭐ AI BUTTON HERE - Wrapped to stop navigation event ⭐ */}
                  <div onClick={(e) => e.stopPropagation()}>
                    <SmartSwapButton originalName={originalFoodName} alternativeName={alt.name} />
                  </div>

                  <div className="flex gap-4 text-xs text-gray-400 mt-2">
                    <span className="flex items-center gap-1 text-emerald-400 font-medium">★ Score: {alt.nutrition_score}</span>
                    <span>{alt.nutrition?.calories || 0} cal</span>
                  </div>
                </div>
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-full group-hover:bg-emerald-500 group-hover:text-black transition-all mt-1">
                  <Icon name="ArrowRight" size={16} />
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};


const NutritionExplorerModal = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const passedFood = location.state?.food;

  const [foodItem, setFoodItem] = useState(passedFood || null);
  const [activeTab, setActiveTab] = useState("nutrition");
  const [isClosing, setIsClosing] = useState(false);

  // If we navigated here by clicking an alternative, update the view
  useEffect(() => {
    if(location.state?.food) {
        setFoodItem(location.state.food);
    }
  }, [location.state]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => navigate(-1), 300);
  };

  // The Tabs now include the new "Alternatives"
  const tabs = [
    { id: "nutrition", label: "Nutrition", icon: "BarChart2" },
    { id: "sustainability", label: "Eco Impact", icon: "Leaf" },
    { id: "alternatives", label: "Swaps", icon: "Sparkles" },
    { id: "allergens", label: "Safety", icon: "Shield" },
  ];

  if (!foodItem) return null;

  return (
    <div className="min-h-screen bg-transparent font-sans text-white">
      <Header onNavigate={(path) => navigate(path)} />

      <AnimatePresence>
        {!isClosing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-4xl bg-[#0a0a0a] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[85vh]"
            >

              {/* LEFT SIDE: Visual & Header */}
              <div className="md:w-1/3 relative h-64 md:h-auto bg-gray-900 group">
                <img
                    src={foodItem.image}
                    alt={foodItem.name}
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                    onError={(e) => { e.target.src = "https://placehold.co/600x800/1a1a1a/FFF?text=No+Image"; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-black/80" />
                <div className="absolute bottom-6 left-6 right-6 z-10">
                   <h2 className="text-3xl font-bold mb-1 leading-tight text-white drop-shadow-md">{foodItem.name}</h2>
                   <p className="text-white/90 font-medium text-lg drop-shadow-md">{foodItem.brand}</p>
                   <div className="inline-block mt-2 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-sm border border-white/20">
                      {foodItem.category}
                   </div>
                </div>
              </div>

              {/* RIGHT SIDE: Data & Tabs */}
              <div className="md:w-2/3 flex flex-col bg-[#0a0a0a]">

                <div className="flex border-b border-white/10 p-2 overflow-x-auto scrollbar-hide">
                   {tabs.map(tab => (
                     <button
                       key={tab.id}
                       onClick={() => setActiveTab(tab.id)}
                       className={`flex-1 flex items-center justify-center gap-2 py-3 px-2 rounded-xl text-sm font-medium transition-all min-w-[80px] ${
                         activeTab === tab.id
                         ? 'bg-white/10 text-white shadow-inner'
                         : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                       }`}
                     >
                       <Icon name={tab.icon} size={16} />
                       {tab.label}
                     </button>
                   ))}
                </div>

                <div className="flex-1 p-6 md:p-8 overflow-y-auto custom-scrollbar">
                   <AnimatePresence mode="wait">
                     <motion.div
                       key={activeTab}
                       initial={{ opacity: 0, x: 10 }}
                       animate={{ opacity: 1, x: 0 }}
                       exit={{ opacity: 0, x: -10 }}
                       transition={{ duration: 0.2 }}
                       className="h-full"
                     >
                       {activeTab === 'nutrition' && <NutritionView food={foodItem} />}
                       {activeTab === 'sustainability' && <SustainabilityView food={foodItem} />}
                       {activeTab === 'alternatives' && <HealthSmartAlternatives originalFoodId={foodItem.id} originalFoodName={foodItem.name} />}
                       {activeTab === 'allergens' && <AllergensView food={foodItem} />}
                     </motion.div>
                   </AnimatePresence>
                </div>

                <div className="p-6 border-t border-white/10 flex justify-between items-center bg-[#111]">
                   <button onClick={handleClose} className="px-6 py-2.5 rounded-full border border-white/20 text-gray-300 hover:bg-white/5 transition-colors text-sm font-medium">
                     Close
                   </button>
                   <button
                      onClick={() => navigate('/food-comparison-tool', { state: { foods: [foodItem] } })}
                      className="px-6 py-2.5 rounded-full bg-emerald-500 text-black font-bold hover:bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all flex items-center gap-2"
                   >
                     <Icon name="GitCompare" size={18} />
                     Compare
                   </button>
                </div>

              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NutritionExplorerModal;