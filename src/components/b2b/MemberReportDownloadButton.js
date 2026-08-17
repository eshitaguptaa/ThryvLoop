'use client';

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';

/**
 * Downloads the member personal PDF report to the user's machine.
 */
export default function MemberReportDownloadButton({
  orgSlug,
  memberUserId,
  className = '',
  label = 'Download report',
  size = 'md',
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const pad = size === 'sm' ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-xs sm:text-sm';

  const onClick = async () => {
    if (!orgSlug || !memberUserId || loading) return;
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        orgSlug,
        memberUserId,
      });
      const res = await fetch(`/api/b2b/member-report?${params.toString()}`, {
        method: 'GET',
        credentials: 'same-origin',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Could not download report');
      }
      const blob = await res.blob();
      const cd = res.headers.get('Content-Disposition') || '';
      const match = cd.match(/filename="([^"]+)"/i);
      const filename = match?.[1] || `thryvloop-member-report.pdf`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || `thryvloop-report-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Download failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={() => void onClick()}
        disabled={loading}
        className={`inline-flex items-center gap-1.5 rounded-lg border border-border bg-card font-semibold text-foreground shadow-sm transition-colors hover:border-[#5D3FD3]/35 hover:bg-muted/50 disabled:opacity-60 ${pad} ${className}`}
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
        ) : (
          <Download className="h-3.5 w-3.5" aria-hidden />
        )}
        {loading ? 'Preparing…' : label}
      </button>
      {error ? (
        <p className="max-w-[14rem] text-right text-[11px] font-medium text-rose-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
