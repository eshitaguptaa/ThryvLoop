'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { WORKSPACE_DEFAULT_LOGO_SRC } from '@/lib/workspaceLogo';

/**
 * Workspace avatar: custom team logo, or product logo.png as default.
 */
export default function WorkspaceLogoAvatar({
  name = '',
  imageUrl = null,
  className = 'h-11 w-11',
  alt,
}) {
  const custom =
    typeof imageUrl === 'string' && imageUrl.trim().length > 0 ? imageUrl.trim() : null;
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [custom]);

  const resolvedAlt = alt ?? (name ? `${name} logo` : 'Workspace logo');
  const showCustom = Boolean(custom) && !failed;

  if (showCustom) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- Clerk CDN URLs
      <img
        src={custom}
        alt={resolvedAlt}
        onError={() => setFailed(true)}
        className={`shrink-0 rounded-xl object-cover shadow-sm ring-1 ring-black/5 dark:ring-white/10 ${className}`}
      />
    );
  }

  // Default: logo.png (same asset as sidebar / landing). Fill the tile — do not pad;
  // the PNG is already framed for small chrome sizes.
  return (
    <span
      className={`relative inline-block shrink-0 overflow-hidden rounded-xl shadow-sm ring-1 ring-black/10 dark:ring-white/12 ${className}`}
      aria-label={resolvedAlt}
      role="img"
    >
      <Image
        src={WORKSPACE_DEFAULT_LOGO_SRC}
        alt=""
        fill
        sizes="48px"
        className="object-cover"
        priority={false}
      />
    </span>
  );
}
