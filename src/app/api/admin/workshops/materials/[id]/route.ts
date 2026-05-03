import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/api/middleware'
import { db } from '@/db'
import { workshopMaterials } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'
import { apiError, apiSuccess, apiNotFound, apiBadRequest } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { logger } from '@/lib/logger'
import { WORKSHOP_MATERIAL_ACCESS_TYPE } from '@/config/workshop-registration-status'

// PUT /api/admin/workshops/materials/[id] - Update a material
export const PUT = withAdmin<{ id: string }>('workshops-admin', async (request, session, context) => {
  try {
    const { id } = context!.params!
    const body = await request.json()
    const {
      title,
      description,
      materialType,
      url,
      accessType,
      instanceId,
      displayOrder,
      isActive
    } = body

    // Check if material exists
    const [existing] = await db
      .select({ id: workshopMaterials.id })
      .from(workshopMaterials)
      .where(eq(workshopMaterials.id, id))

    if (!existing) {
      return apiNotFound('Material not found')
    }

    // Build dynamic update set
    const updateSet: Record<string, unknown> = {}

    if (title !== undefined) updateSet.title = title.trim()
    if (description !== undefined) updateSet.description = description?.trim() || null

    if (materialType !== undefined) {
      const validTypes = ['pdf', 'document', 'link', 'video', 'archive']
      if (!validTypes.includes(materialType)) {
        return apiBadRequest(`Invalid material type. Valid types: ${validTypes.join(', ')}`)
      }
      updateSet.materialType = materialType
    }

    if (url !== undefined) updateSet.url = url.trim()

    if (accessType !== undefined) {
      const validAccessTypes = Object.values(WORKSHOP_MATERIAL_ACCESS_TYPE)
      if (!validAccessTypes.includes(accessType)) {
        return apiBadRequest(`Invalid access type. Valid types: ${validAccessTypes.join(', ')}`)
      }
      updateSet.accessType = accessType
    }

    if (instanceId !== undefined) updateSet.instanceId = instanceId || null
    if (displayOrder !== undefined) updateSet.displayOrder = displayOrder
    if (isActive !== undefined) updateSet.isActive = isActive

    if (Object.keys(updateSet).length === 0) {
      return apiBadRequest(ERROR_MESSAGES.NO_FIELDS_TO_UPDATE)
    }

    updateSet.updatedAt = sql`NOW()`

    const [material] = await db
      .update(workshopMaterials)
      .set(updateSet)
      .where(eq(workshopMaterials.id, id))
      .returning()

    logger.info('Workshop material updated', {
      materialId: id,
      updatedBy: session.user.id
    })

    return apiSuccess({
      material,
      message: 'Material updated successfully'
    })

  } catch (error) {
    logger.error('Error updating workshop material', { error })
    return apiError(error, 'Failed to update material')
  }
})

// DELETE /api/admin/workshops/materials/[id] - Delete a material
export const DELETE = withAdmin<{ id: string }>('workshops-admin', async (request, session, context) => {
  try {
    const { id } = context!.params!

    const result = await db
      .delete(workshopMaterials)
      .where(eq(workshopMaterials.id, id))
      .returning({ id: workshopMaterials.id })

    if (result.length === 0) {
      return apiNotFound('Material not found')
    }

    logger.info('Workshop material deleted', {
      materialId: id,
      deletedBy: session.user.id
    })

    return apiSuccess({
      message: 'Material deleted successfully'
    })

  } catch (error) {
    logger.error('Error deleting workshop material', { error })
    return apiError(error, 'Failed to delete material')
  }
})
