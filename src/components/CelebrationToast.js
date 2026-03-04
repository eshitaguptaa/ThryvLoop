'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useCelebration } from '@/contexts/CelebrationContext';

export default function CelebrationToast() {
  const { toast, dismissToast } = useCelebration();

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          className="fixed top-4 right-4 z-[200] max-w-sm"
          initial={{ opacity: 0, x: 80 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 80 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        >
          <div
            onClick={dismissToast}
            onKeyDown={(e) => e.key === 'Enter' && dismissToast()}
            className="rounded-2xl border border-indigo-200/60 bg-white/95 shadow-lg backdrop-blur-sm px-4 py-3 cursor-pointer hover:bg-gray-50/80 transition-colors"
            role="status"
            aria-live="polite"
            tabIndex={0}
          >
            <p className="font-semibold text-gray-900 text-sm">{toast.message}</p>
            {toast.subtext && (
              <p className="text-gray-500 text-xs mt-0.5">{toast.subtext}</p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
