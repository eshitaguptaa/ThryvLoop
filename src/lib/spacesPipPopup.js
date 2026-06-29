/** @typedef {'idle' | 'popup'} SpacesPipMode */
/** @typedef {'active' | 'standby'} SpacesPipPresentation */

const POPUP_NAME = 'thryvloop-spaces-pip';
const POPUP_WIDTH = 400;
const POPUP_HEIGHT = 252;

/** @type {Window | null} */
let popupWindow = null;
/** @type {SpacesPipMode} */
let activeMode = 'idle';
/** @type {(() => void) | null} */
let onCloseCallback = null;
/** @type {number | null} */
let closePollId = null;

export function isSpacesPipSupported() {
  return typeof window !== 'undefined' && typeof window.open === 'function';
}

export function getSpacesPipMode() {
  return activeMode;
}

export function isSpacesPipOpen() {
  return activeMode !== 'idle' && popupWindow != null && !popupWindow.closed;
}

function setMode(mode) {
  activeMode = mode;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('spaces-pip-changed', { detail: { mode } }),
    );
  }
}

function getPopupFeatures() {
  const left = Math.max(0, window.screen.availWidth - POPUP_WIDTH - 24);
  const top = Math.max(0, window.screen.availHeight - POPUP_HEIGHT - 24);
  return [
    'popup=yes',
    `width=${POPUP_WIDTH}`,
    `height=${POPUP_HEIGHT}`,
    `left=${left}`,
    `top=${top}`,
    'resizable=yes',
    'scrollbars=no',
    'toolbar=no',
    'menubar=no',
    'location=no',
    'status=no',
  ].join(',');
}

/**
 * @param {{ videoId?: string, label?: string }} params
 */
export function buildSpacesPipUrl({ videoId, label } = {}) {
  const params = new URLSearchParams();
  if (videoId) params.set('v', videoId);
  if (label) params.set('label', label);
  const query = params.toString();
  return `${window.location.origin}/spaces-pip${query ? `?${query}` : ''}`;
}

function clearClosePoll() {
  if (closePollId != null) {
    window.clearInterval(closePollId);
    closePollId = null;
  }
}

function watchPopupClosed() {
  clearClosePoll();
  closePollId = window.setInterval(() => {
    if (!popupWindow || popupWindow.closed) {
      clearClosePoll();
      popupWindow = null;
      const cb = onCloseCallback;
      onCloseCallback = null;
      setMode('idle');
      cb?.();
    }
  }, 400);
}

function postToPopup(message) {
  if (!popupWindow || popupWindow.closed) return false;
  try {
    popupWindow.postMessage(message, window.location.origin);
    return true;
  } catch {
    return false;
  }
}

/** @param {SpacesPipPresentation} presentation */
export function setSpacesPipPresentation(presentation) {
  return postToPopup({ type: 'spaces-pip-presentation', mode: presentation });
}

function handlePopupReady(event) {
  if (event.origin !== window.location.origin) return;
  if (event.data?.type !== 'spaces-pip-ready') return;
  const visible = document.visibilityState === 'visible';
  setSpacesPipPresentation(visible ? 'standby' : 'active');
}

let readyListenerAttached = false;

function ensureReadyListener() {
  if (readyListenerAttached || typeof window === 'undefined') return;
  window.addEventListener('message', handlePopupReady);
  readyListenerAttached = true;
}

/**
 * Open the cross-browser Spaces popup when the tab is hidden.
 *
 * @param {{ videoId: string, label?: string, onClose?: () => void }} options
 */
export function openSpacesPipPopup(options = {}) {
  if (!isSpacesPipSupported() || !options.videoId) return false;

  onCloseCallback = options.onClose ?? onCloseCallback;
  ensureReadyListener();

  const url = buildSpacesPipUrl({ videoId: options.videoId, label: options.label });

  if (popupWindow && !popupWindow.closed) {
    try {
      const current = popupWindow.location.href;
      if (current !== url) {
        popupWindow.location.replace(url);
      }
    } catch {
      // Cross-origin during navigation — ignore
    }
    setSpacesPipPresentation('active');
    setMode('popup');
    watchPopupClosed();
    return true;
  }

  popupWindow = window.open(url, POPUP_NAME, getPopupFeatures());
  if (!popupWindow) {
    return false;
  }

  setMode('popup');
  watchPopupClosed();
  window.setTimeout(() => setSpacesPipPresentation('active'), 120);

  return true;
}

/**
 * @deprecated Use openSpacesPipPopup when the tab is hidden.
 */
export function primeSpacesPipPopup(options = {}) {
  return openSpacesPipPopup(options);
}

export function closeSpacesPipPopup() {
  clearClosePoll();
  if (popupWindow && !popupWindow.closed) {
    try {
      popupWindow.close();
    } catch {
      // ignore
    }
  }
  popupWindow = null;
  onCloseCallback = null;
  setMode('idle');
}
