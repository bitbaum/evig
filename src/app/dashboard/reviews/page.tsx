'use client'

import { useState, useEffect } from 'react'
import { logger } from '@/lib/logger'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
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

interface Review {
  id: string
  targetType: string
  targetId: string
  targetName: string
  overallRating: number
  ratings: {
    communication?: number
    professionalism?: number
    quality?: number
    timeliness?: number
    value?: number
  }
  title?: string
  content: string
  status: string
  helpfulVotes: number
  totalVotes: number
  isVerifiedPurchase: boolean
  createdAt: string
  updatedAt: string
  response?: {
    content: string
    responderName: string
    createdAt: string
  }
}

interface UserVote {
  reviewId: string
  voteType: 'helpful' | 'unhelpful'
}

export default function UserReviewsPage() {
  const { data: session, status } = useSession()
  const [reviews, setReviews] = useState<Review[]>([])
  const [userVotes, setUserVotes] = useState<UserVote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingReview, setEditingReview] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    overallRating: 5,
    communicationRating: 5,
    professionalismRating: 5,
    qualityRating: 5,
    timelinessRating: 5,
    valueRating: 5,
    title: '',
    content: ''
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/auth/login')
    } else if (status === 'authenticated') {
      fetchUserReviews()
      fetchUserVotes()
    }
  }, [status])

  const fetchUserReviews = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/user/reviews')
      if (!response.ok) {
        throw new Error('Failed to fetch reviews')
      }
      const data = await response.json()
      setReviews(data.reviews || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const fetchUserVotes = async () => {
    try {
      // This would need a separate API endpoint for user votes
      // For now, we'll handle votes individually
    } catch (err) {
      logger.error('Error fetching user votes', { error: err })
    }
  }

  const handleEditReview = (review: Review) => {
    setEditingReview(review.id)
    setEditForm({
      overallRating: review.overallRating,
      communicationRating: review.ratings.communication || 5,
      professionalismRating: review.ratings.professionalism || 5,
      qualityRating: review.ratings.quality || 5,
      timelinessRating: review.ratings.timeliness || 5,
      valueRating: review.ratings.value || 5,
      title: review.title || '',
      content: review.content
    })
  }

  const handleSaveEdit = async () => {
    if (!editingReview) return

    try {
      const response = await fetch(`/api/reviews/${editingReview}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      })

      if (!response.ok) {
        throw new Error('Failed to update review')
      }

      await fetchUserReviews()
      setEditingReview(null)
      alert('Bewertung erfolgreich aktualisiert!')
    } catch (err) {
      alert('Fehler beim Aktualisieren der Bewertung: ' + (err instanceof Error ? err.message : 'Unknown error'))
    }
  }

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('Sind Sie sicher, dass Sie diese Bewertung löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.')) {
      return
    }

    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete review')
      }

      await fetchUserReviews()
      alert('Bewertung erfolgreich gelöscht!')
    } catch (err) {
      alert('Fehler beim Löschen der Bewertung: ' + (err instanceof Error ? err.message : 'Unknown error'))
    }
  }

  const handleVote = async (reviewId: string, voteType: 'helpful' | 'unhelpful') => {
    try {
      const response = await fetch(`/api/reviews/${reviewId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voteType })
      })

      if (!response.ok) {
        throw new Error('Failed to vote on review')
      }

      const data = await response.json()

      // Update local state
      setReviews(reviews.map(review =>
        review.id === reviewId
          ? {
              ...review,
              helpfulVotes: voteType === 'helpful'
                ? (data.action === 'added' ? review.helpfulVotes + 1 : review.helpfulVotes - 1)
                : review.helpfulVotes,
              totalVotes: data.action === 'added'
                ? review.totalVotes + 1
                : review.totalVotes - 1
            }
          : review
      ))

      // Update user votes
      if (data.action === 'added') {
        setUserVotes([...userVotes.filter(v => v.reviewId !== reviewId), { reviewId, voteType }])
      } else if (data.action === 'removed') {
        setUserVotes(userVotes.filter(v => v.reviewId !== reviewId))
      }

    } catch (err) {
      alert('Fehler bei der Abstimmung: ' + (err instanceof Error ? err.message : 'Unknown error'))
    }
  }

  const renderStars = (rating: number, interactive = false, onChange?: (rating: number) => void) => {
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

  const getUserVoteForReview = (reviewId: string) => {
    return userVotes.find(vote => vote.reviewId === reviewId)?.voteType
  }

  const canEditReview = (createdAt: string) => {
    const created = new Date(createdAt)
    const now = new Date()
    const daysSinceCreation = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
    return daysSinceCreation <= 30
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      published: 'bg-green-100 text-green-800',
      pending_moderation: 'bg-orange-100 text-orange-800',
      hidden: 'bg-red-100 text-red-800',
      deleted: 'bg-gray-100 text-gray-800'
    }

    const labels = {
      published: 'Veröffentlicht',
      pending_moderation: 'Wartet auf Moderation',
      hidden: 'Ausgeblendet',
      deleted: 'Gelöscht'
    }

    const icons = {
      published: <CheckCircle className="w-3 h-3" />,
      pending_moderation: <Clock className="w-3 h-3" />,
      hidden: <EyeOff className="w-3 h-3" />,
      deleted: <Trash2 className="w-3 h-3" />
    }

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium gap-1 ${styles[status as keyof typeof styles] || styles.published}`}>
        {icons[status as keyof typeof icons] || <Eye className="w-3 h-3" />}
        {labels[status as keyof typeof labels] || 'Unbekannt'}
      </span>
    )
  }

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
            <h3 className="text-sm font-medium text-red-800">Fehler beim Laden</h3>
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
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Meine Bewertungen</h1>
        <p className="text-gray-600">
          Verwalten Sie Ihre Bewertungen und sehen Sie, wie andere Benutzer Ihre Bewertungen gefunden haben.
        </p>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Noch keine Bewertungen</h3>
            <p className="text-gray-600 mb-4">
              Sie haben noch keine Bewertungen abgegeben. Besuchen Sie einen Reparateur oder nehmen Sie an einem Workshop teil, um eine Bewertung zu hinterlassen.
            </p>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* Review Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Bewertung für {review.targetName}
                      </h3>
                      {getStatusBadge(review.status)}
                      {review.isVerifiedPurchase && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Verifizierter Kauf
                        </span>
                      )}
                    </div>

                    <div className="mb-3">
                      {renderStars(review.overallRating)}
                    </div>

                    {editingReview === review.id ? (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Gesamtbewertung
                          </label>
                          {renderStars(editForm.overallRating, true, (rating) =>
                            setEditForm({...editForm, overallRating: rating})
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Kommunikation
                            </label>
                            {renderStars(editForm.communicationRating, true, (rating) =>
                              setEditForm({...editForm, communicationRating: rating})
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Professionalität
                            </label>
                            {renderStars(editForm.professionalismRating, true, (rating) =>
                              setEditForm({...editForm, professionalismRating: rating})
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Qualität
                            </label>
                            {renderStars(editForm.qualityRating, true, (rating) =>
                              setEditForm({...editForm, qualityRating: rating})
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Pünktlichkeit
                            </label>
                            {renderStars(editForm.timelinessRating, true, (rating) =>
                              setEditForm({...editForm, timelinessRating: rating})
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Titel (optional)
                          </label>
                          <input
                            type="text"
                            value={editForm.title}
                            onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="Zusammenfassung Ihrer Erfahrung..."
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Bewertungstext
                          </label>
                          <textarea
                            value={editForm.content}
                            onChange={(e) => setEditForm({...editForm, content: e.target.value})}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="Teilen Sie Ihre Erfahrung..."
                          />
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={handleSaveEdit}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                          >
                            Speichern
                          </button>
                          <button
                            onClick={() => setEditingReview(null)}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                          >
                            Abbrechen
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {review.title && (
                          <h4 className="font-medium text-gray-900 mb-2">{review.title}</h4>
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
                      {canEditReview(review.createdAt) && review.status === 'published' && (
                        <button
                          onClick={() => handleEditReview(review)}
                          className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200 flex items-center gap-1"
                        >
                          <Edit3 className="w-3 h-3" />
                          Bearbeiten
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteReview(review.id)}
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
                    <span>Erstellt am {new Date(review.createdAt).toLocaleDateString('de-CH')}</span>
                    {review.updatedAt !== review.createdAt && (
                      <span>Zuletzt bearbeitet am {new Date(review.updatedAt).toLocaleDateString('de-CH')}</span>
                    )}
                  </div>

                  {/* Vote Buttons */}
                  {review.status === 'published' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleVote(review.id, 'helpful')}
                        className={`flex items-center gap-1 px-3 py-1 rounded text-sm ${
                          getUserVoteForReview(review.id) === 'helpful'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <ThumbsUp className="w-3 h-3" />
                        Hilfreich ({review.helpfulVotes})
                      </button>
                      <button
                        onClick={() => handleVote(review.id, 'unhelpful')}
                        className={`flex items-center gap-1 px-3 py-1 rounded text-sm ${
                          getUserVoteForReview(review.id) === 'unhelpful'
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
          ))
        )}
      </div>
    </div>
  )
}