import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/api/middleware'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess, apiNotFound, apiBadRequest } from '@/lib/api/helpers'
import { logger } from '@/lib/logger'
import { TABLE_NAMES } from '@/config/database'

interface InstanceRow {
  id: string
  workshop_id: string
  workshop_title: string
  workshop_slug: string
  start_date: string
  end_date: string | null
  location: string | null
  instructor: string | null
  max_participants: number | null
  notes: string | null
  status: string
  current_participants: string
  created_at: string
}

interface RegistrationRow {
  id: string
  user_id: string
  user_name: string
  user_email: string
  status: string
  payment_status: string
  payment_amount_cents: number | null
  registered_at: string
  attended: boolean
  rating: number | null
  feedback: string | null
}

// GET /api/admin/workshops/instances/[id] - Get instance details
export const GET = withAdmin<{ id: string }>('workshops-admin', async (request, session, context) => {
  try {
    const { id } = context!.params!

    // Get instance details
    const instanceResult = await query(`
      SELECT
        wi.*,
        w.title as workshop_title,
        w.slug as workshop_slug,
        COUNT(wr.id) as current_participants
      FROM ${TABLE_NAMES.WORKSHOP_INSTANCES} wi
      JOIN ${TABLE_NAMES.WORKSHOPS} w ON wi.workshop_id = w.id
      LEFT JOIN ${TABLE_NAMES.WORKSHOP_REGISTRATIONS} wr ON wi.id = wr.workshop_instance_id
      WHERE wi.id = $1
      GROUP BY wi.id, w.title, w.slug
    `, [id])

    if (instanceResult.rows.length === 0) {
      return apiNotFound('Workshop instance not found')
    }

    const instance = instanceResult.rows[0] as InstanceRow

    // Get registrations for this instance
    const registrationsResult = await query(`
      SELECT
        wr.*,
        u.name as user_name,
        u.email as user_email,
        wr.created_at as registered_at
      FROM ${TABLE_NAMES.WORKSHOP_REGISTRATIONS} wr
      JOIN ${TABLE_NAMES.USERS} u ON wr.user_id = u.id
      WHERE wr.workshop_instance_id = $1
      ORDER BY wr.created_at DESC
    `, [id])

    return apiSuccess({
      instance: {
        ...instance,
        current_participants: parseInt(instance.current_participants) || 0
      },
      registrations: registrationsResult.rows as RegistrationRow[]
    })

  } catch (error) {
    logger.error('Error fetching workshop instance', { error })
    return apiError(error, 'Failed to fetch workshop instance')
  }
})

// PUT /api/admin/workshops/instances/[id] - Update instance
export const PUT = withAdmin<{ id: string }>('workshops-admin', async (request, session, context) => {
  try {
    const { id } = context!.params!
    const body = await request.json()

    const {
      startDate,
      endDate,
      location,
      instructor,
      maxParticipants,
      notes,
      status
    } = body

    // Check instance exists
    const existingResult = await query(
      `SELECT id FROM ${TABLE_NAMES.WORKSHOP_INSTANCES} WHERE id = $1`,
      [id]
    )

    if (existingResult.rows.length === 0) {
      return apiNotFound('Workshop instance not found')
    }

    // Build update query
    const updates: string[] = []
    const values: (string | number | Date | null)[] = []
    let paramIndex = 1

    if (startDate !== undefined) {
      updates.push(`start_date = $${paramIndex}`)
      values.push(new Date(startDate))
      paramIndex++
    }

    if (endDate !== undefined) {
      updates.push(`end_date = $${paramIndex}`)
      values.push(endDate ? new Date(endDate) : null)
      paramIndex++
    }

    if (location !== undefined) {
      updates.push(`location = $${paramIndex}`)
      values.push(location)
      paramIndex++
    }

    if (instructor !== undefined) {
      updates.push(`instructor = $${paramIndex}`)
      values.push(instructor)
      paramIndex++
    }

    if (maxParticipants !== undefined) {
      updates.push(`max_participants = $${paramIndex}`)
      values.push(maxParticipants)
      paramIndex++
    }

    if (notes !== undefined) {
      updates.push(`notes = $${paramIndex}`)
      values.push(notes)
      paramIndex++
    }

    if (status !== undefined) {
      updates.push(`status = $${paramIndex}`)
      values.push(status)
      paramIndex++
    }

    if (updates.length === 0) {
      return apiBadRequest('No fields to update')
    }

    updates.push(`updated_at = NOW()`)
    values.push(id)

    const result = await query(`
      UPDATE ${TABLE_NAMES.WORKSHOP_INSTANCES}
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `, values)

    logger.info('Workshop instance updated', {
      instanceId: id,
      updatedBy: session.user.id,
      updates: Object.keys(body)
    })

    return apiSuccess({
      instance: result.rows[0],
      message: 'Workshop instance updated successfully'
    })

  } catch (error) {
    logger.error('Error updating workshop instance', { error })
    return apiError(error, 'Failed to update workshop instance')
  }
})

// DELETE /api/admin/workshops/instances/[id] - Delete instance
export const DELETE = withAdmin<{ id: string }>('workshops-admin', async (request, session, context) => {
  try {
    const { id } = context!.params!

    // Check for existing registrations
    const registrationsResult = await query(`
      SELECT COUNT(*) as count FROM ${TABLE_NAMES.WORKSHOP_REGISTRATIONS}
      WHERE workshop_instance_id = $1
    `, [id])

    const registrationCount = parseInt((registrationsResult.rows[0] as { count: string }).count)

    if (registrationCount > 0) {
      return apiBadRequest(
        `Cannot delete instance with ${registrationCount} registration(s). Cancel or move registrations first.`
      )
    }

    await query(
      `DELETE FROM ${TABLE_NAMES.WORKSHOP_INSTANCES} WHERE id = $1`,
      [id]
    )

    logger.info('Workshop instance deleted', {
      instanceId: id,
      deletedBy: session.user.id
    })

    return apiSuccess({
      message: 'Workshop instance deleted successfully'
    })

  } catch (error) {
    logger.error('Error deleting workshop instance', { error })
    return apiError(error, 'Failed to delete workshop instance')
  }
})
