/** Shared Framer Motion presets for the marketing landing page. */

export const EASE_OUT_EXPO = [0.22, 1, 0.36, 1];

export const VIEWPORT = {
  once: true,
  amount: 0.15,
  margin: '-80px 0px -60px 0px',
};

export const transition = {
  smooth: { duration: 0.7, ease: EASE_OUT_EXPO },
  snappy: { duration: 0.55, ease: EASE_OUT_EXPO },
  slow: { duration: 0.85, ease: EASE_OUT_EXPO },
};

export const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0 },
};

export const fadeUpSoft = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.94, y: 16 },
  visible: { opacity: 1, scale: 1, y: 0 },
};

export const slideFromLeft = {
  hidden: { opacity: 0, x: -36 },
  visible: { opacity: 1, x: 0 },
};

export const slideFromRight = {
  hidden: { opacity: 0, x: 36 },
  visible: { opacity: 1, x: 0 },
};

export const staggerItem = {
  hidden: { opacity: 0, y: 36, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: transition.smooth,
  },
};

export const staggerContainer = (stagger = 0.1, delay = 0.05) => ({
  hidden: {},
  visible: {
    transition: {
      staggerChildren: stagger,
      delayChildren: delay,
    },
  },
});

export const heroImage = {
  hidden: { opacity: 0, scale: 0.88, y: 12 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.85, ease: EASE_OUT_EXPO },
  },
};

export const heroContent = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.15,
    },
  },
};

export const heroLine = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.75, ease: EASE_OUT_EXPO },
  },
};
