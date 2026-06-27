import Link from "next/link";
import { SPACES_CATALOG } from '@/lib/spacesCatalog';
import CompanyHubsNotifyForm from '@/components/landing_sections/CompanyHubsNotifyForm';
import WorkspaceEnvironment from '@/components/landing_sections/WorkspaceEnvironment';
import { ScrollReveal, ScrollStagger, ScrollItem } from '@/components/landing_sections/ScrollReveal';
import { SectionBlend, gridFadeStyle } from '@/components/landing_sections/SectionBlend';

export default function Solutions() {
  const featuresLeft = [
    `${SPACES_CATALOG.length} immersive 4K Focus Spaces`,
    "Custom soundscape composer",
    "Smart task management",
    "Distraction-free interface",
    "Layered ambient sound mixer",
  ];

  const featuresRight = [
    "Built-in Pomodoro timer",
    "Comprehensive analysis tracker",
    "Gmail & Calendar integrations",
    "AI chatbot assistant",
    "Personalized focus dashboard",
  ];

  // Helper function to set styles on hover for feature items
  const handleFeatureHover = (e, isHovering) => {
    const checkmark = e.currentTarget.querySelector('.feature-checkmark');
    const text = e.currentTarget.querySelector('.feature-text');

    if (isHovering) {
      // Hover effect: Change text color and scale the checkmark
      if (text) text.style.color = "var(--primary)"; // Change text to primary color
      if (checkmark) {
        checkmark.style.transform = "scale(1.2)";
        checkmark.style.color = "var(--white)"; // Change checkmark icon color to white
        checkmark.style.backgroundColor = "var(--primary-light)"; // New background color for the dot
      }
    } else {
      // Reset effect: Revert to original styles
      if (text) text.style.color = "var(--foreground)"; // Revert text color
      if (checkmark) {
        checkmark.style.transform = "scale(1)";
        checkmark.style.color = "var(--primary)"; // Revert checkmark icon color
        // The original component doesn't define a background for the checkmark wrapper.
        // We'll reset the temporary hover background for consistency.
        checkmark.style.backgroundColor = "transparent"; 
      }
    }
  };

  return (
    <main id="solutions" className="relative w-full overflow-hidden">

      {/* ================= HERO ================= */}
<section className="relative text-center px-6 pt-24 sm:pt-28 pb-24 overflow-hidden bg-background">

  {/* GRID BACKGROUND */}
  <div
    className="absolute inset-0 landing-grid-flow"
    style={{
      backgroundImage: `
        linear-gradient(to right, rgba(99,102,241,0.11) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(99,102,241,0.11) 1px, transparent 1px)
      `,
      backgroundSize: "32px 32px",
      ...gridFadeStyle('both'),
    }}
  />

  {/* SOFT PURPLE GLOW */}
  <div
  className="absolute inset-x-0 -bottom-0 h-[150%] landing-glow-drift landing-glow-pulse"
  style={{
    background:
      "radial-gradient(ellipse 80% 60% at 50% 100%, rgba(139,92,246,0.22), transparent 75%)",
    maskImage: 'linear-gradient(to bottom, black 40%, transparent 100%)',
    WebkitMaskImage: 'linear-gradient(to bottom, black 40%, transparent 100%)',
  }}
/>

  <SectionBlend position="bottom" fromColor="transparent" toColor="background" size="md" />


  <ScrollReveal className="relative max-w-4xl mx-auto">

    {/* BADGE */}
    <div className="relative z-20 inline-flex items-center gap-2 rounded-full bg-[var(--white)]/70 px-4 py-1.5 text-xs font-semibold text-[var(--primary)] ring-1 ring-inset ring-[var(--light)] shadow-sm uppercase">
            <span className="relative flex h-2 w-2">
              {/* Pulsing effect using --primary */}
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--primary)] opacity-75"></span>
              {/* Solid dot using --primary */}
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--primary)]"></span>
            </span>
            YOUR FOCUS SANCTUARY
          </div>

    {/* TITLE */}
    <h2
      className="font-extrabold tracking-tight leading-tight mb-6"
      style={{
        fontSize: "clamp(2.6rem, 5vw, 4.2rem)",
        color: "var(--foreground)",
      }}
    >
      One{" "}
      <span
        className="text-transparent bg-clip-text"
        style={{
          backgroundImage:
            "linear-gradient(90deg, var(--secondary), var(--primary))",
        }}
      >
        Productivity
      </span>{" "}
      Hub for Individuals
    </h2>

    {/* SUBTEXT */}
    <p
      className="max-w-3xl mx-auto text-base sm:text-lg"
      style={{ color: "var(--muted-foreground)" }}
    >
      Stop juggling tabs. ThryvLoop transforms your digital workspace into a single
      environment—so you reclaim focus, finish more, and see productivity improve week over week.
    </p>

  </ScrollReveal>
</section>

      {/* Card + Company Hubs share one background so the top edge stays seamless */}
      <div className="relative bg-background">
      {/* ================= CARD ================= */}
      <section className="relative z-10 px-6 pb-12 sm:pb-16">
        <div
          className="max-w-6xl mx-auto rounded-3xl shadow-xl transition-transform duration-500 hover:-translate-y-1"
          style={{
            backgroundColor: "rgba(99,102,241,0.06)",
            border: "1px solid rgba(99,102,241,0.15)",
          }}
        >
          <ScrollStagger className="p-8 md:p-10 lg:p-14 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16" stagger={0.1}>
            {/* LEFT */}
            <ScrollItem>
            <div>
              <span
                className="inline-block px-4 py-1.5 rounded-md text-sm font-semibold mb-6"
                style={{
                  backgroundColor: "var(--secondary)",
                  color: "var(--white)",
                }}
              >
                For Individuals
              </span>

              <h2
                className="text-3xl sm:text-4xl font-bold mb-6"
                style={{ color: "var(--foreground)" }}
              >
                Everything You Need. <br />
                Nothing You Don't.
              </h2>

              <p
                className="mb-10 max-w-xl"
                style={{ color: "var(--muted-foreground)" }}
              >
                Everything in one place—no toggling between apps. Transform your digital
                workspace into a sanctuary of focus and measurable output.
              </p>

              {/* UPDATED BUTTON WITH HOVER EFFECT */}
              <Link
                href="/signup?plan=monthly"
                className="relative inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold transition-all duration-300"
                style={{
                  backgroundColor: "var(--secondary)",
                  color: "var(--white)",
                  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1), 0 20px 25px -5px rgba(124, 58, 237, 0.3)", // Glow
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--primary)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 25px 50px -12px rgba(124, 58, 237, 0.5)"; // Enhanced glow
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--secondary)";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(0,0,0,0.1), 0 20px 25px -5px rgba(124, 58, 237, 0.3)"; // Reset glow
                }}
              >
                Start Your 14-Day Free Trial <span style={{ transition: "transform 0.3s ease" }} className="group-hover:translate-x-1">→</span>
              </Link>
            </div>
            </ScrollItem>

            {/* RIGHT - UPDATED LIST ITEMS WITH HOVER EFFECT */}
            <ScrollItem>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-4">
              {[...featuresLeft, ...featuresRight].map((item, i) => (
                <div 
                  key={i} 
                  className="flex items-start gap-2 cursor-pointer transition-colors duration-300"
                  onMouseEnter={(e) => handleFeatureHover(e, true)}
                  onMouseLeave={(e) => handleFeatureHover(e, false)}
                >
                  {/* The checkmark/icon wrapper with transition for scale/color */}
                  <span 
                    className="feature-checkmark relative flex items-center justify-center w-5 h-5 rounded-full"
                    style={{ 
                        color: "var(--primary)", 
                        transition: "all 0.3s ease",
                    }}
                  >
                      ✓
                  </span>
                  {/* The text content, also with transition for color */}
                  <span 
                    className="feature-text" 
                    style={{ color: "var(--foreground)", transition: "color 0.3s ease" }}
                  >
                    {item}
                  </span>
                </div>
              ))}
            </div>
            </ScrollItem>
          </ScrollStagger>
        </div>
      </section>

      {/* ================= COMPANY HUBS ================= */}
      <section
        id="company-hubs"
        className="relative z-10 px-6 pt-10 sm:pt-14 pb-16 sm:pb-20 text-center text-foreground dark:text-white overflow-hidden"
      >
  {/* Ambient glow — large soft radials; top stays pinned to parent background */}
  <div
    aria-hidden
    className="pointer-events-none absolute inset-0 z-0 landing-glow-drift-alt landing-glow-pulse dark:hidden"
    style={{
      background: `
        radial-gradient(ellipse 150% 105% at 50% 28%, rgba(99,102,241,0.12), transparent 62%),
        radial-gradient(ellipse 95% 85% at 12% 34%, rgba(124,58,237,0.08), transparent 58%),
        radial-gradient(ellipse 95% 85% at 88% 30%, rgba(59,130,246,0.08), transparent 58%)
      `,
      maskImage:
        'linear-gradient(to bottom, transparent 0%, transparent 6%, rgba(0,0,0,0.18) 11%, rgba(0,0,0,0.55) 22%, black 40%, black 100%)',
      WebkitMaskImage:
        'linear-gradient(to bottom, transparent 0%, transparent 6%, rgba(0,0,0,0.18) 11%, rgba(0,0,0,0.55) 22%, black 40%, black 100%)',
    }}
  />
  <div
    aria-hidden
    className="pointer-events-none absolute inset-0 z-0 landing-glow-drift-alt landing-glow-pulse hidden dark:block"
    style={{
      background: `
        radial-gradient(ellipse 150% 105% at 50% 28%, rgba(99,102,241,0.22), transparent 62%),
        radial-gradient(ellipse 95% 85% at 12% 34%, rgba(124,58,237,0.16), transparent 58%),
        radial-gradient(ellipse 95% 85% at 88% 30%, rgba(59,130,246,0.14), transparent 58%),
        radial-gradient(ellipse 110% 70% at 50% 92%, rgba(7,7,13,0.55), transparent 68%)
      `,
      maskImage:
        'linear-gradient(to bottom, transparent 0%, transparent 6%, rgba(0,0,0,0.18) 11%, rgba(0,0,0,0.55) 22%, black 40%, black 100%)',
      WebkitMaskImage:
        'linear-gradient(to bottom, transparent 0%, transparent 6%, rgba(0,0,0,0.18) 11%, rgba(0,0,0,0.55) 22%, black 40%, black 100%)',
    }}
  />

  {/* Grid — very subtle, fades in below the seamless top edge */}
  <div
    aria-hidden
    className="pointer-events-none absolute inset-0 z-0 landing-grid-flow"
    style={{
      backgroundImage: `
        linear-gradient(to right, rgba(99,102,241,0.09) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(99,102,241,0.09) 1px, transparent 1px)
      `,
      backgroundSize: '32px 32px',
      maskImage:
        'linear-gradient(to bottom, transparent 0%, transparent 6%, rgba(0,0,0,0.2) 16%, rgba(0,0,0,0.6) 30%, black 48%, black 100%)',
      WebkitMaskImage:
        'linear-gradient(to bottom, transparent 0%, transparent 6%, rgba(0,0,0,0.2) 16%, rgba(0,0,0,0.6) 30%, black 48%, black 100%)',
    }}
  />

  <SectionBlend position="bottom" fromColor="transparent" toColor="surface" size="lg" className="z-[1]" />

  <ScrollReveal className="relative z-10 max-w-3xl mx-auto">

    {/* BADGE */}
    <span
      className="inline-block px-5 py-2 rounded-full text-xs font-semibold tracking-wide mb-6 bg-violet-500/10 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300"
    >
      COMING SOON
    </span>

    {/* TITLE */}
    <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-6 text-foreground dark:text-white">
      Company Hubs{" "}
      <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-500 dark:from-[#a78bfa] dark:to-[#60a5fa]">
        for Organizations
      </span>
    </h2>

    {/* DESCRIPTION */}
    <p className="text-lg leading-relaxed max-w-3xl mx-auto mb-12 text-muted-foreground">
      Bring the same single-hub experience to your entire company. Shared goals,
      project visibility, and org-wide analytics—built to lift productivity across
      every department, not add another collaboration tool.
    </p>

    <CompanyHubsNotifyForm />
  </ScrollReveal>
</section>
      </div>

      <WorkspaceEnvironment />

    </main>
  );
}
