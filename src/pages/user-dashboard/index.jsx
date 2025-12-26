import React from "react";
import Header from "../../components/ui/Header";
import AnalyticsCard from "./components/AnalyticsCard";
import QuickActions from "./components/QuickActions";
import SearchHistoryItem from "./components/SearchHistoryItem";
import Icon from "../../components/AppIcon";

const UserDashboard = () => {
  // Mock Data for "Instant" Demo Effect
  const stats = [
    { title: "Calorie Deficit", value: "1,250", label: "Saved this week", icon: "Activity", color: "text-emerald-500" },
    { title: "Eco Impact", value: "85", label: "Sustainability Score", icon: "Leaf", color: "text-blue-500" },
    { title: "Swaps Found", value: "12", label: "Healthy alternatives", icon: "RefreshCw", color: "text-purple-500" },
  ];

  const recentSearches = [
    { id: 1, name: "Chicken Shawarma", category: "Arabic", time: "2 mins ago" },
    { id: 2, name: "Butter Naan", category: "Indian", time: "1 hour ago" },
    { id: 3, name: "Cheeseburger", category: "Fast Food", time: "Yesterday" },
  ];

  return (
    <div className="min-h-screen bg-[#050505] font-sans text-white pb-20">
      <Header />

      <div className="max-w-5xl mx-auto px-6 pt-8 space-y-8">

        {/* 1. Welcome Section */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
              Hello, User 👋
            </h1>
            <p className="text-gray-400 mt-1">Here's your nutritional overview.</p>
          </div>
          <div className="text-right hidden md:block">
            <p className="text-xs text-gray-500 font-mono uppercase tracking-widest">Current Status</p>
            <p className="text-emerald-400 font-bold flex items-center justify-end gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"/> Active
            </p>
          </div>
        </div>

        {/* 2. Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats.map((stat, index) => (
            <AnalyticsCard key={index} {...stat} />
          ))}
        </div>

        {/* 3. Quick Actions */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Icon name="Zap" size={18} className="text-yellow-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400">Quick Actions</h2>
          </div>
          <QuickActions />
        </section>

        {/* 4. Recent Activity */}
        <section>
          <div className="flex items-center justify-between mb-4">
             <div className="flex items-center gap-2">
                <Icon name="History" size={18} className="text-blue-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400">Recent Searches</h2>
             </div>
             <button className="text-xs text-emerald-500 hover:text-emerald-400">View All</button>
          </div>

          <div className="space-y-3">
            {recentSearches.map(item => (
              <SearchHistoryItem
                key={item.id}
                {...item}
                onClick={() => console.log("Navigate to " + item.name)}
              />
            ))}
          </div>
        </section>

      </div>
    </div>
  );
};

export default UserDashboard;