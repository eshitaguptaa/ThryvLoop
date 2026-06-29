'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  getSpacesDisplayName,
  getSpacesPosterUrl,
  resolveSpacesVideoId,
} from '@/lib/spacesConstants';

function SpacesPipContent() {
  const searchParams = useSearchParams();
  const videoId = resolveSpacesVideoId(searchParams.get('v'));
  const label = searchParams.get('label') || getSpacesDisplayName(videoId);
  const posterUrl = getSpacesPosterUrl(videoId);
  const [presentation, setPresentation] = useState('active');

  useEffect(() => {
    document.documentElement.style.background = '#09090b';
    document.body.style.background = '#09090b';
    document.body.style.margin = '0';
    document.body.style.overflow = 'hidden';
  }, []);

  useEffect(() => {
    const handler = (event) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== 'spaces-pip-presentation') return;
      setPresentation(event.data.mode === 'standby' ? 'standby' : 'active');
    };

    window.addEventListener('message', handler);

    if (window.opener && !window.opener.closed) {
      window.opener.postMessage({ type: 'spaces-pip-ready' }, window.location.origin);
    }

    return () => window.removeEventListener('message', handler);
  }, []);

  return (
    <div
      className={`spaces-pip-popup-root ${presentation === 'standby' ? 'spaces-pip-popup-root--standby' : ''}`}
      role="img"
      aria-label={`${label} ambient space`}
    >
      <div className="spaces-pip-popup-media">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={posterUrl}
          alt=""
          className="spaces-pip-popup-poster"
          referrerPolicy="strict-origin-when-cross-origin"
        />
        <div className="spaces-pip-popup-vignette" />
      </div>

      <div className="spaces-pip-popup-chrome" aria-hidden="true">
        <div className="spaces-pip-popup-bar">
          <div className="spaces-pip-popup-brand">
            <span className="spaces-pip-popup-dot" />
            <span className="spaces-pip-popup-label">{label}</span>
          </div>
          <span className="spaces-pip-popup-badge">PiP</span>
        </div>
      </div>

      <div className="spaces-pip-popup-status">Playing in ThryvLoop</div>
    </div>
  );
}

export default function SpacesPipPage() {
  return (
    <Suspense fallback={<div className="spaces-pip-popup-loading" />}>
      <SpacesPipContent />
    </Suspense>
  );
}
