import React, { useState } from 'react';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';

const SustainabilitySettingsForm = ({ formData = {}, onUpdate = () => {}, onComplete = () => {}, onBack = () => {} }) => {
  const [sustainabilityImportance, setSustainabilityImportance] = useState(
    formData?.sustainabilityImportance || 3
  );
  const [selectedPriorities, setSelectedPriorities] = useState(
    formData?.sustainabilityPriorities || []
  );

  const sustainabilityPriorities = [
    {
      id: 'carbon-footprint',
      label: 'Low Carbon Footprint',
      description: 'Prioritize foods with minimal greenhouse gas emissions',
      icon: 'Leaf',
      color: 'text-green-400'
    },
    {
      id: 'local-sourcing',
      label: 'Local Sourcing',
      description: 'Prefer locally grown and produced foods',
      icon: 'MapPin',
      color: 'text-blue-400'
    },
    {
      id: 'organic',
      label: 'Organic Products',
      description: 'Choose certified organic alternatives when available',
      icon: 'Sprout',
      color: 'text-green-500'
    },
    {
      id: 'minimal-packaging',
      label: 'Minimal Packaging',
      description: 'Reduce waste with less packaged alternatives',
      icon: 'Package',
      color: 'text-amber-400'
    },
    {
      id: 'water-conservation',
      label: 'Water Conservation',
      description: 'Support foods that require less water to produce',
      icon: 'Droplets',
      color: 'text-cyan-400'
    },
    {
      id: 'fair-trade',
      label: 'Fair Trade',
      description: 'Support ethical labor practices and fair wages',
      icon: 'Handshake',
      color: 'text-purple-400'
    },
    {
      id: 'biodiversity',
      label: 'Biodiversity Support',
      description: 'Choose foods that support ecosystem diversity',
      icon: 'Trees',
      color: 'text-emerald-400'
    },
    {
      id: 'renewable-energy',
      label: 'Renewable Energy',
      description: 'Prefer producers using clean energy sources',
      icon: 'Zap',
      color: 'text-yellow-400'
    }
  ];

  const importanceLabels = [
    'Not Important',
    'Slightly Important',
    'Moderately Important',
    'Very Important',
    'Extremely Important'
  ];

  const handlePriorityToggle = (priorityId) => {
    const updatedPriorities = selectedPriorities?.includes(priorityId)
      ? selectedPriorities?.filter(id => id !== priorityId)
      : [...selectedPriorities, priorityId];
    
    setSelectedPriorities(updatedPriorities);
    onUpdate({ 
      sustainabilityImportance,
      sustainabilityPriorities: updatedPriorities 
    });
  };

  const handleImportanceChange = (value) => {
    setSustainabilityImportance(value);
    onUpdate({ 
      sustainabilityImportance: value,
      sustainabilityPriorities: selectedPriorities 
    });
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    onComplete();
  };

  const getImportanceColor = (level) => {
    if (level <= 1) return 'text-error';
    if (level <= 2) return 'text-warning';
    if (level <= 3) return 'text-accent';
    if (level <= 4) return 'text-success';
    return 'text-primary';
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">Sustainability Preferences</h2>
        <p className="text-muted-foreground">
          Help us recommend eco-friendly alternatives that align with your environmental values
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Sustainability Importance Slider */}
        <div className="glass rounded-xl p-6 border border-glass-border">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center space-x-2">
              <Icon name="Globe" size={20} className="text-accent" />
              <span>How important is sustainability to you?</span>
            </h3>
            <p className="text-muted-foreground text-sm">
              This helps us prioritize eco-friendly alternatives in your recommendations
            </p>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <input
                type="range"
                min="0"
                max="4"
                value={sustainabilityImportance}
                onChange={(e) => handleImportanceChange(parseInt(e?.target?.value))}
                className="w-full h-2 bg-muted/30 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, var(--color-accent) 0%, var(--color-accent) ${(sustainabilityImportance / 4) * 100}%, var(--color-muted) ${(sustainabilityImportance / 4) * 100}%, var(--color-muted) 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                {importanceLabels?.map((label, index) => (
                  <span 
                    key={index}
                    className={`transition-colors duration-200 ${
                      index === sustainabilityImportance ? getImportanceColor(sustainabilityImportance) + ' font-semibold' : ''
                    }`}
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>

            <div className="text-center">
              <span className={`text-lg font-semibold ${getImportanceColor(sustainabilityImportance)}`}>
                {importanceLabels?.[sustainabilityImportance]}
              </span>
            </div>
          </div>
        </div>

        {/* Sustainability Priorities */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center space-x-2">
            <Icon name="Target" size={20} className="text-accent" />
            <span>Select your sustainability priorities</span>
          </h3>
          <p className="text-muted-foreground text-sm">
            Choose the environmental factors that matter most to you (select multiple)
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sustainabilityPriorities?.map((priority) => {
              const isSelected = selectedPriorities?.includes(priority?.id);
              
              return (
                <button
                  key={priority?.id}
                  type="button"
                  onClick={() => handlePriorityToggle(priority?.id)}
                  className={`p-4 rounded-xl border-2 transition-all duration-300 text-left group ${
                    isSelected
                      ? 'border-accent bg-accent/10 shadow-neon'
                      : 'border-glass-border glass hover:border-accent/50 hover:bg-accent/5'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-accent/20' : 'bg-muted/20'} transition-colors duration-200`}>
                      <Icon 
                        name={priority?.icon} 
                        size={20} 
                        className={`${isSelected ? 'text-accent' : priority?.color} transition-colors duration-200`}
                      />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className={`font-semibold transition-colors duration-200 ${
                          isSelected ? 'text-accent' : 'text-foreground'
                        }`}>
                          {priority?.label}
                        </h4>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                            <Icon name="Check" size={12} className="text-accent-foreground" />
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {priority?.description}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {selectedPriorities?.length > 0 && (
          <div className="glass rounded-xl p-4 border border-glass-border">
            <div className="flex items-center space-x-2 mb-3">
              <Icon name="Eco" size={18} className="text-success" />
              <h4 className="font-semibold text-foreground">Your Sustainability Focus</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedPriorities?.map((priorityId) => {
                const priority = sustainabilityPriorities?.find(p => p?.id === priorityId);
                return (
                  <span
                    key={priorityId}
                    className="inline-flex items-center space-x-1 px-3 py-1 bg-success/20 text-success rounded-full text-sm font-medium"
                  >
                    <Icon name={priority?.icon} size={14} />
                    <span>{priority?.label}</span>
                  </span>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-6">
          <Button
            type="button"
            variant="ghost"
            onClick={onBack}
            iconName="ArrowLeft"
            iconPosition="left"
          >
            Previous Step
          </Button>

          <Button
            type="submit"
            variant="default"
            iconName="Check"
            iconPosition="right"
            className="min-w-32 bg-gradient-to-r from-accent to-primary hover:from-accent/90 hover:to-primary/90"
          >
            Complete Registration
          </Button>
        </div>
      </form>
      <div className="text-center">
        <p className="text-xs text-muted-foreground">
          Your sustainability preferences help us recommend alternatives that match your environmental values
        </p>
      </div>
    </div>
  );
};

export default SustainabilitySettingsForm;