import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess, apiNotFound } from '@/lib/api/helpers'
import { logger } from '@/lib/logger'
import { TABLE_NAMES } from '@/config/database'

interface MaterialRow {
  id: string
  title: string
  description: string | null
  material_type: string
  url: string
  file_size_bytes: number | null
  access_type: string
  display_order: number
  created_at: string
}

interface RegistrationRow {
  status: string
  attended: boolean
}

// GET /api/workshops/[slug]/materials - Get materials for a workshop (respecting access levels)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth()
    const { slug } = await params

    // Get the workshop
    const workshopResult = await query(
      `SELECT id, title FROM ${TABLE_NAMES.WORKSHOPS} WHERE slug = $1 AND is_active = true`,
      [slug]
    )

    if (workshopResult.rows.length === 0) {
      return apiNotFound('Workshop')
    }

    const workshop = workshopResult.rows[0] as { id: string; title: string }

    // Determine user's access level
    let accessLevel: 'public' | 'registered' | 'attended' = 'public'

    if (session?.user?.id) {
      // Check if user has registered for this workshop
      const registrationResult = await query(`
        SELECT wr.status, wr.attended
        FROM ${TABLE_NAMES.WORKSHOP_REGISTRATIONS} wr
        JOIN ${TABLE_NAMES.WORKSHOP_INSTANCES} wi ON wr.workshop_instance_id = wi.id
        WHERE wi.workshop_id = $1 AND wr.user_id = $2
        ORDER BY wr.created_at DESC
        LIMIT 1
      `, [workshop.id, session.user.id])

      if (registrationResult.rows.length > 0) {
        const registration = registrationResult.rows[0] as RegistrationRow
        if (registration.attended || registration.status === 'attended') {
          accessLevel = 'attended'
        } else if (['confirmed', 'pending'].includes(registration.status)) {
          accessLevel = 'registered'
        }
      }
    }

    // Build access conditions based on user's level
    // attended can see: public, registered, attended
    // registered can see: public, registered
    // public can see: public only
    let accessCondition: string
    if (accessLevel === 'attended') {
      accessCondition = "access_type IN ('public', 'registered', 'attended')"
    } else if (accessLevel === 'registered') {
      accessCondition = "access_type IN ('public', 'registered')"
    } else {
      accessCondition = "access_type = 'public'"
    }

    const materialsResult = await query(`
      SELECT
        id,
        title,
        description,
        material_type,
        url,
        file_size_bytes,
        access_type,
        display_order,
        created_at
      FROM ${TABLE_NAMES.WORKSHOP_MATERIALS}
      WHERE workshop_id = $1
        AND is_active = true
        AND ${accessCondition}
      ORDER BY display_order ASC, created_at DESC
    `, [workshop.id])

    return apiSuccess({
      materials: materialsResult.rows as MaterialRow[],
      accessLevel,
      workshopTitle: workshop.title
    })

  } catch (error) {
    logger.error('Error fetching workshop materials', { error })
    return apiError(error, 'Materialien konnten nicht geladen werden')
  }
}
