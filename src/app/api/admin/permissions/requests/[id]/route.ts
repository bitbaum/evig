/**
 * API: Approve/Reject Permission Request
 *
 * POST /api/admin/permissions/requests/[id]
 * Super admins can approve or reject permission requests.
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { query } from '@/lib/auth/db'
import { isSuperAdmin } from '@/lib/permissions'
import { TABLE_NAMES } from '@/config/database'

interface RequestContext {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, context: RequestContext) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only super admins can approve/reject
    if (!isSuperAdmin(session.user.email)) {
      return NextResponse.json(
        { error: 'Only super admins can approve permission requests' },
        { status: 403 }
      )
    }

    const { id } = await context.params
    const body = await request.json()
    const { action, notes } = body

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Use "approve" or "reject"' },
        { status: 400 }
      )
    }

    // Get the request details
    const requestResult = await query<{
      id: string
      user_id: string
      requested_sections: string[]
      status: string
    }>(
      `SELECT id, user_id, requested_sections, status
       FROM staff_permission_requests
       WHERE id = $1`,
      [id]
    )

    if (requestResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Permission request not found' },
        { status: 404 }
      )
    }

    const permRequest = requestResult.rows[0]

    if (permRequest.status !== 'pending') {
      return NextResponse.json(
        { error: 'This request has already been processed' },
        { status: 400 }
      )
    }

    // Update the request status
    await query(
      `UPDATE staff_permission_requests
       SET status = $1,
           reviewed_by = $2,
           reviewed_at = NOW(),
           review_notes = $3
       WHERE id = $4`,
      [action === 'approve' ? 'approved' : 'rejected', session.user.id, notes || null, id]
    )

    // If approved, add the permissions to the user
    if (action === 'approve') {
      // Get current permissions
      const userResult = await query<{ staff_permissions: string[] | null }>(
        `SELECT staff_permissions FROM ${TABLE_NAMES.USERS} WHERE id = $1`,
        [permRequest.user_id]
      )

      const currentPermissions = userResult.rows[0]?.staff_permissions || []

      // Merge new permissions (avoid duplicates)
      const newPermissions = [...new Set([...currentPermissions, ...permRequest.requested_sections])]

      // Update user permissions
      await query(
        `UPDATE ${TABLE_NAMES.USERS}
         SET staff_permissions = $1,
             is_staff = true
         WHERE id = $2`,
        [newPermissions, permRequest.user_id]
      )
    }

    return NextResponse.json({
      success: true,
      message: action === 'approve'
        ? 'Permission request approved. User now has access to the requested sections.'
        : 'Permission request rejected.',
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process permission request' },
      { status: 500 }
    )
  }
}
