import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '../../components/ui/Header';
import NavigationBreadcrumbs from '../../components/ui/NavigationBreadcrumbs';
import RegistrationProgress from './components/RegistrationProgress';
import DietaryPreferencesForm from './components/DietaryPreferencesForm';
import AllergenProfileForm from './components/AllergenProfileForm';
import SustainabilitySettingsForm from './components/SustainabilitySettingsForm';
import TrustSignals from './components/TrustSignals';
import Icon from '../../components/AppIcon';

// "Set up preferences": a no-account flow. Nothing here is persisted
// (no localStorage/sessionStorage/cookies); the choices live only in this
// component's state for the current visit.
const UserRegistration = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    dietaryPreferences: [],
    allergens: [],
    sustainabilityImportance: 3,
    sustainabilityPriorities: []
  });
  const [showSuccess, setShowSuccess] = useState(false);

  const totalSteps = 3;
  const stepLabels = [
    'Dietary Preferences',
    'Allergen Profile',
    'Sustainability Settings'
  ];

  const handleNavigate = (path) => {
    window.location.href = path;
  };

  const handleFormUpdate = (stepData) => {
    setFormData(prev => ({ ...prev, ...stepData }));
  };

  const handleNextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleCompleteSetup = () => {
    setShowSuccess(true);
  };

  const breadcrumbs = [
    { label: 'Home', path: '/', icon: 'Home' },
    { label: 'Set up preferences', path: '/user-registration', icon: 'SlidersHorizontal', isLast: true }
  ];

  const pageVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  };

  const successVariants = {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8 }
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-background">
        <Header onNavigate={handleNavigate} />
        <main className="pt-20 pb-12">
          <div className="container mx-auto px-6 lg:px-8">
            <motion.div
              variants={successVariants}
              initial="initial"
              animate="animate"
              className="max-w-md mx-auto text-center"
            >
              <div className="glass rounded-2xl p-8 border border-glass-border shadow-glass-lg">
                <div className="w-20 h-20 bg-gradient-to-br from-success to-accent rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse-glow">
                  <Icon name="Check" size={32} className="text-success-foreground" />
                </div>

                <h1 className="text-2xl font-bold text-foreground mb-4">
                  Preferences set
                </h1>

                <p className="text-muted-foreground mb-6">
                  Personalised filtering based on these choices is coming soon. Nothing is stored in your browser or sent to a server.
                </p>

                <button
                  onClick={() => handleNavigate('/food-search-results')}
                  className="px-6 py-3 bg-gradient-to-r from-accent to-secondary text-slate-900 font-semibold rounded-xl hover:shadow-neon transition-all duration-300"
                >
                  Start exploring foods
                </button>
              </div>
            </motion.div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onNavigate={handleNavigate} />
      <main className="pt-20 pb-12">
        <div className="container mx-auto px-6 lg:px-8">
          <NavigationBreadcrumbs
            customBreadcrumbs={breadcrumbs}
            onNavigate={handleNavigate}
          />

          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Preferences Form */}
              <div className="lg:col-span-2">
                <div className="glass rounded-2xl p-8 border border-glass-border shadow-glass-lg">
                  <RegistrationProgress
                    currentStep={currentStep}
                    totalSteps={totalSteps}
                    stepLabels={stepLabels}
                  />

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentStep}
                      variants={pageVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      transition={{ duration: 0.3 }}
                    >
                      {currentStep === 1 && (
                        <DietaryPreferencesForm
                          formData={formData}
                          onUpdate={handleFormUpdate}
                          onNext={handleNextStep}
                          onBack={() => handleNavigate('/')}
                        />
                      )}

                      {currentStep === 2 && (
                        <AllergenProfileForm
                          formData={formData}
                          onUpdate={handleFormUpdate}
                          onNext={handleNextStep}
                          onBack={handlePreviousStep}
                        />
                      )}

                      {currentStep === 3 && (
                        <SustainabilitySettingsForm
                          formData={formData}
                          onUpdate={handleFormUpdate}
                          onComplete={handleCompleteSetup}
                          onBack={handlePreviousStep}
                        />
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-1 space-y-6">
                {/* Trust Signals */}
                <TrustSignals />

                {/* Quick Stats */}
                <div className="glass rounded-xl p-6 border border-glass-border">
                  <h3 className="font-semibold text-foreground mb-4 text-center">
                    Join Our Community
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Active Users</span>
                      <span className="text-sm font-semibold text-accent">50,000+</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Food Alternatives</span>
                      <span className="text-sm font-semibold text-accent">25,000+</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Success Rate</span>
                      <span className="text-sm font-semibold text-success">98%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      {/* Floating Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-accent/5 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 right-1/3 w-48 h-48 bg-secondary/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }}></div>
      </div>
    </div>
  );
};

export default UserRegistration;