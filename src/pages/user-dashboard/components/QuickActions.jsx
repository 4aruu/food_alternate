import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from "../../../components/AppIcon";

const QuickActions = () => {
  const navigate = useNavigate();

  const actions = [
    { label: "Find Food", icon: "Search", path: "/", color: "bg-emerald-500 text-black hover:bg-emerald-400" },
    { label: "Compare Two", icon: "GitCompare", path: "/food-comparison-tool", color: "bg-[#222] text-white border border-white/10 hover:bg-[#333]" },
    { label: "Profile Settings", icon: "Settings", path: "/settings", color: "bg-[#222] text-white border border-white/10 hover:bg-[#333]" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {actions.map((action) => (
        <button
          key={action.label}
          onClick={() => navigate(action.path)}
          className={`flex items-center justify-center gap-3 py-4 rounded-xl font-bold transition-all ${action.color}`}
        >
          <Icon name={action.icon} size={20} />
          {action.label}
        </button>
      ))}
    </div>
  );
};

export default QuickActions;