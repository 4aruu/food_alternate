import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const ComparisonMatrix = ({ foods, onSort }) => {
  const [sortBy, setSortBy] = useState('calories');
  const [sortOrder, setSortOrder] = useState('asc');

  const metrics = [
    { key: 'calories', label: 'Calories', unit: 'cal', type: 'nutrition' },
    { key: 'protein', label: 'Protein', unit: 'g', type: 'macro' },
    { key: 'carbs', label: 'Carbs', unit: 'g', type: 'macro' },
    { key: 'fat', label: 'Fat', unit: 'g', type: 'macro' },
    { key: 'fiber', label: 'Fiber', unit: 'g', type: 'macro' },
    { key: 'sugar', label: 'Sugar', unit: 'g', type: 'macro' },
    { key: 'sodium', label: 'Sodium', unit: 'mg', type: 'macro' },
    { key: 'sustainabilityScore', label: 'Eco Score', unit: '', type: 'sustainability' }
  ];

  const getValue = (food, metric) => {
    if (metric?.type === 'nutrition') {
      return food?.nutrition?.[metric?.key];
    } else if (metric?.type === 'macro') {
      return food?.nutrition?.macros?.[metric?.key];
    } else if (metric?.type === 'sustainability') {
      return food?.[metric?.key];
    }
    return 0;
  };

  const getBestValue = (metric) => {
    const values = foods?.map(food => getValue(food, metric));
    if (metric?.key === 'calories' || metric?.key === 'sugar' || metric?.key === 'sodium') {
      return Math.min(...values);
    } else {
      return Math.max(...values);
    }
  };

  const isBestValue = (food, metric) => {
    const value = getValue(food, metric);
    const bestValue = getBestValue(metric);
    return value === bestValue;
  };

  const handleSort = (metricKey) => {
    if (sortBy === metricKey) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(metricKey);
      setSortOrder('asc');
    }
    onSort(metricKey, sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const getMetricColor = (metric) => {
    const colors = {
      calories: 'text-orange-400',
      protein: 'text-blue-400',
      carbs: 'text-yellow-400',
      fat: 'text-purple-400',
      fiber: 'text-green-400',
      sugar: 'text-red-400',
      sodium: 'text-pink-400',
      sustainabilityScore: 'text-emerald-400'
    };
    return colors?.[metric?.key] || 'text-gray-400';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="glass rounded-2xl border border-glass-border p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <Icon name="Table" size={20} className="text-primary-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Comparison Matrix</h3>
            <p className="text-sm text-muted-foreground">Side-by-side nutritional analysis</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            iconName="Download"
            iconPosition="left"
          >
            Export
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-accent"
          >
            <Icon name="Share2" size={16} />
          </Button>
        </div>
      </div>
      {/* Matrix Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-glass-border">
              <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                Metric
              </th>
              {foods?.map((food, index) => (
                <th key={food?.id} className="text-center py-3 px-2 min-w-[120px]">
                  <div className="flex flex-col items-center space-y-1">
                    <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
                      <span className="text-xs font-bold text-accent">{index + 1}</span>
                    </div>
                    <span className="text-xs font-medium text-foreground truncate max-w-[100px]">
                      {food?.name}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {metrics?.map((metric, metricIndex) => (
              <motion.tr
                key={metric?.key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: metricIndex * 0.05 }}
                className="border-b border-glass-border/50 hover:bg-muted/20 transition-colors duration-200"
              >
                <td className="py-3 px-2">
                  <button
                    onClick={() => handleSort(metric?.key)}
                    className="flex items-center space-x-2 text-left hover:text-accent transition-colors duration-200"
                  >
                    <span className={`text-sm font-medium ${getMetricColor(metric)}`}>
                      {metric?.label}
                    </span>
                    {sortBy === metric?.key && (
                      <Icon 
                        name={sortOrder === 'asc' ? 'ChevronUp' : 'ChevronDown'} 
                        size={14} 
                        className="text-accent"
                      />
                    )}
                  </button>
                </td>
                {foods?.map((food) => {
                  const value = getValue(food, metric);
                  const isBest = isBestValue(food, metric);
                  
                  return (
                    <td key={food?.id} className="text-center py-3 px-2">
                      <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-lg ${
                        isBest 
                          ? 'bg-accent/20 border border-accent/30 text-accent' :'text-foreground'
                      }`}>
                        {isBest && <Icon name="Crown" size={12} className="text-accent" />}
                        <span className="text-sm font-medium">
                          {value}{metric?.unit}
                        </span>
                      </div>
                    </td>
                  );
                })}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-subtle rounded-xl p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Icon name="TrendingUp" size={16} className="text-green-400" />
            <span className="text-sm font-medium text-foreground">Best Overall</span>
          </div>
          <p className="text-lg font-semibold text-accent">
            {foods?.find(food => food?.sustainabilityScore === Math.max(...foods?.map(f => f?.sustainabilityScore)))?.name}
          </p>
          <p className="text-xs text-muted-foreground">Highest eco score</p>
        </div>

        <div className="glass-subtle rounded-xl p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Icon name="Zap" size={16} className="text-orange-400" />
            <span className="text-sm font-medium text-foreground">Lowest Calories</span>
          </div>
          <p className="text-lg font-semibold text-accent">
            {foods?.find(food => food?.nutrition?.calories === Math.min(...foods?.map(f => f?.nutrition?.calories)))?.name}
          </p>
          <p className="text-xs text-muted-foreground">
            {Math.min(...foods?.map(f => f?.nutrition?.calories))} cal per 100g
          </p>
        </div>

        <div className="glass-subtle rounded-xl p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Icon name="Shield" size={16} className="text-blue-400" />
            <span className="text-sm font-medium text-foreground">Highest Protein</span>
          </div>
          <p className="text-lg font-semibold text-accent">
            {foods?.find(food => food?.nutrition?.macros?.protein === Math.max(...foods?.map(f => f?.nutrition?.macros?.protein)))?.name}
          </p>
          <p className="text-xs text-muted-foreground">
            {Math.max(...foods?.map(f => f?.nutrition?.macros?.protein))}g per 100g
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default ComparisonMatrix;