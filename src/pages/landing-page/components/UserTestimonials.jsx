import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';

const UserTestimonials = () => {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const testimonials = [
    {
      id: 1,
      name: 'Sarah Johnson',
      role: 'Nutritionist & Wellness Coach',
      avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg',
      content: `Smart Alternatives Finder has revolutionized how I help my clients discover healthier food options. The detailed nutrition analysis and allergen warnings are incredibly accurate and save me hours of research.`,
      rating: 5,
      location: 'San Francisco, CA'
    },
    {
      id: 2,
      name: 'Michael Chen',
      role: 'Food Allergy Parent',
      avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg',
      content: `As a parent of a child with multiple food allergies, this platform has been a lifesaver. The comprehensive allergen database and instant alternative suggestions give me peace of mind when meal planning.`,
      rating: 5,
      location: 'Austin, TX'
    },
    {
      id: 3,
      name: 'Emma Rodriguez',
      role: 'Fitness Enthusiast',
      avatar: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg',
      content: `The sustainability scoring feature aligns perfectly with my values. I can make environmentally conscious food choices while meeting my fitness goals. The platform makes healthy eating effortless.`,
      rating: 5,
      location: 'Denver, CO'
    },
    {
      id: 4,
      name: 'David Thompson',
      role: 'Chef & Restaurant Owner',
      avatar: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg',
      content: `This tool has helped me create innovative menu alternatives for customers with dietary restrictions. The detailed ingredient analysis and substitute recommendations are incredibly valuable for my business.`,
      rating: 5,
      location: 'Portland, OR'
    },
    {
      id: 5,
      name: 'Lisa Park',
      role: 'Registered Dietitian',
      avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg',
      content: `The scientific backing and USDA-verified nutrition data make this platform trustworthy for professional use. I recommend it to all my clients looking to make informed dietary changes.`,
      rating: 5,
      location: 'Seattle, WA'
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials?.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [testimonials?.length]);

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials?.length);
  };

  const prevTestimonial = () => {
    setCurrentTestimonial((prev) => (prev - 1 + testimonials?.length) % testimonials?.length);
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Icon
        key={i}
        name="Star"
        size={16}
        className={i < rating ? 'text-yellow-400 fill-current' : 'text-muted-foreground'}
      />
    ));
  };

  return (
    <section className="py-20 px-6 bg-gradient-to-b from-slate-900 to-slate-800 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-secondary/5 via-transparent to-accent/5"></div>
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            What Our
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-secondary ml-3">
              Users Say
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Join thousands of satisfied users who have transformed their food choices with our platform
          </p>
        </motion.div>

        {/* Main Testimonial Display */}
        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentTestimonial}
              className="glass rounded-2xl p-8 md:p-12 border border-glass-border shadow-glass-lg"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8">
                {/* Avatar and User Info */}
                <div className="flex-shrink-0 text-center lg:text-left">
                  <div className="relative mb-4">
                    <Image
                      src={testimonials?.[currentTestimonial]?.avatar}
                      alt={testimonials?.[currentTestimonial]?.name}
                      className="w-24 h-24 rounded-full object-cover border-4 border-accent/30 mx-auto lg:mx-0"
                    />
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-accent rounded-full flex items-center justify-center">
                      <Icon name="Quote" size={16} className="text-slate-900" />
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold text-foreground mb-1">
                    {testimonials?.[currentTestimonial]?.name}
                  </h3>
                  <p className="text-accent font-medium mb-2">
                    {testimonials?.[currentTestimonial]?.role}
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    {testimonials?.[currentTestimonial]?.location}
                  </p>
                  
                  {/* Rating */}
                  <div className="flex justify-center lg:justify-start gap-1">
                    {renderStars(testimonials?.[currentTestimonial]?.rating)}
                  </div>
                </div>

                {/* Testimonial Content */}
                <div className="flex-1">
                  <blockquote className="text-lg md:text-xl text-foreground leading-relaxed italic">
                    "{testimonials?.[currentTestimonial]?.content}"
                  </blockquote>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Controls */}
          <div className="flex justify-center items-center mt-8 gap-4">
            <button
              onClick={prevTestimonial}
              className="w-12 h-12 rounded-full glass border border-glass-border flex items-center justify-center text-muted-foreground hover:text-accent hover:border-accent/30 transition-all duration-300"
              aria-label="Previous testimonial"
            >
              <Icon name="ChevronLeft" size={20} />
            </button>

            {/* Dots Indicator */}
            <div className="flex gap-2">
              {testimonials?.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentTestimonial
                      ? 'bg-accent shadow-neon'
                      : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                  }`}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>

            <button
              onClick={nextTestimonial}
              className="w-12 h-12 rounded-full glass border border-glass-border flex items-center justify-center text-muted-foreground hover:text-accent hover:border-accent/30 transition-all duration-300"
              aria-label="Next testimonial"
            >
              <Icon name="ChevronRight" size={20} />
            </button>
          </div>
        </div>

        {/* Testimonial Grid Preview */}
        <motion.div
          className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
        >
          {testimonials?.slice(0, 3)?.map((testimonial, index) => (
            <div
              key={testimonial?.id}
              className={`glass rounded-xl p-6 border border-glass-border cursor-pointer transition-all duration-300 ${
                index === currentTestimonial % 3
                  ? 'border-accent/50 shadow-neon'
                  : 'hover:border-accent/30'
              }`}
              onClick={() => setCurrentTestimonial(index)}
            >
              <div className="flex items-center mb-4">
                <Image
                  src={testimonial?.avatar}
                  alt={testimonial?.name}
                  className="w-12 h-12 rounded-full object-cover mr-3"
                />
                <div>
                  <h4 className="font-semibold text-foreground text-sm">
                    {testimonial?.name}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {testimonial?.role}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-1 mb-3">
                {renderStars(testimonial?.rating)}
              </div>
              
              <p className="text-sm text-muted-foreground line-clamp-3">
                {testimonial?.content}
              </p>
            </div>
          ))}
        </motion.div>

        {/* Trust Metrics */}
        <motion.div
          className="mt-16 text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          viewport={{ once: true }}
        >
          <div className="glass rounded-xl p-8 border border-glass-border">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <div className="text-3xl font-bold text-accent mb-2">4.9/5</div>
                <div className="text-sm text-muted-foreground">Average Rating</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-accent mb-2">50K+</div>
                <div className="text-sm text-muted-foreground">Happy Users</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-accent mb-2">99%</div>
                <div className="text-sm text-muted-foreground">Satisfaction Rate</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default UserTestimonials;