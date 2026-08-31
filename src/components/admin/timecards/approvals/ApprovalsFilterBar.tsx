'use client';

/** Filter strip slice: status tab (open / approved), period_type toggle, refresh. */

import { useTranslations } from 'next-intl';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TIMECARD_STATUSES } from '@/config/timecards';
import type { PeriodFilter, StatusFilter } from './types';

export function ApprovalsFilterBar({
  statusFilter,
  periodFilter,
  isLoading,
  onStatusFilterChange,
  onPeriodFilterChange,
  onRefresh,
}: {
  statusFilter: StatusFilter;
  periodFilter: PeriodFilter;
  isLoading: boolean;
  onStatusFilterChange: (status: StatusFilter) => void;
  onPeriodFilterChange: (period: PeriodFilter) => void;
  onRefresh: () => void;
}) {
  const t = useTranslations('admin.timecards');
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex items-center gap-2">
        <span className="text-sm text-text-secondary">{t('queueStatusLabel')}</span>
        {([TIMECARD_STATUSES.SUBMITTED, TIMECARD_STATUSES.APPROVED] as StatusFilter[]).map(
          (opt) => (
            <Button
              key={opt}
              variant={statusFilter === opt ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => onStatusFilterChange(opt)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium h-auto ${
                statusFilter === opt
                  ? ''
                  : 'bg-surface-raised text-text-secondary hover:bg-surface-overlay'
              }`}
            >
              {opt === TIMECARD_STATUSES.SUBMITTED ? t('queueTabOpen') : t('queueTabApproved')}
            </Button>
          ),
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-text-secondary">{t('queuePeriodLabel')}</span>
        {(['all', 'week', 'month'] as PeriodFilter[]).map((opt) => (
          <Button
            key={opt}
            variant={periodFilter === opt ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => onPeriodFilterChange(opt)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium h-auto ${
              periodFilter === opt
                ? ''
                : 'bg-surface-raised text-text-secondary hover:bg-surface-overlay'
            }`}
          >
            {opt === 'all'
              ? t('queueFilterAll')
              : opt === 'week'
                ? t('queueFilterWeeks')
                : t('queueFilterMonths')}
          </Button>
        ))}
      </div>
      <div className="sm:ml-auto flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isLoading}
          className="inline-flex items-center gap-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          {t('queueRefresh')}
        </Button>
      </div>
    </div>
  );
}
