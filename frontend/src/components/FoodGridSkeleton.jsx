import React from 'react';
import { motion } from 'framer-motion';

/**
 * FoodCardSkeleton — animated loading placeholder for food cards.
 * Use in grid layouts while data is loading.
 */
const FoodCardSkeleton = () => (
  <div className="relative h-80 rounded-3xl overflow-hidden border border-white/5 bg-[#1a1a1a]">
    {/* Shimmer effect */}
    <motion.div
      className="absolute inset-0"
      animate={{
        background: [
          'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.03) 50%, transparent 100%)',
          'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.03) 50%, transparent 100%)',
        ],
        backgroundPosition: ['-200% 0', '200% 0'],
      }}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
      style={{ backgroundSize: '200% 100%' }}
    />

    {/* Score badge placeholder */}
    <div className="absolute top-4 right-4 w-16 h-6 bg-white/5 rounded-full" />

    {/* Bottom content placeholder */}
    <div className="absolute bottom-0 left-0 right-0 p-6">
      <div className="w-3/4 h-5 bg-white/5 rounded-lg mb-2" />
      <div className="w-1/2 h-4 bg-white/5 rounded-lg mb-4" />
      <div className="flex gap-4 border-t border-white/10 pt-4">
        <div className="w-16 h-3 bg-white/5 rounded" />
        <div className="w-16 h-3 bg-white/5 rounded" />
      </div>
    </div>
  </div>
);

/**
 * FoodGridSkeleton — renders a grid of skeleton cards.
 * Props:
 *   count – number of skeleton cards to show (default 6)
 */
const FoodGridSkeleton = ({ count = 6 }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
    {[...Array(count)].map((_, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: i * 0.1, duration: 0.3 }}
      >
        <FoodCardSkeleton />
      </motion.div>
    ))}
  </div>
);

export { FoodCardSkeleton, FoodGridSkeleton };
export default FoodGridSkeleton;
