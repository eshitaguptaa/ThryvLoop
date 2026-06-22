'use client';

import { toPng } from 'html-to-image';

/**
 * Capture a DOM node as a PNG data URL for PDF embedding.
 * @param {HTMLElement | null} node
 * @returns {Promise<string | undefined>}
 */
export async function captureChartImage(node) {
  if (!node) return undefined;

  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

  const { width, height } = node.getBoundingClientRect();
  if (width <= 0 || height <= 0) return undefined;

  return toPng(node, {
    width: Math.round(width),
    height: Math.round(height),
    pixelRatio: 1.5,
    cacheBust: true,
    backgroundColor: '#ffffff',
  });
}

/**
 * @param {Record<string, HTMLElement | null>} refs
 * @returns {Promise<{ focusSessions?: string, sessionsPerDay?: string, taskDistribution?: string }>}
 */
export async function captureAnalyticsCharts(refs) {
  const [focusSessions, sessionsPerDay, taskDistribution] = await Promise.all([
    captureChartImage(refs.focusSessions),
    captureChartImage(refs.sessionsPerDay),
    captureChartImage(refs.taskDistribution),
  ]);

  return {
    ...(focusSessions ? { focusSessions } : {}),
    ...(sessionsPerDay ? { sessionsPerDay } : {}),
    ...(taskDistribution ? { taskDistribution } : {}),
  };
}
