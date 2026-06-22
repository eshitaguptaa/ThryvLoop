import { ScrollReveal, ScrollStagger, ScrollItem } from '@/components/landing_sections/ScrollReveal';

const PILLARS = [
  {
    title: 'Transform digital workspaces',
    body: 'Stop juggling tools. Give your team or yourself a single workspace designed for everyday work.',
    Icon: CubeWireframeIcon,
  },
  {
    title: 'One workspace. Zero toggles.',
    body: 'Tasks, calendar, focus tools, and analytics all in one place. Spend less time switching apps and more time getting things done.',
    Icon: CheckCircleIcon,
  },
  {
    title: 'Measure your productivity',
    body: "Track your focus time, task speed and weekly trends. Get real numbers that prove your workflow is improving.",
    Icon: TrendingLineIcon,
  },
];

function CubeWireframeIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 4.5L19.5 9v6L12 19.5 4.5 15V9L12 4.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M12 4.5V12M12 12L19.5 9M12 12L4.5 9M12 12v7.5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function CheckCircleIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8.25" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M8.25 12.25l2.5 2.5 5-5.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrendingLineIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4.5 16.5L9 12l3.5 3L19.5 7.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14.5 7.5H19.5V12.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ValuePropositions() {
  return (
    <section
      id="why-thryvloop"
      aria-label="Why ThryvLoop"
      className="relative overflow-hidden bg-surface text-foreground dark:bg-[#07070d] dark:text-white"
    >
      {/* Purple ambient glow — left + center */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 landing-glow-drift landing-glow-pulse dark:hidden"
        style={{
          background:
            'radial-gradient(ellipse 55% 70% at 8% 45%, rgba(124,58,237,0.14), transparent 68%), radial-gradient(ellipse 45% 55% at 72% 60%, rgba(99,102,241,0.08), transparent 70%)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 landing-glow-drift landing-glow-pulse hidden dark:block"
        style={{
          background:
            'radial-gradient(ellipse 55% 70% at 8% 45%, rgba(124,58,237,0.32), transparent 68%), radial-gradient(ellipse 45% 55% at 72% 60%, rgba(99,102,241,0.14), transparent 70%)',
        }}
      />

      {/* Subtle animated grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 landing-grid-flow dark:hidden"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(99,102,241,0.09) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(99,102,241,0.09) 1px, transparent 1px)
          `,
          backgroundSize: '32px 32px',
          maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 landing-grid-flow hidden dark:block"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(139,92,246,0.11) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(139,92,246,0.11) 1px, transparent 1px)
          `,
          backgroundSize: '32px 32px',
          maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
        }}
      />

      {/* Soft blend from hero above */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-24 sm:h-32"
        style={{
          background: 'linear-gradient(to bottom, var(--surface), transparent)',
        }}
      />

      {/* Soft blend into features below */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-24 sm:h-32"
        style={{
          background: 'linear-gradient(to top, var(--surface), transparent)',
        }}
      />

      <div className="relative z-10 max-w-[1280px] mx-auto px-4 sm:px-6 pt-20 sm:pt-24 lg:pt-28 pb-14 sm:pb-16">
        <ScrollReveal className="text-center max-w-3xl mx-auto mb-14 sm:mb-16 lg:mb-20">
          <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.22em] text-violet-600 dark:text-violet-300/90 mb-4 sm:mb-5">
            Why ThryvLoop
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold tracking-tight text-foreground dark:text-white leading-[1.12] mb-4 sm:mb-5">
            Upgrade your workflow, not your tab count.
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Our design DNA is simple: give you a better workspace, keep it all in one hub and drive real productivity.
          </p>
        </ScrollReveal>

        <ScrollStagger className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6" stagger={0.1}>
          {PILLARS.map(({ title, body, Icon }) => (
            <ScrollItem key={title}>
              <article className="group h-full rounded-2xl border border-border bg-card/90 backdrop-blur-xl p-7 sm:p-8 shadow-sm shadow-violet-200/30 transition-all duration-500 hover:border-violet-300 hover:bg-card hover:-translate-y-1.5 hover:shadow-lg hover:shadow-violet-200/40 dark:border-white/[0.08] dark:bg-white/[0.04] dark:shadow-none dark:hover:border-violet-400/25 dark:hover:bg-white/[0.06] dark:hover:shadow-lg dark:hover:shadow-violet-900/20">
                <div
                  className="mb-6 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg shadow-violet-500/25 dark:shadow-violet-900/40"
                  aria-hidden
                >
                  <Icon />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-foreground dark:text-white mb-3 tracking-tight">{title}</h3>
                <p className="text-sm sm:text-[0.95rem] text-muted-foreground leading-relaxed">{body}</p>
              </article>
            </ScrollItem>
          ))}
        </ScrollStagger>
      </div>
    </section>
  );
}
