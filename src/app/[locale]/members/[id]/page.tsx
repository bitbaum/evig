'use client'

import { useState, useEffect } from 'react'
import { Link } from '@/i18n/navigation'
import Image from 'next/image'
import {
  ArrowLeft,
  User,
  Loader2,
  AlertCircle,
  Calendar,
  Star,
  MessageSquare,
  ThumbsUp,
  Store,
  BadgeCheck,
} from 'lucide-react'
import { apiFetch } from '@/lib/api/client'
import { logger } from '@/lib/logger'
import { formatDateShort } from '@/lib/date-formats'
import Heading from '@/components/ui/Heading'
import { EmptyState } from '@/components/ui/EmptyState'
import { useTranslations } from 'next-intl'
import { ROUTES } from '@/config/routes'

interface MemberReview {
  id: string
  target_type: string
  target_id: string
  listing_title: string | null
  listing_status: string | null
  overall_rating: number
  title: string | null
  content: string
  helpful_votes: number
  created_at: string
}

interface MemberProfile {
  user_id: string
  name: string | null
  image: string | null
  member_since: string
  is_verified: boolean
  is_seller: boolean
  seller_display_name: string | null
  seller_listings: number
  reviews: MemberReview[]
  stats: {
    reviews_written: number
    helpful_votes: number
  }
}

function ReviewStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${
            i < rating ? 'text-warning-400 fill-warning-400' : 'text-text-muted'
          }`}
        />
      ))}
    </div>
  )
}

export default function MemberProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const t = useTranslations('members')
  const [member, setMember] = useState<MemberProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMember = async () => {
      try {
        const { id } = await params
        const result = await apiFetch<{
          profile: Omit<MemberProfile, 'reviews' | 'stats'>
          reviews: MemberReview[]
          stats: MemberProfile['stats']
        }>(`/api/members/${id}`)

        if (result.success && result.data) {
          const { profile, reviews, stats } = result.data
          setMember({ ...profile, reviews, stats })
        } else {
          setError(result.error || t('notFound'))
        }
      } catch (err) {
        logger.warn('Failed to load member profile', { error: err })
        setError(t('errorLoading'))
      } finally {
        setIsLoading(false)
      }
    }
    fetchMember()
  }, [params, t])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-action animate-spin" />
        <span className="ml-3 text-text-secondary">{t('loading')}</span>
      </div>
    )
  }

  if (error || !member) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <AlertCircle className="w-16 h-16 text-text-muted mx-auto mb-4" />
        <Heading level={2} className="text-xl text-text-primary mb-2">
          {error || t('notFound')}
        </Heading>
        <Link href={ROUTES.public.marketplace} className="text-action hover:text-action font-medium">
          {t('backToMarketplace')}
        </Link>
      </div>
    )
  }

  const displayName = member.name || t('anonymous')

  return (
    <div className="max-w-4xl mx-auto">
      <Link
        href={ROUTES.public.marketplace}
        className="inline-flex items-center gap-2 text-text-secondary hover:text-action mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('backToMarketplace')}
      </Link>

      {/* Header */}
      <div className="mb-8 border-b border-subtle pb-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-subtle bg-action-muted flex items-center justify-center">
            {member.image ? (
              <Image src={member.image} alt={displayName} width={80} height={80} className="h-20 w-20 object-cover" />
            ) : (
              <User className="h-9 w-9 text-action" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-tertiary">
              {t('communityMember')}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <Heading level={1} className="text-3xl font-semibold text-text-primary sm:text-4xl">{displayName}</Heading>
              {member.is_verified && (
                <BadgeCheck className="h-6 w-6 shrink-0 text-action" aria-label={t('verified')} />
              )}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-text-tertiary">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {t('memberSince', { date: formatDateShort(member.member_since) })}
              </span>
              {member.is_verified && (
                <span className="font-medium text-action">{t('verified')}</span>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-8 grid grid-cols-2 divide-x divide-subtle rounded-lg border border-subtle bg-surface-base">
          <div className="p-4">
            <div className="font-mono text-xl font-semibold tabular-nums text-text-primary">
              {member.stats.reviews_written}
            </div>
            <div className="mt-1 text-xs text-text-tertiary">{t('reviewsWritten')}</div>
          </div>
          <div className="p-4">
            <div className="font-mono text-xl font-semibold tabular-nums text-text-primary">
              {member.stats.helpful_votes}
            </div>
            <div className="mt-1 text-xs text-text-tertiary">{t('helpfulVotes')}</div>
          </div>
        </div>

        {/* Seller cross-link — one identity, two facets. */}
        {member.is_seller && (
          <Link
            href={ROUTES.public.seller(member.user_id)}
            className="mt-4 flex items-center gap-3 rounded-lg border border-subtle bg-surface-base p-4 transition-colors hover:border-action"
          >
            <Store className="h-5 w-5 shrink-0 text-action" />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-text-primary">{t('alsoSeller')}</div>
              <div className="text-xs text-text-tertiary">
                {t('sellerListings', { count: member.seller_listings })}
              </div>
            </div>
            <ArrowLeft className="h-4 w-4 shrink-0 rotate-180 text-text-tertiary" />
          </Link>
        )}
      </div>

      {/* Reviews written */}
      <div>
        <Heading level={2} className="text-lg text-text-primary mb-4 flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          {t('reviewsTitle', { count: member.stats.reviews_written })}
        </Heading>

        {member.reviews.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title={t('noReviewsTitle')}
            description={t('noReviewsDescription')}
          />
        ) : (
          <div className="space-y-4">
            {member.reviews.map((review) => (
              <div key={review.id} className="rounded-lg border border-subtle bg-surface-base p-4">
                <div className="flex items-center justify-between gap-2">
                  <ReviewStars rating={review.overall_rating} />
                  <span className="text-xs text-text-tertiary">{formatDateShort(review.created_at)}</span>
                </div>
                {review.listing_title && (
                  <Link
                    href={ROUTES.public.marketplaceListing(review.target_id)}
                    className="mt-2 inline-block text-xs font-medium text-action hover:underline"
                  >
                    {t('reviewFor', { title: review.listing_title })}
                  </Link>
                )}
                {review.title && (
                  <Heading level={3} className="mt-2 text-sm font-medium text-text-primary">
                    {review.title}
                  </Heading>
                )}
                <p className="mt-1 text-sm leading-relaxed text-text-secondary">{review.content}</p>
                {review.helpful_votes > 0 && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-text-tertiary">
                    <ThumbsUp className="h-3.5 w-3.5" />
                    {t('helpfulCount', { count: review.helpful_votes })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
