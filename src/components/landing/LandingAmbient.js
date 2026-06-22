'use client';

import { useReducedMotion } from 'framer-motion';

/** Soft page-wide color orbs — visible in section transitions, respects reduced motion. */
export default function LandingAmbient() {
  const reduced = useReducedMotion();
  if (reduced) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
      <div className="landing-glow-drift absolute -top-[18%] -left-[12%] h-[55vh] w-[55vw] rounded-full bg-indigo-500/[0.07] blur-[100px]" />
      <div className="landing-glow-drift-alt absolute top-[38%] -right-[14%] h-[48vh] w-[48vw] rounded-full bg-violet-500/[0.06] blur-[110px]" />
      <div className="landing-glow-drift absolute bottom-[8%] left-[22%] h-[40vh] w-[40vw] rounded-full bg-sky-500/[0.05] blur-[90px]" style={{ animationDelay: '-8s' }} />
    </div>
  );
}
