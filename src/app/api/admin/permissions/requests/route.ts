/**
 * API: List Permission Requests
 *
 * GET /api/admin/permissions/requests
 * Super admins can see all pending permission requests.
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { query } from '@/lib/auth/db'
import { isSuperAdmin } from '@/lib/permissions'
import { TABLE_NAMES } from '@/config/database'

interface PermissionRequest {
  id: string
  user_id: string
  user_name: string | null
  user_email: string
  requested_sections: string[]
  reason: string
  status: string
  created_at: string
  reviewed_by: string | null
  reviewer_name: string | null
  reviewed_at: string | null
  review_notes: string | null
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only super admins can view permission requests
    if (!isSuperAdmin(session.user.email)) {
      return NextResponse.json(
        { error: 'Only super admins can view permission requests' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'pending'

    const result = await query<PermissionRequest>(
      `SELECT
        r.id,
        r.user_id,
        u.name as user_name,
        u.email as user_email,
        r.requested_sections,
        r.reason,
        r.status,
        r.created_at,
        r.reviewed_by,
        rev.name as reviewer_name,
        r.reviewed_at,
        r.review_notes
       FROM staff_permission_requests r
       JOIN ${TABLE_NAMES.USERS} u ON r.user_id = u.id
       LEFT JOIN ${TABLE_NAMES.USERS} rev ON r.reviewed_by = rev.id
       WHERE r.status = $1
       ORDER BY r.created_at DESC
       LIMIT 100`,
      [status]
    )

    return NextResponse.json({
      success: true,
      requests: result.rows,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch permission requests' },
      { status: 500 }
    )
  }
}
