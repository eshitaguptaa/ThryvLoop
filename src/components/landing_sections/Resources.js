import Link from "next/link";
import { ScrollReveal, ScrollStagger, ScrollItem } from '@/components/landing_sections/ScrollReveal';
import { SectionBlend } from '@/components/landing_sections/SectionBlend';

// Define the custom structural classes, now relying on CSS variables for color values
const cardClasses = "relative overflow-hidden bg-card border border-border rounded-4xl transition-all duration-300 ease-out hover:border-[var(--secondary)] hover:shadow-2xl hover:shadow-[var(--secondary)]/30 hover:-translate-y-2";
const iconBtnClasses = "flex items-center justify-center w-10 h-10 rounded-full bg-[var(--white)]/50 backdrop-blur-sm text-[var(--white)] transition-all duration-300 hover:bg-[var(--white)]/75 hover:scale-110";

export default function Resources() {
  return (
    // Base colors using variables
    <div id="resources" className="relative w-full bg-background text-muted-foreground antialiased overflow-hidden">
      {/* Aurora — ThryvLoop purple in light mode; teal/sky in dark */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 landing-glow-drift-alt dark:hidden"
        style={{
          background: `
            conic-gradient(from 210deg at 50% 22%, rgba(91,77,237,0.1), rgba(139,92,246,0.08), rgba(99,102,241,0.06), transparent 62%),
            radial-gradient(ellipse 120% 90% at 78% 36%, rgba(139,92,246,0.08), transparent 58%),
            radial-gradient(ellipse 120% 90% at 18% 40%, rgba(91,77,237,0.07), transparent 58%)
          `,
          maskImage:
            'linear-gradient(to bottom, transparent 0%, transparent 6%, rgba(0,0,0,0.16) 12%, rgba(0,0,0,0.52) 24%, black 42%, black 100%)',
          WebkitMaskImage:
            'linear-gradient(to bottom, transparent 0%, transparent 6%, rgba(0,0,0,0.16) 12%, rgba(0,0,0,0.52) 24%, black 42%, black 100%)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 landing-glow-drift-alt hidden dark:block"
        style={{
          background: `
            conic-gradient(from 210deg at 50% 22%, rgba(6,182,212,0.14), rgba(56,189,248,0.1), rgba(99,102,241,0.08), rgba(16,185,129,0.1), transparent 62%),
            radial-gradient(ellipse 120% 90% at 78% 36%, rgba(14,165,233,0.12), transparent 58%),
            radial-gradient(ellipse 120% 90% at 18% 40%, rgba(20,184,166,0.11), transparent 58%),
            radial-gradient(ellipse 130% 80% at 50% 88%, rgba(15,23,42,0.35), transparent 65%)
          `,
          maskImage:
            'linear-gradient(to bottom, transparent 0%, transparent 6%, rgba(0,0,0,0.16) 12%, rgba(0,0,0,0.52) 24%, black 42%, black 100%)',
          WebkitMaskImage:
            'linear-gradient(to bottom, transparent 0%, transparent 6%, rgba(0,0,0,0.16) 12%, rgba(0,0,0,0.52) 24%, black 42%, black 100%)',
        }}
      />

      {/* Fine grid — purple in light, cool tint in dark */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 landing-grid-flow dark:hidden"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(91,77,237,0.07) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(91,77,237,0.07) 1px, transparent 1px)
          `,
          backgroundSize: '32px 32px',
          maskImage:
            'linear-gradient(to bottom, transparent 0%, transparent 6%, rgba(0,0,0,0.18) 18%, rgba(0,0,0,0.55) 32%, black 50%, black 100%)',
          WebkitMaskImage:
            'linear-gradient(to bottom, transparent 0%, transparent 6%, rgba(0,0,0,0.18) 18%, rgba(0,0,0,0.55) 32%, black 50%, black 100%)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 landing-grid-flow hidden dark:block"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(6,182,212,0.07) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(6,182,212,0.07) 1px, transparent 1px)
          `,
          backgroundSize: '32px 32px',
          maskImage:
            'linear-gradient(to bottom, transparent 0%, transparent 6%, rgba(0,0,0,0.18) 18%, rgba(0,0,0,0.55) 32%, black 50%, black 100%)',
          WebkitMaskImage:
            'linear-gradient(to bottom, transparent 0%, transparent 6%, rgba(0,0,0,0.18) 18%, rgba(0,0,0,0.55) 32%, black 50%, black 100%)',
        }}
      />

      <SectionBlend position="bottom" fromColor="transparent" toColor="background" size="md" />

      <main className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-12 pb-12 sm:pt-14 sm:pb-14">
        {/* Header */}
        <ScrollReveal as="header" className="text-center max-w-4xl mx-auto mb-16">
          {/* UPDATED: LEARN & GET STARTED BADGE 
            The structure is replicated, using --primary for accent color and --light for borders/rings.
          */}
          <div className="relative z-20 inline-flex items-center gap-2 rounded-full bg-card/70 px-4 py-1.5 text-xs font-semibold text-[var(--primary)] ring-1 ring-inset ring-border shadow-sm uppercase">
            <span className="relative flex h-2 w-2">
              {/* Pulsing effect using --primary */}
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--primary)] opacity-75"></span>
              {/* Solid dot using --primary */}
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--primary)]"></span>
            </span>
            LEARN & GET STARTED
          </div>
          
          {/* Header Gradient: Primary Dark via Secondary back to Primary Dark */}
          <h1 className="mt-4 landing-display text-4xl sm:text-5xl lg:text-[3.5rem] text-foreground">
            Unlock Your{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#5b4ded] to-[#3b82f6]">
              Potential
            </span>
          </h1>
          <p className="mt-6 landing-body text-lg sm:text-xl max-w-2xl mx-auto">
            Dive into our curated resources. Everything you need to master your
            workflow and accelerate your journey from novice to expert.
          </p>
        </ScrollReveal>

        {/* Main grid */}
        <ScrollStagger className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" stagger={0.07}>
          {/* Help Center Card */}
          <ScrollItem className="md:col-span-2 lg:col-span-2">
          <div className={`group h-full ${cardClasses} p-8 md:p-10 flex flex-col`}>
            <div className="flex items-center gap-4">
              {/* Icon Circle: Background --light, Text --primary */}
              <div className="flex-shrink-0 flex items-center justify-center w-16 h-16 rounded-full bg-[var(--light)] text-[var(--primary)]">
                <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 48" }}>
                  support_agent
                </span>
              </div>
              <div>
                {/* Title color: --dark */}
                <h3 className="text-3xl font-bold tracking-tight text-foreground">
                  Help Center
                </h3>
                {/* Secondary text color: --gray */}
                <p className="mt-1 text-lg text-[var(--gray)]">
                  Your complete guide to our platform.
                </p>
              </div>
            </div>

            {/* Search */}
            <div className="mt-8 relative search-container">
              {/* Icon color: --gray */}
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[var(--gray)] text-2xl pointer-events-none z-10">
                search
              </span>
              <input
                type="text"
                placeholder="How can we help?"
                // Input focus ring/border is PRIMARY purple
                className="w-full pl-12 pr-4 py-4 bg-[var(--light)] border-2 border-transparent rounded-xl text-[var(--dark-light)] placeholder:text-[var(--gray)] focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] focus:bg-[var(--white)] transition-all duration-300 shadow-sm focus:shadow-md"
              />
              <div className="search-suggestions absolute top-full left-0 right-0 mt-2 bg-[var(--white)] border border-[var(--light)] rounded-xl shadow-lg p-2 opacity-0 transform -translate-y-2 pointer-events-none transition-all duration-300 z-20">
                {/* Hover state: text --primary */}
                <a className="flex items-center gap-3 px-4 py-2 text-[var(--gray)] hover:bg-[var(--light)] hover:text-[var(--primary)] rounded-lg transition-colors" href="#">
                    <span className="material-symbols-outlined text-xl">history</span>
                    <span>How to add team members</span>
                </a>
                <a className="flex items-center gap-3 px-4 py-2 text-[var(--gray)] hover:bg-[var(--light)] hover:text-[var(--primary)] rounded-lg transition-colors" href="#">
                    <span className="material-symbols-outlined text-xl">history</span>
                    <span>Billing and invoices</span>
                </a>
              </div>
            </div>

            {/* FAQ */}
            <div className="mt-10 flex-grow grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
              {[
                { q: "How do I reset my password?", a: 'Go to the login page and click "Forgot Password". Follow the instructions sent to your email to create a new one.' },
                { q: "Where can I find my invoices?", a: "You can find all your past and current invoices under the 'Billing' section in your account settings." },
                { q: "How do I upgrade my plan?", a: "To upgrade your plan, visit the 'Subscription' page in your account and select a new plan." },
                { q: "Can I integrate with other apps?", a: "Yes, we support numerous third-party integrations. Visit our 'Integrations' marketplace to connect your favorite apps." },
              ].map((item) => (
                <div key={item.q} className="faq-item group/faq">
                  <a className="flex items-start justify-between gap-4" href="#">
                    {/* Text hover: --primary */}
                    <span className="font-semibold text-[var(--dark-light)] group-hover/faq:text-[var(--primary)] transition-colors">
                      {item.q}
                    </span>
                    {/* Icon Circle: Text --primary */}
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--light)] flex items-center justify-center text-[var(--primary)] faq-icon">
                      <span className="material-symbols-outlined text-base">add</span>
                    </div>
                  </a>
                  <p className="text-[var(--gray)] text-sm faq-answer">
                    {item.a}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-[var(--light)] flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-center">
              <p className="text-sm text-[var(--gray)]">
                Can't find what you're looking for?
              </p>
              {/* Link color: --primary */}
              <Link
                href="#"
                className="inline-flex items-center font-bold text-[var(--primary)] group/link"
              >
                <span>Visit Full Help Center</span>
                <span className="material-symbols-outlined ml-1.5 transition-transform duration-300 group-hover/link:translate-x-1">
                  arrow_forward
                </span>
              </Link>
            </div>
          </div>
          </ScrollItem>

          {/* Right column: Video Tutorials & Productivity Tips */}
          <ScrollItem className="md:col-span-2 lg:col-span-1 lg:col-start-3">
          <div className="grid grid-cols-1 gap-8 h-full">
            {/* Video Tutorials */}
            <div className={`group ${cardClasses} flex flex-col p-0`}>
              {/* Background gradient: Primary Dark via Secondary to Primary Dark (More Purple) */}
              <div className="relative aspect-video rounded-t-4xl overflow-hidden bg-gradient-to-br from-[var(--primary-dark)] via-[var(--secondary)] to-[var(--primary-dark)]">
                <div className="absolute inset-0 flex items-center justify-center">
                  {/* Play Button */}
                  <button className="w-20 h-20 flex items-center justify-center rounded-full bg-[var(--white)]/30 backdrop-blur-md group-hover:scale-110 transition-transform duration-300">
                    <span className="material-symbols-outlined text-[var(--white)] text-6xl !leading-none pl-1" style={{ fontVariationSettings: "'FILL' 1, 'wght' 300, 'GRAD' 0, 'opsz' 48" }}>
                      play_arrow
                    </span>
                  </button>
                </div>
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="text-[var(--white)] font-semibold text-sm">1:23 / 3:45</span>
                  <div className="flex items-center gap-2">
                    {/* Fullscreen Icon color: Secondary purple */}
                    <button className={iconBtnClasses}>
                      <span className="material-symbols-outlined text-[var(--secondary)] text-base">fullscreen</span>
                    </button>
                  </div>
                </div>
              </div>
              <div className="p-6 flex-grow flex flex-col">
                {/* Title color: --dark */}
                <h4 className="text-3xl font-bold tracking-tight text-[var(--dark)] !text-2xl">
                  Video Tutorials
                </h4>
                {/* Secondary text color: --gray */}
                <p className="mt-2 text-[var(--gray)] flex-grow">
                  Step-by-step video guides to master features.
                </p>
                {/* Link color: --primary */}
                <Link
                  href="#"
                  className="mt-4 inline-flex items-center font-bold text-[var(--primary)] group/link"
                >
                  <span>Watch Series</span>
                  <span className="material-symbols-outlined ml-1.5 transition-transform duration-300 group-hover/link:translate-x-1">
                    arrow_forward
                  </span>
                </Link>
              </div>
            </div>

            {/* Productivity Tips */}
            <div className={`group ${cardClasses} p-6 flex flex-col`}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {/* Icon Circle: Text --primary */}
                  <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full bg-[var(--light)] text-[var(--primary)]">
                    <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 48" }}>
                      lightbulb
                    </span>
                  </div>
                  <div>
                    {/* Title color: --dark */}
                    <h4 className="text-3xl font-bold tracking-tight text-[var(--dark)] !text-2xl">
                      Productivity Tips
                    </h4>
                    {/* Secondary text color: --gray */}
                    <p className="text-sm text-[var(--gray)]">
                      Actionable advice to boost your workflow.
                    </p>
                  </div>
                </div>
                {/* Streak Badge: Text --primary */}
                <div className="flex items-center gap-2 bg-[var(--light)] px-3 py-1.5 rounded-full text-[var(--primary)]">
                    <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1, 'wght' 600" }}>local_fire_department</span>
                    <span className="text-sm font-bold">5 Day Streak</span>
                </div>
              </div>

              {/* Quick Win Card */}
              <div className="mt-6 flex-grow flex flex-col justify-between">
                <div className="relative">
                  {/* Card background/border color: Background --light, Border --secondary/30 */}
                  <div className="flex flex-col text-center p-6 border-2 border-dashed border-[var(--secondary)]/30 rounded-2xl bg-[var(--light)]">
                    {/* Badge color: Text --primary */}
                    <span className="text-xs font-bold tracking-wider text-[var(--primary)] bg-[var(--white)]/50 px-2.5 py-1 rounded-full self-center">
                      QUICK WIN
                    </span>
                    {/* Title color: --dark */}
                    <h5 className="mt-4 text-xl font-extrabold text-[var(--dark)]">
                      Master Keyboard Shortcuts
                    </h5>
                    {/* Secondary text color: --gray */}
                    <p className="mt-2 text-[var(--gray)] h-20">
                      Utilize shortcuts like{" "}
                      {/* Keyboard shortcut colors: Text --primary */}
                      <kbd className="px-2 py-1.5 text-xs font-semibold text-[var(--primary)] bg-[var(--white)] border border-[var(--light)] rounded-md">
                        Ctrl+K
                      </kbd>{" "}
                      to access commands instantly and speed up your workflow.
                    </p>

                    {/* Action Buttons: Text hover is PRIMARY purple */}
                    <div className="mt-4 flex items-center justify-center gap-2">
                        <button className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--white)] shadow hover:bg-[var(--light)] text-[var(--gray)] hover:text-[var(--primary)] transition-all duration-200 group/btn" title="Mark as Complete">
                            <span className="material-symbols-outlined text-xl transition-transform duration-200 group-hover/btn:scale-110">task_alt</span>
                        </button>
                        <button className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--white)] shadow hover:bg-[var(--light)] text-[var(--gray)] hover:text-[var(--primary)] transition-all duration-200 group/btn" title="Share Tip">
                            <span className="material-symbols-outlined text-xl transition-transform duration-200 group-hover/btn:scale-110">share</span>
                        </button>
                        <button className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--white)] shadow hover:bg-[var(--light)] text-[var(--gray)] hover:text-[var(--primary)] transition-all duration-200 group/btn" title="Save Tip">
                            <span className="material-symbols-outlined text-xl transition-transform duration-200 group-hover/btn:scale-110">bookmark</span>
                        </button>
                    </div>
                  </div>
                </div>

                {/* Carousel controls: Text --primary */}
                <div className="mt-6 flex items-center justify-between">
                  {/* Button background: --light, Text --primary */}
                  <button className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--light)] text-[var(--primary)] hover:bg-[var(--light)] transition-colors">
                    <span className="material-symbols-outlined">chevron_left</span>
                  </button>
                  <div className="flex items-center gap-2">
                    {/* Active dot color: --primary */}
                    <span className="w-2.5 h-2.5 rounded-full bg-[var(--primary)]" />
                    {/* Inactive dot color: --light */}
                    <span className="w-2.5 h-2.5 rounded-full bg-[var(--light)]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[var(--light)]" />
                  </div>
                  {/* Button background: --light, Text --primary */}
                  <button className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--light)] text-[var(--primary)] hover:bg-[var(--light)] transition-colors">
                    <span className="material-symbols-outlined">chevron_right</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          </ScrollItem>
        </ScrollStagger>
      </main>
    </div>
  );
}