import Link from 'next/link';
import ThemeToolbarButton from '@/components/ThemeToolbarButton';
import {
  workspacePrimaryButtonClass,
  workspaceSecondaryButtonClass,
} from '@/components/b2b/workspaceShellClasses';

/**
 * Consistent page header across workspace routes.
 * Theme sits with page actions (layout-native, not a fixed overlay).
 *
 * @param {{
 *   eyebrow?: string,
 *   title: string,
 *   description?: React.ReactNode,
 *   actions?: React.ReactNode,
 *   showTheme?: boolean,
 * }} props
 */
export default function WorkspacePageHeader({
  eyebrow,
  title,
  description,
  actions,
  showTheme = true,
}) {
  const hasAside = Boolean(actions) || showTheme;

  return (
    <header className="ws-rise mb-6 sm:mb-8 w-full flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0 flex-1">
        {eyebrow ? (
          <div className="mb-2 flex items-center gap-2.5">
            <span className="h-px w-5 sm:w-6 bg-[#5D3FD3]/80" aria-hidden />
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#5D3FD3] dark:text-[#a89bf5]">
              {eyebrow}
            </p>
          </div>
        ) : null}
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground leading-[1.12]">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 text-sm sm:text-[0.95rem] text-muted-foreground max-w-3xl leading-relaxed">
            {description}
          </p>
        ) : null}
      </div>
      {hasAside ? (
        <div className="flex flex-wrap items-center gap-2 shrink-0 w-full sm:w-auto pb-0.5 sm:justify-end">
          {actions}
          {showTheme ? <ThemeToolbarButton /> : null}
        </div>
      ) : null}
    </header>
  );
}

export function WorkspacePrimaryLink({ href, children }) {
  return (
    <Link href={href} className={workspacePrimaryButtonClass}>
      {children}
    </Link>
  );
}

export function WorkspaceSecondaryLink({ href, children }) {
  return (
    <Link href={href} className={workspaceSecondaryButtonClass}>
      {children}
    </Link>
  );
}
