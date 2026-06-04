'use client';

import { useEffect, useState } from 'react';
import { Pencil, Trash2, Check, X } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import Heading from '@/components/admin/AdminHeading';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { apiFetch } from '@/lib/api/client';
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
  currentUserId,
}: {
  decisionId: string;
  readOnly: boolean;
  currentUserId?: string;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  // New comment state
  const [content, setContent] = useState('');
  const [position, setPosition] = useState<CommentPosition>('info');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function fetchComments() {
    const result = await apiFetch<Comment[]>(`/api/decisions/${decisionId}/comments`);
    if (result.success && result.data) setComments(result.data);
    setLoading(false);
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchComments(); }, [decisionId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setError('');
    setSubmitting(true);

    const result = await apiFetch<void>(`/api/decisions/${decisionId}/comments`, {
      method: 'POST',
      body: { content, position },
    });

    if (!result.success) {
      setError(result.error || 'Fehler');
      setSubmitting(false);
      return;
    }

    setContent('');
    fetchComments();
    setSubmitting(false);
  }

  // Edit/delete state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  function startEdit(comment: Comment) {
    setEditingId(comment.id);
    setEditContent(comment.content);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditContent('');
  }

  async function handleEditSave(commentId: string) {
    if (!editContent.trim()) return;
    setEditSaving(true);
    setError('');

    const result = await apiFetch<void>(`/api/decisions/${decisionId}/comments/${commentId}`, {
      method: 'PATCH',
      body: { content: editContent },
    });

    if (!result.success) {
      setError(result.error || 'Fehler beim Bearbeiten');
      setEditSaving(false);
      return;
    }

    setEditingId(null);
    setEditContent('');
    fetchComments();
    setEditSaving(false);
  }

  async function handleDeleteConfirm() {
    if (!deleteId) return;
    setDeleteLoading(true);
    setError('');

    const result = await apiFetch<void>(`/api/decisions/${decisionId}/comments/${deleteId}`, {
      method: 'DELETE',
    });

    if (!result.success) {
      setError(result.error || 'Fehler beim Löschen');
      setDeleteLoading(false);
      setDeleteId(null);
      return;
    }

    setDeleteId(null);
    fetchComments();
    setDeleteLoading(false);
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
    <div className="rounded-lg bg-surface-base p-6 shadow-sm">
      <Heading level={2} className="mb-4 text-lg font-semibold text-text-primary">Diskussion</Heading>

      {loading ? (
        <p className="text-sm text-text-tertiary">Laden...</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-text-tertiary">Noch keine Kommentare</p>
      ) : (
        <div className="space-y-4">
          {COMMENT_POSITIONS.map((pos) => {
            const posComments = grouped[pos];
            if (posComments.length === 0) return null;
            const conf = COMMENT_POSITION_CONFIG[pos];

            return (
              <div key={pos}>
                <Heading
                  level={3}
                  className={`mb-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${conf.color}`}
                >
                  {conf.label} ({posComments.length})
                </Heading>
                <div className="space-y-2">
                  {posComments.map((c) => {
                    const isOwn = currentUserId && c.user.id === currentUserId;
                    const isEditing = editingId === c.id;

                    return (
                      <div
                        key={c.id}
                        className="rounded-md border border-subtle bg-surface-raised p-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs text-text-tertiary">
                            <span>{c.user.email}</span>
                            <span>&middot;</span>
                            <span>
                              {new Date(c.created_at).toLocaleString('de-CH')}
                            </span>
                            {c.is_edited && (
                              <span className="italic">(bearbeitet)</span>
                            )}
                          </div>
                          {isOwn && !readOnly && !isEditing && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => startEdit(c)}
                                className="p-2 text-text-tertiary hover:text-primary-600 rounded"
                                title="Bearbeiten"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteId(c.id)}
                                className="p-2 text-text-tertiary hover:text-error-600 rounded"
                                title="Löschen"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                        {isEditing ? (
                          <div className="mt-2 space-y-2">
                            <Textarea
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              rows={2}
                            />
                            <div className="flex gap-2">
                              <Button
                                onClick={() => handleEditSave(c.id)}
                                disabled={editSaving || !editContent.trim()}
                                variant="primary"
                                size="sm"
                              >
                                <Check className="w-3 h-3" />
                                Speichern
                              </Button>
                              <button
                                onClick={cancelEdit}
                                className="flex items-center gap-1 rounded-md border border-neutral-300 px-3 py-1 text-xs text-text-secondary hover:bg-neutral-50"
                              >
                                <X className="w-3 h-3" />
                                Abbrechen
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="mt-1 text-sm text-text-secondary">{c.content}</p>
                        )}
                      </div>
                    );
                  })}
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
            <div className="mb-2 text-sm text-error-600">{error}</div>
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
                      : 'bg-surface-raised text-text-tertiary hover:bg-neutral-200'
                  }`}
                >
                  {conf.label}
                </button>
              );
            })}
          </div>
          <div className="flex gap-2">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Kommentar schreiben..."
              rows={2}
              className="flex-1"
            />
            <Button
              type="submit"
              disabled={submitting || !content.trim()}
              variant="primary"
              size="sm"
              className="self-end"
            >
              Senden
            </Button>
          </div>
        </form>
      )}

      {/* Delete Comment Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteId}
        title="Kommentar löschen"
        message="Dieser Kommentar wird unwiderruflich gelöscht."
        confirmLabel="Löschen"
        cancelLabel="Abbrechen"
        variant="danger"
        isLoading={deleteLoading}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteId(null)}
      />
    </div>
  );
}
