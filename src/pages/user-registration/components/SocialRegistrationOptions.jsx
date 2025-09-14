import React from 'react';

import Icon from '../../../components/AppIcon';

const SocialRegistrationOptions = ({ onSocialRegister = () => {} }) => {
  const socialProviders = [
    {
      id: 'google',
      name: 'Google',
      icon: 'Chrome',
      color: 'hover:bg-red-500/10 hover:text-red-400 hover:border-red-400/30',
      description: 'Continue with Google account'
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: 'Facebook',
      color: 'hover:bg-blue-500/10 hover:text-blue-400 hover:border-blue-400/30',
      description: 'Continue with Facebook account'
    },
    {
      id: 'apple',
      name: 'Apple',
      icon: 'Apple',
      color: 'hover:bg-gray-500/10 hover:text-gray-400 hover:border-gray-400/30',
      description: 'Continue with Apple ID'
    }
  ];

  const handleSocialLogin = (provider) => {
    // Mock social registration
    console.log(`Registering with ${provider?.name}...`);
    onSocialRegister(provider?.id);
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-glass-border"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-background text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3">
        {socialProviders?.map((provider) => (
          <button
            key={provider?.id}
            onClick={() => handleSocialLogin(provider)}
            className={`w-full flex items-center justify-center space-x-3 p-3 rounded-xl border-2 border-glass-border glass transition-all duration-300 ${provider?.color} group`}
            aria-label={provider?.description}
          >
            <Icon 
              name={provider?.icon} 
              size={20} 
              className="transition-colors duration-200"
            />
            <span className="font-medium">
              Continue with {provider?.name}
            </span>
          </button>
        ))}
      </div>
      <div className="text-center">
        <p className="text-xs text-muted-foreground">
          By continuing, you agree to our{' '}
          <button className="text-accent hover:text-accent/80 transition-colors duration-200">
            Terms of Service
          </button>{' '}
          and{' '}
          <button className="text-accent hover:text-accent/80 transition-colors duration-200">
            Privacy Policy
          </button>
        </p>
      </div>
    </div>
  );
};

export default SocialRegistrationOptions;