import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../../components/ui/Header';
import Icon from '../../components/AppIcon';

const FoodComparisonTool = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [allFoods, setAllFoods] = useState([]);
    const [comparedFoods, setComparedFoods] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // 1. Fetch Data
    useEffect(() => {
        fetch('http://127.0.0.1:8000/foods/')
            .then(res => res.json())
            .then(data => setAllFoods(data))
            .catch(err => console.error('Failed to load foods', err));
    }, []);

    // 2. Handle URL Params & State
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const item1 = params.get('item1');
        const item2 = params.get('item2');
        const passedState = location.state?.foods;

        if (passedState && passedState.length > 0) {
            setComparedFoods(passedState);
        } else if ((item1 || item2) && allFoods.length > 0) {
            const foods = [];
            if (item1) {
                const food = allFoods.find(f => f.name.toLowerCase() === item1.toLowerCase());
                if (food) foods.push(food);
            }
            if (item2) {
                const food = allFoods.find(f => f.name.toLowerCase() === item2.toLowerCase());
                if (food) foods.push(food);
            }
            const uniqueFoods = [...new Map(foods.map(item => [item.id, item])).values()];
            if (uniqueFoods.length > 0) setComparedFoods(uniqueFoods);
        }
    }, [location.search, location.state, allFoods]);

    const handleAddFood = (food) => {
        if (comparedFoods.length < 4 && !comparedFoods.find(f => f.id === food.id)) {
            setComparedFoods([...comparedFoods, food]);
        }
        setIsModalOpen(false);
        setSearchTerm("");
    };

    const handleRemoveFood = (foodId) => {
        setComparedFoods(comparedFoods.filter(f => f.id !== foodId));
    };

    // Helper to find the "best" value for highlighting
    const getBestStyle = (metric, val, foods) => {
        if (!foods.length || val === undefined) return "text-white";
        const cleanVal = parseFloat(val);
        if (isNaN(cleanVal)) return "text-white";

        const values = foods.map(f => parseFloat(f.nutrition?.[metric] || 0));

        const isLowGood = ['calories', 'fat', 'sodium', 'sugar'].includes(metric);
        const bestVal = isLowGood ? Math.min(...values) : Math.max(...values);

        return cleanVal === bestVal ? "text-emerald-400 font-bold" : "text-white";
    };

    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-emerald-500/30">
            <Header onNavigate={(path) => navigate(path)} />

            <main className="relative z-10 pt-28 px-6 pb-20 max-w-7xl mx-auto">

                {/* --- HEADER SECTION --- */}
                <div className="flex flex-col md:flex-row items-end justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-4xl font-bold mb-2">
                            Comparison <span className="text-emerald-400">Lab</span>
                        </h1>
                        <p className="text-gray-400">Compare nutrition, sustainability, and safety.</p>
                    </div>

                    <div className="flex items-center gap-3">
                        {comparedFoods.length > 0 && (
                            <button
                                onClick={() => setComparedFoods([])}
                                className="px-6 py-2.5 rounded-full border border-white/20 text-sm font-medium hover:bg-white/5 transition-all"
                            >
                                Clear
                            </button>
                        )}
                        <button
                            onClick={() => setIsModalOpen(true)}
                            disabled={comparedFoods.length >= 4}
                            className={`px-6 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 transition-all ${comparedFoods.length >= 4
                                ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                                }`}
                        >
                            <Icon name="Plus" size={18} /> Add Food
                        </button>
                    </div>
                </div>

                {/* --- COMPARISON MATRIX CONTAINER --- */}
                <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 overflow-x-auto">

                    {/* 1. SELECTED ITEMS ROW */}
                    <div className="grid grid-cols-[150px_repeat(4,1fr)] gap-8 mb-12 min-w-[800px]">
                        <div className="flex items-center text-xs font-bold text-gray-500 uppercase tracking-widest">
                            Selected Items
                        </div>

                        {[0, 1, 2, 3].map(i => {
                            const food = comparedFoods[i];
                            return (
                                <div key={i} className="relative h-40 rounded-2xl bg-[#111] border border-white/5 flex items-center justify-center group overflow-hidden">
                                    {food ? (
                                        <>
                                            <img src={food.image} alt={food.name} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent" />

                                            <button
                                                onClick={() => handleRemoveFood(food.id)}
                                                className="absolute top-2 right-2 p-1.5 bg-black/50 backdrop-blur-md rounded-full text-white/70 hover:text-red-400 hover:bg-black transition-all z-20"
                                            >
                                                <Icon name="X" size={14} />
                                            </button>

                                            <div className="absolute bottom-4 left-4 z-10">
                                                <h3 className="font-bold text-lg leading-tight mb-1">{food.name}</h3>
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-white/10 px-2 py-1 rounded">
                                                    {food.category}
                                                </span>
                                            </div>
                                        </>
                                    ) : (
                                        <button
                                            onClick={() => setIsModalOpen(true)}
                                            className="flex flex-col items-center gap-2 text-gray-600 hover:text-emerald-500 transition-colors"
                                        >
                                            <div className="w-10 h-10 rounded-full border-2 border-dashed border-current flex items-center justify-center">
                                                <Icon name="Plus" size={20} />
                                            </div>
                                            <span className="text-xs font-medium">Add Item</span>
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* 2. NUTRITION SECTION */}
                    <div className="mb-10 min-w-[800px]">
                        <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm tracking-widest mb-6 uppercase">
                            <Icon name="Activity" size={16} /> Nutrition
                        </div>

                        {[
                            { label: 'Calories', key: 'calories', unit: ' kcal' },
                            { label: 'Protein', key: 'protein', unit: 'g' },
                            { label: 'Fats', key: 'fat', unit: 'g' },
                            { label: 'Carbs', key: 'carbohydrates', unit: 'g' },
                            { label: 'Sugar', key: 'sugar', unit: 'g' },
                            { label: 'Sodium', key: 'sodium', unit: 'mg' },
                        ].map(metric => (
                            <div key={metric.key} className="grid grid-cols-[150px_repeat(4,1fr)] gap-8 py-5 border-b border-white/5 hover:bg-white/5 transition-colors">
                                <div className="text-gray-400 font-medium text-sm self-center">{metric.label}</div>
                                {[0, 1, 2, 3].map(i => {
                                    const food = comparedFoods[i];
                                    if (!food) return <div key={i}></div>;

                                    const val = food.nutrition?.[metric.key] || 0;
                                    const style = getBestStyle(metric.key, val, comparedFoods);

                                    return (
                                        <div key={i} className={`text-center text-lg font-mono ${style}`}>
                                            {val}{metric.unit}
                                            {style.includes('emerald') && <span className="block w-1.5 h-1.5 bg-emerald-500 rounded-full mx-auto mt-1" />}
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>

                    {/* 3. SUSTAINABILITY SECTION */}
                    <div className="min-w-[800px]">
                        <div className="flex items-center gap-2 text-blue-400 font-bold text-sm tracking-widest mb-6 uppercase">
                            <Icon name="Leaf" size={16} /> Sustainability
                        </div>

                        <div className="grid grid-cols-[150px_repeat(4,1fr)] gap-8 py-5 border-b border-white/5 hover:bg-white/5 transition-colors">
                            <div className="text-gray-400 font-medium text-sm self-center">Eco Score</div>
                            {[0, 1, 2, 3].map(i => {
                                const food = comparedFoods[i];
                                if (!food) return <div key={i}></div>;
                                return (
                                    <div key={i} className="text-center font-bold text-lg text-emerald-400">
                                        {food.sustainability_score}/100
                                        <span className="block w-1.5 h-1.5 bg-emerald-500 rounded-full mx-auto mt-1" />
                                    </div>
                                );
                            })}
                        </div>

                        <div className="grid grid-cols-[150px_repeat(4,1fr)] gap-8 py-5 border-b border-white/5 hover:bg-white/5 transition-colors">
                            <div className="text-gray-400 font-medium text-sm self-center">CO2</div>
                            {[0, 1, 2, 3].map(i => {
                                const food = comparedFoods[i];
                                if (!food) return <div key={i}></div>;
                                return (
                                    <div key={i} className="text-center font-mono text-lg text-white">
                                        {food.sustainability?.carbon_footprint} kg
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                </div>

                {/* --- ADD FOOD MODAL --- */}
                <AnimatePresence>
                    {isModalOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-[#1a1a1a] w-full max-w-lg rounded-3xl border border-white/10 overflow-hidden shadow-2xl"
                            >
                                <div className="p-6 border-b border-white/10 flex justify-between items-center">
                                    <h3 className="text-xl font-bold text-white">Add Food to Compare</h3>
                                    <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white"><Icon name="X" size={20} /></button>
                                </div>
                                <div className="p-4 bg-black/20">
                                    <div className="flex items-center bg-[#111] border border-white/10 rounded-xl px-4 py-3 focus-within:border-emerald-500/50 transition-colors">
                                        <Icon name="Search" size={18} className="text-gray-500 mr-3" />
                                        <input
                                            type="text"
                                            placeholder="Search foods..."
                                            autoFocus
                                            className="bg-transparent border-none outline-none text-white w-full placeholder-gray-600"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="h-80 overflow-y-auto p-2 custom-scrollbar">
                                    {allFoods
                                        .filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()))
                                        .filter(f => !comparedFoods.find(c => c.id === f.id))
                                        .map(food => (
                                            <button
                                                key={food.id}
                                                onClick={() => handleAddFood(food)}
                                                className="w-full flex items-center gap-4 p-3 hover:bg-white/5 rounded-xl transition-colors text-left group"
                                            >
                                                <img src={food.image} className="w-12 h-12 rounded-lg object-cover bg-white/5" alt="" />
                                                <div>
                                                    <h4 className="font-bold text-white group-hover:text-emerald-400 transition-colors">{food.name}</h4>
                                                    <p className="text-xs text-gray-500">{food.category} • {food.nutrition_score} Score</p>
                                                </div>
                                                <div className="ml-auto text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Icon name="Plus" size={20} />
                                                </div>
                                            </button>
                                        ))
                                    }
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

            </main>
        </div>
    );
};

export default FoodComparisonTool;