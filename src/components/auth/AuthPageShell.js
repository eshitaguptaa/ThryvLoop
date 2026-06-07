'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';

export function useClerkAppearance() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === 'dark';

  return {
    variables: {
      colorPrimary: '#6366f1',
      colorBackground: isDark ? '#1e293b' : '#ffffff',
      colorInputBackground: isDark ? '#111827' : '#f1f5f9',
      colorInputText: isDark ? '#f8fafc' : '#0f172a',
      colorText: isDark ? '#f8fafc' : '#0f172a',
      colorTextSecondary: isDark ? '#94a3b8' : '#64748b',
      borderRadius: '0.75rem',
    },
    elements: {
      rootBox: 'mx-auto',
      card: 'shadow-xl',
    },
  };
}

export default function AuthPageShell({ children }) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === 'dark';

  return (
    <div
      className={`min-h-screen flex items-center justify-center ${
        isDark
          ? 'bg-linear-to-br from-slate-900 via-purple-900 to-slate-900'
          : 'bg-surface'
      }`}
    >
      {children}
    </div>
  );
}
