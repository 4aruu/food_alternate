import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Header from '../../components/ui/Header';

// --- FIX 1: Defined GlassCard OUTSIDE the component to stop flickering ---
const GlassCard = ({ children, className = '', onClick, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    onClick={onClick}
    className={`relative group overflow-hidden rounded-3xl bg-white/5 p-8 border border-white/10 backdrop-blur-xl transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:scale-[1.02] cursor-pointer ${className}`}
  >
    {/* Hover Glow Effect */}
    <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all duration-500" />
    <div className="relative z-10">{children}</div>
  </motion.div>
);

const LandingPage = () => {
  const navigate = useNavigate();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      // Small optimization: only update if the frame is ready
      requestAnimationFrame(() => {
        setMousePosition({ x: e.clientX, y: e.clientY });
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleNavigation = (path) => {
    navigate(path);
  };

  const features = [
    {
      icon: '🔬',
      title: 'AI Discovery',
      desc: 'Find alternatives in milliseconds',
      path: '/food-search-results'
    },
    {
      icon: '🛡️',
      title: 'Safety First',
      desc: 'Real-time allergen protection',
      path: '/nutrition-explorer-modal'
    },
    {
      icon: '🌍',
      title: 'Eco-Conscious',
      desc: 'Sustainability scores included',
      path: '/food-comparison-tool'
    },
    {
      icon: '📊',
      title: 'Deep Analytics',
      desc: 'Complete nutritional breakdowns',
      path: '/user-dashboard'
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white selection:bg-emerald-500/30 font-sans overflow-x-hidden">

      {/* BACKGROUND: Moving Aurora Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[20%] w-[40rem] h-[40rem] bg-blue-600/20 rounded-full blur-[128px] animate-blob mix-blend-screen" />
        <div className="absolute top-[40%] right-[-10%] w-[35rem] h-[35rem] bg-emerald-500/10 rounded-full blur-[128px] animate-blob animation-delay-2000 mix-blend-screen" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-cyan-600/10 rounded-full blur-[128px] animate-blob animation-delay-4000 mix-blend-screen" />

        {/* Mouse Follower Glow */}
        <div
          className="absolute w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-transform duration-75 ease-out"
          style={{ left: mousePosition.x, top: mousePosition.y }}
        />
      </div>

      <Header
        onNavigate={handleNavigation}
        searchProps={{ onSearch: (q) => navigate(`/food-search-results?q=${q}`) }}
      />

      {/* Hero Section */}
      <section className="relative pt-40 pb-32 px-6 overflow-hidden">
        <div className="max-w-5xl mx-auto text-center relative z-10">

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            {/* Pill Label */}
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 border border-white/10 backdrop-blur-md mb-8">
              <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2 animate-pulse"></span>
              <span className="text-sm font-medium text-white tracking-wide">The Future of Food is Here</span>
            </div>

            {/* Main Headline - FIX 2: Solid White Text (No transparent gradients) */}
            <h1 className="text-6xl md:text-8xl font-bold tracking-tight mb-8 text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
              Eat Smarter. <br />
              <span className="text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.4)]">Live Better.</span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto leading-relaxed mb-12 font-light">
              Discover sustainable, safe, and delicious food alternatives powered by advanced AI.
            </p>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => handleNavigation('/food-search-results')}
                className="group relative px-8 py-4 bg-white text-black rounded-full font-bold text-lg transition-all hover:scale-105 hover:bg-gray-100 hover:shadow-[0_0_40px_-10px_rgba(255,255,255,0.4)]"
              >
                Start Exploring
                <span className="inline-block ml-2 transition-transform group-hover:translate-x-1">→</span>
              </button>

              <button
                onClick={() => handleNavigation('/food-comparison-tool')}
                className="px-8 py-4 rounded-full font-medium text-white border border-white/20 hover:bg-white/10 transition-all backdrop-blur-sm"
              >
                Watch Demo
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-24 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <GlassCard key={i} delay={i * 0.1} onClick={() => handleNavigation(feature.path)}>
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-2xl mb-6 group-hover:bg-white/10 transition-colors">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.desc}</p>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* Footer Simple */}
      <footer className="py-12 border-t border-white/10 text-center text-gray-500 text-sm">
        <p>&copy; 2024 AltFinder. Designed for the future.</p>
      </footer>
    </div>
  );
};

export default LandingPage;