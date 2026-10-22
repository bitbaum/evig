/**
 * HirnChatPanel — the public assistant as a chatkit chat.
 *
 * Behaviours locked (the fleet's chat standard, through chatkit):
 *   - signed out: the login prompt, no composer
 *   - signed in, nothing said: the page context's starters; a tap sends it
 *   - an answer's `replies` become one-tap buttons under it, sent as typed
 *   - a failed turn is shown with Retry (no dead ends), which re-asks the
 *     same question without retyping and drops the failure from history
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { HirnChatPanel } from '../HirnChatPanel';
import type { HirnPageContext } from '@/config/hirn/page-contexts';

const context: HirnPageContext = {
  area: 'home',
  description: 'Startseite',
  suggestions: ['Was macht evig?', 'Wie kaufe ich ein Gerät?'],
  quickActions: [{ label: 'Marktplatz', href: '/marketplace' }],
} as HirnPageContext;

function ok(reply: string, replies: string[] = []) {
  return {
    ok: true,
    status: 200,
    json: async () => ({ success: true, data: { reply, replies } }),
  } as Response;
}

function down() {
  return { ok: false, status: 500, json: async () => ({ success: false }) } as Response;
}

function renderPanel(isAuthenticated = true) {
  return render(
    <HirnChatPanel
      isOpen
      onClose={() => {}}
      context={context}
      pathname="/"
      isAuthenticated={isAuthenticated}
    />,
  );
}

describe('HirnChatPanel', () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock;
    // jsdom lays nothing out: chatkit's thread follows the newest turn with
    // scrollIntoView, which jsdom does not implement.
    Element.prototype.scrollIntoView = vi.fn();
  });

  it('shows the login prompt and no composer when signed out', () => {
    renderPanel(false);
    expect(screen.getByText('loginCta')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('sends a starter and shows the answer with its one-tap replies', async () => {
    fetchMock.mockResolvedValueOnce(
      ok('evig hält Geräte länger im Einsatz.', ['Mehr dazu', 'Preise']),
    );
    renderPanel();

    fireEvent.click(screen.getByRole('button', { name: 'Was macht evig?' }));

    expect(await screen.findByText('evig hält Geräte länger im Einsatz.')).toBeInTheDocument();
    const body = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    expect(body).toMatchObject({ message: 'Was macht evig?', pathname: '/', history: [] });

    const replies = screen.getByRole('group', { name: 'replies' });
    expect(replies).toBeInTheDocument();
    fetchMock.mockResolvedValueOnce(ok('Gern.'));
    fireEvent.click(screen.getByRole('button', { name: 'Mehr dazu' }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    const second = JSON.parse(String(fetchMock.mock.calls[1][1]?.body));
    expect(second.message).toBe('Mehr dazu');
    expect(second.history).toEqual([
      { role: 'user', content: 'Was macht evig?' },
      { role: 'assistant', content: 'evig hält Geräte länger im Einsatz.' },
    ]);
  });

  it('shows a failed turn with Retry and re-asks the same question', async () => {
    fetchMock.mockResolvedValueOnce(down());
    renderPanel();

    fireEvent.click(screen.getByRole('button', { name: 'Was macht evig?' }));
    expect(await screen.findByText('error')).toBeInTheDocument();

    fetchMock.mockResolvedValueOnce(ok('Jetzt klappt es.'));
    fireEvent.click(screen.getByRole('button', { name: 'retry' }));

    expect(await screen.findByText('Jetzt klappt es.')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const retried = JSON.parse(String(fetchMock.mock.calls[1][1]?.body));
    expect(retried).toMatchObject({ message: 'Was macht evig?', history: [] });
    // The failure is gone from the thread; Retry now belongs to the answer's
    // own action row (Copy · Listen · Share · Retry), as under every answer.
    expect(screen.queryByText('error')).not.toBeInTheDocument();
  });
});
