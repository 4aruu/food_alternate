import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import Icon from "../../components/AppIcon";
import Image from "../../components/AppImage";
import Header from "../../components/ui/Header";

import NutritionChart from "./components/NutritionChart";
import AllergenAlert from "./components/AllergenAlert";
import SustainabilityMetrics from "./components/SustainabilityMetrics";
import ComparisonView from "./components/ComparisonView";
import ActionButtons from "./components/ActionButtons";

const NutritionExplorerModal = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const modalRef = useRef(null);

  // ⭐ get ID of clicked food from navigation
  const foodId = location.state?.food?.id;

  const [activeTab, setActiveTab] = useState("nutrition");
  const [isLoading, setIsLoading] = useState(true);
  const [foodItem, setFoodItem] = useState(null);
  const [comparisonItems, setComparisonItems] = useState([]);
  const [isClosing, setIsClosing] = useState(false);

  // ⭐ Fetch food details by ID from backend
  useEffect(() => {
    if (!foodId) return;

    const fetchFood = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`http://127.0.0.1:8000/foods/${foodId}`);
        const data = await res.json();
        setFoodItem(data);
      } catch (err) {
        console.error("Failed to load food:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFood();
  }, [foodId]);

  // Escape key + disable scroll
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") handleClose();
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = "unset";
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => navigate("/food-search-results"), 300);
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) handleClose();
  };

  const handleAddToComparison = (item) => {
    setComparisonItems((prev) => {
      const exists = prev.find((f) => f.id === item.id);
      if (!exists && prev.length < 3) return [...prev, item];
      return prev;
    });
  };

  const handleRemoveFromComparison = (id) => {
    setComparisonItems((prev) => prev.filter((f) => f.id !== id));
  };

  const tabs = [
    { id: "nutrition", label: "Nutrition", icon: "BarChart3" },
    { id: "allergens", label: "Allergens", icon: "Shield" },
    { id: "sustainability", label: "Sustainability", icon: "Leaf" },
    {
      id: "comparison",
      label: "Compare",
      icon: "GitCompare",
      badge: comparisonItems.length,
    },
  ];

  const renderTabContent = () => {
    if (isLoading || !foodItem) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin mb-4">
              <Icon name="Loader2" size={48} className="text-accent" />
            </div>
            <p className="text-muted-foreground">Loading nutrition data...</p>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case "nutrition":
        return <NutritionChart foodItem={foodItem} />;

      case "allergens":
        return <AllergenAlert foodItem={foodItem} />;

      case "sustainability":
        return <SustainabilityMetrics foodItem={foodItem} />;

      case "comparison":
        return (
          <ComparisonView
            selectedItems={comparisonItems}
            onRemoveItem={handleRemoveFromComparison}
          />
        );

      default:
        return <NutritionChart foodItem={foodItem} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onNavigate={(path) => navigate(path)} />

      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isClosing ? 0 : 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={handleOverlayClick}
        >
          <motion.div
            ref={modalRef}
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{
              scale: isClosing ? 0.9 : 1,
              opacity: isClosing ? 0 : 1,
              y: isClosing ? 20 : 0,
            }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="w-full max-w-7xl max-h-[90vh] glass rounded-2xl border border-glass-border shadow-glass-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* HEADER */}
            <div className="glass-subtle border-b border-glass-border p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-xl overflow-hidden shadow-glass">
                    <Image
                      src={foodItem?.image}
                      alt={foodItem?.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div>
                    <h1 className="text-2xl font-bold">{foodItem?.name}</h1>

                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>{foodItem?.brand}</span>
                      <span>•</span>
                      <span>{foodItem?.category}</span>
                      <span>•</span>
                      <span>{foodItem?.serving_size}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleClose}
                  className="p-2 rounded-xl hover:bg-muted/50 transition-all"
                >
                  <Icon name="X" size={24} />
                </button>
              </div>

              {/* TAB BUTTONS */}
              <div className="flex flex-wrap gap-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all
                      ${
                        activeTab === tab.id
                          ? "bg-accent/20 text-accent border border-accent/30"
                          : "text-muted-foreground hover:bg-muted/30"
                      }
                    `}
                  >
                    <Icon name={tab.icon} size={16} />
                    <span>{tab.label}</span>

                    {tab.badge > 0 && (
                      <span className="bg-accent text-xs px-2 py-0.5 rounded-full">
                        {tab.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* CONTENT */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {renderTabContent()}
                </motion.div>
              </div>
            </div>

            {/* FOOTER */}
            <div className="glass-subtle border-t border-glass-border p-6">
              <ActionButtons
                foodItem={foodItem}
                onAddToComparison={handleAddToComparison}
                onClose={handleClose}
              />
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default NutritionExplorerModal;
