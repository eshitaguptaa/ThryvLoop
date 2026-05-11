'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useCelebration } from '@/contexts/CelebrationContext';
import { Sparkles, X } from 'lucide-react';

const THRYV_PURPLE = '#5043F3';
const THRYV_PURPLE_DARK = '#4337D9';

export default function CelebrationToast() {
  const { toast, dismissToast } = useCelebration();

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          className="fixed top-5 right-5 z-[200] max-w-sm w-[calc(100%-2rem)] sm:w-auto"
          initial={{ opacity: 0, y: -12, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
        >
          <div
            onClick={dismissToast}
            onKeyDown={(e) => e.key === 'Enter' && dismissToast()}
            className="group relative overflow-hidden rounded-2xl border border-white/20 bg-slate-900/95 shadow-xl shadow-black/20 backdrop-blur-xl cursor-pointer transition-all duration-200 hover:shadow-2xl hover:shadow-[#5043F3]/15 hover:scale-[1.02] active:scale-[0.99]"
            style={{
              boxShadow: '0 0 0 1px rgba(255,255,255,0.06), 0 20px 40px -12px rgba(0,0,0,0.35), 0 0 80px -20px rgba(80,67,243,0.25)',
            }}
            role="status"
            aria-live="polite"
            tabIndex={0}
          >
            {/* Subtle gradient glow */}
            <div
              className="absolute inset-0 opacity-40 pointer-events-none"
              style={{
                background: `linear-gradient(135deg, ${THRYV_PURPLE}15 0%, transparent 50%, ${THRYV_PURPLE_DARK}08 100%)`,
              }}
            />
            {/* Left accent bar */}
            <div
              className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
              style={{ background: `linear-gradient(180deg, ${THRYV_PURPLE}, ${THRYV_PURPLE_DARK})` }}
            />

            <div className="relative flex items-start gap-4 pl-5 pr-4 py-4">
              <div
                className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${THRYV_PURPLE}30, ${THRYV_PURPLE_DARK}20)`,
                  border: '1px solid rgba(80,67,243,0.35)',
                }}
              >
                <Sparkles className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>

              <div className="flex-1 min-w-0 pt-0.5">
                <p className="font-semibold text-white text-sm leading-tight">
                  {toast.message}
                </p>
                {toast.subtext && (
                  <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
                    {toast.subtext}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); dismissToast(); }}
                className="shrink-0 p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
