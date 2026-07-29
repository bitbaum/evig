'use client'

/**
 * PublicProfile — one person, everything they offer.
 *
 * Unifies the former seller storefront + member reputation into a single,
 * mobile-first public profile. Rendered from both /members/[id] and
 * /sellers/[id] (URL aliases → one experience). Tabs are dynamic: a section
 * appears only when the person actually has that kind of offering, so the page
 * is honest and never shows an empty fabricated tab.
 *
 * This component is a thin composition: data comes from useProfileData, and the
 * three render blocks (header · offerings · reputation) each own their own slice.
 */

import { use } from 'react'
import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react'
import { ROUTES } from '@/config/routes'
import Heading from '@/components/ui/Heading'
import { useProfileData } from './useProfileData'
import { ProfileHeader } from './ProfileHeader'
import { ProfileOfferings } from './ProfileOfferings'
import { ProfileReputation } from './ProfileReputation'

export default function PublicProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const t = useTranslations('profile')
  const { profile, isLoading, error } = useProfileData(id)

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

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        href={ROUTES.public.marketplace}
        className="mb-6 inline-flex items-center gap-2 text-text-secondary transition-colors hover:text-action"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('backToMarketplace')}
      </Link>

      <ProfileHeader profile={profile} />
      <ProfileOfferings profile={profile} />
      <ProfileReputation profile={profile} />
    </div>
  )
}
