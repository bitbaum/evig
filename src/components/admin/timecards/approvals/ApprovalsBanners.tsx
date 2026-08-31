'use client';

/** Status banner slice: bulk-result message + error banners (Fragment — siblings inside the page's space-y). */

import { AlertTriangle } from 'lucide-react';

export function ApprovalsBanners({
  message,
  error,
}: {
  message: string | null;
  error: string | null;
}) {
  return (
    <>
      {message && (
        <div className="rounded-lg bg-success-50 dark:bg-success-500/10 border border-success-200 dark:border-success-500/30 px-4 py-2.5 text-sm text-success-700 dark:text-success-300">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-lg bg-error-50 dark:bg-error-500/10 border border-error-200 dark:border-error-500/30 px-4 py-2.5 text-sm text-error-700 dark:text-error-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </>
  );
}
