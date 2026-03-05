import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// --- REALISTIC UI SLIDES ---

const SearchSlide = () => (
    <div className="h-full bg-[#0a0a0a] flex flex-col text-white overflow-hidden">
        {/* Top Nav */}
        <div className="flex items-center justify-between px-3 sm:px-5 py-2 border-b border-white/5">
            <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-md bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                    <span className="text-[6px] sm:text-[8px] font-bold text-black">N</span>
                </div>
                <span className="text-[8px] sm:text-[10px] font-bold text-white/90 hidden sm:inline">NutriAI</span>
            </div>
            <div className="flex gap-1 sm:gap-2">
                {["Discover", "Compare", "Dashboard"].map((t, i) => (
                    <span key={t} className={`text-[6px] sm:text-[8px] px-1.5 sm:px-2 py-0.5 rounded-full ${i === 0 ? 'bg-emerald-500/20 text-emerald-400' : 'text-white/30'}`}>{t}</span>
                ))}
            </div>
            <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-white/10 flex items-center justify-center">
                <span className="text-[6px] sm:text-[8px]">👤</span>
            </div>
        </div>

        {/* Search Bar */}
        <div className="px-3 sm:px-5 pt-3 sm:pt-4">
            <motion.div
                initial={{ opacity: 0.5 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2"
            >
                <span className="text-[8px] sm:text-[10px] text-white/30">🔍</span>
                <motion.div className="flex-1 relative h-3">
                    <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 1, 1, 1] }}
                        transition={{ duration: 2, times: [0, 0.2, 0.8, 1] }}
                        className="text-[8px] sm:text-[10px] text-white/50 absolute left-0 top-0"
                    >chicken biryani</motion.span>
                </motion.div>
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 1.5 }}
                    className="px-1.5 py-0.5 bg-emerald-500 rounded text-[6px] sm:text-[7px] font-bold text-black"
                >Search</motion.div>
            </motion.div>
            <div className="flex gap-1 mt-2">
                {["All", "Kerala", "Arabic", "Chinese"].map((f, i) => (
                    <span key={f} className={`text-[6px] sm:text-[7px] px-1.5 py-0.5 rounded-full border ${i === 0 ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : 'border-white/10 text-white/30'}`}>{f}</span>
                ))}
            </div>
        </div>

        {/* Results Grid */}
        <div className="flex-1 px-3 sm:px-5 py-2 sm:py-3 grid grid-cols-3 gap-1.5 sm:gap-2 auto-rows-min">
            {[
                { emoji: "🍗", name: "Malabar Biryani", cal: "720 cal", score: 72, color: "from-amber-500/10 to-orange-500/10 border-amber-500/15" },
                { emoji: "🥘", name: "Veg Pulao", cal: "400 cal", score: 85, color: "from-emerald-500/10 to-teal-500/10 border-emerald-500/15" },
                { emoji: "🍛", name: "Fried Rice", cal: "550 cal", score: 50, color: "from-red-500/10 to-orange-500/10 border-red-500/15" },
            ].map((item, i) => (
                <motion.div
                    key={item.name}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.8 + i * 0.25, duration: 0.4 }}
                    className={`bg-gradient-to-br ${item.color} border rounded-lg p-1.5 sm:p-2 flex flex-col items-center`}
                >
                    <span className="text-base sm:text-lg">{item.emoji}</span>
                    <span className="text-[6px] sm:text-[8px] text-white/80 font-medium text-center mt-0.5 leading-tight">{item.name}</span>
                    <span className="text-[5px] sm:text-[7px] text-white/40 mt-0.5">{item.cal}</span>
                    <div className="w-full h-0.5 sm:h-1 bg-white/5 rounded-full mt-1 overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${item.score}%` }}
                            transition={{ delay: 2.2 + i * 0.2, duration: 0.6 }}
                            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                        />
                    </div>
                </motion.div>
            ))}
        </div>
    </div>
);

const NutritionSlide = () => {
    const metrics = [
        { label: "Calories", value: 720, max: 1000, unit: "kcal", color: "from-orange-500 to-amber-500", bg: "bg-orange-500/10" },
        { label: "Protein", value: 38, max: 50, unit: "g", color: "from-emerald-500 to-green-500", bg: "bg-emerald-500/10" },
        { label: "Fat", value: 28, max: 60, unit: "g", color: "from-red-400 to-pink-500", bg: "bg-red-500/10" },
        { label: "Carbs", value: 75, max: 100, unit: "g", color: "from-blue-400 to-indigo-500", bg: "bg-blue-500/10" },
        { label: "Fiber", value: 4, max: 15, unit: "g", color: "from-teal-400 to-cyan-500", bg: "bg-teal-500/10" },
    ];
    return (
        <div className="h-full bg-[#0a0a0a] flex flex-col text-white overflow-hidden">
            {/* Header */}
            <div className="px-3 sm:px-5 pt-3 sm:pt-4 pb-2 border-b border-white/5">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20 flex items-center justify-center">
                        <span className="text-sm sm:text-lg">🍗</span>
                    </div>
                    <div className="flex-1">
                        <p className="text-[9px] sm:text-[11px] font-bold text-white leading-tight">Malabar Chicken Biryani</p>
                        <p className="text-[7px] sm:text-[9px] text-white/40">Kerala Native · 1 Portion</p>
                    </div>
                    <div className="text-right">
                        <div className="flex items-center gap-1">
                            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center">
                                <span className="text-[8px] sm:text-[10px] font-bold text-emerald-400">72</span>
                            </div>
                        </div>
                        <p className="text-[5px] sm:text-[7px] text-emerald-400/60 mt-0.5">Health Score</p>
                    </div>
                </div>
            </div>

            {/* Metrics */}
            <div className="flex-1 px-3 sm:px-5 py-2 sm:py-3 space-y-1.5 sm:space-y-2">
                {metrics.map((m, i) => (
                    <div key={m.label} className="flex items-center gap-2">
                        <div className={`w-11 sm:w-14 text-[7px] sm:text-[9px] text-white/50 shrink-0`}>{m.label}</div>
                        <div className="flex-1 h-2 sm:h-2.5 bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(m.value / m.max) * 100}%` }}
                                transition={{ delay: 0.3 + i * 0.15, duration: 0.7, ease: "easeOut" }}
                                className={`h-full rounded-full bg-gradient-to-r ${m.color}`}
                            />
                        </div>
                        <span className="text-[7px] sm:text-[9px] text-white/70 font-semibold w-10 text-right">{m.value}{m.unit}</span>
                    </div>
                ))}
            </div>

            {/* Allergens */}
            <div className="px-3 sm:px-5 pb-2 sm:pb-3">
                <p className="text-[6px] sm:text-[8px] text-white/30 uppercase tracking-wider mb-1">Allergens Detected</p>
                <div className="flex gap-1">
                    {[
                        { icon: "🌾", name: "Gluten", c: "border-orange-500/20 bg-orange-500/10 text-orange-400" },
                        { icon: "🥜", name: "Nuts", c: "border-amber-500/20 bg-amber-500/10 text-amber-400" },
                        { icon: "🥛", name: "Dairy", c: "border-blue-400/20 bg-blue-500/10 text-blue-400" },
                    ].map((a, i) => (
                        <motion.span key={a.name}
                            initial={{ opacity: 0, scale: 0.7 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 1.3 + i * 0.12 }}
                            className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full border text-[6px] sm:text-[7px] ${a.c}`}
                        >{a.icon} {a.name}</motion.span>
                    ))}
                </div>
            </div>
        </div>
    );
};

const ComparisonSlide = () => (
    <div className="h-full bg-[#0a0a0a] flex flex-col text-white overflow-hidden">
        <div className="px-3 sm:px-5 pt-3 sm:pt-4 pb-2 text-center">
            <p className="text-[9px] sm:text-[11px] font-bold text-white">Side-by-Side Comparison</p>
            <p className="text-[6px] sm:text-[8px] text-white/30 mt-0.5">Compare nutrition at a glance</p>
        </div>

        <div className="flex-1 px-3 sm:px-5 pb-2 sm:pb-3">
            <div className="grid grid-cols-2 gap-2 h-full">
                {[
                    { name: "Porotta & Beef", emoji: "🥞", cal: 950, prot: "38g", fat: "52g", fiber: "4g", score: 42, bad: true },
                    { name: "Chapati & Dal", emoji: "🫓", cal: 400, prot: "18g", fat: "8g", fiber: "14g", score: 88, bad: false },
                ].map((food, idx) => (
                    <motion.div key={food.name}
                        initial={{ opacity: 0, x: idx === 0 ? -15 : 15 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + idx * 0.25, duration: 0.5 }}
                        className={`rounded-xl border flex flex-col ${food.bad
                            ? 'bg-gradient-to-b from-red-500/8 to-red-500/3 border-red-500/15'
                            : 'bg-gradient-to-b from-emerald-500/8 to-emerald-500/3 border-emerald-500/15'}`}
                    >
                        <div className="text-center pt-2 sm:pt-3 pb-1 border-b border-white/5">
                            <span className="text-lg sm:text-xl">{food.emoji}</span>
                            <p className="text-[7px] sm:text-[9px] text-white/80 font-semibold mt-0.5">{food.name}</p>
                            <div className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[5px] sm:text-[6px] font-bold ${food.bad ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                Score: {food.score}
                            </div>
                        </div>
                        <div className="px-1.5 sm:px-2 py-1 sm:py-1.5 space-y-0.5 flex-1">
                            {[
                                { l: "Calories", v: food.cal },
                                { l: "Protein", v: food.prot },
                                { l: "Fat", v: food.fat },
                                { l: "Fiber", v: food.fiber },
                            ].map(m => (
                                <div key={m.l} className="flex justify-between py-0.5 border-b border-white/5 last:border-0">
                                    <span className="text-[5px] sm:text-[7px] text-white/35">{m.l}</span>
                                    <span className={`text-[5px] sm:text-[7px] font-bold ${food.bad ? 'text-red-400/80' : 'text-emerald-400/80'}`}>{m.v}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                ))}
            </div>

            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.6 }}
                className="mt-1.5 sm:mt-2 text-center py-1 sm:py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg"
            >
                <span className="text-[6px] sm:text-[8px] text-emerald-400 font-semibold">✓ Chapati & Dal saves 550 calories per serving!</span>
            </motion.div>
        </div>
    </div>
);

const SwapSlide = () => (
    <div className="h-full bg-[#0a0a0a] flex flex-col items-center justify-center text-white px-3 sm:px-5 overflow-hidden">
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-[9px] sm:text-[11px] font-bold mb-1">Smart Swap Suggestion</motion.p>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="text-[6px] sm:text-[8px] text-white/30 mb-3 sm:mb-4">Powered by NutriAI Engine</motion.p>

        <div className="flex items-center gap-2 sm:gap-4 mb-3 sm:mb-4">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
                className="bg-gradient-to-b from-red-500/10 to-red-500/5 border border-red-500/15 rounded-xl p-2 sm:p-3 text-center w-20 sm:w-24"
            >
                <span className="text-xl sm:text-2xl">🍩</span>
                <p className="text-[7px] sm:text-[9px] text-white/70 font-medium mt-1">Donut</p>
                <p className="text-[6px] sm:text-[8px] text-red-400 font-bold">350 cal</p>
                <p className="text-[5px] sm:text-[6px] text-white/20 mt-0.5">20g sugar</p>
            </motion.div>

            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1, type: "spring", stiffness: 200 }}
                className="flex flex-col items-center gap-1"
            >
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30">
                    <span className="text-sm sm:text-base font-bold text-black">→</span>
                </div>
                <span className="text-[5px] sm:text-[6px] text-emerald-400/60">SWAP</span>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.4 }}
                className="bg-gradient-to-b from-emerald-500/10 to-emerald-500/5 border border-emerald-500/15 rounded-xl p-2 sm:p-3 text-center w-20 sm:w-24"
            >
                <span className="text-xl sm:text-2xl">🍌</span>
                <p className="text-[7px] sm:text-[9px] text-white/70 font-medium mt-1">Unniyappam</p>
                <p className="text-[6px] sm:text-[8px] text-emerald-400 font-bold">85 cal</p>
                <p className="text-[5px] sm:text-[6px] text-white/20 mt-0.5">8g sugar</p>
            </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2 }}
            className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-xl px-3 sm:px-4 py-2 text-center max-w-[240px]"
        >
            <p className="text-[7px] sm:text-[9px] text-emerald-400 font-semibold leading-relaxed">
                🧠 "Saves 265 calories with 60% less sugar. A traditional Kerala sweet that's lighter on your body."
            </p>
        </motion.div>
    </div>
);

const SLIDES = [
    { id: 0, label: "Search", component: SearchSlide },
    { id: 1, label: "Nutrition", component: NutritionSlide },
    { id: 2, label: "Compare", component: ComparisonSlide },
    { id: 3, label: "Smart Swap", component: SwapSlide },
];

const LaptopDemo = () => {
    const [activeSlide, setActiveSlide] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setActiveSlide((prev) => (prev + 1) % SLIDES.length);
        }, 4500);
        return () => clearInterval(timer);
    }, []);

    const ActiveComponent = SLIDES[activeSlide].component;

    return (
        <div className="flex flex-col items-center">
            {/* Laptop Container */}
            <motion.div
                initial={{ opacity: 0, y: 80 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                className="relative"
                style={{ perspective: "1800px" }}
            >
                {/* Ambient Glow - Larger and more dramatic */}
                <div className="absolute -inset-20 bg-gradient-to-b from-emerald-500/8 via-teal-500/5 to-transparent rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[200px] bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none" />

                <motion.div
                    animate={{ rotateX: [1.5, -0.5, 1.5], rotateY: [-0.5, 0.5, -0.5] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                    style={{ transformStyle: "preserve-3d" }}
                >
                    {/* === LAPTOP SCREEN (LID) === */}
                    <div className="relative w-[320px] sm:w-[500px] md:w-[640px]">

                        {/* Outer Shell - Metallic */}
                        <div
                            className="rounded-t-[12px] sm:rounded-t-[16px] p-[3px] sm:p-[4px] relative overflow-hidden"
                            style={{
                                background: 'linear-gradient(180deg, #4a4a4a 0%, #2a2a2a 20%, #1a1a1a 80%, #111 100%)',
                                boxShadow: '0 -2px 20px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
                            }}
                        >
                            {/* Inner Bezel */}
                            <div
                                className="rounded-t-[9px] sm:rounded-t-[13px] p-[4px] sm:p-[6px] relative"
                                style={{
                                    background: 'linear-gradient(180deg, #111 0%, #0a0a0a 100%)',
                                    boxShadow: 'inset 0 0 8px rgba(0,0,0,0.8)',
                                }}
                            >
                                {/* Camera / Notch */}
                                <div className="flex justify-center mb-[3px] sm:mb-[4px]">
                                    <div className="flex items-center gap-1">
                                        <div className="w-[3px] h-[3px] sm:w-[4px] sm:h-[4px] rounded-full bg-gray-700 ring-1 ring-gray-600/50" />
                                        <div className="w-[5px] h-[5px] sm:w-[6px] sm:h-[6px] rounded-full bg-gray-800 ring-1 ring-gray-600/30 flex items-center justify-center">
                                            <div className="w-[2px] h-[2px] sm:w-[3px] sm:h-[3px] rounded-full bg-gray-600/50" />
                                        </div>
                                        <div className="w-[3px] h-[3px] sm:w-[4px] sm:h-[4px] rounded-full bg-gray-700 ring-1 ring-gray-600/50" />
                                    </div>
                                </div>

                                {/* === SCREEN === */}
                                <div
                                    className="rounded-[4px] sm:rounded-[6px] overflow-hidden relative"
                                    style={{
                                        aspectRatio: '16 / 10',
                                        boxShadow: '0 0 0 1px rgba(255,255,255,0.03), 0 0 30px rgba(16,185,129,0.05)',
                                    }}
                                >
                                    {/* Browser Chrome */}
                                    <div className="h-5 sm:h-7 bg-[#141414] border-b border-white/5 flex items-center px-2 sm:px-3 shrink-0">
                                        <div className="flex gap-[3px] sm:gap-1">
                                            <div className="w-[6px] h-[6px] sm:w-2 sm:h-2 rounded-full bg-[#ff5f57]" />
                                            <div className="w-[6px] h-[6px] sm:w-2 sm:h-2 rounded-full bg-[#febc2e]" />
                                            <div className="w-[6px] h-[6px] sm:w-2 sm:h-2 rounded-full bg-[#28c840]" />
                                        </div>
                                        <div className="flex-1 mx-2 sm:mx-4 flex justify-center">
                                            <div className="h-3 sm:h-4 bg-white/5 rounded-md sm:rounded-lg flex items-center px-2 sm:px-3 max-w-[180px] sm:max-w-[250px] w-full">
                                                <span className="text-[5px] sm:text-[8px] text-white/20 mr-1">🔒</span>
                                                <span className="text-[5px] sm:text-[8px] text-white/30 font-mono">nutriai.app</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <div className="w-2 h-2 sm:w-3 sm:h-3 rounded bg-white/5 flex items-center justify-center">
                                                <span className="text-[4px] sm:text-[6px] text-white/20">⟳</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Page Content */}
                                    <div className="relative bg-[#0a0a0a]" style={{ height: "calc(100% - 28px)" }}>
                                        <AnimatePresence mode="wait">
                                            <motion.div
                                                key={activeSlide}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ duration: 0.6 }}
                                                className="absolute inset-0"
                                            >
                                                <ActiveComponent />
                                            </motion.div>
                                        </AnimatePresence>
                                    </div>

                                    {/* Screen Glare / Reflection */}
                                    <div
                                        className="absolute inset-0 pointer-events-none"
                                        style={{
                                            background: 'linear-gradient(135deg, rgba(255,255,255,0.025) 0%, transparent 40%, transparent 60%, rgba(255,255,255,0.01) 100%)',
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* === LAPTOP HINGE === */}
                        <div className="relative">
                            {/* Main hinge bar */}
                            <div
                                className="h-[6px] sm:h-[8px] mx-auto relative z-10"
                                style={{
                                    width: '102%',
                                    marginLeft: '-1%',
                                    background: 'linear-gradient(180deg, #333 0%, #1a1a1a 40%, #111 100%)',
                                    borderRadius: '0 0 2px 2px',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                                }}
                            />
                            {/* Center notch */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 sm:w-12 h-[3px] sm:h-[4px] bg-[#2a2a2a] rounded-b-md z-20"
                                style={{ boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5)' }}
                            />
                        </div>

                        {/* === LAPTOP BASE (KEYBOARD DECK) === */}
                        <div
                            className="h-[8px] sm:h-[12px] mx-auto relative"
                            style={{
                                width: '110%',
                                marginLeft: '-5%',
                                background: 'linear-gradient(180deg, #2a2a2a 0%, #1f1f1f 30%, #181818 70%, #111 100%)',
                                borderRadius: '0 0 8px 8px',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.6), 0 2px 4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
                            }}
                        >
                            {/* Trackpad indent */}
                            <div className="absolute bottom-[1px] sm:bottom-[2px] left-1/2 -translate-x-1/2 w-12 sm:w-20 h-[2px] sm:h-[3px] rounded-full"
                                style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.03), transparent)' }}
                            />
                        </div>

                        {/* Bottom edge / rubber feet hint */}
                        <div
                            className="h-[2px] sm:h-[3px] mx-auto"
                            style={{
                                width: '108%',
                                marginLeft: '-4%',
                                background: 'linear-gradient(180deg, #111 0%, #0a0a0a 100%)',
                                borderRadius: '0 0 10px 10px',
                            }}
                        />

                        {/* Surface Shadow */}
                        <div
                            className="h-[6px] sm:h-[10px] mx-auto opacity-40"
                            style={{
                                width: '95%',
                                marginLeft: '2.5%',
                                background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.4) 0%, transparent 70%)',
                                filter: 'blur(4px)',
                            }}
                        />
                    </div>
                </motion.div>
            </motion.div>

            {/* Slide Indicator Buttons */}
            <div className="flex gap-2 mt-8 sm:mt-10">
                {SLIDES.map((slide) => (
                    <button
                        key={slide.id}
                        onClick={() => setActiveSlide(slide.id)}
                        className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[10px] sm:text-xs font-medium transition-all duration-300 ${activeSlide === slide.id
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-500/10'
                                : 'bg-white/5 text-white/30 border border-white/5 hover:bg-white/10 hover:text-white/50'
                            }`}
                    >
                        {activeSlide === slide.id && <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />}
                        {slide.label}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default LaptopDemo;
