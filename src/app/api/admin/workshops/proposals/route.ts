import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess, apiBadRequest, apiUnauthorized, apiForbidden } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { TABLE_NAMES } from '@/config/database'
import { getUserRole } from '@/lib/api/role-checks'
import { isAdminRole } from '@/lib/constants'

interface CountRow {
  total: string
}

// GET /api/admin/workshops/proposals - List workshop proposals with filtering
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return apiUnauthorized(ERROR_MESSAGES.UNAUTHORIZED)
    }

    // Check if user has admin permissions
    const userRole = await getUserRole(session.user.id)
    const hasAdminPermission = isAdminRole(userRole) || userRole === 'moderator'

    if (!hasAdminPermission) {
      return apiForbidden('Keine Berechtigung für Workshop-Verwaltung')
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'pending'
    const category = searchParams.get('category')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query conditions
    const conditions = []
    const params = []

    if (status !== 'all') {
      conditions.push(`wp.status = $${conditions.length + 1}`)
      params.push(status)
    }

    if (category) {
      conditions.push(`wp.category = $${conditions.length + 1}`)
      params.push(category)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    // Get workshop proposals with proposer info
    const proposalsQuery = `
      SELECT
        wp.*,
        u.name as proposer_name,
        u.email as proposer_email,
        l.name as selected_location_name
      FROM ${TABLE_NAMES.WORKSHOP_PROPOSALS} wp
      LEFT JOIN ${TABLE_NAMES.USERS} u ON wp.user_id = u.id
      LEFT JOIN ${TABLE_NAMES.LOCATIONS} l ON wp.selected_location_id = l.id
      ${whereClause}
      ORDER BY wp.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `

    params.push(limit, offset)

    const proposals = await query(proposalsQuery, params)

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM ${TABLE_NAMES.WORKSHOP_PROPOSALS} wp
      ${whereClause.replace(/\$\d+/g, (match) => {
        const index = parseInt(match.slice(1)) - 1
        return `$${index + 1}`
      })}
    `
    const countParams = params.slice(0, -2) // Remove limit and offset
    const countResult = await query(countQuery, countParams)

    const count = countResult.rows[0] as CountRow
    return apiSuccess({
      proposals: proposals.rows,
      pagination: {
        total: parseInt(count.total),
        limit,
        offset,
        hasMore: offset + limit < parseInt(count.total)
      }
    })

  } catch (error) {
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}