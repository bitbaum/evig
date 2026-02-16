import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/api/middleware'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess, apiNotFound, apiBadRequest } from '@/lib/api/helpers'
import { logger } from '@/lib/logger'
import { TABLE_NAMES } from '@/config/database'

// PUT /api/admin/workshops/materials/[id] - Update a material
export const PUT = withAdmin<{ id: string }>(async (request, session, context) => {
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
    const existingResult = await query(
      `SELECT id FROM ${TABLE_NAMES.WORKSHOP_MATERIALS} WHERE id = $1`,
      [id]
    )

    if (existingResult.rows.length === 0) {
      return apiNotFound('Material not found')
    }

    // Build update query
    const updates: string[] = []
    const values: (string | number | boolean | null)[] = []
    let paramIndex = 1

    if (title !== undefined) {
      updates.push(`title = $${paramIndex}`)
      values.push(title.trim())
      paramIndex++
    }

    if (description !== undefined) {
      updates.push(`description = $${paramIndex}`)
      values.push(description?.trim() || null)
      paramIndex++
    }

    if (materialType !== undefined) {
      const validTypes = ['pdf', 'document', 'link', 'video', 'archive']
      if (!validTypes.includes(materialType)) {
        return apiBadRequest(`Invalid material type. Valid types: ${validTypes.join(', ')}`)
      }
      updates.push(`material_type = $${paramIndex}`)
      values.push(materialType)
      paramIndex++
    }

    if (url !== undefined) {
      updates.push(`url = $${paramIndex}`)
      values.push(url.trim())
      paramIndex++
    }

    if (accessType !== undefined) {
      const validAccessTypes = ['public', 'registered', 'attended']
      if (!validAccessTypes.includes(accessType)) {
        return apiBadRequest(`Invalid access type. Valid types: ${validAccessTypes.join(', ')}`)
      }
      updates.push(`access_type = $${paramIndex}`)
      values.push(accessType)
      paramIndex++
    }

    if (instanceId !== undefined) {
      updates.push(`instance_id = $${paramIndex}`)
      values.push(instanceId || null)
      paramIndex++
    }

    if (displayOrder !== undefined) {
      updates.push(`display_order = $${paramIndex}`)
      values.push(displayOrder)
      paramIndex++
    }

    if (isActive !== undefined) {
      updates.push(`is_active = $${paramIndex}`)
      values.push(isActive)
      paramIndex++
    }

    if (updates.length === 0) {
      return apiBadRequest('No fields to update')
    }

    updates.push('updated_at = NOW()')
    values.push(id)

    const result = await query(`
      UPDATE ${TABLE_NAMES.WORKSHOP_MATERIALS}
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `, values)

    logger.info('Workshop material updated', {
      materialId: id,
      updatedBy: session.user.id
    })

    return apiSuccess({
      material: result.rows[0],
      message: 'Material updated successfully'
    })

  } catch (error) {
    logger.error('Error updating workshop material', { error })
    return apiError(error, 'Failed to update material')
  }
})

// DELETE /api/admin/workshops/materials/[id] - Delete a material
export const DELETE = withAdmin<{ id: string }>(async (request, session, context) => {
  try {
    const { id } = context!.params!

    const result = await query(
      `DELETE FROM ${TABLE_NAMES.WORKSHOP_MATERIALS} WHERE id = $1 RETURNING id`,
      [id]
    )

    if (result.rowCount === 0) {
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
