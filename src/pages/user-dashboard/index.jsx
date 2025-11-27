import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

import Header from "../../components/ui/Header";
import NavigationBreadcrumbs from "../../components/ui/NavigationBreadcrumbs";
import Icon from "../../components/AppIcon";
import Button from "../../components/ui/Button";

import AnalyticsCard from "./components/AnalyticsCard";
import FavoriteCard from "./components/FavoriteCard";
import SearchHistoryItem from "./components/SearchHistoryItem";
import ComparisonPreview from "./components/ComparisonPreview";
import DietaryPreferences from "./components/DietaryPreferences";
import AchievementBadge from "./components/AchievementBadge";
import QuickActions from "./components/QuickActions";

const UserDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

  const mockUser = {
    id: 1,
    name: "Sarah Johnson",
    email: "sarah@example.com",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150",
    joinDate: "March 2024",
    totalSearches: 247,
    favoriteCount: 18,
    comparisonCount: 12,
  };

  // ---- FIXED REAL DATA (NO [...]) ----
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

  const mockFavorites = [
    {
      id: 1,
      name: "Almond Milk",
      image: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=300",
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
      image: "https://images.unsplash.com/photo-1551892374-ecf8754cf8b0?w=300",
      category: "Grain",
      nutritionScore: 9.1,
      sustainabilityScore: 8.7,
      allergens: [],
      savedDate: "Dec 8",
      isOrganic: false
    }
  ];

  const mockSearchHistory = [
    {
      id: 1,
      query: "gluten-free bread alternatives",
      timestamp: new Date(),
      resultsCount: 24,
      filters: ["Gluten-Free"],
      category: "Grains",
    },
    {
      id: 2,
      query: "plant-based protein",
      timestamp: new Date(),
      resultsCount: 31,
      filters: ["Vegan"],
      category: "Protein",
    }
  ];

  const mockComparisons = [
    {
      id: 1,
      foods: [
        { id: 1, name: "Almond Milk", image: "" },
        { id: 2, name: "Oat Milk", image: "" }
      ],
      createdDate: "Dec 9",
      winner: 2
    }
  ];

  const mockAchievements = [
    {
      id: 1,
      title: "Search Explorer",
      description: "Complete 100 food searches",
      icon: "Search",
      progress: 100,
      isUnlocked: true
    },
    {
      id: 2,
      title: "Nutrition Guru",
      description: "Save 25 high-nutrition foods",
      icon: "Award",
      progress: 18,
      isUnlocked: false
    }
  ];

  const mockPreferences = {
    dietary: { vegan: true, glutenFree: true, organic: false }
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: "LayoutDashboard" },
    { id: "favorites", label: "Favorites", icon: "Heart" },
    { id: "history", label: "History", icon: "History" },
    { id: "comparisons", label: "Comparisons", icon: "GitCompare" },
    { id: "preferences", label: "Preferences", icon: "Settings" },
    { id: "achievements", label: "Achievements", icon: "Award" }
  ];

  const handleNavigation = (path) => navigate(path);

  const handleSearch = (query) => {
    navigate(`/food-search-results?q=${encodeURIComponent(query)}`);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {analyticsData.map((a, i) => (
                <AnalyticsCard key={i} {...a} />
              ))}
            </div>
          </div>
        );

      case "favorites":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockFavorites.map((f) => (
              <FavoriteCard key={f.id} food={f} />
            ))}
          </div>
        );

      case "history":
        return mockSearchHistory.map((h) => <SearchHistoryItem key={h.id} search={h} />);

      case "comparisons":
        return mockComparisons.map((c) => <ComparisonPreview key={c.id} comparison={c} />);

      case "preferences":
        return <DietaryPreferences preferences={mockPreferences} />;

      case "achievements":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockAchievements.map((a) => (
              <AchievementBadge key={a.id} achievement={a} />
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onNavigate={handleNavigation} searchProps={{ onSearch: handleSearch }} />

      <main className="pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <NavigationBreadcrumbs onNavigate={handleNavigation} />

          <motion.div className="glass p-6 rounded-xl mb-8">
            <h1 className="text-3xl font-bold mb-2">Welcome back, {mockUser.name}! 👋</h1>
            <p className="text-muted-foreground">
              You've discovered {mockUser.totalSearches} alternatives since {mockUser.joinDate}
            </p>
          </motion.div>

          <div className="glass p-2 rounded-xl mb-8 flex overflow-x-auto space-x-1">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`px-4 py-3 rounded-lg ${
                  activeTab === t.id ? "bg-accent/20 text-accent" : "text-muted-foreground"
                }`}
              >
                <Icon name={t.icon} size={18} />
                {t.label}
              </button>
            ))}
          </div>

          {renderTabContent()}
        </div>
      </main>
    </div>
  );
};

export default UserDashboard;
