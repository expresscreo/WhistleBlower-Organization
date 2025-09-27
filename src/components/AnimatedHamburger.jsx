import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

const AnimatedHamburger = ({ isOpen, onClick, className = "" }) => {
  return (
    <button
      onClick={onClick}
      className={`relative z-[60] md:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-[#212121cc] transition-colors ${className}`}
      aria-label={isOpen ? "Close menu" : "Open menu"}
      type="button"
    >
      <div className="w-6 h-6 flex flex-col justify-center items-center relative">
        {/* Top line - morphs into arrow */}
        <motion.span
          className="w-5 h-0.5 bg-foreground block absolute"
          animate={{
            rotate: isOpen ? 135 : 0,
            y: isOpen ? 0 : -6,
            x: isOpen ? 0 : 0,
            scaleX: isOpen ? 0.7 : 1,
            transformOrigin: "center"
          }}
          transition={{ 
            duration: 0.4, 
            ease: [0.4, 0, 0.2, 1]
          }}
        />
        
        {/* Middle line - becomes horizontal line of arrow */}
        <motion.span
          className="w-5 h-0.5 bg-foreground block absolute"
          animate={{
            rotate: isOpen ? 180 : 0,
            scaleX: isOpen ? 0.8 : 1,
            opacity: isOpen ? 1 : 1
          }}
          transition={{ 
            duration: 0.4, 
            ease: [0.4, 0, 0.2, 1],
            delay: isOpen ? 0.1 : 0
          }}
        />
        
        {/* Bottom line - morphs into arrow */}
        <motion.span
          className="w-5 h-0.5 bg-foreground block absolute"
          animate={{
            rotate: isOpen ? 45 : 0,
            y: isOpen ? 0 : 6,
            x: isOpen ? 0 : 0,
            scaleX: isOpen ? 0.7 : 1,
            transformOrigin: "center"
          }}
          transition={{ 
            duration: 0.4, 
            ease: [0.4, 0, 0.2, 1]
          }}
        />
      </div>
    </button>
  );
};

export default AnimatedHamburger;
