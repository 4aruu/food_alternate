import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../../components/AppIcon';
import Image from '../../components/AppImage';
import Header from '../../components/ui/Header';
import NutritionChart from './components/NutritionChart';
import AllergenAlert from './components/AllergenAlert';
import SustainabilityMetrics from './components/SustainabilityMetrics';
import ComparisonView from './components/ComparisonView';
import ActionButtons from './components/ActionButtons';

const NutritionExplorerModal = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const modalRef = useRef(null);
  
  const [activeTab, setActiveTab] = useState('nutrition');
  const [isLoading, setIsLoading] = useState(true);
  const [foodItem, setFoodItem] = useState(null);
  const [comparisonItems, setComparisonItems] = useState([]);
  const [isClosing, setIsClosing] = useState(false);

  // Mock food item data
  const mockFoodItem = {
    id: 1,
    name: 'Organic Almond Milk',
    brand: 'Nature\'s Best',
    image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=800',
    category: 'Dairy Alternative',
    servingSize: '1 cup (240ml)',
    nutrition: {
      calories: 39,
      protein: 1.4,
      carbohydrates: 3.4,
      fat: 2.9,
      fiber: 0.7,
      sugar: 2.1,
      sodium: 150,
      calcium: 450,
      vitaminE: 7.5,
      caloriesPer100g: 16
    },
    allergens: {
      dairy: false,
      nuts: true,
      gluten: false,
      soy: false,
      eggs: false,
      shellfish: false
    },
    sustainability: {
      overallScore: 78,
      carbonFootprint: 2.1,
      waterUsage: 130,
      landUse: 0.6
    },
    sourcing: {
      origin: 'California, USA',
      transportation: 'Low-emission transport',
      farmers: 'Supporting 12+ local almond farms'
    },
    certifications: ['Organic', 'Non-GMO', 'Sustainable Packaging'],
    description: `A creamy, nutritious plant-based milk alternative made from premium California almonds. 
    Rich in vitamin E and naturally lactose-free, this organic almond milk provides a delicious and 
    sustainable option for your daily nutrition needs.`
  };

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setFoodItem(mockFoodItem);
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Handle escape key
    const handleEscape = (event) => {
      if (event?.key === 'Escape') {
        handleClose();
      }
    };

    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = 'unset';
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      navigate('/food-search-results');
    }, 300);
  };

  const handleOverlayClick = (event) => {
    if (event?.target === event?.currentTarget) {
      handleClose();
    }
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleSave = async (item, saved) => {
    console.log('Saving item:', item, 'Saved:', saved);
    // Implement save logic here
  };

  const handleShare = async (item, platform) => {
    console.log('Sharing item:', item, 'Platform:', platform);
    // Implement share logic here
  };

  const handleAddToComparison = (item) => {
    setComparisonItems(prev => {
      const exists = prev?.find(existing => existing?.id === item?.id);
      if (!exists && prev?.length < 3) {
        return [...prev, item];
      }
      return prev;
    });
    console.log('Added to comparison:', item);
  };

  const handleRemoveFromComparison = (itemId) => {
    setComparisonItems(prev => prev?.filter(item => item?.id !== itemId));
  };

  const tabs = [
    { id: 'nutrition', label: 'Nutrition', icon: 'BarChart3' },
    { id: 'allergens', label: 'Allergens', icon: 'Shield' },
    { id: 'sustainability', label: 'Sustainability', icon: 'Leaf' },
    { id: 'comparison', label: 'Compare', icon: 'GitCompare', badge: comparisonItems?.length }
  ];

  const renderTabContent = () => {
    if (isLoading) {
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
      case 'nutrition':
        return <NutritionChart foodItem={foodItem} />;
      case 'allergens':
        return <AllergenAlert foodItem={foodItem} />;
      case 'sustainability':
        return <SustainabilityMetrics foodItem={foodItem} />;
      case 'comparison':
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
      <Header onNavigate={handleNavigation} />
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
              y: isClosing ? 20 : 0 
            }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="w-full max-w-7xl max-h-[90vh] glass rounded-2xl border border-glass-border shadow-glass-lg overflow-hidden"
            onClick={(e) => e?.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="glass-subtle border-b border-glass-border p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-xl overflow-hidden shadow-glass">
                    <Image
                      src={foodItem?.image || '/assets/images/no_image.png'}
                      alt={foodItem?.name || 'Food item'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-foreground">
                      {foodItem?.name || 'Loading...'}
                    </h1>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>{foodItem?.brand}</span>
                      <span>•</span>
                      <span>{foodItem?.category}</span>
                      <span>•</span>
                      <span>{foodItem?.servingSize}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200"
                  aria-label="Close modal"
                >
                  <Icon name="X" size={24} />
                </button>
              </div>

              {/* Tab Navigation */}
              <div className="flex flex-wrap gap-2">
                {tabs?.map((tab) => (
                  <button
                    key={tab?.id}
                    onClick={() => setActiveTab(tab?.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      activeTab === tab?.id
                        ? 'bg-accent/20 text-accent border border-accent/30 shadow-neon'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                  >
                    <Icon name={tab?.icon} size={16} />
                    <span>{tab?.label}</span>
                    {tab?.badge && tab?.badge > 0 && (
                      <span className="bg-accent text-accent-foreground text-xs px-2 py-0.5 rounded-full">
                        {tab?.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Content */}
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

            {/* Modal Footer */}
            <div className="glass-subtle border-t border-glass-border p-6">
              <ActionButtons
                foodItem={foodItem}
                onSave={handleSave}
                onShare={handleShare}
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