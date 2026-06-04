'use client'

import { useState } from 'react'
import { Star, Loader2, AlertCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { apiFetch } from '@/lib/api/client'
import Heading from '@/components/ui/Heading'

interface ReviewFormProps {
  targetType: string
  targetId: string
  onSubmitted: () => void
  onCancel: () => void
}

export default function ReviewForm({ targetType, targetId, onSubmitted, onCancel }: ReviewFormProps) {
  const t = useTranslations('marketplace.review')
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (rating === 0) {
      setError(t('errorNoRating'))
      return
    }
    if (content.trim().length < 10) {
      setError(t('errorTooShort'))
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const result = await apiFetch<void>('/api/reviews', {
        method: 'POST',
        body: {
          targetType,
          targetId,
          overallRating: rating,
          title: title.trim() || null,
          content: content.trim(),
        },
      })

      if (result.success) {
        onSubmitted()
      } else {
        setError(result.error || t('errorSubmit'))
      }
    } catch {
      setError(t('errorGeneric'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="border-t border-subtle pt-4 mt-4 space-y-4">
      <Heading level={3} className="text-sm font-semibold text-text-primary">{t('heading')}</Heading>

      {/* Star Rating */}
      <div>
        <label className="block text-xs font-medium text-text-tertiary mb-1">
          {t('ratingLabel')} <span className="text-error-500">*</span>
        </label>
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }, (_, i) => (
            <button
              key={i}
              onMouseEnter={() => setHoverRating(i + 1)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(i + 1)}
              className="p-2"
            >
              <Star
                className={`w-6 h-6 transition-colors ${
                  i < (hoverRating || rating)
                    ? 'text-warning-400 fill-warning-400'
                    : 'text-text-muted dark:text-text-secondary'
                }`}
              />
            </button>
          ))}
          {rating > 0 && (
            <span className="ml-2 text-sm text-text-tertiary">{rating}/5</span>
          )}
        </div>
      </div>

      {/* Title (optional) */}
      <div>
        <label className="block text-xs font-medium text-text-tertiary mb-1">
          {t('titleLabel')} <span className="text-xs text-text-tertiary">{t('titleOptional')}</span>
        </label>
        <Input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('titlePlaceholder')}
          maxLength={120}
        />
      </div>

      {/* Content */}
      <div>
        <label className="block text-xs font-medium text-text-tertiary mb-1">
          {t('contentLabel')} <span className="text-error-500">*</span>
        </label>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          placeholder={t('contentPlaceholder')}
          maxLength={2000}
          className="resize-y"
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-error-600">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="flex gap-2">
        <Button onClick={onCancel} variant="outline" size="sm">
          {t('cancelButton')}
        </Button>
        <Button onClick={handleSubmit} disabled={isSubmitting} size="sm" className="flex-1 gap-2">
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            t('submitButton')
          )}
        </Button>
      </div>
    </div>
  )
}
