import React from 'react';
import Icon from "../../../components/AppIcon";

const AnalyticsCard = ({ title, value, label, icon, color }) => {
  return (
    <div className="bg-[#111] border border-white/5 p-5 rounded-2xl relative overflow-hidden group hover:border-white/10 transition-all">
      <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity ${color}`}>
        <Icon name={icon} size={80} />
      </div>

      <div className="relative z-10">
        <div className={`p-3 rounded-xl bg-white/5 w-fit mb-4 text-${color.split('-')[1]}-400`}>
           <Icon name={icon} size={24} />
        </div>
        <h3 className="text-3xl font-bold text-white mb-1">{value}</h3>
        <p className="text-sm text-gray-400 font-medium uppercase tracking-wider">{title}</p>
        <p className="text-xs text-gray-500 mt-2">{label}</p>
      </div>
    </div>
  );
};

export default AnalyticsCard;