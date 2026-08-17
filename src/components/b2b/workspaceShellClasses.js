/**
 * B2B workspace UI shell — atmospheric surfaces, layered panels, full column width.
 * No accent rails/bars. Contrast via elevation, soft fills, and border weight.
 */

export const orgPrimary = '#5D3FD3';
export const orgPrimaryHover = '#4c33b8';

/** Workspaces directory (`/o`) — light: quiet surface · dark: deep canvas */
export const workspacesDirectorySurfaceClass = [
  'ws-shell relative min-h-screen w-full min-w-0 overflow-hidden text-foreground antialiased',
  'bg-[#f4f6f9] dark:bg-[#0a0e18]',
].join(' ');

export const workspaceSurfaceClass = [
  'ws-shell relative min-h-screen w-full min-w-0 overflow-x-clip text-foreground antialiased',
  'bg-[#f4f6f9] dark:bg-[#0a0e18]',
].join(' ');

/**
 * Fill the app main column (next to sidebar). No artificial max-width squeeze.
 */
export const workspaceDirectoryContentClass = 'relative z-[1] w-full min-w-0';

export const workspaceContentClass = 'relative z-[1] w-full min-w-0';

/** Responsive gutter — matches personal app shell density */
export const workspaceInsetClass = [
  'relative z-[1] w-full min-w-0 font-[var(--font-poppins)] text-foreground',
  'px-3 pt-4 pb-6',
  'sm:px-5 sm:pt-5 sm:pb-8',
  'md:px-6 md:pt-6 md:pb-10',
  'lg:px-8 lg:pt-6 lg:pb-12',
  'xl:px-10',
  '2xl:px-12',
].join(' ');

/** Sticky chrome gutter (tighter vertical) */
export const workspaceChromeInsetClass = [
  'w-full min-w-0 font-[var(--font-poppins)] text-foreground',
  'px-3 py-2.5',
  'sm:px-5 sm:py-3',
  'md:px-6',
  'lg:px-8',
  'xl:px-10',
  '2xl:px-12',
].join(' ');

export const workspaceChromeBarClass = [
  'sticky top-0 z-30 w-full',
  'border-b border-border/80 dark:border-white/[0.06]',
  'bg-white/95 dark:bg-[#0c1220]/70',
  'backdrop-blur-md dark:backdrop-blur-xl dark:backdrop-saturate-150',
  'shadow-[0_1px_2px_rgba(15,23,42,0.04)]',
  'dark:shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_12px_40px_-20px_rgba(0,0,0,0.55)]',
].join(' ');

const panelShape = 'relative overflow-hidden rounded-xl sm:rounded-2xl';

const panelShadow =
  'shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.1)] dark:shadow-[0_1px_0_0_rgba(255,255,255,0.06)_inset,0_2px_12px_-2px_rgba(0,0,0,0.4),0_22px_48px_-18px_rgba(0,0,0,0.65)]';

/**
 * Surface system — soft fills + elevation (no edge rails / top bars).
 */
export const workspacePanelRaised = [
  panelShape,
  'bg-card border border-border dark:border-white/[0.08] dark:bg-card/80',
  'dark:backdrop-blur-sm',
  panelShadow,
].join(' ');

/** Primary / identity */
export const workspacePanelHero = [
  panelShape,
  panelShadow,
  'bg-card border border-[#5D3FD3]/20 dark:border-[#5D3FD3]/30',
  'ring-1 ring-inset ring-[rgba(93,63,211,0.08)] dark:ring-[rgba(93,63,211,0.18)]',
  'dark:bg-[rgba(93,63,211,0.08)]',
].join(' ');

/** Policy / intel */
export const workspacePanelCool = [
  panelShape,
  panelShadow,
  'bg-sky-50/50 border border-sky-200/70',
  'dark:bg-sky-950/25 dark:border-sky-500/20',
].join(' ');

/** Focus / rhythm */
export const workspacePanelCalm = [
  panelShape,
  panelShadow,
  'bg-teal-50/40 border border-teal-200/70',
  'dark:bg-teal-950/20 dark:border-teal-500/20',
].join(' ');

/** Secondary denser blocks */
export const workspacePanelInk = [
  panelShape,
  panelShadow,
  'bg-slate-50 border border-slate-200/80',
  'dark:bg-slate-900/50 dark:border-white/[0.08]',
].join(' ');

/** Quiet strip */
export const workspacePanelGlass = [
  panelShape,
  'bg-slate-100/80 border border-border',
  'dark:border-white/[0.08] dark:bg-white/[0.04] dark:backdrop-blur-xl',
].join(' ');

/** Soft / quiet */
export const workspacePanelSoft = [
  panelShape,
  'border border-border/70 bg-muted/50',
  'dark:bg-white/[0.03] dark:border-white/[0.06]',
  'shadow-none',
].join(' ');

/** Destructive */
export const workspacePanelDanger = [
  panelShape,
  'bg-rose-50/60 border border-rose-200/90',
  'dark:bg-rose-950/30 dark:border-rose-500/25',
  'shadow-[0_1px_2px_rgba(225,29,72,0.04),0_8px_20px_-12px_rgba(225,29,72,0.1)] dark:shadow-[0_2px_16px_-6px_rgba(225,29,72,0.2)]',
].join(' ');

export const workspaceCardClass = workspacePanelRaised;

export const workspaceCardInteractiveClass = [
  'rounded-xl bg-card border border-border dark:border-white/[0.08] shadow-sm dark:shadow-none',
  'transition-all duration-300 hover:border-[#5D3FD3]/40 hover:-translate-y-0.5',
].join(' ');

/**
 * Stat tiles — clean cards (icon chips carry color).
 */
export const workspaceStatAccentClasses = [
  'border-border bg-card dark:border-white/[0.08] dark:bg-card/70',
  'border-border bg-card dark:border-white/[0.08] dark:bg-card/70',
  'border-border bg-card dark:border-white/[0.08] dark:bg-card/70',
  'border-border bg-card dark:border-white/[0.08] dark:bg-card/70',
];

/** Icon chip behind stat icons */
export const workspaceStatIconChipClasses = [
  'bg-[rgba(93,63,211,0.1)] text-[#5D3FD3] dark:bg-[rgba(93,63,211,0.22)] dark:text-[#c4b5fd]',
  'bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300',
  'bg-amber-100 text-amber-800 dark:bg-amber-950/45 dark:text-amber-200',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/45 dark:text-emerald-300',
];

export const workspaceStatShellClass = [
  'relative rounded-xl border p-4 overflow-hidden',
  'shadow-[0_1px_2px_rgba(15,23,42,0.04),0_6px_16px_-10px_rgba(15,23,42,0.1)]',
  'dark:shadow-[0_1px_0_0_rgba(255,255,255,0.05)_inset,0_10px_28px_-12px_rgba(0,0,0,0.5)]',
  'transition-transform duration-300 hover:-translate-y-0.5',
].join(' ');

export const workspaceEyebrowClass =
  'text-[#5D3FD3] dark:text-[#a89bf5] text-[11px] font-semibold uppercase tracking-[0.2em] mb-2';

export const workspaceNavbarClass =
  'rounded-xl border border-border bg-card px-3 py-2.5 sm:px-4 sm:py-2.5 shadow-sm dark:border-white/[0.08] dark:bg-card/80 dark:backdrop-blur-md dark:shadow-none';

export const workspaceNavbarCardClass = workspaceNavbarClass;

export const workspacePageTitleClass = [
  'text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] font-bold tracking-tight text-foreground',
  'mb-2 leading-[1.08]',
].join(' ');

export const workspaceProductHeadingClass =
  'text-sm font-semibold tracking-tight text-foreground';

export const workspacePrimaryButtonClass = [
  'inline-flex items-center justify-center gap-1.5 rounded-lg cursor-pointer',
  'bg-[#5D3FD3] hover:bg-[#4c33b8] text-white px-3.5 py-2 text-sm font-semibold',
  'transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed',
  'shadow-sm dark:shadow-[0_8px_20px_-8px_rgba(93,63,211,0.55)]',
].join(' ');

export const workspaceSecondaryButtonClass = [
  'inline-flex items-center justify-center gap-1.5 rounded-lg cursor-pointer',
  'border border-border bg-card hover:bg-muted/70 text-foreground px-3.5 py-2 text-sm font-semibold',
  'transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed',
].join(' ');

export const workspaceMutedTextClass = 'text-muted-foreground';

export const workspaceSectionTitleClass = 'text-sm font-semibold text-foreground';

export const workspaceMutedLinkClass =
  'text-sm font-medium text-[#5D3FD3] dark:text-[#a89bf5] hover:text-[#5032c4] dark:hover:text-indigo-200 transition-colors cursor-pointer';

export const workspaceInvitePanelClass = [workspacePanelRaised, 'p-4 sm:p-5'].join(' ');

export const workspaceStatClass = [workspaceStatShellClass, 'border-border bg-card'].join(' ');

export const workspaceInputClass =
  'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#5D3FD3]/30 focus:border-[#5D3FD3]/40';

/**
 * Native select surface — used inside WorkspaceSelect (padding leaves room for chevron).
 */
export const workspaceSelectFieldClass = [
  'w-full appearance-none rounded-xl border border-border bg-card text-foreground',
  'font-medium shadow-[0_1px_2px_rgba(15,23,42,0.04)]',
  'hover:border-[#5D3FD3]/30 hover:bg-muted/30',
  'focus:outline-none focus:ring-2 focus:ring-[#5D3FD3]/25 focus:border-[#5D3FD3]/40',
  'disabled:opacity-50 disabled:cursor-not-allowed',
  'dark:border-white/[0.1] dark:bg-card/80 dark:hover:bg-white/[0.04]',
  /* Native option popup follows scheme; avoids light menu + light text (unread on white) */
  '[color-scheme:light] dark:[color-scheme:dark]',
  'transition-colors cursor-pointer',
].join(' ');

export const workspaceSelectSizeClasses = {
  sm: 'h-9 pl-3 pr-9 text-xs',
  md: 'h-10 pl-3.5 pr-10 text-sm',
  lg: 'h-11 pl-4 pr-10 text-sm',
};

export const workspaceMenuPanelClass = [
  'absolute z-30 mt-1.5 min-w-[11rem] overflow-hidden rounded-xl border border-border py-1',
  'bg-card text-foreground',
  'shadow-[0_12px_40px_-12px_rgba(15,23,42,0.25),0_4px_12px_-4px_rgba(15,23,42,0.1)]',
  'dark:border-white/[0.12] dark:bg-[#151c2c]',
  'dark:shadow-[0_16px_48px_-12px_rgba(0,0,0,0.65)]',
].join(' ');

export const workspaceMenuItemClass =
  'flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm font-medium text-foreground hover:bg-[rgba(93,63,211,0.1)] dark:hover:bg-[rgba(93,63,211,0.2)] transition-colors';

export const workspaceMenuItemDangerClass =
  'flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors';

export const workspaceChipClass =
  'inline-flex items-center gap-1 rounded-md border border-border bg-muted/50 px-2 py-0.5 text-[11px] font-medium text-foreground';

export const workspaceFormMaxClass = 'w-full max-w-2xl';

export function workspaceAccentIndex(seed = '') {
  let h = 0;
  const s = String(seed);
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % 5;
}

/** Solid monograms (identity, not bars) */
export const workspaceMonogramPalettes = [
  'bg-[#5D3FD3] text-white dark:bg-gradient-to-br dark:from-[#5D3FD3] dark:to-[#38bdf8]',
  'bg-teal-600 text-white dark:bg-gradient-to-br dark:from-teal-500 dark:to-emerald-400',
  'bg-sky-600 text-white dark:bg-gradient-to-br dark:from-sky-500 dark:to-indigo-400',
  'bg-amber-600 text-white dark:bg-gradient-to-br dark:from-amber-500 dark:to-orange-400',
  'bg-rose-600 text-white dark:bg-gradient-to-br dark:from-rose-500 dark:to-fuchsia-400',
];

/** @deprecated residual import alias */
export const workspaceRailPalettes = workspaceMonogramPalettes;

/** Progress fills — brand only */
export const workspaceProgressPalettes = [
  'bg-[#5D3FD3]',
  'bg-[#5D3FD3]',
  'bg-[#5D3FD3]',
  'bg-[#5D3FD3]',
  'bg-[#5D3FD3]',
];

export function workspaceMonogram(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return String(name).slice(0, 2).toUpperCase() || 'WS';
}
