/** Escape text for safe HTML embedding. */
function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function balanceStatus(efficiency) {
  if (efficiency >= 70) return { label: 'On track', bg: '#ecfdf5', color: '#047857', border: '#a7f3d0' };
  if (efficiency >= 40) return { label: 'Good', bg: '#fffbeb', color: '#b45309', border: '#fde68a' };
  return { label: 'Getting started', bg: '#f8fafc', color: '#64748b', border: '#e2e8f0' };
}

function renderHeatmap(dayLabels, peakByDayHour, maxPeakCell) {
  return dayLabels
    .map((label, dayIndex) => {
      const cells = Array.from({ length: 24 }, (_, hour) => {
        const count = peakByDayHour[dayIndex]?.[hour] ?? 0;
        const intensity = maxPeakCell > 0 ? count / maxPeakCell : 0;
        const bg =
          intensity === 0
            ? '#f1f5f9'
            : `rgba(80, 67, 243, ${(0.2 + 0.7 * intensity).toFixed(2)})`;
        return `<div style="flex:1;min-width:6px;height:14px;border-radius:2px;background:${bg}" title="${esc(label)} ${hour}:00 – ${count}"></div>`;
      }).join('');
      return `
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
          <span style="width:28px;font-size:10px;font-weight:600;color:#64748b;flex-shrink:0">${esc(label)}</span>
          <div style="display:flex;gap:2px;flex:1">${cells}</div>
        </div>`;
    })
    .join('');
}

function renderKpiCard(kpi) {
  return `
    <div style="background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:16px;position:relative;overflow:hidden;box-shadow:0 4px 24px -4px rgba(0,0,0,0.06)">
      <div style="position:absolute;top:0;left:0;width:4px;height:100%;background:${esc(kpi.color)};opacity:0.9"></div>
      <div style="font-size:9px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px">${esc(kpi.label)}</div>
      <div style="font-size:26px;font-weight:700;color:#0f172a;letter-spacing:-0.02em;line-height:1.1">${esc(kpi.value)}</div>
      <div style="font-size:11px;color:#64748b;margin-top:4px;font-weight:500">${esc(kpi.sub)}</div>
    </div>`;
}

function renderChartBlock(title, subtitle, imageDataUrl, legend, { compact = false } = {}) {
  const img = imageDataUrl
    ? `<img class="chart-img${compact ? ' chart-img-sm' : ''}" src="${imageDataUrl}" alt="${esc(title)}" />`
    : `<div class="chart-placeholder${compact ? ' chart-placeholder-sm' : ''}">No chart data</div>`;

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
    <div class="chart-block${compact ? ' chart-block-compact' : ''}">
      <div class="chart-block-header">
        <h2 style="margin:0;font-size:16px;font-weight:700;color:#0f172a">${esc(title)}</h2>
        <p style="margin:4px 0 0;font-size:12px;color:#64748b">${esc(subtitle)}</p>
      </div>
      <div class="chart-block-body">
        ${img}
        ${legendHtml}
      </div>
    </div>`;
}

/**
 * Build print-ready HTML for the analytics PDF report.
 * @param {Record<string, unknown>} payload
 */
export function renderAnalyticsReportHtml(payload) {
  const {
    userName,
    dateString,
    generatedAt,
    metrics,
    chartData,
    taskDistribution,
    peakByDayHour,
    dayLabels,
    maxPeakCell,
    categoryCounts,
    insight,
    charts,
  } = payload;

  const efficiency = metrics.focusEfficiency ?? 0;
  const status = balanceStatus(efficiency);
  const circumference = 2 * Math.PI * 42;
  const dash = (circumference * efficiency) / 100;

  const kpis = [
    { label: 'Sessions today', value: metrics.sessionsToday, sub: `${metrics.focusMinutesToday} min focus`, color: '#5043F3' },
    { label: 'Meetings today', value: metrics.meetingMinutesToday, sub: metrics.calendarConnected ? 'calendar connected' : 'not connected', color: '#8b5cf6' },
    { label: 'Productive today', value: metrics.productiveMinutesToday, sub: 'focus + meetings', color: '#06b6d4' },
    { label: 'Productive (week)', value: metrics.productiveMinutesThisWeek, sub: 'minutes', color: '#0ea5e9' },
    { label: 'Tasks done (week)', value: metrics.tasksCompletedThisWeek, sub: 'completed', color: '#10b981' },
    { label: 'Streak', value: metrics.streak, sub: 'days', color: '#f59e0b' },
    { label: 'Efficiency', value: `${efficiency}%`, sub: metrics.timerMode || 'Pomodoro', color: '#5043F3' },
  ];

  const categoryTags = Object.entries(categoryCounts || {})
    .map(
      ([cat, count]) =>
        `<span style="display:inline-block;padding:4px 10px;border-radius:8px;background:rgba(80,67,243,0.1);color:#5043F3;font-size:11px;font-weight:600;border:1px solid rgba(80,67,243,0.2);margin:0 6px 6px 0">${esc(cat)}: ${count}</span>`
    )
    .join('');

  const insightTips =
    insight?.tips?.length > 0
      ? `<ul style="margin:12px 0 0;padding:0 0 0 18px;color:#475569;font-size:12px;line-height:1.6">
          ${insight.tips.map((tip) => `<li style="margin-bottom:6px">${esc(tip)}</li>`).join('')}
        </ul>`
      : '';

  const trendTableRows = (chartData || [])
    .map(
      (row) =>
        `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;color:#475569;font-size:11px">${esc(row.label)}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;text-align:right;font-weight:600;color:#0f172a;font-size:11px">${row.focusMinutes}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;text-align:right;font-weight:600;color:#0f172a;font-size:11px">${row.sessions}</td>
        </tr>`
    )
    .join('');

  const taskDistRows = (taskDistribution || [])
    .map(
      (row) =>
        `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;color:#475569;font-size:11px">
            <span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${esc(row.color)};margin-right:8px"></span>
            ${esc(row.name)}
          </td>
          <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;text-align:right;font-weight:600;color:#0f172a;font-size:11px">${row.value}</td>
        </tr>`
    )
    .join('');

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
    @page { size: A4; margin: 14mm 12mm; }
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
      background: linear-gradient(135deg, #5043F3 0%, #3730a3 55%, #06b6d4 100%);
      border-radius: 20px;
      padding: 36px 32px;
      color: #fff;
      margin-bottom: 24px;
      page-break-after: avoid;
    }
    .section-title {
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: #5043F3;
      margin: 0 0 12px;
    }
    .grid-kpi {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 14px;
    }
    .chart-stack {
      display: flex;
      flex-direction: column;
      gap: 14px;
      margin-bottom: 14px;
    }
    .chart-pair {
      display: flex;
      flex-direction: row;
      gap: 14px;
      margin-bottom: 14px;
    }
    .chart-pair > .chart-block {
      flex: 1 1 0;
      min-width: 0;
      margin-bottom: 0;
    }
    .grid-2 {
      display: flex;
      flex-direction: row;
      gap: 14px;
      margin-bottom: 14px;
    }
    .grid-2 > .card {
      flex: 1 1 0;
      min-width: 0;
    }
    .chart-block {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 18px;
      margin-bottom: 14px;
      box-shadow: 0 4px 24px -4px rgba(0,0,0,0.06);
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .chart-block-compact {
      margin-bottom: 0;
      padding: 16px;
    }
    .chart-block-header {
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 10px;
      margin-bottom: 12px;
    }
    .chart-block-body {
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .chart-img {
      width: 100%;
      max-height: 200px;
      object-fit: contain;
      object-position: top center;
      display: block;
      border-radius: 8px;
    }
    .chart-img-sm { max-height: 160px; }
    .chart-placeholder {
      height: 120px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #94a3b8;
      font-size: 13px;
      background: #f8fafc;
      border-radius: 8px;
    }
    .chart-placeholder-sm { height: 100px; }
    .card {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 22px;
      box-shadow: 0 4px 24px -4px rgba(0,0,0,0.06);
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .footer {
      margin-top: 28px;
      padding-top: 16px;
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
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px">
        <div>
          <div style="font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;opacity:0.85;margin-bottom:8px">ThryvLoop</div>
          <h1 style="margin:0;font-size:32px;font-weight:700;line-height:1.15;letter-spacing:-0.02em">Productivity Report</h1>
          <p style="margin:12px 0 0;font-size:14px;opacity:0.92;font-weight:500">Prepared for ${esc(userName)}</p>
          <p style="margin:6px 0 0;font-size:13px;opacity:0.8">${esc(dateString)}</p>
        </div>
        <div style="text-align:right;font-size:11px;opacity:0.85;line-height:1.5">
          <div>Generated</div>
          <div style="font-weight:600">${esc(generatedAt)}</div>
        </div>
      </div>
    </div>

    ${
      insight?.summary
        ? `
    <div class="card" style="margin-bottom:20px;border-color:rgba(80,67,243,0.25);background:linear-gradient(180deg,#fafaff 0%,#fff 100%)">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
        <div style="width:36px;height:36px;border-radius:10px;background:#5043F3;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:14px">AI</div>
        <div>
          <div style="font-size:15px;font-weight:700;color:#0f172a">Thryv AI Insight</div>
          <div style="font-size:10px;font-weight:600;color:#5043F3;text-transform:uppercase;letter-spacing:0.08em">Powered by Gemini</div>
        </div>
      </div>
      <p style="margin:0;font-size:13px;line-height:1.65;color:#334155">${esc(insight.summary)}</p>
      ${insightTips}
    </div>`
        : ''
    }

    <p class="section-title">Key metrics</p>
    <div class="grid-kpi">
      ${kpis.map(renderKpiCard).join('')}
    </div>

    ${renderChartBlock('Focus & sessions', 'Last 14 days · focus time (min) & session count', charts?.focusSessions, [
      { label: 'Focus (min)', color: '#5043F3', bg: 'rgba(80,67,243,0.1)', border: 'rgba(80,67,243,0.2)' },
      { label: 'Sessions', color: '#06b6d4', bg: 'rgba(6,182,212,0.1)', border: 'rgba(6,182,212,0.2)' },
    ])}

    <div class="chart-stack">
      ${renderChartBlock('Sessions per day', 'Daily session count · last 14 days', charts?.sessionsPerDay, null, { compact: true })}
      ${renderChartBlock('Task distribution', 'Tasks by column', charts?.taskDistribution, null, { compact: true })}
    </div>

    <div class="card" style="margin-bottom:20px">
      <div style="border-bottom:1px solid #e2e8f0;padding-bottom:14px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center;gap:12px">
        <div>
          <h2 style="margin:0;font-size:16px;font-weight:700;color:#0f172a">Peak hours</h2>
          <p style="margin:4px 0 0;font-size:12px;color:#64748b">When you focus · last 30 days</p>
        </div>
        <span style="font-size:10px;font-weight:600;color:#5043F3;padding:5px 10px;border-radius:8px;background:rgba(80,67,243,0.1);border:1px solid rgba(80,67,243,0.2)">Sun–Sat · 0h–23h</span>
      </div>
      ${renderHeatmap(dayLabels, peakByDayHour, maxPeakCell)}
      ${
        metrics.peakFocusWindow
          ? `<p style="margin:14px 0 0;font-size:12px;color:#64748b"><strong style="color:#5043F3">Peak window:</strong> ${esc(metrics.peakFocusWindow)}</p>`
          : ''
      }
    </div>

    <div class="grid-2">
      <div class="card">
        <div style="border-bottom:1px solid #e2e8f0;padding-bottom:14px;margin-bottom:16px">
          <h2 style="margin:0;font-size:16px;font-weight:700">Balance score</h2>
          <p style="margin:4px 0 0;font-size:10px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.08em">Focus vs tasks</p>
        </div>
        <div style="display:flex;align-items:center;gap:20px">
          <div style="position:relative;width:120px;height:120px;flex-shrink:0">
            <svg viewBox="0 0 100 100" style="width:100%;height:100%;transform:rotate(-90deg)">
              <defs>
                <linearGradient id="balGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#5043F3"/>
                  <stop offset="100%" stop-color="#06b6d4"/>
                </linearGradient>
              </defs>
              <circle cx="50" cy="50" r="42" fill="none" stroke="#e2e8f0" stroke-width="8"/>
              <circle cx="50" cy="50" r="42" fill="none" stroke="url(#balGrad)" stroke-width="8" stroke-linecap="round"
                stroke-dasharray="${dash} ${circumference}"/>
            </svg>
            <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center">
              <span style="font-size:28px;font-weight:700;color:#0f172a">${efficiency}</span>
              <span style="font-size:9px;font-weight:600;color:#64748b;text-transform:uppercase">of 100</span>
            </div>
          </div>
          <div style="flex:1">
            <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #e2e8f0;font-size:12px">
              <span style="color:#64748b">High priority</span><strong>${metrics.highPriorityCount ?? 0}</strong>
            </div>
            <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #e2e8f0;font-size:12px">
              <span style="color:#64748b">Overdue</span><strong>${metrics.overdueCount ?? 0}</strong>
            </div>
            <span style="display:inline-block;margin-top:10px;font-size:11px;font-weight:600;padding:4px 10px;border-radius:999px;background:${status.bg};color:${status.color};border:1px solid ${status.border}">${status.label}</span>
          </div>
        </div>
      </div>

      <div class="card">
        <div style="border-bottom:1px solid #e2e8f0;padding-bottom:14px;margin-bottom:16px">
          <h2 style="margin:0;font-size:16px;font-weight:700">Focus & tasks</h2>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div style="border:1px solid #e2e8f0;border-radius:12px;padding:12px">
            <div style="font-size:9px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.06em">Focus blocks today</div>
            <div style="font-size:22px;font-weight:700;margin-top:4px">${metrics.sessionsToday ?? 0}</div>
          </div>
          <div style="border:1px solid #e2e8f0;border-radius:12px;padding:12px">
            <div style="font-size:9px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.06em">Today's focus tasks</div>
            <div style="font-size:22px;font-weight:700;margin-top:4px">${metrics.todaysFocusCount ?? 0}</div>
          </div>
          <div style="border:1px solid #e2e8f0;border-radius:12px;padding:12px">
            <div style="font-size:9px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.06em">In progress</div>
            <div style="font-size:22px;font-weight:700;margin-top:4px">${metrics.inProgressCount ?? 0}</div>
          </div>
          <div style="border:1px solid #e2e8f0;border-radius:12px;padding:12px">
            <div style="font-size:9px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.06em">Total tasks</div>
            <div style="font-size:22px;font-weight:700;margin-top:4px">${metrics.totalTasks ?? 0}</div>
          </div>
        </div>
        ${categoryTags ? `<div style="margin-top:14px;padding-top:14px;border-top:1px solid #e2e8f0">${categoryTags}</div>` : ''}
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <h3 style="margin:0 0 12px;font-size:14px;font-weight:700">14-day trend data</h3>
        <table style="width:100%;border-collapse:collapse">
          <thead>
            <tr style="background:#f8fafc">
              <th style="padding:8px 12px;text-align:left;font-size:10px;color:#64748b;text-transform:uppercase">Date</th>
              <th style="padding:8px 12px;text-align:right;font-size:10px;color:#64748b;text-transform:uppercase">Focus min</th>
              <th style="padding:8px 12px;text-align:right;font-size:10px;color:#64748b;text-transform:uppercase">Sessions</th>
            </tr>
          </thead>
          <tbody>${trendTableRows}</tbody>
        </table>
      </div>
      <div class="card">
        <h3 style="margin:0 0 12px;font-size:14px;font-weight:700">Task breakdown</h3>
        <table style="width:100%;border-collapse:collapse">
          <thead>
            <tr style="background:#f8fafc">
              <th style="padding:8px 12px;text-align:left;font-size:10px;color:#64748b;text-transform:uppercase">Column</th>
              <th style="padding:8px 12px;text-align:right;font-size:10px;color:#64748b;text-transform:uppercase">Count</th>
            </tr>
          </thead>
          <tbody>${taskDistRows || '<tr><td colspan="2" style="padding:12px;color:#94a3b8;font-size:12px">No tasks yet</td></tr>'}</tbody>
        </table>
      </div>
    </div>

    <div class="footer">
      ThryvLoop · Personal productivity report · Confidential — generated for ${esc(userName)} only
    </div>
  </div>
</body>
</html>`;
}
