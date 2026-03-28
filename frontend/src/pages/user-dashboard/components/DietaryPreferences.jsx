import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { Checkbox } from '../../../components/ui/Checkbox';

const DietaryPreferences = ({ 
  preferences = {}, 
  onUpdate,
  className = "" 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localPreferences, setLocalPreferences] = useState(preferences);

  const dietaryOptions = [
    { id: 'vegan', label: 'Vegan', icon: 'Leaf', description: 'No animal products' },
    { id: 'vegetarian', label: 'Vegetarian', icon: 'Sprout', description: 'No meat or fish' },
    { id: 'glutenFree', label: 'Gluten-Free', icon: 'Shield', description: 'No gluten-containing grains' },
    { id: 'dairyFree', label: 'Dairy-Free', icon: 'Milk', description: 'No dairy products' },
    { id: 'keto', label: 'Keto', icon: 'Zap', description: 'Low-carb, high-fat' },
    { id: 'paleo', label: 'Paleo', icon: 'Mountain', description: 'Whole foods only' },
    { id: 'lowSodium', label: 'Low Sodium', icon: 'Droplets', description: 'Reduced salt intake' },
    { id: 'organic', label: 'Organic Only', icon: 'TreePine', description: 'Certified organic foods' }
  ];

  const allergenOptions = [
    { id: 'nuts', label: 'Tree Nuts', severity: 'high' },
    { id: 'peanuts', label: 'Peanuts', severity: 'high' },
    { id: 'shellfish', label: 'Shellfish', severity: 'high' },
    { id: 'fish', label: 'Fish', severity: 'medium' },
    { id: 'eggs', label: 'Eggs', severity: 'medium' },
    { id: 'soy', label: 'Soy', severity: 'low' },
    { id: 'sesame', label: 'Sesame', severity: 'medium' }
  ];

  const sustainabilityOptions = [
    { id: 'localSourcing', label: 'Local Sourcing', icon: 'MapPin' },
    { id: 'lowCarbon', label: 'Low Carbon Footprint', icon: 'Leaf' },
    { id: 'sustainablePackaging', label: 'Sustainable Packaging', icon: 'Package' },
    { id: 'fairTrade', label: 'Fair Trade', icon: 'Heart' }
  ];

  const handleSave = () => {
    onUpdate(localPreferences);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setLocalPreferences(preferences);
    setIsEditing(false);
  };

  const updatePreference = (category, key, value) => {
    setLocalPreferences(prev => ({
      ...prev,
      [category]: {
        ...prev?.[category],
        [key]: value
      }
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`glass rounded-xl p-6 ${className}`}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-secondary to-primary flex items-center justify-center">
            <Icon name="Settings" size={20} className="text-primary-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Dietary Preferences</h3>
            <p className="text-sm text-muted-foreground">Customize your food recommendations</p>
          </div>
        </div>
        
        {!isEditing ? (
          <Button
            variant="outline"
            size="sm"
            iconName="Edit"
            iconPosition="left"
            onClick={() => setIsEditing(true)}
          >
            Edit
          </Button>
        ) : (
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              size="sm"
              iconName="Check"
              iconPosition="left"
              onClick={handleSave}
            >
              Save
            </Button>
          </div>
        )}
      </div>
      <div className="space-y-6">
        {/* Dietary Restrictions */}
        <div>
          <h4 className="font-medium text-foreground mb-3">Dietary Restrictions</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {dietaryOptions?.map((option) => (
              <div key={option?.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/30 transition-colors duration-200">
                <Checkbox
                  checked={localPreferences?.dietary?.[option?.id] || false}
                  onChange={(e) => updatePreference('dietary', option?.id, e?.target?.checked)}
                  disabled={!isEditing}
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <Icon name={option?.icon} size={16} className="text-accent" />
                    <span className="font-medium text-foreground">{option?.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{option?.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Allergen Alerts */}
        <div>
          <h4 className="font-medium text-foreground mb-3">Allergen Alerts</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {allergenOptions?.map((allergen) => (
              <div key={allergen?.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/30 transition-colors duration-200">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    checked={localPreferences?.allergens?.[allergen?.id] || false}
                    onChange={(e) => updatePreference('allergens', allergen?.id, e?.target?.checked)}
                    disabled={!isEditing}
                  />
                  <span className="font-medium text-foreground">{allergen?.label}</span>
                </div>
                <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                  allergen?.severity === 'high' ? 'bg-error/20 text-error' :
                  allergen?.severity === 'medium'? 'bg-warning/20 text-warning' : 'bg-success/20 text-success'
                }`}>
                  {allergen?.severity}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Sustainability Priorities */}
        <div>
          <h4 className="font-medium text-foreground mb-3">Sustainability Priorities</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {sustainabilityOptions?.map((option) => (
              <div key={option?.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/30 transition-colors duration-200">
                <Checkbox
                  checked={localPreferences?.sustainability?.[option?.id] || false}
                  onChange={(e) => updatePreference('sustainability', option?.id, e?.target?.checked)}
                  disabled={!isEditing}
                />
                <div className="flex items-center space-x-2">
                  <Icon name={option?.icon} size={16} className="text-success" />
                  <span className="font-medium text-foreground">{option?.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default DietaryPreferences;