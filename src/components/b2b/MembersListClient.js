'use client';

import { ChevronDown, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { workspaceCardClass } from '@/components/b2b/workspaceShellClasses';

function memberDisplayName(m) {
  const first = m.publicUserData?.firstName || '';
  const last = m.publicUserData?.lastName || '';
  const name = `${first} ${last}`.trim();
  const email =
    m.publicUserData?.identifier
    || m.publicUserData?.emailAddress
    || m.publicUserData?.userId
    || 'Member';
  return { name: name || email, email: email !== name ? email : null };
}

function initials(name, fallback) {
  const n = (name || '').trim();
  if (n) {
    const parts = n.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return n.slice(0, 2).toUpperCase();
  }
  return (fallback || '?').slice(0, 2).toUpperCase();
}

function memberRowColors(i) {
  const palette = [
    'bg-violet-100 text-violet-800',
    'bg-sky-100 text-sky-800',
    'bg-emerald-100 text-emerald-800',
    'bg-amber-100 text-amber-900',
    'bg-rose-100 text-rose-800',
  ];
  return palette[i % palette.length];
}

export default function MembersListClient({ members, title }) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) => {
      const { name, email } = memberDisplayName(m);
      return (
        name.toLowerCase().includes(q)
        || (email && email.toLowerCase().includes(q))
        || (m.publicUserData?.userId || '').toLowerCase().includes(q)
      );
    });
  }, [members, query]);

  return (
    <>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-4 sm:mb-5">
        {title ? (
          <h2 className="text-base sm:text-lg font-semibold text-foreground shrink-0 tracking-tight">
            {title}
          </h2>
        ) : null}
        <div className="relative w-full lg:max-w-md lg:ml-auto">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search members..."
            className="w-full rounded-full border border-border bg-card py-2.5 pl-11 pr-4 text-sm text-foreground shadow-[0_1px_2px_rgba(15,23,42,0.05)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.2)] placeholder:text-muted-foreground focus:border-[#5D3FD3]/40 focus:outline-none focus:ring-2 focus:ring-[#5D3FD3]/22"
            aria-label="Search members"
          />
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className={`${workspaceCardClass} overflow-hidden`}>
          <ul className="divide-y divide-border">
            {filtered.map((m, i) => {
              const { name, email } = memberDisplayName(m);
              const roleLabel =
                m.role === 'org:admin' ? 'Admin' : m.role === 'org:member' ? 'Member' : m.role;
              return (
                <li
                  key={m.id}
                  className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-6 sm:py-4"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold ${memberRowColors(i)}`}
                    >
                      {initials(name, email || m.publicUserData?.userId)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm sm:text-base font-semibold text-foreground truncate">{name}</p>
                      {email ? (
                        <p className="text-xs sm:text-sm text-muted-foreground truncate mt-0.5">{email}</p>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-full border border-border bg-muted px-3.5 py-2 text-sm font-medium text-foreground shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.2)]">
                    {roleLabel}
                    <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <div
          className={`${workspaceCardClass} px-5 py-10 sm:px-6 text-center text-sm text-muted-foreground`}
        >
          {members.length > 0 ? 'No members match your search.' : 'No members in this workspace yet.'}
        </div>
      ) : null}
    </>
  );
}
