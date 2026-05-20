'use client';

import { useState } from 'react';
import { DECISION_STATUS, type VotingMethod } from '@/config/decisions';
import { apiFetch } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { useVoteState } from '@/hooks/useVoteState';
import Heading from '@/components/admin/AdminHeading';
import { DeadlineCountdown } from './voting/DeadlineCountdown';
import { ConsentVote } from './voting/ConsentVote';
import { ApprovalVote } from './voting/ApprovalVote';
import { DotVote } from './voting/DotVote';
import { ScoreVote } from './voting/ScoreVote';
import { RankedChoiceVote } from './voting/RankedChoiceVote';
import { SimpleMajorityVote } from './voting/SimpleMajorityVote';
import { VoteAIAdvisor } from '@/components/decisions/VoteAIAdvisor';

interface Option {
  id: string;
  label: string;
  description?: string;
  imageUrl?: string;
}

interface Props {
  decisionId: string;
  votingMethod: VotingMethod;
  options: Option[];
  dotCount: number | null;
  hasUserVoted: boolean;
  onVoted: () => void;
  votingDeadline?: string | null;
  status?: string;
  // Decision context for AI advisor
  decisionTitle?: string;
  decisionDescription?: string;
  decisionBackground?: string | null;
}

export default function VotingPanel({
  decisionId,
  votingMethod,
  options,
  dotCount,
  hasUserVoted,
  onVoted,
  votingDeadline,
  status,
  decisionTitle,
  decisionDescription,
  decisionBackground,
}: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const vote = useVoteState({ votingMethod, options, dotCount });

  // Gallery mode: use card grid when options have images or list is long
  const hasImages = options.some((o) => o.imageUrl);
  const isGalleryMode = hasImages || (
    options.length > 5 && (votingMethod === 'approval' || votingMethod === 'score' || votingMethod === 'dot')
  );

  async function handleSubmit() {
    setError('');
    setSubmitting(true);

    const voteData = vote.buildVoteData();

    const result = await apiFetch<unknown>(`/api/decisions/${decisionId}/votes`, {
      method: 'POST',
      body: voteData,
    });
    if (!result.success) {
      setError(result.error || 'Fehler beim Abstimmen');
      setSubmitting(false);
      return;
    }
    setSuccess(true);
    onVoted();
    setSubmitting(false);
  }

  if (success || hasUserVoted) {
    return (
      <div className="space-y-3">
        {votingDeadline && status === DECISION_STATUS.VOTING && (
          <DeadlineCountdown deadline={votingDeadline} />
        )}
        <div className="rounded-lg bg-primary-50 dark:bg-primary-900/20 p-6 text-center shadow-sm">
          <p className="font-medium text-primary-700 dark:text-primary-300">Deine Stimme wurde abgegeben</p>
          <p className="mt-1 text-sm text-primary-600 dark:text-primary-400">
            Du kannst deine Stimme ändern, solange die Abstimmung läuft.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* AI Advisor — appears above the ballot so voters can consult before voting */}
      {decisionTitle && decisionDescription && (
        <VoteAIAdvisor
          title={decisionTitle}
          description={decisionDescription}
          background={decisionBackground}
          votingMethod={votingMethod}
          options={options.map(o => ({ label: o.label, description: o.description }))}
        />
      )}

      <div className="rounded-lg bg-white p-6 shadow-sm">
      {votingDeadline && status === DECISION_STATUS.VOTING && (
        <div className="mb-4">
          <DeadlineCountdown deadline={votingDeadline} />
        </div>
      )}

      <Heading level={2} className="mb-4 text-lg font-semibold text-neutral-900">
        Deine Stimme
      </Heading>

      {error && (
        <div className="mb-4 rounded-md bg-error-50 dark:bg-error-900/20 p-3 text-sm text-error-700 dark:text-error-300">{error}</div>
      )}

      {votingMethod === 'consent' && (
        <ConsentVote
          response={vote.consentResponse}
          rationale={vote.rationale}
          onResponseChange={vote.setConsentResponse}
          onRationaleChange={vote.setRationale}
        />
      )}
      {votingMethod === 'approval' && (
        <ApprovalVote
          options={options}
          approvedOptions={vote.approvedOptions}
          isGalleryMode={isGalleryMode}
          onToggle={vote.toggleApproval}
        />
      )}
      {votingMethod === 'dot' && (
        <DotVote
          options={options}
          allocations={vote.allocations}
          maxDots={vote.maxDots}
          usedDots={vote.usedDots}
          isGalleryMode={isGalleryMode}
          onSet={vote.setAllocation}
        />
      )}
      {votingMethod === 'score' && (
        <ScoreVote
          options={options}
          scores={vote.scores}
          isGalleryMode={isGalleryMode}
          onSet={vote.setScore}
        />
      )}
      {votingMethod === 'ranked_choice' && (
        <RankedChoiceVote
          options={options}
          ranking={vote.ranking}
          onMoveUp={vote.moveRankingUp}
          onMoveDown={vote.moveRankingDown}
        />
      )}
      {votingMethod === 'simple_majority' && (
        <SimpleMajorityVote response={vote.majorityResponse} onChange={vote.setMajorityResponse} />
      )}

      <Button
        onClick={handleSubmit}
        disabled={submitting}
        variant="primary"
        className="mt-6 w-full"
      >
        {submitting ? 'Wird gesendet...' : 'Stimme abgeben'}
      </Button>
      </div>
    </div>
  );
}
