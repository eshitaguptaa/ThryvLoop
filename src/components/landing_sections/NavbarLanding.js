'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeToggle from '@/components/ThemeToggle';
import { LANDING_SECTIONS, scrollToLandingSection } from '@/lib/landingScroll';

const panelEase = [0.32, 0.72, 0, 1];
const panelTransition = { duration: 0.32, ease: panelEase };

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const panelVariants = {
  hidden: { x: '100%' },
  visible: { x: 0 },
};

function lockBodyScroll() {
  document.body.style.overflow = 'hidden';
}

function unlockBodyScroll() {
  document.body.style.overflow = '';
}

function unlockBodyScrollUnlessAuthOpen() {
  if (document.body.dataset.authModalOpen === 'true') return;
  unlockBodyScroll();
}

function MenuIcon({ open }) {
  const line = 'absolute left-0 block h-0.5 w-5 rounded-full bg-current';
  const ease = panelEase;

  return (
    <div className="relative h-4 w-5" aria-hidden>
      <motion.span
        className={line}
        initial={false}
        animate={{ top: open ? 6 : 0, rotate: open ? 45 : 0 }}
        transition={{ duration: 0.22, ease }}
      />
      <motion.span
        className={`${line} top-[6px]`}
        initial={false}
        animate={{ opacity: open ? 0 : 1, scaleX: open ? 0 : 1 }}
        transition={{ duration: 0.16 }}
      />
      <motion.span
        className={line}
        initial={false}
        animate={{ top: open ? 6 : 12, rotate: open ? -45 : 0 }}
        transition={{ duration: 0.22, ease }}
      />
    </div>
  );
}

export default function NavbarLanding({ onSignInClick, onGetStartedClick }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const unlockScroll = useCallback(() => {
    unlockBodyScrollUnlessAuthOpen();
  }, []);

  useEffect(() => {
    if (mobileMenuOpen) {
      lockBodyScroll();
    }
  }, [mobileMenuOpen]);

  useEffect(() => () => unlockBodyScrollUnlessAuthOpen(), []);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileMenuOpen]);

  const closeMenu = () => setMobileMenuOpen(false);

  const handleNavClick = (event, sectionId) => {
    event.preventDefault();
    closeMenu();
    scrollToLandingSection(sectionId);
  };

  const scrollToTop = (event) => {
    event.preventDefault();
    closeMenu();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    window.history.replaceState(null, '', '/');
  };

  const handleSignIn = () => {
    onSignInClick();
    closeMenu();
  };

  const handleGetStarted = () => {
    onGetStartedClick();
    closeMenu();
  };

  return (
    <>
      <nav className="fixed top-0 w-full h-16 bg-background/95 backdrop-blur-md z-[1000] border-b border-border">
        <div className="max-w-[1280px] mx-auto h-full px-4 sm:px-6 lg:px-8 grid grid-cols-[1fr_auto] lg:grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-4">
          <Link
            href="/"
            onClick={scrollToTop}
            className="flex items-center gap-2 no-underline justify-self-start min-w-0"
          >
            <Image
              src="/LandingPageImages/logo.png"
              alt="ThryvLoop Logo"
              width={36}
              height={36}
              className="object-contain h-8 w-auto shrink-0"
            />
            <span className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent truncate">
              ThryvLoop
            </span>
          </Link>

          <ul className="hidden lg:flex items-center justify-center gap-3 xl:gap-5 list-none m-0 p-0 min-w-0">
            {LANDING_SECTIONS.map(({ id, label }) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  onClick={(event) => handleNavClick(event, id)}
                  className="text-muted-foreground font-medium text-sm no-underline transition-colors hover:text-foreground whitespace-nowrap"
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>

          <div className="flex gap-1.5 sm:gap-2 lg:gap-3 items-center justify-self-end shrink-0">
            <ThemeToggle variant="landing" />
            <button
              type="button"
              onClick={onSignInClick}
              className="hidden lg:inline-flex h-9 xl:h-10 items-center px-3.5 xl:px-5 rounded-lg font-semibold no-underline transition-all bg-transparent text-indigo-500 border border-indigo-500 lg:border-2 hover:bg-indigo-500 hover:text-white text-xs xl:text-sm whitespace-nowrap"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={onGetStartedClick}
              className="hidden lg:inline-flex h-9 xl:h-10 items-center px-3.5 xl:px-5 rounded-lg font-semibold no-underline transition-all bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/30 text-xs xl:text-sm whitespace-nowrap"
            >
              Get Started
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((open) => !open)}
              className={`lg:hidden flex items-center justify-center w-10 h-10 rounded-xl transition-colors duration-200 ${
                mobileMenuOpen
                  ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                  : 'text-foreground hover:bg-muted border border-border'
              }`}
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              <MenuIcon open={mobileMenuOpen} />
            </button>
          </div>
        </div>
      </nav>

      <AnimatePresence onExitComplete={unlockScroll}>
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-[999]" role="dialog" aria-modal="true" aria-label="Navigation menu">
            <motion.button
              type="button"
              className="absolute inset-0 bg-black/50"
              variants={backdropVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              transition={{ duration: 0.28, ease: 'easeOut' }}
              onClick={closeMenu}
              aria-label="Close menu"
            />

            <motion.aside
              className="absolute top-0 right-0 flex h-full w-80 max-w-[85%] flex-col border-l border-border bg-background shadow-2xl shadow-black/10 dark:shadow-black/40 transform-gpu"
              variants={panelVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              transition={panelTransition}
              style={{ willChange: 'transform' }}
            >
              <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border/80">
                <div className="flex items-center gap-2.5">
                  <Image
                    src="/LandingPageImages/logo.png"
                    alt=""
                    width={28}
                    height={28}
                    className="object-contain h-7 w-auto"
                  />
                  <span className="text-sm font-semibold text-foreground">Menu</span>
                </div>
                <button
                  type="button"
                  onClick={closeMenu}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                  aria-label="Close menu"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto overscroll-contain px-4 py-5">
                <p className="px-3 mb-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Explore
                </p>
                <ul className="list-none m-0 p-0 space-y-1.5">
                  {LANDING_SECTIONS.map(({ id, label }) => (
                    <li key={id}>
                      <a
                        href={`#${id}`}
                        onClick={(event) => handleNavClick(event, id)}
                        className="group flex items-center justify-between gap-3 rounded-2xl px-4 py-3.5 no-underline text-foreground font-medium transition-colors hover:bg-indigo-500/8 active:bg-indigo-500/12"
                      >
                        <span>{label}</span>
                        <svg
                          className="w-4 h-4 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-indigo-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          aria-hidden
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>

              <div className="shrink-0 border-t border-border/80 bg-muted/30 px-4 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] space-y-3">
                <button
                  type="button"
                  onClick={handleSignIn}
                  className="w-full min-h-12 px-5 py-3.5 rounded-xl text-base font-semibold bg-card text-indigo-600 dark:text-indigo-400 border-2 border-indigo-500/50 hover:bg-indigo-500/5 transition-colors active:scale-[0.98]"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={handleGetStarted}
                  className="w-full min-h-12 px-5 py-3.5 rounded-xl text-base font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/35 transition-colors active:scale-[0.98]"
                >
                  Get Started
                </button>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
