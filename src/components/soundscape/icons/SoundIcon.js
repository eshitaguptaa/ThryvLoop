'use client';

import { getSoundscapeSoundIcon } from '@/lib/soundscapeConstants';

const ICONS = {
  spaces: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
    />
  ),
  rain: (
    <>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 19v-6m4 6v-6m4 6v-6" />
    </>
  ),
  fire: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.5-7 1.832 2.09 2 4 2 4s-1.5 2-2.5 4 5 5 7 5c0 2 1 3 1 3s4-1 4-3c0-2-2-4-2-4z"
    />
  ),
  forest: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
    />
  ),
  waterfall: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
    />
  ),
  ocean: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M4 14c1.5-1 3-1 4.5 0s3 1 4.5 0 3-1 4.5 0 3-1 4.5 0M4 10c1.5-1 3-1 4.5 0s3 1 4.5 0 3-1 4.5 0 3-1 4.5 0"
    />
  ),
  thunder: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
  ),
  breeze: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M9.5 8c1.5-2 4-2.5 6-1M4 12h11M6 16c1.5 2 4 2.5 6 1"
    />
  ),
  cafe: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M6 8h10v6a4 4 0 01-4 4H8a4 4 0 01-4-4V8zm12 2h1a3 3 0 010 6h-1M8 4v2m4-2v2"
    />
  ),
  office: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6"
    />
  ),
  neural: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
    />
  ),
  lofi: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
    />
  ),
  synthwave: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4-8 4 6 4-10 4 12" />
  ),
  piano: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M6 19V5h12v14H6zm3-14v6m3-6v6m3-6v6"
    />
  ),
  jazz: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
    />
  ),
  ambient: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M12 3a9 9 0 100 18 9 9 0 000-18zm0 0v18m-4.5-9H12"
    />
  ),
  classical: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M9 18V5l10-2v13M9 18c0 1.1-1.3 2-3 2s-3-.9-3-2 1.3-2 3-2 3 .9 3 2zm10-2c0 1.1-1.3 2-3 2s-3-.9-3-2 1.3-2 3-2 3 .9 3 2z"
    />
  ),
};

export default function SoundIcon({ soundId, className = 'w-6 h-6' }) {
  const iconKey = getSoundscapeSoundIcon(soundId);
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      {ICONS[iconKey] || ICONS.neural}
    </svg>
  );
}
