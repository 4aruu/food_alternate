import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const CallToAction = ({ onNavigate = () => {} }) => {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const benefits = [
    {
      icon: 'Zap',
      text: 'Instant food alternative discovery'
    },
    {
      icon: 'Shield',
      text: 'Comprehensive allergen protection'
    },
    {
      icon: 'BarChart3',
      text: 'Detailed nutrition analysis'
    },
    {
      icon: 'Leaf',
      text: 'Sustainability impact scoring'
    }
  ];

  const handleEmailSubmit = (e) => {
    e?.preventDefault();
    if (email?.trim()) {
      setIsSubscribed(true);
      setTimeout(() => {
        onNavigate('/user-registration');
      }, 2000);
    }
  };

  return (
    <section className="py-20 px-6 bg-gradient-to-b from-slate-800 to-slate-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-r from-accent/10 via-transparent to-secondary/10"></div>
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-accent/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-secondary/5 rounded-full blur-3xl"></div>
      </div>
      <div className="max-w-4xl mx-auto relative z-10">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          {/* Main Heading */}
          <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
            Start Your
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-secondary ml-3">
              Healthy Journey
            </span>
            <br />
            Today
          </h2>

          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
            Join thousands of users who have already discovered healthier, safer, and more sustainable food alternatives
          </p>

          {/* Benefits Grid */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
            {benefits?.map((benefit, index) => (
              <div
                key={index}
                className="flex items-center justify-center md:justify-start space-x-3 text-foreground"
              >
                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                  <Icon name={benefit?.icon} size={16} className="text-accent" />
                </div>
                <span className="text-lg">{benefit?.text}</span>
              </div>
            ))}
          </motion.div>

          {/* CTA Section */}
          <motion.div
            className="glass rounded-2xl p-8 md:p-12 border border-glass-border shadow-glass-lg"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
          >
            {!isSubscribed ? (
              <>
                <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                  Get Started for Free
                </h3>
                <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
                  Create your account and start discovering better food alternatives in seconds. 
                  No credit card required.
                </p>

                {/* Email Signup Form */}
                <form onSubmit={handleEmailSubmit} className="max-w-md mx-auto mb-8">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Input
                      type="email"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e?.target?.value)}
                      required
                      className="flex-1"
                    />
                    <Button
                      type="submit"
                      variant="default"
                      size="lg"
                      iconName="ArrowRight"
                      iconPosition="right"
                      className="neon-glow-primary"
                    >
                      Get Started
                    </Button>
                  </div>
                </form>

                {/* Alternative Actions */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => onNavigate('/user-registration')}
                    iconName="UserPlus"
                    iconPosition="left"
                    className="glass border-accent/30 hover:bg-accent/10 text-accent"
                  >
                    Create Account
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="lg"
                    onClick={() => onNavigate('/food-comparison-tool')}
                    iconName="GitCompare"
                    iconPosition="left"
                    className="text-muted-foreground hover:text-accent"
                  >
                    Try Comparison Tool
                  </Button>
                </div>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon name="CheckCircle" size={32} className="text-success" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">
                  Welcome to Smart Alternatives!
                </h3>
                <p className="text-muted-foreground mb-6">
                  Thank you for joining us. Redirecting you to complete your registration...
                </p>
                <div className="flex justify-center">
                  <div className="animate-spin">
                    <Icon name="Loader2" size={24} className="text-accent" />
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            className="mt-12 flex flex-wrap justify-center items-center gap-8 text-sm text-muted-foreground"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center">
              <Icon name="Shield" size={16} className="mr-2 text-green-400" />
              100% Secure & Private
            </div>
            <div className="flex items-center">
              <Icon name="Zap" size={16} className="mr-2 text-accent" />
              Instant Access
            </div>
            <div className="flex items-center">
              <Icon name="Users" size={16} className="mr-2 text-blue-400" />
              50K+ Happy Users
            </div>
            <div className="flex items-center">
              <Icon name="Award" size={16} className="mr-2 text-purple-400" />
              Scientifically Backed
            </div>
          </motion.div>

          {/* Final Message */}
          <motion.p
            className="mt-8 text-muted-foreground text-sm max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            viewport={{ once: true }}
          >
            By signing up, you agree to our Terms of Service and Privacy Policy. 
            Start your journey to healthier food choices today.
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
};

export default CallToAction;