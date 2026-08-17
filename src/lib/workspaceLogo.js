/** Shared validation + defaults for workspace logos (Clerk org image). */

/** Product mark when the team has no custom logo */
export const WORKSPACE_DEFAULT_LOGO_SRC = '/LandingPageImages/logo.png';

export const WORKSPACE_LOGO_MAX_BYTES = 2 * 1024 * 1024; // 2 MB
export const WORKSPACE_LOGO_ACCEPT = 'image/png,image/jpeg,image/webp,image/gif';

/**
 * Initials helper (forms / rare fallbacks — not the primary workspace default).
 * @param {string | null | undefined} name
 */
export function workspaceInitials(name) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return 'W';
  if (parts.length === 1) {
    const w = parts[0];
    return (w.slice(0, 2) || 'W').toUpperCase();
  }
  const a = parts[0][0] || '';
  const b = parts[parts.length - 1][0] || '';
  return `${a}${b}`.toUpperCase() || 'W';
}

const ALLOWED_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/gif',
]);

/**
 * Prefer a custom URL; otherwise the product default logo.
 * @param {string | null | undefined} customUrl
 */
export function workspaceAvatarSrc(customUrl) {
  if (typeof customUrl === 'string' && customUrl.trim()) return customUrl.trim();
  return WORKSPACE_DEFAULT_LOGO_SRC;
}

/**
 * @param {FormDataEntryValue | null | undefined} entry
 * @returns {{ file: File | Blob | null, error: string | null }}
 */
export function parseWorkspaceLogoFile(entry) {
  if (entry == null || entry === '') {
    return { file: null, error: null };
  }
  const isFile = typeof File !== 'undefined' && entry instanceof File;
  const isBlob = typeof Blob !== 'undefined' && entry instanceof Blob;
  if (!isFile && !isBlob) {
    return { file: null, error: 'Invalid logo file.' };
  }
  /** @type {File | Blob} */
  const file = entry;
  if (!file.size) {
    return { file: null, error: null };
  }
  const type = (file.type || '').toLowerCase();
  const name = isFile && 'name' in file ? file.name : '';
  if (!ALLOWED_TYPES.has(type) && !/\.(png|jpe?g|webp|gif)$/i.test(name || '')) {
    return { file: null, error: 'Logo must be PNG, JPG, WebP, or GIF.' };
  }
  if (file.size > WORKSPACE_LOGO_MAX_BYTES) {
    return { file: null, error: 'Logo must be 2 MB or smaller.' };
  }
  return { file, error: null };
}

/**
 * Custom team logo only. Clerk always exposes an `imageUrl` even when the org has no
 * uploaded image (`hasImage: false`) — that CDN fallback often looks blank in our UI.
 * Callers should fall back via `workspaceAvatarSrc` / WorkspaceLogoAvatar.
 *
 * @param {import('@clerk/backend').Organization | { imageUrl?: string; hasImage?: boolean } | null | undefined} org
 */
export function organizationLogoUrl(org) {
  if (!org) return null;
  if (org.hasImage !== true) return null;
  const url = org.imageUrl;
  if (typeof url !== 'string' || !url.trim()) return null;
  return url.trim();
}
