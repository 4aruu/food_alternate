import React from 'react';
import Icon from '../../../components/AppIcon';

const TrustSignals = () => {
  const trustFeatures = [
    {
      icon: 'Shield',
      title: 'SSL Encrypted',
      description: 'Your data is protected with 256-bit encryption'
    },
    {
      icon: 'Database',
      title: 'USDA Verified',
      description: 'Nutrition data sourced from official USDA database'
    },
    {
      icon: 'Award',
      title: 'Science-Backed',
      description: 'Recommendations based on peer-reviewed research'
    },
    {
      icon: 'Lock',
      title: 'Privacy First',
      description: 'We never sell or share your personal information'
    }
  ];

  const securityBadges = [
    {
      name: 'GDPR Compliant',
      icon: 'CheckCircle',
      color: 'text-success'
    },
    {
      name: 'SOC 2 Certified',
      icon: 'Verified',
      color: 'text-primary'
    },
    {
      name: 'ISO 27001',
      icon: 'Shield',
      color: 'text-accent'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Trust Features */}
      <div className="glass rounded-xl p-6 border border-glass-border">
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Your Data is Safe With Us
          </h3>
          <p className="text-sm text-muted-foreground">
            We use industry-leading security measures to protect your information
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {trustFeatures?.map((feature, index) => (
            <div key={index} className="flex items-start space-x-3">
              <div className="p-2 rounded-lg bg-accent/20">
                <Icon 
                  name={feature?.icon} 
                  size={18} 
                  className="text-accent"
                />
              </div>
              <div>
                <h4 className="font-semibold text-foreground text-sm">
                  {feature?.title}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {feature?.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Security Badges */}
      <div className="flex items-center justify-center space-x-6">
        {securityBadges?.map((badge, index) => (
          <div key={index} className="flex items-center space-x-2">
            <Icon 
              name={badge?.icon} 
              size={16} 
              className={badge?.color}
            />
            <span className="text-xs font-medium text-muted-foreground">
              {badge?.name}
            </span>
          </div>
        ))}
      </div>
      {/* Data Usage Information */}
      <div className="text-center">
        <div className="inline-flex items-center space-x-2 px-4 py-2 bg-success/10 rounded-full border border-success/20">
          <Icon name="Info" size={14} className="text-success" />
          <span className="text-xs text-success font-medium">
            100% of your data stays private and secure
          </span>
        </div>
      </div>
    </div>
  );
};

export default TrustSignals;