import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/api/middleware'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess, apiBadRequest } from '@/lib/api/helpers'
import { logger } from '@/lib/logger'
import { TABLE_NAMES } from '@/config/database'

interface MaterialRow {
  id: string
  workshop_id: string
  instance_id: string | null
  title: string
  description: string | null
  material_type: string
  url: string
  file_size_bytes: number | null
  access_type: string
  display_order: number
  is_active: boolean
  created_at: string
}

// GET /api/admin/workshops/[workshopId]/materials - List all materials for a workshop
export const GET = withAdmin<{ workshopId: string }>('workshops-admin', async (request, session, context) => {
  try {
    const { workshopId } = context!.params!

    const materialsResult = await query(`
      SELECT id, workshop_id, instance_id, title, description, material_type,
             url, file_size_bytes, access_type, display_order, is_active, created_at
      FROM ${TABLE_NAMES.WORKSHOP_MATERIALS}
      WHERE workshop_id = $1
      ORDER BY display_order ASC, created_at DESC
    `, [workshopId])

    return apiSuccess({
      materials: materialsResult.rows as MaterialRow[]
    })

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

    const result = await query(`
      INSERT INTO ${TABLE_NAMES.WORKSHOP_MATERIALS} (
        workshop_id,
        instance_id,
        title,
        description,
        material_type,
        url,
        file_size_bytes,
        access_type,
        display_order,
        uploaded_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      workshopId,
      instanceId || null,
      title.trim(),
      description?.trim() || null,
      materialType,
      url.trim(),
      fileSizeBytes || null,
      accessType,
      displayOrder,
      session.user.id
    ])

    logger.info('Workshop material added', {
      workshopId,
      materialId: (result.rows[0] as MaterialRow).id,
      addedBy: session.user.id
    })

    return apiSuccess({
      material: result.rows[0],
      message: 'Material added successfully'
    })

  } catch (error) {
    logger.error('Error adding workshop material', { error })
    return apiError(error, 'Failed to add material')
  }
})
