'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Vote, MessageSquare, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import {
  DECISION_STATUS,
  DECISION_STATUS_CONFIG,
  DECISION_TYPE_CONFIG,
  VOTING_METHOD_CONFIG,
  DECISION_STATUSES,
  DECISION_TYPES,
  type DecisionStatus,
  type DecisionType,
  type VotingMethod,
} from '@/config/decisions';
import { formatDeadline } from '@/lib/utils/date';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Pagination } from '@/components/ui/Pagination';
import { AdminStatsGrid } from '@/components/admin/AdminStatsGrid';
import { AdminButton } from '@/components/admin/AdminButton';
import { adminSurface, adminTable, adminForm, adminType } from '@/lib/admin-ui';
import { apiFetch } from '@/lib/api/client';
import { cn } from '@/lib/utils';
import type { DecisionStats } from '@/lib/services/decisions';

interface DecisionListItem {
  id: string;
  title: string;
  decisionType: DecisionType;
  votingMethod: VotingMethod;
  status: DecisionStatus;
  votingDeadline: string | null;
  discussionDeadline: string | null;
  voteCount: number;
  commentCount: number;
  hasUserVoted: boolean;
  creator: { id: string; email: string };
  createdAt: string;
}

export default function DecisionListClient({
  currentUserId,
  isSuperAdmin,
  stats,
}: {
  currentUserId: string;
  isSuperAdmin: boolean;
  stats: DecisionStats;
}) {
  const DECISIONS_PAGE_SIZE = 20;

  const [decisions, setDecisions] = useState<DecisionListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [reloadToken, setReloadToken] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<DecisionListItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadDecisions() {
      setLoading(true);
      setErrorMessage(null);

      try {
        const urlParams = new URLSearchParams();
        if (statusFilter) urlParams.set('status', statusFilter);
        if (typeFilter) urlParams.set('decisionType', typeFilter);
        urlParams.set('page', String(page));
        urlParams.set('limit', String(DECISIONS_PAGE_SIZE));

        const result = await apiFetch<{ decisions: DecisionListItem[]; total: number }>(
          `/api/decisions?${urlParams.toString()}`,
        );

        if (!result.success || !result.data) {
          throw new Error(result.error || 'Entscheidungen konnten nicht geladen werden.');
        }

        if (!cancelled) {
          setDecisions(Array.isArray(result.data.decisions) ? result.data.decisions : []);
          setTotal(typeof result.data.total === 'number' ? result.data.total : 0);
        }
      } catch (error) {
        if (!cancelled) {
          setDecisions([]);
          setTotal(0);
          setErrorMessage(
            error instanceof Error ? error.message : 'Entscheidungen konnten nicht geladen werden.'
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadDecisions();
    return () => { cancelled = true; };
  }, [statusFilter, typeFilter, page, reloadToken]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    const result = await apiFetch<unknown>(`/api/decisions/${deleteTarget.id}`, { method: 'DELETE' });
    if (!result.success) {
      setDeleteError(result.error || 'Fehler beim Löschen');
      setDeleting(false);
      return;
    }
    setDeleteTarget(null);
    setReloadToken((prev) => prev + 1);
    setDeleting(false);
  }

  return (
    <div className="space-y-4">
      {/* Stats — full DB counts, independent of active filters */}
      <AdminStatsGrid
        columns={4}
        items={[
          { icon: Vote,         color: 'amber',  label: 'Aktive Abstimmungen',      value: stats.voting,       valueColor: 'text-amber-600 dark:text-amber-400' },
          { icon: MessageSquare,color: 'blue',   label: 'Offene Diskussionen',       value: stats.discussion,   valueColor: 'text-blue-600 dark:text-blue-400' },
          { icon: CheckCircle,  color: 'green',  label: 'Abgeschlossen',             value: stats.closed,       valueColor: 'text-primary-600 dark:text-primary-400' },
          { icon: AlertCircle,  color: 'red',    label: 'Ausstehende Stimmen',       value: stats.pendingVotes, valueColor: 'text-red-600 dark:text-red-400' },
        ]}
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className={adminForm.select}
        >
          <option value="">Alle Status</option>
          {DECISION_STATUSES.map((s) => (
            <option key={s} value={s}>{DECISION_STATUS_CONFIG[s].label}</option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          className={adminForm.select}
        >
          <option value="">Alle Typen</option>
          {DECISION_TYPES.map((t) => (
            <option key={t} value={t}>{DECISION_TYPE_CONFIG[t].label}</option>
          ))}
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <div className={cn(adminSurface.card, 'py-12 text-center', adminType.meta)}>
          Laden...
        </div>
      ) : errorMessage ? (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 p-6 text-center">
          <p className="text-sm font-medium text-red-700 dark:text-red-400">{errorMessage}</p>
          <AdminButton
            variant="danger"
            className="mt-3"
            onClick={() => setReloadToken((prev) => prev + 1)}
          >
            Erneut versuchen
          </AdminButton>
        </div>
      ) : decisions.length === 0 ? (
        <div className={cn(adminSurface.card, 'py-12 text-center')}>
          <p className={adminType.meta}>Keine Entscheidungen gefunden</p>
          <AdminButton variant="action" href="/admin/decisions/new" className="mt-3">
            Ersten Vorschlag erstellen
          </AdminButton>
        </div>
      ) : (
        <div className={adminSurface.table}>
          <table className="w-full text-left">
            <thead className={adminTable.thead}>
              <tr>
                <th className={adminTable.th}>Titel</th>
                <th className={cn(adminTable.th, 'hidden md:table-cell')}>Typ</th>
                <th className={cn(adminTable.th, 'hidden lg:table-cell')}>Methode</th>
                <th className={adminTable.th}>Status</th>
                <th className={cn(adminTable.th, 'hidden sm:table-cell')}>Frist</th>
                <th className={cn(adminTable.th, 'hidden sm:table-cell')}>Stimmen</th>
                <th className={cn(adminTable.th, 'hidden lg:table-cell')}>Erstellt von</th>
                <th className={adminTable.th}></th>
              </tr>
            </thead>
            <tbody>
              {decisions.map((d) => {
                const statusConf = DECISION_STATUS_CONFIG[d.status];
                const deadline = d.status === DECISION_STATUS.VOTING
                  ? d.votingDeadline
                  : d.discussionDeadline;

                return (
                  <tr key={d.id} className={adminTable.tr}>
                    <td className={adminTable.td}>
                      <Link
                        href={`/admin/decisions/${d.id}`}
                        className="font-medium text-neutral-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        {d.title}
                      </Link>
                      {d.hasUserVoted && (
                        <span className="ml-2 text-xs text-primary-600 dark:text-primary-400">✓ abgestimmt</span>
                      )}
                    </td>
                    <td className={cn(adminTable.td, 'hidden md:table-cell')}>
                      {DECISION_TYPE_CONFIG[d.decisionType]?.label || d.decisionType}
                    </td>
                    <td className={cn(adminTable.td, 'hidden lg:table-cell')}>
                      {VOTING_METHOD_CONFIG[d.votingMethod]?.label || d.votingMethod}
                    </td>
                    <td className={adminTable.td}>
                      <span className={cn(
                        'inline-block rounded-full px-2 py-0.5 text-xs font-medium',
                        statusConf?.color || ''
                      )}>
                        {statusConf?.label || d.status}
                      </span>
                    </td>
                    <td className={cn(adminTable.td, 'hidden sm:table-cell')}>
                      {formatDeadline(deadline)}
                    </td>
                    <td className={cn(adminTable.td, 'hidden sm:table-cell')}>
                      {d.voteCount}
                    </td>
                    <td className={cn(adminTable.td, 'hidden lg:table-cell')}>
                      {d.creator.email}
                    </td>
                    <td className={adminTable.td}>
                      {(d.creator.id === currentUserId || isSuperAdmin) && (
                        <button
                          onClick={() => setDeleteTarget(d)}
                          className="text-neutral-400 hover:text-red-600 dark:hover:text-red-400 transition-colors p-1 rounded"
                          title="Löschen"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !errorMessage && total > DECISIONS_PAGE_SIZE && (
        <div className={cn(adminSurface.card, 'overflow-hidden')}>
          <Pagination
            currentPage={page}
            totalPages={Math.ceil(total / DECISIONS_PAGE_SIZE)}
            totalItems={total}
            pageSize={DECISIONS_PAGE_SIZE}
            onPageChange={setPage}
          />
        </div>
      )}

      {deleteError && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-400">
          {deleteError}
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title="Entscheidung löschen"
        message="Die Entscheidung und alle verknüpften Daten (Abstimmungen, Kommentare) werden unwiderruflich gelöscht."
        itemName={deleteTarget?.title ?? ''}
        confirmLabel="Löschen"
        cancelLabel="Abbrechen"
        variant="danger"
        isLoading={deleting}
        onConfirm={handleDelete}
        onClose={() => { setDeleteTarget(null); setDeleteError(null); }}
      />
    </div>
  );
}
