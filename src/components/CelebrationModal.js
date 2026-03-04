'use client';

import { useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCelebration } from '@/contexts/CelebrationContext';
import { playCelebrationChime } from '@/utils/celebrationSound';

const THRYV_PURPLE = '#5043F3';
const THRYV_PURPLE_DARK = '#4337D9';

const CONFETTI_COUNT = 60;
const COLORS = [THRYV_PURPLE, '#8b5cf6', '#a78bfa', '#10b981', '#ec4899', '#06b6d4', '#6366f1', THRYV_PURPLE_DARK];

function ConfettiBurst() {
  const pieces = useMemo(() => {
    return Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
      id: i,
      x: Math.random() * 100 - 50,
      y: Math.random() * 100 - 50,
      rotation: Math.random() * 720 - 360,
      delay: Math.random() * 0.4,
      duration: 1.2 + Math.random() * 0.8,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: 6 + Math.random() * 8,
      shape: Math.random() > 0.5 ? 'rect' : 'circle',
    }));
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
      {pieces.map((p) => (
        <motion.div
          key={p.id}
          className="absolute left-1/2 top-1/2"
          style={{
            width: p.size,
            height: p.shape === 'rect' ? p.size * 1.6 : p.size,
            borderRadius: p.shape === 'circle' ? '50%' : 2,
            backgroundColor: p.color,
            boxShadow: `0 0 6px ${p.color}80`,
          }}
          initial={{ opacity: 0, x: 0, y: 0, rotate: 0, scale: 0 }}
          animate={{
            opacity: [0, 1, 1, 0],
            x: p.x * 12,
            y: p.y * 12,
            rotate: p.rotation,
            scale: [0, 1.2, 1],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: [0.22, 1, 0.36, 1],
          }}
        />
      ))}
    </div>
  );
}

const CONTENT_BY_TYPE = {
  task: {
    headline: "You did it!",
    subtext: (payload) =>
      payload?.taskTitle
        ? `"${payload.taskTitle}" is complete. One less thing on your mind.`
        : 'Task complete. Nice work.',
    cta: 'Keep going',
    emoji: '✨',
    gradient: 'from-indigo-500/25 via-[#5043F3]/20 to-violet-500/25',
    accent: THRYV_PURPLE,
  },
  focus_session: {
    headline: 'Focus session complete',
    subtext: (payload) => {
      const mins = payload?.sessionMinutes ?? 25;
      return `${mins} minutes of deep work. Your future self will thank you.`;
    },
    cta: 'Start another',
    emoji: '🎯',
    gradient: 'from-indigo-500/25 via-[#5043F3]/20 to-violet-500/25',
    accent: THRYV_PURPLE,
  },
  streak: {
    headline: 'Streak unlocked!',
    subtext: (payload) =>
      payload?.days
        ? `${payload.days} days in a row. You're on fire.`
        : "You're building a habit. Keep it up.",
    cta: 'View progress',
    emoji: '🔥',
    gradient: 'from-amber-500/20 via-orange-500/10 to-rose-500/20',
    accent: '#f59e0b',
  },
};

function getContent(payload) {
  const type = payload?.type ?? 'task';
  return CONTENT_BY_TYPE[type] || CONTENT_BY_TYPE.task;
}

export default function CelebrationModal() {
  const { celebration, dismissCelebration } = useCelebration();

  useEffect(() => {
    if (celebration) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [celebration]);

  useEffect(() => {
    if (!celebration) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') dismissCelebration();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [celebration, dismissCelebration]);

  useEffect(() => {
    if (celebration?.type === 'task') playCelebrationChime();
  }, [celebration]);

  if (!celebration) return null;
  if (celebration.type === 'focus_session') return null;

  const content = getContent(celebration);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        className="fixed inset-0 z-100 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={dismissCelebration}
          onKeyDown={(e) => e.key === 'Escape' && dismissCelebration()}
        />

        {/* Card */}
        <motion.div
          className="relative w-full max-w-md overflow-hidden rounded-3xl bg-slate-900/95 shadow-2xl border border-white/10"
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.92, opacity: 0 }}
          transition={{
            type: 'spring',
            stiffness: 400,
            damping: 28,
            mass: 0.8,
          }}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="celebration-headline"
        >
          {/* ThryvLoop gradient glow */}
          <div
            className={`absolute inset-0 bg-linear-to-br ${content.gradient} opacity-70`}
            style={{ filter: 'blur(80px)' }}
          />
          <div className="absolute inset-0 bg-linear-to-br from-[#5043F3]/10 to-transparent pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center text-center px-8 py-10 sm:py-12">
            <ConfettiBurst />

            {/* ThryvLoop badge */}
            <motion.div
              className="mb-4 px-3 py-1 rounded-full border border-white/20 bg-white/5"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
            >
              <span className="text-xs font-bold tracking-wider text-white/80" style={{ color: '#a5b4fc' }}>
                THRYVLOOP
              </span>
            </motion.div>

            <motion.span
              className="text-5xl sm:text-6xl mb-3"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.15, type: 'spring', stiffness: 300, damping: 18 }}
            >
              {content.emoji}
            </motion.span>

            <motion.h2
              id="celebration-headline"
              className="text-2xl sm:text-3xl font-bold text-white mb-2"
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.35 }}
            >
              {content.headline}
            </motion.h2>

            <motion.p
              className="text-slate-300 text-sm sm:text-base max-w-sm mb-8 leading-relaxed"
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.35 }}
            >
              {typeof content.subtext === 'function' ? content.subtext(celebration) : content.subtext}
            </motion.p>

            <motion.div
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.45, duration: 0.3 }}
            >
              <button
                type="button"
                onClick={dismissCelebration}
                className="px-8 py-3.5 rounded-2xl font-semibold text-white shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: `linear-gradient(135deg, ${THRYV_PURPLE}, ${THRYV_PURPLE_DARK})`,
                  boxShadow: `0 8px 24px ${THRYV_PURPLE}50`,
                }}
              >
                {content.cta}
              </button>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
