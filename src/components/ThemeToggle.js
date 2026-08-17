'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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
  const [menuPos, setMenuPos] = useState(/** @type {{ top: number, left: number } | null} */ (null));
  const rootRef = useRef(/** @type {HTMLDivElement | null} */ (null));
  const menuRef = useRef(/** @type {HTMLDivElement | null} */ (null));
  const triggerRef = useRef(/** @type {HTMLButtonElement | null} */ (null));

  useEffect(() => setMounted(true), []);

  const placeMenu = () => {
    const btn = triggerRef.current;
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    const menuW = 148;
    const gap = 8;

    if (variant === 'sidebar') {
      // Open to the right of the narrow rail so labels aren't clipped by overflow
      let left = r.right + gap;
      let top = r.bottom - 8; // align near bottom of icon
      if (left + menuW > window.innerWidth - 8) {
        left = Math.max(8, r.left - menuW - gap);
      }
      // Keep fully on-screen vertically
      const estimatedH = 140;
      if (top + estimatedH > window.innerHeight - 8) {
        top = Math.max(8, window.innerHeight - estimatedH - 8);
      }
      if (top < 8) top = 8;
      setMenuPos({ top, left });
      return;
    }

    // compact / landing: below the control, right-aligned
    let left = r.right - menuW;
    let top = r.bottom + gap;
    if (left < 8) left = 8;
    if (left + menuW > window.innerWidth - 8) left = window.innerWidth - menuW - 8;
    if (top + 140 > window.innerHeight - 8) {
      top = Math.max(8, r.top - 140 - gap);
    }
    setMenuPos({ top, left });
  };

  useLayoutEffect(() => {
    if (!open) {
      setMenuPos(null);
      return undefined;
    }
    placeMenu();
    const onReposition = () => placeMenu();
    window.addEventListener('resize', onReposition);
    window.addEventListener('scroll', onReposition, true);
    return () => {
      window.removeEventListener('resize', onReposition);
      window.removeEventListener('scroll', onReposition, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- placeMenu closes over variant
  }, [open, variant]);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      const t = e.target;
      if (rootRef.current?.contains(t)) return;
      if (menuRef.current?.contains(t)) return;
      setOpen(false);
    };
    const handleKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
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

  const menu = open && menuPos && typeof document !== 'undefined'
    ? createPortal(
        <div
          ref={menuRef}
          role="listbox"
          aria-label="Theme options"
          className="fixed z-[200] min-w-[140px] rounded-xl border border-border bg-card py-1 shadow-lg"
          style={{ top: menuPos.top, left: menuPos.left }}
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
        </div>,
        document.body
      )
    : null;

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={triggerClass}
        aria-label="Theme"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <ActiveIcon className="w-4 h-4" aria-hidden />
      </button>
      {menu}
    </div>
  );
}
