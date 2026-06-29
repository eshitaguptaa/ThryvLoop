/** @typedef {'idle' | 'document' | 'popup'} SpacesPipMode */
/** @typedef {'active' | 'standby'} SpacesPipPresentation */

import { getSpacesPosterUrl } from '@/lib/spacesConstants';
import {
  closeSpacesPipPopup,
  getSpacesPipMode as getPopupMode,
  isSpacesPipOpen,
  isSpacesPipSupported,
  openSpacesPipPopup,
  setSpacesPipPresentation,
} from '@/lib/spacesPipPopup';

const PIP_WIDTH = 400;
const PIP_HEIGHT = 225;

const DOCUMENT_PIP_CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body {
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #09090b;
    font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  .spaces-pip-root {
    position: relative;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    background: #000;
    transition: opacity 180ms ease;
  }
  .spaces-pip-root--standby {
    opacity: 0;
    pointer-events: none;
  }
  .spaces-pip-root::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: 14px;
    pointer-events: none;
    z-index: 3;
    box-shadow:
      inset 0 0 0 1px rgba(255, 255, 255, 0.08),
      inset 0 1px 0 rgba(255, 255, 255, 0.06);
  }
  .spaces-pip-media {
    position: absolute;
    inset: 0;
    overflow: hidden;
  }
  .spaces-pip-poster {
    position: absolute;
    inset: -4%;
    width: 108%;
    height: 108%;
    object-fit: cover;
    animation: spaces-pip-kenburns 24s ease-in-out infinite alternate;
    transform-origin: center center;
  }
  @keyframes spaces-pip-kenburns {
    0% { transform: scale(1) translate3d(0, 0, 0); }
    100% { transform: scale(1.06) translate3d(-1.5%, -1%, 0); }
  }
  .spaces-pip-vignette {
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at center, transparent 40%, rgba(0, 0, 0, 0.35) 100%);
    pointer-events: none;
  }
  .spaces-pip-chrome {
    position: absolute;
    inset: 0;
    z-index: 2;
    pointer-events: none;
    background: linear-gradient(
      180deg,
      rgba(0, 0, 0, 0.55) 0%,
      transparent 28%,
      transparent 72%,
      rgba(0, 0, 0, 0.45) 100%
    );
  }
  .spaces-pip-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 10px 12px;
  }
  .spaces-pip-brand {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    padding: 5px 10px 5px 6px;
    border-radius: 999px;
    background: rgba(9, 9, 11, 0.55);
    border: 1px solid rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
  }
  .spaces-pip-dot {
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: linear-gradient(135deg, #8b5cf6, #5043f3);
    box-shadow: 0 0 12px rgba(139, 92, 246, 0.75);
    flex-shrink: 0;
    animation: spaces-pip-dot-pulse 2.4s ease-in-out infinite;
  }
  @keyframes spaces-pip-dot-pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.72; transform: scale(0.92); }
  }
  .spaces-pip-label {
    color: rgba(255, 255, 255, 0.92);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.02em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 220px;
  }
  .spaces-pip-badge {
    color: rgba(255, 255, 255, 0.55);
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 4px 8px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.08);
  }
  .spaces-pip-status {
    position: absolute;
    left: 12px;
    right: 12px;
    bottom: 12px;
    z-index: 2;
    padding: 8px 10px;
    border-radius: 12px;
    background: rgba(9, 9, 11, 0.62);
    border: 1px solid rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(10px);
    color: rgba(255, 255, 255, 0.78);
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
`;

/** @type {Window | null} */
let documentPipWindow = null;
/** @type {SpacesPipMode} */
let activeMode = 'idle';
/** @type {(() => void) | null} */
let onCloseCallback = null;

export function isDocumentPictureInPictureSupported() {
  return typeof window !== 'undefined' && 'documentPictureInPicture' in window;
}

export function isSpacesPipAvailable() {
  return isDocumentPictureInPictureSupported() || isSpacesPipSupported();
}

export function getSpacesPipMode() {
  if (activeMode !== 'idle') return activeMode;
  if (getPopupMode() === 'popup') return 'popup';
  return 'idle';
}

function setMode(mode) {
  activeMode = mode;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('spaces-pip-changed', { detail: { mode } }),
    );
  }
}

function buildDocumentPipMarkup({ label, posterUrl }) {
  const safeLabel = label || 'Spaces';
  const safePoster = posterUrl || '';
  return `
    <div class="spaces-pip-root spaces-pip-root--standby" id="spaces-pip-root">
      <div class="spaces-pip-media">
        <img src="${safePoster}" alt="" class="spaces-pip-poster" referrerpolicy="strict-origin-when-cross-origin" />
        <div class="spaces-pip-vignette"></div>
      </div>
      <div class="spaces-pip-chrome">
        <div class="spaces-pip-bar">
          <div class="spaces-pip-brand">
            <span class="spaces-pip-dot"></span>
            <span class="spaces-pip-label">${safeLabel}</span>
          </div>
          <span class="spaces-pip-badge">PiP</span>
        </div>
      </div>
      <div class="spaces-pip-status">Playing in ThryvLoop</div>
    </div>
  `;
}

function setDocumentPipPresentation(presentation) {
  if (!documentPipWindow || documentPipWindow.closed) return false;
  const root = documentPipWindow.document.getElementById('spaces-pip-root');
  if (!root) return false;
  root.classList.toggle('spaces-pip-root--standby', presentation === 'standby');
  return true;
}

function handleDocumentPipClosed() {
  documentPipWindow = null;
  const cb = onCloseCallback;
  onCloseCallback = null;
  if (activeMode === 'document') {
    setMode('idle');
    cb?.();
  }
}

/**
 * Prime Document PiP during a user gesture (Chrome / Edge).
 *
 * @param {{ videoId: string, label?: string, presentation?: SpacesPipPresentation, onClose?: () => void }} options
 */
export async function primeDocumentSpacesPip(options = {}) {
  if (!isDocumentPictureInPictureSupported() || !options.videoId) return false;

  const posterUrl = getSpacesPosterUrl(options.videoId);
  if (!posterUrl) return false;

  onCloseCallback = options.onClose ?? onCloseCallback;
  const presentation = options.presentation ?? 'standby';

  try {
    if (!documentPipWindow || documentPipWindow.closed) {
      documentPipWindow = await window.documentPictureInPicture.requestWindow({
        width: PIP_WIDTH,
        height: PIP_HEIGHT,
      });

      const doc = documentPipWindow.document;
      const style = doc.createElement('style');
      style.textContent = DOCUMENT_PIP_CSS;
      doc.head.appendChild(style);

      doc.body.innerHTML = buildDocumentPipMarkup({
        label: options.label,
        posterUrl,
      });

      documentPipWindow.addEventListener('pagehide', handleDocumentPipClosed);
    } else {
      const poster = documentPipWindow.document.querySelector('.spaces-pip-poster');
      const labelEl = documentPipWindow.document.querySelector('.spaces-pip-label');
      if (poster) poster.src = posterUrl;
      if (labelEl) labelEl.textContent = options.label || 'Spaces';
    }

    setDocumentPipPresentation(presentation);
    setMode('document');
    return true;
  } catch {
    documentPipWindow = null;
    return false;
  }
}

/** @param {SpacesPipPresentation} presentation */
export function setSpacesPipPresentationMode(presentation) {
  if (activeMode === 'document') {
    return setDocumentPipPresentation(presentation);
  }
  if (isSpacesPipOpen()) {
    return setSpacesPipPresentation(presentation);
  }
  return false;
}

/**
 * Open PiP when the browser tab is hidden (active presentation).
 *
 * @param {{ videoId: string, label?: string, onClose?: () => void }} options
 */
export async function openSpacesPip(options = {}) {
  if (!options.videoId) return false;

  if (isDocumentPictureInPictureSupported()) {
    const opened = await primeDocumentSpacesPip({ ...options, presentation: 'active' });
    if (opened) return true;
  }

  if (isSpacesPipSupported()) {
    return openSpacesPipPopup(options);
  }

  return false;
}

/**
 * @deprecated Prefer openSpacesPip on tab hide only.
 */
export async function primeSpacesPip(options = {}) {
  return openSpacesPip(options);
}

export function closeSpacesPip() {
  const cb = onCloseCallback;
  if (documentPipWindow && !documentPipWindow.closed) {
    try {
      documentPipWindow.close();
    } catch {
      // ignore
    }
  }
  documentPipWindow = null;
  closeSpacesPipPopup();
  onCloseCallback = null;
  setMode('idle');
  cb?.();
}

// Legacy exports kept for any remaining imports
export function moveIframeToShell() {}
export function openFloatingSpacesPip() {
  return false;
}
export async function openDocumentSpacesPip(options) {
  return primeDocumentSpacesPip({ ...options, presentation: 'active' });
}
