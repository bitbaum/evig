'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
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
}: {
  currentUserId: string;
  isSuperAdmin: boolean;
}) {
  const [decisions, setDecisions] = useState<DecisionListItem[]>([]);
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

    const loadDecisions = async () => {
      setLoading(true);
      setErrorMessage(null);

      try {
        const params = new URLSearchParams();
        if (statusFilter) params.set('status', statusFilter);
        if (typeFilter) params.set('decisionType', typeFilter);

        const response = await fetch(`/api/decisions?${params.toString()}`);
        const json = await response.json();

        if (!response.ok || !json?.success) {
          throw new Error(json?.error || 'Entscheidungen konnten nicht geladen werden.');
        }

        if (!cancelled) {
          setDecisions(Array.isArray(json.data) ? json.data : []);
        }
      } catch (error) {
        if (!cancelled) {
          setDecisions([]);
          setErrorMessage(
            error instanceof Error
              ? error.message
              : 'Entscheidungen konnten nicht geladen werden.'
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadDecisions();

    return () => {
      cancelled = true;
    };
  }, [statusFilter, typeFilter, reloadToken]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/decisions/${deleteTarget.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        setDeleteError(json?.error || 'Fehler beim Löschen');
        return;
      }
      setDeleteTarget(null);
      setReloadToken((prev) => prev + 1);
    } catch {
      setDeleteError('Netzwerkfehler');
    } finally {
      setDeleting(false);
    }
  }

  // Compute stats
  const activeVoting = decisions.filter((d) => d.status === 'voting').length;
  const openDiscussion = decisions.filter(
    (d) => d.status === 'discussion'
  ).length;
  const pendingVotes = decisions.filter(
    (d) => d.status === 'voting' && !d.hasUserVoted
  ).length;

  return (
    <div>
      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg bg-white p-4 border">
          <p className="text-2xl font-bold text-amber-600">{activeVoting}</p>
          <p className="text-xs text-gray-500">Aktive Abstimmungen</p>
        </div>
        <div className="rounded-lg bg-white p-4 border">
          <p className="text-2xl font-bold text-blue-600">{openDiscussion}</p>
          <p className="text-xs text-gray-500">Offene Diskussionen</p>
        </div>
        <div className="rounded-lg bg-white p-4 border">
          <p className="text-2xl font-bold text-green-600">
            {decisions.filter((d) => d.status === 'closed').length}
          </p>
          <p className="text-xs text-gray-500">Abgeschlossen</p>
        </div>
        <div className="rounded-lg bg-white p-4 border">
          <p className="text-2xl font-bold text-red-600">{pendingVotes}</p>
          <p className="text-xs text-gray-500">Deine ausstehenden Stimmen</p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
        >
          <option value="">Alle Status</option>
          {DECISION_STATUSES.map((s) => (
            <option key={s} value={s}>
              {DECISION_STATUS_CONFIG[s].label}
            </option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
        >
          <option value="">Alle Typen</option>
          {DECISION_TYPES.map((t) => (
            <option key={t} value={t}>
              {DECISION_TYPE_CONFIG[t].label}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="py-12 text-center text-gray-400">Laden...</div>
      ) : errorMessage ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm font-medium text-red-700">{errorMessage}</p>
          <button
            onClick={() => setReloadToken((prev) => prev + 1)}
            className="mt-3 inline-flex items-center rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
          >
            Erneut versuchen
          </button>
        </div>
      ) : decisions.length === 0 ? (
        <div className="rounded-lg bg-white py-12 text-center shadow-sm">
          <p className="text-gray-500">Keine Entscheidungen gefunden</p>
          <Link
            href="/admin/decisions/new"
            className="mt-2 inline-block text-sm text-blue-600 hover:underline"
          >
            Ersten Vorschlag erstellen
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden overflow-x-auto rounded-lg bg-white border">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Titel</th>
                <th className="px-4 py-3">Typ</th>
                <th className="px-4 py-3">Methode</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Frist</th>
                <th className="px-4 py-3">Beteiligung</th>
                <th className="px-4 py-3">Erstellt von</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {decisions.map((d) => {
                const statusConf = DECISION_STATUS_CONFIG[d.status];
                const deadline =
                  d.status === 'voting'
                    ? d.votingDeadline
                    : d.discussionDeadline;

                return (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/decisions/${d.id}`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {d.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {DECISION_TYPE_CONFIG[d.decisionType]?.label || d.decisionType}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {VOTING_METHOD_CONFIG[d.votingMethod]?.label || d.votingMethod}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusConf?.color || ''}`}
                      >
                        {statusConf?.label || d.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {formatDeadline(deadline)}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {d.voteCount} Stimmen
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {d.creator.email}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {(d.creator.id === currentUserId || isSuperAdmin) && (
                        <button
                          onClick={() => setDeleteTarget(d)}
                          className="text-xs text-red-600 hover:text-red-800 hover:underline"
                        >
                          Löschen
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

      {deleteError && (
        <div className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-700">
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
        onClose={() => {
          setDeleteTarget(null);
          setDeleteError(null);
        }}
      />
    </div>
  );
}
