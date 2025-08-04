import React from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';

// Optimized animation variants for better performance
const optimizedVariants = {
  // Fade in/out with reduced complexity
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.2, ease: 'easeInOut' }
  },
  
  // Slide animations with hardware acceleration
  slideUp: {
    initial: { y: 20, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: -20, opacity: 0 },
    transition: { 
      duration: 0.3, 
      ease: [0.4, 0.0, 0.2, 1],
      willChange: 'transform, opacity'
    }
  },
  
  slideDown: {
    initial: { y: -20, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: 20, opacity: 0 },
    transition: { 
      duration: 0.3, 
      ease: [0.4, 0.0, 0.2, 1],
      willChange: 'transform, opacity'
    }
  },
  
  // Scale animations for buttons and cards
  scale: {
    initial: { scale: 0.95, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.95, opacity: 0 },
    transition: { 
      duration: 0.2, 
      ease: 'easeOut',
      willChange: 'transform, opacity'
    }
  },
  
  // List item animations
  listItem: {
    initial: { x: -20, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: 20, opacity: 0 },
    transition: { 
      duration: 0.3,
      ease: 'easeInOut',
      willChange: 'transform, opacity'
    }
  }
};

// Optimized AnimatePresence wrapper
export const OptimizedAnimatePresence: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AnimatePresence mode="wait" initial={false}>
    {children}
  </AnimatePresence>
);

// Optimized motion.div with performance optimizations
export const OptimizedMotionDiv: React.FC<{
  children: React.ReactNode;
  className?: string;
  variants?: any;
  initial?: string;
  animate?: string;
  exit?: string;
  layout?: boolean;
  layoutId?: string;
}> = ({ 
  children, 
  className, 
  variants = optimizedVariants.fade,
  initial = 'initial',
  animate = 'animate',
  exit = 'exit',
  layout = false,
  layoutId
}) => (
  <motion.div
    className={className}
    variants={variants}
    initial={initial}
    animate={animate}
    exit={exit}
    layout={layout}
    layoutId={layoutId}
    style={{
      willChange: 'transform, opacity',
      backfaceVisibility: 'hidden',
      transform: 'translateZ(0)' // Force hardware acceleration
    }}
  >
    {children}
  </motion.div>
);

// Optimized list container with LayoutGroup
export const OptimizedListContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <LayoutGroup>
    <motion.div
      className="space-y-2"
      style={{
        willChange: 'transform',
        backfaceVisibility: 'hidden'
      }}
    >
      {children}
    </motion.div>
  </LayoutGroup>
);

// Optimized list item with reduced re-renders
export const OptimizedListItem: React.FC<{
  children: React.ReactNode;
  className?: string;
  layoutId?: string;
}> = ({ children, className, layoutId }) => (
  <motion.div
    className={className}
    variants={optimizedVariants.listItem}
    layoutId={layoutId}
    style={{
      willChange: 'transform, opacity',
      backfaceVisibility: 'hidden',
      transform: 'translateZ(0)'
    }}
  >
    {children}
  </motion.div>
);

// Optimized button with hover animations
export const OptimizedButton: React.FC<{
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}> = ({ children, className, onClick, disabled }) => (
  <motion.button
    className={className}
    onClick={onClick}
    disabled={disabled}
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    transition={{
      duration: 0.1,
      ease: 'easeInOut',
      willChange: 'transform'
    }}
    style={{
      willChange: 'transform',
      backfaceVisibility: 'hidden',
      transform: 'translateZ(0)'
    }}
  >
    {children}
  </motion.button>
);

// Optimized card component
export const OptimizedCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  layoutId?: string;
}> = ({ children, className, layoutId }) => (
  <motion.div
    className={className}
    variants={optimizedVariants.scale}
    layoutId={layoutId}
    style={{
      willChange: 'transform, opacity',
      backfaceVisibility: 'hidden',
      transform: 'translateZ(0)'
    }}
  >
    {children}
  </motion.div>
);

// Performance-optimized modal backdrop
export const OptimizedModalBackdrop: React.FC<{
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
}> = ({ children, isOpen, onClose }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        style={{
          willChange: 'opacity',
          backfaceVisibility: 'hidden'
        }}
      >
        <motion.div
          className="bg-slate-800 rounded-lg border border-slate-700 max-w-2xl w-full mx-4"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          onClick={(e) => e.stopPropagation()}
          style={{
            willChange: 'transform, opacity',
            backfaceVisibility: 'hidden',
            transform: 'translateZ(0)'
          }}
        >
          {children}
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
); 