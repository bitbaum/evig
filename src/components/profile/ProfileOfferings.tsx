'use client'

import type React from 'react'
import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { ShoppingBag, Wrench, GraduationCap, FileText, ArrowUpRight } from 'lucide-react'
import { formatDateShort } from '@/lib/date-formats'
import { formatCHF } from '@/config/marketplace'
import { ROUTES } from '@/config/routes'
import Heading from '@/components/ui/Heading'
import { EmptyState } from '@/components/ui/EmptyState'
import { Tabs } from '@/components/ui/Tabs'
import { ListingCard } from '@/components/marketplace/ListingCard'
import { OfferingCard } from './profile-cards'
import type { PublicProfile as PublicProfileData } from '@/lib/services/profile-service'

/**
 * The person's offerings, split into dynamic tabs — a tab appears only when the
 * person actually has that kind of offering, so the page is honest and never
 * shows an empty fabricated tab. Single-offering profiles skip the tab chrome.
 */
export function ProfileOfferings({ profile }: { profile: PublicProfileData }) {
  const t = useTranslations('profile')

  // Dynamic tabs — one per non-empty offering kind.
  const tabs: Array<{ value: string; label: string; icon: React.ReactNode }> = []
  if (profile.listings.length > 0) tabs.push({ value: 'listings', label: `${t('tabListings')} (${profile.listings.length})`, icon: <ShoppingBag className="h-4 w-4" /> })
  if (profile.services.length > 0) tabs.push({ value: 'services', label: `${t('tabServices')} (${profile.services.length})`, icon: <Wrench className="h-4 w-4" /> })
  if (profile.workshops.length > 0) tabs.push({ value: 'workshops', label: `${t('tabWorkshops')} (${profile.workshops.length})`, icon: <GraduationCap className="h-4 w-4" /> })
  if (profile.content.length > 0) tabs.push({ value: 'content', label: `${t('tabContent')} (${profile.content.length})`, icon: <FileText className="h-4 w-4" /> })

  const renderSection = (key: string) => {
    switch (key) {
      case 'listings':
        return (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {profile.listings.map((l) => (
              <ListingCard
                key={l.id}
                listing={{
                  id: l.id,
                  title: l.title,
                  price_chf: l.price_chf,
                  category: l.category,
                  condition: l.condition,
                  is_revampit: l.is_revampit,
                  pickup_location: l.pickup_location,
                  seller_name: profile.name,
                  seller_display_name: profile.name,
                  seller_rating: profile.stats.rating,
                  seller_city: profile.city,
                  seller_is_verified: profile.is_verified,
                  thumbnail: l.thumbnail,
                  verified_at: l.verified_at,
                }}
              />
            ))}
          </div>
        )
      case 'services':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {profile.services.map((s) => {
                const price =
                  s.base_price_cents != null
                    ? formatCHF(s.base_price_cents / 100)
                    : s.hourly_rate_cents != null
                      ? t('perHour', { price: formatCHF(s.hourly_rate_cents / 100) })
                      : null
                return (
                  <OfferingCard
                    key={s.id}
                    href={profile.technician_id ? ROUTES.public.technicianProfile(profile.technician_id) : ROUTES.public.techniker}
                    eyebrow={s.category}
                    title={s.name}
                    description={s.description}
                    meta={price}
                  />
                )
              })}
            </div>
            {profile.technician_id && (
              <Link
                href={ROUTES.public.technicianProfile(profile.technician_id)}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-action hover:underline"
              >
                {t('viewTechnicianProfile')} <ArrowUpRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        )
      case 'workshops':
        return (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {profile.workshops.map((w) => (
              <OfferingCard
                key={w.slug}
                href={`/workshops/${w.slug}`}
                eyebrow={w.category}
                title={w.title}
                description={w.description}
                image={w.featured_image}
                meta={w.level}
              />
            ))}
          </div>
        )
      case 'content':
        return (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {profile.content.map((c) => (
              <OfferingCard
                key={c.slug}
                href={`/blog/${c.slug}`}
                eyebrow={c.category}
                title={c.title}
                description={c.excerpt}
                image={c.featured_image}
                meta={c.published_at ? formatDateShort(c.published_at) : null}
              />
            ))}
          </div>
        )
      default:
        return null
    }
  }

  if (tabs.length === 0) {
    return <EmptyState icon={ShoppingBag} title={t('noOfferingsTitle')} description={t('noOfferingsDescription')} />
  }

  if (tabs.length === 1) {
    return (
      <div>
        <Heading level={2} className="mb-4 flex items-center gap-2 text-lg text-text-primary">
          {tabs[0]!.icon}
          {tabs[0]!.label}
        </Heading>
        {renderSection(tabs[0]!.value)}
      </div>
    )
  }

  return (
    <Tabs tabs={tabs} defaultValue={tabs[0]!.value}>
      {(active) => renderSection(active)}
    </Tabs>
  )
}
