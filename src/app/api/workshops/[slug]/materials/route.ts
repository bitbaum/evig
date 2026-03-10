import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { workshops, workshopMaterials, workshopRegistrations, workshopInstances } from '@/db/schema'
import { eq, and, sql, asc, desc, inArray } from 'drizzle-orm'
import { apiError, apiSuccess, apiNotFound } from '@/lib/api/helpers'
import { logger } from '@/lib/logger'
import { WORKSHOP_REGISTRATION_STATUS } from '@/config/workshop-registration-status'

// GET /api/workshops/[slug]/materials - Get materials for a workshop (respecting access levels)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth()
    const { slug } = await params

    // Get the workshop
    const [workshop] = await db
      .select({ id: workshops.id, title: workshops.title })
      .from(workshops)
      .where(and(eq(workshops.slug, slug), eq(workshops.isActive, true)))

    if (!workshop) {
      return apiNotFound('Workshop')
    }

    // Determine user's access level
    let accessLevel: 'public' | 'registered' | 'attended' = 'public'

    if (session?.user?.id) {
      const [registration] = await db
        .select({
          status: workshopRegistrations.status,
          attended: workshopRegistrations.attended,
        })
        .from(workshopRegistrations)
        .innerJoin(workshopInstances, eq(workshopRegistrations.workshopInstanceId, workshopInstances.id))
        .where(and(
          eq(workshopInstances.workshopId, workshop.id),
          eq(workshopRegistrations.userId, session.user.id),
        ))
        .orderBy(desc(workshopRegistrations.createdAt))
        .limit(1)

      if (registration) {
        if (registration.attended || registration.status === WORKSHOP_REGISTRATION_STATUS.ATTENDED) {
          accessLevel = 'attended'
        } else if (registration.status === WORKSHOP_REGISTRATION_STATUS.CONFIRMED || registration.status === WORKSHOP_REGISTRATION_STATUS.PENDING) {
          accessLevel = 'registered'
        }
      }
    }

    // Build access filter
    const accessTypes =
      accessLevel === 'attended' ? ['public', 'registered', 'attended'] :
      accessLevel === 'registered' ? ['public', 'registered'] :
      ['public']

    const rows = await db
      .select({
        id: workshopMaterials.id,
        title: workshopMaterials.title,
        description: workshopMaterials.description,
        material_type: workshopMaterials.materialType,
        url: workshopMaterials.url,
        file_size_bytes: workshopMaterials.fileSizeBytes,
        access_type: workshopMaterials.accessType,
        display_order: workshopMaterials.displayOrder,
        created_at: workshopMaterials.createdAt,
      })
      .from(workshopMaterials)
      .where(and(
        eq(workshopMaterials.workshopId, workshop.id),
        eq(workshopMaterials.isActive, true),
        inArray(workshopMaterials.accessType, accessTypes),
      ))
      .orderBy(asc(workshopMaterials.displayOrder), desc(workshopMaterials.createdAt))

    return apiSuccess({
      materials: rows,
      accessLevel,
      workshopTitle: workshop.title,
    })

  } catch (error) {
    logger.error('Error fetching workshop materials', { error })
    return apiError(error, 'Materialien konnten nicht geladen werden')
  }
}
