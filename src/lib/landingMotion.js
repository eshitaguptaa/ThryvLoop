/** Shared Framer Motion presets for the marketing landing page. */

/** Smooth deceleration — less snap than expo, reads better on scroll. */
export const EASE_SMOOTH = [0.25, 0.46, 0.45, 0.94];

export const VIEWPORT = {
  once: true,
  /** Fire as soon as any part of the element enters the viewport. */
  amount: 0.08,
  margin: '0px 0px -5% 0px',
};

export const transition = {
  smooth: { type: 'tween', duration: 0.55, ease: EASE_SMOOTH },
  snappy: { type: 'tween', duration: 0.45, ease: EASE_SMOOTH },
  slow: { type: 'tween', duration: 0.65, ease: EASE_SMOOTH },
};

/** Opacity + translate only — no scale on scroll reveals (scale repaints large cards). */
export const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export const fadeUpSoft = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0 },
};

export const scaleIn = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

export const slideFromLeft = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 },
};

export const slideFromRight = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0 },
};

export const staggerItem = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: transition.smooth,
  },
};

export const staggerContainer = (stagger = 0.08, delay = 0.04) => ({
  hidden: {},
  visible: {
    transition: {
      staggerChildren: stagger,
      delayChildren: delay,
    },
  },
});

export const heroImage = {
  hidden: { opacity: 0, scale: 0.94, y: 10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'tween', duration: 0.75, ease: EASE_SMOOTH },
  },
};

export const heroContent = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.12,
    },
  },
};

export const heroLine = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'tween', duration: 0.65, ease: EASE_SMOOTH },
  },
};

/** Promote animated elements to their own compositor layer. */
export const motionLayer = {
  style: {
    backfaceVisibility: 'hidden',
    WebkitBackfaceVisibility: 'hidden',
  },
  className: 'transform-gpu',
};
