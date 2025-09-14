import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import Icon from '../../../components/AppIcon';

const NutritionChart = ({ foodItem, chartType = 'macronutrients', className = '' }) => {
  const [activeIndex, setActiveIndex] = useState(-1);
  const [animationComplete, setAnimationComplete] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimationComplete(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const macronutrientData = [
    { name: 'Protein', value: foodItem?.nutrition?.protein || 12.5, color: '#06FFA5', unit: 'g' },
    { name: 'Carbs', value: foodItem?.nutrition?.carbohydrates || 45.2, color: '#1E40AF', unit: 'g' },
    { name: 'Fat', value: foodItem?.nutrition?.fat || 8.7, color: '#7C3AED', unit: 'g' },
    { name: 'Fiber', value: foodItem?.nutrition?.fiber || 6.3, color: '#F59E0B', unit: 'g' }
  ];

  const vitaminData = [
    { name: 'Vitamin A', value: 85, recommended: 100, color: '#EF4444' },
    { name: 'Vitamin C', value: 120, recommended: 100, color: '#10B981' },
    { name: 'Vitamin D', value: 45, recommended: 100, color: '#F59E0B' },
    { name: 'Vitamin E', value: 78, recommended: 100, color: '#7C3AED' },
    { name: 'Vitamin K', value: 95, recommended: 100, color: '#06FFA5' },
    { name: 'B12', value: 110, recommended: 100, color: '#1E40AF' }
  ];

  const mineralData = [
    { name: 'Iron', current: 8.5, recommended: 18, percentage: 47 },
    { name: 'Calcium', current: 245, recommended: 1000, percentage: 25 },
    { name: 'Potassium', current: 1850, recommended: 3500, percentage: 53 },
    { name: 'Magnesium', current: 156, recommended: 400, percentage: 39 },
    { name: 'Zinc', current: 4.2, recommended: 11, percentage: 38 }
  ];

  const calorieBreakdown = [
    { name: 'From Protein', value: 20, color: '#06FFA5' },
    { name: 'From Carbs', value: 65, color: '#1E40AF' },
    { name: 'From Fat', value: 15, color: '#7C3AED' }
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload?.length) {
      return (
        <div className="glass rounded-lg p-3 border border-glass-border shadow-glass">
          <p className="text-foreground font-medium">{label}</p>
          {payload?.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry?.color }}>
              {entry?.name}: {entry?.value}{entry?.payload?.unit || '%'}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderMacronutrients = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {macronutrientData?.map((macro, index) => (
          <div
            key={macro?.name}
            className={`glass rounded-xl p-4 border border-glass-border transition-all duration-300 hover:shadow-neon ${
              animationComplete ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
            style={{ transitionDelay: `${index * 100}ms` }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">{macro?.name}</span>
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: macro?.color }}
              />
            </div>
            <div className="text-2xl font-bold text-foreground">
              {macro?.value}{macro?.unit}
            </div>
          </div>
        ))}
      </div>

      <div className="glass rounded-xl p-6 border border-glass-border">
        <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center">
          <Icon name="BarChart3" size={20} className="text-accent mr-2" />
          Macronutrient Distribution
        </h4>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={macronutrientData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey="name" 
                stroke="#94A3B8"
                fontSize={12}
              />
              <YAxis 
                stroke="#94A3B8"
                fontSize={12}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="value" 
                fill="#06FFA5"
                radius={[4, 4, 0, 0]}
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(-1)}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  const renderVitamins = () => (
    <div className="space-y-6">
      <div className="glass rounded-xl p-6 border border-glass-border">
        <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center">
          <Icon name="Zap" size={20} className="text-accent mr-2" />
          Vitamin Content (% Daily Value)
        </h4>
        <div className="space-y-4">
          {vitaminData?.map((vitamin, index) => (
            <div
              key={vitamin?.name}
              className={`transition-all duration-300 ${
                animationComplete ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">{vitamin?.name}</span>
                <span className="text-sm text-muted-foreground">{vitamin?.value}%</span>
              </div>
              <div className="w-full bg-muted/30 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: animationComplete ? `${Math.min(vitamin?.value, 100)}%` : '0%',
                    backgroundColor: vitamin?.color
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderMinerals = () => (
    <div className="space-y-6">
      <div className="glass rounded-xl p-6 border border-glass-border">
        <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center">
          <Icon name="Gem" size={20} className="text-accent mr-2" />
          Essential Minerals
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mineralData?.map((mineral, index) => (
            <div
              key={mineral?.name}
              className={`glass-subtle rounded-lg p-4 transition-all duration-300 hover:shadow-neon ${
                animationComplete ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
              }`}
              style={{ transitionDelay: `${index * 150}ms` }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-foreground">{mineral?.name}</span>
                <span className="text-sm text-accent">{mineral?.percentage}%</span>
              </div>
              <div className="text-xs text-muted-foreground mb-2">
                {mineral?.current}mg / {mineral?.recommended}mg daily
              </div>
              <div className="w-full bg-muted/30 rounded-full h-1.5">
                <div
                  className="h-1.5 rounded-full bg-gradient-to-r from-accent to-secondary transition-all duration-1000 ease-out"
                  style={{
                    width: animationComplete ? `${mineral?.percentage}%` : '0%'
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderCalories = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass rounded-xl p-6 border border-glass-border">
          <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center">
            <Icon name="Flame" size={20} className="text-accent mr-2" />
            Calorie Breakdown
          </h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={calorieBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(-1)}
                >
                  {calorieBreakdown?.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry?.color}
                      stroke={index === activeIndex ? '#06FFA5' : 'none'}
                      strokeWidth={index === activeIndex ? 2 : 0}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass rounded-xl p-6 border border-glass-border">
          <h4 className="text-lg font-semibold text-foreground mb-4">
            Caloric Information
          </h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 glass-subtle rounded-lg">
              <span className="text-muted-foreground">Total Calories</span>
              <span className="text-2xl font-bold text-accent">
                {foodItem?.nutrition?.calories || 245}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 glass-subtle rounded-lg">
              <span className="text-muted-foreground">Calories per 100g</span>
              <span className="text-lg font-semibold text-foreground">
                {foodItem?.nutrition?.caloriesPer100g || 185}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 glass-subtle rounded-lg">
              <span className="text-muted-foreground">Serving Size</span>
              <span className="text-lg font-semibold text-foreground">
                {foodItem?.servingSize || '1 cup (150g)'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const chartTypes = {
    macronutrients: renderMacronutrients,
    vitamins: renderVitamins,
    minerals: renderMinerals,
    calories: renderCalories
  };

  return (
    <div className={`${className}`}>
      {chartTypes?.[chartType] ? chartTypes?.[chartType]() : renderMacronutrients()}
    </div>
  );
};

export default NutritionChart;