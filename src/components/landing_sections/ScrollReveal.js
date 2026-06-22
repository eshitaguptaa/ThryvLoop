'use client';

import { motion, useReducedMotion } from 'framer-motion';
import {
  VIEWPORT,
  fadeUp,
  fadeUpSoft,
  scaleIn,
  slideFromLeft,
  slideFromRight,
  staggerContainer,
  staggerItem,
  transition,
  motionLayer,
} from '@/lib/landingMotion';

const VARIANTS = {
  fadeUp,
  fadeUpSoft,
  scaleIn,
  slideFromLeft,
  slideFromRight,
};

function layerClass(className = '') {
  return [motionLayer.className, className].filter(Boolean).join(' ');
}

/**
 * Reveals content when it scrolls into view.
 */
export function ScrollReveal({
  children,
  className = '',
  variant = 'fadeUp',
  delay = 0,
  duration,
  as = 'div',
}) {
  const reduced = useReducedMotion();
  const Component = motion[as] ?? motion.div;
  const variants = VARIANTS[variant] ?? fadeUp;

  if (reduced) {
    const staticTags = { section: 'section', header: 'header', footer: 'footer', main: 'main' };
    const Tag = staticTags[as] || 'div';
    return <Tag className={className}>{children}</Tag>;
  }

  return (
    <Component
      className={layerClass(className)}
      style={motionLayer.style}
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT}
      variants={variants}
      transition={{
        ...transition.smooth,
        delay,
        ...(duration != null ? { duration } : {}),
      }}
    >
      {children}
    </Component>
  );
}

/**
 * Staggers child ScrollItem animations inside a grid or list.
 */
export function ScrollStagger({
  children,
  className = '',
  stagger = 0.08,
  delay = 0.04,
}) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={layerClass(className)}
      style={motionLayer.style}
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT}
      variants={staggerContainer(stagger, delay)}
    >
      {children}
    </motion.div>
  );
}

/** Single stagger child — use inside ScrollStagger. */
export function ScrollItem({ children, className = '' }) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={layerClass(className)}
      style={motionLayer.style}
      variants={staggerItem}
    >
      {children}
    </motion.div>
  );
}

/**
 * Hero mount animation (not scroll-triggered).
 */
export function HeroReveal({
  children,
  className = '',
  variants,
  delay = 0,
  style,
}) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className} style={style}>{children}</div>;

  return (
    <motion.div
      className={layerClass(className)}
      style={{ ...motionLayer.style, ...style }}
      initial="hidden"
      animate="visible"
      variants={variants}
      transition={{ delay, type: 'tween', ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </motion.div>
  );
}
