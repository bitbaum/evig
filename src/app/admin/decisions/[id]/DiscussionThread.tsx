'use client';

import { useEffect, useState } from 'react';
import {
  COMMENT_POSITIONS,
  COMMENT_POSITION_CONFIG,
  type CommentPosition,
} from '@/config/decisions';

interface Comment {
  id: string;
  content: string;
  position: CommentPosition;
  option_id: string | null;
  parent_comment_id: string | null;
  is_edited: boolean;
  user: { id: string; email: string };
  created_at: string;
}

export default function DiscussionThread({
  decisionId,
  readOnly,
}: {
  decisionId: string;
  readOnly: boolean;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  // New comment state
  const [content, setContent] = useState('');
  const [position, setPosition] = useState<CommentPosition>('info');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  function fetchComments() {
    fetch(`/api/decisions/${decisionId}/comments`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setComments(json.data);
        setLoading(false);
      });
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchComments(); }, [decisionId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setError('');
    setSubmitting(true);

    try {
      const res = await fetch(`/api/decisions/${decisionId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, position }),
      });
      const json = await res.json();

      if (!json.success) {
        setError(json.error || 'Fehler');
        setSubmitting(false);
        return;
      }

      setContent('');
      fetchComments();
    } catch {
      setError('Netzwerkfehler');
    }
    setSubmitting(false);
  }

  // Group by position
  const grouped = COMMENT_POSITIONS.reduce(
    (acc, pos) => {
      acc[pos] = comments.filter((c) => c.position === pos);
      return acc;
    },
    {} as Record<CommentPosition, Comment[]>
  );

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">Diskussion</h2>

      {loading ? (
        <p className="text-sm text-gray-400">Laden...</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-gray-500">Noch keine Kommentare</p>
      ) : (
        <div className="space-y-4">
          {COMMENT_POSITIONS.map((pos) => {
            const posComments = grouped[pos];
            if (posComments.length === 0) return null;
            const conf = COMMENT_POSITION_CONFIG[pos];

            return (
              <div key={pos}>
                <h3
                  className={`mb-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${conf.color}`}
                >
                  {conf.label} ({posComments.length})
                </h3>
                <div className="space-y-2">
                  {posComments.map((c) => (
                    <div
                      key={c.id}
                      className="rounded-md border border-gray-100 bg-gray-50 p-3"
                    >
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{c.user.email}</span>
                        <span>&middot;</span>
                        <span>
                          {new Date(c.created_at).toLocaleString('de-CH')}
                        </span>
                        {c.is_edited && (
                          <span className="italic">(bearbeitet)</span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-gray-700">{c.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Comment Form */}
      {!readOnly && (
        <form onSubmit={handleSubmit} className="mt-4 border-t pt-4">
          {error && (
            <div className="mb-2 text-sm text-red-600">{error}</div>
          )}
          <div className="mb-2 flex gap-2">
            {COMMENT_POSITIONS.map((pos) => {
              const conf = COMMENT_POSITION_CONFIG[pos];
              return (
                <button
                  key={pos}
                  type="button"
                  onClick={() => setPosition(pos)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    position === pos
                      ? conf.color
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {conf.label}
                </button>
              );
            })}
          </div>
          <div className="flex gap-2">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Kommentar schreiben..."
              rows={2}
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={submitting || !content.trim()}
              className="self-end rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Senden
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
