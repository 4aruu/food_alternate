import React, { useState } from 'react';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';

const DietaryPreferencesForm = ({ formData = {}, onUpdate = () => {}, onNext = () => {}, onBack = () => {} }) => {
  const [selectedPreferences, setSelectedPreferences] = useState(formData?.dietaryPreferences || []);

  const dietaryOptions = [
    {
      id: 'vegan',
      label: 'Vegan',
      description: 'No animal products whatsoever',
      icon: 'Leaf',
      color: 'text-green-400'
    },
    {
      id: 'vegetarian',
      label: 'Vegetarian',
      description: 'No meat, but dairy and eggs are okay',
      icon: 'Sprout',
      color: 'text-green-500'
    },
    {
      id: 'gluten-free',
      label: 'Gluten-Free',
      description: 'No wheat, barley, rye, or gluten-containing grains',
      icon: 'Wheat',
      color: 'text-amber-400'
    },
    {
      id: 'keto',
      label: 'Ketogenic',
      description: 'High-fat, low-carb diet for ketosis',
      icon: 'Zap',
      color: 'text-purple-400'
    },
    {
      id: 'paleo',
      label: 'Paleo',
      description: 'Foods available to Paleolithic humans',
      icon: 'Mountain',
      color: 'text-orange-400'
    },
    {
      id: 'dairy-free',
      label: 'Dairy-Free',
      description: 'No milk, cheese, or dairy products',
      icon: 'Milk',
      color: 'text-blue-400'
    },
    {
      id: 'low-sodium',
      label: 'Low Sodium',
      description: 'Reduced salt intake for heart health',
      icon: 'Heart',
      color: 'text-red-400'
    },
    {
      id: 'mediterranean',
      label: 'Mediterranean',
      description: 'Rich in fruits, vegetables, and healthy fats',
      icon: 'Sun',
      color: 'text-yellow-400'
    },
    {
      id: 'whole30',
      label: 'Whole30',
      description: '30-day elimination diet program',
      icon: 'Calendar',
      color: 'text-indigo-400'
    },
    {
      id: 'raw-food',
      label: 'Raw Food',
      description: 'Uncooked and unprocessed foods only',
      icon: 'Apple',
      color: 'text-pink-400'
    }
  ];

  const handlePreferenceToggle = (preferenceId) => {
    const updatedPreferences = selectedPreferences?.includes(preferenceId)
      ? selectedPreferences?.filter(id => id !== preferenceId)
      : [...selectedPreferences, preferenceId];
    
    setSelectedPreferences(updatedPreferences);
    onUpdate({ dietaryPreferences: updatedPreferences });
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    onNext();
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">Dietary Preferences</h2>
        <p className="text-muted-foreground">
          Select your dietary restrictions and preferences to get personalized recommendations
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dietaryOptions?.map((option) => {
            const isSelected = selectedPreferences?.includes(option?.id);
            
            return (
              <button
                key={option?.id}
                type="button"
                onClick={() => handlePreferenceToggle(option?.id)}
                className={`p-4 rounded-xl border-2 transition-all duration-300 text-left group ${
                  isSelected
                    ? 'border-accent bg-accent/10 shadow-neon'
                    : 'border-glass-border glass hover:border-accent/50 hover:bg-accent/5'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg ${isSelected ? 'bg-accent/20' : 'bg-muted/20'} transition-colors duration-200`}>
                    <Icon 
                      name={option?.icon} 
                      size={20} 
                      className={`${isSelected ? 'text-accent' : option?.color} transition-colors duration-200`}
                    />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className={`font-semibold transition-colors duration-200 ${
                        isSelected ? 'text-accent' : 'text-foreground'
                      }`}>
                        {option?.label}
                      </h3>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                          <Icon name="Check" size={12} className="text-accent-foreground" />
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {option?.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {selectedPreferences?.length > 0 && (
          <div className="glass rounded-xl p-4 border border-glass-border">
            <div className="flex items-center space-x-2 mb-3">
              <Icon name="Info" size={18} className="text-accent" />
              <h4 className="font-semibold text-foreground">Selected Preferences</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedPreferences?.map((prefId) => {
                const preference = dietaryOptions?.find(opt => opt?.id === prefId);
                return (
                  <span
                    key={prefId}
                    className="inline-flex items-center space-x-1 px-3 py-1 bg-accent/20 text-accent rounded-full text-sm font-medium"
                  >
                    <Icon name={preference?.icon} size={14} />
                    <span>{preference?.label}</span>
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
            iconName="ArrowRight"
            iconPosition="right"
            className="min-w-32"
          >
            Continue
          </Button>
        </div>
      </form>
      <div className="text-center">
        <p className="text-xs text-muted-foreground">
          Don't worry, you can always update these preferences later in your profile settings
        </p>
      </div>
    </div>
  );
};

export default DietaryPreferencesForm;