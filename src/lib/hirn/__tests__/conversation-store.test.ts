/**
 * hirnConversationStore — chatkit's six-method store over Hirn's per-session
 * history route. The server writes the turns, so `append` writes nothing; a
 * new chat is a uuid; a chat is called what its first question said unless
 * the person renamed it on this device.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { hirnConversationStore, HIRN_HISTORY_URL } from '../conversation-store';

const api = vi.hoisted(() => ({ apiFetch: vi.fn() }));
vi.mock('@/lib/api/client', () => api);

describe('hirnConversationStore', () => {
  const store = hirnConversationStore();

  beforeEach(() => {
    api.apiFetch.mockReset();
    window.localStorage.clear();
  });

  it('lists the sessions, newest as the server sent them, titled by the first question', async () => {
    api.apiFetch.mockResolvedValueOnce({
      success: true,
      data: [{ sessionId: 's1', firstMessage: 'Wie viele Geräte?', lastActivity: '2026-10-27' }],
    });
    expect(await store.list()).toEqual([
      { id: 's1', title: 'Wie viele Geräte?', updatedAt: '2026-10-27' },
    ]);
    expect(api.apiFetch).toHaveBeenCalledWith(HIRN_HISTORY_URL);
  });

  it('opens one session with its replies, and null when it has no turns', async () => {
    api.apiFetch.mockResolvedValueOnce({
      success: true,
      data: [
        { id: 'a', role: 'user', content: 'Hallo', createdAt: '2026-10-27T08:00:00Z' },
        {
          id: 'b',
          role: 'assistant',
          content: 'Grüezi',
          createdAt: '2026-10-27T08:00:02Z',
          replies: ['Mehr'],
        },
      ],
    });
    const chat = await store.get('s1');
    expect(chat?.title).toBe('Hallo');
    expect(chat?.messages).toEqual([
      { id: 'a', role: 'user', content: 'Hallo' },
      { id: 'b', role: 'assistant', content: 'Grüezi', replies: ['Mehr'] },
    ]);

    api.apiFetch.mockResolvedValueOnce({ success: true, data: [] });
    expect(await store.get('s2')).toBeNull();
  });

  it('keeps a name on the device and shows it in the list', async () => {
    await store.rename('s1', 'Lagerbestand');
    api.apiFetch.mockResolvedValueOnce({
      success: true,
      data: [{ sessionId: 's1', firstMessage: 'Wie viele Geräte?', lastActivity: '2026-10-27' }],
    });
    expect((await store.list())[0].title).toBe('Lagerbestand');
  });

  it('creates a uuid, writes nothing on append, and deletes the session on remove', async () => {
    const created = await store.create({ title: 'x' });
    expect(created.id).toMatch(/^[0-9a-f-]{36}$/);

    await store.append('s1', { id: 'm', role: 'user', content: 'hi' });
    expect(api.apiFetch).not.toHaveBeenCalled();

    await store.rename('s1', 'Name');
    api.apiFetch.mockResolvedValueOnce({ success: true });
    await store.remove('s1');
    expect(api.apiFetch).toHaveBeenCalledWith(`${HIRN_HISTORY_URL}?sessionId=s1`, {
      method: 'DELETE',
    });
    expect(window.localStorage.getItem('hirn-chat-titles:v1')).toBe('{}');
  });

  it('throws when the server refuses, so ChatApp can say so', async () => {
    api.apiFetch.mockResolvedValueOnce({ success: false, error: 'nein' });
    await expect(store.list()).rejects.toThrow('nein');
  });
});
