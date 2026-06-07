'use client';

import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';
import clsx from 'clsx';

const MENU_Z_INDEX = 100000;

export default function TaskSelect({
  value,
  onChange,
  options,
  placeholder = 'Select…',
  size = 'md',
  className,
  id,
  'aria-label': ariaLabel,
  renderValue,
  renderOption,
}) {
  const [open, setOpen] = useState(false);
  const [menuRect, setMenuRect] = useState(null);
  const [mounted, setMounted] = useState(false);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updateMenuRect = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const menuMaxHeight = 224;
    const gap = 6;
    const spaceBelow = window.innerHeight - rect.bottom - gap;
    const openUp = spaceBelow < Math.min(menuMaxHeight, 160) && rect.top > spaceBelow;

    setMenuRect({
      top: openUp ? rect.top - gap : rect.bottom + gap,
      left: rect.left,
      width: rect.width,
      openUp,
    });
  };

  useLayoutEffect(() => {
    if (!open) {
      setMenuRect(null);
      return;
    }
    updateMenuRect();
    window.addEventListener('resize', updateMenuRect);
    window.addEventListener('scroll', updateMenuRect, true);
    return () => {
      window.removeEventListener('resize', updateMenuRect);
      window.removeEventListener('scroll', updateMenuRect, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e) => {
      const inTrigger = rootRef.current?.contains(e.target);
      const inMenu = menuRef.current?.contains(e.target);
      if (!inTrigger && !inMenu) setOpen(false);
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const timer = window.setTimeout(() => {
      document.addEventListener('mousedown', onPointerDown);
      document.addEventListener('keydown', onKeyDown);
    }, 0);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const triggerPadding = size === 'sm' ? 'px-3 py-2 text-sm' : 'px-4 py-3';

  const menu =
    mounted && open && menuRect
      ? createPortal(
          <div
            ref={menuRef}
            style={{
              position: 'fixed',
              top: menuRect.openUp ? undefined : menuRect.top,
              bottom: menuRect.openUp ? window.innerHeight - menuRect.top : undefined,
              left: menuRect.left,
              width: menuRect.width,
              zIndex: MENU_Z_INDEX,
            }}
            className="origin-top"
          >
            <ul
              role="listbox"
              className="max-h-56 overflow-y-auto rounded-xl border border-border bg-card py-1 shadow-[0_16px_40px_-12px_rgba(15,23,42,0.18)] dark:shadow-[0_16px_40px_-12px_rgba(0,0,0,0.55)]"
            >
              {options.map((option) => {
                const isSelected = option.value === value;
                const key = option.value === '' ? '__empty' : option.value;
                return (
                  <li key={key} role="presentation">
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => {
                        onChange(option.value);
                        setOpen(false);
                      }}
                      className={clsx(
                        'w-full flex items-center gap-2.5 px-3 text-left transition-colors duration-150 cursor-pointer',
                        size === 'sm' ? 'py-2 text-sm' : 'py-2.5',
                        isSelected
                          ? 'bg-orange-50 text-orange-900 dark:bg-orange-950/45 dark:text-orange-100'
                          : 'text-foreground hover:bg-muted/80',
                      )}
                    >
                      {renderOption ? (
                        renderOption(option, isSelected)
                      ) : (
                        <>
                          <span className="flex-1 truncate">{option.label}</span>
                          {isSelected ? (
                            <Check className="h-4 w-4 shrink-0 text-orange-600 dark:text-orange-400" aria-hidden />
                          ) : null}
                        </>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>,
          document.body,
        )
      : null;

  return (
    <div ref={rootRef} className={clsx('relative', className)}>
      <button
        ref={triggerRef}
        type="button"
        id={id}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={clsx(
          'w-full flex items-center justify-between gap-2 rounded-xl border-2 bg-card text-foreground text-left transition-all duration-200 cursor-pointer',
          triggerPadding,
          open
            ? 'border-transparent ring-2 ring-orange-500/55 shadow-sm'
            : 'border-border hover:border-orange-200/90 dark:hover:border-orange-500/35 hover:shadow-sm',
        )}
      >
        <span className="flex items-center gap-2 min-w-0 flex-1 truncate">
          {renderValue ? (
            renderValue(selected, value)
          ) : (
            <span className={clsx('truncate', !selected && 'text-muted-foreground')}>
              {selected?.label ?? placeholder}
            </span>
          )}
        </span>
        <ChevronDown
          className={clsx(
            'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ease-out',
            open && 'rotate-180',
          )}
          aria-hidden
        />
      </button>

      {menu}
    </div>
  );
}
