'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { HeroReveal } from '@/components/landing_sections/ScrollReveal';
import { heroContent, heroImage, heroLine } from '@/lib/landingMotion';

export default function Hero({ onGetStartedClick }) {
  return (
    <section className="mt-6 px-6 py-10 flex justify-center bg-white relative overflow-visible min-h-screen">
      <div className="max-w-[1280px] w-full relative bg-gray-100 rounded-3xl min-h-[600px] border border-gray-300">
        <div
          className="absolute inset-0 opacity-100 pointer-events-none rounded-3xl"
          style={{
            backgroundImage: `
              radial-gradient(circle, rgba(0, 0, 0, 0.05) 2px, transparent 2px),
              radial-gradient(circle, rgba(0, 0, 0, 0.05) 2px, transparent 2px)
            `,
            backgroundSize: '16px 16px, 16px 16px',
            backgroundPosition: '0 0, 8px 8px',
          }}
        />

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
            className="object-contain rounded-tl-3xl"
            unoptimized
          />
        </HeroReveal>

        <HeroReveal className="absolute bottom-0 right-4 z-20" variants={heroImage} delay={0.45}>
          <Image
            src="/LandingPageImages/Integrations.png"
            alt="Integrations"
            width={280}
            height={200}
            className="object-contain rounded-br-3xl"
            unoptimized
          />
        </HeroReveal>

        <HeroReveal className="absolute bottom-0 left-4 z-20" variants={heroImage} delay={0.3}>
          <Image
            src="/LandingPageImages/tasks.png"
            alt="Tasks"
            width={270}
            height={200}
            className="object-contain rounded-bl-3xl"
            unoptimized
          />
        </HeroReveal>

        <div className="relative z-10 p-12">
          <HeroReveal className="flex justify-center mb-10 mt-8" variants={heroLine}>
            <div
              className="bg-white/70 rounded-xl p-3"
              style={{
                boxShadow:
                  '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 15px 30px -10px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
              }}
            >
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
                className="px-8 py-3 rounded-full font-medium bg-neutral-900 text-white hover:bg-neutral-800 transition-colors"
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
