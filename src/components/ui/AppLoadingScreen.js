'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { resolveLoaderThemeDark } from '@/lib/themePreferences';

/**
 * Full-screen ThryvLoop boot loader — logo + progress bar.
 * Pass `percent` for real login progress (0–100). Without it, the bar is
 * indeterminate and eases toward 90% only.
 *
 * @param {{
 *   message?: string,
 *   finishing?: boolean,
 *   percent?: number | null,
 *   children?: import('react').ReactNode,
 *   onFinish?: () => void,
 * }} props
 */
export default function AppLoadingScreen({
  message = 'Preparing your workspace',
  finishing = false,
  percent = null,
  children = null,
  onFinish,
}) {
  const { resolvedTheme } = useTheme();
  const [isDark, setIsDark] = useState(resolveLoaderThemeDark);
  const start = typeof percent === 'number' ? percent : 8;
  const [progress, setProgress] = useState(start);
  const [visible, setVisible] = useState(true);
  const rafRef = useRef(null);
  const finishStartedRef = useRef(false);
  const progressRef = useRef(start);

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

    const tick = () => {
      const current = progressRef.current;
      let target;
      if (typeof percent === 'number') {
        target = Math.min(99, Math.max(0, percent));
      } else {
        const headroom = 90 - current;
        target = current + Math.max(0.12, headroom * 0.02);
        if (target > 90) target = 90;
      }

      const next = current + (target - current) * (typeof percent === 'number' ? 0.16 : 1);
      const clamped = Math.abs(target - next) < 0.15 ? target : next;
      progressRef.current = clamped;
      setProgress(clamped);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [finishing, percent]);

  useEffect(() => {
    if (!finishing || finishStartedRef.current) return;
    finishStartedRef.current = true;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const startAt = performance.now();
    const from = progressRef.current;
    const duration = 420;

    const animate = (now) => {
      const t = Math.min((now - startAt) / duration, 1);
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
          initial={{ opacity: 1 }}
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
              {children ? (
                <div className="app-loading-screen__captcha">{children}</div>
              ) : null}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
