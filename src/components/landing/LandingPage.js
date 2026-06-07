"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import AuthModal from '@/components/AuthModal';
import NavbarLanding from '@/components/landing_sections/NavbarLanding';
import Hero from '@/components/landing_sections/Hero';
import Features from '@/components/landing_sections/Features';
import Solutions from '@/components/landing_sections/Solutions';
import FooterLanding from '@/components/landing_sections/FooterLanding';
import Resources from '@/components/landing_sections/Resources';
import Pricing from '@/components/landing_sections/Pricing';
import { landingFont } from '@/lib/landingFont';
import { scrollToLandingSection } from '@/lib/landingScroll';

export default function LandingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [initialMode, setInitialMode] = useState('signin');

  // Check URL query parameters to open modal
  useEffect(() => {
    const authParam = searchParams.get('auth');
    if (authParam === 'signin' || authParam === 'signup') {
      setInitialMode(authParam);
      setIsAuthOpen(true);
    }
  }, [searchParams]);

  // Scroll to section when landing with a hash (e.g. /#pricing)
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (!hash) return;
    const timer = window.setTimeout(() => {
      scrollToLandingSection(hash, 'auto');
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const openAuth = (mode) => {
    setInitialMode(mode);
    setIsAuthOpen(true);
    // Update URL without causing navigation
    const url = new URL(window.location.href);
    url.searchParams.set('auth', mode);
    window.history.replaceState({}, '', url);
  };

  const closeAuth = () => {
    setIsAuthOpen(false);
    // Remove auth parameter from URL
    const url = new URL(window.location.href);
    url.searchParams.delete('auth');
    window.history.replaceState({}, '', url);
  };

  return (
    <div className={`landing-page ${landingFont.className} ${landingFont.variable}`}>
      <NavbarLanding 
        onSignInClick={() => openAuth('signin')} 
        onGetStartedClick={() => openAuth('signup')} 
      />
      <Hero onGetStartedClick={() => openAuth('signup')} />
      <Features/>
      <Solutions/>
      <Resources/>
      <Pricing/>
      <FooterLanding />
      <AuthModal 
        isOpen={isAuthOpen} 
        onClose={closeAuth} 
        initialMode={initialMode}
      />
    </div>
  );
}
