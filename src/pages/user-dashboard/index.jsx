import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/ui/Header';
import NavigationBreadcrumbs from '../../components/ui/NavigationBreadcrumbs';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import AnalyticsCard from './components/AnalyticsCard';
import FavoriteCard from './components/FavoriteCard';
import SearchHistoryItem from './components/SearchHistoryItem';
import ComparisonPreview from './components/ComparisonPreview';
import DietaryPreferences from './components/DietaryPreferences';
import AchievementBadge from './components/AchievementBadge';
import QuickActions from './components/QuickActions';

const UserDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  // Mock user data
  const mockUser = {
    id: 1,
    name: "Sarah Johnson",
    email: "sarah.johnson@email.com",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
    joinDate: "March 2024",
    totalSearches: 247,
    favoriteCount: 18,
    comparisonCount: 12
  };

  // Mock analytics data
  const analyticsData = [
    {
      title: "Total Searches",
      value: "247",
      change: "+12%",
      changeType: "positive",
      icon: "Search",
      description: "Searches this month",
      trend: [45, 52, 48, 61, 55, 67, 73, 69, 76, 82, 78, 85]
    },
    {
      title: "Favorites Saved",
      value: "18",
      change: "+3",
      changeType: "positive",
      icon: "Heart",
      description: "New favorites this week",
      trend: [12, 13, 15, 14, 16, 17, 18]
    },
    {
      title: "Comparisons Made",
      value: "12",
      change: "+2",
      changeType: "positive",
      icon: "GitCompare",
      description: "Comparisons this month",
      trend: [8, 9, 10, 11, 10, 11, 12]
    },
    {
      title: "Nutrition Score",
      value: "8.4/10",
      change: "+0.3",
      changeType: "positive",
      icon: "TrendingUp",
      description: "Average nutrition rating",
      trend: [7.8, 7.9, 8.0, 8.1, 8.2, 8.3, 8.4]
    }
  ];

  // Mock favorites data
  const mockFavorites = [
    {
      id: 1,
      name: "Almond Milk",
      image: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=300&h=200&fit=crop",
      category: "Dairy Alternative",
      nutritionScore: 8.5,
      sustainabilityScore: 9.2,
      allergens: ["Tree Nuts"],
      savedDate: "Dec 10",
      isOrganic: true
    },
    {
      id: 2,
      name: "Quinoa Pasta",
      image: "https://images.unsplash.com/photo-1551892374-ecf8754cf8b0?w=300&h=200&fit=crop",
      category: "Gluten-Free Grain",
      nutritionScore: 9.1,
      sustainabilityScore: 8.7,
      allergens: [],
      savedDate: "Dec 8",
      isOrganic: false
    },
    {
      id: 3,
      name: "Coconut Yogurt",
      image: "https://images.unsplash.com/photo-1571212515416-fac8d2b1d304?w=300&h=200&fit=crop",
      category: "Dairy Alternative",
      nutritionScore: 7.8,
      sustainabilityScore: 8.9,
      allergens: [],
      savedDate: "Dec 5",
      isOrganic: true
    }
  ];

  // Mock search history
  const mockSearchHistory = [
    {
      id: 1,
      query: "gluten-free bread alternatives",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      resultsCount: 24,
      filters: ["Gluten-Free", "Organic"],
      category: "Grains"
    },
    {
      id: 2,
      query: "plant-based protein sources",
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
      resultsCount: 31,
      filters: ["Vegan", "High Protein"],
      category: "Protein"
    },
    {
      id: 3,
      query: "low sodium snacks",
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      resultsCount: 18,
      filters: ["Low Sodium", "Heart Healthy"],
      category: "Snacks"
    }
  ];

  // Mock comparisons
  const mockComparisons = [
    {
      id: 1,
      foods: [
        { id: 1, name: "Almond Milk", image: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=100&h=100&fit=crop" },
        { id: 2, name: "Oat Milk", image: "https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=100&h=100&fit=crop" },
        { id: 3, name: "Soy Milk", image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=100&h=100&fit=crop" }
      ],
      createdDate: "Dec 9, 2024",
      winner: 2,
      comparisonType: "Nutrition"
    },
    {
      id: 2,
      foods: [
        { id: 4, name: "Quinoa", image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=100&h=100&fit=crop" },
        { id: 5, name: "Brown Rice", image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=100&h=100&fit=crop" }
      ],
      createdDate: "Dec 7, 2024",
      winner: 4,
      comparisonType: "Sustainability"
    }
  ];

  // Mock achievements
  const mockAchievements = [
    {
      id: 1,
      title: "Search Explorer",
      description: "Complete 100 food searches",
      icon: "Search",
      category: "exploration",
      target: 100,
      reward: "10 points",
      isUnlocked: true,
      progress: 100
    },
    {
      id: 2,
      title: "Nutrition Guru",
      description: "Save 25 high-nutrition alternatives",
      icon: "Award",
      category: "nutrition",
      target: 25,
      reward: "Nutrition Badge",
      isUnlocked: false,
      progress: 18
    },
    {
      id: 3,
      title: "Eco Warrior",
      description: "Choose 50 sustainable options",
      icon: "Leaf",
      category: "sustainability",
      target: 50,
      reward: "Eco Badge",
      isUnlocked: false,
      progress: 32
    },
    {
      id: 4,
      title: "Comparison Master",
      description: "Complete 20 food comparisons",
      icon: "GitCompare",
      category: "exploration",
      target: 20,
      reward: "Comparison Badge",
      isUnlocked: false,
      progress: 12
    }
  ];

  // Mock dietary preferences
  const mockPreferences = {
    dietary: {
      vegan: true,
      glutenFree: true,
      organic: false
    },
    allergens: {
      nuts: true,
      dairy: false,
      gluten: true
    },
    sustainability: {
      localSourcing: true,
      lowCarbon: true,
      sustainablePackaging: false
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'LayoutDashboard' },
    { id: 'favorites', label: 'Favorites', icon: 'Heart' },
    { id: 'history', label: 'History', icon: 'History' },
    { id: 'comparisons', label: 'Comparisons', icon: 'GitCompare' },
    { id: 'preferences', label: 'Preferences', icon: 'Settings' },
    { id: 'achievements', label: 'Achievements', icon: 'Award' }
  ];

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    navigate(`/food-search-results?q=${encodeURIComponent(query)}`);
  };

  const handleRemoveFavorite = (id) => {
    console.log('Removing favorite:', id);
  };

  const handleViewFoodDetails = (food) => {
    navigate('/nutrition-explorer-modal', { state: { food } });
  };

  const handleCompareFood = (food) => {
    navigate('/food-comparison-tool', { state: { initialFood: food } });
  };

  const handleReSearch = (search) => {
    navigate(`/food-search-results?q=${encodeURIComponent(search?.query)}`);
  };

  const handleRemoveHistory = (id) => {
    console.log('Removing history item:', id);
  };

  const handleViewComparison = (comparison) => {
    navigate('/food-comparison-tool', { state: { comparison } });
  };

  const handleRemoveComparison = (id) => {
    console.log('Removing comparison:', id);
  };

  const handleUpdatePreferences = (preferences) => {
    console.log('Updating preferences:', preferences);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-8">
            {/* Analytics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {analyticsData?.map((data, index) => (
                <AnalyticsCard key={index} {...data} />
              ))}
            </div>
            {/* Quick Actions and Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1">
                <QuickActions onNavigate={handleNavigation} />
              </div>
              
              <div className="lg:col-span-2 space-y-6">
                {/* Recent Favorites */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-foreground">Recent Favorites</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      iconName="ArrowRight"
                      iconPosition="right"
                      onClick={() => setActiveTab('favorites')}
                    >
                      View All
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {mockFavorites?.slice(0, 2)?.map((food) => (
                      <FavoriteCard
                        key={food?.id}
                        food={food}
                        onRemove={handleRemoveFavorite}
                        onViewDetails={handleViewFoodDetails}
                        onCompare={handleCompareFood}
                      />
                    ))}
                  </div>
                </div>

                {/* Recent Comparisons */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-foreground">Recent Comparisons</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      iconName="ArrowRight"
                      iconPosition="right"
                      onClick={() => setActiveTab('comparisons')}
                    >
                      View All
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {mockComparisons?.slice(0, 2)?.map((comparison) => (
                      <ComparisonPreview
                        key={comparison?.id}
                        comparison={comparison}
                        onViewFull={handleViewComparison}
                        onRemove={handleRemoveComparison}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'favorites':
        return (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-foreground">Saved Favorites</h3>
                <p className="text-muted-foreground">Your bookmarked food alternatives</p>
              </div>
              <Button
                variant="default"
                iconName="Search"
                iconPosition="left"
                onClick={() => handleNavigation('/landing-page')}
              >
                Find More
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {mockFavorites?.map((food) => (
                  <FavoriteCard
                    key={food?.id}
                    food={food}
                    onRemove={handleRemoveFavorite}
                    onViewDetails={handleViewFoodDetails}
                    onCompare={handleCompareFood}
                  />
                ))}
              </AnimatePresence>
            </div>
          </div>
        );

      case 'history':
        return (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-foreground">Search History</h3>
                <p className="text-muted-foreground">Your recent food searches</p>
              </div>
              <Button
                variant="outline"
                iconName="Trash2"
                iconPosition="left"
                onClick={() => console.log('Clear all history')}
              >
                Clear All
              </Button>
            </div>
            <div className="space-y-4">
              <AnimatePresence>
                {mockSearchHistory?.map((search) => (
                  <SearchHistoryItem
                    key={search?.id}
                    search={search}
                    onReSearch={handleReSearch}
                    onRemove={handleRemoveHistory}
                  />
                ))}
              </AnimatePresence>
            </div>
          </div>
        );

      case 'comparisons':
        return (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-foreground">Food Comparisons</h3>
                <p className="text-muted-foreground">Your comparison analysis history</p>
              </div>
              <Button
                variant="default"
                iconName="GitCompare"
                iconPosition="left"
                onClick={() => handleNavigation('/food-comparison-tool')}
              >
                New Comparison
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AnimatePresence>
                {mockComparisons?.map((comparison) => (
                  <ComparisonPreview
                    key={comparison?.id}
                    comparison={comparison}
                    onViewFull={handleViewComparison}
                    onRemove={handleRemoveComparison}
                  />
                ))}
              </AnimatePresence>
            </div>
          </div>
        );

      case 'preferences':
        return (
          <div>
            <DietaryPreferences
              preferences={mockPreferences}
              onUpdate={handleUpdatePreferences}
            />
          </div>
        );

      case 'achievements':
        return (
          <div>
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-foreground mb-2">Achievements</h3>
              <p className="text-muted-foreground">Track your healthy eating journey</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockAchievements?.map((achievement) => (
                <AchievementBadge
                  key={achievement?.id}
                  achievement={achievement}
                  isUnlocked={achievement?.isUnlocked}
                  progress={achievement?.progress}
                />
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header
        user={mockUser}
        onNavigate={handleNavigation}
        searchProps={{
          onSearch: handleSearch,
          onSearchToggle: () => setIsSearchExpanded(!isSearchExpanded),
          placeholder: "Search for food alternatives...",
          isLoading: false
        }}
      />
      <main className="pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <NavigationBreadcrumbs onNavigate={handleNavigation} />
          
          {/* Welcome Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="glass rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-foreground mb-2">
                    Welcome back, {mockUser?.name}! 👋
                  </h1>
                  <p className="text-muted-foreground">
                    You've discovered {mockUser?.totalSearches} food alternatives since joining in {mockUser?.joinDate}
                  </p>
                </div>
                <div className="hidden md:flex items-center space-x-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-accent">{mockUser?.favoriteCount}</div>
                    <p className="text-xs text-muted-foreground">Favorites</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-secondary">{mockUser?.comparisonCount}</div>
                    <p className="text-xs text-muted-foreground">Comparisons</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Tab Navigation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-8"
          >
            <div className="glass rounded-xl p-2">
              <nav className="flex space-x-1 overflow-x-auto" role="tablist">
                {tabs?.map((tab) => (
                  <button
                    key={tab?.id}
                    onClick={() => setActiveTab(tab?.id)}
                    className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 whitespace-nowrap ${
                      activeTab === tab?.id
                        ? 'bg-accent/20 text-accent shadow-neon'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                    }`}
                    role="tab"
                    aria-selected={activeTab === tab?.id}
                  >
                    <Icon name={tab?.icon} size={18} />
                    <span>{tab?.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </motion.div>

          {/* Tab Content */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {renderTabContent()}
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default UserDashboard;