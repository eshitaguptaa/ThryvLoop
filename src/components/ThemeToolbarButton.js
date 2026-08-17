'use client';

import ThemeToggle from '@/components/ThemeToggle';

/**
 * Theme control styled for page headers / toolbars (not fixed overlays).
 */
export default function ThemeToolbarButton({ className = '' }) {
  return (
    <ThemeToggle
      variant="compact"
      className={`rounded-xl border border-border bg-card shadow-sm hover:shadow-md ${className}`.trim()}
    />
  );
}
