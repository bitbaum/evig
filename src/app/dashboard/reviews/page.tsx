'use client'

import { useSession } from 'next-auth/react'
import {
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
import { StarRating } from '@/components/ui/StarRating'
import { useTranslations } from 'next-intl'
import { formatDateShort } from '@/lib/date-formats'
import { useReviewManagement, type Review } from '@/hooks/useReviewManagement'
import Heading from '@/components/ui/Heading'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { FormField } from '@/components/ui/form-field'
import { REVIEW_STATUS, REVIEW_STATUS_BADGES } from '@/config/review-status'

const STATUS_STYLES = REVIEW_STATUS_BADGES

const STATUS_ICONS: Record<string, React.ReactNode> = {
  [REVIEW_STATUS.PUBLISHED]: <CheckCircle className="w-3 h-3" />,
  [REVIEW_STATUS.PENDING_MODERATION]: <Clock className="w-3 h-3" />,
  [REVIEW_STATUS.HIDDEN]: <EyeOff className="w-3 h-3" />,
  [REVIEW_STATUS.DELETED]: <Trash2 className="w-3 h-3" />
}

function StatusBadge({ status }: { status: string }) {
  const t = useTranslations('dashboard.reviews')
  const label = status === REVIEW_STATUS.PUBLISHED ? t('statusPublished')
    : status === REVIEW_STATUS.PENDING_MODERATION ? t('statusPendingModeration')
    : status === REVIEW_STATUS.HIDDEN ? t('statusHidden')
    : status === REVIEW_STATUS.DELETED ? t('statusDeleted')
    : t('statusUnknown')
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium gap-1 ${STATUS_STYLES[status] || STATUS_STYLES.published}`}>
      {STATUS_ICONS[status] || <Eye className="w-3 h-3" />}
      {label}
    </span>
  )
}

function StarRow({ rating, onChange }: { rating: number; onChange?: (r: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      <StarRating value={rating} onChange={onChange} />
      <span className="ml-2 text-sm text-neutral-600">{rating}/5</span>
    </div>
  )
}

function ReviewEditForm({ editForm, setEditForm, onSave, onCancel }: {
  editForm: { overallRating: number; communicationRating: number; professionalismRating: number; qualityRating: number; timelinessRating: number; valueRating: number; title: string; content: string }
  setEditForm: (form: typeof editForm) => void
  onSave: () => void
  onCancel: () => void
}) {
  const t = useTranslations('dashboard.reviews')
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">{t('editOverallRating')}</label>
        <StarRow rating={editForm.overallRating} onChange={(r) => setEditForm({...editForm, overallRating: r})} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {([
          { labelKey: 'editCommunication', key: 'communicationRating' as const },
          { labelKey: 'editProfessionalism', key: 'professionalismRating' as const },
          { labelKey: 'editQuality', key: 'qualityRating' as const },
          { labelKey: 'editTimeliness', key: 'timelinessRating' as const },
        ] as const).map(({ labelKey, key }) => (
          <div key={key}>
            <label className="block text-sm font-medium text-neutral-700 mb-1">{t(labelKey)}</label>
            <StarRow rating={editForm[key]} onChange={(r) => setEditForm({...editForm, [key]: r})} />
          </div>
        ))}
      </div>

      <FormField label={t('editTitle')}>
        <Input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({...editForm, title: e.target.value})}
          placeholder={t('editTitlePlaceholder')}
        />
      </FormField>

      <FormField label={t('editContent')}>
        <Textarea
          value={editForm.content}
          onChange={(e) => setEditForm({...editForm, content: e.target.value})}
          rows={4}
          placeholder={t('editContentPlaceholder')}
        />
      </FormField>

      <div className="flex gap-2">
        <Button variant="primary" onClick={onSave}>{t('save')}</Button>
        <Button variant="outline" onClick={onCancel}>{t('cancel')}</Button>
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
  const t = useTranslations('dashboard.reviews')
  const tDates = useTranslations('dashboard.dates')
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-neutral-200 dark:border-white/[0.06] overflow-hidden">
      <div className="p-6 border-b border-neutral-200 dark:border-white/[0.06]">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <Heading level={3} className="text-lg font-semibold text-neutral-900">
                {t('reviewFor', { name: review.targetName })}
              </Heading>
              <StatusBadge status={review.status} />
              {review.isVerifiedPurchase && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300 gap-1">
                  <CheckCircle className="w-3 h-3" />
                  {t('verifiedPurchase')}
                </span>
              )}
            </div>

            <div className="mb-3">
              <StarRow rating={review.overallRating} />
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
                  <Heading level={4} className="font-medium text-neutral-900 mb-2">{review.title}</Heading>
                )}
                <p className="text-neutral-700 mb-3 leading-relaxed">{review.content}</p>

                {review.response && (
                  <div className="mt-4 p-4 bg-neutral-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="w-4 h-4 text-neutral-600" />
                      <span className="text-sm font-medium text-neutral-900">
                        {t('responseFrom', { name: review.response.responderName })}
                      </span>
                    </div>
                    <p className="text-neutral-800 text-sm">{review.response.content}</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Action Buttons */}
          {editingReview !== review.id && (
            <div className="flex flex-col gap-2 ml-4">
              {canEdit(review.createdAt) && review.status === REVIEW_STATUS.PUBLISHED && (
                <Button onClick={() => onEdit(review)} variant="secondary" size="sm" className="gap-1">
                  <Edit3 className="w-3 h-3" />
                  {t('edit')}
                </Button>
              )}
              <button
                onClick={() => onDelete(review.id)}
                className="px-3 py-1.5 bg-error-100 dark:bg-error-500/20 text-error-700 dark:text-error-400 rounded text-sm hover:bg-error-200 dark:hover:bg-error-500/30 flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                {t('delete')}
              </button>
            </div>
          )}
        </div>

        {/* Review Stats */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-neutral-100 dark:border-white/[0.04]">
          <div className="flex items-center gap-4 text-sm text-neutral-500 dark:text-neutral-400">
            <span>{t('helpfulVotes', { count: review.helpfulVotes })}</span>
            <span>{tDates('createdOn', { date: formatDateShort(review.createdAt) })}</span>
            {review.updatedAt !== review.createdAt && (
              <span>{tDates('lastEdited', { date: formatDateShort(review.updatedAt) })}</span>
            )}
          </div>

          {/* Vote Buttons */}
          {review.status === REVIEW_STATUS.PUBLISHED && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onVote(review.id, 'helpful')}
                className={`flex items-center gap-1 px-3 py-1 rounded text-sm ${
                  getUserVote(review.id) === 'helpful'
                    ? 'bg-primary-100 dark:bg-primary-500/20 text-primary-700 dark:text-primary-400'
                    : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-600'
                }`}
              >
                <ThumbsUp className="w-3 h-3" />
                {t('helpful', { count: review.helpfulVotes })}
              </button>
              <button
                onClick={() => onVote(review.id, 'unhelpful')}
                className={`flex items-center gap-1 px-3 py-1 rounded text-sm ${
                  getUserVote(review.id) === 'unhelpful'
                    ? 'bg-error-100 dark:bg-error-500/20 text-error-700 dark:text-error-400'
                    : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-600'
                }`}
              >
                <ThumbsDown className="w-3 h-3" />
                {t('notHelpful')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function UserReviewsPage() {
  const t = useTranslations('dashboard.reviews')
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-error-50 dark:bg-error-500/10 border border-error-200 dark:border-error-500/30 rounded-lg p-4">
        <div className="flex">
          <div className="text-error-400">⚠️</div>
          <div className="ml-3">
            <Heading level={3} className="text-sm font-medium text-error-800 dark:text-error-300">{t('loadError')}</Heading>
            <p className="text-sm text-error-700 dark:text-error-400 mt-1">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-neutral-200 dark:border-white/[0.06] p-6">
        <Heading level={1} className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">{t('pageTitle')}</Heading>
        <p className="text-neutral-600 dark:text-neutral-400">
          {t('pageDescription')}
        </p>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            iconBg="bg-warning-50 dark:bg-warning-900/20"
            iconColor="text-warning-500 dark:text-warning-400"
            title={t('emptyTitle')}
            description={t('emptyDescription')}
          />
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
