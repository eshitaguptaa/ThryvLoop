import Link from 'next/link';
import NavbarLanding from '@/components/landing_sections/NavbarLanding';
import Hero from '@/components/landing_sections/Hero';
import Features from '@/components/landing_sections/Features';
import Solutions from '@/components/landing_sections/Solutions';
import FooterLanding from '@/components/landing_sections/FooterLanding';
import Resources from '@/components/landing_sections/Resources';
import Pricing from '@/components/landing_sections/Pricing';

export default function LandingPage() {
  return (
    <>
      <NavbarLanding />
      <Hero />
      <Features/>
      <Solutions/>
      <Resources/>
      <Pricing/>
      <FooterLanding />
    </>
  );
}
