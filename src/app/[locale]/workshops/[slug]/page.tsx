// SSR only — lucide-react in server component scope causes React-null in certain Turbopack SSG bundles
export const dynamic = 'force-dynamic'

import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ORG } from '@/config/org'
import { WORKSHOP_INSTANCE_STATUS, normalizeCategoryId } from '@/config/workshops'
import WorkshopRegistrationForm from '@/components/workshops/WorkshopRegistrationForm'
import WorkshopReviews from '@/components/workshops/WorkshopReviews'
import WorkshopMaterials from '@/components/workshops/WorkshopMaterials'
import Heading from '@/components/ui/Heading'
import { getTranslations } from 'next-intl/server'
import { PageShell } from '@/components/layout/PageShell'
import { getWorkshop, getWorkshopInstances } from './data'
import {
  WorkshopHeader,
  WorkshopDetailsCard,
  WorkshopInstancesList,
  WorkshopStatsCard,
  NoUpcomingDatesNotice,
} from './sections'

interface Props {
  params: Promise<{ slug: string; locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = await params
  const t = await getTranslations({ locale, namespace: 'workshops' })
  const workshop = await getWorkshop(slug)

  if (!workshop) {
    return {
      title: `${t('detail.notFound')} | ${ORG.name}`,
    }
  }

  const description = workshop.short_description || workshop.description || undefined

  return {
    title: `${workshop.title} | ${ORG.name} ${t('meta.title')}`,
    description,
    openGraph: {
      title: `${workshop.title} | ${ORG.name} ${t('meta.title')}`,
      description,
      type: 'website',
    },
  }
}

export default async function WorkshopDetailPage({ params }: Props) {
  const { slug, locale } = await params
  const t = await getTranslations({ locale, namespace: 'workshops' })
  const workshop = await getWorkshop(slug)

  if (!workshop) notFound()

  const instances = await getWorkshopInstances(workshop.id)
  const upcomingInstances = instances.filter(
    (inst) => inst.status === WORKSHOP_INSTANCE_STATUS.SCHEDULED && new Date(inst.start_date) > new Date()
  )
  const nextInstance = upcomingInstances[0]
  const catId = normalizeCategoryId(workshop.category)
  const categoryName = catId ? t(`categories.${catId}` as never) : (workshop.category ?? null)

  const workshopForForm = {
    id: workshop.id,
    slug: workshop.slug,
    title: workshop.title,
    description: workshop.description,
    category: workshop.category,
    duration: workshop.duration,
    level: workshop.level,
    max_participants: workshop.max_participants,
    price_cents: workshop.price_cents,
    is_active: workshop.is_active,
    created_at: workshop.created_at,
    updated_at: workshop.updated_at,
  }

  return (
    <>
      <WorkshopHeader workshop={workshop} categoryName={categoryName} t={t} />

      <PageShell maxWidth="4xl" py="py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-8">
            <WorkshopDetailsCard workshop={workshop} categoryName={categoryName} t={t} />
            <WorkshopInstancesList instances={upcomingInstances} fallbackMax={workshop.max_participants} t={t} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {nextInstance ? (
              <div id="register" className="card-shell p-6">
                <WorkshopRegistrationForm workshop={workshopForForm} instance={nextInstance} />
              </div>
            ) : (
              <NoUpcomingDatesNotice t={t} />
            )}

            <WorkshopStatsCard
              workshop={workshop}
              categoryName={categoryName}
              upcomingCount={upcomingInstances.length}
              t={t}
            />

            <div className="card-shell p-6">
              <div className="ui-public-eyebrow">{t('detail.materials').toUpperCase()}</div>
              <Heading level={3} className="font-semibold text-text-primary mt-3 mb-4">{t('detail.materials')}</Heading>
              <WorkshopMaterials workshopSlug={workshop.slug} />
            </div>

            <div className="card-shell p-6">
              <div className="ui-public-eyebrow">{t('detail.reviews').toUpperCase()}</div>
              <Heading level={3} className="font-semibold text-text-primary mt-3 mb-4">{t('detail.reviews')}</Heading>
              <WorkshopReviews workshopSlug={workshop.slug} />
            </div>
          </div>
        </div>
      </PageShell>
    </>
  )
}
