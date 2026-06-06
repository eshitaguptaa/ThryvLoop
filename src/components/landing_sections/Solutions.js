import Link from "next/link";
import { SPACES_CATALOG } from '@/lib/spacesCatalog';
import TeamsNotifyForm from '@/components/landing_sections/TeamsNotifyForm';
import { ScrollReveal, ScrollStagger, ScrollItem } from '@/components/landing_sections/ScrollReveal';

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
      if (text) text.style.color = "var(--dark)"; // Revert text color
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
    <main className="relative w-full overflow-hidden">

      {/* ================= HERO ================= */}
<section className="relative text-center px-6 pt-28 pb-24 overflow-hidden">

  {/* GRID BACKGROUND */}
  <div
    className="absolute inset-0"
    style={{
      backgroundImage: `
        linear-gradient(to right, rgba(99,102,241,0.06) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(99,102,241,0.06) 1px, transparent 1px)
      `,
      backgroundSize: "32px 32px",
    }}
  />

  {/* SOFT PURPLE GLOW */}
  <div
  className="absolute inset-x-0 -bottom-0 h-[150%]"
  style={{
    background:
      "radial-gradient(ellipse 80% 60% at 50% 100%, rgba(139,92,246,0.22), transparent 75%)",
  }}
/>


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

    {/* TITLE (DECREASED SIZE) */}
    <h1
      className="font-extrabold tracking-tight leading-tight mb-6"
      style={{
        fontSize: "clamp(2.6rem, 5vw, 4.2rem)",
        color: "var(--dark)",
      }}
    >
      The Ultimate{" "}
      <span
        className="text-transparent bg-clip-text"
        style={{
          backgroundImage:
            "linear-gradient(90deg, var(--secondary), var(--primary))",
        }}
      >
        Productivity
      </span>{" "}
      Powerhouse
    </h1>

    {/* SUBTEXT */}
    <p
      className="max-w-3xl mx-auto text-base sm:text-lg"
      style={{ color: "var(--gray)" }}
    >
      Designed for solo creators, freelancers, and professionals to eliminate
      cognitive overload, reclaim focus, and achieve deep work in a beautiful,
      unified workspace.
    </p>

  </ScrollReveal>
</section>

      {/* ================= CARD ================= */}
      <section className="px-6 pb-32">
        <ScrollReveal variant="scaleIn">
        <div
          className="max-w-6xl mx-auto rounded-3xl shadow-xl"
          style={{
            backgroundColor: "rgba(99,102,241,0.06)",
            border: "1px solid rgba(99,102,241,0.15)",
          }}
        >
          <ScrollStagger className="p-10 md:p-14 grid grid-cols-1 lg:grid-cols-2 gap-16" stagger={0.14}>
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
                style={{ color: "var(--dark)" }}
              >
                Everything You Need. <br />
                Nothing You Don't.
              </h2>

              <p
                className="mb-10 max-w-xl"
                style={{ color: "var(--gray)" }}
              >
                Transform your digital workspace into a sanctuary of focus.
                We've integrated the best-in-class tools, so you can stop
                switching contexts and start creating.
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

              <p className="mt-4 text-sm" style={{ color: "var(--gray)" }}>
                No credit card required
              </p>
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
                    style={{ color: "var(--dark)", transition: "color 0.3s ease" }}
                  >
                    {item}
                  </span>
                </div>
              ))}
            </div>
            </ScrollItem>
          </ScrollStagger>
        </div>
        </ScrollReveal>
      </section>

      {/* ================= TEAMS ================= */}
<section className="relative px-6 py-14 text-center overflow-hidden">

  {/* GRID BACKGROUND */}
  <div
    className="absolute inset-0"
    style={{
      backgroundImage: `
        linear-gradient(to right, rgba(99,102,241,0.05) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(99,102,241,0.05) 1px, transparent 1px)
      `,
      backgroundSize: "32px 32px",
    }}
  />

  {/* BLUE–PURPLE GLOW */}
  <div
    className="absolute inset-x-0 bottom-0 h-[180%]"
    style={{
      background:
        "radial-gradient(ellipse 85% 65% at 50% 85%, rgba(99,102,241,0.18), rgba(139,92,246,0.12), transparent 75%)",
    }}
  />

  <ScrollReveal className="relative max-w-3xl mx-auto">

    {/* BADGE */}
    <span
      className="inline-block px-5 py-2 rounded-full text-xs font-semibold tracking-wide mb-6"
      style={{
        backgroundColor: "rgba(99,102,241,0.15)",
        color: "var(--primary)",
      }}
    >
      COMING SOON
    </span>

    {/* TITLE */}
    <h2
      className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-6"
      style={{ color: "var(--dark)" }}
    >
      Powerhouse for{" "}
      <span
        className="text-transparent bg-clip-text"
        style={{
          backgroundImage:
            "linear-gradient(90deg, var(--primary), #3b82f6)",
        }}
      >
        Teams
      </span>
    </h2>

    {/* DESCRIPTION */}
    <p
      className="text-lg leading-relaxed max-w-3xl mx-auto mb-12"
      style={{ color: "var(--gray)" }}
    >
      Bring the power of focused work to your entire organization.
      Collaborative features, project management, and shared workspaces
      are on the way to supercharge your team's productivity.
    </p>

    <TeamsNotifyForm />
  </ScrollReveal>
</section>

    </main>
  );
}
