'use client';

import { useState } from 'react';
import {
  DECISION_STATUS,
  PARTICIPATABLE_STATUSES,
  READ_ONLY_STATUSES,
} from '@/config/decisions';
import { adminType } from '@/lib/admin-ui';
import { cn } from '@/lib/utils';
import VotingPanel from './VotingPanel';
import DiscussionThread from './DiscussionThread';
import ParticipationCard from './ParticipationCard';
import ResultsPanel from './ResultsPanel';
import DecisionHeaderCard from './DecisionHeaderCard';
import { useDecisionDetailClient } from './useDecisionDetailClient';

export default function DecisionDetailClient({
  decisionId,
  currentUserId,
  isSuperAdmin,
}: {
  decisionId: string;
  currentUserId: string;
  isSuperAdmin: boolean;
}) {
  const [participationRefreshKey, setParticipationRefreshKey] = useState(0);

  const {
    decision,
    loading,
    actionError,
    setActionError,
    fetchDecision,
    handleTransition,
    router,
  } = useDecisionDetailClient(decisionId);

  function handleVoted() {
    setParticipationRefreshKey(k => k + 1);
    void fetchDecision();
  }

  if (loading) {
    return <div className={cn('py-12 text-center', adminType.meta)}>Laden...</div>;
  }

  if (!decision) {
    return (
      <div className="py-12 text-center text-error-500 text-sm">
        Entscheidung nicht gefunden
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {actionError && (
        <div className="rounded-md bg-error-50 dark:bg-error-900/20 p-3 text-sm text-error-700 dark:text-error-400">
          {actionError}
        </div>
      )}

      <DecisionHeaderCard
        decision={decision}
        currentUserId={currentUserId}
        isSuperAdmin={isSuperAdmin}
        onTransition={handleTransition}
        onDeleteSuccess={() => router.push('/admin/decisions')}
        onError={setActionError}
      />

      {(PARTICIPATABLE_STATUSES as readonly string[]).includes(decision.status) && (
        <ParticipationCard decisionId={decisionId} refreshTrigger={participationRefreshKey} />
      )}

      {decision.status === DECISION_STATUS.VOTING && (
        <VotingPanel
          decisionId={decisionId}
          votingMethod={decision.votingMethod}
          options={decision.options}
          dotCount={decision.dotCount}
          hasUserVoted={decision.hasUserVoted}
          onVoted={handleVoted}
          votingDeadline={decision.votingDeadline}
          status={decision.status}
          decisionTitle={decision.title}
          decisionDescription={decision.description}
          decisionBackground={decision.background}
        />
      )}

      {decision.status === DECISION_STATUS.CLOSED && decision.outcome && (
        <ResultsPanel
          outcome={decision.outcome}
          outcomeSummary={decision.outcomeSummary}
          votingMethod={decision.votingMethod}
          aiOutcomeNarrative={decision.aiOutcomeNarrative}
        />
      )}

      {(PARTICIPATABLE_STATUSES as readonly string[]).includes(decision.status) && (
        <DiscussionThread
          decisionId={decisionId}
          readOnly={(READ_ONLY_STATUSES as readonly string[]).includes(decision.status)}
          currentUserId={currentUserId}
        />
      )}
    </div>
  );
}
