'use client'

import { useTranslations } from 'next-intl'
import { Star, MessageSquare } from 'lucide-react'
import { ROUTES } from '@/config/routes'
import Heading from '@/components/ui/Heading'
import { ReviewCard } from './profile-cards'
import type { PublicProfile as PublicProfileData } from '@/lib/services/profile-service'

/**
 * Reputation: reviews received and reviews written. Renders nothing when the
 * person has neither, so the section never shows an empty shell.
 */
export function ProfileReputation({ profile }: { profile: PublicProfileData }) {
  const t = useTranslations('profile')

  if (profile.reviews_received.length === 0 && profile.reviews_written.length === 0) {
    return null
  }

  return (
    <div className="mt-12 space-y-10 border-t border-subtle pt-10">
      {profile.reviews_received.length > 0 && (
        <section>
          <Heading level={2} className="mb-4 flex items-center gap-2 text-lg text-text-primary">
            <Star className="h-5 w-5" />
            {t('reviewsReceived', { count: profile.stats.reviews_received })}
          </Heading>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {profile.reviews_received.map((r) => (
              <ReviewCard
                key={r.id}
                rating={r.overall_rating}
                title={r.title}
                content={r.content}
                date={r.created_at}
                href={r.listing_title ? ROUTES.public.marketplaceListing(r.target_id) : null}
                hrefLabel={r.listing_title ? t('reviewFor', { title: r.listing_title }) : null}
              />
            ))}
          </div>
        </section>
      )}
      {profile.reviews_written.length > 0 && (
        <section>
          <Heading level={2} className="mb-4 flex items-center gap-2 text-lg text-text-primary">
            <MessageSquare className="h-5 w-5" />
            {t('reviewsWritten', { count: profile.stats.reviews_written })}
          </Heading>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {profile.reviews_written.map((r) => (
              <ReviewCard
                key={r.id}
                rating={r.overall_rating}
                title={r.title}
                content={r.content}
                date={r.created_at}
                href={r.listing_title ? ROUTES.public.marketplaceListing(r.target_id) : null}
                hrefLabel={r.listing_title ? t('reviewFor', { title: r.listing_title }) : null}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
