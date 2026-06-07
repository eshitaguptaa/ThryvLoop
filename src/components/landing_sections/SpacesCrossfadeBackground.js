'use client';

import { useEffect, useMemo, useState } from 'react';
import { LANDING_SPACES_BACKGROUNDS } from '@/lib/landingSpacesBackgrounds';

const CROSSFADE_MS = 2500;
const ROTATE_MS = 7000;

export default function SpacesCrossfadeBackground() {
  const [index, setIndex] = useState(0);
  const [failedIds, setFailedIds] = useState(() => new Set());

  const backgrounds = useMemo(
    () => LANDING_SPACES_BACKGROUNDS.filter((bg) => !failedIds.has(bg.id)),
    [failedIds],
  );

  useEffect(() => {
    if (backgrounds.length <= 1) return undefined;

    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % backgrounds.length);
    }, ROTATE_MS);

    return () => clearInterval(interval);
  }, [backgrounds.length]);

  useEffect(() => {
    if (index >= backgrounds.length) {
      setIndex(0);
    }
  }, [backgrounds.length, index]);

  if (!backgrounds.length) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {backgrounds.map((background, i) => (
        <img
          key={background.id}
          alt=""
          src={background.src}
          onError={() => {
            setFailedIds((prev) => {
              if (prev.has(background.id)) return prev;
              const next = new Set(prev);
              next.add(background.id);
              return next;
            });
          }}
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
