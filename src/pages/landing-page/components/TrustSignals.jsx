import React from 'react';
import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';

const TrustSignals = () => {
  const trustBadges = [
    {
      id: 1,
      icon: 'Shield',
      title: 'SSL Secured',
      description: 'Your data is protected with 256-bit encryption',
      color: 'text-green-400'
    },
    {
      id: 2,
      icon: 'Award',
      title: 'Scientifically Backed',
      description: 'All nutrition data verified by certified nutritionists',
      color: 'text-blue-400'
    },
    {
      id: 3,
      icon: 'Database',
      title: 'USDA Certified',
      description: 'Nutrition database sourced from official USDA records',
      color: 'text-purple-400'
    },
    {
      id: 4,
      icon: 'Users',
      title: '50K+ Users',
      description: 'Trusted by health-conscious individuals worldwide',
      color: 'text-orange-400'
    }
  ];

  const certifications = [
    {
      id: 1,
      name: 'USDA Nutrition Database',
      image: 'https://images.pexels.com/photos/4386321/pexels-photo-4386321.jpeg',
      description: 'Official nutrition data source'
    },
    {
      id: 2,
      name: 'FDA Compliance',
      image: 'https://images.pexels.com/photos/3786126/pexels-photo-3786126.jpeg',
      description: 'Meets food safety standards'
    },
    {
      id: 3,
      name: 'Nutrition Science',
      image: 'https://images.pexels.com/photos/3825527/pexels-photo-3825527.jpeg',
      description: 'Peer-reviewed research backing'
    },
    {
      id: 4,
      name: 'Allergen Safety',
      image: 'https://images.pexels.com/photos/4386370/pexels-photo-4386370.jpeg',
      description: 'Comprehensive allergen database'
    }
  ];

  const stats = [
    { label: 'Food Alternatives', value: '10,000+', icon: 'Apple' },
    { label: 'Nutrition Analyses', value: '500K+', icon: 'BarChart3' },
    { label: 'Happy Users', value: '50K+', icon: 'Users' },
    { label: 'Countries Served', value: '25+', icon: 'Globe' }
  ];

  return (
    <section className="py-20 px-6 bg-gradient-to-b from-slate-800 to-slate-900 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-gradient-to-r from-accent via-transparent to-secondary"></div>
      </div>
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Trusted by
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-secondary ml-3">
              Professionals
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Our platform is built on scientific accuracy, data security, and user trust
          </p>
        </motion.div>

        {/* Trust Badges */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
        >
          {trustBadges?.map((badge) => (
            <div
              key={badge?.id}
              className="glass rounded-xl p-6 border border-glass-border text-center hover:shadow-glass-lg transition-all duration-300"
            >
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 rounded-full bg-muted/20 flex items-center justify-center">
                  <Icon name={badge?.icon} size={24} className={badge?.color} />
                </div>
              </div>
              <h3 className="font-bold text-foreground mb-2">{badge?.title}</h3>
              <p className="text-sm text-muted-foreground">{badge?.description}</p>
            </div>
          ))}
        </motion.div>

        {/* Statistics */}
        <motion.div
          className="glass rounded-2xl p-8 border border-glass-border shadow-glass-lg mb-16"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats?.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-3">
                  <Icon name={stat?.icon} size={32} className="text-accent" />
                </div>
                <div className="text-3xl font-bold text-foreground mb-2">
                  {stat?.value}
                </div>
                <div className="text-sm text-muted-foreground">
                  {stat?.label}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Certifications */}
        <motion.div
          className="mb-16"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          viewport={{ once: true }}
        >
          <h3 className="text-2xl font-bold text-foreground text-center mb-8">
            Data Sources & Certifications
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {certifications?.map((cert) => (
              <div
                key={cert?.id}
                className="glass rounded-xl overflow-hidden border border-glass-border hover:shadow-glass-lg transition-all duration-300"
              >
                <div className="h-32 overflow-hidden">
                  <Image
                    src={cert?.image}
                    alt={cert?.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <h4 className="font-semibold text-foreground mb-2">{cert?.name}</h4>
                  <p className="text-sm text-muted-foreground">{cert?.description}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Security Notice */}
        <motion.div
          className="glass rounded-2xl p-8 border border-glass-border shadow-glass-lg text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          viewport={{ once: true }}
        >
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
              <Icon name="ShieldCheck" size={32} className="text-green-400" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-foreground mb-4">
            Your Privacy & Security Matter
          </h3>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
            We use industry-standard encryption to protect your personal data and dietary preferences. 
            Your information is never shared with third parties without your explicit consent.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center">
              <Icon name="Lock" size={16} className="mr-2 text-green-400" />
              256-bit SSL Encryption
            </div>
            <div className="flex items-center">
              <Icon name="Eye" size={16} className="mr-2 text-green-400" />
              Privacy Compliant
            </div>
            <div className="flex items-center">
              <Icon name="Shield" size={16} className="mr-2 text-green-400" />
              GDPR Ready
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TrustSignals;