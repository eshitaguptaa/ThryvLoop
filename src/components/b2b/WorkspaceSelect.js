'use client';

import {
  Children,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';

function parseOptions(children) {
  return Children.toArray(children).flatMap((child) => {
    if (!isValidElement(child)) return [];
    if (child.type !== 'option') return [];
    const value = child.props.value != null ? String(child.props.value) : '';
    const label =
      typeof child.props.children === 'string' || typeof child.props.children === 'number'
        ? String(child.props.children)
        : value;
    return [
      {
        value,
        label,
        disabled: Boolean(child.props.disabled),
      },
    ];
  });
}

const sizeTrigger = {
  sm: 'h-9 pl-3 pr-8 text-xs gap-1.5',
  md: 'h-10 pl-3.5 pr-9 text-sm gap-2',
  lg: 'h-11 pl-4 pr-10 text-sm gap-2',
};

const sizeLeading = {
  sm: 'pl-8',
  md: 'pl-9',
  lg: 'pl-9',
};

/**
 * Fully custom workspace dropdown — no native option menus (avoids dark-mode white flash).
 * API mirrors <select>: value / defaultValue / name / onChange / option children.
 */
export default function WorkspaceSelect({
  className = '',
  selectClassName = '',
  size = 'md',
  leading = null,
  children,
  value: valueProp,
  defaultValue,
  onChange,
  name,
  id,
  required,
  disabled,
  'aria-label': ariaLabel,
  ...rest
}) {
  const options = useMemo(() => parseOptions(children), [children]);
  const isControlled = valueProp !== undefined;
  const [internal, setInternal] = useState(
    () => (defaultValue != null ? String(defaultValue) : options[0]?.value ?? '')
  );
  const value = isControlled ? String(valueProp ?? '') : internal;

  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const [mounted, setMounted] = useState(false);
  const [panelStyle, setPanelStyle] = useState(null);

  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const listRef = useRef(null);
  const listboxId = useId();
  const autoId = useId();
  const fieldId = id || autoId;

  useEffect(() => setMounted(true), []);

  const selected = options.find((o) => o.value === value) || options[0];
  const selectedLabel = selected?.label ?? 'Select…';

  const commit = useCallback(
    (next) => {
      if (!isControlled) setInternal(next);
      if (onChange) {
        onChange({
          target: { value: next, name: name || undefined },
          currentTarget: { value: next, name: name || undefined },
        });
      }
      setOpen(false);
    },
    [isControlled, name, onChange]
  );

  const placePanel = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const maxH = Math.min(280, window.innerHeight - 24);
    const spaceBelow = window.innerHeight - r.bottom - 8;
    const spaceAbove = r.top - 8;
    const openUp = spaceBelow < 160 && spaceAbove > spaceBelow;
    const height = Math.min(maxH, openUp ? spaceAbove : spaceBelow);
    setPanelStyle({
      position: 'fixed',
      left: Math.max(8, Math.min(r.left, window.innerWidth - Math.max(r.width, 140) - 8)),
      width: Math.max(r.width, 140),
      zIndex: 80,
      maxHeight: Math.max(120, height),
      ...(openUp
        ? { bottom: window.innerHeight - r.top + 6, top: 'auto' }
        : { top: r.bottom + 6, bottom: 'auto' }),
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    placePanel();
    const idx = Math.max(
      0,
      options.findIndex((o) => o.value === value && !o.disabled)
    );
    setHighlight(idx);
    const onWin = () => placePanel();
    window.addEventListener('resize', onWin);
    window.addEventListener('scroll', onWin, true);
    return () => {
      window.removeEventListener('resize', onWin);
      window.removeEventListener('scroll', onWin, true);
    };
  }, [open, options, placePanel, value]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (
        rootRef.current?.contains(e.target)
        || listRef.current?.contains(e.target)
      ) {
        return;
      }
      setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  useEffect(() => {
    if (!open || highlight < 0) return;
    const node = listRef.current?.querySelector(`[data-idx="${highlight}"]`);
    node?.scrollIntoView({ block: 'nearest' });
  }, [highlight, open]);

  const onKeyDown = (e) => {
    if (disabled) return;
    if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      setOpen(true);
      return;
    }
    if (!open) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => {
        let i = h;
        for (let n = 0; n < options.length; n += 1) {
          i = (i + 1) % options.length;
          if (!options[i].disabled) return i;
        }
        return h;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => {
        let i = h;
        for (let n = 0; n < options.length; n += 1) {
          i = (i - 1 + options.length) % options.length;
          if (!options[i].disabled) return i;
        }
        return h;
      });
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const opt = options[highlight];
      if (opt && !opt.disabled) commit(opt.value);
    } else if (e.key === 'Home') {
      e.preventDefault();
      const i = options.findIndex((o) => !o.disabled);
      if (i >= 0) setHighlight(i);
    } else if (e.key === 'End') {
      e.preventDefault();
      for (let i = options.length - 1; i >= 0; i -= 1) {
        if (!options[i].disabled) {
          setHighlight(i);
          break;
        }
      }
    }
  };

  const blockish = className.includes('w-full') || className.includes('block');
  const padLead = leading ? sizeLeading[size] || sizeLeading.md : '';

  const panel =
    open && mounted && panelStyle
      ? createPortal(
          <ul
            ref={listRef}
            id={listboxId}
            role="listbox"
            aria-labelledby={fieldId}
            style={panelStyle}
            className={[
              'overflow-y-auto overscroll-contain rounded-xl border border-border py-1',
              'bg-card text-foreground',
              'shadow-[0_12px_40px_-12px_rgba(15,23,42,0.28),0_4px_12px_-4px_rgba(15,23,42,0.12)]',
              'dark:border-white/[0.12] dark:bg-[#151c2c]',
              'dark:shadow-[0_16px_48px_-12px_rgba(0,0,0,0.65),0_0_0_1px_rgba(255,255,255,0.04)]',
              '[scrollbar-width:thin]',
            ].join(' ')}
          >
            {options.map((opt, i) => {
              const active = opt.value === value;
              const hi = i === highlight;
              return (
                <li key={`${opt.value}-${i}`} role="presentation">
                  <button
                    type="button"
                    role="option"
                    data-idx={i}
                    aria-selected={active}
                    disabled={opt.disabled}
                    className={[
                      'flex w-full items-center gap-2 px-3 py-2 text-left transition-colors',
                      size === 'sm' ? 'text-xs' : 'text-sm',
                      opt.disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
                      hi && !opt.disabled
                        ? 'bg-[rgba(93,63,211,0.1)] text-foreground dark:bg-[rgba(93,63,211,0.22)]'
                        : 'text-foreground',
                      active ? 'font-semibold' : 'font-medium',
                      !opt.disabled && !hi ? 'hover:bg-muted/80 dark:hover:bg-white/[0.06]' : '',
                    ].join(' ')}
                    onMouseEnter={() => !opt.disabled && setHighlight(i)}
                    onClick={() => {
                      if (!opt.disabled) commit(opt.value);
                    }}
                  >
                    <span className="min-w-0 flex-1 truncate">{opt.label}</span>
                    {active ? (
                      <Check className="h-3.5 w-3.5 shrink-0 text-[#5D3FD3] dark:text-[#c4b5fd]" aria-hidden />
                    ) : (
                      <span className="w-3.5 shrink-0" aria-hidden />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>,
          document.body
        )
      : null;

  return (
    <div
      ref={rootRef}
      className={`relative min-w-0 ${blockish ? 'flex w-full' : 'inline-flex'} ${className}`}
    >
      {name ? <input type="hidden" name={name} value={value} required={required} /> : null}

      {leading ? (
        <span
          className={`pointer-events-none absolute top-1/2 z-10 -translate-y-1/2 text-muted-foreground ${
            size === 'sm' ? 'left-2.5' : 'left-3'
          }`}
        >
          {leading}
        </span>
      ) : null}

      <button
        ref={triggerRef}
        type="button"
        id={fieldId}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-label={ariaLabel}
        aria-required={required || undefined}
        onClick={() => !disabled && setOpen((v) => !v)}
        onKeyDown={onKeyDown}
        className={[
          'relative w-full flex items-center rounded-xl border border-border bg-card text-foreground',
          'font-medium shadow-[0_1px_2px_rgba(15,23,42,0.04)]',
          'hover:border-[#5D3FD3]/35 hover:bg-muted/25',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5D3FD3]/30 focus-visible:border-[#5D3FD3]/45',
          'cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
          'dark:border-white/[0.1] dark:bg-[#1a2332] dark:hover:bg-white/[0.04]',
          'transition-colors text-left',
          open
            ? 'border-[#5D3FD3]/45 ring-2 ring-[#5D3FD3]/20 dark:border-[#5D3FD3]/50'
            : '',
          sizeTrigger[size] || sizeTrigger.md,
          padLead,
          selectClassName,
        ].join(' ')}
        {...rest}
      >
        <span className="min-w-0 flex-1 truncate">{selectedLabel}</span>
        <ChevronDown
          className={`pointer-events-none absolute top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${
            size === 'sm' ? 'right-2.5' : 'right-3'
          } ${open ? 'rotate-180 text-[#5D3FD3]' : ''}`}
          aria-hidden
        />
      </button>

      {panel}
    </div>
  );
}
