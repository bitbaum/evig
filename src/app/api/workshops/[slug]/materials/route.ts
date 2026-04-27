import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { workshops, workshopMaterials, workshopRegistrations, workshopInstances } from '@/db/schema'
import { eq, and, sql, asc, desc, inArray } from 'drizzle-orm'
import { apiError, apiSuccess, apiNotFound } from '@/lib/api/helpers'
import { logger } from '@/lib/logger'
import { WORKSHOP_REGISTRATION_STATUS, WORKSHOP_MATERIAL_ACCESS_TYPE } from '@/config/workshop-registration-status'

// GET /api/workshops/[slug]/materials - Get materials for a workshop (respecting access levels)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth()
    const { slug } = await params

    // Workshop lookup + registration check are independent — run in parallel
    // (Registration uses slug join to avoid a sequential workshop-id dependency)
    const [workshop, registration] = await Promise.all([
      db
        .select({ id: workshops.id, title: workshops.title })
        .from(workshops)
        .where(and(eq(workshops.slug, slug), eq(workshops.isActive, true)))
        .then(rows => rows[0]),
      session?.user?.id
        ? db
            .select({
              status: workshopRegistrations.status,
              attended: workshopRegistrations.attended,
            })
            .from(workshopRegistrations)
            .innerJoin(workshopInstances, eq(workshopRegistrations.workshopInstanceId, workshopInstances.id))
            .innerJoin(workshops, and(
              eq(workshopInstances.workshopId, workshops.id),
              eq(workshops.slug, slug),
              eq(workshops.isActive, true),
            ))
            .where(eq(workshopRegistrations.userId, session.user.id))
            .orderBy(desc(workshopRegistrations.createdAt))
            .limit(1)
            .then(rows => rows[0])
        : Promise.resolve(undefined),
    ])

    if (!workshop) {
      return apiNotFound('Workshop')
    }

    // Determine user's access level from the registration fetched in parallel
    let accessLevel: typeof WORKSHOP_MATERIAL_ACCESS_TYPE[keyof typeof WORKSHOP_MATERIAL_ACCESS_TYPE] = WORKSHOP_MATERIAL_ACCESS_TYPE.PUBLIC
    if (registration) {
      if (registration.attended || registration.status === WORKSHOP_REGISTRATION_STATUS.ATTENDED) {
        accessLevel = WORKSHOP_MATERIAL_ACCESS_TYPE.ATTENDED
      } else if (registration.status === WORKSHOP_REGISTRATION_STATUS.CONFIRMED || registration.status === WORKSHOP_REGISTRATION_STATUS.PENDING) {
        accessLevel = WORKSHOP_MATERIAL_ACCESS_TYPE.REGISTERED
      }
    }

    // Build access filter — each level is cumulative (attended ⊇ registered ⊇ public)
    const accessTypes =
      accessLevel === WORKSHOP_MATERIAL_ACCESS_TYPE.ATTENDED ? [WORKSHOP_MATERIAL_ACCESS_TYPE.PUBLIC, WORKSHOP_MATERIAL_ACCESS_TYPE.REGISTERED, WORKSHOP_MATERIAL_ACCESS_TYPE.ATTENDED] :
      accessLevel === WORKSHOP_MATERIAL_ACCESS_TYPE.REGISTERED ? [WORKSHOP_MATERIAL_ACCESS_TYPE.PUBLIC, WORKSHOP_MATERIAL_ACCESS_TYPE.REGISTERED] :
      [WORKSHOP_MATERIAL_ACCESS_TYPE.PUBLIC]

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
