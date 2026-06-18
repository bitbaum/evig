import { Metadata } from 'next'
import { ORG } from '@/config/org'
import { getTranslations } from 'next-intl/server'
import { db } from '@/db'
import { workshops, workshopInstances, workshopRegistrations } from '@/db/schema'
import { eq, desc, asc, inArray, sql, and } from 'drizzle-orm'
import { logger } from '@/lib/logger'
import { auth } from '@/auth'
import WorkshopBrowseClient from './WorkshopBrowseClient'
import { formatDurationDe } from './[slug]/data'
import type { WorkshopWithInstances } from '@/components/workshops/types'
import { type WorkshopInstanceStatus, WORKSHOP_INSTANCE_STATUS } from '@/config/workshops'
import { WORKSHOP_REGISTRATION_STATUS } from '@/config/workshop-registration-status'
import { pickI18n } from '@/lib/i18n/db-content'

// auth() reads request headers — prevent static generation so this page is SSR'd per-request
export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'workshops.meta' })
  return {
    title: `${t('title')} | ${ORG.name}`,
    description: t('description'),
    openGraph: {
      title: `${t('title')} | ${ORG.name}`,
      description: t('description'),
      type: 'website',
    },
  }
}

async function getWorkshopsWithInstances(locale: string): Promise<WorkshopWithInstances[]> {
  try {
    // Fetch all active workshops + their per-locale JSONB translations.
    // pickI18n() at the boundary resolves locale → translated string with DE
    // fallback so the client never sees raw JSONB.
    const workshopRows = await db
      .select({
        id: workshops.id,
        slug: workshops.slug,
        title: workshops.title,
        description: workshops.description,
        category: workshops.category,
        duration: workshops.duration,
        duration_minutes: workshops.durationMinutes,
        level: workshops.level,
        title_i18n: workshops.titleI18n,
        description_i18n: workshops.descriptionI18n,
        duration_i18n: workshops.durationI18n,
        level_i18n: workshops.levelI18n,
        category_i18n: workshops.categoryI18n,
        max_participants: workshops.maxParticipants,
        price_cents: workshops.priceCents,
        is_active: workshops.isActive,
        created_at: workshops.createdAt,
        updated_at: workshops.updatedAt,
      })
      .from(workshops)
      .where(eq(workshops.isActive, true))
      .orderBy(desc(workshops.createdAt))

    if (workshopRows.length === 0) return []

    const workshopIds = workshopRows.map(w => w.id)

    // Fetch instances + session concurrently (both depend only on workshopIds/nothing from each other)
    const [instanceRows, session] = await Promise.all([
      db
        .select({
          id: workshopInstances.id,
          workshop_id: workshopInstances.workshopId,
          start_date: workshopInstances.startDate,
          end_date: workshopInstances.endDate,
          location: workshopInstances.location,
          instructor: workshopInstances.instructor,
          max_participants: workshopInstances.maxParticipants,
          notes: workshopInstances.notes,
          status: workshopInstances.status,
          created_at: workshopInstances.createdAt,
          updated_at: workshopInstances.updatedAt,
          // Exclude CANCELLED — see eac01d4a/d38a2787 for the matching
          // invariant on the stored-count side.
          current_participants: sql<number>`count(CASE WHEN ${workshopRegistrations.status} != ${WORKSHOP_REGISTRATION_STATUS.CANCELLED} THEN ${workshopRegistrations.id} END)`,
        })
        .from(workshopInstances)
        .leftJoin(workshopRegistrations, eq(workshopInstances.id, workshopRegistrations.workshopInstanceId))
        .where(inArray(workshopInstances.workshopId, workshopIds))
        .groupBy(workshopInstances.id)
        .orderBy(asc(workshopInstances.startDate)),
      auth(),
    ])

    // Check user registrations (needs session.user.id resolved above)
    const registeredWorkshopIds = new Set<string>()

    if (session?.user?.id) {
      const regs = await db
        .select({ workshopId: workshopInstances.workshopId })
        .from(workshopRegistrations)
        .innerJoin(workshopInstances, eq(workshopRegistrations.workshopInstanceId, workshopInstances.id))
        .where(
          and(
            eq(workshopRegistrations.userId, session.user.id),
            inArray(workshopInstances.workshopId, workshopIds)
          )
        )

      for (const reg of regs) {
        registeredWorkshopIds.add(reg.workshopId)
      }
    }

    // Group instances by workshop
    const instancesByWorkshop = new Map<string, typeof instanceRows>()
    for (const inst of instanceRows) {
      const list = instancesByWorkshop.get(inst.workshop_id) || []
      list.push(inst)
      instancesByWorkshop.set(inst.workshop_id, list)
    }

    // Assemble result — resolve every German-only text column through pickI18n
    // so the client component receives already-localised strings (or DE
    // fallback) without ever touching JSONB.
    return workshopRows.map(w => ({
      id: w.id,
      slug: w.slug,
      title:       pickI18n(w.title,       w.title_i18n,       locale) ?? w.title,
      description: pickI18n(w.description, w.description_i18n, locale),
      category:    pickI18n(w.category,    w.category_i18n,    locale),
      duration:    pickI18n(w.duration,    w.duration_i18n,    locale) ?? formatDurationDe(w.duration_minutes),
      level:       pickI18n(w.level,       w.level_i18n,       locale),
      max_participants: w.max_participants ?? 12,
      price_cents: w.price_cents ?? 0,
      is_active: w.is_active ?? true,
      created_at: w.created_at ?? '',
      updated_at: w.updated_at ?? '',
      instances: (instancesByWorkshop.get(w.id) || []).map(inst => ({
        ...inst,
        start_date: inst.start_date,
        end_date: inst.end_date,
        location: inst.location,
        instructor: inst.instructor,
        max_participants: inst.max_participants,
        notes: inst.notes,
        status: (inst.status ?? WORKSHOP_INSTANCE_STATUS.SCHEDULED) as WorkshopInstanceStatus,
        created_at: inst.created_at ?? '',
        updated_at: inst.updated_at ?? '',
        current_participants: Number(inst.current_participants) || 0,
      })),
      user_registered: registeredWorkshopIds.has(w.id),
    }))
  } catch (error) {
    logger.error('Error fetching workshops for browse page', { error })
    return []
  }
}

export default async function WorkshopsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const workshopsData = await getWorkshopsWithInstances(locale)
  return <WorkshopBrowseClient workshops={workshopsData} />
}
