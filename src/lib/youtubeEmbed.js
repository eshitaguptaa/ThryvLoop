/**
 * Build a YouTube embed URL for Spaces / PiP players.
 * @param {string} videoId
 * @param {{ startSeconds?: number, mute?: boolean }} [options]
 */
export function buildYouTubeEmbedUrl(videoId, options = {}) {
  if (!videoId) return null;
  const { startSeconds = 0, mute = true } = options;
  const params = new URLSearchParams({
    autoplay: '1',
    mute: mute ? '1' : '0',
    loop: '1',
    playlist: videoId,
    controls: '0',
    modestbranding: '1',
    rel: '0',
    enablejsapi: '1',
    origin: typeof window !== 'undefined' ? window.location.origin : '',
    iv_load_policy: '3',
    fs: '0',
    cc_load_policy: '0',
    playsinline: '1',
  });
  if (startSeconds > 0) {
    params.set('start', String(Math.floor(startSeconds)));
  }
  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
}

export const YOUTUBE_IFRAME_ALLOW =
  'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';

export const YOUTUBE_IFRAME_REFERRER_POLICY = 'strict-origin-when-cross-origin';

/**
 * @param {HTMLIFrameElement} iframe
 * @param {string} videoId
 * @param {{ startSeconds?: number, mute?: boolean }} [options]
 */
export function configureYouTubeIframe(iframe, videoId, options = {}) {
  if (!iframe || !videoId) return;
  iframe.referrerPolicy = YOUTUBE_IFRAME_REFERRER_POLICY;
  iframe.allow = YOUTUBE_IFRAME_ALLOW;
  iframe.title = 'Spaces background video';
  iframe.className = 'h-full w-full border-0';
  const src = buildYouTubeEmbedUrl(videoId, options);
  if (src && iframe.src !== src) {
    iframe.src = src;
  }
}
