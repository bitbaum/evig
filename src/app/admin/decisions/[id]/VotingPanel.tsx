'use client';

import { useState } from 'react';
import { type VotingMethod, type ConsentResponse, type SimpleMajorityResponse } from '@/config/decisions';
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

  // Per-method state
  const [consentResponse, setConsentResponse] = useState<ConsentResponse>('agree');
  const [rationale, setRationale] = useState('');
  const [approvedOptions, setApprovedOptions] = useState<Set<string>>(new Set());
  const maxDots = dotCount || 5;
  const [allocations, setAllocations] = useState<Record<string, number>>(
    Object.fromEntries(options.map((o) => [o.id, 0]))
  );
  const usedDots = Object.values(allocations).reduce((a, b) => a + b, 0);
  const [scores, setScores] = useState<Record<string, number>>(
    Object.fromEntries(options.map((o) => [o.id, 0]))
  );
  const [majorityResponse, setMajorityResponse] = useState<SimpleMajorityResponse>('yes');
  const [ranking, setRanking] = useState<string[]>(() => options.map((o) => o.id));

  // Gallery mode: use card grid when options have images or list is long
  const hasImages = options.some((o) => o.imageUrl);
  const isGalleryMode = hasImages || (
    options.length > 5 && (votingMethod === 'approval' || votingMethod === 'score' || votingMethod === 'dot')
  );

  function toggleApproval(optId: string) {
    setApprovedOptions((prev) => {
      const next = new Set(prev);
      if (next.has(optId)) next.delete(optId);
      else next.add(optId);
      return next;
    });
  }

  function setAllocation(optId: string, value: number) {
    setAllocations((prev) => ({ ...prev, [optId]: value }));
  }

  function setScore(optId: string, score: number) {
    setScores((prev) => ({ ...prev, [optId]: score }));
  }

  function moveRankingUp(index: number) {
    if (index === 0) return;
    setRanking((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  }

  function moveRankingDown(index: number) {
    if (index === ranking.length - 1) return;
    setRanking((prev) => {
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  }

  async function handleSubmit() {
    setError('');
    setSubmitting(true);

    let voteData: unknown;
    switch (votingMethod) {
      case 'consent':        voteData = { response: consentResponse, rationale: rationale || undefined }; break;
      case 'approval':       voteData = { approved_options: Array.from(approvedOptions) }; break;
      case 'dot':            voteData = { allocations }; break;
      case 'score':          voteData = { scores }; break;
      case 'simple_majority':voteData = { response: majorityResponse }; break;
      case 'ranked_choice':  voteData = { ranking }; break;
    }

    try {
      const res = await fetch(`/api/decisions/${decisionId}/votes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(voteData),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error || 'Fehler beim Abstimmen');
        setSubmitting(false);
        return;
      }
      setSuccess(true);
      onVoted();
    } catch {
      setError('Netzwerkfehler');
    }
    setSubmitting(false);
  }

  if (success || hasUserVoted) {
    return (
      <div className="space-y-3">
        {votingDeadline && status === 'voting' && (
          <DeadlineCountdown deadline={votingDeadline} />
        )}
        <div className="rounded-lg bg-green-50 p-6 text-center shadow-sm">
          <p className="font-medium text-green-700">Deine Stimme wurde abgegeben</p>
          <p className="mt-1 text-sm text-green-600">
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
      {votingDeadline && status === 'voting' && (
        <div className="mb-4">
          <DeadlineCountdown deadline={votingDeadline} />
        </div>
      )}

      <Heading level={2} className="mb-4 text-lg font-semibold text-gray-900">
        Deine Stimme
      </Heading>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {votingMethod === 'consent' && (
        <ConsentVote
          response={consentResponse}
          rationale={rationale}
          onResponseChange={setConsentResponse}
          onRationaleChange={setRationale}
        />
      )}
      {votingMethod === 'approval' && (
        <ApprovalVote
          options={options}
          approvedOptions={approvedOptions}
          isGalleryMode={isGalleryMode}
          onToggle={toggleApproval}
        />
      )}
      {votingMethod === 'dot' && (
        <DotVote
          options={options}
          allocations={allocations}
          maxDots={maxDots}
          usedDots={usedDots}
          isGalleryMode={isGalleryMode}
          onSet={setAllocation}
        />
      )}
      {votingMethod === 'score' && (
        <ScoreVote
          options={options}
          scores={scores}
          isGalleryMode={isGalleryMode}
          onSet={setScore}
        />
      )}
      {votingMethod === 'ranked_choice' && (
        <RankedChoiceVote
          options={options}
          ranking={ranking}
          onMoveUp={moveRankingUp}
          onMoveDown={moveRankingDown}
        />
      )}
      {votingMethod === 'simple_majority' && (
        <SimpleMajorityVote response={majorityResponse} onChange={setMajorityResponse} />
      )}

      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {submitting ? 'Wird gesendet...' : 'Stimme abgeben'}
      </button>
      </div>
    </div>
  );
}
