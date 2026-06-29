'use client';

import { motion } from 'framer-motion';
import { appSurfaceClass } from '@/lib/appShellClasses';

/**
 * In-app page loader — route label above an animated spinner.
 * Used during client-side navigation between workspace routes.
 * @param {{ message?: string, transparent?: boolean }} props
 */
export default function AppPageLoader({ message = 'Loading page', transparent = false }) {
  return (
    <div
      className={
        transparent
          ? 'flex min-h-[60vh] w-full items-center justify-center bg-transparent px-4'
          : `${appSurfaceClass} flex min-h-[60vh] w-full items-center justify-center px-4`
      }
    >
      <motion.div
        className="app-page-loader"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
        role="status"
        aria-live="polite"
        aria-busy="true"
        aria-label={message}
      >
        <p className="app-page-loader__message">{message}</p>
        <div className="app-page-loader__visual" aria-hidden>
          <span className="app-page-loader__glow" />
          <span className="app-page-loader__ring app-page-loader__ring--outer" />
          <span className="app-page-loader__ring app-page-loader__ring--inner" />
          <span className="app-page-loader__core" />
        </div>
      </motion.div>
    </div>
  );
}
