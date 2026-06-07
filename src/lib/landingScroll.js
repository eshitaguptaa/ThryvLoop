export const LANDING_NAV_HEIGHT = 64;

export const LANDING_SECTIONS = [
  { id: 'features', label: 'Features' },
  { id: 'solutions', label: 'Solutions' },
  { id: 'resources', label: 'Resources' },
  { id: 'pricing', label: 'Pricing' },
];

/** Scroll to a landing section, offset for the fixed navbar. */
export function scrollToLandingSection(id, behavior = 'smooth') {
  if (typeof window === 'undefined') return false;
  const el = document.getElementById(id);
  if (!el) return false;

  const top = el.getBoundingClientRect().top + window.scrollY - LANDING_NAV_HEIGHT;
  window.scrollTo({ top: Math.max(0, top), behavior });
  window.history.replaceState(null, '', `#${id}`);
  return true;
}
