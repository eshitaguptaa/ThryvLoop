'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Zap, RefreshCw, Focus, ListTodo } from 'lucide-react';

export default function ThryvAIInsightCard({ metrics, enabled, onInsightChange }) {
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchInsight = useCallback(async () => {
    if (!enabled || !metrics) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/assistant/analytics-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metrics }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to generate insight');
      setInsight(data);
      onInsightChange?.(data);
    } catch (e) {
      setInsight(null);
      onInsightChange?.(null);
      setError(e?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [enabled, metrics, onInsightChange]);

  useEffect(() => {
    if (enabled) fetchInsight();
  }, [enabled, fetchInsight]);

  return (
    <div className="rounded-2xl bg-card border border-border overflow-hidden flex flex-col h-full transition-all duration-300 hover:shadow-[0_8px_30px_-8px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_8px_30px_-8px_rgba(0,0,0,0.35)] hover:-translate-y-0.5 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.35)]">
      <div className="p-6 flex flex-col flex-1 min-h-0">
        <div className="flex items-center gap-3 pb-4 mb-4 border-b border-border shrink-0">
          <div className="w-10 h-10 rounded-xl bg-[#5043F3] flex items-center justify-center shadow-md shadow-indigo-500/25 dark:shadow-indigo-900/50">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold text-foreground tracking-tight">Thryv AI</h2>
            <p className="text-[10px] font-semibold text-[#5043F3] dark:text-indigo-400 uppercase tracking-wider">
              Powered by Gemini
            </p>
          </div>
          <button
            type="button"
            onClick={fetchInsight}
            disabled={loading || !enabled}
            className="shrink-0 p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted/60 disabled:opacity-50 transition-colors cursor-pointer"
            aria-label="Refresh AI insight"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="h-[148px] shrink-0 rounded-xl bg-muted/50 dark:bg-indigo-950/30 border border-border dark:border-indigo-500/15 p-4 mb-4 overflow-y-auto">
          {loading && !insight ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-3.5 bg-muted rounded-md w-full" />
              <div className="h-3.5 bg-muted rounded-md w-[92%]" />
              <div className="h-3 bg-muted rounded-md w-[75%] mt-4" />
              <div className="h-3 bg-muted rounded-md w-[88%]" />
            </div>
          ) : error ? (
            <div className="h-full flex flex-col justify-center">
              <p className="text-sm text-red-600 dark:text-red-400 leading-relaxed">{error}</p>
              <button
                type="button"
                onClick={fetchInsight}
                className="mt-3 text-xs font-semibold text-[#5043F3] dark:text-indigo-400 hover:underline text-left cursor-pointer"
              >
                Try again
              </button>
            </div>
          ) : insight ? (
            <div>
              {insight.summary ? (
                <p className="text-sm text-foreground leading-relaxed">{insight.summary}</p>
              ) : null}
              {insight.tips?.length > 0 ? (
                <ul className="mt-3 space-y-2">
                  {insight.tips.map((tip) => (
                    <li key={tip} className="flex gap-2 text-xs text-muted-foreground leading-relaxed">
                      <span className="text-[#5043F3] dark:text-indigo-400 shrink-0 mt-0.5">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground leading-relaxed">
              Generate insights from your focus and task data.
            </p>
          )}
        </div>

        <div className="flex gap-2 shrink-0 mt-auto">
          <Link
            href="/focus"
            className="inline-flex items-center justify-center gap-2 flex-1 py-3 rounded-xl bg-[#5043F3] hover:bg-[#4337D9] text-white font-semibold text-sm transition-colors shadow-md shadow-indigo-500/20 dark:shadow-indigo-900/40"
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
