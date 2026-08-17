'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Zap, RefreshCw, Focus, ListTodo, AlertCircle, WifiOff, Clock3 } from 'lucide-react';
import {
  dashboardPanelClass,
} from '@/lib/appShellClasses';

const INSIGHT_CACHE_PREFIX = 'thryv.analyticsInsight.';

/** @type {Map<string, Promise<object>>} */
const inflightByUser = new Map();

function insightCacheKey(userId) {
  return `${INSIGHT_CACHE_PREFIX}${userId}`;
}

function readInsightCache(userId) {
  if (!userId || typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(insightCacheKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !parsed.summary) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeInsightCache(userId, data) {
  if (!userId || typeof window === 'undefined' || !data?.summary) return;
  try {
    sessionStorage.setItem(insightCacheKey(userId), JSON.stringify(data));
  } catch {
    /* ignore quota / private mode */
  }
}

/**
 * Turn API / Gemini failure text into calm, user-facing copy.
 * @param {string} raw
 * @param {number} [status]
 * @param {{ code?: string, limit?: string, upgrade?: boolean }} [meta]
 */
function friendlyInsightError(raw, status, meta = {}) {
  const text = String(raw || '');
  const lower = text.toLowerCase();
  const isRate =
    status === 429 ||
    meta.code === 'rate_limit' ||
    meta.upgrade ||
    lower.includes('rate limit') ||
    lower.includes('quota') ||
    lower.includes('too many') ||
    lower.includes('daily ai limit') ||
    lower.includes('ai request limit');

  if (status === 401 || lower.includes('unauthorized')) {
    return {
      kind: 'auth',
      title: 'Sign-in required',
      detail: 'Your session expired. Refresh the page and try again.',
      upgrade: false,
    };
  }

  if (isRate) {
    const isDaily = meta.limit === 'day' || lower.includes('daily');
    return {
      kind: 'rate',
      title: isDaily ? 'Daily AI limit reached' : 'AI limit reached',
      detail: isDaily
        ? 'You’ve used today’s free AI allowance. Upgrade to Pro for higher limits and unlimited assistant messages.'
        : 'You’ve hit the free AI request limit. Upgrade to Pro for higher limits, or wait a moment and try again.',
      upgrade: true,
    };
  }

  if (
    status === 503 ||
    lower.includes('api key') ||
    lower.includes('gemini') ||
    lower.includes('model not found') ||
    lower.includes('.env')
  ) {
    return {
      kind: 'service',
      title: 'Insight unavailable',
      detail: 'Thryv AI couldn’t generate a summary right now. Try again in a bit.',
      upgrade: false,
    };
  }

  if (lower.includes('failed to fetch') || lower.includes('network')) {
    return {
      kind: 'network',
      title: 'Connection issue',
      detail: 'Check your internet connection, then try again.',
      upgrade: false,
    };
  }

  return {
    kind: 'generic',
    title: 'Couldn’t generate insight',
    detail: 'Something went wrong while reading your week. You can try again.',
    upgrade: false,
  };
}

async function requestAnalyticsInsight(metrics) {
  const res = await fetch('/api/assistant/analytics-insight', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ metrics }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || 'Failed to generate insight');
    err.status = res.status;
    err.code = data.code;
    err.limit = data.limit;
    err.upgrade = Boolean(data.upgrade);
    throw err;
  }
  return data;
}

function InsightErrorState({ error, onRetry, loading, compact = false }) {
  const Icon =
    error.kind === 'rate' ? Clock3 : error.kind === 'network' ? WifiOff : AlertCircle;
  const showUpgrade = Boolean(error.upgrade);

  if (compact) {
    return (
      <div
        role="alert"
        className={`mb-3 flex items-start gap-2.5 rounded-xl border px-3 py-2.5 ${
          showUpgrade
            ? 'border-violet-200/80 dark:border-violet-500/30 bg-violet-50/90 dark:bg-violet-950/40'
            : 'border-rose-200/70 dark:border-rose-500/25 bg-rose-50/90 dark:bg-rose-950/35'
        }`}
      >
        <Icon
          className={`w-4 h-4 shrink-0 mt-0.5 ${
            showUpgrade ? 'text-violet-600 dark:text-violet-400' : 'text-rose-600 dark:text-rose-400'
          }`}
        />
        <div className="min-w-0 flex-1">
          <p
            className={`text-xs font-semibold ${
              showUpgrade ? 'text-violet-900 dark:text-violet-100' : 'text-rose-800 dark:text-rose-200'
            }`}
          >
            {error.title}
          </p>
          <p
            className={`text-[11px] leading-snug mt-0.5 ${
              showUpgrade
                ? 'text-violet-800/90 dark:text-violet-200/90'
                : 'text-rose-700/90 dark:text-rose-300/90'
            }`}
          >
            {error.detail}
          </p>
          {showUpgrade ? (
            <Link
              href="/#pricing"
              className="mt-1.5 inline-flex text-[11px] font-bold text-violet-700 dark:text-violet-300 hover:underline"
            >
              Upgrade to Pro
            </Link>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onRetry}
          disabled={loading}
          className={`shrink-0 text-[11px] font-semibold hover:underline disabled:opacity-50 cursor-pointer ${
            showUpgrade ? 'text-violet-700 dark:text-violet-300' : 'text-rose-700 dark:text-rose-300'
          }`}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div
      role="alert"
      className="h-full min-h-[140px] flex flex-col items-center justify-center text-center px-2 py-4"
    >
      <div
        className={`w-11 h-11 rounded-2xl border flex items-center justify-center mb-3 ${
          showUpgrade
            ? 'bg-violet-100 dark:bg-violet-950/50 border-violet-200/70 dark:border-violet-500/25'
            : 'bg-rose-100 dark:bg-rose-950/50 border-rose-200/70 dark:border-rose-500/25'
        }`}
      >
        <Icon
          className={`w-5 h-5 ${
            showUpgrade ? 'text-violet-600 dark:text-violet-400' : 'text-rose-600 dark:text-rose-400'
          }`}
        />
      </div>
      <p className="text-sm font-bold text-foreground tracking-tight">{error.title}</p>
      <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed max-w-[260px]">
        {error.detail}
      </p>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        {showUpgrade ? (
          <Link
            href="/#pricing"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white text-xs font-semibold shadow-md shadow-violet-500/25 transition-all"
          >
            Upgrade to Pro
          </Link>
        ) : null}
        <button
          type="button"
          onClick={onRetry}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-violet-200/80 dark:border-violet-500/30 bg-card hover:bg-violet-50/80 dark:hover:bg-violet-950/40 text-violet-700 dark:text-violet-300 text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Try again
        </button>
      </div>
    </div>
  );
}

export default function ThryvAIInsightCard({ metrics, enabled, userId, onInsightChange }) {
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(/** @type {{ kind: string, title: string, detail: string } | null} */ (null));
  const metricsRef = useRef(metrics);
  metricsRef.current = metrics;
  const onInsightChangeRef = useRef(onInsightChange);
  onInsightChangeRef.current = onInsightChange;

  const fetchInsight = useCallback(
    async ({ force = false } = {}) => {
      if (!enabled || !metricsRef.current || !userId) return;

      if (!force) {
        const cached = readInsightCache(userId);
        if (cached) {
          setInsight(cached);
          onInsightChangeRef.current?.(cached);
          setError(null);
          return cached;
        }
      }

      setLoading(true);
      setError(null);
      try {
        let data;
        if (!force && inflightByUser.has(userId)) {
          data = await inflightByUser.get(userId);
        } else {
          const request = requestAnalyticsInsight(metricsRef.current);
          if (!force) inflightByUser.set(userId, request);
          try {
            data = await request;
          } finally {
            if (inflightByUser.get(userId) === request) {
              inflightByUser.delete(userId);
            }
          }
        }

        writeInsightCache(userId, data);
        setInsight(data);
        onInsightChangeRef.current?.(data);
        setError(null);
        return data;
      } catch (e) {
        if (!force) {
          setInsight(null);
          onInsightChangeRef.current?.(null);
        }
        setError(friendlyInsightError(e?.message, e?.status, {
          code: e?.code,
          limit: e?.limit,
          upgrade: e?.upgrade,
        }));
        return null;
      } finally {
        setLoading(false);
      }
    },
    [enabled, userId]
  );

  useEffect(() => {
    if (!enabled || !userId) return;

    const cached = readInsightCache(userId);
    if (cached) {
      setInsight(cached);
      onInsightChangeRef.current?.(cached);
      setError(null);
      return;
    }

    fetchInsight({ force: false });
  }, [enabled, userId, fetchInsight]);

  return (
    <div className={`${dashboardPanelClass} h-full bg-gradient-to-br from-violet-50/90 via-card to-fuchsia-50/50 dark:from-violet-950/35 dark:via-card dark:to-fuchsia-950/20 border-violet-200/70 dark:border-violet-500/20`}>
      <div className="absolute top-0 right-0 w-24 h-24 bg-fuchsia-400/20 dark:bg-fuchsia-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="relative z-10 flex flex-col flex-1 min-h-0">
        <div className="flex items-center gap-3 pb-4 mb-4 border-b border-violet-200/60 dark:border-violet-500/20 shrink-0">
          <div className="p-2.5 bg-gradient-to-br from-violet-100 to-fuchsia-100 dark:from-violet-950/55 dark:to-fuchsia-950/35 rounded-xl shadow-sm border border-violet-200/50 dark:border-violet-500/25">
            <Zap className="w-5 h-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold text-foreground tracking-tight">Thryv AI</h2>
            <p className="text-[10px] font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wider">
              From your week
            </p>
          </div>
          <button
            type="button"
            onClick={() => fetchInsight({ force: true })}
            disabled={loading || !enabled}
            className="shrink-0 p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted/60 disabled:opacity-50 transition-colors cursor-pointer"
            aria-label="Regenerate AI insight"
            title="Regenerate"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="flex-1 min-h-[160px] rounded-2xl bg-violet-50/70 dark:bg-violet-950/30 border border-violet-100/70 dark:border-violet-500/15 p-4 mb-4 overflow-y-auto">
          {loading && !insight ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-3.5 bg-muted rounded-md w-full" />
              <div className="h-3.5 bg-muted rounded-md w-[92%]" />
              <div className="h-3 bg-muted rounded-md w-[75%] mt-4" />
              <div className="h-3 bg-muted rounded-md w-[88%]" />
            </div>
          ) : error && !insight ? (
            <InsightErrorState
              error={error}
              loading={loading}
              onRetry={() => fetchInsight({ force: true })}
            />
          ) : insight ? (
            <div>
              {error ? (
                <InsightErrorState
                  error={error}
                  loading={loading}
                  compact
                  onRetry={() => fetchInsight({ force: true })}
                />
              ) : null}
              {loading ? (
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                  Regenerating…
                </p>
              ) : null}
              {insight.summary ? (
                <p className="text-sm text-foreground leading-relaxed">{insight.summary}</p>
              ) : null}
              {insight.tips?.length > 0 ? (
                <ul className="mt-3 space-y-2">
                  {insight.tips.map((tip) => (
                    <li key={tip} className="flex gap-2 text-xs text-muted-foreground leading-relaxed">
                      <span className="text-violet-500 dark:text-violet-400 shrink-0 mt-0.5">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground leading-relaxed">
              Insights are generated from your focus time and shipped tasks.
            </p>
          )}
        </div>

        <div className="flex gap-2 shrink-0 mt-auto">
          <Link
            href="/focus"
            className="inline-flex items-center justify-center gap-2 flex-1 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold text-sm transition-all shadow-md shadow-violet-500/20 dark:shadow-violet-900/40"
          >
            <Focus className="w-4 h-4" />
            Start focus
          </Link>
          <Link
            href="/tasks"
            className="inline-flex items-center justify-center gap-2 flex-1 py-3 rounded-xl border border-border bg-card hover:bg-muted/60 text-foreground font-semibold text-sm transition-colors"
          >
            <ListTodo className="w-4 h-4" />
            Tasks
          </Link>
        </div>
      </div>
    </div>
  );
}
