import React from 'react';
import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';

const FeatureHighlights = ({ onNavigate = () => {} }) => {
  const features = [
    {
      id: 1,
      icon: 'BarChart3',
      title: 'Nutrition Analysis',
      description: 'Get detailed nutritional breakdowns and comparisons for every food alternative with interactive charts and insights.',
      color: 'from-blue-500 to-cyan-500',
      delay: 0
    },
    {
      id: 2,
      icon: 'Shield',
      title: 'Allergen Warnings',
      description: 'Stay safe with comprehensive allergen detection and warnings for all food substitutes and ingredients.',
      color: 'from-red-500 to-pink-500',
      delay: 0.2
    },
    {
      id: 3,
      icon: 'Leaf',
      title: 'Sustainability Scoring',
      description: 'Make eco-friendly choices with our environmental impact ratings and sustainability metrics for every option.',
      color: 'from-green-500 to-emerald-500',
      delay: 0.4
    },
    {
      id: 4,
      icon: 'Zap',
      title: 'Instant Discovery',
      description: 'Find perfect food alternatives in seconds with our AI-powered search engine and real-time suggestions.',
      color: 'from-purple-500 to-violet-500',
      delay: 0.6
    },
    {
      id: 5,
      icon: 'Heart',
      title: 'Dietary Preferences',
      description: 'Personalized recommendations based on your dietary restrictions, preferences, and health goals.',
      color: 'from-orange-500 to-red-500',
      delay: 0.8
    },
    {
      id: 6,
      icon: 'Users',
      title: 'Community Insights',
      description: 'Learn from a community of health-conscious users sharing reviews and experiences with alternatives.',
      color: 'from-indigo-500 to-blue-500',
      delay: 1
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut"
      }
    }
  };

  return (
    <section className="py-20 px-6 bg-gradient-to-b from-slate-900 to-slate-800 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-accent/5 via-transparent to-secondary/5"></div>
      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Powerful Features for
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-secondary ml-3">
              Smart Choices
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Discover why thousands of users trust our platform to make healthier, safer, and more sustainable food decisions
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {features?.map((feature) => (
            <motion.div
              key={feature?.id}
              variants={itemVariants}
              className="group cursor-pointer"
              onClick={() => onNavigate('/user-dashboard')}
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
            >
              <div className="glass rounded-2xl p-8 border border-glass-border shadow-glass-lg hover:shadow-glass-xl transition-all duration-300 h-full">
                {/* Icon with Gradient Background */}
                <div className="relative mb-6">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature?.color} p-4 shadow-lg group-hover:shadow-xl transition-all duration-300`}>
                    <Icon 
                      name={feature?.icon} 
                      size={32} 
                      className="text-white w-full h-full"
                    />
                  </div>
                  <div className={`absolute inset-0 w-16 h-16 rounded-2xl bg-gradient-to-br ${feature?.color} opacity-20 blur-xl group-hover:opacity-40 transition-all duration-300`}></div>
                </div>

                <h3 className="text-xl font-bold text-foreground mb-4 group-hover:text-accent transition-colors duration-300">
                  {feature?.title}
                </h3>
                
                <p className="text-muted-foreground leading-relaxed mb-6">
                  {feature?.description}
                </p>

                <div className="flex items-center text-accent opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <span className="text-sm font-medium mr-2">Learn more</span>
                  <Icon name="ArrowRight" size={16} />
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          className="text-center mt-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          viewport={{ once: true }}
        >
          <div className="glass rounded-2xl p-8 border border-glass-border shadow-glass-lg max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-foreground mb-4">
              Ready to Transform Your Food Choices?
            </h3>
            <p className="text-muted-foreground mb-6">
              Join thousands of users who have already discovered healthier alternatives
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => onNavigate('/user-registration')}
                className="px-8 py-3 bg-gradient-to-r from-accent to-secondary text-slate-900 font-semibold rounded-xl hover:shadow-neon transition-all duration-300"
              >
                Get Started Free
              </button>
              <button
                onClick={() => onNavigate('/nutrition-explorer-modal')}
                className="px-8 py-3 glass border border-accent/30 text-accent font-semibold rounded-xl hover:bg-accent/10 transition-all duration-300"
              >
                Explore Nutrition Data
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FeatureHighlights;