'use client';

import { useState } from 'react';
import {
  type VotingMethod,
  type ConsentResponse,
  type SimpleMajorityResponse,
  type ThumbsUpDownChoice,
} from '@/config/decisions';

interface Option {
  id: string;
}

interface UseVoteStateProps {
  votingMethod: VotingMethod;
  options: Option[];
  dotCount: number | null;
}

export function useVoteState({ votingMethod, options, dotCount }: UseVoteStateProps) {
  const [consentResponse, setConsentResponse] = useState<ConsentResponse>('agree');
  const [rationale, setRationale] = useState('');
  const [approvedOptions, setApprovedOptions] = useState<Set<string>>(new Set());
  const maxDots = dotCount || 5;
  const [allocations, setAllocationsState] = useState<Record<string, number>>(
    () => Object.fromEntries(options.map((o) => [o.id, 0]))
  );
  const usedDots = Object.values(allocations).reduce((a, b) => a + b, 0);
  const [scores, setScoresState] = useState<Record<string, number>>(
    () => Object.fromEntries(options.map((o) => [o.id, 0]))
  );
  const [majorityResponse, setMajorityResponse] = useState<SimpleMajorityResponse>('yes');
  const [ranking, setRanking] = useState<string[]>(() => options.map((o) => o.id));
  // No default: a thumbs vote is one deliberate tap, so pre-selecting "Dafür"
  // would submit an opinion the voter never expressed.
  const [thumbsChoice, setThumbsChoice] = useState<ThumbsUpDownChoice | null>(null);

  function toggleApproval(optId: string) {
    setApprovedOptions((prev) => {
      const next = new Set(prev);
      if (next.has(optId)) next.delete(optId);
      else next.add(optId);
      return next;
    });
  }

  function setAllocation(optId: string, value: number) {
    setAllocationsState((prev) => ({ ...prev, [optId]: value }));
  }

  function setScore(optId: string, score: number) {
    setScoresState((prev) => ({ ...prev, [optId]: score }));
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

  function buildVoteData(): unknown {
    switch (votingMethod) {
      case 'consent':         return { response: consentResponse, rationale: rationale || undefined };
      case 'approval':        return { approved_options: Array.from(approvedOptions) };
      case 'dot':             return { allocations };
      case 'score':           return { scores };
      case 'simple_majority': return { response: majorityResponse };
      case 'ranked_choice':   return { ranking };
      case 'thumbs_up_down':  return thumbsChoice ? { choice: thumbsChoice } : undefined;
      default: {
        // A method in VOTING_METHODS with no case here used to fall through to
        // `undefined`, which the UI rendered as an empty ballot and the server
        // rejected as "Stimmdaten erforderlich" — a decision nobody could vote
        // on, with nothing on screen explaining why. Now it fails the build.
        const unhandled: never = votingMethod;
        throw new Error(`Unhandled voting method: ${String(unhandled)}`);
      }
    }
  }

  return {
    consentResponse, setConsentResponse,
    rationale, setRationale,
    approvedOptions, toggleApproval,
    maxDots, allocations, usedDots, setAllocation,
    scores, setScore,
    majorityResponse, setMajorityResponse,
    ranking, moveRankingUp, moveRankingDown,
    thumbsChoice, setThumbsChoice,
    buildVoteData,
  };
}
