'use client';

import { motion } from 'framer-motion';

/**
 * Shimmer block used inside dashboard metric skeletons.
 * @param {{ className?: string, delay?: number }} props
 */
export function SkeletonPulse({ className = '', delay = 0 }) {
  return (
    <div
      className={`dash-skeleton-pulse ${className}`.trim()}
      style={delay ? { animationDelay: `${delay}s` } : undefined}
      aria-hidden
    />
  );
}

/**
 * Animated placeholder that mirrors the Productive time card layout.
 */
export default function ProductiveTimeSkeleton() {
  return (
    <motion.div
      className="dash-metric-skeleton"
      initial={{ opacity: 0.55 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading productive time"
    >
      <div className="mb-4 flex items-end gap-2 sm:mb-5">
        <SkeletonPulse className="h-12 w-14 rounded-xl sm:h-14 sm:w-16 md:h-16 md:w-[4.5rem]" />
        <SkeletonPulse className="mb-2 h-5 w-5 rounded-md" delay={0.05} />
        <SkeletonPulse className="h-12 w-14 rounded-xl sm:h-14 sm:w-16 md:h-16 md:w-[4.5rem]" delay={0.08} />
        <SkeletonPulse className="mb-2 h-5 w-5 rounded-md" delay={0.12} />
      </div>
      <SkeletonPulse className="mb-5 h-3 w-48 max-w-full rounded-full sm:mb-6" delay={0.1} />

      <div className="mb-2 flex items-center justify-between gap-3">
        <SkeletonPulse className="h-3 w-20 rounded-full" delay={0.14} />
        <SkeletonPulse className="h-3 w-28 rounded-full" delay={0.18} />
      </div>
      <div className="dash-metric-skeleton__bar mb-3 overflow-hidden rounded-full">
        <div className="dash-metric-skeleton__bar-fill" />
      </div>
      <SkeletonPulse className="h-3 w-40 max-w-full rounded-full" delay={0.22} />
    </motion.div>
  );
}

/**
 * Compact skeleton for Peak day / Daily avg mini-cards.
 * @param {{ label: string, icon?: import('react').ReactNode }} props
 */
export function TrendStatSkeleton({ label, icon }) {
  return (
    <div
      className="rounded-2xl border border-indigo-100/70 bg-indigo-50/40 px-3 py-3 dark:border-indigo-500/15 dark:bg-indigo-950/25 sm:px-4"
      role="status"
      aria-busy="true"
      aria-label={`Loading ${label}`}
    >
      <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </div>
      <SkeletonPulse className="mb-2 h-5 w-24 rounded-md" />
      <SkeletonPulse className="mb-3 h-3 w-16 rounded-full" delay={0.08} />
      <div className="dash-metric-skeleton__bar h-1 overflow-hidden rounded-full">
        <div className="dash-metric-skeleton__bar-fill dash-metric-skeleton__bar-fill--short" />
      </div>
    </div>
  );
}
