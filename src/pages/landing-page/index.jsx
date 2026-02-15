import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import Header from '../../components/ui/Header';

// Animated Counter Component
const AnimatedCounter = ({ end, duration = 2, suffix = "+" }) => {
  const [count, setCount] = useState(0);
  const counterRef = useRef(null);
  const isInView = useInView(counterRef, { once: true, amount: 0.3 });

  useEffect(() => {
    if (!isInView) return;

    let startTime;
    let animationFrame;

    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / (duration * 1000), 1);

      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOutQuart * end));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [isInView, end, duration]);

  return (
    <span ref={counterRef} className="tabular-nums">
      {count.toLocaleString()}{suffix}
    </span>
  );
};

// Flipping Text Component
const FlippingText = () => {
  const words = ["Live Better.", "Stay Healthier.", "Feel Stronger.", "Thrive Daily."];
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % words.length);
    }, 3500); // Change every 3.5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <span className="relative inline-block align-top" style={{ minHeight: '1.2em' }}>
      {words.map((word, index) => (
        <motion.span
          key={word}
          className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500"
          style={{
            position: currentIndex === index ? 'relative' : 'absolute',
            left: currentIndex === index ? 'auto' : 0,
            top: currentIndex === index ? 'auto' : 0,
          }}
          initial={{ y: "100%", opacity: 0 }}
          animate={{
            y: currentIndex === index ? "0%" : "-100%",
            opacity: currentIndex === index ? 1 : 0,
          }}
          transition={{
            duration: 0.7,
            ease: [0.25, 0.1, 0.25, 1],
          }}
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
};

// Section wrapper with scroll-triggered animation with fade in AND fade out
const ScrollSection = ({ children, className = "" }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { amount: 0.3 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 60 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 60 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

const LandingPage = () => {
  const navigate = useNavigate();
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(scrolled / maxScroll);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <div className="relative bg-black text-white overflow-x-hidden">
      <Header onNavigate={handleNavigation} />

      {/* Immersive Animated Background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Animated Gradient Orbs */}
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-0 right-0 w-[800px] h-[800px] bg-emerald-500/5 rounded-full blur-[150px]"
        />
        <motion.div
          animate={{
            x: [0, -80, 0],
            y: [0, 100, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[150px]"
        />
        <motion.div
          animate={{
            rotate: [0, 360],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-teal-500/5 rounded-full blur-[120px]"
        />

        {/* Floating Particles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-emerald-400/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -100, 0],
              x: [0, Math.random() * 50 - 25, 0],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: 5 + Math.random() * 10,
              repeat: Infinity,
              delay: Math.random() * 5,
              ease: "easeInOut"
            }}
          />
        ))}

        {/* Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(16, 185, 129, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(16, 185, 129, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }}
        />

        {/* Animated Gradient Mesh */}
        <motion.div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at ${scrollProgress * 100}% 50%, rgba(16, 185, 129, 0.03) 0%, transparent 50%)`,
          }}
        />
      </div>

      {/* Progress Indicator */}
      <div className="fixed top-0 left-0 w-full h-1 bg-white/5 z-50">
        <motion.div
          className="h-full bg-gradient-to-r from-emerald-500 to-teal-400"
          style={{ width: `${scrollProgress * 100}%` }}
        />
      </div>

      {/* SECTION 1: HERO */}
      <section className="relative min-h-screen flex items-center justify-center px-6">
        {/* Animated Glow Behind Text */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          animate={{
            scale: [1, 1.05, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <div className="w-[600px] h-[600px] bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-cyan-500/20 rounded-full blur-[100px]" />
        </motion.div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-6"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-semibold">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              The Future of Food is Here
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-5xl md:text-7xl font-bold mb-6 leading-tight"
          >
            Eat Smarter.
            <br />
            <FlippingText />
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-lg md:text-xl text-gray-400 mb-12 max-w-3xl mx-auto"
          >
            Discover sustainable, safe, and delicious food alternatives powered by advanced AI.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <button
              onClick={() => handleNavigation('/food-search-results')}
              className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-black rounded-full font-bold text-lg hover:shadow-[0_0_40px_rgba(16,185,129,0.3)] transition-all hover:scale-105"
            >
              Start Exploring →
            </button>
            <button
              onClick={() => handleNavigation('/food-comparison-tool')}
              className="px-8 py-4 bg-white/5 border border-white/10 rounded-full font-bold text-lg hover:bg-white/10 transition-all"
            >
              Watch Demo
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1 }}
            className="mt-20 text-gray-600 text-sm"
          >
            Scroll to discover the story ↓
          </motion.div>
        </div>
      </section>

      {/* SECTION 2: THE PROBLEM */}
      <ScrollSection className="relative min-h-screen flex items-center justify-center px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              The <span className="text-red-400">Disconnect</span>
            </h2>
            <div className="w-20 h-1 bg-gradient-to-r from-red-500 to-orange-500 mx-auto rounded-full" />
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-3xl p-8"
            >
              <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mb-6">
                <span className="text-3xl">👨‍⚕️</span>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-red-400">Medical Advice</h3>
              <p className="text-gray-400 leading-relaxed">
                Doctors prescribe abstract dietary guidelines: <span className="text-white font-semibold">"soft diet," "high protein," "avoid saturated fats"</span>
              </p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-br from-orange-500/10 to-yellow-500/10 border border-orange-500/20 rounded-3xl p-8"
            >
              <div className="w-16 h-16 bg-orange-500/20 rounded-2xl flex items-center justify-center mb-6">
                <span className="text-3xl">😕</span>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-orange-400">Patient Confusion</h3>
              <p className="text-gray-400 leading-relaxed">
                Patients struggle to translate generic constraints into <span className="text-white font-semibold">specific, edible meals</span> that fit their local cuisine
              </p>
            </motion.div>
          </div>

          <div className="mt-12 text-center">
            <div className="inline-block px-6 py-3 bg-white/5 border border-white/10 rounded-full">
              <p className="text-gray-400">
                Result: <span className="text-red-400 font-bold">Poor dietary compliance</span> and <span className="text-red-400 font-bold">health outcomes</span>
              </p>
            </div>
          </div>
        </div>
      </ScrollSection>

      {/* SECTION 3: THE SOLUTION */}
      <ScrollSection className="relative min-h-screen flex items-center justify-center px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Meet <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">NutriAI</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Your intelligent culinary interpreter
            </p>
            <div className="w-20 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 mx-auto rounded-full mt-6" />
          </div>

          <div className="bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-cyan-500/10 border border-emerald-500/20 rounded-3xl p-12 backdrop-blur-sm">
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <div className="text-center">
                <div className="w-20 h-20 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">🎯</span>
                </div>
                <h3 className="text-xl font-bold mb-2 text-emerald-400">Context-Aware</h3>
                <p className="text-gray-400 text-sm">Understands functional & nutritional context</p>
              </div>

              <div className="text-center">
                <div className="w-20 h-20 bg-teal-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">🌍</span>
                </div>
                <h3 className="text-xl font-bold mb-2 text-teal-400">Culturally Relevant</h3>
                <p className="text-gray-400 text-sm">Maps to your local cuisine</p>
              </div>

              <div className="text-center">
                <div className="w-20 h-20 bg-cyan-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">🔄</span>
                </div>
                <h3 className="text-xl font-bold mb-2 text-cyan-400">Smart Swaps</h3>
                <p className="text-gray-400 text-sm">Proactive alternative suggestions</p>
              </div>
            </div>

            <div className="bg-black/30 rounded-2xl p-8 border border-white/5">
              <p className="text-lg text-gray-300 leading-relaxed text-center">
                NutriAI functions as a <span className="text-emerald-400 font-bold">culinary interpreter</span>:
                it accepts broad medical or lifestyle constraints and automatically maps them to
                <span className="text-teal-400 font-bold"> specific, culturally relevant dishes</span>.
              </p>
            </div>
          </div>
        </div>
      </ScrollSection>

      {/* SECTION 4: SMART SWAPS IN ACTION */}
      <ScrollSection className="relative min-h-screen flex items-center justify-center px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Smart Swaps <span className="text-emerald-400">in Action</span>
            </h2>
            <p className="text-xl text-gray-400">
              Real examples of intelligent food alternatives
            </p>
            <div className="w-20 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 mx-auto rounded-full mt-6" />
          </div>

          <div className="relative">
            {/* Example Swap */}
            <div className="grid md:grid-cols-3 gap-8 items-center">
              {/* Before */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-red-500/10 border border-red-500/20 rounded-3xl p-8 text-center"
              >
                <div className="w-32 h-32 bg-red-500/20 rounded-2xl mx-auto mb-6 flex items-center justify-center">
                  <span className="text-6xl">🥞</span>
                </div>
                <h3 className="text-2xl font-bold mb-2">Porotta</h3>
                <p className="text-red-400 text-sm mb-4">High fat, not suitable</p>
                <div className="flex gap-2 justify-center flex-wrap">
                  <span className="px-3 py-1 bg-red-500/20 rounded-full text-xs">High Fat</span>
                  <span className="px-3 py-1 bg-red-500/20 rounded-full text-xs">Fried</span>
                </div>
              </motion.div>

              {/* Arrow */}
              <div className="flex justify-center">
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                    boxShadow: [
                      "0 0 20px rgba(16, 185, 129, 0.3)",
                      "0 0 40px rgba(16, 185, 129, 0.6)",
                      "0 0 20px rgba(16, 185, 129, 0.3)"
                    ]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center"
                >
                  <span className="text-2xl">→</span>
                </motion.div>
              </div>

              {/* After */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-8 text-center"
              >
                <div className="w-32 h-32 bg-emerald-500/20 rounded-2xl mx-auto mb-6 flex items-center justify-center">
                  <span className="text-6xl">🍚</span>
                </div>
                <h3 className="text-2xl font-bold mb-2">Idli / Steamed Banana</h3>
                <p className="text-emerald-400 text-sm mb-4">Perfect alternative</p>
                <div className="flex gap-2 justify-center flex-wrap">
                  <span className="px-3 py-1 bg-emerald-500/20 rounded-full text-xs">Low Fat</span>
                  <span className="px-3 py-1 bg-emerald-500/20 rounded-full text-xs">Steamed</span>
                  <span className="px-3 py-1 bg-emerald-500/20 rounded-full text-xs">Soft</span>
                </div>
              </motion.div>
            </div>

            <div className="mt-12 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl p-6 text-center">
              <p className="text-gray-300">
                <span className="text-emerald-400 font-bold">For a patient on a restrictive diet:</span>
                {" "}NutriAI automatically suggests safe alternatives that maintain cultural authenticity
              </p>
            </div>
          </div>
        </div>
      </ScrollSection>

      {/* SECTION 5: NUTRIAI STATISTICS */}
      <ScrollSection className="relative min-h-screen flex items-center justify-center px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Trusted by <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">Thousands</span>
            </h2>
            <div className="w-20 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 mx-auto rounded-full" />
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Users Helped */}
            <motion.div
              whileHover={{ y: -10, scale: 1.02 }}
              className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-3xl p-10 text-center backdrop-blur-sm relative overflow-hidden group"
            >
              {/* Glow effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 to-teal-500/0 group-hover:from-emerald-500/5 group-hover:to-teal-500/5 transition-all duration-500" />

              <div className="relative z-10">
                <div className="w-20 h-20 bg-emerald-500/20 rounded-2xl mx-auto mb-6 flex items-center justify-center">
                  <span className="text-4xl">👥</span>
                </div>
                <div className="text-6xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                  <AnimatedCounter end={1000} />
                </div>
                <h3 className="text-xl font-semibold text-gray-300">Users Helped</h3>
              </div>
            </motion.div>

            {/* Compliance Rate */}
            <motion.div
              whileHover={{ y: -10, scale: 1.02 }}
              className="bg-gradient-to-br from-teal-500/10 to-cyan-500/10 border border-teal-500/20 rounded-3xl p-10 text-center backdrop-blur-sm relative overflow-hidden group"
            >
              {/* Glow effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-teal-500/0 to-cyan-500/0 group-hover:from-teal-500/5 group-hover:to-cyan-500/5 transition-all duration-500" />

              <div className="relative z-10">
                <div className="w-20 h-20 bg-teal-500/20 rounded-2xl mx-auto mb-6 flex items-center justify-center">
                  <span className="text-4xl">✓</span>
                </div>
                <div className="text-6xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
                  <AnimatedCounter end={95} suffix="%" />
                </div>
                <h3 className="text-xl font-semibold text-gray-300">Compliance Rate</h3>
              </div>
            </motion.div>

            {/* Food Alternatives */}
            <motion.div
              whileHover={{ y: -10, scale: 1.02 }}
              className="bg-gradient-to-br from-cyan-500/10 to-emerald-500/10 border border-cyan-500/20 rounded-3xl p-10 text-center backdrop-blur-sm relative overflow-hidden group"
            >
              {/* Glow effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 to-emerald-500/0 group-hover:from-cyan-500/5 group-hover:to-emerald-500/5 transition-all duration-500" />

              <div className="relative z-10">
                <div className="w-20 h-20 bg-cyan-500/20 rounded-2xl mx-auto mb-6 flex items-center justify-center">
                  <span className="text-4xl">🍽️</span>
                </div>
                <div className="text-6xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                  <AnimatedCounter end={200} />
                </div>
                <h3 className="text-xl font-semibold text-gray-300">Food Alternatives</h3>
              </div>
            </motion.div>
          </div>
        </div>
      </ScrollSection>

      {/* SECTION 6: IMPACT */}
      <ScrollSection className="relative min-h-screen flex items-center justify-center px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              The <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">Impact</span>
            </h2>
            <div className="w-20 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 mx-auto rounded-full" />
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <motion.div
              whileHover={{ y: -10 }}
              className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-3xl p-8 text-center"
            >
              <div className="text-5xl font-bold text-emerald-400 mb-4">✓</div>
              <h3 className="text-xl font-bold mb-3">Strict Adherence</h3>
              <p className="text-gray-400">Follow health guidelines without compromise</p>
            </motion.div>

            <motion.div
              whileHover={{ y: -10 }}
              className="bg-gradient-to-br from-teal-500/10 to-cyan-500/10 border border-teal-500/20 rounded-3xl p-8 text-center"
            >
              <div className="text-5xl font-bold text-teal-400 mb-4">🍽️</div>
              <h3 className="text-xl font-bold mb-3">Cultural Authenticity</h3>
              <p className="text-gray-400">Maintain familiarity and taste of daily meals</p>
            </motion.div>

            <motion.div
              whileHover={{ y: -10 }}
              className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-3xl p-8 text-center"
            >
              <div className="text-5xl font-bold text-cyan-400 mb-4">📈</div>
              <h3 className="text-xl font-bold mb-3">Better Outcomes</h3>
              <p className="text-gray-400">Improved long-term dietary compliance</p>
            </motion.div>
          </div>

          <div className="bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-cyan-500/20 border border-emerald-500/30 rounded-3xl p-12 text-center backdrop-blur-sm">
            <h3 className="text-3xl font-bold mb-6">
              Empowering healthier lives through intelligent food choices
            </h3>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              NutriAI bridges the gap between medical advice and daily meals, making healthy eating accessible, culturally relevant, and sustainable.
            </p>
            <button
              onClick={() => handleNavigation('/food-search-results')}
              className="px-10 py-5 bg-gradient-to-r from-emerald-500 to-teal-500 text-black rounded-full font-bold text-xl hover:shadow-[0_0_50px_rgba(16,185,129,0.4)] transition-all hover:scale-110"
            >
              Start Your Journey →
            </button>
          </div>
        </div>
      </ScrollSection>

      {/* Footer */}
      <footer className="py-12 border-t border-white/10 text-center text-gray-500 text-sm">
        <p>&copy; 2025 NutriSwap. Designed for the future.</p>
      </footer>
    </div>
  );
};

export default LandingPage;