/**
 * SuggestedReplies — the reply row under Hirn's latest answer.
 *
 * Behaviors locked:
 *   - one button per reply, in a group labelled with the translated label
 *   - a tap hands exactly the reply text to the caller's send function
 *   - nothing renders when there are no replies (or none were returned)
 *   - disabled while a turn runs
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { SuggestedReplies } from '../SuggestedReplies';

describe('SuggestedReplies', () => {
  it('renders one button per reply inside a labelled group', () => {
    render(<SuggestedReplies replies={['Ja, bitte', 'Später']} onPick={() => {}} />);
    const group = screen.getByRole('group', { name: 'suggestedReplies' });
    expect(group).toBeInTheDocument();
    expect(screen.getAllByRole('button').map((b) => b.textContent)).toEqual([
      'Ja, bitte',
      'Später',
    ]);
  });

  it('sends exactly the tapped reply', () => {
    const onPick = vi.fn();
    render(<SuggestedReplies replies={['Ja, bitte', 'Später']} onPick={onPick} />);
    fireEvent.click(screen.getByRole('button', { name: 'Später' }));
    expect(onPick).toHaveBeenCalledTimes(1);
    expect(onPick).toHaveBeenCalledWith('Später');
  });

  it('renders nothing without replies', () => {
    const { container: empty } = render(<SuggestedReplies replies={[]} onPick={() => {}} />);
    expect(empty).toBeEmptyDOMElement();
    const { container: missing } = render(
      <SuggestedReplies replies={undefined} onPick={() => {}} />,
    );
    expect(missing).toBeEmptyDOMElement();
  });

  it('disables the buttons when asked', () => {
    render(<SuggestedReplies replies={['Ja']} onPick={() => {}} disabled />);
    expect(screen.getByRole('button', { name: 'Ja' })).toBeDisabled();
  });
});
