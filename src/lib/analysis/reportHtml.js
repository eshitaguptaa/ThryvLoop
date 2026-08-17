import { readFileSync } from 'fs';
import { join } from 'path';
import { formatFocusMinutes } from '@/lib/analysis/buildPersonalAnalysisReportPayload';

let cachedLogoDataUrl = null;

/** Embed public/LandingPageImages/logo.png for Puppeteer PDF (no network). */
function getLogoDataUrl() {
  if (cachedLogoDataUrl) return cachedLogoDataUrl;
  try {
    const logoPath = join(process.cwd(), 'public', 'LandingPageImages', 'logo.png');
    const buf = readFileSync(logoPath);
    cachedLogoDataUrl = `data:image/png;base64,${buf.toString('base64')}`;
    return cachedLogoDataUrl;
  } catch {
    return null;
  }
}

/** Escape text for safe HTML embedding. */
function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function hourShort(hour) {
  const h = ((Number(hour) || 0) + 24) % 24;
  const suffix = h < 12 ? 'am' : 'pm';
  return `${h % 12 || 12}${suffix}`;
}

function hourTick(hour) {
  return `${((hour + 11) % 12) + 1}${hour < 12 ? 'a' : 'p'}`;
}

function deltaVsYesterday(pct) {
  if (pct == null || !Number.isFinite(Number(pct))) return 'No yesterday to compare';
  const n = Number(pct);
  return `${n >= 0 ? '+' : ''}${n}% vs yesterday`;
}

function todayPeakHour(todayByHour) {
  const hours = Array.isArray(todayByHour) ? todayByHour : [];
  let minutes = 0;
  let hour = -1;
  hours.forEach((value, index) => {
    const mins = Number(value) || 0;
    if (mins > minutes) {
      minutes = mins;
      hour = index;
    }
  });
  return { hour, minutes };
}

function paceBarHtml(label, value, max, color) {
  const mins = Math.max(0, Number(value) || 0);
  const pct = max > 0 ? Math.max(mins > 0 ? 8 : 0, Math.round((mins / max) * 100)) : 0;
  return `
    <div style="flex:1;min-width:0;text-align:center">
      <div style="font-size:13px;font-weight:700;color:#0f172a;margin-bottom:8px">${esc(formatFocusMinutes(mins).label)}</div>
      <div style="height:96px;display:flex;align-items:flex-end;justify-content:center">
        <div style="width:100%;max-width:72px;height:${Math.max(mins > 0 ? 24 : 8, Math.round((pct / 100) * 96))}px;border-radius:12px 12px 6px 6px;background:${color}"></div>
      </div>
      <div style="margin-top:10px;padding-top:8px;border-top:1px solid #e2e8f0;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#64748b">${esc(label)}</div>
    </div>`;
}

function insightChipHtml({ label, value, hint, accent, bg }) {
  return `
    <div style="border-radius:16px;border:1px solid ${accent}33;background:${bg};padding:14px 16px;margin-bottom:10px">
      <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#64748b">${esc(label)}</div>
      <div style="font-size:20px;font-weight:700;color:${accent};margin-top:4px;letter-spacing:-0.02em">${esc(value)}</div>
      <div style="font-size:11px;color:#64748b;margin-top:4px;font-weight:500">${esc(hint)}</div>
    </div>`;
}

function weekBarsHtml(chartData, todayKey) {
  const list = Array.isArray(chartData) ? chartData.slice(-7) : [];
  const maxDay = Math.max(1, ...list.map((d) => Number(d.focusMinutes) || 0));
  const bars = list
    .map((day) => {
      const mins = Number(day.focusMinutes) || 0;
      const isToday = day.date === todayKey;
      const h = mins <= 0 ? 6 : Math.max(14, Math.round((mins / maxDay) * 72));
      const bg = mins > 0 ? (isToday ? '#0ea5e9' : '#7dd3fc') : '#e2e8f0';
      return `
        <div style="flex:1;min-width:0;display:flex;flex-direction:column;align-items:center;gap:6px">
          <div style="width:100%;height:72px;display:flex;align-items:flex-end">
            <div style="width:100%;height:${h}px;border-radius:6px;background:${bg}"></div>
          </div>
          <div style="font-size:9px;font-weight:700;text-transform:uppercase;color:${isToday ? '#0369a1' : '#94a3b8'}">${esc(String(day.weekday || day.label || '').slice(0, 1))}</div>
        </div>`;
    })
    .join('');
  return `<div style="display:flex;align-items:flex-end;gap:6px">${bars}</div>`;
}

function streakChainHtml(chartData, todayKey) {
  const list = Array.isArray(chartData) ? chartData.slice(-7) : [];
  return `
    <div style="display:flex;gap:6px;margin-top:16px">
      ${list
        .map((day) => {
          const on = (Number(day.focusMinutes) || 0) > 0;
          const isToday = day.date === todayKey;
          const bg = on
            ? 'linear-gradient(135deg,#fbbf24,#ea580c)'
            : isToday
              ? '#fff7ed'
              : '#f1f5f9';
          const border = on ? '#fcd34d' : isToday ? '#fb923c' : '#e2e8f0';
          return `
            <div style="flex:1;text-align:center">
              <div style="aspect-ratio:1;max-width:36px;margin:0 auto;border-radius:12px;border:1px solid ${border};background:${bg};display:flex;align-items:center;justify-content:center;color:${on ? '#fff' : '#94a3b8'};font-size:12px;font-weight:700">${on ? '🔥' : isToday ? '·' : ''}</div>
              <div style="margin-top:6px;font-size:8px;font-weight:700;text-transform:uppercase;color:${isToday ? '#c2410c' : '#94a3b8'}">${esc(day.weekday || day.label || '')}</div>
            </div>`;
        })
        .join('')}
    </div>`;
}

function workPipelineBars(metrics) {
  const stages = [
    { name: "Today's focus", value: Number(metrics.todaysFocusCount) || 0, color: '#818cf8' },
    { name: 'In progress', value: Number(metrics.inProgressCount) || 0, color: '#38bdf8' },
    { name: 'Backlog', value: Number(metrics.backlogCount) || 0, color: '#94a3b8' },
    { name: 'Done', value: Number(metrics.doneCount) || 0, color: '#34d399' },
  ];
  const max = Math.max(1, ...stages.map((s) => s.value));
  return `
    <div style="display:flex;align-items:flex-end;gap:10px;height:140px;margin-top:8px">
      ${stages
        .map((stage) => {
          const h = stage.value <= 0 ? 8 : Math.max(28, Math.round((stage.value / max) * 120));
          return `
            <div style="flex:1;min-width:0;text-align:center;height:100%;display:flex;flex-direction:column;justify-content:flex-end">
              <div style="font-size:18px;font-weight:700;color:#0f172a;margin-bottom:8px">${stage.value}</div>
              <div style="height:${h}px;border-radius:12px 12px 6px 6px;background:${stage.color};margin:0 auto;width:100%;max-width:56px"></div>
              <div style="margin-top:10px;font-size:10px;font-weight:700;color:#475569">${esc(stage.name)}</div>
            </div>`;
        })
        .join('')}
    </div>`;
}

function renderHeatmap(dayLabels, peakByDayHour, todayByHour, maxPeakCell) {
  const labels = Array.isArray(dayLabels) ? dayLabels : [];
  const matrix = Array.isArray(peakByDayHour) ? peakByDayHour : [];
  const todayHours = Array.isArray(todayByHour) ? todayByHour : Array.from({ length: 24 }, () => 0);
  const max = Math.max(0, Number(maxPeakCell) || 0);
  const todayMax = Math.max(0, ...todayHours.map((n) => Number(n) || 0));
  const nowHour = new Date().getHours();

  if ((!labels.length || max <= 0) && todayMax <= 0) {
    return `<p style="margin:0;font-size:12px;color:#64748b">No focused hours in this window yet.</p>`;
  }

  const hourTotals = Array.from({ length: 24 }, (_, hour) =>
    labels.reduce((sum, _, dayIndex) => sum + (Number(matrix[dayIndex]?.[hour]) || 0), 0)
  );
  const nightMins =
    hourTotals.slice(0, 6).reduce((s, n) => s + n, 0) + hourTotals.slice(22).reduce((s, n) => s + n, 0);
  const startHour = nightMins > 0 || nowHour < 6 ? 0 : 6;
  const endHour = nightMins > 0 || nowHour >= 22 ? 24 : 22;
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);

  const cellBg = (minutes, scaleMax) => {
    const intensity = scaleMax > 0 ? minutes / scaleMax : 0;
    if (intensity <= 0) return '#e2e8f0';
    if (intensity < 0.25) return '#ddd6fe';
    if (intensity < 0.5) return '#a78bfa';
    if (intensity < 0.75) return '#d946ef';
    return '#c026d3';
  };

  const hourHead = hours
    .map((hour) => {
      const label = hour === nowHour || hour % 3 === startHour % 3 ? hourTick(hour) : '';
      return `<span style="text-align:center;font-size:8px;font-weight:600;color:${hour === nowHour ? '#7c3aed' : '#94a3b8'}">${label}</span>`;
    })
    .join('');

  const todayTotal = todayHours.reduce((s, n) => s + (Number(n) || 0), 0);
  const todayCells = hours
    .map((hour) => {
      const minutes = Number(todayHours[hour]) || 0;
      const upcoming = hour > nowHour;
      const bg = upcoming ? '#f8fafc' : cellBg(minutes, Math.max(todayMax, 1));
      const border = hour === nowHour ? '2px solid #7c3aed' : 'none';
      return `<div style="height:14px;border-radius:2px;background:${bg};border:${border}"></div>`;
    })
    .join('');

  const rows = labels
    .map((label, dayIndex) => {
      const total = (matrix[dayIndex] || []).reduce((s, m) => s + (Number(m) || 0), 0);
      const cells = hours
        .map((hour) => {
          const minutes = Number(matrix[dayIndex]?.[hour]) || 0;
          return `<div style="height:14px;border-radius:2px;background:${cellBg(minutes, max)}"></div>`;
        })
        .join('');
      return `
        <span style="font-size:10px;font-weight:700;color:#64748b;line-height:1.2">${esc(label)}<br/><span style="font-weight:600;color:#94a3b8">${esc(formatFocusMinutes(total).label)}</span></span>
        ${cells}`;
    })
    .join('');

  return `
    <div style="display:grid;grid-template-columns:40px repeat(${hours.length},minmax(0,1fr));gap:3px 2px;align-items:center">
      <span></span>
      ${hourHead}
      <span style="font-size:10px;font-weight:700;color:#7c3aed;line-height:1.2">Today<br/><span style="font-weight:600">${esc(formatFocusMinutes(todayTotal).label)}</span></span>
      ${todayCells}
      ${rows}
    </div>
    <div style="display:flex;align-items:center;gap:6px;margin-top:12px;font-size:10px;color:#64748b">
      <span>Less</span>
      <span style="width:10px;height:10px;border-radius:2px;background:#e2e8f0"></span>
      <span style="width:10px;height:10px;border-radius:2px;background:#ddd6fe"></span>
      <span style="width:10px;height:10px;border-radius:2px;background:#a78bfa"></span>
      <span style="width:10px;height:10px;border-radius:2px;background:#d946ef"></span>
      <span style="width:10px;height:10px;border-radius:2px;background:#c026d3"></span>
      <span>More</span>
    </div>`;
}

function renderChartBlock(title, subtitle, imageDataUrl, legend) {
  const img = imageDataUrl
    ? `<img class="chart-img" src="${imageDataUrl}" alt="${esc(title)}" />`
    : `<div class="chart-placeholder">No chart data</div>`;

  const legendHtml = legend
    ? `<div style="display:flex;gap:10px;margin-top:10px;flex-wrap:wrap">${legend
        .map(
          (l) =>
            `<span style="display:inline-flex;align-items:center;gap:6px;font-size:10px;font-weight:600;color:${esc(l.color)};padding:4px 10px;border-radius:8px;background:${esc(l.bg)};border:1px solid ${esc(l.border)}">
              <span style="width:8px;height:8px;border-radius:50%;background:${esc(l.color)}"></span>${esc(l.label)}
            </span>`
        )
        .join('')}</div>`
    : '';

  return `
    <div class="card" style="background:linear-gradient(135deg,#f0fdfa 0%,#fff 55%,#ecfdf5 100%);border-color:#99f6e4">
      <div class="card-header">
        <h2 style="margin:0;font-size:16px;font-weight:700;color:#0f172a">${esc(title)}</h2>
        <p style="margin:4px 0 0;font-size:12px;color:#64748b">${esc(subtitle)}</p>
      </div>
      ${img}
      ${legendHtml}
    </div>`;
}

/**
 * Build print-ready HTML matching the Analytics page layout.
 * @param {Record<string, unknown>} payload
 */
export function renderAnalyticsReportHtml(payload) {
  const {
    userName,
    dateString,
    generatedAt,
    generatedAtDate,
    generatedAtTime,
    metrics,
    chartData,
    peakByDayHour,
    todayByHour,
    dayLabels,
    maxPeakCell,
    insight,
    charts,
  } = payload;

  const m = metrics || {};
  const todayLabel = formatFocusMinutes(m.focusMinutesToday).label;
  const yesterdayLabel = formatFocusMinutes(m.focusMinutesYesterday).label;
  const avgLabel = formatFocusMinutes(m.recentAvgMinutes).label;
  const weekLabel = formatFocusMinutes(m.focusMinutesThisWeek).label;
  const todayPeak = todayPeakHour(todayByHour);
  const vsAvg = Math.round(Number(m.todayVsAvgMinutes) || 0);
  const paceMax = Math.max(
    Number(m.focusMinutesToday) || 0,
    Number(m.focusMinutesYesterday) || 0,
    Number(m.recentAvgMinutes) || 0,
    1
  );

  const bestHourValue =
    todayPeak.minutes > 0
      ? `${hourShort(todayPeak.hour)}–${hourShort(todayPeak.hour + 1)}`
      : m.peakFocusWindow || '—';
  const bestHourHint =
    todayPeak.minutes > 0
      ? `${formatFocusMinutes(todayPeak.minutes).label} in that hour`
      : m.peakFocusWindow
        ? 'Usual peak · nothing locked in today yet'
        : 'Focus and a peak hour appears';

  const beatValue =
    (Number(m.recentAvgMinutes) || 0) <= 0
      ? '—'
      : vsAvg === 0
        ? 'Even'
        : vsAvg > 0
          ? `+${formatFocusMinutes(vsAvg).label}`
          : formatFocusMinutes(-vsAvg).label;
  const beatHint =
    (Number(m.recentAvgMinutes) || 0) <= 0
      ? 'Needs a few prior days'
      : vsAvg > 0
        ? `Usual is ${avgLabel}`
        : vsAvg < 0
          ? `to pass your usual ${avgLabel}`
          : `Matching your usual ${avgLabel}`;

  const openTasks =
    (Number(m.todaysFocusCount) || 0) +
    (Number(m.inProgressCount) || 0) +
    (Number(m.backlogCount) || 0);
  const doneTasks = Number(m.doneCount) || 0;

  const weekDays = Array.isArray(chartData) ? chartData.slice(-7) : [];
  const weekLit = weekDays.filter((d) => (Number(d.focusMinutes) || 0) > 0).length;
  const weekDelta =
    m.weekFocusDeltaPct != null && Number.isFinite(Number(m.weekFocusDeltaPct))
      ? `${Number(m.weekFocusDeltaPct) >= 0 ? '+' : ''}${m.weekFocusDeltaPct}% vs prior 7`
      : null;

  const streak = Number(m.streak) || 0;
  const streakHeadline =
    streak <= 0
      ? 'Light today’s flame'
      : m.streakAtRisk
        ? `Day ${streak} is on the line`
        : `Day ${streak} locked in`;

  const trendChart = charts?.focusTrend || charts?.focusSessions;
  const logoDataUrl = getLogoDataUrl();
  const brandMark = logoDataUrl
    ? `<span class="cover-brand-mark"><img src="${logoDataUrl}" alt="ThryvLoop" /></span>`
    : `<span class="cover-brand-mark">T</span>`;

  const insightTips =
    insight?.tips?.length > 0
      ? `<ul style="margin:12px 0 0;padding:0 0 0 18px;color:#64748b;font-size:12px;line-height:1.6">
          ${insight.tips.map((tip) => `<li style="margin-bottom:6px">${esc(tip)}</li>`).join('')}
        </ul>`
      : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>ThryvLoop Analytics Report</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <style>
    @page { size: A4; margin: 12mm 11mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: 'Outfit', system-ui, -apple-system, sans-serif;
      background: #f8fafc;
      color: #0f172a;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page { max-width: 780px; margin: 0 auto; }
    .cover {
      position: relative;
      overflow: hidden;
      border-radius: 28px;
      padding: 36px 34px 32px;
      margin-bottom: 18px;
      color: #fff;
      background:
        radial-gradient(ellipse 80% 70% at 100% 0%, rgba(167,139,250,0.45), transparent 55%),
        radial-gradient(ellipse 60% 50% at 0% 100%, rgba(6,182,212,0.28), transparent 50%),
        linear-gradient(145deg, #1e1b4b 0%, #312e81 42%, #4c1d95 78%, #0f172a 100%);
      border: 1px solid rgba(196,181,253,0.35);
      box-shadow: 0 24px 60px -24px rgba(49,46,129,0.55);
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .cover-orb {
      position: absolute;
      border-radius: 50%;
      pointer-events: none;
      filter: blur(2px);
    }
    .cover-grid {
      position: absolute;
      inset: 0;
      opacity: 0.12;
      background-image:
        linear-gradient(rgba(255,255,255,0.35) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.35) 1px, transparent 1px);
      background-size: 28px 28px;
      mask-image: linear-gradient(180deg, #000 20%, transparent 90%);
    }
    .cover-brand {
      position: relative;
      z-index: 1;
      display: inline-flex;
      align-items: center;
      gap: 10px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      color: rgba(255,255,255,0.78);
      margin-bottom: 22px;
    }
    .cover-brand-mark {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: rgba(255,255,255,0.12);
      border: 1px solid rgba(255,255,255,0.2);
      box-shadow: 0 0 24px rgba(167,139,250,0.45);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      letter-spacing: 0;
      padding: 4px;
    }
    .cover-brand-mark img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      display: block;
    }
    .cover-kicker {
      position: relative;
      z-index: 1;
      margin: 0 0 10px;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.28em;
      text-transform: uppercase;
      color: #c4b5fd;
    }
    .cover-name {
      position: relative;
      z-index: 1;
      margin: 0;
      font-size: 42px;
      font-weight: 700;
      letter-spacing: -0.045em;
      line-height: 1.05;
      color: #fff;
      text-shadow: 0 8px 40px rgba(0,0,0,0.35);
    }
    .cover-subtitle {
      position: relative;
      z-index: 1;
      margin: 14px 0 0;
      max-width: 420px;
      font-size: 14px;
      font-weight: 500;
      line-height: 1.55;
      color: rgba(255,255,255,0.78);
    }
    .cover-meta {
      position: relative;
      z-index: 1;
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 26px;
    }
    .cover-chip {
      display: inline-flex;
      flex-direction: column;
      gap: 3px;
      min-width: 150px;
      padding: 12px 16px;
      border-radius: 16px;
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.18);
      backdrop-filter: blur(8px);
    }
    .cover-chip-label {
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: rgba(226,232,240,0.72);
    }
    .cover-chip-value {
      font-size: 13px;
      font-weight: 700;
      color: #fff;
      letter-spacing: -0.01em;
    }
    .card {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 24px;
      padding: 22px;
      box-shadow: 0 12px 40px -16px rgba(15,23,42,0.12);
      break-inside: avoid;
      page-break-inside: avoid;
      margin-bottom: 14px;
      position: relative;
      overflow: hidden;
    }
    .card-header {
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 12px;
      margin-bottom: 14px;
    }
    .hero {
      background: linear-gradient(135deg, #fff 0%, #eef2ff 45%, #f5f3ff 100%);
      border: 2px solid #c7d2fe;
      border-radius: 28px;
      padding: 28px;
      margin-bottom: 14px;
      display: flex;
      gap: 24px;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: linear-gradient(90deg, #e0e7ff, #ede9fe);
      color: #4338ca;
      padding: 6px 14px;
      border-radius: 999px;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.08em;
      border: 1px solid #c7d2fe;
    }
    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #6366f1;
    }
    .chart-img {
      width: 100%;
      max-height: 220px;
      object-fit: contain;
      object-position: top center;
      display: block;
      border-radius: 8px;
    }
    .chart-placeholder {
      height: 140px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #94a3b8;
      font-size: 13px;
      background: #f8fafc;
      border-radius: 8px;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1.6fr;
      gap: 14px;
      margin-bottom: 14px;
    }
    .footer {
      margin-top: 20px;
      padding-top: 14px;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      font-size: 10px;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="cover">
      <div class="cover-grid"></div>
      <div class="cover-orb" style="width:220px;height:220px;top:-70px;right:-40px;background:rgba(167,139,250,0.35)"></div>
      <div class="cover-orb" style="width:160px;height:160px;bottom:-50px;left:-30px;background:rgba(34,211,238,0.22)"></div>

      <div class="cover-brand">
        ${brandMark}
        ThryvLoop
      </div>

      <p class="cover-kicker">Personal Analytics</p>
      <h1 class="cover-name">${esc(userName)}</h1>
      <p class="cover-subtitle">
        A private snapshot of focus time, streak, output, and work in motion — captured for this report.
      </p>

      <div class="cover-meta">
        <div class="cover-chip">
          <span class="cover-chip-label">Report period</span>
          <span class="cover-chip-value">${esc(dateString || 'Today')}</span>
        </div>
        <div class="cover-chip">
          <span class="cover-chip-label">Downloaded</span>
          <span class="cover-chip-value">${esc(generatedAtDate || generatedAt)}</span>
        </div>
        <div class="cover-chip">
          <span class="cover-chip-label">Recorded at</span>
          <span class="cover-chip-value">${esc(generatedAtTime || '—')}</span>
        </div>
      </div>
    </div>

    <div class="hero">
      <div style="flex:1;min-width:0">
        <div class="badge"><span class="dot"></span>TODAY</div>
        <p style="margin:18px 0 8px;font-size:12px;font-weight:700;color:#4f46e5;text-transform:uppercase;letter-spacing:0.18em">Time in focus</p>
        <div style="display:flex;align-items:flex-end;gap:12px;flex-wrap:wrap">
          <div style="font-size:56px;font-weight:700;letter-spacing:-0.04em;line-height:0.95;color:#0f172a">${esc(todayLabel)}</div>
          <span style="display:inline-flex;align-items:center;padding:6px 12px;border-radius:12px;font-size:11px;font-weight:700;border:1px solid #e2e8f0;background:#f8fafc;color:#475569;margin-bottom:6px">${esc(deltaVsYesterday(m.todayVsYesterdayPct))}</span>
        </div>
        <div style="margin-top:22px;border-radius:18px;border:1px solid #c7d2fe;background:rgba(238,242,255,0.7);padding:16px 18px">
          <div style="display:flex;gap:16px">
            ${paceBarHtml('Today', m.focusMinutesToday, paceMax, 'linear-gradient(180deg,#818cf8,#4f46e5)')}
            ${paceBarHtml('Yesterday', m.focusMinutesYesterday, paceMax, '#a5b4fc')}
            ${paceBarHtml('6-day avg', m.recentAvgMinutes, paceMax, '#cbd5e1')}
          </div>
        </div>
      </div>
      <div style="width:240px;flex-shrink:0;border-radius:20px;border:1px solid #c7d2fe;background:linear-gradient(180deg,#eef2ff,#fff);padding:16px">
        <p style="margin:0 0 12px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:#4f46e5">Today at a glance</p>
        ${insightChipHtml({
          label: 'Best hour today',
          value: bestHourValue,
          hint: bestHourHint,
          accent: '#7c3aed',
          bg: 'linear-gradient(135deg,#f5f3ff,#faf5ff)',
        })}
        ${insightChipHtml({
          label: 'Shipped today',
          value: String(m.tasksCompletedToday ?? 0),
          hint: `${m.tasksCompletedYesterday ?? 0} yesterday`,
          accent: '#059669',
          bg: 'linear-gradient(135deg,#ecfdf5,#f0fdfa)',
        })}
        ${insightChipHtml({
          label: vsAvg > 0 && (Number(m.recentAvgMinutes) || 0) > 0 ? 'Ahead of usual' : 'Beat your usual',
          value: beatValue,
          hint: beatHint,
          accent: '#d97706',
          bg: 'linear-gradient(135deg,#fffbeb,#fff7ed)',
        })}
      </div>
    </div>

    <div class="grid-2">
      <div class="card" style="background:linear-gradient(135deg,#f0f9ff,#fff 60%,#ecfeff);border-color:#bae6fd;margin-bottom:0">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">
          <span style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:#0369a1">Last 7 days</span>
        </div>
        <div style="font-size:28px;font-weight:700;letter-spacing:-0.02em">${esc(weekLabel)}</div>
        <div style="margin-top:6px;font-size:11px;color:#64748b;font-weight:500">
          ${weekDelta ? `<span style="color:${Number(m.weekFocusDeltaPct) >= 0 ? '#059669' : '#d97706'};font-weight:700">${esc(weekDelta)}</span> · ` : ''}${weekLit} of 7 days
        </div>
        <div style="margin-top:16px">${weekBarsHtml(chartData, m.date)}</div>
        <p style="margin:14px 0 0;font-size:11px;color:#64748b">Prior 7 days: ${esc(formatFocusMinutes(m.focusMinutesLastWeek).label)}</p>
      </div>

      <div class="card" style="background:linear-gradient(135deg,#fffbeb,#fff 55%,#fff7ed);border-color:#fde68a;margin-bottom:0">
        <div style="display:flex;justify-content:space-between;gap:16px">
          <div style="min-width:0">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
              <span style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:#c2410c">Daily streak</span>
              ${
                m.streakTitle
                  ? `<span style="padding:3px 8px;border-radius:999px;font-size:9px;font-weight:700;text-transform:uppercase;background:#ffedd5;color:#9a3412;border:1px solid #fdba74">${esc(m.streakTitle)}</span>`
                  : ''
              }
            </div>
            <div style="font-size:18px;font-weight:700">${esc(streakHeadline)}</div>
            <p style="margin:8px 0 0;font-size:12px;color:#64748b;line-height:1.5">
              ${
                streak <= 0
                  ? 'One focused session today starts the chain.'
                  : m.streakAtRisk
                    ? `Focus today or this ${streak}-day run resets at midnight.`
                    : 'Come back tomorrow — the flame only grows if you show up.'
              }
            </p>
          </div>
          <div style="text-align:center;flex-shrink:0">
            <div style="width:64px;height:64px;border-radius:16px;background:linear-gradient(135deg,#fbbf24,#ea580c);display:flex;align-items:center;justify-content:center;font-size:28px;margin:0 auto">${streak > 0 ? '🔥' : '○'}</div>
            <div style="margin-top:6px;font-size:28px;font-weight:700;line-height:1">${streak}</div>
            <div style="font-size:9px;font-weight:700;text-transform:uppercase;color:#94a3b8">${streak === 1 ? 'day' : 'days'}</div>
          </div>
        </div>
        ${streakChainHtml(chartData, m.date)}
        <p style="margin:14px 0 0;font-size:11px;color:#64748b">Best run ${m.longestStreak || 0} ${(m.longestStreak || 0) === 1 ? 'day' : 'days'}</p>
      </div>
    </div>

    ${renderChartBlock('Focus vs output', 'Last 14 days · time focused and tasks you actually finished', trendChart, [
      { label: 'Focus', color: '#5043F3', bg: 'rgba(80,67,243,0.1)', border: 'rgba(80,67,243,0.2)' },
      { label: 'Tasks done', color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)' },
    ])}

    <div class="card" style="background:linear-gradient(135deg,#faf5ff,#fff 55%,#fdf4ff);border-color:#e9d5ff">
      <div style="display:flex;justify-content:space-between;align-items:flex-end;gap:12px;margin-bottom:14px">
        <div>
          <h2 style="margin:0;font-size:16px;font-weight:700">When you focus</h2>
          <p style="margin:4px 0 0;font-size:12px;color:#64748b">Today’s hours, then your usual week over the last 30 days</p>
        </div>
        ${
          m.peakFocusWindow
            ? `<span style="font-size:10px;font-weight:700;color:#7c3aed;padding:5px 10px;border-radius:999px;background:#f5f3ff;border:1px solid #ddd6fe">Peak ${esc(m.peakFocusWindow)}</span>`
            : ''
        }
      </div>
      ${renderHeatmap(dayLabels, peakByDayHour, todayByHour, maxPeakCell)}
    </div>

    <div style="display:grid;grid-template-columns:1.35fr 1fr;gap:14px;margin-bottom:14px">
      <div class="card" style="background:linear-gradient(135deg,#f8fafc,#fff 55%,#eef2ff);border-color:#e2e8f0;margin-bottom:0">
        <div class="card-header" style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px">
          <div>
            <h2 style="margin:0;font-size:16px;font-weight:700">Work in motion</h2>
            <p style="margin:4px 0 0;font-size:12px;color:#64748b">${
              openTasks + doneTasks <= 0
                ? 'No personal tasks yet'
                : `${openTasks} open · ${doneTasks} done`
            }</p>
          </div>
        </div>
        ${workPipelineBars(m)}
      </div>

      <div class="card" style="background:linear-gradient(135deg,#faf5ff,#fff 55%,#fdf4ff);border-color:#e9d5ff;margin-bottom:0">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;padding-bottom:12px;border-bottom:1px solid #e9d5ff">
          <div style="width:36px;height:36px;border-radius:12px;background:linear-gradient(135deg,#ede9fe,#fae8ff);border:1px solid #e9d5ff;display:flex;align-items:center;justify-content:center;font-weight:700;color:#7c3aed;font-size:12px">AI</div>
          <div>
            <div style="font-size:15px;font-weight:700">Thryv AI</div>
            <div style="font-size:10px;font-weight:700;color:#7c3aed;text-transform:uppercase;letter-spacing:0.08em">From your week</div>
          </div>
        </div>
        ${
          insight?.summary
            ? `<p style="margin:0;font-size:13px;line-height:1.65;color:#334155">${esc(insight.summary)}</p>${insightTips}`
            : `<p style="margin:0;font-size:12px;color:#64748b;line-height:1.55">Insights are generated from your focus time and shipped tasks.</p>`
        }
      </div>
    </div>

    <div class="footer">
      ThryvLoop · Personal analytics report for ${esc(userName)} · Downloaded ${esc(generatedAt)}
    </div>
  </div>
</body>
</html>`;
}
