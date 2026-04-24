'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import VotingPanel from '@/app/admin/decisions/[id]/VotingPanel';
import type { VotingMethod } from '@/config/decisions';

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
  votingDeadline: string | null;
  decisionTitle?: string;
  decisionDescription?: string;
  decisionBackground?: string | null;
}

export default function DashboardVotingClient({
  decisionId,
  votingMethod,
  options,
  dotCount,
  hasUserVoted,
  votingDeadline,
  decisionTitle,
  decisionDescription,
  decisionBackground,
}: Props) {
  const router = useRouter();
  const [voted, setVoted] = useState(hasUserVoted);

  function handleVoted() {
    setVoted(true);
    // Revalidate so the list page reflects "Abgestimmt"
    router.refresh();
  }

  return (
    <VotingPanel
      decisionId={decisionId}
      votingMethod={votingMethod}
      options={options}
      dotCount={dotCount}
      hasUserVoted={voted}
      onVoted={handleVoted}
      votingDeadline={votingDeadline}
      status="voting"
      decisionTitle={decisionTitle}
      decisionDescription={decisionDescription}
      decisionBackground={decisionBackground}
    />
  );
}
