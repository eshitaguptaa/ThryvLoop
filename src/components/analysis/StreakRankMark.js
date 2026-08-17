'use client';

import { STREAK_RANK_PRESENTATION } from '@/lib/focusStreak';

const GLYPH_SIZE = {
  xs: 'h-3.5 w-3.5',
  sm: 'h-5 w-5',
  md: 'h-7 w-7',
};

export function StreakRankGlyph({ title, size = 'md' }) {
  const common = {
    viewBox: '0 0 32 32',
    className: GLYPH_SIZE[size] || GLYPH_SIZE.md,
    fill: 'currentColor',
    'aria-hidden': true,
  };
  if (title === 'Spark') {
    return (
      <svg {...common}>
        <path d="M16 2.2 18.4 13.6 29.8 16 18.4 18.4 16 29.8 13.6 18.4 2.2 16 13.6 13.6Z" />
        <circle cx="25.5" cy="7.2" r="1.5" opacity="0.9" />
        <circle cx="6.8" cy="24.4" r="1.15" opacity="0.75" />
      </svg>
    );
  }
  if (title === 'Ember') {
    return (
      <svg {...common}>
        <ellipse cx="16" cy="18.4" rx="9.2" ry="7.4" />
        <ellipse cx="16" cy="17.2" rx="4.4" ry="3.4" fill="#fff7ed" opacity="0.85" />
        <path d="M13.2 11.4c1.1-2.8 2.6-4.8 2.8-4.8.3 0 1.6 2.1 2.6 4.8-1.7-.7-3.7-.7-5.4 0Z" />
      </svg>
    );
  }
  if (title === 'Week flame') {
    return (
      <svg {...common}>
        <path d="M16.2 3.2c.4 3.6-1.6 6-3.6 8.2-2 2.3-3.8 4.5-3.4 7.8.5 3.8 3.6 7.2 7 7.2 3.6 0 7.2-3.2 7.4-7.6.2-4.2-2.2-6.4-3.6-8.6-1.2-1.9-1.6-4.2-1.4-6.2-1.2 1.2-2 2.4-2.4 3.8Z" />
      </svg>
    );
  }
  if (title === 'On fire') {
    return (
      <svg {...common}>
        <path d="M10.2 14.2c.2-3.4-1.4-5.8-2.6-7.6 2.8 1 4.6 3.2 5.4 5.6.8-3.4.2-6.4-.6-8.6 4 2.2 6.8 6.2 6.6 10.8 3.2-1.2 4.6-3.6 5.2-5.8.6 4.2-.8 8-3.6 10.6 2 .4 3.4 1.4 4.2 2.6-1.4 4.6-6 7.6-10.8 7.6-5.2 0-9.6-3.6-10.2-8.4-.4-3.4 1.4-5.8 6.4-6.8Z" />
      </svg>
    );
  }
  if (title === 'Deep burn') {
    return (
      <svg {...common}>
        <path d="M16 3.4c4.8 6.2 9.4 11.2 9.4 16.4 0 5.2-4.2 9-9.4 9s-9.4-3.8-9.4-9c0-5.2 4.6-10.2 9.4-16.4Z" />
        <path d="M16 12.6c2.4 3 4.4 5.2 4.4 7.6 0 2.4-1.9 4.2-4.4 4.2s-4.4-1.8-4.4-4.2c0-2.4 2-4.6 4.4-7.6Z" fill="#fff1f2" opacity="0.35" />
      </svg>
    );
  }
  if (title === 'Inferno') {
    return (
      <svg {...common}>
        <path d="M16.4 2.8c.2 3.4-1.8 5.8-3.8 8-2.2 2.4-4.2 4.8-3.6 8.4.6 4.2 4 7.8 7.6 7.8 3.8 0 7.6-3.4 7.8-8 .2-4.4-2.4-6.6-4-8.8-1.4-2-1.8-4.4-1.4-6.6-.8.8-1.6 1.8-2.6 3.2Z" />
        <path d="M17.2 12.2 13 18.4h3.2l-1.6 7.2 6.6-8.8h-3.4l2.4-4.6Z" fill="#fff7ed" />
      </svg>
    );
  }
  if (title === 'Legend') {
    return (
      <svg {...common}>
        <path d="M6.4 12.4 10.8 8l5.2 6.2L21.2 8l4.4 4.4-1.4 9.2H7.8L6.4 12.4Z" />
        <rect x="8.2" y="22.4" width="15.6" height="3.2" rx="0.8" />
        <circle cx="16" cy="13.4" r="1.6" fill="#fff7ed" />
      </svg>
    );
  }
  if (title === 'Mythic') {
    return (
      <svg {...common}>
        <path d="M16 3.2 20.8 12 29 13.4 22.6 20.2 24.4 28.6 16 24.2 7.6 28.6 9.4 20.2 3 13.4 11.2 12Z" />
        <path d="M16 8.4 18.6 13.4 24 14.2 20.2 18.2 21.2 23.4 16 20.8 10.8 23.4 11.8 18.2 8 14.2 13.4 13.4Z" fill="#ede9fe" opacity="0.55" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path
        d="M16.2 6.2c.3 2.4-1.4 3.8-2.4 5.4-1.2 1.8-2.2 3.4-1.8 5.6.4 2.6 2.6 4.8 4.8 4.8 2.4 0 4.8-2.2 5-5.2.2-2.8-1.6-4.4-2.6-6-1-1.4-1.2-2.8-1-4.2-.8.8-1.4 1.6-2 2.6Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

/**
 * Animated rank glyph well — Spark through Mythic, plus a muted Unlit state.
 */
export default function StreakRankMark({ title, row, size = 'md', reduced = false }) {
  const name = row?.title || title || 'Unlit';
  const look = row || STREAK_RANK_PRESENTATION[name];
  const lit = Boolean(look) && name !== 'Unlit';
  const motion = look?.motion || 'glow';

  return (
    <div
      className={[
        'srk-mark',
        size === 'sm' ? 'srk-mark--sm' : '',
        size === 'xs' ? 'srk-mark--xs' : '',
        lit && !reduced ? `srk-mark--${motion}` : '',
      ].join(' ')}
      style={
        lit
          ? {
              background: `linear-gradient(160deg, ${look.from}, ${look.to})`,
              boxShadow: `0 8px 22px ${look.hex}55, inset 0 1px 0 rgba(255,255,255,0.35)`,
            }
          : {
              background: 'var(--muted)',
              boxShadow: 'inset 0 0 0 1px var(--border)',
            }
      }
      title={name}
    >
      {lit && motion === 'orbit' && !reduced ? (
        <>
          <span className="srk-orbit srk-orbit--a" />
          <span className="srk-orbit srk-orbit--b" />
        </>
      ) : null}
      {lit && motion === 'shine' && !reduced ? <span className="srk-sheen" /> : null}
      {lit && motion === 'pulse' && !reduced ? <span className="srk-ring" /> : null}
      <span
        className={`relative z-[1] drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)] ${
          lit ? 'text-white' : 'text-muted-foreground'
        }`}
      >
        <StreakRankGlyph title={name} size={size} />
      </span>
    </div>
  );
}
