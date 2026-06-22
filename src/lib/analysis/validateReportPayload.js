const MAX_CHART_DATA_URL_LEN = 4_000_000;

/**
 * Validate and normalize analytics report payload from client POST.
 * @param {unknown} body
 * @returns {{ ok: true, payload: Record<string, unknown> } | { ok: false, error: string }}
 */
export function validateReportPayload(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, error: 'Invalid request body' };
  }

  const {
    userName,
    dateString,
    metrics,
    chartData,
    taskDistribution,
    peakByDayHour,
    dayLabels,
    maxPeakCell,
    categoryCounts,
    insight,
    charts,
  } = body;

  if (!metrics || typeof metrics !== 'object' || Array.isArray(metrics)) {
    return { ok: false, error: 'metrics is required' };
  }

  if (!Array.isArray(chartData)) {
    return { ok: false, error: 'chartData must be an array' };
  }

  if (!Array.isArray(peakByDayHour) || !Array.isArray(dayLabels)) {
    return { ok: false, error: 'peakByDayHour and dayLabels are required' };
  }

  const normalizedCharts = {};
  if (charts && typeof charts === 'object') {
    for (const key of ['focusSessions', 'sessionsPerDay', 'taskDistribution']) {
      const val = charts[key];
      if (typeof val === 'string' && val.startsWith('data:image/')) {
        if (val.length > MAX_CHART_DATA_URL_LEN) {
          return { ok: false, error: 'Chart image too large' };
        }
        normalizedCharts[key] = val;
      }
    }
  }

  let normalizedInsight = null;
  if (insight && typeof insight === 'object') {
    normalizedInsight = {
      summary: typeof insight.summary === 'string' ? insight.summary.slice(0, 4000) : undefined,
      tips: Array.isArray(insight.tips)
        ? insight.tips.filter((t) => typeof t === 'string').slice(0, 8).map((t) => t.slice(0, 500))
        : [],
    };
  }

  return {
    ok: true,
    payload: {
      userName: typeof userName === 'string' ? userName.slice(0, 120) : 'User',
      dateString: typeof dateString === 'string' ? dateString.slice(0, 120) : new Date().toDateString(),
      generatedAt: new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }),
      metrics,
      chartData: chartData.slice(0, 31),
      taskDistribution: Array.isArray(taskDistribution) ? taskDistribution.slice(0, 20) : [],
      peakByDayHour,
      dayLabels,
      maxPeakCell: typeof maxPeakCell === 'number' ? maxPeakCell : 1,
      categoryCounts:
        categoryCounts && typeof categoryCounts === 'object' && !Array.isArray(categoryCounts)
          ? categoryCounts
          : {},
      insight: normalizedInsight,
      charts: normalizedCharts,
    },
  };
}
