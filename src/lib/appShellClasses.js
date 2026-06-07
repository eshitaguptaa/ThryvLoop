/**
 * B2C personal workspace UI shell — semantic tokens for light/dark mode.
 */

export const appSurfaceClass =
  'min-h-screen w-full text-foreground antialiased bg-surface';

export const appSurfaceInsetClass =
  'px-4 pt-2 pb-4 sm:px-6 sm:pt-4 sm:pb-6 md:px-8 md:pt-6 md:pb-8 lg:px-12 lg:pt-8 lg:pb-10';

export const appContentClass = 'max-w-7xl mx-auto';

export const appCardClass =
  'rounded-xl sm:rounded-2xl bg-card border border-border shadow-[0_2px_8px_-2px_rgba(15,23,42,0.06),0_12px_32px_-12px_rgba(15,23,42,0.14)] dark:shadow-[0_2px_8px_-2px_rgba(0,0,0,0.3),0_12px_32px_-12px_rgba(0,0,0,0.4)]';

export const appPageTitleClass =
  'text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-2 leading-tight';

export const appEyebrowClass =
  'text-indigo-500 dark:text-indigo-400 text-xs font-semibold uppercase tracking-widest mb-2';

export const appMutedTextClass = 'text-muted-foreground';

/** Home dashboard cards — solid surfaces in dark mode (no light glass). */
export const dashboardHeroCardClass =
  'lg:col-span-8 bg-gradient-to-br from-card via-indigo-50/20 to-purple-50/30 dark:bg-none dark:bg-card rounded-3xl sm:rounded-[40px] p-5 sm:p-6 md:p-8 lg:p-10 flex flex-col lg:flex-row relative overflow-hidden shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] hover:shadow-[0_25px_60px_-12px_rgba(0,0,0,0.2)] dark:hover:shadow-[0_25px_60px_-12px_rgba(0,0,0,0.55)] transition-all duration-300 border-2 border-indigo-100/60 dark:border-border group';

export const dashboardPanelClass =
  'bg-gradient-to-br from-card to-indigo-50/30 dark:bg-none dark:bg-card p-5 sm:p-6 md:p-8 rounded-2xl sm:rounded-[32px] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] hover:shadow-[0_25px_60px_-12px_rgba(0,0,0,0.2)] dark:hover:shadow-[0_25px_60px_-12px_rgba(0,0,0,0.55)] transition-all duration-300 border-2 border-indigo-100/60 dark:border-border flex flex-col justify-between group relative overflow-hidden';

export const dashboardWidePanelClass =
  'bg-gradient-to-br from-card to-indigo-50/30 dark:bg-none dark:bg-card p-5 sm:p-6 md:p-8 rounded-3xl sm:rounded-[40px] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] hover:shadow-[0_25px_60px_-12px_rgba(0,0,0,0.2)] dark:hover:shadow-[0_25px_60px_-12px_rgba(0,0,0,0.55)] transition-all duration-300 border-2 border-indigo-100/60 dark:border-border flex flex-col justify-between group relative overflow-hidden';

export const dashboardAlertsPanelClass =
  'bg-gradient-to-br from-card to-indigo-50/20 dark:bg-none dark:bg-card p-4 sm:p-5 md:p-6 rounded-3xl sm:rounded-[40px] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] hover:shadow-[0_25px_60px_-12px_rgba(0,0,0,0.2)] dark:hover:shadow-[0_25px_60px_-12px_rgba(0,0,0,0.55)] transition-all duration-300 border-2 border-indigo-100/60 dark:border-border group relative overflow-hidden flex flex-col w-full';

export const dashboardGlowOrbClass = 'bg-indigo-100/20 dark:bg-indigo-500/5';
export const dashboardGlowOrbSmClass = 'bg-purple-100/20 dark:bg-purple-500/5';
export const dashboardOverlayGradientClass =
  'bg-gradient-to-br from-indigo-50/40 via-transparent to-purple-50/30 dark:hidden';
export const dashboardBadgeClass =
  'inline-flex self-start items-center gap-2 bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-950/50 dark:to-purple-950/35 text-indigo-700 dark:text-indigo-300 px-4 sm:px-5 py-2 rounded-full text-[10px] sm:text-xs font-semibold tracking-wider shadow-sm border border-indigo-200/50 dark:border-indigo-500/25';
export const dashboardIconChipClass =
  'p-1.5 sm:p-2 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-950/55 dark:to-purple-950/35 rounded-xl shadow-sm border border-indigo-200/50 dark:border-indigo-500/25';
export const dashboardIconChipSmClass =
  'p-1.5 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-950/55 dark:to-purple-950/35 rounded-lg shadow-sm border border-indigo-200/50 dark:border-indigo-500/25';
export const dashboardStatBadgeClass =
  'bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/30 text-[#615FFF] dark:text-indigo-400 px-3 sm:px-3.5 py-1.5 rounded-full text-[10px] sm:text-xs font-semibold shrink-0 shadow-sm border border-indigo-200/50 dark:border-indigo-500/25 flex items-center gap-1.5';
export const dashboardStatIconBoxClass =
  'w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/30 flex items-center justify-center border border-indigo-100/50 dark:border-indigo-500/20 shadow-sm';
