/**
 * Soft gradient overlay to blend adjacent landing sections without hard color cuts.
 * Pass semantic token names (e.g. "surface", "background") or raw CSS color values.
 */
export const BLEND_COLORS = {
  transparent: 'transparent',
  background: 'var(--background)',
  surface: 'var(--surface)',
  card: 'var(--card)',
};

export function resolveBlendColor(color) {
  if (!color || color === 'transparent') return 'transparent';
  if (color.startsWith('var(') || color.startsWith('#') || color.startsWith('rgb')) return color;
  return BLEND_COLORS[color] ?? `var(--${color})`;
}

export function SectionBlend({
  position = 'bottom',
  toColor = 'surface',
  fromColor = 'transparent',
  size = 'md',
  className = '',
}) {
  const heights = { sm: '5rem', md: '8rem', lg: '10rem', xl: '12rem' };
  const height = heights[size] ?? heights.md;
  const resolvedFrom = resolveBlendColor(fromColor);
  const resolvedTo = resolveBlendColor(toColor);

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-x-0 z-0 ${
        position === 'bottom' ? 'bottom-0' : 'top-0'
      } ${className}`}
      style={{
        height,
        background: `linear-gradient(to bottom, ${resolvedFrom}, ${resolvedTo})`,
      }}
    />
  );
}

/** Grid backgrounds that fade at edges so they don't cut off abruptly between sections. */
export const GRID_FADE_MASK = {
  top: 'linear-gradient(to bottom, transparent 0%, black 14%)',
  bottom: 'linear-gradient(to bottom, black 86%, transparent 100%)',
  both: 'linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%)',
};

export function gridFadeStyle(fade = 'both') {
  const mask = GRID_FADE_MASK[fade];
  if (!mask) return {};
  return {
    maskImage: mask,
    WebkitMaskImage: mask,
  };
}
