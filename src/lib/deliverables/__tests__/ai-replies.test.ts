/**
 * @vitest-environment node
 *
 * answerDeliverableQuestion — suggested replies.
 *
 * Behaviors locked:
 *   - the deliverable Q&A prompt asks for suggested replies
 *   - the replies block is split off the answer, never returned as text
 *   - the Swiss «ss statt ß» rule applies to the replies too
 */

const mockGetChatResponse = vi.fn();

vi.mock('@/lib/hirn/providers', () => ({
  getChatResponse: (...args: unknown[]) => mockGetChatResponse(...args),
}));
vi.mock('@/lib/hirn/ingestion', () => ({ ingestDocument: vi.fn() }));
vi.mock('@/lib/hirn/retrieval', () => ({
  searchSimilar: vi.fn().mockResolvedValue([]),
  formatContext: vi.fn(),
}));
vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { answerDeliverableQuestion } from '../ai';
import type { DeliverableDetail } from '@/lib/schemas/deliverables';

const DELIVERABLE = {
  id: 'd-1',
  title: 'Landingpage',
  type: 'website',
  description: 'Eine Seite',
  files: [],
} as unknown as DeliverableDetail;

describe('answerDeliverableQuestion', () => {
  it('asks for replies and returns them split from the answer', async () => {
    mockGetChatResponse.mockResolvedValueOnce({
      content:
        'Die Funktion heißt init.\n```quick_replies\n["Zeig mir den Aufruf", "Was macht sie genau?"]\n```',
    });

    const result = await answerDeliverableQuestion(DELIVERABLE, 'Wie startet die Seite?');

    const { messages } = mockGetChatResponse.mock.calls[0][0] as {
      messages: { role: string; content: string }[];
    };
    expect(messages[0].content).toContain('```quick_replies');
    expect(result.text).toBe('Die Funktion heisst init.');
    expect(result.replies).toEqual(['Zeig mir den Aufruf', 'Was macht sie genau?']);
  });

  it('applies the ss rule to the replies', async () => {
    mockGetChatResponse.mockResolvedValueOnce({
      content: 'Ok.\n```quick_replies\n["Größe ändern"]\n```',
    });

    const result = await answerDeliverableQuestion(DELIVERABLE, 'Frage');

    expect(result.replies).toEqual(['Grösse ändern']);
  });
});
