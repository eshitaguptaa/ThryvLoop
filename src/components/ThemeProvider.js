'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { NEXT_THEMES_STORAGE_KEY } from '@/lib/themePreferences';

export default function ThemeProvider({ children }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      enableColorScheme
      storageKey={NEXT_THEMES_STORAGE_KEY}
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
