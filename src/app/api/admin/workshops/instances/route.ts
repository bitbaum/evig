import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/api/middleware'
import { query, paginatedQuery } from '@/lib/auth/db'
import { apiError, apiSuccess, apiBadRequest } from '@/lib/api/helpers'
import { logger } from '@/lib/logger'
import { TABLE_NAMES } from '@/config/database'
import { WORKSHOP_REGISTRATION_STATUS } from '@/config/workshop-registration-status'
import { QueryParams } from '@/lib/api/query-builder'

interface WorkshopRow {
  id: string
  title: string
  slug: string
  max_participants: number
}

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
  confirmed_count: string
  pending_count: string
  created_at: string
}

// GET /api/admin/workshops/instances - List all workshop instances
export const GET = withAdmin('workshops-admin', async (request, session) => {
  try {
    const searchParams = request.nextUrl.searchParams
    const workshopId = searchParams.get('workshopId')
    const status = searchParams.get('status') || 'all'
    const upcoming = searchParams.get('upcoming') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const qb = new QueryParams()

    if (workshopId) qb.add('wi.workshop_id = $P', workshopId)
    if (status !== 'all') qb.add('wi.status = $P', status)
    if (upcoming) qb.addRaw('wi.start_date > NOW()')

    const { where: whereClause, params, nextIndex } = qb.build()

    const { rows: instanceRows, total } = await paginatedQuery<InstanceRow>(`
      SELECT
        wi.*,
        w.title as workshop_title,
        w.slug as workshop_slug,
        COUNT(wr.id) as current_participants,
        COUNT(CASE WHEN wr.status = '${WORKSHOP_REGISTRATION_STATUS.CONFIRMED}' THEN 1 END) as confirmed_count,
        COUNT(CASE WHEN wr.status = '${WORKSHOP_REGISTRATION_STATUS.PENDING}' THEN 1 END) as pending_count
      FROM ${TABLE_NAMES.WORKSHOP_INSTANCES} wi
      JOIN ${TABLE_NAMES.WORKSHOPS} w ON wi.workshop_id = w.id
      LEFT JOIN ${TABLE_NAMES.WORKSHOP_REGISTRATIONS} wr ON wi.id = wr.workshop_instance_id
      ${whereClause}
      GROUP BY wi.id, w.title, w.slug
      ORDER BY wi.start_date DESC
      LIMIT $${nextIndex} OFFSET $${nextIndex + 1}
    `, [...params, limit, offset])

    return apiSuccess({
      instances: instanceRows.map(inst => ({
        ...inst,
        current_participants: parseInt(inst.current_participants) || 0,
        confirmed_count: parseInt(inst.confirmed_count) || 0,
        pending_count: parseInt(inst.pending_count) || 0
      })),
      pagination: {
        total,
        limit,
        offset,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    logger.error('Error fetching workshop instances', { error })
    return apiError(error, 'Failed to fetch workshop instances')
  }
})

// POST /api/admin/workshops/instances - Create new workshop instance
export const POST = withAdmin('workshops-admin', async (request, session) => {
  try {
    const body = await request.json()
    const {
      workshopId,
      startDate,
      endDate,
      location,
      instructor,
      maxParticipants,
      notes,
      status = 'scheduled'
    } = body

    if (!workshopId || !startDate) {
      return apiBadRequest('workshopId and startDate are required')
    }

    // Verify workshop exists
    const workshopResult = await query(
      `SELECT id, title, max_participants FROM ${TABLE_NAMES.WORKSHOPS} WHERE id = $1`,
      [workshopId]
    )

    if (workshopResult.rows.length === 0) {
      return apiBadRequest('Workshop not found')
    }

    const workshop = workshopResult.rows[0] as WorkshopRow

    const result = await query(`
      INSERT INTO ${TABLE_NAMES.WORKSHOP_INSTANCES} (
        workshop_id,
        start_date,
        end_date,
        location,
        instructor,
        max_participants,
        notes,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      workshopId,
      new Date(startDate),
      endDate ? new Date(endDate) : null,
      location || 'RevampIT, Birmensdorferstr. 379, 8055 Zürich',
      instructor || null,
      maxParticipants || workshop.max_participants,
      notes || null,
      status
    ])

    logger.info('Workshop instance created', {
      instanceId: result.rows[0],
      workshopId,
      createdBy: session.user.id
    })

    return apiSuccess({
      instance: result.rows[0],
      message: 'Workshop instance created successfully'
    })

  } catch (error) {
    logger.error('Error creating workshop instance', { error })
    return apiError(error, 'Failed to create workshop instance')
  }
})
