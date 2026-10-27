/**
 * The staff Hirn chat's `ConversationStore` for chatkit's `ChatApp`.
 *
 * Hirn keeps history per SESSION, not in the REST shape chatkit's
 * `httpConversationStore` expects: `GET /api/admin/hirn/history` lists the
 * sessions, `?sessionId=` reads one, `DELETE ?sessionId=` removes it. The
 * chat route writes each turn itself, so `append` has nothing to do. A new
 * chat is only a fresh session id; the session exists once its first turn has
 * been answered.
 *
 * The server has no title column. A chat is called what its first question
 * said; a name the person gives it is kept on this device (it is a label on
 * their own list, not data anyone else reads).
 */

import {
  deriveTitle,
  type Conversation,
  type ConversationStore,
  type ConversationSummary,
  type StoredMessage,
} from '@bitbaum/chatkit';
import { apiFetch } from '@/lib/api/client';

export const HIRN_HISTORY_URL = '/api/admin/hirn/history';
const TITLES_KEY = 'hirn-chat-titles:v1';

interface SessionRow {
  sessionId: string;
  firstMessage: string;
  lastActivity: string;
}

interface HistoryRow {
  id: string;
  role: string;
  content: string;
  createdAt?: string;
  replies?: string[];
}

function readTitles(): Record<string, string> {
  try {
    const raw = window.localStorage.getItem(TITLES_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function writeTitles(titles: Record<string, string>): void {
  try {
    window.localStorage.setItem(TITLES_KEY, JSON.stringify(titles));
  } catch {
    // Storage blocked or full: the name lasts until the page is left.
  }
}

const sessionUrl = (id: string) => `${HIRN_HISTORY_URL}?sessionId=${encodeURIComponent(id)}`;

export function hirnConversationStore(): ConversationStore {
  return {
    async list(): Promise<ConversationSummary[]> {
      const result = await apiFetch<SessionRow[]>(HIRN_HISTORY_URL);
      if (!result.success || !result.data) throw new Error(result.error);
      const titles = readTitles();
      return result.data.map((s) => ({
        id: s.sessionId,
        title: titles[s.sessionId] ?? deriveTitle(s.firstMessage) ?? s.firstMessage,
        updatedAt: s.lastActivity,
      }));
    },

    async get(id: string): Promise<Conversation | null> {
      const result = await apiFetch<HistoryRow[]>(sessionUrl(id));
      if (!result.success || !result.data) throw new Error(result.error);
      if (result.data.length === 0) return null;
      const messages: StoredMessage[] = result.data.map((m) => ({
        id: m.id,
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content,
        ...(m.replies ? { replies: m.replies } : {}),
      }));
      const first = result.data.find((m) => m.role === 'user')?.content ?? '';
      return {
        id,
        title: readTitles()[id] ?? deriveTitle(first) ?? first,
        updatedAt: result.data[result.data.length - 1].createdAt ?? Date.now(),
        messages,
      };
    },

    async create(init): Promise<ConversationSummary> {
      // The session column is a uuid; the row appears with the first answer.
      return { id: crypto.randomUUID(), title: init?.title ?? '', updatedAt: Date.now() };
    },

    // The chat route stores every turn; there is nothing to write twice.
    async append(): Promise<void> {},

    async rename(id, title): Promise<void> {
      writeTitles({ ...readTitles(), [id]: title });
    },

    async remove(id): Promise<void> {
      const result = await apiFetch<unknown>(sessionUrl(id), { method: 'DELETE' });
      if (!result.success) throw new Error(result.error);
      const { [id]: _gone, ...rest } = readTitles();
      writeTitles(rest);
    },
  };
}
