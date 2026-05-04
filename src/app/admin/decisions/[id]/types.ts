import type {
  DecisionStatus,
  DecisionType,
  DecisionCategory,
  VotingMethod,
} from '@/config/decisions';

export interface DecisionOption {
  id: string;
  label: string;
  description?: string;
  imageUrl?: string;
}

export interface DecisionDetail {
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
  allowPublicVoting: boolean;
}
