'use client';

import { useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Check } from 'lucide-react';
import { playWorkspaceJoinChime } from '@/utils/celebrationSound';

const CONFETTI_COUNT = 72;
const COLORS = ['#5043F3', '#8b5cf6', '#a78bfa', '#34d399', '#22d3ee', '#f472b6', '#fbbf24', '#6366f1'];

function ConfettiBurst({ reduced }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 140,
        y: (Math.random() - 0.15) * 110,
        rotation: Math.random() * 720 - 360,
        delay: Math.random() * 0.35,
        duration: 1.15 + Math.random() * 0.85,
        color: COLORS[i % COLORS.length],
        size: 5 + Math.random() * 8,
        circle: Math.random() > 0.55,
      })),
    [],
  );

  if (reduced) return null;

  return (
    <div className="invite-welcome__confetti" aria-hidden>
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          className="invite-welcome__confetti-bit"
          style={{
            width: p.size,
            height: p.circle ? p.size : p.size * 1.55,
            borderRadius: p.circle ? 999 : 2,
            background: p.color,
            boxShadow: `0 0 8px ${p.color}99`,
          }}
          initial={{ opacity: 0, x: 0, y: 0, rotate: 0, scale: 0 }}
          animate={{
            opacity: [0, 1, 1, 0],
            x: p.x * 4.2,
            y: p.y * 4.2,
            rotate: p.rotation,
            scale: [0, 1.2, 1],
          }}
          transition={{ duration: p.duration, delay: p.delay, ease: [0.16, 1, 0.3, 1] }}
        />
      ))}
    </div>
  );
}

export default function InviteWelcomeModal({ workspaceName, onEnter }) {
  const reduced = useReducedMotion();
  const name = workspaceName || 'this workspace';

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    playWorkspaceJoinChime();
    const retry = () => playWorkspaceJoinChime();
    window.addEventListener('pointerdown', retry, { once: true });
    const timer = window.setTimeout(() => {
      window.removeEventListener('pointerdown', retry);
    }, 600);
    return () => {
      document.body.style.overflow = previous;
      window.clearTimeout(timer);
      window.removeEventListener('pointerdown', retry);
    };
  }, []);

  useEffect(() => {
    if (!onEnter) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') onEnter();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onEnter]);

  const node = (
    <AnimatePresence>
      <motion.div
        className="invite-join-overlay invite-join-overlay--dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="invite-welcome-title"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.22 }}
      >
        <motion.button
          type="button"
          aria-label="Enter workspace"
          className="invite-join-overlay__backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={onEnter}
        />

        <ConfettiBurst reduced={Boolean(reduced)} />

        <motion.div
          className="invite-welcome-card"
          initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.86, y: 28 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 10 }}
          transition={{ type: 'spring', stiffness: 360, damping: 26 }}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="invite-welcome-card__glow" aria-hidden />
          <div className="invite-welcome-card__sheen" aria-hidden />

          <div className="invite-welcome-mark">
            {!reduced ? (
              <>
                <span className="invite-welcome-ring invite-welcome-ring--a" />
                <span className="invite-welcome-ring invite-welcome-ring--b" />
              </>
            ) : null}
            <motion.div
              className="invite-welcome-check"
              initial={reduced ? false : { scale: 0.4, rotate: -18 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 420, damping: 16, delay: 0.08 }}
            >
              <Check className="h-9 w-9" strokeWidth={2.75} />
            </motion.div>
          </div>

          <motion.p
            className="invite-welcome-kicker"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
          >
            You&apos;re in
          </motion.p>
          <motion.h1
            id="invite-welcome-title"
            className="invite-welcome-title"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.24, duration: 0.35 }}
          >
            Welcome to {name}
          </motion.h1>
          <motion.p
            className="invite-welcome-copy"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.34 }}
          >
            Congratulations — you joined the team. Your host has been notified.
          </motion.p>
          <motion.button
            type="button"
            className="invite-welcome-cta"
            onClick={onEnter}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.48 }}
            whileHover={reduced ? undefined : { scale: 1.03 }}
            whileTap={reduced ? undefined : { scale: 0.98 }}
          >
            Enter workspace
          </motion.button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  if (typeof document === 'undefined') return node;
  return createPortal(node, document.body);
}
