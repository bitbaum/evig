import { Metadata } from 'next'
import { db } from '@/db'
import { workshops, workshopInstances, workshopRegistrations } from '@/db/schema'
import { eq, desc, asc, inArray, sql, and } from 'drizzle-orm'
import { logger } from '@/lib/logger'
import { auth } from '@/auth'
import WorkshopBrowseClient from './WorkshopBrowseClient'
import type { WorkshopWithInstances } from '@/components/workshops/types'

export const metadata: Metadata = {
  title: 'Workshops | RevampIT',
  description:
    'Entdecke unsere Workshops zu nachhaltiger Technologie, Linux, Reparatur, Programmierung und mehr. Praxisnah lernen bei RevampIT in Zürich.',
  openGraph: {
    title: 'Workshops | RevampIT',
    description:
      'Praxisnahe Workshops zu nachhaltiger Technologie. Von Linux über Hardware-Reparatur bis KI.',
    type: 'website',
  },
}

async function getWorkshopsWithInstances(): Promise<WorkshopWithInstances[]> {
  try {
    // Fetch all active workshops
    const workshopRows = await db
      .select({
        id: workshops.id,
        slug: workshops.slug,
        title: workshops.title,
        description: workshops.description,
        category: workshops.category,
        duration: workshops.duration,
        level: workshops.level,
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

    // Fetch instances with registration counts
    const instanceRows = await db
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
        current_participants: sql<number>`count(${workshopRegistrations.id})`,
      })
      .from(workshopInstances)
      .leftJoin(workshopRegistrations, eq(workshopInstances.id, workshopRegistrations.workshopInstanceId))
      .where(inArray(workshopInstances.workshopId, workshopIds))
      .groupBy(workshopInstances.id)
      .orderBy(asc(workshopInstances.startDate))

    // Check user registrations
    const session = await auth()
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

    // Assemble result
    return workshopRows.map(w => ({
      id: w.id,
      slug: w.slug,
      title: w.title,
      description: w.description,
      category: w.category,
      duration: w.duration,
      level: w.level,
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
        status: (inst.status ?? 'scheduled') as 'scheduled' | 'cancelled' | 'completed',
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

export default async function WorkshopsPage() {
  const workshopsData = await getWorkshopsWithInstances()
  return <WorkshopBrowseClient workshops={workshopsData} />
}
