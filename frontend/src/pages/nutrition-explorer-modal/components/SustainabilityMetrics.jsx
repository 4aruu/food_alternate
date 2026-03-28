import React, { useState, useEffect } from 'react';
import { RadialBarChart, RadialBar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import Icon from '../../../components/AppIcon';

const SustainabilityMetrics = ({ foodItem, className = '' }) => {
  const [animationComplete, setAnimationComplete] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState('overall');

  useEffect(() => {
    const timer = setTimeout(() => setAnimationComplete(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const sustainabilityScore = foodItem?.sustainability?.overallScore || 78;
  const carbonFootprint = foodItem?.sustainability?.carbonFootprint || 2.4;
  const waterUsage = foodItem?.sustainability?.waterUsage || 145;
  const landUse = foodItem?.sustainability?.landUse || 0.8;

  const overallData = [
    {
      name: 'Sustainability Score',
      value: sustainabilityScore,
      fill: sustainabilityScore >= 80 ? '#10B981' : sustainabilityScore >= 60 ? '#F59E0B' : '#EF4444'
    }
  ];

  const metricsData = [
    {
      name: 'Carbon Footprint',
      value: Math.max(0, 100 - (carbonFootprint * 10)),
      actual: carbonFootprint,
      unit: 'kg CO₂e',
      icon: 'Cloud',
      color: '#06FFA5',
      description: 'Lower carbon emissions are better for the environment'
    },
    {
      name: 'Water Usage',
      value: Math.max(0, 100 - (waterUsage / 5)),
      actual: waterUsage,
      unit: 'L/kg',
      icon: 'Droplets',
      color: '#1E40AF',
      description: 'Efficient water usage reduces environmental impact'
    },
    {
      name: 'Land Use',
      value: Math.max(0, 100 - (landUse * 50)),
      actual: landUse,
      unit: 'm²/kg',
      icon: 'TreePine',
      color: '#10B981',
      description: 'Minimal land use preserves natural habitats'
    },
    {
      name: 'Packaging',
      value: 85,
      actual: 'Recyclable',
      unit: '',
      icon: 'Package',
      color: '#7C3AED',
      description: 'Eco-friendly packaging reduces waste'
    }
  ];

  const comparisonData = [
    { category: 'Conventional', carbon: 4.2, water: 280, land: 1.5 },
    { category: 'This Product', carbon: carbonFootprint, water: waterUsage, land: landUse },
    { category: 'Best Alternative', carbon: 1.8, water: 95, land: 0.4 }
  ];

  const certifications = [
    { name: 'Organic', icon: 'Leaf', verified: true, color: '#10B981' },
    { name: 'Fair Trade', icon: 'Handshake', verified: false, color: '#F59E0B' },
    { name: 'Rainforest Alliance', icon: 'TreePine', verified: true, color: '#10B981' },
    { name: 'Non-GMO', icon: 'Shield', verified: true, color: '#10B981' },
    { name: 'Carbon Neutral', icon: 'Zap', verified: false, color: '#94A3B8' },
    { name: 'Sustainable Packaging', icon: 'Package', verified: true, color: '#10B981' }
  ];

  const getScoreColor = (score) => {
    if (score >= 80) return '#10B981';
    if (score >= 60) return '#F59E0B';
    return '#EF4444';
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    return 'Needs Improvement';
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload?.length) {
      return (
        <div className="glass rounded-lg p-3 border border-glass-border shadow-glass">
          <p className="text-foreground font-medium">{label}</p>
          {payload?.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry?.color }}>
              {entry?.dataKey}: {entry?.value} {entry?.payload?.unit || ''}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overall Sustainability Score */}
      <div className={`glass rounded-xl p-6 border border-glass-border transition-all duration-500 ${
        animationComplete ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-foreground flex items-center">
            <Icon name="Leaf" size={24} className="text-accent mr-3" />
            Sustainability Score
          </h3>
          <div className="flex items-center space-x-2">
            <div 
              className="px-3 py-1 rounded-full text-sm font-medium"
              style={{ 
                backgroundColor: `${getScoreColor(sustainabilityScore)}20`,
                color: getScoreColor(sustainabilityScore),
                border: `1px solid ${getScoreColor(sustainabilityScore)}30`
              }}
            >
              {getScoreLabel(sustainabilityScore)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="flex items-center justify-center">
            <div className="relative w-48 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  cx="50%"
                  cy="50%"
                  innerRadius="60%"
                  outerRadius="90%"
                  data={overallData}
                  startAngle={90}
                  endAngle={-270}
                >
                  <RadialBar
                    dataKey="value"
                    cornerRadius={10}
                    fill={getScoreColor(sustainabilityScore)}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div 
                    className="text-4xl font-bold mb-1"
                    style={{ color: getScoreColor(sustainabilityScore) }}
                  >
                    {sustainabilityScore}
                  </div>
                  <div className="text-sm text-muted-foreground">out of 100</div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-foreground">Key Highlights</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 glass-subtle rounded-lg">
                <Icon name="TrendingUp" size={20} className="text-success" />
                <div>
                  <div className="font-medium text-foreground">Low Carbon Impact</div>
                  <div className="text-sm text-muted-foreground">
                    {carbonFootprint}kg CO₂e per kg - 40% below average
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 glass-subtle rounded-lg">
                <Icon name="Droplets" size={20} className="text-primary" />
                <div>
                  <div className="font-medium text-foreground">Water Efficient</div>
                  <div className="text-sm text-muted-foreground">
                    {waterUsage}L per kg - Sustainable water usage
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 glass-subtle rounded-lg">
                <Icon name="TreePine" size={20} className="text-success" />
                <div>
                  <div className="font-medium text-foreground">Land Conscious</div>
                  <div className="text-sm text-muted-foreground">
                    {landUse}m² per kg - Minimal land footprint
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Detailed Metrics */}
      <div className={`glass rounded-xl p-6 border border-glass-border transition-all duration-500 ${
        animationComplete ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`} style={{ transitionDelay: '200ms' }}>
        <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center">
          <Icon name="BarChart3" size={20} className="text-accent mr-2" />
          Environmental Impact Metrics
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {metricsData?.map((metric, index) => (
            <div
              key={metric?.name}
              className={`glass-subtle rounded-lg p-4 transition-all duration-300 hover:shadow-neon cursor-pointer ${
                animationComplete ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
              onClick={() => setSelectedMetric(metric?.name?.toLowerCase())}
            >
              <div className="flex items-center justify-between mb-3">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${metric?.color}20` }}
                >
                  <Icon 
                    name={metric?.icon} 
                    size={20} 
                    style={{ color: metric?.color }}
                  />
                </div>
                <div className="text-right">
                  <div 
                    className="text-lg font-bold"
                    style={{ color: metric?.color }}
                  >
                    {metric?.value}
                  </div>
                  <div className="text-xs text-muted-foreground">Score</div>
                </div>
              </div>
              <div className="mb-2">
                <div className="font-medium text-foreground text-sm">{metric?.name}</div>
                <div className="text-xs text-muted-foreground">
                  {metric?.actual} {metric?.unit}
                </div>
              </div>
              <div className="w-full bg-muted/30 rounded-full h-1.5">
                <div
                  className="h-1.5 rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: animationComplete ? `${metric?.value}%` : '0%',
                    backgroundColor: metric?.color
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Comparison Chart */}
      <div className={`glass rounded-xl p-6 border border-glass-border transition-all duration-500 ${
        animationComplete ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`} style={{ transitionDelay: '400ms' }}>
        <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center">
          <Icon name="GitCompare" size={20} className="text-accent mr-2" />
          Environmental Impact Comparison
        </h4>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey="category" 
                stroke="#94A3B8"
                fontSize={12}
              />
              <YAxis 
                stroke="#94A3B8"
                fontSize={12}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="carbon" fill="#EF4444" name="Carbon (kg CO₂e)" radius={[2, 2, 0, 0]} />
              <Bar dataKey="water" fill="#1E40AF" name="Water (L/10)" radius={[2, 2, 0, 0]} />
              <Bar dataKey="land" fill="#10B981" name="Land (m²)" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      {/* Certifications */}
      <div className={`glass rounded-xl p-6 border border-glass-border transition-all duration-500 ${
        animationComplete ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`} style={{ transitionDelay: '600ms' }}>
        <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center">
          <Icon name="Award" size={20} className="text-accent mr-2" />
          Sustainability Certifications
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {certifications?.map((cert, index) => (
            <div
              key={cert?.name}
              className={`glass-subtle rounded-lg p-4 text-center transition-all duration-300 ${
                cert?.verified ? 'hover:shadow-neon' : 'opacity-60'
              } ${
                animationComplete ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                style={{ 
                  backgroundColor: cert?.verified ? `${cert?.color}20` : '#94A3B820',
                  border: `2px solid ${cert?.verified ? cert?.color : '#94A3B8'}30`
                }}
              >
                <Icon 
                  name={cert?.icon} 
                  size={20} 
                  style={{ color: cert?.verified ? cert?.color : '#94A3B8' }}
                />
              </div>
              <div className="text-xs font-medium text-foreground mb-1">
                {cert?.name}
              </div>
              <div className="flex items-center justify-center">
                {cert?.verified ? (
                  <div className="flex items-center space-x-1">
                    <Icon name="CheckCircle" size={12} className="text-success" />
                    <span className="text-xs text-success">Verified</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1">
                    <Icon name="X" size={12} className="text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Not Certified</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Sourcing Information */}
      <div className={`glass rounded-xl p-6 border border-glass-border transition-all duration-500 ${
        animationComplete ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`} style={{ transitionDelay: '800ms' }}>
        <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center">
          <Icon name="MapPin" size={20} className="text-accent mr-2" />
          Sourcing & Supply Chain
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Icon name="Globe" size={20} className="text-primary mt-1" />
              <div>
                <div className="font-medium text-foreground">Origin</div>
                <div className="text-sm text-muted-foreground">
                  {foodItem?.sourcing?.origin || 'Local farms within 200km radius'}
                </div>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Icon name="Truck" size={20} className="text-secondary mt-1" />
              <div>
                <div className="font-medium text-foreground">Transportation</div>
                <div className="text-sm text-muted-foreground">
                  {foodItem?.sourcing?.transportation || 'Low-emission transport methods'}
                </div>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Icon name="Users" size={20} className="text-accent mt-1" />
              <div>
                <div className="font-medium text-foreground">Farmers</div>
                <div className="text-sm text-muted-foreground">
                  {foodItem?.sourcing?.farmers || 'Supporting 15+ local farming families'}
                </div>
              </div>
            </div>
          </div>
          <div className="glass-subtle rounded-lg p-4">
            <h5 className="font-semibold text-foreground mb-3">Supply Chain Transparency</h5>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Traceability</span>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-muted/30 rounded-full h-1.5">
                    <div className="w-14 bg-success h-1.5 rounded-full"></div>
                  </div>
                  <span className="text-xs text-success">95%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Fair Wages</span>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-muted/30 rounded-full h-1.5">
                    <div className="w-12 bg-warning h-1.5 rounded-full"></div>
                  </div>
                  <span className="text-xs text-warning">78%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Ethical Practices</span>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-muted/30 rounded-full h-1.5">
                    <div className="w-15 bg-success h-1.5 rounded-full"></div>
                  </div>
                  <span className="text-xs text-success">92%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SustainabilityMetrics;