'use client';

import { useEffect, useRef, useState } from 'react';
import { useTheme } from 'next-themes';
import { useUser } from '@clerk/nextjs';
import { Monitor, Moon, Sun } from 'lucide-react';
import { saveThemePreference } from '@/lib/themePreferences';

const OPTIONS = [
  { value: 'light', label: 'Light', Icon: Sun },
  { value: 'dark', label: 'Dark', Icon: Moon },
  { value: 'system', label: 'System', Icon: Monitor },
];

/**
 * @param {{ variant?: 'sidebar' | 'landing' | 'compact', className?: string, userId?: string|null }} props
 */
export default function ThemeToggle({ variant = 'compact', className = '', userId = null }) {
  const { theme, setTheme } = useTheme();
  const { user } = useUser();
  const resolvedUserId = userId ?? user?.id ?? null;
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  if (!mounted) {
    return (
      <div
        className={`h-9 w-9 rounded-lg bg-muted/50 animate-pulse ${className}`}
        aria-hidden
      />
    );
  }

  const active = OPTIONS.find((o) => o.value === theme) ?? OPTIONS[2];
  const ActiveIcon = active.Icon;

  const handleSelect = (value) => {
    setTheme(value);
    saveThemePreference(resolvedUserId, value);
    setOpen(false);
  };

  const triggerClass =
    variant === 'sidebar'
      ? 'flex items-center justify-center w-10 h-10 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer'
      : variant === 'landing'
        ? 'flex items-center justify-center w-9 h-9 rounded-lg border border-border bg-card text-foreground hover:bg-muted transition-colors cursor-pointer'
        : 'flex items-center justify-center w-9 h-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer';

  const menuOptions =
    variant === 'landing'
      ? OPTIONS.filter((o) => o.value !== theme)
      : OPTIONS;

  return (
    <div ref={menuRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={triggerClass}
        aria-label="Theme"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <ActiveIcon className="w-4 h-4" aria-hidden />
      </button>

      {open ? (
        <div
          role="listbox"
          aria-label="Theme options"
          className={`absolute z-50 min-w-[140px] rounded-xl border border-border bg-card py-1 shadow-lg ${
            variant === 'sidebar' ? 'left-full ml-2 bottom-0' : 'right-0 top-full mt-2'
          }`}
        >
          {menuOptions.map(({ value, label, Icon }) => (
            <button
              key={value}
              type="button"
              role="option"
              aria-selected={theme === value}
              onClick={() => handleSelect(value)}
              className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors cursor-pointer ${
                theme === value
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-foreground hover:bg-muted'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" aria-hidden />
              {label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
