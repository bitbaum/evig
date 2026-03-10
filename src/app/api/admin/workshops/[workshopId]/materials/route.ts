import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/api/middleware'
import { db } from '@/db'
import { workshopMaterials } from '@/db/schema'
import { eq, asc, desc } from 'drizzle-orm'
import { apiError, apiSuccess, apiBadRequest } from '@/lib/api/helpers'
import { logger } from '@/lib/logger'

// GET /api/admin/workshops/[workshopId]/materials - List all materials for a workshop
export const GET = withAdmin<{ workshopId: string }>('workshops-admin', async (request, session, context) => {
  try {
    const { workshopId } = context!.params!

    const materials = await db
      .select({
        id: workshopMaterials.id,
        workshop_id: workshopMaterials.workshopId,
        instance_id: workshopMaterials.instanceId,
        title: workshopMaterials.title,
        description: workshopMaterials.description,
        material_type: workshopMaterials.materialType,
        url: workshopMaterials.url,
        file_size_bytes: workshopMaterials.fileSizeBytes,
        access_type: workshopMaterials.accessType,
        display_order: workshopMaterials.displayOrder,
        is_active: workshopMaterials.isActive,
        created_at: workshopMaterials.createdAt,
      })
      .from(workshopMaterials)
      .where(eq(workshopMaterials.workshopId, workshopId))
      .orderBy(asc(workshopMaterials.displayOrder), desc(workshopMaterials.createdAt))

    return apiSuccess({ materials })

  } catch (error) {
    logger.error('Error fetching workshop materials', { error })
    return apiError(error, 'Failed to fetch materials')
  }
})

// POST /api/admin/workshops/[workshopId]/materials - Add a new material
export const POST = withAdmin<{ workshopId: string }>('workshops-admin', async (request, session, context) => {
  try {
    const { workshopId } = context!.params!
    const body = await request.json()
    const {
      title,
      description,
      materialType,
      url,
      fileSizeBytes,
      accessType = 'registered',
      instanceId,
      displayOrder = 0
    } = body

    // Validation
    if (!title || !title.trim()) {
      return apiBadRequest('Title is required')
    }

    if (!url || !url.trim()) {
      return apiBadRequest('URL is required')
    }

    const validTypes = ['pdf', 'document', 'link', 'video', 'archive']
    if (!materialType || !validTypes.includes(materialType)) {
      return apiBadRequest(`Invalid material type. Valid types: ${validTypes.join(', ')}`)
    }

    const validAccessTypes = ['public', 'registered', 'attended']
    if (!validAccessTypes.includes(accessType)) {
      return apiBadRequest(`Invalid access type. Valid types: ${validAccessTypes.join(', ')}`)
    }

    const [material] = await db
      .insert(workshopMaterials)
      .values({
        workshopId,
        instanceId: instanceId || null,
        title: title.trim(),
        description: description?.trim() || null,
        materialType,
        url: url.trim(),
        fileSizeBytes: fileSizeBytes || null,
        accessType,
        displayOrder,
        uploadedBy: session.user.id,
      })
      .returning()

    logger.info('Workshop material added', {
      workshopId,
      materialId: material.id,
      addedBy: session.user.id
    })

    return apiSuccess({
      material,
      message: 'Material added successfully'
    })

  } catch (error) {
    logger.error('Error adding workshop material', { error })
    return apiError(error, 'Failed to add material')
  }
})
