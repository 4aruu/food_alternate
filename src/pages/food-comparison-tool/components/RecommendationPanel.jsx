import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';

const RecommendationPanel = ({ comparedFoods, onAddRecommendation }) => {
  const [activeTab, setActiveTab] = useState('similar');

  const mockRecommendations = {
    similar: [
      {
        id: 'lentils',
        name: 'Red Lentils',
        category: 'Legumes',
        image: 'https://images.unsplash.com/photo-1509358271058-acd22cc93898?w=400',
        reason: 'High protein content similar to your compared foods',
        matchScore: 92,
        nutrition: {
          calories: 116,
          macros: { protein: 9.0, carbs: 20.1, fat: 0.4, fiber: 7.9, sugar: 1.8, sodium: 2 }
        },
        sustainabilityScore: 89,
        allergens: []
      },
      {
        id: 'hemp-seeds',
        name: 'Hemp Seeds',
        category: 'Seeds',
        image: 'https://images.unsplash.com/photo-1609501676725-7186f734c4b8?w=400',
        reason: 'Excellent protein profile and omega fatty acids',
        matchScore: 88,
        nutrition: {
          calories: 553,
          macros: { protein: 31.6, carbs: 8.7, fat: 48.8, fiber: 4.0, sugar: 1.5, sodium: 5 }
        },
        sustainabilityScore: 94,
        allergens: []
      }
    ],
    alternatives: [
      {
        id: 'spirulina',
        name: 'Spirulina Powder',
        category: 'Superfoods',
        image: 'https://images.unsplash.com/photo-1609501676725-7186f734c4b8?w=400',
        reason: 'Nutrient-dense alternative with complete amino acid profile',
        matchScore: 85,
        nutrition: {
          calories: 290,
          macros: { protein: 57.5, carbs: 23.9, fat: 7.7, fiber: 3.6, sugar: 3.1, sodium: 1048 }
        },
        sustainabilityScore: 96,
        allergens: []
      },
      {
        id: 'nutritional-yeast',
        name: 'Nutritional Yeast',
        category: 'Supplements',
        image: 'https://images.unsplash.com/photo-1609501676725-7186f734c4b8?w=400',
        reason: 'B-vitamin rich alternative with umami flavor',
        matchScore: 78,
        nutrition: {
          calories: 325,
          macros: { protein: 45.6, carbs: 36.5, fat: 7.9, fiber: 20.6, sugar: 0, sodium: 20 }
        },
        sustainabilityScore: 91,
        allergens: []
      }
    ],
    trending: [
      {
        id: 'jackfruit',
        name: 'Young Jackfruit',
        category: 'Fruits',
        image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400',
        reason: 'Trending meat substitute with unique texture',
        matchScore: 72,
        nutrition: {
          calories: 95,
          macros: { protein: 1.7, carbs: 23.2, fat: 0.6, fiber: 1.5, sugar: 19.1, sodium: 2 }
        },
        sustainabilityScore: 87,
        allergens: []
      },
      {
        id: 'tempeh',
        name: 'Tempeh',
        category: 'Fermented',
        image: 'https://images.unsplash.com/photo-1541014741259-de529411b96a?w=400',
        reason: 'Fermented protein source gaining popularity',
        matchScore: 86,
        nutrition: {
          calories: 193,
          macros: { protein: 19.0, carbs: 9.4, fat: 11.4, fiber: 9.0, sugar: 2.3, sodium: 9 }
        },
        sustainabilityScore: 90,
        allergens: ['Soy']
      }
    ]
  };

  const tabs = [
    { id: 'similar', label: 'Similar Foods', icon: 'Target', count: mockRecommendations?.similar?.length },
    { id: 'alternatives', label: 'Alternatives', icon: 'ArrowRightLeft', count: mockRecommendations?.alternatives?.length },
    { id: 'trending', label: 'Trending', icon: 'TrendingUp', count: mockRecommendations?.trending?.length }
  ];

  const getMatchScoreColor = (score) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 80) return 'text-yellow-400';
    if (score >= 70) return 'text-orange-400';
    return 'text-red-400';
  };

  const getMatchScoreBg = (score) => {
    if (score >= 90) return 'bg-green-400/20 border-green-400/30';
    if (score >= 80) return 'bg-yellow-400/20 border-yellow-400/30';
    if (score >= 70) return 'bg-orange-400/20 border-orange-400/30';
    return 'bg-red-400/20 border-red-400/30';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="glass rounded-2xl border border-glass-border p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-primary flex items-center justify-center">
            <Icon name="Lightbulb" size={20} className="text-background" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Smart Recommendations</h3>
            <p className="text-sm text-muted-foreground">Discover foods based on your comparison</p>
          </div>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          iconName="RefreshCw"
          iconPosition="left"
        >
          Refresh
        </Button>
      </div>
      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-muted/20 rounded-lg p-1">
        {tabs?.map((tab) => (
          <button
            key={tab?.id}
            onClick={() => setActiveTab(tab?.id)}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-md text-sm font-medium transition-all duration-200 ${
              activeTab === tab?.id
                ? 'bg-accent text-background shadow-neon'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon name={tab?.icon} size={16} />
            <span className="hidden sm:inline">{tab?.label}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              activeTab === tab?.id 
                ? 'bg-background/20 text-background' :'bg-muted/30 text-muted-foreground'
            }`}>
              {tab?.count}
            </span>
          </button>
        ))}
      </div>
      {/* Recommendations */}
      <div className="space-y-4">
        {mockRecommendations?.[activeTab]?.map((food, index) => (
          <motion.div
            key={food?.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass-subtle rounded-xl p-4 hover:bg-muted/20 transition-all duration-200"
          >
            <div className="flex items-start space-x-4">
              <Image
                src={food?.image}
                alt={food?.name}
                className="w-16 h-16 rounded-xl object-cover"
              />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-medium text-foreground">{food?.name}</h4>
                    <p className="text-sm text-muted-foreground">{food?.category}</p>
                  </div>
                  <div className={`px-2 py-1 rounded-lg border ${getMatchScoreBg(food?.matchScore)}`}>
                    <span className={`text-xs font-medium ${getMatchScoreColor(food?.matchScore)}`}>
                      {food?.matchScore}% match
                    </span>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground mb-3">{food?.reason}</p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className="text-xs text-orange-400">
                      {food?.nutrition?.calories} cal
                    </span>
                    <span className="text-xs text-blue-400">
                      {food?.nutrition?.macros?.protein}g protein
                    </span>
                    <div className="flex items-center space-x-1">
                      <Icon name="Leaf" size={12} className="text-green-400" />
                      <span className="text-xs text-green-400">
                        {food?.sustainabilityScore}
                      </span>
                    </div>
                    {food?.allergens?.length > 0 && (
                      <div className="flex items-center space-x-1">
                        <Icon name="AlertTriangle" size={12} className="text-yellow-400" />
                        <span className="text-xs text-yellow-400">
                          {food?.allergens?.length} allergen{food?.allergens?.length > 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onAddRecommendation(food)}
                      iconName="Plus"
                      iconPosition="left"
                    >
                      Add
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-accent"
                    >
                      <Icon name="Info" size={16} />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-glass-border">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Recommendations based on nutritional similarity and dietary preferences
          </p>
          <Button
            variant="ghost"
            size="sm"
            iconName="ExternalLink"
            iconPosition="right"
          >
            View All
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default RecommendationPanel;