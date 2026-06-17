'use client';

import Link from 'next/link';
import { Vote, MessageSquare, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import {
  DECISION_STATUS,
  DECISION_STATUS_CONFIG,
  DECISION_TYPE_CONFIG,
  VOTING_METHOD_CONFIG,
  DECISION_STATUSES,
  DECISION_TYPES,
} from '@/config/decisions';
import { formatDeadline } from '@/lib/utils/date';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Pagination } from '@/components/ui/Pagination';
import { AdminStatsGrid } from '@/components/admin/AdminStatsGrid';
import { AdminButton } from '@/components/admin/AdminButton';
import { AdminListShell } from '@/components/admin/AdminListShell';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { adminSurface, adminTable } from '@/lib/admin-ui';
import { cn } from '@/lib/utils';
import type { DecisionStats } from '@/lib/services/decisions';
import { useDecisionList } from '@/hooks/useDecisionList';
import { ROUTES } from '@/config/routes';

export default function DecisionListClient({
  currentUserId,
  isSuperAdmin,
  stats,
}: {
  currentUserId: string;
  isSuperAdmin: boolean;
  stats: DecisionStats;
}) {
  const {
    decisions,
    total,
    page,
    setPage,
    loading,
    errorMessage,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    deleteTarget,
    setDeleteTarget,
    deleting,
    deleteError,
    handleDelete,
    retry,
    closeDeleteDialog,
    PAGE_SIZE,
  } = useDecisionList()

  return (
    <div className="space-y-4">
      {/* Stats — full DB counts, independent of active filters */}
      <AdminStatsGrid
        columns={4}
        items={[
          { icon: Vote,          color: 'amber', label: 'Aktive Abstimmungen',  value: stats.voting,       valueColor: 'text-warning-600 dark:text-warning-400' },
          { icon: MessageSquare, color: 'blue',  label: 'Offene Diskussionen',  value: stats.discussion,   valueColor: 'text-action' },
          { icon: CheckCircle,   color: 'green', label: 'Abgeschlossen',        value: stats.closed,       valueColor: 'text-action' },
          { icon: AlertCircle,   color: 'red',   label: 'Ausstehende Stimmen',  value: stats.pendingVotes, valueColor: 'text-error-600 dark:text-error-400' },
        ]}
      />

      <AdminListShell
        filters={
          <div className="flex flex-wrap gap-2">
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-auto">
              <option value="">Alle Status</option>
              {DECISION_STATUSES.map((s) => (
                <option key={s} value={s}>{DECISION_STATUS_CONFIG[s].label}</option>
              ))}
            </Select>
            <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-auto">
              <option value="">Alle Typen</option>
              {DECISION_TYPES.map((t) => (
                <option key={t} value={t}>{DECISION_TYPE_CONFIG[t].label}</option>
              ))}
            </Select>
          </div>
        }
        loading={loading}
        error={errorMessage}
        onRetry={retry}
        isEmpty={decisions.length === 0}
        emptyIcon={Vote}
        emptyTitle="Keine Entscheidungen gefunden"
        emptyAction={
          <AdminButton variant="action" href={ROUTES.admin.decisionNew}>
            Ersten Vorschlag erstellen
          </AdminButton>
        }
        resultsLabel={`${total} Entscheidung${total === 1 ? '' : 'en'}`}
      >
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
                const deadline = d.status === DECISION_STATUS.VOTING ? d.votingDeadline : d.discussionDeadline;
                return (
                  <tr key={d.id} className={adminTable.tr}>
                    <td className={adminTable.td}>
                      <Link
                        href={`/admin/decisions/${d.id}`}
                        className="font-medium text-text-primary hover:text-action transition-colors"
                      >
                        {d.title}
                      </Link>
                      {d.hasUserVoted && (
                        <span className="ml-2 text-xs text-action">✓ abgestimmt</span>
                      )}
                    </td>
                    <td className={cn(adminTable.td, 'hidden md:table-cell')}>
                      {DECISION_TYPE_CONFIG[d.decisionType]?.label || d.decisionType}
                    </td>
                    <td className={cn(adminTable.td, 'hidden lg:table-cell')}>
                      {VOTING_METHOD_CONFIG[d.votingMethod]?.label || d.votingMethod}
                    </td>
                    <td className={adminTable.td}>
                      <span className={cn('inline-block rounded-full px-2 py-0.5 text-xs font-medium', statusConf?.color || '')}>
                        {statusConf?.label || d.status}
                      </span>
                    </td>
                    <td className={cn(adminTable.td, 'hidden sm:table-cell')}>{formatDeadline(deadline)}</td>
                    <td className={cn(adminTable.td, 'hidden sm:table-cell')}>{d.voteCount}</td>
                    <td className={cn(adminTable.td, 'hidden lg:table-cell')}>{d.creator.email}</td>
                    <td className={adminTable.td}>
                      {(d.creator.id === currentUserId || isSuperAdmin) && (
                        <Button
                          variant="destructive-ghost"
                          size="icon"
                          onClick={() => setDeleteTarget(d)}
                          className="text-text-muted hover:text-error-600 dark:hover:text-error-400 transition-colors p-1 rounded-sm"
                          title="Löschen"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {total > PAGE_SIZE && (
            <Pagination
              currentPage={page}
              totalPages={Math.ceil(total / PAGE_SIZE)}
              totalItems={total}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
            />
          )}
        </div>
      </AdminListShell>

      {deleteError && (
        <div className="rounded-md bg-error-50 dark:bg-error-900/20 p-3 text-sm text-error-700 dark:text-error-400">
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
        onClose={closeDeleteDialog}
      />
    </div>
  );
}
