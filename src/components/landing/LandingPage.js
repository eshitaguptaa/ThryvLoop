"use client";

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import AuthModal from '@/components/AuthModal';
import NavbarLanding from '@/components/landing_sections/NavbarLanding';
import Hero from '@/components/landing_sections/Hero';
import ValuePropositions from '@/components/landing_sections/ValuePropositions';
import Features from '@/components/landing_sections/Features';
import Solutions from '@/components/landing_sections/Solutions';
import FooterLanding from '@/components/landing_sections/FooterLanding';
import Resources from '@/components/landing_sections/Resources';
import Pricing from '@/components/landing_sections/Pricing';
import { scrollToLandingSection } from '@/lib/landingScroll';
import LandingAmbient from '@/components/landing/LandingAmbient';

function AuthQueryOpener({ onOpen }) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const authParam = searchParams.get('auth');
    if (authParam === 'signin' || authParam === 'signup') {
      onOpen(authParam);
    }
  }, [searchParams, onOpen]);

  return null;
}

export default function LandingPage() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [initialMode, setInitialMode] = useState('signin');

  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (!hash) return undefined;
    const timer = window.setTimeout(() => {
      scrollToLandingSection(hash, 'auto');
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const openAuth = useCallback((mode) => {
    setInitialMode(mode);
    setIsAuthOpen(true);
    const url = new URL(window.location.href);
    url.searchParams.set('auth', mode);
    window.history.replaceState({}, '', url);
  }, []);

  const closeAuth = () => {
    setIsAuthOpen(false);
    const url = new URL(window.location.href);
    url.searchParams.delete('auth');
    window.history.replaceState({}, '', url);
  };

  return (
    <div className="relative">
      <Suspense fallback={null}>
        <AuthQueryOpener onOpen={openAuth} />
      </Suspense>
      <LandingAmbient />
      <NavbarLanding
        onSignInClick={() => openAuth('signin')}
        onGetStartedClick={() => openAuth('signup')}
      />
      <Hero onGetStartedClick={() => openAuth('signup')} />
      <ValuePropositions />
      <Features />
      <Solutions />
      <Resources />
      <Pricing />
      <FooterLanding />
      <AuthModal
        isOpen={isAuthOpen}
        onClose={closeAuth}
        initialMode={initialMode}
      />
    </div>
  );
}
