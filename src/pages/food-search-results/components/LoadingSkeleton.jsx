import React from 'react';
import { motion } from 'framer-motion';

const LoadingSkeleton = ({ count = 12 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count })?.map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05, duration: 0.3 }}
          className="glass rounded-xl border border-glass-border overflow-hidden"
        >
          {/* Image Skeleton */}
          <div className="h-48 bg-gradient-to-r from-muted/30 via-muted/50 to-muted/30 animate-shimmer relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
          </div>

          {/* Content Skeleton */}
          <div className="p-6 space-y-4">
            {/* Title */}
            <div className="space-y-2">
              <div className="h-5 bg-gradient-to-r from-muted/30 via-muted/50 to-muted/30 rounded animate-shimmer"></div>
              <div className="h-4 bg-gradient-to-r from-muted/30 via-muted/50 to-muted/30 rounded w-3/4 animate-shimmer"></div>
            </div>

            {/* Nutrition Grid */}
            <div className="space-y-2">
              <div className="h-4 bg-gradient-to-r from-muted/30 via-muted/50 to-muted/30 rounded w-1/2 animate-shimmer"></div>
              <div className="grid grid-cols-2 gap-2">
                {Array.from({ length: 4 })?.map((_, idx) => (
                  <div key={idx} className="h-3 bg-gradient-to-r from-muted/30 via-muted/50 to-muted/30 rounded animate-shimmer"></div>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div className="flex space-x-2">
              {Array.from({ length: 3 })?.map((_, idx) => (
                <div key={idx} className="h-6 w-16 bg-gradient-to-r from-muted/30 via-muted/50 to-muted/30 rounded animate-shimmer"></div>
              ))}
            </div>

            {/* Price */}
            <div className="flex justify-between items-center">
              <div className="h-4 bg-gradient-to-r from-muted/30 via-muted/50 to-muted/30 rounded w-1/3 animate-shimmer"></div>
              <div className="h-4 bg-gradient-to-r from-muted/30 via-muted/50 to-muted/30 rounded w-1/4 animate-shimmer"></div>
            </div>

            {/* Buttons */}
            <div className="flex space-x-2">
              <div className="h-9 bg-gradient-to-r from-muted/30 via-muted/50 to-muted/30 rounded flex-1 animate-shimmer"></div>
              <div className="h-9 w-9 bg-gradient-to-r from-muted/30 via-muted/50 to-muted/30 rounded animate-shimmer"></div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default LoadingSkeleton;