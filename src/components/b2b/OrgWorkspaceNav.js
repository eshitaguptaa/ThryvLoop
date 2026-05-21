'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/** Inactive: plain text (reference). Active: purple pill. */
const linkInactive =
  'text-sm font-medium text-gray-800 px-2 py-1 sm:px-2.5 transition-colors hover:text-gray-950 leading-tight';
const linkActive =
  'text-sm font-semibold text-white bg-[#5D3FD3] px-3.5 py-1.5 sm:px-4 rounded-full shadow-sm transition-colors leading-tight';

export default function OrgWorkspaceNav({ orgSlug, isAdmin }) {
  const pathname = usePathname();
  const base = `/o/${encodeURIComponent(orgSlug)}`;

  const isActive = (segment) => {
    if (segment === '') {
      return pathname === base || pathname === `${base}/`;
    }
    return pathname.startsWith(`${base}/${segment}`);
  };

  return (
    <nav
      className="flex flex-wrap items-center justify-center gap-0.5 sm:gap-1.5"
      aria-label="Workspace"
    >
      <Link href={base} className={isActive('') ? linkActive : linkInactive}>
        Overview
      </Link>
      <Link href={`${base}/tasks`} className={isActive('tasks') ? linkActive : linkInactive}>
        Tasks
      </Link>
      <Link href={`${base}/analytics`} className={isActive('analytics') ? linkActive : linkInactive}>
        Analytics
      </Link>
      <Link href={`${base}/members`} className={isActive('members') ? linkActive : linkInactive}>
        {isAdmin ? 'Members' : 'Team'}
      </Link>
    </nav>
  );
}
