import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '../../components/ui/Header';
import NavigationBreadcrumbs from '../../components/ui/NavigationBreadcrumbs';
import RegistrationProgress from './components/RegistrationProgress';
import AccountDetailsForm from './components/AccountDetailsForm';
import DietaryPreferencesForm from './components/DietaryPreferencesForm';
import AllergenProfileForm from './components/AllergenProfileForm';
import SustainabilitySettingsForm from './components/SustainabilitySettingsForm';
import SocialRegistrationOptions from './components/SocialRegistrationOptions';
import TrustSignals from './components/TrustSignals';
import Button from '../../components/ui/Button';
import Icon from '../../components/AppIcon';

const UserRegistration = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    dietaryPreferences: [],
    allergens: [],
    sustainabilityImportance: 3,
    sustainabilityPriorities: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const totalSteps = 4;
  const stepLabels = [
    'Account Details',
    'Dietary Preferences',
    'Allergen Profile',
    'Sustainability Settings'
  ];

  useEffect(() => {
    // Save form data to localStorage for persistence
    localStorage.setItem('registrationFormData', JSON.stringify(formData));
  }, [formData]);

  useEffect(() => {
    // Load saved form data on component mount
    const savedData = localStorage.getItem('registrationFormData');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setFormData(parsedData);
      } catch (error) {
        console.error('Error loading saved form data:', error);
      }
    }
  }, []);

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

  const handleCompleteRegistration = async () => {
    setIsLoading(true);
    
    try {
      // Mock registration API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Clear saved form data
      localStorage.removeItem('registrationFormData');
      
      // Show success state
      setShowSuccess(true);
      
      // Redirect to dashboard after success
      setTimeout(() => {
        handleNavigate('/user-dashboard');
      }, 3000);
      
    } catch (error) {
      console.error('Registration error:', error);
      setIsLoading(false);
    }
  };

  const handleSocialRegister = (provider) => {
    console.log(`Social registration with ${provider}`);
    // Mock social registration
    setTimeout(() => {
      handleNavigate('/user-dashboard');
    }, 1000);
  };

  const breadcrumbs = [
    { label: 'Home', path: '/landing-page', icon: 'Home' },
    { label: 'Sign Up', path: '/user-registration', icon: 'UserPlus', isLast: true }
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
                  Welcome to Smart Alternatives Finder!
                </h1>
                
                <p className="text-muted-foreground mb-6">
                  Your account has been created successfully. We're setting up your personalized dashboard...
                </p>
                
                <div className="flex items-center justify-center space-x-2 text-accent">
                  <div className="animate-spin">
                    <Icon name="Loader2" size={20} />
                  </div>
                  <span className="text-sm font-medium">Redirecting to dashboard...</span>
                </div>
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
              {/* Main Registration Form */}
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
                        <AccountDetailsForm
                          formData={formData}
                          onUpdate={handleFormUpdate}
                          onNext={handleNextStep}
                        />
                      )}

                      {currentStep === 2 && (
                        <DietaryPreferencesForm
                          formData={formData}
                          onUpdate={handleFormUpdate}
                          onNext={handleNextStep}
                          onBack={handlePreviousStep}
                        />
                      )}

                      {currentStep === 3 && (
                        <AllergenProfileForm
                          formData={formData}
                          onUpdate={handleFormUpdate}
                          onNext={handleNextStep}
                          onBack={handlePreviousStep}
                        />
                      )}

                      {currentStep === 4 && (
                        <SustainabilitySettingsForm
                          formData={formData}
                          onUpdate={handleFormUpdate}
                          onComplete={handleCompleteRegistration}
                          onBack={handlePreviousStep}
                        />
                      )}
                    </motion.div>
                  </AnimatePresence>

                  {isLoading && (
                    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
                      <div className="glass rounded-xl p-6 border border-glass-border">
                        <div className="flex items-center space-x-3">
                          <div className="animate-spin">
                            <Icon name="Loader2" size={24} className="text-accent" />
                          </div>
                          <span className="text-foreground font-medium">
                            Creating your account...
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Social Registration Options - Only show on first step */}
                {currentStep === 1 && (
                  <div className="mt-6">
                    <SocialRegistrationOptions onSocialRegister={handleSocialRegister} />
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-1 space-y-6">
                {/* Trust Signals */}
                <TrustSignals />

                {/* Help Section */}
                <div className="glass rounded-xl p-6 border border-glass-border">
                  <div className="text-center">
                    <Icon name="HelpCircle" size={32} className="text-accent mx-auto mb-4" />
                    <h3 className="font-semibold text-foreground mb-2">
                      Need Help?
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Our support team is here to assist you with the registration process.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      iconName="MessageCircle"
                      iconPosition="left"
                      onClick={() => handleNavigate('/help')}
                    >
                      Contact Support
                    </Button>
                  </div>
                </div>

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