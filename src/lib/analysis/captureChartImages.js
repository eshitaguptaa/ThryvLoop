'use client';

import { toPng } from 'html-to-image';

/**
 * Capture a DOM node as a PNG data URL for PDF embedding.
 * Soft-fails on modern CSS (oklch / lab) used by Tailwind v4 so export never
 * throws a cascade of console errors.
 * @param {HTMLElement | null} node
 * @returns {Promise<string | undefined>}
 */
export async function captureChartImage(node) {
  if (!node) return undefined;

  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

  const { width, height } = node.getBoundingClientRect();
  if (width <= 0 || height <= 0) return undefined;

  try {
    return await toPng(node, {
      width: Math.round(width),
      height: Math.round(height),
      pixelRatio: 1.5,
      cacheBust: true,
      backgroundColor: '#ffffff',
      filter: (el) => {
        if (!(el instanceof Element)) return true;
        const tag = el.tagName;
        if (tag === 'SCRIPT' || tag === 'LINK' || tag === 'STYLE') return false;
        return true;
      },
      skipFonts: true,
    });
  } catch {
    return undefined;
  }
}

/**
 * @param {Record<string, HTMLElement | null>} refs
 * @returns {Promise<{ focusTrend?: string, workPipeline?: string }>}
 */
export async function captureAnalyticsCharts(refs) {
  const [focusTrend, workPipeline] = await Promise.all([
    captureChartImage(refs.focusTrend),
    captureChartImage(refs.workPipeline),
  ]);

  return {
    ...(focusTrend ? { focusTrend } : {}),
    ...(workPipeline ? { workPipeline } : {}),
  };
}
