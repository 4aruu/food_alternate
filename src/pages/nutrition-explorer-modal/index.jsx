import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Icon from "../../components/AppIcon";
import Header from "../../components/ui/Header";

// --- VISUAL SUB-COMPONENTS (Built-in) ---

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
  </div>
);

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

const AllergensView = ({ food }) => {
  // Handle both Array format (JSON) and Object format (DB)
  let activeAllergens = [];

  if (Array.isArray(food.allergens)) {
      activeAllergens = food.allergens;
  } else if (food.allergens && typeof food.allergens === 'object') {
      // Convert DB boolean object to list of strings
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

// --- MAIN MODAL COMPONENT ---

const NutritionExplorerModal = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // 1. Get Food Data (Try from Navigation State first)
  const passedFood = location.state?.food;

  const [foodItem, setFoodItem] = useState(passedFood || null);
  const [activeTab, setActiveTab] = useState("nutrition");
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => navigate(-1), 300);
  };

  const tabs = [
    { id: "nutrition", label: "Nutrition", icon: "BarChart2" },
    { id: "sustainability", label: "Eco Impact", icon: "Leaf" },
    { id: "allergens", label: "Safety", icon: "Shield" },
  ];

  if (!foodItem) return null;

  return (
    <div className="min-h-screen bg-transparent font-sans text-white">
      <Header onNavigate={(path) => navigate(path)} />

      <AnimatePresence>
        {!isClosing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

            {/* Dark Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-4xl bg-[#0a0a0a] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[85vh]"
            >

              {/* LEFT SIDE: Visual & Header with REAL IMAGE */}
              <div className="md:w-1/3 relative h-64 md:h-auto bg-gray-900">
                {/* ⭐ THE REAL PHOTO LOADER ⭐ */}
                <img
                    src={foodItem.image}
                    alt={foodItem.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://placehold.co/600x800/1a1a1a/FFF?text=No+Image";
                    }}
                />

                {/* Gradient Overlay for Text Visibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-black/80" />

                {/* Text Over Image */}
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

                {/* Tab Navigation */}
                <div className="flex border-b border-white/10 p-2">
                   {tabs.map(tab => (
                     <button
                       key={tab.id}
                       onClick={() => setActiveTab(tab.id)}
                       className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all ${
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

                {/* Tab Content Area */}
                <div className="flex-1 p-6 md:p-8 overflow-y-auto">
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
                       {activeTab === 'allergens' && <AllergensView food={foodItem} />}
                     </motion.div>
                   </AnimatePresence>
                </div>

                {/* Footer Actions */}
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