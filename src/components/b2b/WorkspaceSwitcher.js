import Link from 'next/link';
import { ChevronsUpDown } from 'lucide-react';
import WorkspaceLogoAvatar from '@/components/b2b/WorkspaceLogoAvatar';

/**
 * Always-visible control to leave the current team and pick another on /o.
 */
export default function WorkspaceSwitcher({ name, slug, imageUrl = null }) {
  return (
    <Link
      href="/o"
      className="group flex min-w-0 max-w-full items-center gap-2 rounded-xl border border-border bg-card px-2 py-1.5 sm:px-2.5 sm:py-1.5 shadow-sm transition-colors hover:border-[#5D3FD3]/35 hover:bg-muted/50 dark:border-white/[0.08] dark:bg-card/70 dark:hover:border-[#5D3FD3]/40 dark:hover:bg-white/[0.04]"
      title="Switch workspace"
      aria-label={`Current workspace ${name}. Switch to another workspace`}
    >
      <WorkspaceLogoAvatar
        name={name}
        imageUrl={imageUrl}
        className="h-8 w-8 sm:h-9 sm:w-9"
      />
      <span className="min-w-0 flex-1 text-left">
        <span className="block truncate text-sm font-semibold text-foreground leading-tight">
          {name}
        </span>
        <span className="hidden sm:block text-[10px] font-medium text-muted-foreground group-hover:text-[#5D3FD3] dark:group-hover:text-[#c4b5fd] transition-colors">
          Switch workspace
        </span>
      </span>
      <ChevronsUpDown
        className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-[#5D3FD3] transition-colors"
        aria-hidden
      />
    </Link>
  );
}
