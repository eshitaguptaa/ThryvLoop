'use client';

import Link from 'next/link';
import Image from 'next/image';
import ThemeToggle from '@/components/ThemeToggle';
import { LANDING_SECTIONS, scrollToLandingSection } from '@/lib/landingScroll';

export default function NavbarLanding({ onSignInClick, onGetStartedClick }) {
  const handleNavClick = (event, sectionId) => {
    event.preventDefault();
    scrollToLandingSection(sectionId);
  };

  const scrollToTop = (event) => {
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    window.history.replaceState(null, '', '/');
  };

  return (
    <nav className="fixed top-0 w-full h-16 bg-background/95 backdrop-blur-md z-[1000] border-b border-border">
      <div className="max-w-[1200px] mx-auto h-full px-6 sm:px-8 grid grid-cols-[1fr_auto] md:grid-cols-[1fr_auto_1fr] items-center gap-4">
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
          <span className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent truncate">
            ThryvLoop
          </span>
        </Link>

        <ul className="hidden md:flex items-center justify-center gap-8 list-none m-0 p-0">
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

        <div className="flex gap-2 sm:gap-3 items-center justify-self-end shrink-0">
          <ThemeToggle variant="landing" />
          <button
            type="button"
            onClick={onSignInClick}
            className="px-5 py-2 rounded-lg font-semibold no-underline transition-all bg-transparent text-indigo-500 border-2 border-indigo-500 hover:bg-indigo-500 hover:text-white"
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={onGetStartedClick}
            className="px-4 sm:px-5 py-2 rounded-lg font-semibold no-underline transition-all bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/30 text-sm sm:text-base"
          >
            Get Started
          </button>
        </div>
      </div>
    </nav>
  );
}
