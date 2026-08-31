'use client';

// Owns the header action-button row: edit, share link, invitations, status transitions, PDF export, follow-up task, delete.

import { ROUTES } from '@/config/routes';
import { ClipboardPlus, Loader2 } from 'lucide-react';
import { DECISION_STATUS, EDITABLE_STATUSES, type DecisionStatus } from '@/config/decisions';
import { Link2, Check, CheckCircle2, Mail } from 'lucide-react';
import { AdminButton } from '@/components/admin/AdminButton';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import BeschlussPdfExport from '@/components/decisions/BeschlussPdfExport';
import type { DecisionDetail } from '../types';

interface Props {
  decision: DecisionDetail;
  validTargets: DecisionStatus[];
  canDelete: boolean;
  canCreateFollowUpTask: boolean;
  creatingFollowUpTask: boolean;
  linkCopied: boolean;
  sendingInvitations: boolean;
  invitationsResult: { sent: number; skipped: number } | null;
  showCloseInput: boolean;
  showCancelInput: boolean;
  onTransition: (
    status: DecisionStatus,
    extra?: { cancelReason?: string; outcomeSummary?: string },
  ) => Promise<void>;
  handleCopyLink: () => Promise<void>;
  handleSendInvitations: () => Promise<void>;
  handleCreateFollowUpTask: () => Promise<void>;
  setShowCloseInput: (show: boolean) => void;
  setShowCancelInput: (show: boolean) => void;
  setShowDeleteDialog: (show: boolean) => void;
}

export function HeaderActions({
  decision,
  validTargets,
  canDelete,
  canCreateFollowUpTask,
  creatingFollowUpTask,
  linkCopied,
  sendingInvitations,
  invitationsResult,
  showCloseInput,
  showCancelInput,
  onTransition,
  handleCopyLink,
  handleSendInvitations,
  handleCreateFollowUpTask,
  setShowCloseInput,
  setShowCancelInput,
  setShowDeleteDialog,
}: Props) {
  return (
    <div className="flex flex-wrap gap-2 shrink-0">
      {(EDITABLE_STATUSES as readonly string[]).includes(decision.status) && (
        <AdminButton variant="secondary" href={`/admin/decisions/${decision.id}/edit`}>
          Bearbeiten
        </AdminButton>
      )}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopyLink}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
          linkCopied
            ? 'bg-action-muted text-action-muted'
            : 'bg-surface-raised text-text-secondary hover:bg-surface-overlay',
        )}
      >
        {linkCopied ? (
          <>
            <Check className="h-3.5 w-3.5" /> Link kopiert
          </>
        ) : (
          <>
            <Link2 className="h-3.5 w-3.5" /> Link teilen
          </>
        )}
      </Button>
      {decision.status === DECISION_STATUS.VOTING && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSendInvitations}
          disabled={sendingInvitations}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            invitationsResult
              ? 'bg-action-muted text-action-muted'
              : 'bg-surface-raised text-text-secondary hover:bg-surface-overlay disabled:opacity-50',
          )}
        >
          <Mail className="h-3.5 w-3.5" />
          {sendingInvitations
            ? 'Sende...'
            : invitationsResult
              ? `${invitationsResult.sent} gesendet`
              : 'Einladungen senden'}
        </Button>
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
        <>
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
          {decision.linkedTaskId ? (
            <AdminButton variant="secondary" href={`/admin/tasks/${decision.linkedTaskId}`}>
              <CheckCircle2 className="w-4 h-4" />
              Folgeaufgabe öffnen
            </AdminButton>
          ) : canCreateFollowUpTask ? (
            <AdminButton
              variant="secondary"
              onClick={handleCreateFollowUpTask}
              disabled={creatingFollowUpTask}
            >
              {creatingFollowUpTask ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ClipboardPlus className="w-4 h-4" />
              )}
              Aufgabe erstellen
            </AdminButton>
          ) : (
            <AdminButton
              href={`${ROUTES.admin.taskNew}?${new URLSearchParams({
                title: `Folge aus: ${decision.title}`,
                description: [
                  decision.outcomeSummary,
                  decision.outcomeSummary ? '' : null,
                  `(Aus Entscheid: ${decision.title})`,
                ]
                  .filter(Boolean)
                  .join('\n'),
              }).toString()}`}
              variant="secondary"
            >
              <ClipboardPlus className="w-4 h-4" />
              Aufgabe manuell
            </AdminButton>
          )}
        </>
      )}
      {canDelete && (
        <AdminButton variant="dangerOutline" onClick={() => setShowDeleteDialog(true)}>
          Löschen
        </AdminButton>
      )}
    </div>
  );
}
