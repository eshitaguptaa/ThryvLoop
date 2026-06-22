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

const TOP_MOCKUPS = {
  analytics: {
    light: { src: '/LandingPageImages/analytics-hero-light.png', width: 290, height: 240 },
    dark: { src: '/LandingPageImages/analytics-hero-dark.png', width: 290, height: 240 },
    alt: 'Analytics',
    delay: 0.2,
    cornerClass: 'rounded-tl-3xl',
    positionClass: 'absolute top-0 md:top-1 lg:top-5 left-0 z-20',
    useLightBlend: true,
  },
  ambience: {
    light: { src: '/LandingPageImages/ambience.png', width: 290, height: 210 },
    dark: { src: '/LandingPageImages/ambience.png', width: 290, height: 210 },
    alt: 'Ambience',
    delay: 0.35,
    cornerClass: 'rounded-tr-3xl',
    positionClass: 'absolute top-0 right-0 z-20',
    useLightBlend: false,
  },
};

/** Bottom hero mockups — identical frame; images scale to same height from the bottom edge. */
const BOTTOM_MOCKUPS = {
  tasks: {
    light: { src: '/LandingPageImages/Tasks.png', width: 1610, height: 1494 },
    dark: { src: '/LandingPageImages/landing-dark-image-2.png', width: 1039, height: 893 },
    alt: 'Tasks',
    delay: 0.3,
    side: 'left',
  },
  integrations: {
    light: { src: '/LandingPageImages/Integrations.png', width: 1080, height: 720 },
    dark: { src: '/LandingPageImages/landing-dark-image-1.png', width: 1171, height: 728 },
    alt: 'Integrations',
    delay: 0.45,
    side: 'right',
  },
};

const topMockupSizeClass =
  'h-auto w-[125px] md:w-[150px] lg:w-[190px] xl:w-[235px] 2xl:w-[290px] max-w-[34vw] md:max-w-[36vw] lg:max-w-none';

const bottomImgClass =
  'block h-auto w-[175px] md:w-[210px] lg:w-[250px] xl:w-[280px] 2xl:w-[295px] max-w-[42vw] md:max-w-[40vw] lg:max-w-none';

function TopHeroMockup({ config }) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === 'dark';
  const asset = isDark ? config.dark : config.light;
  const blendClass = !isDark && config.useLightBlend ? mockupBlendClass : 'object-contain';

  return (
    <HeroReveal
      className={`${config.positionClass} hidden md:block pointer-events-none max-w-[38%] lg:max-w-[36%] xl:max-w-none landing-float-slow`}
      variants={heroImage}
      delay={config.delay}
      style={{ animationDelay: `${config.delay * 5}s` }}
    >
      {/* Plain img — reliable on Linux/CDN; avoids Next/Image path quirks in production */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={asset.src}
        alt={config.alt}
        width={asset.width}
        height={asset.height}
        className={`${topMockupSizeClass} ${blendClass} ${config.cornerClass}`}
        draggable={false}
      />
    </HeroReveal>
  );
}

function BottomHeroMockup({ config }) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isLeft = config.side === 'left';
  const isDark = mounted && resolvedTheme === 'dark';
  const anchorClass = isLeft
    ? 'absolute bottom-0 left-0 z-20'
    : 'absolute bottom-0 right-0 z-20';

  const cornerRoundClass = isLeft ? 'rounded-bl-2xl sm:rounded-bl-3xl' : 'rounded-br-2xl sm:rounded-br-3xl';

  return (
    <HeroReveal
      className={`${anchorClass} hidden md:block pointer-events-none landing-float-slower`}
      variants={heroImage}
      delay={config.delay}
      style={{ animationDelay: `${config.delay * 4.5}s` }}
    >
      {isDark ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={config.dark.src}
          alt={config.alt}
          width={config.dark.width}
          height={config.dark.height}
          className={`${bottomImgClass} ${cornerRoundClass}`}
          draggable={false}
        />
      ) : (
        <Image
          src={config.light.src}
          alt={config.alt}
          width={config.light.width}
          height={config.light.height}
          className={`${bottomImgClass} ${mockupBlendClass} ${cornerRoundClass}`}
          unoptimized
        />
      )}
    </HeroReveal>
  );
}

export default function Hero({ onGetStartedClick }) {
  return (
    <section className="pt-16 sm:pt-20 px-4 sm:px-6 py-8 sm:py-10 flex justify-center bg-background relative overflow-x-hidden min-h-[calc(100vh-4rem)] md:min-h-[680px] lg:min-h-screen">
      <SectionBlend position="bottom" fromColor="transparent" toColor="surface" size="lg" />
      <div className="max-w-[1280px] w-full relative bg-surface rounded-2xl sm:rounded-3xl min-h-[420px] md:min-h-[640px] lg:min-h-[680px] xl:min-h-[640px] border border-border overflow-hidden flex flex-col justify-center">
        <div className="absolute inset-0 hero-dot-grid landing-dot-grid-flow pointer-events-none rounded-2xl sm:rounded-3xl opacity-100" />

        <TopHeroMockup config={TOP_MOCKUPS.ambience} />
        <TopHeroMockup config={TOP_MOCKUPS.analytics} />

        <BottomHeroMockup config={BOTTOM_MOCKUPS.integrations} />
        <BottomHeroMockup config={BOTTOM_MOCKUPS.tasks} />

        <div className="relative z-10 p-6 sm:p-8 md:px-12 md:py-10 lg:p-12 md:pt-16 md:pb-28 lg:pb-32 xl:pb-12">
          <HeroReveal className="flex justify-center mb-5 sm:mb-6 md:mb-7 lg:mb-10" variants={heroLine}>
            <div className="bg-card/70 rounded-xl p-2.5 sm:p-3 border border-border shadow-lg shadow-black/5 dark:shadow-black/30">
              <Image
                src="/LandingPageImages/logo.png"
                alt="ThryvLoop Logo"
                width={72}
                height={72}
                className="object-contain w-14 h-14 sm:w-[72px] sm:h-[72px]"
              />
            </div>
          </HeroReveal>

          <HeroReveal className="text-center max-w-[720px] mx-auto px-2 md:px-6 lg:px-4" variants={heroContent}>
            <motion.p
              variants={heroLine}
              className="text-xs sm:text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-400 mb-4"
            >
              Transform digital workspaces
            </motion.p>
            <motion.h1
              variants={heroLine}
              className="landing-display text-3xl sm:text-4xl md:text-[2.35rem] lg:text-[2.75rem] xl:text-[3.5rem] mb-0"
            >
              One Hub.
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">
                Zero App-Hopping.
              </span>
            </motion.h1>
            <motion.p
              variants={heroLine}
              className="landing-body text-base sm:text-lg md:text-[1.05rem] mb-6 sm:mb-8 mt-4 sm:mt-5 max-w-lg mx-auto"
            >
              ThryvLoop unifies focus, tasks, and analytics for people and companies—one place to
              work, with productivity you can measure.
            </motion.p>
            <motion.div variants={heroLine} className="flex justify-center">
              <button
                type="button"
                onClick={onGetStartedClick}
                className="landing-cta-shine w-full sm:w-auto px-8 py-3 rounded-full font-semibold bg-linear-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-600 hover:to-purple-700 hover:shadow-indigo-500/35 transition-all hover:-translate-y-0.5"
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
