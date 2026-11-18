import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../../components/AppIcon';
import Header from '../../components/ui/Header';
import { addToHistory } from '../../utils/history';
import ConnectionError from '../../components/ConnectionError';

import { getAlternatives, getFoods } from '../../utils/api';
import { useAllergenProfile } from '../../context/AllergenProfileContext';
import { isProfileConfigured } from '../../utils/allergenProfile';
import { allergenDisplay, displayStateLabel, legacyAllergenDisplay } from '../../utils/allergenStatus';
import { formatNutrient, nutrientBarPercent } from '../../utils/nutrition';
import { FOCUS_RING, PRESSED_CHIP } from '../../constants/chipStyles';
import {
  ALLERGEN_CODES,
  ALLERGEN_LABELS,
  LEGACY_FLAG_LABEL,
  LEGACY_UNVERIFIED_NOTICE,
  NONE_CONFIRMED_HELPER,
  NONE_CONFIRMED_LABEL,
  PREPARATION_WARNING,
} from '../../constants/allergens';
import {
  DISCLAIMER,
  HEALTH_GOAL_KEYS,
  HEALTH_GOAL_PRESETS,
  NUTRITION_BASIS_NOTICE,
  NUTRITION_INCOMPLETE_TEXT,
} from '../../constants/nutritionFilters';

// Alternatives come from POST /foods/{id}/alternatives. The server decides
// eligibility and order; this page shows its results exactly as returned.
const RESULT_LIMIT = 10;

// Shown once above the results instead of on every result card.
const LIST_LEVEL_UNCERTAINTY = new Set(['preparation_dependent', 'nutrition_unstandardized']);

const TABS = [
  { id: 'swaps', label: 'Swaps' },
  { id: 'nutrition', label: 'Nutrition' },
  { id: 'allergens', label: 'Allergens' },
];

// --- VISUAL COMPONENT: METRIC BAR ---
// A missing or invalid value shows "Not available" and draws no bar.
const MetricBar = ({ label, value, max, color, unit }) => {
  const percent = nutrientBarPercent(value, max);
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs mb-1 text-gray-400">
        <span>{label}</span>
        <span>{formatNutrient(value, unit)}</span>
      </div>
      <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
        {percent !== null && (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            className={`h-full bg-gradient-to-r ${color}`}
          />
        )}
      </div>
    </div>
  );
};

// Selected and focus styles are shared with the registration form (constants/chipStyles.js).
const ALLERGEN_CHIP = `px-3 py-1.5 rounded-lg text-xs font-bold border transition-all text-gray-300 border-white/15 hover:border-white/40 ${PRESSED_CHIP} aria-pressed:px-[10px] aria-pressed:py-[4px] ${FOCUS_RING}`;

// --- ALLERGEN PROFILE STEP ---
const ProfileStep = ({ profile, dispatch }) => (
  <div className="bg-[#111] p-5 rounded-2xl border border-white/10 space-y-4">
    <div>
      <h3 className="font-bold text-white">Allergens to avoid</h3>
      <p className="text-xs text-gray-400 mt-1">
        Choose the allergens to avoid before alternatives are shown.
      </p>
    </div>
    <div className="flex flex-wrap gap-2">
      {ALLERGEN_CODES.map((code) => {
        const selected = profile.status === 'restrictions' && profile.avoid.includes(code);
        return (
          <button
            key={code}
            type="button"
            aria-pressed={selected}
            onClick={() => dispatch({ type: 'toggle', code })}
            className={ALLERGEN_CHIP}
          >
            {ALLERGEN_LABELS[code]}
          </button>
        );
      })}
    </div>
    <div className="pt-3 border-t border-white/10">
      <button
        type="button"
        aria-pressed={profile.status === 'none_confirmed'}
        onClick={() => dispatch({ type: 'confirm_none' })}
        className={ALLERGEN_CHIP}
      >
        {NONE_CONFIRMED_LABEL}
      </button>
      <p className="text-xs text-gray-500 mt-2">{NONE_CONFIRMED_HELPER}</p>
    </div>
  </div>
);

// --- ONE RESULT, AS RETURNED BY THE SERVER ---
const ResultCard = ({ result, onOpen }) => {
  const { food } = result;
  const stateLabel = displayStateLabel(allergenDisplay(food.allergen_status).state);
  const entries = result.uncertainty.filter((entry) => !LIST_LEVEL_UNCERTAINTY.has(entry.code));
  return (
    <div
      className="p-3 bg-[#111] border border-white/5 rounded-2xl hover:border-white/20 transition-all cursor-pointer"
      onClick={() => onOpen(food)}
    >
      <div className="flex items-center gap-4">
        <img src={food.image} className="w-16 h-16 rounded-xl object-cover bg-gray-800" alt="" />
        <div className="flex-1">
          <h4 className="font-bold text-white">{food.name}</h4>
          <p className="text-xs text-gray-500">
            {food.category} • {formatNutrient(food.nutrition?.calories, ' cal')}
          </p>
        </div>
        <Icon name="ArrowRight" size={16} className="text-gray-400" />
      </div>
      <ul className="mt-3 space-y-1 text-xs text-gray-300">
        {result.reasons.map((reason, i) => (
          <li key={`reason-${i}`}>{reason.text}</li>
        ))}
      </ul>
      <ul className="mt-2 space-y-1 text-xs text-gray-500">
        {stateLabel && <li>{stateLabel}</li>}
        {entries.map((entry) => (
          <li key={entry.code}>
            {entry.text}
            {/* The "unverified" texts say "these allergens"; name them. */}
            {entry.code.endsWith('_unverified') && Array.isArray(entry.allergens) && (
              <span className="block text-gray-600">
                {entry.allergens.map((code) => ALLERGEN_LABELS[code]).join(', ')}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

const NutritionExplorerModal = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const passedFood = location.state?.food;

  const [foodItem, setFoodItem] = useState(passedFood || null);
  const [activeTab, setActiveTab] = useState("swaps");

  const { profile, dispatch } = useAllergenProfile();
  const profileConfigured = isProfileConfigured(profile);
  const [healthGoals, setHealthGoals] = useState([]);

  const [allFoods, setAllFoods] = useState([]);
  const [alternatives, setAlternatives] = useState(null);
  const [altStatus, setAltStatus] = useState('idle'); // idle | loading | ready | error
  const [retryCount, setRetryCount] = useState(0);

  // 1. Full food list, used only to open a result with all its details
  //    (shared, deduplicated fetch — module-level cache)
  useEffect(() => {
    getFoods()
      .then(data => setAllFoods(data))
      .catch(err => console.error("Failed to load foods", err));
  }, []);

  // 2. Ask the server for alternatives. Nothing is requested until the
  //    allergen profile is configured.
  const foodId = foodItem?.id;
  useEffect(() => {
    if (foodId === undefined || !profileConfigured) {
      setAlternatives(null);
      setAltStatus('idle');
      return undefined;
    }
    let cancelled = false;
    setAltStatus('loading');
    getAlternatives(foodId, profile, healthGoals, RESULT_LIMIT)
      .then((data) => {
        if (cancelled) return;
        setAlternatives(data);
        setAltStatus('ready');
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to load alternatives", err?.status);
        setAlternatives(null);
        setAltStatus('error');
      });
    return () => { cancelled = true; };
  }, [foodId, profile, profileConfigured, healthGoals, retryCount]);

  const toggleHealthGoal = (key) => {
    setHealthGoals((current) => HEALTH_GOAL_KEYS.filter((k) =>
      k === key ? !current.includes(k) : current.includes(k)
    ));
  };

  // Open a result: prefer the full record from the foods list.
  const openFood = (food) => {
    const full = allFoods.find((f) => f.id === food.id) || food;
    addToHistory(full);
    setFoodItem(full);
  };

  const legacyAllergens = legacyAllergenDisplay(foodItem?.allergens);

  // 3. Update view if new food selected
  useEffect(() => {
    if(location.state?.food) setFoodItem(location.state.food);
  }, [location.state]);

  if (!foodItem) return null;

  return (
    <div className="min-h-screen bg-black/95 backdrop-blur-xl font-sans text-white fixed inset-0 z-50 flex flex-col">

      {/* HEADER */}
      <div className="max-w-5xl w-full mx-auto pt-4 sm:pt-6 px-4 sm:px-6 flex justify-between items-center shrink-0">
          <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white flex items-center gap-2 transition-colors">
              <Icon name="ArrowLeft" size={20} /> Back
          </button>
          <div className="flex bg-[#111] rounded-full p-1 border border-white/10">
             {TABS.map(tab => (
                 <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`text-[11px] sm:text-xs font-bold px-3 sm:px-5 py-2 rounded-full transition-all ${
                        activeTab === tab.id ? 'bg-white text-black' : 'text-gray-500 hover:text-white'
                    }`}
                 >
                    {tab.label}
                 </button>
             ))}
          </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-5xl mx-auto mt-6 sm:mt-8 px-4 sm:px-6 grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 pb-20">

            {/* LEFT COLUMN: Hero */}
            <div className="md:col-span-5 space-y-6">
                <motion.div
                    layoutId={`image-${foodItem.id}`}
                    className="aspect-square rounded-3xl overflow-hidden border border-white/10 relative group"
                >
                    <img src={foodItem.image} alt={foodItem.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent flex flex-col justify-end p-6">
                        <h1 className="text-3xl font-bold leading-tight mb-1">{foodItem.name}</h1>
                        <p className="text-gray-400">{foodItem.category} • {formatNutrient(foodItem.nutrition?.calories, ' cal')}</p>
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

                        {/* 1. Allergen profile (always editable; required before any request) */}
                        <ProfileStep profile={profile} dispatch={dispatch} />

                        {/* 2. Exploratory filters (sent as health_goals) */}
                        <div className="bg-[#111] p-1.5 rounded-xl border border-white/10 flex flex-wrap gap-1">
                            {HEALTH_GOAL_PRESETS.map(preset => (
                                <button
                                    key={preset.key}
                                    type="button"
                                    aria-pressed={healthGoals.includes(preset.key)}
                                    onClick={() => toggleHealthGoal(preset.key)}
                                    className={`flex-1 min-w-[120px] py-2.5 px-2 rounded-lg text-xs font-bold transition-all text-gray-400 hover:text-white hover:bg-white/5 ${PRESSED_CHIP} aria-pressed:px-[5px] aria-pressed:py-[7px] ${FOCUS_RING}`}
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>

                        {/* 3. Results exactly as returned by the server */}
                        {profileConfigured && (
                            <div className="space-y-3">
                                {altStatus === 'loading' && (
                                    <div className="py-10 text-center text-gray-500 text-sm">Loading alternatives…</div>
                                )}

                                {altStatus === 'error' && (
                                    <ConnectionError
                                        compact
                                        message="Couldn't load alternatives. The server may be waking up."
                                        onRetry={() => setRetryCount((n) => n + 1)}
                                    />
                                )}

                                {altStatus === 'ready' && alternatives && (
                                    <>
                                        <p className="text-sm font-bold text-white">{alternatives.outcome.text}</p>

                                        {alternatives.results.length > 0 && (
                                            <div className="p-3 rounded-xl border border-white/10 bg-white/5 space-y-2 text-xs text-gray-400">
                                                <p>{PREPARATION_WARNING}</p>
                                                <p>{NUTRITION_BASIS_NOTICE}</p>
                                            </div>
                                        )}

                                        {alternatives.results.map((result) => (
                                            <ResultCard key={result.food.id} result={result} onOpen={openFood} />
                                        ))}

                                        <p className="text-[11px] text-gray-500 pt-2">{alternatives.disclaimer}</p>
                                    </>
                                )}
                            </div>
                        )}

                        {!profileConfigured && (
                            <p className="text-[11px] text-gray-500">{DISCLAIMER}</p>
                        )}
                    </motion.div>
                )}

                {/* --- TAB: NUTRITION --- */}
                {activeTab === 'nutrition' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-[#111] p-6 rounded-3xl border border-white/10">
                        <h3 className="text-lg font-bold mb-6">Nutritional Profile</h3>
                        {foodItem.nutrition ? (
                            <>
                                <MetricBar label="Protein" value={foodItem.nutrition.protein} max={30} unit="g" color="from-emerald-500 to-teal-400" />
                                <MetricBar label="Carbohydrates" value={foodItem.nutrition.carbohydrates} max={60} unit="g" color="from-blue-500 to-indigo-400" />
                                <MetricBar label="Fats" value={foodItem.nutrition.fat} max={20} unit="g" color="from-amber-500 to-orange-400" />
                                <MetricBar label="Sugar" value={foodItem.nutrition.sugar} max={20} unit="g" color="from-pink-500 to-rose-400" />
                                <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-2 gap-4">
                                    <div>
                                        <span className="text-gray-500 text-xs uppercase font-bold tracking-wider">Calories</span>
                                        <p className="text-3xl font-bold text-white mt-1">{formatNutrient(foodItem.nutrition.calories)}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500 text-xs uppercase font-bold tracking-wider">Sodium</span>
                                        <p className="text-3xl font-bold text-white mt-1">{formatNutrient(foodItem.nutrition.sodium, ' mg')}</p>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <p className="text-sm text-gray-400">{NUTRITION_INCOMPLETE_TEXT}</p>
                        )}
                    </motion.div>
                )}

                {/* --- TAB: ALLERGENS --- */}
                {/* Legacy booleans: only a `true` is shown, as possible; a
                    false, null or missing flag is unknown and gets no entry. */}
                {activeTab === 'allergens' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                        <div className="bg-[#111] p-6 rounded-3xl border border-white/10 space-y-4">
                            <h3 className="text-lg font-bold">Allergen information</h3>
                            {legacyAllergens.labels.length > 0 && (
                                <ul className="flex flex-wrap gap-2">
                                    {legacyAllergens.labels.map((label) => (
                                        <li key={label} className="px-4 py-2 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-lg text-sm flex items-center gap-2">
                                            <Icon name="AlertTriangle" size={16} />
                                            <span><strong>{label}</strong>: {LEGACY_FLAG_LABEL}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            <p className="text-sm text-gray-300">{LEGACY_UNVERIFIED_NOTICE}</p>
                            <p className="text-sm text-gray-400">{PREPARATION_WARNING}</p>
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