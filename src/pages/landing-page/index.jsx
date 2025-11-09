import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Header from '../../components/ui/Header';

const LandingPage = () => {
  const navigate = useNavigate();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleSearch = (query) => {
    navigate(`/food-search-results?q=${encodeURIComponent(query)}`);
  };

  // Data configurations
  const features = [
    {
      icon: '🔬',
      title: 'AI-Powered Discovery',
      desc: 'Find perfect alternatives in milliseconds',
      color: 'from-blue-500/20 to-cyan-500/20',
      path: '/food-search-results'
    },
    {
      icon: '🛡️',
      title: 'Safety First',
      desc: 'Real-time allergen protection',
      color: 'from-emerald-500/20 to-green-500/20',
      path: '/nutrition-explorer-modal'
    },
    {
      icon: '🌍',
      title: 'Eco-Conscious',
      desc: 'Sustainability scores included',
      color: 'from-orange-500/20 to-amber-500/20',
      path: '/food-comparison-tool'
    },
    {
      icon: '📊',
      title: 'Deep Analytics',
      desc: 'Complete nutritional breakdowns',
      color: 'from-purple-500/20 to-pink-500/20',
      path: '/user-dashboard'
    }
  ];

  const stats = [
    { value: '10K+', label: 'Food Options', icon: '🍎' },
    { value: '50K+', label: 'Happy Users', icon: '👥' },
    { value: '98%', label: 'Accuracy', icon: '✨' }
  ];

  const testimonials = [
    { name: 'Sarah J.', role: 'Nutritionist', text: 'Game-changing platform for my practice.' },
    { name: 'Mike T.', role: 'Allergy Parent', text: 'Finally, peace of mind at meal time.' },
    { name: 'Emma R.', role: 'Eco Warrior', text: 'Love the sustainability focus.' }
  ];

  const footerLinks = [
    { title: 'Product', links: ['Features', 'Pricing', 'Security'] },
    { title: 'Company', links: ['About', 'Blog', 'Careers'] },
    { title: 'Resources', links: ['Docs', 'API', 'Support'] },
    { title: 'Legal', links: ['Privacy', 'Terms', 'Contact'] }
  ];

  // Reusable components
  const GlassCard = ({ children, className = '', delay = 0, onClick }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      onClick={onClick}
      className={`group relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all duration-500 cursor-pointer hover:shadow-lg hover:shadow-emerald-500/20 ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none" />
      <div className="relative z-10">{children}</div>
    </motion.div>
  );

  const AnimatedButton = ({ text, onClick, variant = 'primary', icon = '→' }) => (
    <motion.button
      whileHover={{ scale: 1.05, x: 5 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`relative group px-8 py-3 rounded-xl font-semibold transition-all duration-300 ${
        variant === 'primary'
          ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-black shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50'
          : 'bg-white/10 border border-white/20 text-white hover:bg-white/20'
      }`}
    >
      <span className="flex items-center gap-2">
        {text}
        <motion.span
          animate={{ x: [0, 4, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          {icon}
        </motion.span>
      </span>
    </motion.button>
  );

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Animated gradient background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,119,182,0))]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_80%_50%,rgba(34,197,94,0.15),rgba(34,197,94,0))]" />
      </div>

      {/* Cursor glow effect */}
      <motion.div
        className="fixed w-96 h-96 rounded-full pointer-events-none -z-5 opacity-20"
        style={{
          background: 'radial-gradient(circle, rgba(34,197,94,0.3) 0%, transparent 70%)',
          x: mousePosition.x - 192,
          y: mousePosition.y - 192
        }}
        transition={{ type: 'spring', stiffness: 50, damping: 20 }}
      />

      {/* Header */}
      <Header
        onNavigate={handleNavigation}
        searchProps={{
          onSearch: handleSearch,
          placeholder: "Search for food alternatives...",
          isLoading: false
        }}
      />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-black mb-6 leading-tight">
              <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Discover
              </span>
              <br />
              <span className="text-white">Tomorrow's Food</span>
              <br />
              <span className="text-white">Today</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
              AI-powered food alternative discovery that's safe, sustainable, and scientifically-backed
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <AnimatedButton
                text="Start Exploring"
                onClick={() => handleNavigation('/food-search-results')}
              />
              <AnimatedButton
                text="Learn More"
                variant="secondary"
                onClick={() => handleNavigation('/food-comparison-tool')}
              />
            </div>
          </motion.div>

          {/* Stats Row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="grid grid-cols-3 gap-4 md:gap-8 mt-16"
          >
            {stats.map((stat, i) => (
              <GlassCard key={i} delay={i * 0.1}>
                <div className="text-center">
                  <div className="text-3xl mb-2">{stat.icon}</div>
                  <div className="text-2xl font-bold text-emerald-400">{stat.value}</div>
                  <div className="text-sm text-gray-400">{stat.label}</div>
                </div>
              </GlassCard>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6 relative">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold text-center mb-16"
          >
            Powerful Features
          </motion.h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <GlassCard
                key={i}
                delay={i * 0.1}
                className={`bg-gradient-to-br ${feature.color}`}
                onClick={() => handleNavigation(feature.path)}
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-400">{feature.desc}</p>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold text-center mb-12"
          >
            Loved by Users
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <GlassCard key={i} delay={i * 0.1}>
                <div className="mb-4">
                  {'⭐'.repeat(5)}
                </div>
                <p className="text-gray-300 mb-4">"{t.text}"</p>
                <div>
                  <p className="font-semibold">{t.name}</p>
                  <p className="text-sm text-gray-400">{t.role}</p>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 relative overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <h2 className="text-5xl md:text-6xl font-bold mb-6">
              Ready to Transform
              <br />
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                Your Meals?
              </span>
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Join 50,000+ users making smarter food choices every day
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <AnimatedButton
                text="Get Started Free"
                onClick={() => handleNavigation('/user-registration')}
              />
              <AnimatedButton
                text="Schedule Demo"
                variant="secondary"
                onClick={() => handleNavigation('/food-comparison-tool')}
              />
            </div>
          </motion.div>
        </div>

        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-10 left-10 w-40 h-40 bg-emerald-500 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-cyan-500 rounded-full blur-3xl" />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {footerLinks.map((col, i) => (
              <div key={i}>
                <h3 className="font-semibold mb-4">{col.title}</h3>
                <ul className="space-y-2">
                  {col.links.map((link, j) => (
                    <li key={j}>
                      <button
                        onClick={() => {}}
                        className="text-gray-400 hover:text-white transition duration-200"
                      >
                        {link}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-white/10 pt-8 text-center text-gray-400 text-sm">
            © 2024 Smart Alternatives Finder. Discover smarter food choices.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;