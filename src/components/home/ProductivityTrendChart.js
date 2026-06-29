'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const CHART_WIDTH = 400;
const CHART_HEIGHT = 150;
const CHART_BASE_Y = 120;
const CHART_LEFT = 50;
const CHART_SPAN = 350;
const TOOLTIP_WIDTH = 108;
const TOOLTIP_HEIGHT = 30;
const TOOLTIP_GAP = 12;
const CONTAINER_PAD = 6;

function formatFocusDuration(minutes) {
  if (minutes <= 0) return '0m';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

/** Map SVG viewBox coordinates to pixels inside the chart container. */
function svgToContainerPixels(svg, container, svgX, svgY) {
  const pt = svg.createSVGPoint();
  pt.x = svgX;
  pt.y = svgY;
  const ctm = svg.getScreenCTM();
  if (!ctm) return null;
  const screen = pt.matrixTransform(ctm);
  const rect = container.getBoundingClientRect();
  return { x: screen.x - rect.left, y: screen.y - rect.top };
}

/** Place tooltip above the point by default; flip below or clamp at edges when needed. */
function computeTooltipPosition(pointPx, containerW, containerH) {
  const dotPad = 8;
  let x = pointPx.x - TOOLTIP_WIDTH / 2;
  let y = pointPx.y - TOOLTIP_HEIGHT - TOOLTIP_GAP - dotPad;

  if (y < CONTAINER_PAD) {
    y = pointPx.y + TOOLTIP_GAP + dotPad;
  }

  if (y + TOOLTIP_HEIGHT > containerH - CONTAINER_PAD) {
    y = Math.max(CONTAINER_PAD, pointPx.y - TOOLTIP_HEIGHT - TOOLTIP_GAP - dotPad);
  }

  x = Math.max(CONTAINER_PAD, Math.min(x, containerW - TOOLTIP_WIDTH - CONTAINER_PAD));

  return { x, y };
}

/**
 * @param {{
 *   data: Array<{ key: string, label: string, minutes: number, seconds?: number }>,
 *   peakDay: { key: string, label: string, minutes: number } | null,
 *   todayKey: string,
 *   loading?: boolean,
 * }} props
 */
export default function ProductivityTrendChart({
  data,
  peakDay,
  todayKey,
  loading = false,
}) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [tooltipPos, setTooltipPos] = useState(null);
  const chartRef = useRef(null);
  const svgRef = useRef(null);

  const weekMax = Math.max(1, ...data.map((d) => d.minutes));

  const points = useMemo(
    () =>
      data.map((day, i) => ({
        day,
        x: CHART_LEFT + (i / Math.max(1, data.length - 1)) * CHART_SPAN,
        y: CHART_BASE_Y - (day.minutes / weekMax) * 90,
      })),
    [data, weekMax]
  );

  const pathD =
    points.length >= 2
      ? `M${points[0].x},${points[0].y} ${points
          .slice(1)
          .map((p) => `L${p.x},${p.y}`)
          .join(' ')} L${points[points.length - 1].x},${CHART_BASE_Y} L${points[0].x},${CHART_BASE_Y} Z`
      : '';

  const lineD =
    points.length >= 2 ? `M${points.map((p) => `${p.x},${p.y}`).join(' L')}` : '';

  const hovered = hoveredIndex != null ? points[hoveredIndex] : null;

  const positionTooltipForPoint = useCallback((point) => {
    const container = chartRef.current;
    const svg = svgRef.current;
    if (!container || !svg || !point) {
      setTooltipPos(null);
      return;
    }
    const px = svgToContainerPixels(svg, container, point.x, point.y);
    if (!px) return;
    const { width, height } = container.getBoundingClientRect();
    setTooltipPos(computeTooltipPosition(px, width, height));
  }, []);

  useEffect(() => {
    if (hoveredIndex == null) {
      setTooltipPos(null);
      return;
    }
    positionTooltipForPoint(points[hoveredIndex]);

    const container = chartRef.current;
    if (!container) return undefined;

    const ro = new ResizeObserver(() => {
      positionTooltipForPoint(points[hoveredIndex]);
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, [hoveredIndex, points, positionTooltipForPoint]);

  const clearHover = useCallback(() => {
    setHoveredIndex(null);
    setTooltipPos(null);
  }, []);

  if (loading) {
    return (
      <div className="relative mb-3 flex h-40 w-full items-center justify-center text-sm text-muted-foreground sm:mb-4 sm:h-44 md:h-52">
        Loading…
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="relative mb-3 flex h-40 w-full items-center justify-center text-sm text-muted-foreground sm:mb-4 sm:h-44 md:h-52">
        No focus data this week
      </div>
    );
  }

  return (
    <div
      ref={chartRef}
      className="relative mb-3 h-40 w-full sm:mb-4 sm:h-44 md:h-52"
      onMouseLeave={clearHover}
    >
      {hovered && tooltipPos ? (
        <div
          role="tooltip"
          className="pointer-events-none absolute z-20 flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md border border-indigo-100/70 bg-card px-2.5 py-1.5 shadow-sm transition-[left,top] duration-150 ease-out dark:border-indigo-500/20"
          style={{
            left: tooltipPos.x,
            top: tooltipPos.y,
            width: TOOLTIP_WIDTH,
            height: TOOLTIP_HEIGHT,
          }}
        >
          <span className="text-[11px] font-medium leading-none text-muted-foreground">
            {hovered.day.label}
          </span>
          <span className="h-3 w-px shrink-0 bg-border" aria-hidden />
          <span className="text-[11px] font-semibold leading-none text-[#615FFF] dark:text-indigo-400">
            {formatFocusDuration(hovered.day.minutes)}
          </span>
        </div>
      ) : null}

      <svg
        ref={svgRef}
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        preserveAspectRatio="xMidYMid meet"
        className="h-full w-full"
        aria-label="Weekly productivity trend"
      >
        <defs>
          <linearGradient id="productivityGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#615FFF" stopOpacity="0.25" />
            <stop offset="50%" stopColor="#818cf8" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#615FFF" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="productivityLine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#615FFF" />
            <stop offset="50%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#615FFF" />
          </linearGradient>
        </defs>

        {hovered ? (
          <line
            x1={hovered.x}
            y1={hovered.y}
            x2={hovered.x}
            y2={CHART_BASE_Y}
            stroke="#615FFF"
            strokeOpacity="0.18"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
        ) : null}

        {pathD ? <path d={pathD} fill="url(#productivityGradient)" /> : null}
        {lineD ? (
          <path
            d={lineD}
            fill="none"
            stroke="url(#productivityLine)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}

        {points.map((point, i) => {
          const active = hoveredIndex === i;
          const isToday = point.day.key === todayKey;
          const isPeak = peakDay?.key === point.day.key && point.day.minutes > 0;

          return (
            <g key={point.day.key}>
              <circle
                cx={point.x}
                cy={point.y}
                r="18"
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIndex(i)}
                onFocus={() => setHoveredIndex(i)}
                onBlur={clearHover}
                tabIndex={0}
                role="button"
                aria-label={`${point.day.label}, ${formatFocusDuration(point.day.minutes)} focus`}
              />
              <circle
                cx={point.x}
                cy={point.y}
                r={active ? 7 : isPeak ? 6 : 5}
                fill="var(--card)"
                stroke={active || isToday ? '#615FFF' : isPeak ? '#10b981' : '#615FFF'}
                strokeWidth={active ? 2.5 : 2}
                strokeOpacity={active || isToday || isPeak ? 1 : 0.8}
                className="pointer-events-none transition-all duration-150"
              />
              <circle
                cx={point.x}
                cy={point.y}
                r={active ? 3 : 2.5}
                fill={isPeak && !active ? '#10b981' : '#615FFF'}
                className="pointer-events-none transition-all duration-150"
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
