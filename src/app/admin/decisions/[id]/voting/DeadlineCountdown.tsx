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
      <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
        Abstimmungsfrist abgelaufen
      </div>
    );
  }

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;

  let colorClass = 'text-neutral-600';
  if (hours < 24) {
    colorClass = 'text-red-600 font-medium';
  } else if (hours < 72) {
    colorClass = 'text-amber-600 font-medium';
  }

  const dateStr = formatDateNumeric(deadline);

  return (
    <div className={`rounded-md bg-neutral-50 px-3 py-2 text-sm ${colorClass}`}>
      <span>
        Abstimmung endet in{' '}
        {days > 0 ? `${days} Tagen, ${remainingHours} Stunden` : `${remainingHours} Stunden`}
      </span>
      <span className="ml-2 text-xs text-neutral-500">(Frist: {dateStr})</span>
    </div>
  );
}
