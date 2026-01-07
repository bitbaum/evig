'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Eye,
  EyeOff,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MessageSquare,
  Star,
  Filter,
  Search,
  ArrowLeft,
  Flag,
  RefreshCw
} from 'lucide-react'

interface Review {
  id: string
  reviewerId: string
  reviewerName: string
  reviewerEmail: string
  targetType: string
  targetId: string
  targetName: string
  overallRating: number
  title?: string
  content: string
  status: string
  helpfulVotes: number
  totalVotes: number
  isVerifiedPurchase: boolean
  moderationReason?: string
  moderatedBy?: string
  moderatedAt?: string
  createdAt: string
  updatedAt: string
  response?: {
    content: string
    responderName: string
    createdAt: string
  }
}

type ReviewStatus = 'published' | 'pending_moderation' | 'hidden' | 'deleted'

export default function AdminReviewsPage() {
  const router = useRouter()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<ReviewStatus>('pending_moderation')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)
  const [moderationAction, setModerationAction] = useState<string | null>(null)

  useEffect(() => {
    fetchReviews()
  }, [selectedStatus])

  const fetchReviews = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/reviews?status=${selectedStatus}&limit=50`)
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

  const handleModerate = async (reviewId: string, action: string) => {
    const reason = prompt(`Grund für ${getActionLabel(action)}:`)
    if (!reason) return

    setModerationAction(reviewId)
    try {
      const response = await fetch(`/api/admin/reviews/${reviewId}/moderate`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          reason
        })
      })

      if (!response.ok) {
        throw new Error('Failed to moderate review')
      }

      await fetchReviews()
      alert(`Bewertung erfolgreich ${getActionLabel(action)}`)
    } catch (err) {
      alert('Fehler bei der Moderation: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setModerationAction(null)
    }
  }

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'approve': return 'freigegeben'
      case 'hide': return 'ausgeblendet'
      case 'delete': return 'gelöscht'
      case 'restore': return 'wiederhergestellt'
      case 'flag_spam': return 'als Spam markiert'
      case 'flag_inappropriate': return 'als unangemessen markiert'
      default: return 'moderiert'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'pending_moderation':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />
      case 'hidden':
        return <EyeOff className="w-5 h-5 text-red-500" />
      case 'deleted':
        return <Trash2 className="w-5 h-5 text-gray-500" />
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-500" />
    }
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

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || styles.pending_moderation}`}>
        {getStatusIcon(status)}
        <span className="ml-1">{labels[status as keyof typeof labels] || 'Unbekannt'}</span>
      </span>
    )
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
          />
        ))}
        <span className="ml-2 text-sm text-gray-600">{rating}/5</span>
      </div>
    )
  }

  const filteredReviews = reviews.filter(review =>
    searchQuery === '' ||
    review.reviewerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    review.reviewerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
    review.targetName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    review.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (review.title && review.title.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  if (loading) {
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
          <XCircle className="w-5 h-5 text-red-400" />
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/admin')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            Zurück zum Admin-Bereich
          </button>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Bewertungs-Management</h1>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Status:</span>
            </div>
            <div className="flex gap-2">
              {(['published', 'pending_moderation', 'hidden', 'deleted'] as ReviewStatus[]).map((status) => (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedStatus === status
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {status === 'published' && 'Veröffentlicht'}
                  {status === 'pending_moderation' && 'Moderation'}
                  {status === 'hidden' && 'Ausgeblendet'}
                  {status === 'deleted' && 'Gelöscht'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <div className="relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Suchen nach Name, E-Mail oder Inhalt..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={fetchReviews}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Aktualisieren
            </button>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Bewertungen gefunden</h3>
            <p className="text-gray-600">
              {searchQuery
                ? 'Keine Bewertungen entsprechen Ihrer Suchanfrage.'
                : `Keine Bewertungen mit Status "${selectedStatus}".`
              }
            </p>
          </div>
        ) : (
          filteredReviews.map((review) => (
            <div key={review.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* Review Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Bewertung für {review.targetName}
                      </h3>
                      {getStatusBadge(review.status)}
                      {review.isVerifiedPurchase && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Verifizierter Kauf
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                      {renderStars(review.overallRating)}
                      <span>•</span>
                      <span>{review.reviewerName}</span>
                      <span>•</span>
                      <span>{new Date(review.createdAt).toLocaleDateString('de-CH')}</span>
                    </div>
                    {review.title && (
                      <h4 className="font-medium text-gray-900 mb-2">{review.title}</h4>
                    )}
                    <p className="text-gray-700 text-sm leading-relaxed">{review.content}</p>

                    {review.response && (
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <MessageSquare className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-900">
                            Antwort von {review.response.responderName}
                          </span>
                          <span className="text-xs text-blue-600">
                            {new Date(review.response.createdAt).toLocaleDateString('de-CH')}
                          </span>
                        </div>
                        <p className="text-blue-800 text-sm">{review.response.content}</p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2 ml-4">
                    {selectedStatus === 'pending_moderation' && (
                      <>
                        <button
                          onClick={() => handleModerate(review.id, 'approve')}
                          disabled={moderationAction === review.id}
                          className="px-3 py-1.5 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
                        >
                          <CheckCircle className="w-3 h-3" />
                          {moderationAction === review.id ? '...' : 'Freigeben'}
                        </button>
                        <button
                          onClick={() => handleModerate(review.id, 'hide')}
                          disabled={moderationAction === review.id}
                          className="px-3 py-1.5 bg-red-600 text-white rounded text-xs hover:bg-red-700 disabled:opacity-50 flex items-center gap-1"
                        >
                          <EyeOff className="w-3 h-3" />
                          {moderationAction === review.id ? '...' : 'Ausblenden'}
                        </button>
                      </>
                    )}

                    {selectedStatus === 'hidden' && (
                      <>
                        <button
                          onClick={() => handleModerate(review.id, 'restore')}
                          disabled={moderationAction === review.id}
                          className="px-3 py-1.5 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3" />
                          {moderationAction === review.id ? '...' : 'Wiederherstellen'}
                        </button>
                        <button
                          onClick={() => handleModerate(review.id, 'delete')}
                          disabled={moderationAction === review.id}
                          className="px-3 py-1.5 bg-red-600 text-white rounded text-xs hover:bg-red-700 disabled:opacity-50 flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          {moderationAction === review.id ? '...' : 'Löschen'}
                        </button>
                      </>
                    )}

                    <div className="flex gap-1 mt-2">
                      <button
                        onClick={() => handleModerate(review.id, 'flag_spam')}
                        disabled={moderationAction === review.id}
                        className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs hover:bg-yellow-200 disabled:opacity-50"
                        title="Als Spam markieren"
                      >
                        <Flag className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleModerate(review.id, 'flag_inappropriate')}
                        disabled={moderationAction === review.id}
                        className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs hover:bg-orange-200 disabled:opacity-50"
                        title="Als unangemessen markieren"
                      >
                        <AlertTriangle className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Review Stats */}
                <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                  <span>{review.helpfulVotes} hilfreiche Stimmen</span>
                  {review.moderationReason && (
                    <span className="text-red-600">Moderationsgrund: {review.moderationReason}</span>
                  )}
                  {review.moderatedAt && (
                    <span>Moderiert am {new Date(review.moderatedAt).toLocaleDateString('de-CH')}</span>
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