'use client';

/** Queue list slice: empty state, select-all header, and the one-row-per-timecard list. */

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ExternalLink, Eye } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/button';
import { TIMECARD_STATUS_COLORS, type TimecardStatus } from '@/config/timecards';
import { useTimecardIntl } from '@/hooks/useTimecardIntl';
import { adminInteractive } from '@/lib/admin-ui';
import { cn } from '@/lib/utils';
import type { ApprovalRow } from './types';

export function ApprovalsQueue({
  items,
  isLoading,
  bulkEnabled,
  selected,
  allSelected,
  currentUserId,
  allowSelfReview,
  onToggle,
  onToggleAll,
  onReview,
}: {
  items: ApprovalRow[];
  isLoading: boolean;
  bulkEnabled: boolean;
  selected: Set<string>;
  allSelected: boolean;
  currentUserId: string;
  allowSelfReview: boolean;
  onToggle: (id: string) => void;
  onToggleAll: () => void;
  onReview: (id: string) => void;
}) {
  const t = useTranslations('admin.timecards');
  const { statusLabel, duration, period, locale } = useTimecardIntl();
  return (
    <div className="rounded-xl border border bg-surface-base overflow-hidden">
      {items.length === 0 && !isLoading ? (
        <div className="px-6 py-12 text-center text-sm text-text-tertiary">
          {t('queueEmpty', {
            time: new Date().toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }),
          })}
        </div>
      ) : (
        <>
          <div className="px-4 sm:px-6 py-2.5 border-b border flex items-center gap-3 bg-surface-raised">
            {bulkEnabled && (
              <input
                type="checkbox"
                checked={allSelected}
                onChange={onToggleAll}
                aria-label={t('queueSelectAll')}
                className="w-4 h-4 rounded-sm border-default text-action focus:ring-action"
              />
            )}
            <span className="text-xs font-medium uppercase tracking-wider text-text-tertiary">
              {t('queueCount', { count: items.length })}
            </span>
          </div>
          <ul className="divide-y divide-subtle">
            {items.map((row) => {
              const isSelected = selected.has(row.id);
              // Own card is only lockable when the viewer isn't a super-admin.
              const isOwn = row.user_id === currentUserId && !allowSelfReview;
              const status = row.status as TimecardStatus;
              const statusColor = TIMECARD_STATUS_COLORS[status] ?? '';
              const subtitleParts = [row.position, row.department, row.employment_type]
                .filter(Boolean)
                .join(' · ');
              return (
                <li
                  key={row.id}
                  className={cn(
                    'flex items-center gap-3 px-4 sm:px-6 py-3 transition-colors',
                    isSelected && adminInteractive.rowSelected,
                    adminInteractive.rowHoverFaint,
                  )}
                >
                  {bulkEnabled && (
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggle(row.id)}
                      disabled={isOwn}
                      title={isOwn ? t('queueOwnTooltip') : undefined}
                      aria-label={t('queueRowAria', { name: row.user_name || row.user_email })}
                      className="w-4 h-4 rounded-sm border-default text-action focus:ring-action shrink-0 disabled:opacity-40"
                    />
                  )}
                  <Avatar
                    name={row.user_name || row.user_email}
                    size="sm"
                    colorClassName="bg-surface-overlay text-text-secondary"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-text-primary truncate">
                        {row.user_name || row.user_email}
                      </span>
                      {isOwn && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap bg-surface-overlay text-text-tertiary">
                          {t('queueOwnBadge')}
                        </span>
                      )}
                      {row.team_profile_id && (
                        <Link
                          href={`/admin/team/${row.team_profile_id}`}
                          target="_blank"
                          className="text-text-muted hover:text-action"
                          aria-label={t('queueProfileAria')}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </div>
                    {subtitleParts && (
                      <div className="text-xs text-text-tertiary truncate">{subtitleParts}</div>
                    )}
                    {/* Period moves under the name on phones (right column is hidden there). */}
                    <div className="text-xs text-text-tertiary truncate sm:hidden">
                      {period(row.period_type, row.period_start, row.period_end)}
                    </div>
                  </div>
                  <div className="hidden sm:block min-w-0 text-sm text-text-secondary truncate text-right">
                    {period(row.period_type, row.period_start, row.period_end)}
                  </div>
                  <div className="font-semibold text-text-primary text-right whitespace-nowrap text-sm">
                    {duration(Number(row.total_minutes) || 0)}
                  </div>
                  <span
                    className={`hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap ${statusColor}`}
                  >
                    {statusLabel(row.status)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onReview(row.id)}
                    className="shrink-0 inline-flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" /> {t('queueReview')}
                  </Button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
