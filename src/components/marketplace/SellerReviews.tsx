'use client'

import { Star, BadgeCheck } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { formatDateShort } from '@/lib/date-formats'
import { EmptyState } from '@/components/ui/EmptyState'
import Heading from '@/components/ui/Heading'
import { RatingBreakdown } from './RatingBreakdown'

export interface SellerReview {
  id: string
  rating: number
  title: string | null
  content: string
  created_at: string | null
  is_verified_purchase: boolean
  reviewer_name: string | null
  listing_id: string
  listing_title: string
  response_content: string | null
  response_created_at: string | null
}

interface SellerReviewsProps {
  reviews: SellerReview[]
  average: number
  total: number
  histogram: Record<string, number>
}

function StarRow({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`${rating}/5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i <= rating ? 'text-warning-400 fill-warning-400' : 'text-text-muted'}`}
          aria-hidden="true"
        />
      ))}
    </span>
  )
}

/**
 * Seller reputation on the profile page: an aggregate breakdown plus the most
 * recent reviews with verified-purchase badges and any seller response. Reviews
 * are listing-scoped in the DB; this aggregates them to the person.
 */
export function SellerReviews({ reviews, average, total, histogram }: SellerReviewsProps) {
  const t = useTranslations('sellers')

  return (
    <section className="mt-10">
      <Heading level={2} className="mb-4 flex items-center gap-2 text-lg text-text-primary">
        <Star className="h-5 w-5" aria-hidden="true" />
        {t('reviewsHeading')}
      </Heading>

      {total === 0 ? (
        <EmptyState icon={Star} title={t('noReviewsTitle')} description={t('noReviewsDescription')} />
      ) : (
        <>
          <div className="card-shell mb-6 p-5">
            <RatingBreakdown
              average={average}
              total={total}
              histogram={histogram}
              countLabel={t('ratingsCount', { count: total })}
            />
          </div>

          <ul className="space-y-4">
            {reviews.map((r) => (
              <li key={r.id} className="card-shell p-5">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <StarRow rating={r.rating} />
                  <span className="text-sm font-medium text-text-primary">{r.reviewer_name || '—'}</span>
                  {r.is_verified_purchase && (
                    <span className="inline-flex items-center gap-1 text-xs text-action">
                      <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
                      {t('verifiedPurchase')}
                    </span>
                  )}
                  {r.created_at && (
                    <span className="text-xs text-text-tertiary">{formatDateShort(r.created_at)}</span>
                  )}
                </div>

                {r.title && <div className="mt-2 font-medium text-text-primary">{r.title}</div>}
                <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-text-secondary">
                  {r.content}
                </p>

                <Link
                  href={`/marketplace/${r.listing_id}`}
                  className="mt-2 inline-block text-xs text-action hover:underline"
                >
                  {t('reviewForListing', { title: r.listing_title })}
                </Link>

                {r.response_content && (
                  <div className="mt-3 border-l-2 border-strong pl-3">
                    <div className="text-xs font-medium text-text-tertiary">{t('sellerResponse')}</div>
                    <p className="mt-1 whitespace-pre-line text-sm text-text-secondary">
                      {r.response_content}
                    </p>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
