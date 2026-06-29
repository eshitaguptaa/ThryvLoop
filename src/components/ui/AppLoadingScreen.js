'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { resolveLoaderThemeDark } from '@/lib/themePreferences';

/**
 * Full-screen ThryvLoop boot loader — logo + glowing progress bar.
 * @param {{ message?: string, finishing?: boolean, onFinish?: () => void }} props
 */
export default function AppLoadingScreen({
  message = 'Preparing your workspace',
  finishing = false,
  onFinish,
}) {
  const { resolvedTheme } = useTheme();
  const [isDark, setIsDark] = useState(resolveLoaderThemeDark);
  const [progress, setProgress] = useState(8);
  const [visible, setVisible] = useState(true);
  const rafRef = useRef(null);
  const finishStartedRef = useRef(false);
  const progressRef = useRef(8);

  useEffect(() => {
    if (resolvedTheme === 'dark') setIsDark(true);
    else if (resolvedTheme === 'light') setIsDark(false);
    else setIsDark(resolveLoaderThemeDark());
  }, [resolvedTheme]);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    if (finishing) return undefined;

    let value = 8;
    const tick = () => {
      const headroom = 90 - value;
      value += Math.max(0.25, headroom * 0.045);
      if (value > 90) value = 90;
      setProgress(value);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [finishing]);

  useEffect(() => {
    if (!finishing || finishStartedRef.current) return;
    finishStartedRef.current = true;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const start = performance.now();
    const from = progressRef.current;
    const duration = 420;

    const animate = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - (1 - t) ** 3;
      setProgress(from + (100 - from) * eased);
      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        setTimeout(() => {
          setVisible(false);
          onFinish?.();
        }, 280);
      }
    };
    requestAnimationFrame(animate);
  }, [finishing, onFinish]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="app-loading-screen"
          data-theme-paint={isDark ? 'dark' : 'light'}
          initial={{ opacity: 0 }}
          animate={{ opacity: finishing ? 0 : 1, pointerEvents: finishing ? 'none' : 'auto' }}
          exit={{ opacity: 0, pointerEvents: 'none' }}
          transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
          aria-live="polite"
          aria-busy={!finishing}
          role="status"
        >
          <div className="app-loading-screen__mesh" aria-hidden />
          <div className="app-loading-screen__orb app-loading-screen__orb--a" aria-hidden />
          <div className="app-loading-screen__orb app-loading-screen__orb--b" aria-hidden />
          <div className="app-loading-screen__orb app-loading-screen__orb--c" aria-hidden />

          <div className="app-loading-screen__content">
            <motion.div
              className="app-loading-screen__logo-wrap"
              initial={{ opacity: 0, scale: 0.88, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.32, 0.72, 0, 1] }}
            >
              <div className="app-loading-screen__logo-glow" aria-hidden />
              <Image
                src="/LandingPageImages/logo.png"
                alt="ThryvLoop"
                width={72}
                height={72}
                priority
                className="app-loading-screen__logo"
              />
            </motion.div>

            <motion.p
              className="app-loading-screen__brand"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12, duration: 0.45 }}
            >
              ThryvLoop
            </motion.p>

            <motion.div
              className="app-loading-screen__bar-wrap"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.45 }}
            >
              <div className="app-loading-screen__bar-track">
                <div
                  className="app-loading-screen__bar-fill"
                  style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                >
                  <span className="app-loading-screen__bar-shimmer" aria-hidden />
                </div>
              </div>
              <p className="app-loading-screen__message">{message}</p>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
