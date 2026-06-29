// SSR only — lucide-react in server component scope causes React-null in certain Turbopack SSG bundles
export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ORG } from '@/config/org'
import { getTranslations } from 'next-intl/server'
import { getTechnicianById } from '@/lib/services/technician-service'
import { logger } from '@/lib/logger'
import {
  buildTechnikerProfileMeta,
  TechnikerProfileView,
  type TechnikerProfileCopy,
} from './TechnikerProfileView'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

interface Props {
  params: Promise<{ id: string; locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, locale } = await params
  const t = await getTranslations({ locale, namespace: 'techniker' })

  if (!UUID_RE.test(id)) return { title: { absolute: `${t('meta.title')} | ${ORG.name}` } }

  try {
    const tech = await getTechnicianById(id)
    if (!tech) return { title: { absolute: `${t('meta.title')} | ${ORG.name}` } }
    const tierLabel = tech.profileTier === 'professional' ? t('detail.professional') : t('detail.community')
    const displayName = tech.name ?? t('meta.title')
    const title = `${displayName} – ${tierLabel} | ${ORG.name}`
    const description = tech.bio ?? `${displayName} · ${tierLabel} · ${ORG.name}`
    return {
      title: { absolute: title },
      description,
      openGraph: { title, description, type: 'website' },
    }
  } catch (err) {
    logger.warn('Failed to generate technician metadata', { error: err })
    return { title: { absolute: `${t('meta.title')} | ${ORG.name}` } }
  }
}

export default async function TechnikerDetailPage({ params }: Props) {
  const { id, locale } = await params
  const t = await getTranslations({ locale, namespace: 'techniker' })

  if (!UUID_RE.test(id)) notFound()

  const technician = await getTechnicianById(id)
  if (!technician) notFound()

  const copy: TechnikerProfileCopy = {
    backToList: t('detail.backToList'),
    verified: t('detail.verified'),
    professional: t('detail.professional'),
    community: t('detail.community'),
    aboutMe: t('detail.aboutMe'),
    skills: t('detail.skills'),
    offeredServices: t('detail.offeredServices'),
    requestBooking: t('detail.requestBooking'),
    estimatedDuration: t('detail.estimatedDuration'),
    priceFrom: t('detail.priceFrom'),
    hourlyRate: t('detail.hourlyRate'),
    deliveryTypes: t('detail.deliveryTypes'),
    submitRequest: t('detail.submitRequest'),
    contact: t('detail.contact'),
    ctaHint: t('detail.ctaHint'),
    gratisHelp: t('detail.gratisHelp'),
    kulturlegiRate: t('detail.kulturlegiRate'),
  }
  const meta = buildTechnikerProfileMeta(technician, copy, {
    reviews: (values) => t('detail.reviews', values),
    jobsCompleted: (values) => t('detail.jobsCompleted', values),
    responseTime: (values) => t('detail.responseTime', values),
    travelRange: (values) => t('detail.travelRange', values),
  })

  return <TechnikerProfileView technician={technician} copy={copy} meta={meta} />
}
