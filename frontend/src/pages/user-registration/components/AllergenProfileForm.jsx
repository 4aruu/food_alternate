import React, { useState } from 'react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { Checkbox } from '../../../components/ui/Checkbox';
import Icon from '../../../components/AppIcon';

const AllergenProfileForm = ({ formData = {}, onUpdate = () => {}, onNext = () => {}, onBack = () => {} }) => {
  const [selectedAllergens, setSelectedAllergens] = useState(formData?.allergens || []);
  const [searchQuery, setSearchQuery] = useState('');

  const commonAllergens = [
    {
      id: 'peanuts',
      name: 'Peanuts',
      category: 'Nuts',
      severity: 'high',
      icon: 'Nut',
      description: 'Tree nuts and peanut products'
    },
    {
      id: 'tree-nuts',
      name: 'Tree Nuts',
      category: 'Nuts',
      severity: 'high',
      icon: 'Nut',
      description: 'Almonds, walnuts, cashews, etc.'
    },
    {
      id: 'milk',
      name: 'Milk/Dairy',
      category: 'Dairy',
      severity: 'medium',
      icon: 'Milk',
      description: 'Lactose and dairy proteins'
    },
    {
      id: 'eggs',
      name: 'Eggs',
      category: 'Protein',
      severity: 'medium',
      icon: 'Egg',
      description: 'Chicken eggs and egg products'
    },
    {
      id: 'wheat',
      name: 'Wheat/Gluten',
      category: 'Grains',
      severity: 'medium',
      icon: 'Wheat',
      description: 'Wheat, barley, rye gluten'
    },
    {
      id: 'soy',
      name: 'Soy',
      category: 'Legumes',
      severity: 'medium',
      icon: 'Bean',
      description: 'Soybeans and soy products'
    },
    {
      id: 'fish',
      name: 'Fish',
      category: 'Seafood',
      severity: 'high',
      icon: 'Fish',
      description: 'All fish species'
    },
    {
      id: 'shellfish',
      name: 'Shellfish',
      category: 'Seafood',
      severity: 'high',
      icon: 'Shell',
      description: 'Crabs, lobster, shrimp, etc.'
    },
    {
      id: 'sesame',
      name: 'Sesame',
      category: 'Seeds',
      severity: 'medium',
      icon: 'Seed',
      description: 'Sesame seeds and tahini'
    },
    {
      id: 'sulfites',
      name: 'Sulfites',
      category: 'Additives',
      severity: 'low',
      icon: 'Beaker',
      description: 'Preservatives in wine, dried fruits'
    }
  ];

  const filteredAllergens = commonAllergens?.filter(allergen =>
    allergen?.name?.toLowerCase()?.includes(searchQuery?.toLowerCase()) ||
    allergen?.category?.toLowerCase()?.includes(searchQuery?.toLowerCase())
  );

  const handleAllergenToggle = (allergenId) => {
    const updatedAllergens = selectedAllergens?.includes(allergenId)
      ? selectedAllergens?.filter(id => id !== allergenId)
      : [...selectedAllergens, allergenId];
    
    setSelectedAllergens(updatedAllergens);
    onUpdate({ allergens: updatedAllergens });
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high':
        return 'text-error';
      case 'medium':
        return 'text-warning';
      case 'low':
        return 'text-success';
      default:
        return 'text-muted-foreground';
    }
  };

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'high':
        return 'bg-error/20 text-error';
      case 'medium':
        return 'bg-warning/20 text-warning';
      case 'low':
        return 'bg-success/20 text-success';
      default:
        return 'bg-muted/20 text-muted-foreground';
    }
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    onNext();
  };

  const groupedAllergens = filteredAllergens?.reduce((groups, allergen) => {
    const category = allergen?.category;
    if (!groups?.[category]) {
      groups[category] = [];
    }
    groups?.[category]?.push(allergen);
    return groups;
  }, {});

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">Allergen Profile</h2>
        <p className="text-muted-foreground">
          Help us keep you safe by identifying your food allergies and intolerances
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Search Bar */}
        <div className="relative">
          <Input
            type="text"
            placeholder="Search allergens..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e?.target?.value)}
            className="pl-10"
          />
          <Icon 
            name="Search" 
            size={18} 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
          />
        </div>

        {/* Allergen Categories */}
        <div className="space-y-6">
          {Object.entries(groupedAllergens)?.map(([category, allergens]) => (
            <div key={category} className="space-y-3">
              <h3 className="text-lg font-semibold text-foreground flex items-center space-x-2">
                <Icon name="Tag" size={18} className="text-accent" />
                <span>{category}</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {allergens?.map((allergen) => {
                  const isSelected = selectedAllergens?.includes(allergen?.id);
                  
                  return (
                    <div
                      key={allergen?.id}
                      className={`glass rounded-xl p-4 border transition-all duration-300 ${
                        isSelected
                          ? 'border-accent bg-accent/10 shadow-neon'
                          : 'border-glass-border hover:border-accent/50'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          checked={isSelected}
                          onChange={() => handleAllergenToggle(allergen?.id)}
                          className="mt-1"
                        />
                        
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <Icon 
                                name={allergen?.icon} 
                                size={18} 
                                className={getSeverityColor(allergen?.severity)}
                              />
                              <h4 className="font-semibold text-foreground">
                                {allergen?.name}
                              </h4>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityBadge(allergen?.severity)}`}>
                              {allergen?.severity}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {allergen?.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {selectedAllergens?.length > 0 && (
          <div className="glass rounded-xl p-4 border border-glass-border">
            <div className="flex items-center space-x-2 mb-3">
              <Icon name="AlertTriangle" size={18} className="text-warning" />
              <h4 className="font-semibold text-foreground">Selected Allergens</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedAllergens?.map((allergenId) => {
                const allergen = commonAllergens?.find(a => a?.id === allergenId);
                return (
                  <span
                    key={allergenId}
                    className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${
                      getSeverityBadge(allergen?.severity)
                    }`}
                  >
                    <Icon name={allergen?.icon} size={14} />
                    <span>{allergen?.name}</span>
                  </span>
                );
              })}
            </div>
            <div className="mt-3 p-3 bg-warning/10 rounded-lg border border-warning/20">
              <p className="text-sm text-warning flex items-start space-x-2">
                <Icon name="Shield" size={16} className="mt-0.5 flex-shrink-0" />
                <span>
                  We'll use this information to highlight potential allergens in food alternatives and provide safer recommendations.
                </span>
              </p>
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
          Your allergen information is kept private and secure. You can update this anytime in your profile.
        </p>
      </div>
    </div>
  );
};

export default AllergenProfileForm;