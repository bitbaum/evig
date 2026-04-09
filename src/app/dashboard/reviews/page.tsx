'use client'

import { useSession } from 'next-auth/react'
import {
  Star,
  MessageSquare,
  Edit3,
  Trash2,
  ThumbsUp,
  ThumbsDown,
  Clock,
  CheckCircle,
  Eye,
  EyeOff
} from 'lucide-react'
import { formatDateShort } from '@/lib/date-formats'
import { useReviewManagement, type Review } from '@/hooks/useReviewManagement'
import Heading from '@/components/ui/Heading'

const STATUS_STYLES: Record<string, string> = {
  published: 'bg-green-100 text-green-800',
  pending_moderation: 'bg-orange-100 text-orange-800',
  hidden: 'bg-red-100 text-red-800',
  deleted: 'bg-gray-100 text-gray-800'
}

const STATUS_LABELS: Record<string, string> = {
  published: 'Veröffentlicht',
  pending_moderation: 'Wartet auf Moderation',
  hidden: 'Ausgeblendet',
  deleted: 'Gelöscht'
}

const STATUS_ICONS: Record<string, React.ReactNode> = {
  published: <CheckCircle className="w-3 h-3" />,
  pending_moderation: <Clock className="w-3 h-3" />,
  hidden: <EyeOff className="w-3 h-3" />,
  deleted: <Trash2 className="w-3 h-3" />
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium gap-1 ${STATUS_STYLES[status] || STATUS_STYLES.published}`}>
      {STATUS_ICONS[status] || <Eye className="w-3 h-3" />}
      {STATUS_LABELS[status] || 'Unbekannt'}
    </span>
  )
}

function StarRating({ rating, interactive = false, onChange }: {
  rating: number
  interactive?: boolean
  onChange?: (rating: number) => void
}) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => onChange?.(star)}
          className={`w-5 h-5 ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''} ${
            star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
          }`}
        >
          <Star className="w-full h-full" />
        </button>
      ))}
      <span className="ml-2 text-sm text-gray-600">{rating}/5</span>
    </div>
  )
}

function ReviewEditForm({ editForm, setEditForm, onSave, onCancel }: {
  editForm: { overallRating: number; communicationRating: number; professionalismRating: number; qualityRating: number; timelinessRating: number; valueRating: number; title: string; content: string }
  setEditForm: (form: typeof editForm) => void
  onSave: () => void
  onCancel: () => void
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Gesamtbewertung</label>
        <StarRating rating={editForm.overallRating} interactive onChange={(r) => setEditForm({...editForm, overallRating: r})} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {[
          { label: 'Kommunikation', key: 'communicationRating' as const },
          { label: 'Professionalität', key: 'professionalismRating' as const },
          { label: 'Qualität', key: 'qualityRating' as const },
          { label: 'Pünktlichkeit', key: 'timelinessRating' as const },
        ].map(({ label, key }) => (
          <div key={key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <StarRating rating={editForm[key]} interactive onChange={(r) => setEditForm({...editForm, [key]: r})} />
          </div>
        ))}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Titel (optional)</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({...editForm, title: e.target.value})}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          placeholder="Zusammenfassung Ihrer Erfahrung..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Bewertungstext</label>
        <textarea
          value={editForm.content}
          onChange={(e) => setEditForm({...editForm, content: e.target.value})}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          placeholder="Teilen Sie Ihre Erfahrung..."
        />
      </div>

      <div className="flex gap-2">
        <button onClick={onSave} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
          Speichern
        </button>
        <button onClick={onCancel} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
          Abbrechen
        </button>
      </div>
    </div>
  )
}

function ReviewCard({ review, editingReview, editForm, setEditForm, onEdit, onSaveEdit, onCancelEdit, onDelete, onVote, getUserVote, canEdit }: {
  review: Review
  editingReview: string | null
  editForm: { overallRating: number; communicationRating: number; professionalismRating: number; qualityRating: number; timelinessRating: number; valueRating: number; title: string; content: string }
  setEditForm: (form: typeof editForm) => void
  onEdit: (review: Review) => void
  onSaveEdit: () => void
  onCancelEdit: () => void
  onDelete: (id: string) => void
  onVote: (id: string, type: 'helpful' | 'unhelpful') => void
  getUserVote: (id: string) => 'helpful' | 'unhelpful' | undefined
  canEdit: (createdAt: string) => boolean
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <Heading level={3} className="text-lg font-semibold text-gray-900">
                Bewertung für {review.targetName}
              </Heading>
              <StatusBadge status={review.status} />
              {review.isVerifiedPurchase && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Verifizierter Kauf
                </span>
              )}
            </div>

            <div className="mb-3">
              <StarRating rating={review.overallRating} />
            </div>

            {editingReview === review.id ? (
              <ReviewEditForm
                editForm={editForm}
                setEditForm={setEditForm}
                onSave={onSaveEdit}
                onCancel={onCancelEdit}
              />
            ) : (
              <>
                {review.title && (
                  <Heading level={4} className="font-medium text-gray-900 mb-2">{review.title}</Heading>
                )}
                <p className="text-gray-700 mb-3 leading-relaxed">{review.content}</p>

                {review.response && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">
                        Antwort von {review.response.responderName}
                      </span>
                    </div>
                    <p className="text-blue-800 text-sm">{review.response.content}</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Action Buttons */}
          {editingReview !== review.id && (
            <div className="flex flex-col gap-2 ml-4">
              {canEdit(review.createdAt) && review.status === 'published' && (
                <button
                  onClick={() => onEdit(review)}
                  className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200 flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" />
                  Bearbeiten
                </button>
              )}
              <button
                onClick={() => onDelete(review.id)}
                className="px-3 py-1.5 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200 flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                Löschen
              </button>
            </div>
          )}
        </div>

        {/* Review Stats */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>{review.helpfulVotes} hilfreiche Stimmen</span>
            <span>Erstellt am {formatDateShort(review.createdAt)}</span>
            {review.updatedAt !== review.createdAt && (
              <span>Zuletzt bearbeitet am {formatDateShort(review.updatedAt)}</span>
            )}
          </div>

          {/* Vote Buttons */}
          {review.status === 'published' && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onVote(review.id, 'helpful')}
                className={`flex items-center gap-1 px-3 py-1 rounded text-sm ${
                  getUserVote(review.id) === 'helpful'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <ThumbsUp className="w-3 h-3" />
                Hilfreich ({review.helpfulVotes})
              </button>
              <button
                onClick={() => onVote(review.id, 'unhelpful')}
                className={`flex items-center gap-1 px-3 py-1 rounded text-sm ${
                  getUserVote(review.id) === 'unhelpful'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <ThumbsDown className="w-3 h-3" />
                Nicht hilfreich
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function UserReviewsPage() {
  const { status } = useSession()
  const {
    reviews,
    loading,
    error,
    editingReview,
    editForm,
    setEditForm,
    handleEditReview,
    handleSaveEdit,
    handleDeleteReview,
    handleVote,
    cancelEdit,
    getUserVoteForReview,
    canEditReview,
  } = useReviewManagement(status)

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <div className="text-red-400">⚠️</div>
          <div className="ml-3">
            <Heading level={3} className="text-sm font-medium text-red-800">Fehler beim Laden</Heading>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <Heading level={1} className="text-2xl font-bold text-gray-900 mb-2">Meine Bewertungen</Heading>
        <p className="text-gray-600">
          Verwalten Sie Ihre Bewertungen und sehen Sie, wie andere Benutzer Ihre Bewertungen gefunden haben.
        </p>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <Heading level={3} className="text-lg font-medium text-gray-900 mb-2">Noch keine Bewertungen</Heading>
            <p className="text-gray-600 mb-4">
              Sie haben noch keine Bewertungen abgegeben. Besuchen Sie einen Reparateur oder nehmen Sie an einem Workshop teil, um eine Bewertung zu hinterlassen.
            </p>
          </div>
        ) : (
          reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              editingReview={editingReview}
              editForm={editForm}
              setEditForm={setEditForm}
              onEdit={handleEditReview}
              onSaveEdit={handleSaveEdit}
              onCancelEdit={cancelEdit}
              onDelete={handleDeleteReview}
              onVote={handleVote}
              getUserVote={getUserVoteForReview}
              canEdit={canEditReview}
            />
          ))
        )}
      </div>
    </div>
  )
}
