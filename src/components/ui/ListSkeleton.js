'use client';

import { motion } from 'framer-motion';

/**
 * Shimmer placeholder rows for list sections (tasks, alerts, notifications).
 * @param {{
 *   rows?: number,
 *   className?: string,
 *   message?: string,
 * }} props
 */
export default function ListSkeleton({ rows = 3, className = '', message = 'Loading' }) {
  const count = Math.max(1, Math.min(8, Math.floor(Number(rows) || 3)));
  return (
    <motion.div
      className={`list-skeleton ${className}`.trim()}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={message}
    >
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="list-skeleton__row" style={{ animationDelay: `${i * 0.08}s` }}>
          <div className="list-skeleton__avatar" />
          <div className="list-skeleton__lines">
            <div className="list-skeleton__line list-skeleton__line--title" />
            <div className="list-skeleton__line list-skeleton__line--meta" />
          </div>
        </div>
      ))}
    </motion.div>
  );
}
