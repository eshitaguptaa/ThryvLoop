'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

const CHART_WIDTH = 400;
const CHART_HEIGHT = 168;
const CHART_BASE_Y = 122;
const CHART_LEFT = 28;
const CHART_SPAN = 344;
const PLOT_HEIGHT = 92;
const TOOLTIP_WIDTH = 132;
const TOOLTIP_HEIGHT = 44;
const TOOLTIP_GAP = 14;
const CONTAINER_PAD = 8;

export function formatFocusDuration(minutes) {
  const m = Math.max(0, Math.round(Number(minutes) || 0));
  if (m <= 0) return '0m';
  if (m < 60) return `${m}m`;
  const hours = Math.floor(m / 60);
  const mins = m % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export function formatFocusSeconds(seconds) {
  return formatFocusDuration(Math.round((Number(seconds) || 0) / 60));
}

function finiteNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function smoothLinePath(points) {
  if (points.length < 2) return '';
  if (points.length === 2) {
    return `M${points[0].x},${points[0].y} L${points[1].x},${points[1].y}`;
  }
  let d = `M${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }
  return d;
}

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

function computeTooltipPosition(pointPx, containerW, containerH) {
  let x = pointPx.x - TOOLTIP_WIDTH / 2;
  let y = pointPx.y - TOOLTIP_HEIGHT - TOOLTIP_GAP - 10;
  if (y < CONTAINER_PAD) y = pointPx.y + TOOLTIP_GAP + 10;
  if (y + TOOLTIP_HEIGHT > containerH - CONTAINER_PAD) {
    y = Math.max(CONTAINER_PAD, pointPx.y - TOOLTIP_HEIGHT - TOOLTIP_GAP);
  }
  x = Math.max(CONTAINER_PAD, Math.min(x, containerW - TOOLTIP_WIDTH - CONTAINER_PAD));
  return { x, y };
}

/**
 * @param {{
 *   data: Array<{ key: string, label: string, minutes: number, seconds?: number }>,
 *   peakDay: { key: string, label: string, minutes: number } | null,
 *   todayKey: string,
 *   weekAvg?: number,
 *   loading?: boolean,
 *   error?: string,
 *   hoveredIndex: number | null,
 *   onHoverIndex: (index: number | null) => void,
 * }} props
 */
export default function ProductivityTrendChart({
  data,
  peakDay,
  todayKey,
  weekAvg = 0,
  loading = false,
  error = '',
  hoveredIndex,
  onHoverIndex,
}) {
  const reduceMotion = useReducedMotion();
  const rawId = useId();
  const uid = rawId.replace(/:/g, '');
  const [tooltipPos, setTooltipPos] = useState(null);
  const chartRef = useRef(null);
  const svgRef = useRef(null);

  const points = useMemo(() => {
    const rows = (data || []).map((day) => {
      const minutes = Number.isFinite(Number(day?.minutes))
        ? Math.max(0, Number(day.minutes))
        : Math.max(0, Math.round((Number(day?.seconds) || 0) / 60));
      return { ...day, minutes };
    });
    const weekMax = Math.max(1, ...rows.map((d) => d.minutes), 0);
    const span = Math.max(1, rows.length - 1);
    return rows.map((day, i) => ({
      day,
      x: CHART_LEFT + (i / span) * CHART_SPAN,
      y: CHART_BASE_Y - (day.minutes / weekMax) * PLOT_HEIGHT,
    }));
  }, [data]);

  const hasFocus = points.some((p) => p.day.minutes > 0);
  const lineD = useMemo(() => smoothLinePath(points), [points]);
  const areaD = useMemo(() => {
    if (points.length < 2 || !lineD) return '';
    const last = points[points.length - 1];
    const first = points[0];
    return `${lineD} L${last.x},${CHART_BASE_Y} L${first.x},${CHART_BASE_Y} Z`;
  }, [lineD, points]);

  const hovered = hoveredIndex != null ? points[hoveredIndex] : null;
  const weekMax = Math.max(1, ...points.map((p) => p.day.minutes), 0);
  const avgY =
    weekAvg > 0 && hasFocus
      ? CHART_BASE_Y - (Math.min(weekAvg, weekMax) / weekMax) * PLOT_HEIGHT
      : null;

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
      return undefined;
    }
    positionTooltipForPoint(points[hoveredIndex]);
    const container = chartRef.current;
    if (!container) return undefined;
    const ro = new ResizeObserver(() => positionTooltipForPoint(points[hoveredIndex]));
    ro.observe(container);
    return () => ro.disconnect();
  }, [hoveredIndex, points, positionTooltipForPoint]);

  const setHover = useCallback(
    (index) => {
      onHoverIndex?.(index);
    },
    [onHoverIndex]
  );

  if (loading) {
    return (
      <div
        className="relative mb-1 flex h-44 w-full flex-col justify-end overflow-hidden rounded-2xl px-3 pb-3 pt-4 sm:h-48 sm:px-4 md:h-56"
        role="status"
        aria-busy="true"
        aria-label="Loading focus chart"
      >
        <div className="productivity-trend-skeleton absolute inset-0 rounded-2xl opacity-70" />
        <div className="relative z-10 flex h-full items-end justify-between gap-1.5 sm:gap-2">
          {[42, 68, 35, 82, 55, 74, 48].map((h, i) => (
            <div
              key={i}
              className="dash-chart-bar flex-1 rounded-t-md"
              style={{
                height: `${h}%`,
                animationDelay: `${i * 0.09}s`,
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (error && data.length === 0) {
    return (
      <div className="relative mb-1 flex h-44 w-full items-center justify-center px-4 text-center text-sm text-muted-foreground sm:h-48 md:h-56">
        {error}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="relative mb-1 flex h-44 w-full flex-col items-center justify-center gap-1 text-sm text-muted-foreground sm:h-48 md:h-56">
        <span>No focus data this week</span>
        <a href="/focus" className="text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400">
          Start Focusing →
        </a>
      </div>
    );
  }

  return (
    <div
      ref={chartRef}
      className="relative mb-1 h-44 w-full sm:h-48 md:h-56"
      onMouseLeave={() => setHover(null)}
    >
      <AnimatePresence>
        {hovered && tooltipPos ? (
          <motion.div
            key={hovered.day.key}
            role="tooltip"
            initial={reduceMotion ? false : { opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.16, ease: [0.32, 0.72, 0, 1] }}
            className="pointer-events-none absolute z-20 overflow-hidden rounded-xl border border-indigo-200/70 bg-card/95 px-3 py-2 shadow-[0_12px_40px_-12px_rgba(97,95,255,0.45)] backdrop-blur-md dark:border-indigo-500/30 dark:bg-slate-900/90"
            style={{
              left: tooltipPos.x,
              top: tooltipPos.y,
              width: TOOLTIP_WIDTH,
            }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {hovered.day.label}
              {hovered.day.key === todayKey ? ' · today' : ''}
            </p>
            <p className="mt-0.5 text-sm font-bold tracking-tight text-[#615FFF] dark:text-indigo-300">
              {formatFocusDuration(hovered.day.minutes)}
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {!hasFocus ? (
        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-1 text-center">
          <p className="text-sm font-medium text-muted-foreground">No focus time this week yet</p>
          <a
            href="/focus"
            className="pointer-events-auto text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
          >
            Start Focusing →
          </a>
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
          <linearGradient id={`trendFill-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#615FFF" stopOpacity="0.42" />
            <stop offset="55%" stopColor="#8b5cf6" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#615FFF" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`trendLine-${uid}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="45%" stopColor="#615FFF" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
          <filter id={`trendGlow-${uid}`} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="3.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <clipPath id={`trendClip-${uid}`}>
            <rect x="0" y="0" width={CHART_WIDTH} height={CHART_BASE_Y + 2} />
          </clipPath>
        </defs>

        {[0.25, 0.5, 0.75, 1].map((t) => (
          <line
            key={t}
            x1={CHART_LEFT}
            x2={CHART_LEFT + CHART_SPAN}
            y1={CHART_BASE_Y - PLOT_HEIGHT * t}
            y2={CHART_BASE_Y - PLOT_HEIGHT * t}
            stroke="currentColor"
            className="text-border"
            strokeOpacity="0.7"
            strokeWidth="1"
            strokeDasharray="3 5"
          />
        ))}

        {avgY != null && hasFocus ? (
          <line
            x1={CHART_LEFT}
            x2={CHART_LEFT + CHART_SPAN}
            y1={avgY}
            y2={avgY}
            stroke="#615FFF"
            strokeOpacity="0.28"
            strokeWidth="1.25"
            strokeDasharray="5 6"
          />
        ) : null}

        {hovered ? (
          <g>
            <rect
              x={hovered.x - 14}
              y={CHART_BASE_Y - PLOT_HEIGHT - 8}
              width="28"
              height={PLOT_HEIGHT + 16}
              rx="14"
              fill="#615FFF"
              fillOpacity="0.07"
            />
            <line
              x1={hovered.x}
              y1={hovered.y}
              x2={hovered.x}
              y2={CHART_BASE_Y}
              stroke="#615FFF"
              strokeOpacity="0.35"
              strokeWidth="1.5"
              strokeDasharray="3 4"
            />
          </g>
        ) : null}

        {areaD ? (
          <motion.path
            d={areaD}
            fill={`url(#trendFill-${uid})`}
            clipPath={`url(#trendClip-${uid})`}
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: hasFocus ? 1 : 0.18 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          />
        ) : null}

        {lineD ? (
          <g filter={`url(#trendGlow-${uid})`}>
            <motion.path
              d={lineD}
              fill="none"
              stroke={`url(#trendLine-${uid})`}
              strokeWidth="3.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={reduceMotion ? false : { pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: hasFocus ? 1 : 0.25 }}
              transition={{ duration: 1.05, ease: [0.22, 1, 0.36, 1] }}
            />
          </g>
        ) : null}

        {points.map((point, i) => {
          const active = hoveredIndex === i;
          const isToday = point.day.key === todayKey;
          const isPeak = peakDay?.key === point.day.key && point.day.minutes > 0;
          const cx = finiteNumber(point.x);
          const cy = finiteNumber(point.y, CHART_BASE_Y);

          return (
            <g key={point.day.key}>
              <circle
                cx={cx}
                cy={cy}
                r="18"
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHover(i)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                tabIndex={0}
                role="button"
                aria-label={`${point.day.label}, ${formatFocusDuration(point.day.minutes)} focus`}
              />
              {isToday && hasFocus ? (
                <circle
                  cx={cx}
                  cy={cy}
                  r="8"
                  fill="none"
                  stroke="#615FFF"
                  strokeWidth="1.5"
                  className="productivity-trend-today-ring"
                />
              ) : null}
              <circle
                cx={cx}
                cy={cy}
                r={active ? 7.5 : isPeak ? 6.5 : 5.5}
                fill="var(--card)"
                stroke={isPeak ? '#10b981' : '#615FFF'}
                strokeWidth={active || isToday ? 2.6 : 2}
                className="pointer-events-none"
              />
              <circle
                cx={cx}
                cy={cy}
                r={active ? 3.2 : 2.6}
                fill={isPeak ? '#10b981' : '#615FFF'}
                className="pointer-events-none"
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
