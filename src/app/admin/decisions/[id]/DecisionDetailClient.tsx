'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
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
import { AdminButton } from '@/components/admin/AdminButton';
import { adminSurface, adminType, adminForm } from '@/lib/admin-ui';
import { cn } from '@/lib/utils';
import { formatDateShort } from '@/lib/date-formats';
import VotingPanel from './VotingPanel';
import DiscussionThread from './DiscussionThread';
import ParticipationCard from './ParticipationCard';
import ResultsPanel from './ResultsPanel';
import BeschlussPdfExport from '@/components/decisions/BeschlussPdfExport';

interface DecisionOption {
  id: string;
  label: string;
  description?: string;
  imageUrl?: string;
}

interface DecisionDetail {
  id: string;
  title: string;
  description: string;
  background: string | null;
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
  aiOutcomeNarrative: string | null;
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
    return <div className={cn('py-12 text-center', adminType.meta)}>Laden...</div>;
  }

  if (!decision) {
    return (
      <div className="py-12 text-center text-red-500 text-sm">
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
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-400">
          {actionError}
        </div>
      )}

      {/* Header card — metadata + actions (title is in AdminPageWrapper) */}
      <div className={cn(adminSurface.card, 'p-4 md:p-6')}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Metadata row */}
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusConf.color}`}>
              {statusConf.label}
            </span>
            <span className="rounded-full bg-gray-100 dark:bg-gray-700 px-2.5 py-0.5 text-xs text-gray-600 dark:text-gray-400">
              {typeConf.label}
            </span>
            <span className="rounded-full bg-gray-100 dark:bg-gray-700 px-2.5 py-0.5 text-xs text-gray-600 dark:text-gray-400">
              {methodConf.label}
            </span>
            <span className="rounded-full bg-gray-100 dark:bg-gray-700 px-2.5 py-0.5 text-xs text-gray-600 dark:text-gray-400">
              {DECISION_CATEGORY_LABELS[decision.category] || decision.category}
            </span>
            <span className={adminType.meta}>
              {decision.creator.email} · {formatDateShort(decision.createdAt)}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 flex-shrink-0">
            {(EDITABLE_STATUSES as readonly string[]).includes(decision.status) && (
              <AdminButton variant="secondary" href={`/admin/decisions/${decision.id}/edit`}>
                Bearbeiten
              </AdminButton>
            )}
            {validTargets.includes('discussion') && (
              <AdminButton variant="action" onClick={() => handleTransition('discussion')}>
                Zur Diskussion
              </AdminButton>
            )}
            {validTargets.includes('voting') && (
              <AdminButton variant="warning" onClick={() => handleTransition('voting')}>
                Zur Abstimmung
              </AdminButton>
            )}
            {validTargets.includes('closed') && !showCloseInput && (
              <AdminButton variant="primary" onClick={() => setShowCloseInput(true)}>
                Abstimmung schliessen
              </AdminButton>
            )}
            {validTargets.includes('cancelled') && !showCancelInput && (
              <AdminButton variant="dangerOutline" onClick={() => setShowCancelInput(true)}>
                Abbrechen
              </AdminButton>
            )}
            {decision.status === DECISION_STATUS.CLOSED && (
              <BeschlussPdfExport
                decision={{
                  id: decision.id,
                  title: decision.title,
                  description: decision.description,
                  votingMethod: decision.votingMethod,
                  category: decision.category,
                  outcome: decision.outcome,
                  outcomeSummary: decision.outcomeSummary,
                  aiOutcomeNarrative: decision.aiOutcomeNarrative,
                }}
              />
            )}
            {canDelete && (
              <AdminButton variant="dangerOutline" onClick={() => setShowDeleteDialog(true)}>
                Löschen
              </AdminButton>
            )}
          </div>
        </div>

        {/* Close confirmation */}
        {showCloseInput && (
          <div className="mt-3 rounded-md border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-3">
            <label className={cn('mb-1 block', adminType.subTitle)}>
              Zusammenfassung (optional)
            </label>
            <textarea
              value={closeSummary}
              onChange={(e) => setCloseSummary(e.target.value)}
              rows={2}
              className={cn(adminForm.textarea, 'mb-2')}
              placeholder="Zusammenfassung des Ergebnisses..."
            />
            <div className="flex gap-2">
              <AdminButton
                variant="primary"
                onClick={() => {
                  handleTransition('closed', { outcomeSummary: closeSummary || undefined });
                  setShowCloseInput(false);
                }}
              >
                Bestätigen
              </AdminButton>
              <AdminButton variant="secondary" onClick={() => setShowCloseInput(false)}>
                Zurück
              </AdminButton>
            </div>
          </div>
        )}

        {/* Cancel confirmation */}
        {showCancelInput && (
          <div className="mt-3 rounded-md border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-3">
            <label className={cn('mb-1 block', adminType.subTitle)}>
              Grund für Abbruch
            </label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={2}
              className={cn(adminForm.textarea, 'mb-2')}
              placeholder="Warum wird abgebrochen?"
            />
            <div className="flex gap-2">
              <AdminButton
                variant="danger"
                disabled={!cancelReason.trim()}
                onClick={() => {
                  if (cancelReason.trim()) {
                    handleTransition('cancelled', { cancelReason });
                    setShowCancelInput(false);
                  }
                }}
              >
                Abbrechen bestätigen
              </AdminButton>
              <AdminButton variant="secondary" onClick={() => setShowCancelInput(false)}>
                Zurück
              </AdminButton>
            </div>
          </div>
        )}

        {/* Description */}
        <div className={cn('mt-4 whitespace-pre-wrap leading-relaxed', adminType.body)}>
          {decision.description}
        </div>

        {/* Background / rationale */}
        {decision.background && (
          <details className="mt-3 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
            <summary className="cursor-pointer px-4 py-2.5 text-sm font-medium text-amber-800 dark:text-amber-300 select-none">
              📄 Begründung & Hintergrund
            </summary>
            <div className="border-t border-amber-200 dark:border-amber-800 px-4 py-3">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-amber-900 dark:text-amber-200">
                {decision.background}
              </p>
            </div>
          </details>
        )}

        {/* Options Display */}
        {decision.options.length > 0 && (
          <div className="mt-4">
            <p className={cn(adminType.subTitle, 'mb-2')}>
              Optionen ({decision.options.length})
            </p>
            {decision.options.some((o) => o.imageUrl) ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {decision.options.map((opt) => (
                  <div key={opt.id} className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 overflow-hidden">
                    {opt.imageUrl ? (
                      <div className="relative aspect-square w-full bg-white dark:bg-gray-800">
                        <Image
                          src={opt.imageUrl}
                          alt={opt.label}
                          fill
                          className="object-contain p-2"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className="flex aspect-square w-full items-center justify-center bg-gray-100 dark:bg-gray-700 text-3xl font-bold text-gray-400">
                        {opt.label.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="p-2">
                      <p className={cn('truncate text-xs font-medium', adminType.body)}>{opt.label}</p>
                      {opt.description && (
                        <p className={cn('truncate', adminType.meta)}>{opt.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-1">
                {decision.options.map((opt) => (
                  <div
                    key={opt.id}
                    className="rounded-md border border-gray-200 dark:border-gray-700 px-3 py-2"
                  >
                    <span className={cn('font-medium', adminType.body)}>{opt.label}</span>
                    {opt.description && (
                      <span className={cn('ml-2', adminType.meta)}>– {opt.description}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Cancel Reason */}
        {decision.status === DECISION_STATUS.CANCELLED && decision.cancelReason && (
          <div className="mt-4 rounded-md bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-400">
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
          aiOutcomeNarrative={decision.aiOutcomeNarrative}
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
