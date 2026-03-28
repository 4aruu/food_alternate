import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const words = [
  "Live Better.",
  "Eat Healthier.",
  "Choose Wisely.",
  "Feel Stronger."
];

const FlippingText = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, 3000); // Change every 3 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    // 👇 ADDED 'min-w-[300px]' and 'w-full' to prevent collapsing
    <div className="relative h-[1.5em] w-full min-w-[300px] overflow-hidden flex justify-center items-center">
      <AnimatePresence mode="wait">
        <motion.span
          key={index}
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          // 👇 Added 'whitespace-nowrap' to keep text on one line
          className="absolute block text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500 font-bold whitespace-nowrap pb-2"
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </div>
  );
};

export default FlippingText;