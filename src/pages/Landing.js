"use client";

import { useState } from 'react';
import Link from 'next/link';
import AuthModal from '@/components/AuthModal';
import NavbarLanding from '@/components/landing_sections/NavbarLanding';
import Hero from '@/components/landing_sections/Hero';
import Features from '@/components/landing_sections/Features';
import Solutions from '@/components/landing_sections/Solutions';
import FooterLanding from '@/components/landing_sections/FooterLanding';
import Resources from '@/components/landing_sections/Resources';
import Pricing from '@/components/landing_sections/Pricing';

export default function LandingPage() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [initialMode, setInitialMode] = useState('signin');

  const openAuth = (mode) => {
    setInitialMode(mode);
    setIsAuthOpen(true);
  };

  const closeAuth = () => setIsAuthOpen(false);

  return (
    <>
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
    </>
  );
}
