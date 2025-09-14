import React, { useState } from 'react';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';

const AccountDetailsForm = ({ formData = {}, onUpdate = () => {}, onNext = () => {} }) => {
  const [data, setData] = useState({
    firstName: formData?.firstName || '',
    lastName: formData?.lastName || '',
    email: formData?.email || '',
    password: formData?.password || '',
    confirmPassword: formData?.confirmPassword || '',
    ...formData
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex?.test(email);
  };

  const getPasswordStrength = (password) => {
    let strength = 0;
    if (password?.length >= 8) strength++;
    if (/[A-Z]/?.test(password)) strength++;
    if (/[a-z]/?.test(password)) strength++;
    if (/[0-9]/?.test(password)) strength++;
    if (/[^A-Za-z0-9]/?.test(password)) strength++;
    return strength;
  };

  const getPasswordStrengthLabel = (strength) => {
    const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    return labels?.[strength] || 'Very Weak';
  };

  const getPasswordStrengthColor = (strength) => {
    const colors = [
      'text-error',
      'text-warning',
      'text-warning',
      'text-success',
      'text-accent'
    ];
    return colors?.[strength] || 'text-error';
  };

  const handleInputChange = (field, value) => {
    setData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors?.[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }

    // Real-time validation
    if (field === 'email' && value && !validateEmail(value)) {
      setErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
    }

    if (field === 'confirmPassword' && value !== data?.password) {
      setErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
    }

    if (field === 'password' && data?.confirmPassword && value !== data?.confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
    }

    // Update parent component
    onUpdate({ ...data, [field]: value });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!data?.firstName?.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!data?.lastName?.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!data?.email?.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(data?.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!data?.password) {
      newErrors.password = 'Password is required';
    } else if (data?.password?.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    }

    if (!data?.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (data?.password !== data?.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (validateForm()) {
      onNext();
    }
  };

  const passwordStrength = getPasswordStrength(data?.password);

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">Create Your Account</h2>
        <p className="text-muted-foreground">
          Join Smart Alternatives Finder to discover personalized food substitutes
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="First Name"
            type="text"
            placeholder="Enter your first name"
            value={data?.firstName}
            onChange={(e) => handleInputChange('firstName', e?.target?.value)}
            error={errors?.firstName}
            required
          />

          <Input
            label="Last Name"
            type="text"
            placeholder="Enter your last name"
            value={data?.lastName}
            onChange={(e) => handleInputChange('lastName', e?.target?.value)}
            error={errors?.lastName}
            required
          />
        </div>

        <Input
          label="Email Address"
          type="email"
          placeholder="Enter your email address"
          description="We'll use this to send you personalized food recommendations"
          value={data?.email}
          onChange={(e) => handleInputChange('email', e?.target?.value)}
          error={errors?.email}
          required
        />

        <div className="space-y-4">
          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Create a strong password"
              value={data?.password}
              onChange={(e) => handleInputChange('password', e?.target?.value)}
              error={errors?.password}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-9 text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              <Icon name={showPassword ? 'EyeOff' : 'Eye'} size={18} />
            </button>
          </div>

          {data?.password && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Password Strength:</span>
                <span className={`text-sm font-medium ${getPasswordStrengthColor(passwordStrength)}`}>
                  {getPasswordStrengthLabel(passwordStrength)}
                </span>
              </div>
              <div className="w-full bg-muted/30 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    passwordStrength <= 1
                      ? 'bg-error'
                      : passwordStrength <= 2
                      ? 'bg-warning'
                      : passwordStrength <= 3
                      ? 'bg-warning'
                      : passwordStrength <= 4
                      ? 'bg-success' :'bg-accent'
                  }`}
                  style={{ width: `${(passwordStrength / 5) * 100}%` }}
                />
              </div>
            </div>
          )}

          <div className="relative">
            <Input
              label="Confirm Password"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm your password"
              value={data?.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e?.target?.value)}
              error={errors?.confirmPassword}
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-9 text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              <Icon name={showConfirmPassword ? 'EyeOff' : 'Eye'} size={18} />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between pt-6">
          <Button
            variant="ghost"
            onClick={() => window.history?.back()}
            iconName="ArrowLeft"
            iconPosition="left"
          >
            Back to Login
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
      <div className="text-center pt-6 border-t border-glass-border">
        <p className="text-sm text-muted-foreground">
          Already have an account?{' '}
          <button
            onClick={() => window.location.href = '/sign-in'}
            className="text-accent hover:text-accent/80 font-medium transition-colors duration-200"
          >
            Sign in here
          </button>
        </p>
      </div>
    </div>
  );
};

export default AccountDetailsForm;