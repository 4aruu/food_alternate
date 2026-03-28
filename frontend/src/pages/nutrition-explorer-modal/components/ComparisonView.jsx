import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';

const ComparisonView = ({ selectedItems = [], onRemoveItem = () => {}, className = '' }) => {
  const [comparisonType, setComparisonType] = useState('nutrition');
  const [animationComplete, setAnimationComplete] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimationComplete(true), 500);
    return () => clearTimeout(timer);
  }, []);

  // Mock data for comparison items if none provided
  const mockItems = selectedItems?.length > 0 ? selectedItems : [
    {
      id: 1,
      name: 'Almond Milk',
      image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400',
      nutrition: {
        calories: 39,
        protein: 1.4,
        carbohydrates: 3.4,
        fat: 2.9,
        fiber: 0.7,
        sugar: 2.1
      },
      sustainability: {
        overallScore: 78,
        carbonFootprint: 2.1,
        waterUsage: 130,
        landUse: 0.6
      },
      allergens: {
        dairy: false,
        nuts: true,
        gluten: false,
        soy: false
      }
    },
    {
      id: 2,
      name: 'Oat Milk',
      image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400',
      nutrition: {
        calories: 47,
        protein: 1.0,
        carbohydrates: 7.0,
        fat: 1.5,
        fiber: 0.8,
        sugar: 4.2
      },
      sustainability: {
        overallScore: 85,
        carbonFootprint: 1.8,
        waterUsage: 95,
        landUse: 0.4
      },
      allergens: {
        dairy: false,
        nuts: false,
        gluten: true,
        soy: false
      }
    }
  ];

  const comparisonItems = mockItems?.slice(0, 3); // Limit to 3 items for better display

  const nutritionComparisonData = [
    {
      nutrient: 'Calories',
      ...comparisonItems?.reduce((acc, item, index) => ({
        ...acc,
        [`item${index}`]: item?.nutrition?.calories
      }), {})
    },
    {
      nutrient: 'Protein',
      ...comparisonItems?.reduce((acc, item, index) => ({
        ...acc,
        [`item${index}`]: item?.nutrition?.protein
      }), {})
    },
    {
      nutrient: 'Carbs',
      ...comparisonItems?.reduce((acc, item, index) => ({
        ...acc,
        [`item${index}`]: item?.nutrition?.carbohydrates
      }), {})
    },
    {
      nutrient: 'Fat',
      ...comparisonItems?.reduce((acc, item, index) => ({
        ...acc,
        [`item${index}`]: item?.nutrition?.fat
      }), {})
    },
    {
      nutrient: 'Fiber',
      ...comparisonItems?.reduce((acc, item, index) => ({
        ...acc,
        [`item${index}`]: item?.nutrition?.fiber
      }), {})
    }
  ];

  const sustainabilityComparisonData = [
    {
      metric: 'Overall Score',
      ...comparisonItems?.reduce((acc, item, index) => ({
        ...acc,
        [`item${index}`]: item?.sustainability?.overallScore
      }), {})
    },
    {
      metric: 'Carbon Impact',
      ...comparisonItems?.reduce((acc, item, index) => ({
        ...acc,
        [`item${index}`]: Math.max(0, 100 - (item?.sustainability?.carbonFootprint * 20))
      }), {})
    },
    {
      metric: 'Water Efficiency',
      ...comparisonItems?.reduce((acc, item, index) => ({
        ...acc,
        [`item${index}`]: Math.max(0, 100 - (item?.sustainability?.waterUsage / 5))
      }), {})
    },
    {
      metric: 'Land Use',
      ...comparisonItems?.reduce((acc, item, index) => ({
        ...acc,
        [`item${index}`]: Math.max(0, 100 - (item?.sustainability?.landUse * 50))
      }), {})
    }
  ];

  const radarData = comparisonItems?.map(item => ({
    name: item?.name,
    nutrition: (item?.nutrition?.protein + item?.nutrition?.fiber) * 10,
    sustainability: item?.sustainability?.overallScore,
    safety: Object.values(item?.allergens)?.filter(val => !val)?.length * 20,
    taste: Math.floor(Math.random() * 30) + 70, // Mock taste score
    price: Math.floor(Math.random() * 40) + 60, // Mock price score
    availability: Math.floor(Math.random() * 20) + 80 // Mock availability score
  }));

  const itemColors = ['#06FFA5', '#1E40AF', '#7C3AED', '#F59E0B'];

  const comparisonTypes = [
    { id: 'nutrition', label: 'Nutrition', icon: 'BarChart3' },
    { id: 'sustainability', label: 'Sustainability', icon: 'Leaf' },
    { id: 'allergens', label: 'Allergens', icon: 'Shield' },
    { id: 'overall', label: 'Overall', icon: 'Target' }
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload?.length) {
      return (
        <div className="glass rounded-lg p-3 border border-glass-border shadow-glass">
          <p className="text-foreground font-medium mb-2">{label}</p>
          {payload?.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry?.color }}>
              {comparisonItems?.[index]?.name}: {entry?.value}
              {comparisonType === 'nutrition' && ['Calories', 'Protein', 'Carbs', 'Fat', 'Fiber']?.includes(label) ? 
                (label === 'Calories' ? ' kcal' : ' g') : ''}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderNutritionComparison = () => (
    <div className="space-y-6">
      <div className="glass rounded-xl p-6 border border-glass-border">
        <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center">
          <Icon name="BarChart3" size={20} className="text-accent mr-2" />
          Nutritional Comparison
        </h4>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={nutritionComparisonData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey="nutrient" 
                stroke="#94A3B8"
                fontSize={12}
              />
              <YAxis 
                stroke="#94A3B8"
                fontSize={12}
              />
              <Tooltip content={<CustomTooltip />} />
              {comparisonItems?.map((item, index) => (
                <Bar
                  key={item?.id}
                  dataKey={`item${index}`}
                  fill={itemColors?.[index]}
                  name={item?.name}
                  radius={[2, 2, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {comparisonItems?.map((item, index) => (
          <div
            key={item?.id}
            className={`glass rounded-xl p-4 border border-glass-border transition-all duration-300 ${
              animationComplete ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            }`}
            style={{ transitionDelay: `${index * 100}ms` }}
          >
            <div className="text-center mb-4">
              <div className="w-16 h-16 rounded-full mx-auto mb-2 overflow-hidden">
                <Image
                  src={item?.image}
                  alt={item?.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <h5 className="font-semibold text-foreground">{item?.name}</h5>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Calories</span>
                <span className="text-foreground font-medium">{item?.nutrition?.calories}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Protein</span>
                <span className="text-foreground font-medium">{item?.nutrition?.protein}g</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Carbs</span>
                <span className="text-foreground font-medium">{item?.nutrition?.carbohydrates}g</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Fat</span>
                <span className="text-foreground font-medium">{item?.nutrition?.fat}g</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSustainabilityComparison = () => (
    <div className="space-y-6">
      <div className="glass rounded-xl p-6 border border-glass-border">
        <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center">
          <Icon name="Leaf" size={20} className="text-accent mr-2" />
          Sustainability Comparison
        </h4>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sustainabilityComparisonData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey="metric" 
                stroke="#94A3B8"
                fontSize={12}
              />
              <YAxis 
                stroke="#94A3B8"
                fontSize={12}
              />
              <Tooltip content={<CustomTooltip />} />
              {comparisonItems?.map((item, index) => (
                <Bar
                  key={item?.id}
                  dataKey={`item${index}`}
                  fill={itemColors?.[index]}
                  name={item?.name}
                  radius={[2, 2, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {comparisonItems?.map((item, index) => (
          <div
            key={item?.id}
            className={`glass rounded-xl p-4 border border-glass-border transition-all duration-300 ${
              animationComplete ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            }`}
            style={{ transitionDelay: `${index * 100}ms` }}
          >
            <div className="text-center mb-4">
              <div className="w-16 h-16 rounded-full mx-auto mb-2 overflow-hidden">
                <Image
                  src={item?.image}
                  alt={item?.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <h5 className="font-semibold text-foreground">{item?.name}</h5>
            </div>
            <div className="space-y-3">
              <div className="text-center">
                <div 
                  className="text-2xl font-bold mb-1"
                  style={{ color: itemColors?.[index] }}
                >
                  {item?.sustainability?.overallScore}
                </div>
                <div className="text-xs text-muted-foreground">Sustainability Score</div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Carbon</span>
                  <span className="text-foreground font-medium">{item?.sustainability?.carbonFootprint}kg</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Water</span>
                  <span className="text-foreground font-medium">{item?.sustainability?.waterUsage}L</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Land</span>
                  <span className="text-foreground font-medium">{item?.sustainability?.landUse}m²</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAllergenComparison = () => (
    <div className="space-y-6">
      <div className="glass rounded-xl p-6 border border-glass-border">
        <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center">
          <Icon name="Shield" size={20} className="text-accent mr-2" />
          Allergen Safety Comparison
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-glass-border">
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Allergen</th>
                {comparisonItems?.map((item, index) => (
                  <th key={item?.id} className="text-center py-3 px-4">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full mb-2 overflow-hidden">
                        <Image
                          src={item?.image}
                          alt={item?.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-sm font-medium text-foreground">{item?.name}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {['dairy', 'nuts', 'gluten', 'soy']?.map((allergen) => (
                <tr key={allergen} className="border-b border-glass-border/50">
                  <td className="py-3 px-4 font-medium text-foreground capitalize">{allergen}</td>
                  {comparisonItems?.map((item) => (
                    <td key={item?.id} className="py-3 px-4 text-center">
                      {item?.allergens?.[allergen] ? (
                        <div className="flex items-center justify-center">
                          <Icon name="AlertTriangle" size={20} className="text-error" />
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <Icon name="CheckCircle" size={20} className="text-success" />
                        </div>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderOverallComparison = () => (
    <div className="space-y-6">
      <div className="glass rounded-xl p-6 border border-glass-border">
        <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center">
          <Icon name="Target" size={20} className="text-accent mr-2" />
          Overall Performance Radar
        </h4>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData?.[0] ? [radarData?.[0]] : []}>
              <PolarGrid stroke="rgba(255,255,255,0.1)" />
              <PolarAngleAxis 
                dataKey="subject" 
                tick={{ fill: '#94A3B8', fontSize: 12 }}
              />
              <PolarRadiusAxis 
                angle={90} 
                domain={[0, 100]}
                tick={{ fill: '#94A3B8', fontSize: 10 }}
              />
              {radarData?.map((item, index) => (
                <Radar
                  key={item?.name}
                  name={item?.name}
                  dataKey="value"
                  stroke={itemColors?.[index]}
                  fill={itemColors?.[index]}
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
              ))}
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {comparisonItems?.map((item, index) => (
          <div
            key={item?.id}
            className={`glass rounded-xl p-6 border border-glass-border transition-all duration-300 ${
              animationComplete ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            }`}
            style={{ transitionDelay: `${index * 100}ms` }}
          >
            <div className="text-center mb-4">
              <div className="w-16 h-16 rounded-full mx-auto mb-3 overflow-hidden">
                <Image
                  src={item?.image}
                  alt={item?.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <h5 className="font-semibold text-foreground text-lg">{item?.name}</h5>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Overall Score</span>
                <div 
                  className="text-xl font-bold"
                  style={{ color: itemColors?.[index] }}
                >
                  {Math.round((item?.sustainability?.overallScore + 
                    Object.values(item?.allergens)?.filter(val => !val)?.length * 20 + 
                    (item?.nutrition?.protein + item?.nutrition?.fiber) * 10) / 3)}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Nutrition</span>
                  <span className="text-success">Good</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Sustainability</span>
                  <span className="text-success">Excellent</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Safety</span>
                  <span className="text-warning">Moderate</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderComparison = () => {
    switch (comparisonType) {
      case 'nutrition': return renderNutritionComparison();
      case 'sustainability': return renderSustainabilityComparison();
      case 'allergens': return renderAllergenComparison();
      case 'overall': return renderOverallComparison();
      default: return renderNutritionComparison();
    }
  };

  if (comparisonItems?.length === 0) {
    return (
      <div className={`glass rounded-xl p-12 border border-glass-border text-center ${className}`}>
        <Icon name="GitCompare" size={48} className="text-muted-foreground mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-foreground mb-2">No Items to Compare</h3>
        <p className="text-muted-foreground">
          Add items to your comparison list to see detailed side-by-side analysis.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Comparison Type Selector */}
      <div className={`glass rounded-xl p-4 border border-glass-border transition-all duration-500 ${
        animationComplete ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-foreground">
            Compare {comparisonItems?.length} Items
          </h3>
          <div className="flex items-center space-x-2">
            {comparisonItems?.map((item, index) => (
              <div key={item?.id} className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full overflow-hidden">
                  <Image
                    src={item?.image}
                    alt={item?.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  onClick={() => onRemoveItem(item?.id)}
                  className="p-1 rounded-full text-muted-foreground hover:text-error hover:bg-error/10 transition-all duration-200"
                  aria-label={`Remove ${item?.name} from comparison`}
                >
                  <Icon name="X" size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {comparisonTypes?.map((type) => (
            <button
              key={type?.id}
              onClick={() => setComparisonType(type?.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                comparisonType === type?.id
                  ? 'bg-accent/20 text-accent border border-accent/30 shadow-neon'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <Icon name={type?.icon} size={16} />
              <span>{type?.label}</span>
            </button>
          ))}
        </div>
      </div>
      {/* Comparison Content */}
      {renderComparison()}
    </div>
  );
};

export default ComparisonView;