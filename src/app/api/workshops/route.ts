import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { TABLE_NAMES } from '@/config/database'

interface WorkshopRow {
  id: string
  slug: string
  title: string
  description: string | null
  category: string | null
  duration: string | null
  level: string | null
  max_participants: number
  price_cents: number
  is_active: boolean
  created_at: string
}

interface InstanceRow {
  id: string
  workshop_id: string
  start_date: string
  end_date: string | null
  location: string | null
  max_participants: number | null
  status: string
  current_participants: string
  created_at: string
  updated_at: string
}

interface RegistrationRow {
  workshop_id: string
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const activeOnly = searchParams.get('active') !== 'false'
    const includeInstances = searchParams.get('include') === 'instances'

    let whereClause = activeOnly ? 'WHERE is_active = true' : ''
    const params: string[] = []

    if (category) {
      whereClause += whereClause ? ' AND' : 'WHERE'
      whereClause += ' category = $1'
      params.push(category)
    }

    const workshops = await query<WorkshopRow>(`
      SELECT
        id,
        slug,
        title,
        description,
        category,
        duration,
        level,
        max_participants,
        price_cents,
        is_active,
        created_at
      FROM ${TABLE_NAMES.WORKSHOPS}
      ${whereClause}
      ORDER BY created_at DESC
    `, params)

    if (!includeInstances) {
      return apiSuccess(workshops.rows)
    }

    // Fetch all instances for all workshops in one query
    const workshopIds = workshops.rows.map(w => w.id)

    if (workshopIds.length === 0) {
      return apiSuccess([])
    }

    const placeholders = workshopIds.map((_, i) => `$${i + 1}`).join(', ')

    const instances = await query<InstanceRow>(`
      SELECT
        wi.id,
        wi.workshop_id,
        wi.start_date,
        wi.end_date,
        wi.location,
        wi.max_participants,
        wi.status,
        wi.created_at,
        wi.updated_at,
        COUNT(wr.id) as current_participants
      FROM ${TABLE_NAMES.WORKSHOP_INSTANCES} wi
      LEFT JOIN ${TABLE_NAMES.WORKSHOP_REGISTRATIONS} wr ON wi.id = wr.workshop_instance_id
      WHERE wi.workshop_id IN (${placeholders})
      GROUP BY wi.id
      ORDER BY wi.start_date ASC
    `, workshopIds)

    // Check user registrations in one query (if logged in)
    const session = await auth()
    const registeredWorkshopIds = new Set<string>()

    if (session?.user?.id) {
      const registrations = await query<RegistrationRow>(`
        SELECT DISTINCT wi.workshop_id
        FROM ${TABLE_NAMES.WORKSHOP_REGISTRATIONS} wr
        JOIN ${TABLE_NAMES.WORKSHOP_INSTANCES} wi ON wr.workshop_instance_id = wi.id
        WHERE wr.user_id = $1 AND wi.workshop_id IN (${workshopIds.map((_, i) => `$${i + 2}`).join(', ')})
      `, [session.user.id, ...workshopIds])

      for (const reg of registrations.rows) {
        registeredWorkshopIds.add(reg.workshop_id)
      }
    }

    // Group instances by workshop_id
    const instancesByWorkshop = new Map<string, InstanceRow[]>()
    for (const inst of instances.rows) {
      const list = instancesByWorkshop.get(inst.workshop_id) || []
      list.push(inst)
      instancesByWorkshop.set(inst.workshop_id, list)
    }

    // Assemble response
    const result = workshops.rows.map(workshop => ({
      ...workshop,
      instances: (instancesByWorkshop.get(workshop.id) || []).map(inst => ({
        ...inst,
        current_participants: parseInt(inst.current_participants) || 0
      })),
      user_registered: registeredWorkshopIds.has(workshop.id)
    }))

    return apiSuccess(result)

  } catch (error) {
    // Handle database connection errors gracefully
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (errorMessage.includes('connect') || errorMessage.includes('ECONNREFUSED') || errorMessage.includes('timeout')) {
      return apiSuccess([])
    }
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}
