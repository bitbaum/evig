'use client';

import { useState } from 'react';
import {
  DECISION_STATUS,
  VALID_TRANSITIONS,
  type DecisionStatus,
} from '@/config/decisions';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { adminSurface, adminType } from '@/lib/admin-ui';
import { cn } from '@/lib/utils';
import { apiFetch } from '@/lib/api/client';
import { getErrorMessage } from '@/lib/utils/error';
import type { DecisionDetail } from './types';
import { useDecisionHeaderCard } from '@/hooks/useDecisionHeaderCard';
import { HeaderMetaRow } from './header/HeaderMetaRow';
import { HeaderActions } from './header/HeaderActions';
import { CloseConfirmPanel } from './header/CloseConfirmPanel';
import { CancelConfirmPanel } from './header/CancelConfirmPanel';
import { OptionsDisplay } from './header/OptionsDisplay';

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
  const [creatingFollowUpTask, setCreatingFollowUpTask] = useState(false);

  const {
    showCloseInput,
    closeSummary,
    showCancelInput,
    cancelReason,
    showDeleteDialog,
    deleting,
    linkCopied,
    sendingInvitations,
    invitationsResult,
    setShowCloseInput,
    setCloseSummary,
    setShowCancelInput,
    setCancelReason,
    setShowDeleteDialog,
    handleCopyLink,
    handleSendInvitations,
    handleDelete,
  } = useDecisionHeaderCard(decision.id, onDeleteSuccess, onError)

  const validTargets = VALID_TRANSITIONS[decision.status] || [];
  const canDelete = decision.creator.id === currentUserId || isSuperAdmin;
  const canCreateFollowUpTask = decision.status === DECISION_STATUS.CLOSED
    && !decision.linkedTaskId
    && decision.outcomePassed !== false
    && Boolean(decision.protocolId);

  async function handleCreateFollowUpTask() {
    setCreatingFollowUpTask(true);
    onError('');
    try {
      const result = await apiFetch<{ taskId: string }>(
        `/api/decisions/${decision.id}/create-task`,
        { method: 'POST' },
      );
      if (!result.success || !result.data?.taskId) {
        throw new Error(result.error || 'Aufgabe konnte nicht erstellt werden');
      }
      window.location.href = `/admin/tasks/${result.data.taskId}`;
    } catch (err) {
      onError(getErrorMessage(err));
      setCreatingFollowUpTask(false);
    }
  }

  return (
    <div className={cn(adminSurface.card, 'p-4 md:p-6')}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <HeaderMetaRow decision={decision} />
        <HeaderActions
          decision={decision}
          validTargets={validTargets}
          canDelete={canDelete}
          canCreateFollowUpTask={canCreateFollowUpTask}
          creatingFollowUpTask={creatingFollowUpTask}
          linkCopied={linkCopied}
          sendingInvitations={sendingInvitations}
          invitationsResult={invitationsResult}
          showCloseInput={showCloseInput}
          showCancelInput={showCancelInput}
          onTransition={onTransition}
          handleCopyLink={handleCopyLink}
          handleSendInvitations={handleSendInvitations}
          handleCreateFollowUpTask={handleCreateFollowUpTask}
          setShowCloseInput={setShowCloseInput}
          setShowCancelInput={setShowCancelInput}
          setShowDeleteDialog={setShowDeleteDialog}
        />
      </div>

      {/* Close confirmation */}
      {showCloseInput && (
        <CloseConfirmPanel
          closeSummary={closeSummary}
          setCloseSummary={setCloseSummary}
          setShowCloseInput={setShowCloseInput}
          onTransition={onTransition}
        />
      )}

      {/* Cancel confirmation */}
      {showCancelInput && (
        <CancelConfirmPanel
          cancelReason={cancelReason}
          setCancelReason={setCancelReason}
          setShowCancelInput={setShowCancelInput}
          onTransition={onTransition}
        />
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
      <OptionsDisplay decision={decision} />

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
