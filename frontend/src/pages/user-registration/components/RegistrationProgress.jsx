import React from 'react';
import Icon from '../../../components/AppIcon';

const RegistrationProgress = ({ currentStep = 1, totalSteps = 4, stepLabels = [] }) => {
  const defaultLabels = [
    'Account Details',
    'Dietary Preferences', 
    'Allergen Profile',
    'Sustainability Settings'
  ];

  const labels = stepLabels?.length > 0 ? stepLabels : defaultLabels;

  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between relative">
        {/* Progress Line */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-muted/30 -translate-y-1/2 z-0">
          <div 
            className="h-full bg-gradient-to-r from-accent to-primary transition-all duration-500 ease-out"
            style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
          />
        </div>

        {/* Step Indicators */}
        {Array.from({ length: totalSteps }, (_, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          const isUpcoming = stepNumber > currentStep;

          return (
            <div key={stepNumber} className="relative z-10 flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  isCompleted
                    ? 'bg-accent border-accent text-accent-foreground shadow-neon'
                    : isCurrent
                    ? 'bg-primary border-primary text-primary-foreground shadow-glass animate-pulse-glow'
                    : 'bg-background border-muted text-muted-foreground'
                }`}
              >
                {isCompleted ? (
                  <Icon name="Check" size={16} className="text-accent-foreground" />
                ) : (
                  <span className="text-sm font-semibold">{stepNumber}</span>
                )}
              </div>
              <div className="mt-2 text-center">
                <p
                  className={`text-xs font-medium transition-colors duration-200 ${
                    isCurrent
                      ? 'text-accent'
                      : isCompleted
                      ? 'text-foreground'
                      : 'text-muted-foreground'
                  }`}
                >
                  {labels?.[index]}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RegistrationProgress;