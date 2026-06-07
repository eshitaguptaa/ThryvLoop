/**
 * B2B workspace UI shell — semantic tokens for light/dark mode.
 * Keep in sync with org routes under /o.
 */

export const orgPrimary = '#5D3FD3';
export const orgPrimaryHover = '#5032c4';
export const orgLavender = '#F3F0FF';
export const orgLavenderMuted = '#FAF8FF';

/** Workspaces directory (`/o`) — slate base + soft centered mesh (lavender / purple) */
export const workspacesDirectorySurfaceClass = [
  'min-h-screen w-full text-foreground antialiased',
  'bg-surface',
  '[background-image:radial-gradient(ellipse_75%_55%_at_50%_42%,rgba(139,92,246,0.11),transparent_58%),radial-gradient(ellipse_65%_50%_at_50%_58%,rgba(167,139,250,0.09),transparent_55%),radial-gradient(ellipse_90%_70%_at_50%_50%,rgba(244,114,182,0.05),transparent_68%)]',
  'dark:[background-image:radial-gradient(ellipse_75%_55%_at_50%_42%,rgba(139,92,246,0.08),transparent_58%),radial-gradient(ellipse_65%_50%_at_50%_58%,rgba(167,139,250,0.06),transparent_55%),radial-gradient(ellipse_90%_70%_at_50%_50%,rgba(244,114,182,0.03),transparent_68%)]',
].join(' ');

/** Workspaces list (`/o`) — centered column; avoids ultra-wide stretch */
export const workspaceDirectoryContentClass = 'w-full max-w-7xl mx-auto';

/** Main canvas — slate + subtle dot grid (org workspace routes under `/o/[slug]`) */
export const workspaceSurfaceClass = [
  'min-h-screen w-full text-foreground antialiased bg-surface',
  '[background-image:radial-gradient(circle_at_center,rgba(100,116,139,0.2)_1px,transparent_1px)]',
  '[background-size:20px_20px]',
  'dark:[background-image:radial-gradient(circle_at_center,rgba(148,163,184,0.12)_1px,transparent_1px)]',
].join(' ');

/** Horizontal + vertical padding — extra top space so first headings don't hug the shell */
export const workspaceInsetClass =
  'px-4 pt-6 pb-4 sm:px-6 sm:pt-8 sm:pb-6 md:px-8 md:pt-9 md:pb-8 lg:px-12 lg:pt-10 lg:pb-10 font-[var(--font-poppins)] text-foreground';

/** Inner content width — matches personal `max-w-7xl mx-auto` band */
export const workspaceContentClass = 'max-w-7xl mx-auto';

/** Elevated cards on surface canvas */
export const workspaceCardClass =
  'rounded-xl sm:rounded-2xl bg-card border border-border shadow-[0_2px_8px_-2px_rgba(15,23,42,0.06),0_12px_32px_-12px_rgba(15,23,42,0.14)] dark:shadow-[0_2px_8px_-2px_rgba(0,0,0,0.3),0_12px_32px_-12px_rgba(0,0,0,0.4)]';

/** Eyebrow — matches personal dashboard (`/home`) */
export const workspaceEyebrowClass =
  'text-indigo-500 dark:text-indigo-400 text-xs font-semibold uppercase tracking-widest mb-2';

/** Workspace shell navbar — card on surface background */
export const workspaceNavbarCardClass =
  'rounded-xl sm:rounded-2xl border border-border bg-card px-4 py-2.5 sm:px-5 sm:py-3 md:px-6 md:py-3 shadow-[0_2px_8px_-2px_rgba(15,23,42,0.06),0_12px_32px_-12px_rgba(15,23,42,0.12)] dark:shadow-[0_2px_8px_-2px_rgba(0,0,0,0.3),0_12px_32px_-12px_rgba(0,0,0,0.4)]';

/** Primary page `<h1>` — matches personal app scale */
export const workspacePageTitleClass =
  'text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-2 leading-tight';

/** Primary CTA — solid purple */
export const workspacePrimaryButtonClass =
  'rounded-xl bg-[#5D3FD3] hover:bg-[#5032c4] text-white px-5 py-2.5 text-sm font-semibold shadow-sm transition-colors';

export const workspaceMutedTextClass = 'text-muted-foreground';

export const workspaceSectionTitleClass = 'text-lg font-semibold text-foreground';

/** Muted text link (Personal app, breadcrumbs) */
export const workspaceMutedLinkClass =
  'text-sm font-medium text-[#5D3FD3] dark:text-indigo-400 hover:text-[#5032c4] dark:hover:text-indigo-300 transition-colors';

/** Invite / callout panels — reads as a card on slate */
export const workspaceInvitePanelClass =
  'rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-[0_2px_8px_-2px_rgba(15,23,42,0.06),0_10px_28px_-10px_rgba(15,23,42,0.12)] dark:shadow-[0_2px_8px_-2px_rgba(0,0,0,0.3),0_10px_28px_-10px_rgba(0,0,0,0.4)]';
