'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { motion } from 'framer-motion';
import { HeroReveal } from '@/components/landing_sections/ScrollReveal';
import { SectionBlend } from '@/components/landing_sections/SectionBlend';
import { heroContent, heroImage, heroLine } from '@/lib/landingMotion';

/** White-background PNG mockups blend into dark hero surface without changing the artwork. */
const mockupBlendClass =
  'object-contain dark:mix-blend-multiply dark:opacity-[0.98]';

/** Bottom hero mockups — dark PNGs have extra canvas padding; use explicit render sizes. */
const BOTTOM_MOCKUPS = {
  tasks: {
    light: { src: '/LandingPageImages/tasks.png', width: 270, height: 200 },
    dark: {
      src: '/LandingPageImages/landing-dark-image-2.png',
      width: 400,
      offsetY: 32,
      offsetX: -40,
    },
    alt: 'Tasks',
    position: 'left',
    delay: 0.3,
    rounded: 'rounded-bl-3xl',
  },
  integrations: {
    light: { src: '/LandingPageImages/Integrations.png', width: 280, height: 200 },
    dark: {
      src: '/LandingPageImages/landing-dark-image-1.png',
      width: 350,
      offsetY: 40,
      offsetX: 40,
    },
    alt: 'Integrations',
    position: 'right',
    delay: 0.45,
    rounded: 'rounded-br-3xl',
  },
};

function BottomHeroMockup({ config }) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isLeft = config.position === 'left';
  const isDark = mounted && resolvedTheme === 'dark';
  const positionClass = isLeft
    ? 'absolute bottom-0 left-0 z-20'
    : 'absolute bottom-0 right-0 z-20';

  return (
    <HeroReveal className={positionClass} variants={heroImage} delay={config.delay}>
      {isDark ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={config.dark.src}
          alt={config.alt}
          width={config.dark.width}
          height={Math.round(config.dark.width * (1024 / 1536))}
          className={`block h-auto max-w-none ${config.rounded}`}
          style={{
            width: config.dark.width,
            transform: `translate(${config.dark.offsetX ?? 0}px, ${config.dark.offsetY ?? 0}px)`,
          }}
          draggable={false}
        />
      ) : (
        <Image
          src={config.light.src}
          alt={config.alt}
          width={config.light.width}
          height={config.light.height}
          className={`object-contain ${mockupBlendClass} ${config.rounded}`}
          unoptimized
        />
      )}
    </HeroReveal>
  );
}

export default function Hero({ onGetStartedClick }) {
  return (
    <section className="pt-20 px-6 py-10 flex justify-center bg-background relative overflow-visible min-h-screen">
      <SectionBlend position="bottom" fromColor="transparent" toColor="surface" size="lg" />
      <div className="max-w-[1280px] w-full relative bg-surface rounded-3xl min-h-[600px] border border-border overflow-visible">
        <div className="absolute inset-0 hero-dot-grid pointer-events-none rounded-3xl opacity-100" />

        <HeroReveal className="absolute top-0 right-0 z-20" variants={heroImage} delay={0.35}>
          <Image
            src="/LandingPageImages/ambience.png"
            alt="Ambience"
            width={290}
            height={210}
            className="object-contain rounded-tr-3xl"
            unoptimized
          />
        </HeroReveal>

        <HeroReveal className="absolute top-5 left-0 z-20" variants={heroImage} delay={0.2}>
          <Image
            src="/LandingPageImages/analytic.png"
            alt="Analytics"
            width={290}
            height={240}
            className={`${mockupBlendClass} rounded-tl-3xl`}
            unoptimized
          />
        </HeroReveal>

        <BottomHeroMockup config={BOTTOM_MOCKUPS.integrations} />
        <BottomHeroMockup config={BOTTOM_MOCKUPS.tasks} />

        <div className="relative z-10 p-12">
          <HeroReveal className="flex justify-center mb-10 mt-8" variants={heroLine}>
            <div className="bg-card/70 rounded-xl p-3 border border-border shadow-lg shadow-black/5 dark:shadow-black/30">
              <Image
                src="/LandingPageImages/logo.png"
                alt="ThryvLoop Logo"
                width={72}
                height={72}
                className="object-contain"
              />
            </div>
          </HeroReveal>

          <HeroReveal className="text-center max-w-[720px] mx-auto" variants={heroContent}>
            <motion.h1 variants={heroLine} className="landing-display text-5xl md:text-[3.5rem] mb-0">
              Switch On. Lock In.
              <br />
              Go Beyond.
            </motion.h1>
            <motion.p variants={heroLine} className="landing-body text-lg mb-8 mt-5 max-w-xl mx-auto">
              A productivity powerhouse blending ambience, music, analytics, tasks and integrations into a
              frictionless flow.
            </motion.p>
            <motion.div variants={heroLine} className="flex justify-center">
              <button
                type="button"
                onClick={onGetStartedClick}
                className="px-8 py-3 rounded-full font-semibold bg-linear-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-600 hover:to-purple-700 hover:shadow-indigo-500/35 transition-all hover:-translate-y-0.5"
              >
                Get free demo
              </button>
            </motion.div>
          </HeroReveal>
        </div>
      </div>
    </section>
  );
}
