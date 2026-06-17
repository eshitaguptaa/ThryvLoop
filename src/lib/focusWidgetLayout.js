/** Layout helpers for draggable focus widgets (timer, task bar, music). */

export function getFocusContentBounds() {
  if (typeof window === 'undefined') {
    return { sidebarWidth: 0, bottomNavHeight: 0, contentWidth: 0, contentHeight: 0 };
  }
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const sidebarWidth = vw >= 1024 ? 96 : 0;
  const bottomNavHeight = vw < 1024 ? 72 : 0;
  return {
    sidebarWidth,
    bottomNavHeight,
    contentWidth: vw - sidebarWidth,
    contentHeight: vh - bottomNavHeight,
  };
}

/** Horizontal and vertical center of the focus content area (excludes sidebar / bottom nav). */
export function getFocusContentCenter() {
  const { sidebarWidth, contentWidth, contentHeight } = getFocusContentBounds();
  return {
    x: sidebarWidth + contentWidth / 2,
    y: contentHeight / 2,
  };
}

/** Default task bar position: top of content area, centered on the timer axis. */
export function getDefaultTaskBarPosition() {
  const { x } = getFocusContentCenter();
  const { contentHeight } = getFocusContentBounds();
  const topMargin = Math.max(30, Math.min(60, contentHeight * 0.05));
  return { x, y: topMargin };
}

/** Default music widget position: bottom of content area, centered on the timer axis. */
export function getDefaultMusicWidgetPosition() {
  const { x } = getFocusContentCenter();
  const { contentHeight } = getFocusContentBounds();
  const bottomMargin = Math.max(50, Math.min(120, contentHeight * 0.1));
  return { x, y: contentHeight - bottomMargin };
}
