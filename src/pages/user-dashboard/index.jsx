import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/ui/Header";
import AnalyticsCard from "./components/AnalyticsCard";
import QuickActions from "./components/QuickActions";
import SearchHistoryItem from "./components/SearchHistoryItem";
import Icon from "../../components/AppIcon";
import { getHistory, getTimeAgo } from "../../utils/history";

const UserDashboard = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({
    deficit: 0,
    eco: 0,
    swaps: 0
  });

  // 1. Load Data on Mount
  useEffect(() => {
    const data = getHistory();
    setHistory(data);

    // 2. Calculate Real Stats from History
    if (data.length > 0) {
      // Avg Sustainability Score
      const totalEco = data.reduce((acc, item) => acc + (item.sustainability_score || 0), 0);
      const avgEco = Math.round(totalEco / data.length);

      // Count "Potential Swaps" (Items with low scores that you checked)
      const swapCount = data.filter(item => item.nutrition_score < 70).length;

      // Mock Deficit (Logic: 50 cals saved per healthy interaction)
      const calorieDeficit = swapCount * 150;

      setStats({
        deficit: calorieDeficit,
        eco: avgEco,
        swaps: swapCount
      });
    }
  }, []);

  // Stats Configuration
  const analyticsCards = [
    {
      title: "Calorie Deficit",
      value: stats.deficit.toLocaleString(),
      label: "Est. saved this week",
      icon: "Activity",
      color: "text-emerald-500"
    },
    {
      title: "Eco Impact",
      value: stats.eco || 0,
      label: "Avg Sustainability Score",
      icon: "Leaf",
      color: "text-blue-500"
    },
    {
      title: "Swaps Found",
      value: stats.swaps,
      label: "Better options discovered",
      icon: "RefreshCw",
      color: "text-purple-500"
    },
  ];

  return (
    <div className="min-h-screen bg-[#050505] font-sans text-white pb-20">
      <Header />

      <div className="max-w-5xl mx-auto px-6 pt-32 space-y-8">

        {/* 1. Welcome Section */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
              Hello, Chef 👨‍🍳
            </h1>
            <p className="text-gray-400 mt-1">Here is your nutritional overview based on your recent searches.</p>
          </div>
          <div className="text-right hidden md:block">
            <p className="text-xs text-gray-500 font-mono uppercase tracking-widest">Current Status</p>
            <p className="text-emerald-400 font-bold flex items-center justify-end gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> Online
            </p>
          </div>
        </div>

        {/* 2. Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {analyticsCards.map((stat, index) => (
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
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400">Recent Views</h2>
            </div>
            {history.length > 0 && (
              <button
                onClick={() => { localStorage.removeItem('user_history'); setHistory([]); setStats({ deficit: 0, eco: 0, swaps: 0 }); }}
                className="text-xs text-red-500 hover:text-red-400 transition-colors"
              >
                Clear History
              </button>
            )}
          </div>

          <div className="space-y-3">
            {history.length === 0 ? (
              <div className="p-8 text-center border border-white/5 rounded-2xl bg-white/5">
                <p className="text-gray-500">No recent searches found.</p>
                <button onClick={() => navigate('/')} className="mt-2 text-emerald-400 text-sm hover:underline">Start Discovering</button>
              </div>
            ) : (
              history.map(item => (
                <SearchHistoryItem
                  key={item.id}
                  name={item.name}
                  category={item.category}
                  time={getTimeAgo(item.viewedAt)}
                  onClick={() => navigate('/nutrition-explorer-modal', { state: { food: item } })}
                />
              ))
            )}
          </div>
        </section>

      </div>
      <footer className="py-12 border-t border-white/10 text-center text-gray-500 text-sm">
        <p>&copy; 2025 NutriSwap. Designed for the future.</p>
      </footer>
    </div>
  );
};

export default UserDashboard;