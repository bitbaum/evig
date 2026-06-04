'use client';

import { useEffect, useState } from 'react';
import { adminSurface, adminType, adminStatus } from '@/lib/admin-ui';
import { AdminSectionHeader } from '@/components/admin/AdminSectionHeader';
import { apiFetch } from '@/lib/api/client';
import { cn } from '@/lib/utils';

interface ParticipationData {
  total: number;
  voted: { id: string; email: string }[];
  notVoted: { id: string; email: string }[];
  quorumTarget: number;
  quorumMet: boolean;
  progressPercent: number;
  quorumPercent?: number;
}

export default function ParticipationCard({ decisionId, refreshTrigger }: { decisionId: string; refreshTrigger?: number }) {
  const [data, setData] = useState<ParticipationData | null>(null);

  useEffect(() => {
    function fetchParticipation() {
      apiFetch<ParticipationData>(`/api/decisions/${decisionId}/votes/participation`).then(result => {
        if (result.success && result.data) setData(result.data);
      });
    }
    fetchParticipation();
    const interval = setInterval(fetchParticipation, 30_000);
    return () => clearInterval(interval);
  }, [decisionId, refreshTrigger]);

  if (!data) return null;

  const quorumPct = data.quorumPercent ?? (data.total > 0 ? Math.round((data.quorumTarget / data.total) * 100) : 0);

  return (
    <div className={cn(adminSurface.card, 'p-4')}>
      <AdminSectionHeader
        title="Beteiligung"
        actions={
          <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', data.quorumMet ? adminStatus.success : adminStatus.warning)}>
            {data.quorumMet ? 'Quorum erreicht' : 'Quorum ausstehend'}
          </span>
        }
      />

      {/* Progress bar */}
      <div className="mt-3">
        <div className="flex items-center justify-between mb-1">
          <span className={adminType.meta}>
            {data.voted.length} / {data.total} abgestimmt ({data.progressPercent}%)
          </span>
          <span className={cn('text-xs font-medium', data.quorumMet ? 'text-action' : 'text-warning-600 dark:text-warning-400')}>
            Quorum: {quorumPct}% erforderlich
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
          <div
            className={cn('h-full rounded-full transition-all', data.quorumMet ? 'bg-primary-500' : 'bg-warning-500')}
            style={{ width: `${data.progressPercent}%` }}
          />
        </div>
      </div>

      {/* Quorum not yet met */}
      {!data.quorumMet && (
        <div className="mt-3 rounded-md bg-warning-50 dark:bg-warning-900/20 px-3 py-2 text-xs text-warning-700 dark:text-warning-300">
          Quorum noch nicht erreicht. {data.quorumTarget - data.voted.length} weitere Stimme(n) benötigt.
        </div>
      )}

      {/* Who hasn't voted */}
      {data.notVoted.length > 0 && (
        <div className="mt-3">
          <p className={cn(adminType.meta, 'mb-1.5')}>Noch nicht abgestimmt:</p>
          <div className="flex flex-wrap gap-1">
            {data.notVoted.map((u) => (
              <span key={u.id} className="rounded-md bg-surface-raised dark:bg-neutral-700 px-2 py-0.5 text-xs text-text-secondary">
                {u.email}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
