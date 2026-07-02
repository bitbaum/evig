'use client';

import { useState, useEffect } from 'react';
import { formatDateNumeric } from '@/lib/date-formats';

export function DeadlineCountdown({ deadline }: { deadline: string }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const deadlineMs = new Date(deadline).getTime();
  const diffMs = deadlineMs - now;

  if (diffMs <= 0) {
    return (
      <div className="rounded-md bg-error-50 dark:bg-error-900/20 px-3 py-2 text-sm text-error-700 dark:text-error-400">
        Abstimmungsfrist abgelaufen
      </div>
    );
  }

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;

  let colorClass = 'text-text-secondary';
  if (hours < 24) {
    colorClass = 'text-error-600 font-medium';
  } else if (hours < 72) {
    colorClass = 'text-warning-600 font-medium';
  }

  const dateStr = formatDateNumeric(deadline);

  return (
    <div className={`rounded-md bg-surface-raised px-3 py-2 text-sm ${colorClass}`}>
      <span>
        Abstimmung endet in{' '}
        {days > 0 ? `${days} Tagen, ${remainingHours} Stunden` : `${remainingHours} Stunden`}
      </span>
      <span className="ml-2 text-xs text-text-tertiary">(Frist: {dateStr})</span>
    </div>
  );
}
