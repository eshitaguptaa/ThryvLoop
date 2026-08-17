'use client';

import { motion } from 'framer-motion';

/**
 * Compact animated loader for in-card / section loading states.
 * @param {{
 *   message?: string,
 *   size?: 'sm' | 'md',
 *   className?: string,
 * }} props
 */
export default function InlineLoader({ message = 'Loading', size = 'md', className = '' }) {
  const compact = size === 'sm';
  return (
    <motion.div
      className={`inline-loader ${compact ? 'inline-loader--sm' : ''} ${className}`.trim()}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={message}
    >
      <div className="inline-loader__visual" aria-hidden>
        <span className="inline-loader__glow" />
        <span className="inline-loader__ring inline-loader__ring--outer" />
        <span className="inline-loader__ring inline-loader__ring--inner" />
        <span className="inline-loader__core" />
      </div>
      {message ? <p className="inline-loader__message">{message}</p> : null}
    </motion.div>
  );
}
