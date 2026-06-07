import Link from 'next/link';
import { SPACES_CATALOG } from '@/lib/spacesCatalog';
import { ScrollReveal, ScrollStagger, ScrollItem } from '@/components/landing_sections/ScrollReveal';

const SPACES_COUNT = SPACES_CATALOG.length;
const FREE_SPACES_COUNT = 5;

export default function Pricing() {
  return (
    // Base colors using standard classes
    <section className="pt-10 pb-20 px-6 bg-background" id="pricing">
        <div className="max-w-7xl mx-auto">
          
          {/* Header */}
          <ScrollReveal as="header" className="text-center mb-16">
            
            {/* UPDATED: Pricing Plans Badge with animated dot, using indigo colors */}
            <div className="relative z-20 inline-flex items-center gap-2 rounded-full bg-card/70 px-4 py-1.5 text-xs font-semibold text-indigo-600 ring-1 ring-inset ring-border shadow-sm uppercase mb-6">
                <span className="relative flex h-2 w-2">
                  {/* Pulsing effect using indigo-600 */}
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-600 opacity-75"></span>
                  {/* Solid dot using indigo-600 */}
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
                </span>
                Pricing Plans
            </div>
            
            {/* UPDATED: Title with Indigo/Violet Gradient */}
            <h1 className="landing-display text-4xl sm:text-5xl lg:text-[3.25rem] text-foreground">
              Simple, Transparent Pricing
            </h1>
            
            <p className="mt-6 max-w-3xl mx-auto landing-body text-lg">
              Start free. Upgrade for deeper insights, pro features, and a premium experience.
            </p>
          </ScrollReveal>

          {/* Cards Grid: lg:grid-cols-4 */}
          <ScrollStagger className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-[1100px] mx-auto" stagger={0.07}>
            
            {/* 1. Free Card (Light Theme) */}
            <ScrollItem>
            <div className="bg-card border-2 border-border rounded-2xl p-8 flex flex-col transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 h-full">
              <div className="flex-grow">
                <h3 className="text-2xl font-semibold text-foreground mb-1.5">Free</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">Forever free — useful &amp; complete</p>
                
                <div className="mt-7 mb-9">
                  {/* Price size matches screenshot */}
                  <span className="text-5xl font-extrabold tracking-tight text-foreground">₹0</span>
                </div>

                <ul className="space-y-3.5 text-muted-foreground">
                  {[
                    `${FREE_SPACES_COUNT} Focus Spaces (select)`,
                    "Standard Pomodoro timer",
                    "Full task lists + subtasks",
                    "Basic productivity dashboard",
                    "Basic soundscape mixer",
                    "Read-only Gmail & Calendar preview",
                    "5 AI assistant messages / day",
                    "Community support",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start">
                      {/* Checkmark style */}
                      <div className="flex-shrink-0 w-5 h-5 mr-3 mt-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-500 dark:text-indigo-400 flex items-center justify-center">
                          <span className="material-symbols-outlined text-sm font-bold" style={{ fontSize: '14px', lineHeight: '14px' }}>check</span>
                      </div>
                      <span className="text-sm leading-relaxed flex-1">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Button (indigo-500/slate-100) */}
              <a
                href="/signup?plan=free"
                className="mt-8 w-full py-3 px-6 font-semibold text-indigo-500 dark:text-indigo-400 bg-slate-100 dark:bg-muted rounded-lg transition-colors duration-300 hover:bg-slate-200 dark:hover:bg-muted/80 text-center"
              >
                Get Started — Free
              </a>
            </div>
            </ScrollItem>

            {/* 2. Pro Monthly Card (Most Popular - Primary Accent) */}
            <ScrollItem>
            <div className="relative bg-card border-2 border-indigo-500 rounded-2xl p-8 flex flex-col shadow-2xl shadow-indigo-500/10 scale-105 h-full">
              
              {/* "Most Popular" Badge (indigo-500) */}
              <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-indigo-500 text-white px-6 py-2 text-sm font-bold rounded-full shadow-lg text-center whitespace-nowrap">
                Most Popular
              </span>

              <div className="flex-grow pt-2">
                <h3 className="text-2xl font-semibold text-foreground mb-1.5">Pro Monthly</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">per month — cancel anytime</p>
                
                <div className="mt-7 mb-9 flex items-baseline gap-2">
                  {/* Price size matches screenshot */}
                  <span className="text-5xl font-extrabold tracking-tight text-foreground">₹89</span>
                  <span className="text-lg text-muted-foreground font-medium">/ month</span>
                </div>

                <ul className="space-y-3.5 text-muted-foreground">
                  {[
                    `All ${SPACES_COUNT} immersive 4K Focus Spaces`,
                    "Advanced Pomodoro (custom cycles & lock)",
                    "Full task management + smart reminders",
                    "Gmail & Google Calendar full sync",
                    "Custom soundscape composer + recipes",
                    "AI assistant (unlimited messages)",
                    "Layered ambient sound mixer",
                    "Advanced analytics & heatmaps",
                    "Priority support",
                    "14-day free trial",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start">
                      {/* Checkmark style */}
                      <div className="flex-shrink-0 w-5 h-5 mr-3 mt-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-500 dark:text-indigo-400 flex items-center justify-center">
                          <span className="material-symbols-outlined text-sm font-bold" style={{ fontSize: '14px', lineHeight: '14px' }}>check</span>
                      </div>
                      <span className="text-sm leading-relaxed flex-1">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Button (indigo-500) */}
              <a
                href="/signup?plan=monthly"
                className="mt-8 w-full py-3 px-6 font-semibold text-white bg-indigo-500 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/40 hover:-translate-y-0.5 text-center"
              >
                Start 14-Day Trial
              </a>
            </div>
            </ScrollItem>

            {/* 3. Pro Yearly Card (Light Theme) */}
            <ScrollItem>
            <div className="bg-card border-2 border-border rounded-2xl p-8 flex flex-col transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 h-full">
              <div className="flex-grow">
                <h3 className="text-2xl font-semibold text-foreground mb-1.5">Pro Yearly</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">Best value — save ~45% vs monthly</p>
                
                <div className="mt-7 mb-9 flex items-baseline gap-2">
                  {/* Price size matches screenshot */}
                  <span className="text-5xl font-extrabold tracking-tight text-foreground">₹599</span>
                  <span className="text-lg text-muted-foreground font-medium">/ year</span>
                </div>

                <ul className="space-y-3.5 text-muted-foreground">
                  {[
                    "Everything in Pro (monthly)",
                    "Priority updates & early access to Focus Spaces",
                    "Personalized AI weekly productivity report",
                    "Exclusive yearly soundscape & ambience packs",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start">
                      {/* Checkmark style */}
                      <div className="flex-shrink-0 w-5 h-5 mr-3 mt-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-500 dark:text-indigo-400 flex items-center justify-center">
                          <span className="material-symbols-outlined text-sm font-bold" style={{ fontSize: '14px', lineHeight: '14px' }}>check</span>
                      </div>
                      <span className="text-sm leading-relaxed flex-1">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Button (indigo-500) */}
              <a
                href="/signup?plan=yearly"
                className="mt-8 w-full py-3 px-6 font-semibold text-white bg-indigo-500 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/40 hover:-translate-y-0.5 text-center"
              >
                Get Yearly & Save
              </a>
            </div>
            </ScrollItem>

            {/* 4. Lifetime Card — gold accent; dark gradient for readable text */}
            <ScrollItem>
            <div className="relative bg-gradient-to-br from-orange-50 to-amber-100 dark:from-amber-950/70 dark:to-orange-950/50 border-2 border-[#F59E0B] dark:border-amber-500/60 rounded-2xl p-8 flex flex-col transition-all duration-300 hover:shadow-2xl dark:hover:shadow-amber-900/20 hover:-translate-y-2 overflow-hidden h-full">
              
              <div className="flex-grow">
                <div className="flex items-center justify-center gap-3 mb-1.5">
                  <h3 className="text-2xl font-semibold text-foreground">Lifetime</h3>
                  <span className="px-2 py-0.5 text-xs font-medium text-[#D97706] dark:text-amber-200 bg-[#FCD34D]/70 dark:bg-amber-500/25 rounded-full shadow-sm text-center whitespace-nowrap">
                    Limited Offer
                  </span>
                </div>
                
                <p className="text-muted-foreground text-sm leading-relaxed">One-time payment</p>
                
                <div className="mt-7 mb-9 flex items-baseline gap-2">
                  <span className="text-5xl font-extrabold tracking-tight text-foreground">₹1,099</span>
                </div>

                <ul className="space-y-3.5 text-muted-foreground">
                  {[
                    "All Pro features forever",
                    "Lifetime access to new Focus Spaces & soundscapes",
                    "Lifetime AI credits & premium support",
                    "Invite-only community events",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start">
                      <span className="material-symbols-outlined mr-3 mt-0.5 text-[#F59E0B] dark:text-amber-400 flex-shrink-0" style={{ fontSize: '20px' }}>verified</span>
                      <span className="text-sm leading-relaxed flex-1">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <a
                href="/signup?plan=lifetime"
                className="mt-8 w-full py-3 px-6 font-semibold text-white bg-gradient-to-r from-[#F97316] to-[#F59E0B] rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-[#F97316]/40 hover:-translate-y-0.5 text-center"
              >
                Claim Lifetime Access
              </a>
            </div>
            </ScrollItem>
          </ScrollStagger>
          
          {/* Footer */}
          <ScrollReveal as="footer" className="text-center mt-12 max-w-3xl mx-auto" variant="fadeUpSoft" delay={0.15}>
            <p className="text-sm text-muted-foreground leading-relaxed">
              All plans include regular updates. Cancel anytime. No hidden fees.
            </p>
          </ScrollReveal>
        </div>
    </section>
  );
}