/**
 * Every configured voting method must render a ballot.
 *
 * `thumbs_up_down` sat in VOTING_METHODS with no branch in either voting
 * surface and no case in useVoteState. The result was silent: the page drew
 * the "Deine Stimme" heading with nothing beneath it, buildVoteData() fell
 * through to undefined, and the server answered "Stimmdaten erforderlich".
 * The only decision in production could not be voted on, and nothing on
 * screen said why.
 *
 * A missing branch is absence, and absence is what a normal test never sees —
 * so this one iterates the config rather than a list someone has to remember
 * to extend. Add a method to VOTING_METHODS without giving it a ballot and
 * this fails.
 */

import { render } from '@testing-library/react';
import { VOTING_METHODS, type VotingMethod } from '@/config/decisions';
import PublicVoteClient from '../../../app/vote/[id]/PublicVoteClient';

// Spread the real module — replacing it wholesale breaks defineRouting, which
// button.tsx pulls in transitively via src/i18n/navigation.
jest.mock('next-intl', () => ({
  ...jest.requireActual('next-intl'),
  useTranslations: () => (key: string) => key,
}));

jest.mock('@/lib/api/client', () => ({
  apiFetch: jest.fn(async () => ({ success: true, data: {} })),
}));

jest.mock('@/components/decisions/VoteAIAdvisor', () => ({
  VoteAIAdvisor: () => null,
}));

const OPTIONS = [
  { id: 'opt-1', label: 'Erste Option' },
  { id: 'opt-2', label: 'Zweite Option' },
];

function renderBallot(votingMethod: VotingMethod) {
  return render(
    <PublicVoteClient
      decisionId="decision-1"
      title="Testentscheidung"
      description="Beschreibung"
      background=""
      votingMethod={votingMethod}
      options={OPTIONS}
      dotCount={5}
      votingDeadline={null}
      isVotingPhase
      allowPublicVoting
      registerUrl="/register"
      loginUrl="/login"
    />,
  );
}

describe('every configured voting method renders a ballot', () => {
  it.each(VOTING_METHODS)('%s draws interactive controls', (method) => {
    const { container } = renderBallot(method);

    // The ballot lives between the email field and the submit button. Any
    // real ballot offers something to interact with; an unhandled method
    // renders an empty box, which is the bug this guards.
    const controls = container.querySelectorAll(
      'button:not([type="submit"]), input:not([type="email"]), textarea, [role="radio"], [role="slider"]',
    );
    expect(controls.length).toBeGreaterThan(0);
  });
});
