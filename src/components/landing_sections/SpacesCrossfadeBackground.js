'use client';

import { useEffect, useState } from 'react';
import { LANDING_SPACES_BACKGROUNDS } from '@/lib/landingSpacesBackgrounds';

const CROSSFADE_MS = 2500;
const ROTATE_MS = 7000;

export default function SpacesCrossfadeBackground() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (LANDING_SPACES_BACKGROUNDS.length <= 1) return undefined;

    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % LANDING_SPACES_BACKGROUNDS.length);
    }, ROTATE_MS);

    return () => clearInterval(interval);
  }, []);

  if (!LANDING_SPACES_BACKGROUNDS.length) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {LANDING_SPACES_BACKGROUNDS.map((background, i) => (
        <img
          key={background.id}
          alt=""
          src={background.src}
          className="absolute inset-0 w-full h-full object-cover transition-opacity ease-in-out"
          style={{
            opacity: i === index ? 1 : 0,
            transitionDuration: `${CROSSFADE_MS}ms`,
          }}
          decoding="async"
          fetchPriority={i === 0 ? 'high' : 'low'}
        />
      ))}
    </div>
  );
}
