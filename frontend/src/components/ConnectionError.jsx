import React from 'react';
import { motion } from 'framer-motion';
import Icon from './AppIcon';

/**
 * ConnectionError — full-section error state when the backend API fails.
 * Props:
 *   message   – optional custom message
 *   onRetry   – callback to retry the fetch
 *   compact   – if true, renders a smaller inline banner instead of full-page
 */
const ConnectionError = ({
  message = "Unable to reach the server. It may be waking up from sleep.",
  onRetry,
  compact = false,
}) => {
  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-2xl px-5 py-4 mx-auto max-w-xl"
      >
        <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
          <Icon name="WifiOff" size={18} className="text-red-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-300 leading-snug">{message}</p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-white/10 hover:bg-white/15 border border-white/10 rounded-full text-xs font-medium text-white transition-all flex-shrink-0 flex items-center gap-1.5"
          >
            <Icon name="RefreshCw" size={12} />
            Retry
          </button>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="text-center py-20 px-6"
    >
      <div className="max-w-md mx-auto">
        {/* Animated icon */}
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="mb-6 inline-flex"
        >
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-red-500/20 flex items-center justify-center">
            <Icon name="WifiOff" size={32} className="text-red-400" />
          </div>
        </motion.div>

        <h3 className="text-2xl font-bold text-white mb-2">Connection Lost</h3>
        <p className="text-gray-400 mb-8 leading-relaxed">{message}</p>

        {onRetry && (
          <button
            onClick={onRetry}
            className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-black rounded-full font-bold text-sm hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all hover:scale-105 active:scale-95 inline-flex items-center gap-2"
          >
            <Icon name="RefreshCw" size={16} />
            Try Again
          </button>
        )}

        <p className="text-gray-600 text-xs mt-6">
          Free servers may take 30–60 seconds to wake up after inactivity
        </p>
      </div>
    </motion.div>
  );
};

export default ConnectionError;
