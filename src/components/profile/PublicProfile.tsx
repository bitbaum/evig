'use client'

/**
 * PublicProfile — one person, everything they offer.
 *
 * Unifies the former seller storefront + member reputation into a single,
 * mobile-first public profile. Rendered from both /members/[id] and
 * /sellers/[id] (URL aliases → one experience). Tabs are dynamic: a section
 * appears only when the person actually has that kind of offering, so the page
 * is honest and never shows an empty fabricated tab.
 */

import { useEffect, useState, use } from 'react'
import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  BadgeCheck,
  MapPin,
  Calendar,
  ShoppingBag,
  Wrench,
  GraduationCap,
  FileText,
  Star,
  ShieldCheck,
  MessageSquare,
  ArrowUpRight,
} from 'lucide-react'
import { apiFetch } from '@/lib/api/client'
import { logger } from '@/lib/logger'
import { formatDateShort } from '@/lib/date-formats'
import { formatCHF } from '@/config/marketplace'
import { ROUTES } from '@/config/routes'
import { Avatar } from '@/components/ui/Avatar'
import Heading from '@/components/ui/Heading'
import { EmptyState } from '@/components/ui/EmptyState'
import { Tabs } from '@/components/ui/Tabs'
import { ListingCard } from '@/components/marketplace/ListingCard'
import type { PublicProfile as PublicProfileData } from '@/lib/services/profile-service'

// ── Offering cards ──────────────────────────────────────────────────────────

function OfferingCard({
  href,
  eyebrow,
  title,
  description,
  image,
  meta,
}: {
  href: string
  eyebrow?: string | null
  title: string
  description?: string | null
  image?: string | null
  meta?: string | null
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-xl border border-subtle bg-surface-base transition-colors hover:border-action"
    >
      {image && (
        <img src={image} alt="" loading="lazy" className="aspect-[16/9] w-full object-cover" />
      )}
      <div className="flex flex-1 flex-col p-4">
        {eyebrow && (
          <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-text-tertiary">
            {eyebrow}
          </div>
        )}
        <Heading
          level={3}
          className="text-base font-semibold leading-snug text-text-primary transition-colors group-hover:text-action"
        >
          {title}
        </Heading>
        {description && (
          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-text-secondary">{description}</p>
        )}
        <div className="mt-3 flex items-center justify-between pt-1">
          {meta ? (
            <span className="text-xs text-text-tertiary">{meta}</span>
          ) : (
            <span />
          )}
          <ArrowUpRight className="h-4 w-4 shrink-0 text-text-tertiary transition-colors group-hover:text-action" />
        </div>
      </div>
    </Link>
  )
}

function ReviewCard({
  rating,
  title,
  content,
  date,
  href,
  hrefLabel,
}: {
  rating: number
  title: string | null
  content: string
  date: string
  href?: string | null
  hrefLabel?: string | null
}) {
  return (
    <div className="rounded-xl border border-subtle bg-surface-base p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-0.5">
          {Array.from({ length: 5 }, (_, i) => (
            <Star
              key={i}
              className={`h-3.5 w-3.5 ${i < rating ? 'fill-warning-400 text-warning-400' : 'text-text-muted'}`}
            />
          ))}
        </div>
        <span className="text-xs text-text-tertiary">{formatDateShort(date)}</span>
      </div>
      {href && hrefLabel && (
        <Link href={href} className="mt-2 inline-block text-xs font-medium text-action hover:underline">
          {hrefLabel}
        </Link>
      )}
      {title && <div className="mt-2 text-sm font-medium text-text-primary">{title}</div>}
      <p className="mt-1 text-sm leading-relaxed text-text-secondary">{content}</p>
    </div>
  )
}

// ── Main ────────────────────────────────────────────────────────────────────

export default function PublicProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const t = useTranslations('profile')
  const [profile, setProfile] = useState<PublicProfileData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const result = await apiFetch<{ profile: PublicProfileData }>(`/api/profiles/${id}`)
        if (!active) return
        if (result.success && result.data) setProfile(result.data.profile)
        else setError(result.error || t('notFound'))
      } catch (err) {
        logger.warn('Failed to load public profile', { error: err })
        if (active) setError(t('errorLoading'))
      } finally {
        if (active) setIsLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [id, t])

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-action" />
        <span className="ml-3 text-text-secondary">{t('loading')}</span>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="mx-auto max-w-4xl py-12 text-center">
        <AlertCircle className="mx-auto mb-4 h-16 w-16 text-text-muted" />
        <Heading level={2} className="mb-2 text-xl text-text-primary">
          {error || t('notFound')}
        </Heading>
        <Link href={ROUTES.public.marketplace} className="font-medium text-action hover:underline">
          {t('backToMarketplace')}
        </Link>
      </div>
    )
  }

  const location = [profile.city, profile.canton].filter(Boolean).join(', ')

  // Stat tiles — only the meaningful ones for this person.
  const stats: Array<{ label: string; value: string; icon: typeof ShoppingBag }> = []
  if (profile.stats.listings > 0) stats.push({ label: t('statListings'), value: String(profile.stats.listings), icon: ShoppingBag })
  if (profile.stats.services > 0) stats.push({ label: t('statServices'), value: String(profile.stats.services), icon: Wrench })
  if (profile.stats.workshops > 0) stats.push({ label: t('statWorkshops'), value: String(profile.stats.workshops), icon: GraduationCap })
  if (profile.stats.posts > 0) stats.push({ label: t('statPosts'), value: String(profile.stats.posts), icon: FileText })
  if (profile.stats.rating != null && profile.stats.rating > 0)
    stats.push({ label: t('statRating'), value: profile.stats.rating.toFixed(1), icon: Star })

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

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        href={ROUTES.public.marketplace}
        className="mb-6 inline-flex items-center gap-2 text-text-secondary transition-colors hover:text-action"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('backToMarketplace')}
      </Link>

      {/* Header */}
      <div className="mb-8 border-b border-subtle pb-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <Avatar src={profile.avatar_url} name={profile.name} size="xl" shape="rounded" bordered className="sm:h-24 sm:w-24" />
          <div className="min-w-0 flex-1">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-tertiary">
              {t('publicProfile')}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
              <Heading level={1} className="text-3xl font-semibold text-text-primary sm:text-4xl">
                {profile.name}
              </Heading>
              {profile.is_verified && <BadgeCheck className="h-6 w-6 shrink-0 text-action" aria-label={t('verified')} />}
            </div>

            {/* Role badges */}
            {(profile.is_staff || profile.is_technician) && (
              <div className="mt-2 flex flex-wrap gap-2">
                {profile.is_staff && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-action/30 bg-action-muted px-2.5 py-0.5 text-xs font-medium text-action">
                    <ShieldCheck className="h-3.5 w-3.5" /> {t('badgeStaff')}
                  </span>
                )}
                {profile.is_technician && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-subtle px-2.5 py-0.5 text-xs font-medium text-text-secondary">
                    <Wrench className="h-3.5 w-3.5" /> {t('badgeTechnician')}
                  </span>
                )}
              </div>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-text-tertiary">
              {location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" /> {location}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" /> {t('memberSince', { date: formatDateShort(profile.member_since) })}
              </span>
            </div>

            {profile.bio && <p className="mt-4 max-w-2xl text-sm leading-relaxed text-text-secondary">{profile.bio}</p>}
          </div>
        </div>

        {/* Stats — glance line on phones, tiles from sm up */}
        {stats.length > 0 && (
          <>
            <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-text-secondary sm:hidden">
              {stats.map((s) => (
                <span key={s.label} className="flex items-center gap-1.5">
                  <span className="font-mono font-semibold tabular-nums text-text-primary">{s.value}</span>
                  {s.label}
                </span>
              ))}
            </div>
            <div
              className="mt-6 hidden overflow-hidden rounded-xl border border-subtle bg-surface-base sm:grid sm:divide-x sm:divide-subtle"
              style={{ gridTemplateColumns: `repeat(${stats.length}, minmax(0, 1fr))` }}
            >
              {stats.map((s) => (
                <div key={s.label} className="p-4">
                  <div className="flex items-center gap-1.5">
                    <s.icon className="h-4 w-4 text-text-tertiary" />
                    <span className="font-mono text-xl font-semibold tabular-nums text-text-primary">{s.value}</span>
                  </div>
                  <div className="mt-1 text-xs text-text-tertiary">{s.label}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Offerings */}
      {tabs.length === 0 ? (
        <EmptyState icon={ShoppingBag} title={t('noOfferingsTitle')} description={t('noOfferingsDescription')} />
      ) : tabs.length === 1 ? (
        <div>
          <Heading level={2} className="mb-4 flex items-center gap-2 text-lg text-text-primary">
            {tabs[0]!.icon}
            {tabs[0]!.label}
          </Heading>
          {renderSection(tabs[0]!.value)}
        </div>
      ) : (
        <Tabs tabs={tabs} defaultValue={tabs[0]!.value}>
          {(active) => renderSection(active)}
        </Tabs>
      )}

      {/* Reputation */}
      {(profile.reviews_received.length > 0 || profile.reviews_written.length > 0) && (
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
      )}
    </div>
  )
}
