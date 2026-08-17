'use client';

import Link, { useLinkStatus } from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  BarChart3,
  Briefcase,
  Settings,
  Timer,
  Users,
} from 'lucide-react';
import ThemeToolbarButton from '@/components/ThemeToolbarButton';

function NavPendingDot() {
  const { pending } = useLinkStatus();
  return (
    <span
      className={`ml-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-current transition-opacity duration-200 ${
        pending ? 'animate-pulse opacity-100' : 'opacity-0'
      }`}
      aria-hidden
    />
  );
}

export default function OrgWorkspaceNav({ orgSlug }) {
  const pathname = usePathname();
  const base = `/o/${encodeURIComponent(orgSlug)}`;

  const items = [
    { href: base, label: 'Pulse', icon: Activity, match: 'pulse' },
    { href: `${base}/work`, label: 'Work', icon: Briefcase, match: 'work' },
    { href: `${base}/rhythm`, label: 'Rhythm', icon: Timer, match: 'rhythm' },
    { href: `${base}/people`, label: 'People', icon: Users, match: 'people' },
    { href: `${base}/insights`, label: 'Insights', icon: BarChart3, match: 'insights' },
    { href: `${base}/settings`, label: 'Settings', icon: Settings, match: 'settings' },
  ];

  const isActive = (item) => {
    if (item.match === 'pulse') {
      return pathname === base || pathname === `${base}/`;
    }
    if (item.match === 'people') {
      return pathname.startsWith(`${base}/people`) || pathname.startsWith(`${base}/members`);
    }
    if (item.match === 'work') {
      return pathname.startsWith(`${base}/work`) || pathname.startsWith(`${base}/tasks`);
    }
    if (item.match === 'insights') {
      return pathname.startsWith(`${base}/insights`) || pathname.startsWith(`${base}/analytics`);
    }
    return pathname.startsWith(`${base}/${item.match}`);
  };

  return (
    <div className="inline-flex w-full min-w-0 items-center gap-1.5 sm:w-auto">
      <ThemeToolbarButton className="shrink-0 !rounded-lg shadow-none" />
      <nav
        className="inline-flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto overscroll-x-contain [scrollbar-width:thin] rounded-xl border border-border bg-muted/70 p-1 dark:border-white/[0.07] dark:bg-white/[0.04] sm:flex-initial"
        aria-label="Workspace"
      >
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          return (
            <Link
              key={item.match}
              href={item.href}
              className={
                active
                  ? 'inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#5D3FD3] px-2.5 py-1.5 text-xs font-semibold text-white shadow-[0_6px_16px_-6px_rgba(93,63,211,0.7)] sm:text-sm'
                  : 'inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-card hover:text-foreground dark:hover:bg-white/[0.06] sm:text-sm'
              }
              aria-current={active ? 'page' : undefined}
            >
              <Icon className={`h-3.5 w-3.5 shrink-0 ${active ? 'text-white' : ''}`} aria-hidden />
              <span>{item.label}</span>
              <NavPendingDot />
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
