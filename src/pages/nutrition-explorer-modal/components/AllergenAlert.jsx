import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';

const AllergenAlert = ({ foodItem, className = '' }) => {
  const [expandedAllergen, setExpandedAllergen] = useState(null);
  const [animationComplete, setAnimationComplete] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimationComplete(true), 300);
    return () => clearTimeout(timer);
  }, []);

  const allergenData = [
    {
      id: 'gluten',
      name: 'Gluten',
      present: foodItem?.allergens?.gluten || false,
      severity: 'high',
      icon: 'Wheat',
      description: 'Contains wheat, barley, or rye proteins that may cause reactions in people with celiac disease or gluten sensitivity.',
      alternatives: ['Rice flour', 'Almond flour', 'Coconut flour'],
      color: '#EF4444'
    },
    {
      id: 'dairy',
      name: 'Dairy',
      present: foodItem?.allergens?.dairy || true,
      severity: 'medium',
      icon: 'Milk',
      description: 'Contains milk proteins (casein, whey) that may cause reactions in lactose intolerant individuals.',
      alternatives: ['Oat milk', 'Almond milk', 'Coconut milk'],
      color: '#F59E0B'
    },
    {
      id: 'nuts',
      name: 'Tree Nuts',
      present: foodItem?.allergens?.nuts || false,
      severity: 'high',
      icon: 'Nut',
      description: 'Contains tree nuts which can cause severe allergic reactions in sensitive individuals.',
      alternatives: ['Sunflower seeds', 'Pumpkin seeds', 'Soy nuts'],
      color: '#EF4444'
    },
    {
      id: 'soy',
      name: 'Soy',
      present: foodItem?.allergens?.soy || false,
      severity: 'low',
      icon: 'Bean',
      description: 'Contains soy proteins that may cause mild to moderate allergic reactions.',
      alternatives: ['Coconut aminos', 'Tahini', 'Sunflower butter'],
      color: '#10B981'
    },
    {
      id: 'eggs',
      name: 'Eggs',
      present: foodItem?.allergens?.eggs || false,
      severity: 'medium',
      icon: 'Egg',
      description: 'Contains egg proteins that may cause reactions, especially in children.',
      alternatives: ['Flax eggs', 'Chia eggs', 'Applesauce'],
      color: '#F59E0B'
    },
    {
      id: 'shellfish',
      name: 'Shellfish',
      present: foodItem?.allergens?.shellfish || false,
      severity: 'high',
      icon: 'Fish',
      description: 'Contains shellfish proteins that can cause severe allergic reactions.',
      alternatives: ['Seaweed', 'Mushrooms', 'Plant-based seafood'],
      color: '#EF4444'
    }
  ];

  const presentAllergens = allergenData?.filter(allergen => allergen?.present);
  const absentAllergens = allergenData?.filter(allergen => !allergen?.present);

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#94A3B8';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'high': return 'AlertTriangle';
      case 'medium': return 'AlertCircle';
      case 'low': return 'Info';
      default: return 'Info';
    }
  };

  const handleAllergenClick = (allergenId) => {
    setExpandedAllergen(expandedAllergen === allergenId ? null : allergenId);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Alert Summary */}
      <div className={`glass rounded-xl p-6 border border-glass-border transition-all duration-500 ${
        animationComplete ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-foreground flex items-center">
            <Icon name="Shield" size={24} className="text-accent mr-3" />
            Allergen Information
          </h3>
          <div className="flex items-center space-x-2">
            {presentAllergens?.length > 0 ? (
              <div className="flex items-center space-x-2 px-3 py-1 bg-error/20 rounded-full border border-error/30">
                <Icon name="AlertTriangle" size={16} className="text-error" />
                <span className="text-sm font-medium text-error">
                  {presentAllergens?.length} Alert{presentAllergens?.length !== 1 ? 's' : ''}
                </span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 px-3 py-1 bg-success/20 rounded-full border border-success/30">
                <Icon name="CheckCircle" size={16} className="text-success" />
                <span className="text-sm font-medium text-success">
                  No Known Allergens
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="glass-subtle rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-error mb-1">
              {presentAllergens?.length}
            </div>
            <div className="text-sm text-muted-foreground">Present</div>
          </div>
          <div className="glass-subtle rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-success mb-1">
              {absentAllergens?.length}
            </div>
            <div className="text-sm text-muted-foreground">Safe</div>
          </div>
          <div className="glass-subtle rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-accent mb-1">
              {presentAllergens?.filter(a => a?.severity === 'high')?.length}
            </div>
            <div className="text-sm text-muted-foreground">High Risk</div>
          </div>
        </div>
      </div>
      {/* Present Allergens */}
      {presentAllergens?.length > 0 && (
        <div className={`glass rounded-xl p-6 border border-glass-border transition-all duration-500 ${
          animationComplete ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`} style={{ transitionDelay: '200ms' }}>
          <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center">
            <Icon name="AlertTriangle" size={20} className="text-error mr-2" />
            Allergen Warnings
          </h4>
          <div className="space-y-3">
            {presentAllergens?.map((allergen, index) => (
              <div
                key={allergen?.id}
                className={`glass-subtle rounded-lg border-l-4 transition-all duration-300 hover:shadow-neon cursor-pointer ${
                  animationComplete ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
                }`}
                style={{ 
                  borderLeftColor: getSeverityColor(allergen?.severity),
                  transitionDelay: `${index * 100}ms`
                }}
                onClick={() => handleAllergenClick(allergen?.id)}
              >
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: `${getSeverityColor(allergen?.severity)}20` }}
                      >
                        <Icon 
                          name={allergen?.icon} 
                          size={20} 
                          style={{ color: getSeverityColor(allergen?.severity) }}
                        />
                      </div>
                      <div>
                        <h5 className="font-semibold text-foreground">{allergen?.name}</h5>
                        <div className="flex items-center space-x-2">
                          <Icon 
                            name={getSeverityIcon(allergen?.severity)} 
                            size={14} 
                            style={{ color: getSeverityColor(allergen?.severity) }}
                          />
                          <span 
                            className="text-sm font-medium capitalize"
                            style={{ color: getSeverityColor(allergen?.severity) }}
                          >
                            {allergen?.severity} Risk
                          </span>
                        </div>
                      </div>
                    </div>
                    <Icon 
                      name={expandedAllergen === allergen?.id ? "ChevronUp" : "ChevronDown"} 
                      size={20} 
                      className="text-muted-foreground transition-transform duration-200"
                    />
                  </div>

                  {expandedAllergen === allergen?.id && (
                    <div className="mt-4 pt-4 border-t border-glass-border animate-slide-down">
                      <p className="text-sm text-muted-foreground mb-4">
                        {allergen?.description}
                      </p>
                      <div>
                        <h6 className="text-sm font-semibold text-foreground mb-2">
                          Suggested Alternatives:
                        </h6>
                        <div className="flex flex-wrap gap-2">
                          {allergen?.alternatives?.map((alternative, altIndex) => (
                            <span
                              key={altIndex}
                              className="px-3 py-1 bg-accent/20 text-accent text-xs rounded-full border border-accent/30"
                            >
                              {alternative}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Safe Allergens */}
      <div className={`glass rounded-xl p-6 border border-glass-border transition-all duration-500 ${
        animationComplete ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`} style={{ transitionDelay: '400ms' }}>
        <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center">
          <Icon name="CheckCircle" size={20} className="text-success mr-2" />
          Safe Allergens
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {absentAllergens?.map((allergen, index) => (
            <div
              key={allergen?.id}
              className={`glass-subtle rounded-lg p-3 text-center transition-all duration-300 hover:bg-success/10 ${
                animationComplete ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
              }`}
              style={{ transitionDelay: `${index * 50}ms` }}
            >
              <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-2">
                <Icon name={allergen?.icon} size={16} className="text-success" />
              </div>
              <div className="text-xs font-medium text-foreground">{allergen?.name}</div>
              <div className="text-xs text-success mt-1">✓ Safe</div>
            </div>
          ))}
        </div>
      </div>
      {/* Additional Information */}
      <div className={`glass rounded-xl p-6 border border-glass-border transition-all duration-500 ${
        animationComplete ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`} style={{ transitionDelay: '600ms' }}>
        <div className="flex items-start space-x-3">
          <Icon name="Info" size={20} className="text-accent mt-1" />
          <div>
            <h5 className="font-semibold text-foreground mb-2">Important Notice</h5>
            <p className="text-sm text-muted-foreground leading-relaxed">
              This allergen information is based on typical ingredient analysis and may not account for cross-contamination during manufacturing. 
              Always consult product labels and manufacturers for the most accurate allergen information, especially if you have severe allergies.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AllergenAlert;