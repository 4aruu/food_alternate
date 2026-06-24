import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

const STATUS_MESSAGES = [
  { text: "Connecting to servers…", icon: "🔌" },
  { text: "Waking up the kitchen…", icon: "👨‍🍳" },
  { text: "Warming up the ovens…", icon: "🔥" },
  { text: "Preparing fresh ingredients…", icon: "🥗" },
  { text: "Almost ready to serve…", icon: "🍽️" },
  { text: "Just a moment longer…", icon: "⏳" },
];

const BackendWakeUp = ({ children }) => {
  const [isReady, setIsReady] = useState(false);
  const [isFading, setIsFading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const retryRef = useRef(0);
  const maxRetries = 15; // ~75 seconds total (5s intervals)
  const minDisplayTime = 1500; // Show animation for at least 1.5s
  const startTime = useRef(Date.now());

  // Cycle through status messages
  useEffect(() => {
    if (isReady || hasError) return;

    const interval = setInterval(() => {
      setMessageIndex((prev) => {
        const next = prev + 1;
        return next < STATUS_MESSAGES.length ? next : prev;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [isReady, hasError]);

  // Ping the backend health endpoint
  useEffect(() => {
    let cancelled = false;
    let timeout;

    const pingBackend = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const response = await fetch(`${API_BASE}/health`, {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!cancelled && response.ok) {
          // Ensure minimum display time for smooth UX
          const elapsed = Date.now() - startTime.current;
          const remaining = Math.max(0, minDisplayTime - elapsed);

          setTimeout(() => {
            if (!cancelled) {
              setIsFading(true);
              setTimeout(() => {
                if (!cancelled) setIsReady(true);
              }, 600);
            }
          }, remaining);
          return;
        }
      } catch (err) {
        // Network error or timeout — retry
      }

      if (!cancelled) {
        retryRef.current += 1;
        setRetryCount(retryRef.current);

        if (retryRef.current >= maxRetries) {
          setHasError(true);
        } else {
          timeout = setTimeout(pingBackend, 5000);
        }
      }
    };

    pingBackend();

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, []);

  const handleRetry = () => {
    setHasError(false);
    setRetryCount(0);
    retryRef.current = 0;
    setMessageIndex(0);
    startTime.current = Date.now();

    // Trigger re-mount by toggling a key — instead, just re-run the effect
    window.location.reload();
  };

  // If backend is ready, render the app
  if (isReady) {
    return children;
  }

  return (
    <>
      {/* Render children hidden underneath so React hydrates routes */}
      <div style={{ display: 'none' }}>{children}</div>

      {/* Full-screen Wake-Up Overlay */}
      <AnimatePresence>
        {!isReady && (
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: isFading ? 0 : 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black"
          >
            {/* Background ambient effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <motion.div
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.15, 0.25, 0.15],
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/20 rounded-full blur-[120px]"
              />
              <motion.div
                animate={{
                  scale: [1.2, 1, 1.2],
                  opacity: [0.1, 0.2, 0.1],
                }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute top-1/4 right-1/4 w-[300px] h-[300px] bg-teal-500/15 rounded-full blur-[100px]"
              />
            </div>

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center text-center px-6">
              {hasError ? (
                /* ── Error State ── */
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                  className="flex flex-col items-center"
                >
                  {/* Error icon */}
                  <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-6">
                    <motion.span
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 0.5, repeat: 2 }}
                      className="text-4xl"
                    >
                      ⚠️
                    </motion.span>
                  </div>

                  <h2 className="text-2xl font-bold text-white mb-2">
                    Server is Taking a Nap
                  </h2>
                  <p className="text-gray-400 max-w-sm mb-8 leading-relaxed">
                    Our free server takes a moment to wake up after inactivity.
                    This usually takes 30–60 seconds.
                  </p>

                  <button
                    onClick={handleRetry}
                    className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-black rounded-full font-bold text-base hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all hover:scale-105 active:scale-95"
                  >
                    Try Again →
                  </button>
                </motion.div>
              ) : (
                /* ── Loading State ── */
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center"
                >
                  {/* Animated food logo / pulse ring */}
                  <div className="relative w-24 h-24 mb-8">
                    {/* Outer pulsing ring */}
                    <motion.div
                      animate={{ scale: [1, 1.6, 1], opacity: [0.3, 0, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                      className="absolute inset-0 rounded-full border-2 border-emerald-500/40"
                    />
                    {/* Middle pulsing ring */}
                    <motion.div
                      animate={{ scale: [1, 1.35, 1], opacity: [0.4, 0, 0.4] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.4 }}
                      className="absolute inset-0 rounded-full border-2 border-teal-500/30"
                    />
                    {/* Center icon */}
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center backdrop-blur-sm">
                        <span className="text-3xl">🥗</span>
                      </div>
                    </motion.div>
                  </div>

                  {/* App name */}
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Nutri<span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">Swap</span>
                  </h2>

                  {/* Animated status message */}
                  <div className="h-7 relative overflow-hidden mb-6">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={messageIndex}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        transition={{ duration: 0.4 }}
                        className="flex items-center gap-2 text-gray-400 text-sm"
                      >
                        <span>{STATUS_MESSAGES[messageIndex].icon}</span>
                        <span>{STATUS_MESSAGES[messageIndex].text}</span>
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  {/* Progress bar */}
                  <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                      initial={{ width: "5%" }}
                      animate={{
                        width: retryCount >= maxRetries
                          ? "100%"
                          : `${Math.min(5 + (retryCount / maxRetries) * 90, 95)}%`,
                      }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  </div>

                  {/* Retry hint after a few attempts */}
                  {retryCount >= 3 && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-gray-600 text-xs mt-4"
                    >
                      Free servers may take up to 60s to wake up
                    </motion.p>
                  )}
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default BackendWakeUp;
