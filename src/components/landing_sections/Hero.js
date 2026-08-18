'use client';

import Image from 'next/image';
import { HeroReveal } from '@/components/landing_sections/ScrollReveal';
import { SectionBlend } from '@/components/landing_sections/SectionBlend';

/** White-background PNG mockups blend into the dark hero surface. */
const mockupBlendClass =
  'object-contain dark:mix-blend-multiply dark:opacity-[0.98]';

const TOP_MOCKUPS = {
  analytics: {
    light: { src: '/LandingPageImages/analytics-hero-light.png', width: 290, height: 240 },
    dark: { src: '/LandingPageImages/analytics-hero-dark.png', width: 290, height: 240 },
    alt: 'Analytics',
    cornerClass: 'rounded-tl-3xl',
    positionClass: 'absolute top-0 md:top-1 lg:top-5 left-0 z-20',
    blendLight: true,
  },
  ambience: {
    light: { src: '/LandingPageImages/ambience.png', width: 290, height: 210 },
    dark: { src: '/LandingPageImages/ambience.png', width: 290, height: 210 },
    alt: 'Ambience',
    cornerClass: 'rounded-tr-3xl',
    positionClass: 'absolute top-0 right-0 z-20',
    blendLight: false,
  },
};

const BOTTOM_MOCKUPS = {
  tasks: {
    light: { src: '/LandingPageImages/Tasks.png', width: 1610, height: 1494 },
    dark: { src: '/LandingPageImages/landing-dark-image-2.png', width: 1039, height: 893 },
    alt: 'Tasks',
    side: 'left',
  },
  integrations: {
    light: { src: '/LandingPageImages/Integrations.png', width: 1080, height: 720 },
    dark: { src: '/LandingPageImages/landing-dark-image-1.png', width: 1171, height: 728 },
    alt: 'Integrations',
    side: 'right',
  },
};

const topMockupSizeClass =
  'h-auto w-[125px] md:w-[150px] lg:w-[190px] xl:w-[235px] 2xl:w-[290px] max-w-[34vw] md:max-w-[36vw] lg:max-w-none';

const bottomImgClass =
  'block h-auto w-[175px] md:w-[210px] lg:w-[250px] xl:w-[280px] 2xl:w-[295px] max-w-[42vw] md:max-w-[40vw] lg:max-w-none';

function HeroThemeImage({ light, dark, alt, className, sizes }) {
  const same = light.src === dark.src;
  if (same) {
    return (
      <Image
        src={light.src}
        alt={alt}
        width={light.width}
        height={light.height}
        className={className}
        sizes={sizes}
        priority
        fetchPriority="high"
        draggable={false}
      />
    );
  }

  return (
    <>
      <Image
        src={light.src}
        alt={alt}
        width={light.width}
        height={light.height}
        className={`dark:hidden ${className}`}
        sizes={sizes}
        priority
        fetchPriority="high"
        draggable={false}
      />
      <Image
        src={dark.src}
        alt=""
        width={dark.width}
        height={dark.height}
        className={`hidden dark:block ${className}`}
        sizes={sizes}
        priority
        fetchPriority="high"
        draggable={false}
      />
    </>
  );
}

function TopHeroMockup({ config }) {
  const blendClass = config.blendLight ? mockupBlendClass : 'object-contain';
  return (
    <div
      className={`${config.positionClass} hidden md:block pointer-events-none max-w-[38%] lg:max-w-[36%] xl:max-w-none landing-float-slow`}
    >
      <HeroThemeImage
        light={config.light}
        dark={config.dark}
        alt={config.alt}
        className={`${topMockupSizeClass} ${blendClass} ${config.cornerClass}`}
        sizes="(min-width: 1536px) 290px, (min-width: 1280px) 235px, (min-width: 1024px) 190px, 150px"
      />
    </div>
  );
}

function BottomHeroMockup({ config }) {
  const isLeft = config.side === 'left';
  const anchorClass = isLeft
    ? 'absolute bottom-0 left-0 z-20'
    : 'absolute bottom-0 right-0 z-20';
  const cornerRoundClass = isLeft
    ? 'rounded-bl-2xl sm:rounded-bl-3xl'
    : 'rounded-br-2xl sm:rounded-br-3xl';

  return (
    <div className={`${anchorClass} hidden md:block pointer-events-none landing-float-slower`}>
      <HeroThemeImage
        light={config.light}
        dark={config.dark}
        alt={config.alt}
        className={`${bottomImgClass} ${mockupBlendClass} ${cornerRoundClass}`}
        sizes="(min-width: 1536px) 295px, (min-width: 1280px) 280px, (min-width: 1024px) 250px, 210px"
      />
    </div>
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
          <HeroReveal className="flex justify-center mb-5 sm:mb-6 md:mb-7 lg:mb-10">
            <div className="bg-card/70 rounded-xl p-2.5 sm:p-3 border border-border shadow-lg shadow-black/5 dark:shadow-black/30">
              <Image
                src="/LandingPageImages/logo.png"
                alt="ThryvLoop Logo"
                width={72}
                height={72}
                className="object-contain w-14 h-14 sm:w-[72px] sm:h-[72px]"
                priority
                fetchPriority="high"
              />
            </div>
          </HeroReveal>

          <HeroReveal className="text-center max-w-[720px] mx-auto px-2 md:px-6 lg:px-4">
            <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-400 mb-4">
              Transform digital workspaces
            </p>
            <h1 className="landing-display text-3xl sm:text-4xl md:text-[2.35rem] lg:text-[2.75rem] xl:text-[3.5rem] mb-0">
              One Hub
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">
                Zero App-Hopping
              </span>
            </h1>
            <p className="landing-body text-base sm:text-lg md:text-[1.05rem] mb-6 sm:mb-8 mt-4 sm:mt-5 max-w-lg mx-auto">
              Unify your tasks, focus and analytics. One workspace for individuals and teams to measure and boost productivity.
            </p>
            <div className="flex justify-center">
              <button
                type="button"
                onClick={onGetStartedClick}
                className="landing-cta-shine w-full sm:w-auto px-8 py-3 rounded-full font-semibold bg-linear-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-600 hover:to-purple-700 hover:shadow-indigo-500/35 transition-all hover:-translate-y-0.5"
              >
                Get Started
              </button>
            </div>
          </HeroReveal>
        </div>
      </div>
    </section>
  );
}
