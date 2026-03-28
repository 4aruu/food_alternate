import React from 'react';
import Icon from "../../../components/AppIcon";

const SearchHistoryItem = ({ name, category, time, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="flex items-center justify-between p-4 bg-[#111] border border-white/5 rounded-xl hover:bg-[#1a1a1a] cursor-pointer transition-colors group"
    >
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 group-hover:bg-emerald-500/20 group-hover:text-emerald-400 transition-colors">
          <Icon name="Clock" size={18} />
        </div>
        <div>
          <h4 className="font-bold text-white text-sm">{name}</h4>
          <p className="text-xs text-gray-500">{category}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-600 font-mono">{time}</span>
        <Icon name="ChevronRight" size={16} className="text-gray-600 group-hover:text-white" />
      </div>
    </div>
  );
};

export default SearchHistoryItem;