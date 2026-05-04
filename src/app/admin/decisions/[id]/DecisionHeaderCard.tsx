'use client';

import { useState } from 'react';
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
  type DecisionStatus,
} from '@/config/decisions';
import { Link2, Check, Mail } from 'lucide-react';
import { UI_FEEDBACK_MS } from '@/config/limits';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { AdminButton } from '@/components/admin/AdminButton';
import { adminSurface, adminType, adminForm } from '@/lib/admin-ui';
import { cn } from '@/lib/utils';
import { formatDateShort } from '@/lib/date-formats';
import BeschlussPdfExport from '@/components/decisions/BeschlussPdfExport';
import type { DecisionDetail } from './types';

interface Props {
  decision: DecisionDetail;
  currentUserId: string;
  isSuperAdmin: boolean;
  onTransition: (
    status: DecisionStatus,
    extra?: { cancelReason?: string; outcomeSummary?: string }
  ) => Promise<void>;
  onDeleteSuccess: () => void;
  onError: (msg: string) => void;
}

export default function DecisionHeaderCard({
  decision,
  currentUserId,
  isSuperAdmin,
  onTransition,
  onDeleteSuccess,
  onError,
}: Props) {
  const [showCloseInput, setShowCloseInput] = useState(false);
  const [closeSummary, setCloseSummary] = useState('');
  const [showCancelInput, setShowCancelInput] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [sendingInvitations, setSendingInvitations] = useState(false);
  const [invitationsResult, setInvitationsResult] = useState<{ sent: number; skipped: number } | null>(null);

  const statusConf = DECISION_STATUS_CONFIG[decision.status];
  const typeConf = DECISION_TYPE_CONFIG[decision.decisionType];
  const methodConf = VOTING_METHOD_CONFIG[decision.votingMethod];
  const validTargets = VALID_TRANSITIONS[decision.status] || [];
  const canDelete = decision.creator.id === currentUserId || isSuperAdmin;

  function handleCopyLink() {
    const url = `${window.location.origin}/vote/${decision.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), UI_FEEDBACK_MS.LINK_COPY);
    });
  }

  async function handleSendInvitations() {
    setSendingInvitations(true);
    setInvitationsResult(null);
    const result = await apiFetch<{ sent: number; skipped: number }>(
      `/api/decisions/${decision.id}/send-invitations`,
      { method: 'POST' }
    );
    setSendingInvitations(false);
    if (result.success && result.data) {
      setInvitationsResult(result.data);
      setTimeout(() => setInvitationsResult(null), 6000);
    } else {
      onError(result.error || 'Fehler beim Senden der Einladungen');
    }
  }

  async function handleDelete() {
    setDeleting(true);
    const result = await apiFetch<void>(`/api/decisions/${decision.id}`, { method: 'DELETE' });
    if (!result.success) {
      onError(result.error || 'Fehler beim Löschen');
      setDeleting(false);
      setShowDeleteDialog(false);
      return;
    }
    onDeleteSuccess();
  }

  return (
    <div className={cn(adminSurface.card, 'p-4 md:p-6')}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Metadata row */}
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusConf.color}`}>
            {statusConf.label}
          </span>
          <span className="rounded-full bg-neutral-100 dark:bg-neutral-700 px-2.5 py-0.5 text-xs text-neutral-600 dark:text-neutral-400">
            {typeConf.label}
          </span>
          <span className="rounded-full bg-neutral-100 dark:bg-neutral-700 px-2.5 py-0.5 text-xs text-neutral-600 dark:text-neutral-400">
            {methodConf.label}
          </span>
          <span className="rounded-full bg-neutral-100 dark:bg-neutral-700 px-2.5 py-0.5 text-xs text-neutral-600 dark:text-neutral-400">
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
          {/* Share link — always visible */}
          <button
            onClick={handleCopyLink}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              linkCopied
                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-600'
            )}
          >
            {linkCopied ? (
              <><Check className="h-3.5 w-3.5" /> Link kopiert</>
            ) : (
              <><Link2 className="h-3.5 w-3.5" /> Link teilen</>
            )}
          </button>
          {/* Resend invitations — only during active voting */}
          {decision.status === DECISION_STATUS.VOTING && (
            <button
              onClick={handleSendInvitations}
              disabled={sendingInvitations}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                invitationsResult
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-600 disabled:opacity-50'
              )}
            >
              <Mail className="h-3.5 w-3.5" />
              {sendingInvitations
                ? 'Sende...'
                : invitationsResult
                  ? `${invitationsResult.sent} gesendet`
                  : 'Einladungen senden'}
            </button>
          )}
          {validTargets.includes(DECISION_STATUS.DISCUSSION) && (
            <AdminButton variant="action" onClick={() => onTransition(DECISION_STATUS.DISCUSSION)}>
              Zur Diskussion
            </AdminButton>
          )}
          {validTargets.includes(DECISION_STATUS.VOTING) && (
            <AdminButton variant="warning" onClick={() => onTransition(DECISION_STATUS.VOTING)}>
              Zur Abstimmung
            </AdminButton>
          )}
          {validTargets.includes(DECISION_STATUS.CLOSED) && !showCloseInput && (
            <AdminButton variant="primary" onClick={() => setShowCloseInput(true)}>
              Abstimmung schliessen
            </AdminButton>
          )}
          {validTargets.includes(DECISION_STATUS.CANCELLED) && !showCancelInput && (
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
        <div className="mt-3 rounded-md border border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/20 p-3">
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
                onTransition(DECISION_STATUS.CLOSED, { outcomeSummary: closeSummary || undefined });
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
        <div className="mt-3 rounded-md border border-error-200 dark:border-error-800 bg-error-50 dark:bg-error-900/20 p-3">
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
                  onTransition(DECISION_STATUS.CANCELLED, { cancelReason });
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
        <details className="mt-3 rounded-lg border border-warning-200 bg-warning-50 dark:border-warning-800 dark:bg-warning-950/30">
          <summary className="cursor-pointer px-4 py-2.5 text-sm font-medium text-warning-800 dark:text-warning-300 select-none">
            📄 Begründung & Hintergrund
          </summary>
          <div className="border-t border-warning-200 dark:border-warning-800 px-4 py-3">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-warning-900 dark:text-warning-200">
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
                <div key={opt.id} className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-700/50 overflow-hidden">
                  {opt.imageUrl ? (
                    <div className="relative aspect-square w-full bg-white dark:bg-neutral-800">
                      <Image
                        src={opt.imageUrl}
                        alt={opt.label}
                        fill
                        className="object-contain p-2"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="flex aspect-square w-full items-center justify-center bg-neutral-100 dark:bg-neutral-700 text-3xl font-bold text-neutral-400">
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
                  className="rounded-md border border-neutral-200 dark:border-neutral-700 px-3 py-2"
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
        <div className="mt-4 rounded-md bg-error-50 dark:bg-error-900/20 p-3 text-sm text-error-700 dark:text-error-400">
          <strong>Abbruchgrund:</strong> {decision.cancelReason}
        </div>
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
