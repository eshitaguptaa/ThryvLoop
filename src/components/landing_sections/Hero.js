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

const bottomImgClass =
  'block h-auto w-[175px] md:w-[210px] lg:w-[250px] xl:w-[280px] 2xl:w-[295px] max-w-[42vw] md:max-w-[40vw] lg:max-w-none';

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
      className={`${anchorClass} hidden md:block pointer-events-none`}
      variants={heroImage}
      delay={config.delay}
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
  const topMockupSizeClass =
    'h-auto w-[125px] md:w-[150px] lg:w-[190px] xl:w-[235px] 2xl:w-[290px] max-w-[34vw] md:max-w-[36vw] lg:max-w-none';

  return (
    <section className="pt-16 sm:pt-20 px-4 sm:px-6 py-8 sm:py-10 flex justify-center bg-background relative overflow-x-hidden min-h-[calc(100vh-4rem)] md:min-h-[680px] lg:min-h-screen">
      <SectionBlend position="bottom" fromColor="transparent" toColor="surface" size="lg" />
      <div className="max-w-[1280px] w-full relative bg-surface rounded-2xl sm:rounded-3xl min-h-[420px] md:min-h-[640px] lg:min-h-[680px] xl:min-h-[640px] border border-border overflow-hidden flex flex-col justify-center">
        <div className="absolute inset-0 hero-dot-grid pointer-events-none rounded-2xl sm:rounded-3xl opacity-100" />

        <HeroReveal
          className="absolute top-0 right-0 z-20 hidden md:block pointer-events-none max-w-[38%] lg:max-w-[36%] xl:max-w-none"
          variants={heroImage}
          delay={0.35}
        >
          <Image
            src="/LandingPageImages/ambience.png"
            alt="Ambience"
            width={290}
            height={210}
            className={`${topMockupSizeClass} object-contain rounded-tr-3xl`}
            unoptimized
          />
        </HeroReveal>

        <HeroReveal
          className="absolute top-0 md:top-1 lg:top-5 left-0 z-20 hidden md:block pointer-events-none max-w-[38%] lg:max-w-[36%] xl:max-w-none"
          variants={heroImage}
          delay={0.2}
        >
          <Image
            src="/LandingPageImages/Analytic.png"
            alt="Analytics"
            width={290}
            height={240}
            className={`${topMockupSizeClass} ${mockupBlendClass} rounded-tl-3xl`}
            unoptimized
          />
        </HeroReveal>

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
            <motion.h1
              variants={heroLine}
              className="landing-display text-3xl sm:text-4xl md:text-[2.35rem] lg:text-[2.75rem] xl:text-[3.5rem] mb-0"
            >
              Switch On. Lock In.
              <br />
              Go Beyond.
            </motion.h1>
            <motion.p
              variants={heroLine}
              className="landing-body text-base sm:text-lg md:text-[1.05rem] mb-6 sm:mb-8 mt-4 sm:mt-5 max-w-lg md:max-w-xl mx-auto"
            >
              A productivity powerhouse blending ambience, music, analytics, tasks and integrations into a
              frictionless flow.
            </motion.p>
            <motion.div variants={heroLine} className="flex justify-center">
              <button
                type="button"
                onClick={onGetStartedClick}
                className="w-full sm:w-auto px-8 py-3 rounded-full font-semibold bg-linear-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-600 hover:to-purple-700 hover:shadow-indigo-500/35 transition-all hover:-translate-y-0.5"
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
