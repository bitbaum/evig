'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api/client';
import {
  DECISION_STATUS,
  DECISION_STATUS_CONFIG,
  DECISION_TYPE_CONFIG,
  VOTING_METHOD_CONFIG,
  DECISION_CATEGORY_LABELS,
  VALID_TRANSITIONS,
  EDITABLE_STATUSES,
  PARTICIPATABLE_STATUSES,
  READ_ONLY_STATUSES,
  type DecisionStatus,
  type DecisionType,
  type DecisionCategory,
  type VotingMethod,
} from '@/config/decisions';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import VotingPanel from './VotingPanel';
import DiscussionThread from './DiscussionThread';
import ParticipationCard from './ParticipationCard';
import ResultsPanel from './ResultsPanel';

interface DecisionOption {
  id: string;
  label: string;
  description?: string;
}

interface DecisionDetail {
  id: string;
  title: string;
  description: string;
  category: DecisionCategory;
  decisionType: DecisionType;
  votingMethod: VotingMethod;
  status: DecisionStatus;
  options: DecisionOption[];
  quorum: { type: string; value: number };
  blindVoting: boolean;
  dotCount: number | null;
  votingDeadline: string | null;
  discussionDeadline: string | null;
  outcome: Record<string, unknown> | null;
  outcomeSummary: string | null;
  cancelReason: string | null;
  voteCount: number;
  commentCount: number;
  hasUserVoted: boolean;
  creator: { id: string; email: string };
  createdAt: string;
}

export default function DecisionDetailClient({
  decisionId,
  currentUserId,
  isSuperAdmin,
}: {
  decisionId: string;
  currentUserId: string;
  isSuperAdmin: boolean;
}) {
  const [decision, setDecision] = useState<DecisionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState('');
  const [showCloseInput, setShowCloseInput] = useState(false);
  const [closeSummary, setCloseSummary] = useState('');
  const [showCancelInput, setShowCancelInput] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  const fetchDecision = useCallback(async () => {
    const result = await apiFetch<DecisionDetail>(`/api/decisions/${decisionId}`);
    if (result.success && result.data) setDecision(result.data);
    setLoading(false);
  }, [decisionId]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const result = await apiFetch<DecisionDetail>(`/api/decisions/${decisionId}`);
      if (cancelled) return;
      if (result.success && result.data) setDecision(result.data);
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [decisionId]);

  async function handleTransition(
    newStatus: DecisionStatus,
    extra?: { cancelReason?: string; outcomeSummary?: string }
  ) {
    setActionError('');
    const result = await apiFetch<void>(`/api/decisions/${decisionId}/transition`, {
      method: 'POST',
      body: { status: newStatus, ...extra },
    });
    if (!result.success) {
      setActionError(result.error || 'Fehler');
      return;
    }
    fetchDecision();
  }

  async function handleDelete() {
    setDeleting(true);
    setActionError('');
    const result = await apiFetch<void>(`/api/decisions/${decisionId}`, {
      method: 'DELETE',
    });
    if (!result.success) {
      setActionError(result.error || 'Fehler beim Löschen');
      setDeleting(false);
      setShowDeleteDialog(false);
      return;
    }
    router.push('/admin/decisions');
  }

  const canDelete = decision
    ? decision.creator.id === currentUserId || isSuperAdmin
    : false;

  if (loading) {
    return <div className="py-12 text-center text-gray-500">Laden...</div>;
  }

  if (!decision) {
    return (
      <div className="py-12 text-center text-red-500">
        Entscheidung nicht gefunden
      </div>
    );
  }

  const statusConf = DECISION_STATUS_CONFIG[decision.status];
  const typeConf = DECISION_TYPE_CONFIG[decision.decisionType];
  const methodConf = VOTING_METHOD_CONFIG[decision.votingMethod];
  const validTargets = VALID_TRANSITIONS[decision.status] || [];

  return (
    <div className="space-y-6">
      {actionError && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {actionError}
        </div>
      )}

      {/* Header */}
      <div className="rounded-lg bg-white p-4 md:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusConf.color}`}
              >
                {statusConf.label}
              </span>
              <span className="text-xs text-gray-500">{typeConf.label}</span>
              <span className="text-xs text-gray-400">&middot;</span>
              <span className="text-xs text-gray-500">{methodConf.label}</span>
              <span className="text-xs text-gray-400">&middot;</span>
              <span className="text-xs text-gray-500">{DECISION_CATEGORY_LABELS[decision.category] || decision.category}</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">
              {decision.title}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Erstellt von {decision.creator.email} am{' '}
              {new Date(decision.createdAt).toLocaleDateString('de-CH')}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            {(EDITABLE_STATUSES as readonly string[]).includes(decision.status) && (
              <Link
                href={`/admin/decisions/${decision.id}/edit`}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                Bearbeiten
              </Link>
            )}
            {validTargets.includes('discussion') && (
              <button
                onClick={() => handleTransition('discussion')}
                className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
              >
                Zur Diskussion
              </button>
            )}
            {validTargets.includes('voting') && (
              <button
                onClick={() => handleTransition('voting')}
                className="rounded-md bg-amber-600 px-3 py-1.5 text-sm text-white hover:bg-amber-700"
              >
                Zur Abstimmung
              </button>
            )}
            {validTargets.includes('closed') && !showCloseInput && (
              <button
                onClick={() => setShowCloseInput(true)}
                className="rounded-md bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700"
              >
                Abstimmung schliessen
              </button>
            )}
            {validTargets.includes('cancelled') && !showCancelInput && (
              <button
                onClick={() => setShowCancelInput(true)}
                className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
              >
                Abbrechen
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => setShowDeleteDialog(true)}
                className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
              >
                Löschen
              </button>
            )}
          </div>
        </div>

        {/* Close confirmation */}
        {showCloseInput && (
          <div className="mt-3 rounded-md border border-green-200 bg-green-50 p-3">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Zusammenfassung (optional)
            </label>
            <textarea
              value={closeSummary}
              onChange={(e) => setCloseSummary(e.target.value)}
              rows={2}
              className="mb-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              placeholder="Zusammenfassung des Ergebnisses..."
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  handleTransition('closed', {
                    outcomeSummary: closeSummary || undefined,
                  });
                  setShowCloseInput(false);
                }}
                className="rounded-md bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700"
              >
                Bestätigen
              </button>
              <button
                onClick={() => setShowCloseInput(false)}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
              >
                Zurück
              </button>
            </div>
          </div>
        )}

        {/* Cancel confirmation */}
        {showCancelInput && (
          <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Grund für Abbruch
            </label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={2}
              className="mb-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              placeholder="Warum wird abgebrochen?"
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (cancelReason.trim()) {
                    handleTransition('cancelled', { cancelReason });
                    setShowCancelInput(false);
                  }
                }}
                disabled={!cancelReason.trim()}
                className="rounded-md bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700 disabled:opacity-50"
              >
                Abbrechen bestätigen
              </button>
              <button
                onClick={() => setShowCancelInput(false)}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
              >
                Zurück
              </button>
            </div>
          </div>
        )}

        {/* Description */}
        <div className="mt-4 whitespace-pre-wrap text-sm text-gray-700">
          {decision.description}
        </div>

        {/* Options Display */}
        {decision.options.length > 0 && (
          <div className="mt-4">
            <h3 className="mb-2 text-sm font-medium text-gray-700">
              Optionen
            </h3>
            <div className="space-y-1">
              {decision.options.map((opt) => (
                <div
                  key={opt.id}
                  className="rounded-md border border-gray-200 px-3 py-2"
                >
                  <span className="font-medium text-gray-800">
                    {opt.label}
                  </span>
                  {opt.description && (
                    <span className="ml-2 text-sm text-gray-500">
                      – {opt.description}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cancel Reason */}
        {decision.status === DECISION_STATUS.CANCELLED && decision.cancelReason && (
          <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
            <strong>Abbruchgrund:</strong> {decision.cancelReason}
          </div>
        )}
      </div>

      {/* Participation Card */}
      {(PARTICIPATABLE_STATUSES as readonly string[]).includes(decision.status) && (
        <ParticipationCard decisionId={decisionId} />
      )}

      {/* Voting Panel */}
      {decision.status === DECISION_STATUS.VOTING && (
        <VotingPanel
          decisionId={decisionId}
          votingMethod={decision.votingMethod}
          options={decision.options}
          dotCount={decision.dotCount}
          hasUserVoted={decision.hasUserVoted}
          onVoted={fetchDecision}
          votingDeadline={decision.votingDeadline}
          status={decision.status}
        />
      )}

      {/* Results Panel */}
      {decision.status === DECISION_STATUS.CLOSED && decision.outcome && (
        <ResultsPanel
          outcome={decision.outcome}
          outcomeSummary={decision.outcomeSummary}
          votingMethod={decision.votingMethod}
        />
      )}

      {/* Discussion Thread */}
      {(PARTICIPATABLE_STATUSES as readonly string[]).includes(decision.status) && (
        <DiscussionThread
          decisionId={decisionId}
          readOnly={(READ_ONLY_STATUSES as readonly string[]).includes(decision.status)}
          currentUserId={currentUserId}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        title="Entscheidung löschen"
        message="Die Entscheidung und alle verknüpften Daten (Abstimmungen, Kommentare) werden unwiderruflich gelöscht."
        itemName={decision.title}
        confirmLabel="Löschen"
        cancelLabel="Abbrechen"
        variant="danger"
        isLoading={deleting}
        onConfirm={handleDelete}
        onClose={() => setShowDeleteDialog(false)}
      />
    </div>
  );
}
