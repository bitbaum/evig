/**
 * API: Manage User Permissions
 *
 * PATCH /api/admin/users/[id]/permissions
 * Super admins can update staff permissions and super admin status.
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { query } from '@/lib/auth/db'
import { isSuperAdmin, ADMIN_SECTIONS, SUPER_ADMIN_EMAILS, type AdminSection } from '@/lib/permissions'
import { TABLE_NAMES } from '@/config/database'

interface RequestContext {
  params: Promise<{ id: string }>
}

export async function PATCH(request: NextRequest, context: RequestContext) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only super admins can manage permissions
    if (!isSuperAdmin(session.user.email, session.user.isSuperAdmin)) {
      return NextResponse.json(
        { error: 'Only super admins can manage permissions' },
        { status: 403 }
      )
    }

    const { id } = await context.params
    const body = await request.json()
    const { permissions, isSuperAdmin: newSuperAdminStatus } = body

    // Validate permissions if provided
    if (permissions !== undefined) {
      if (!Array.isArray(permissions)) {
        return NextResponse.json(
          { error: 'Permissions must be an array' },
          { status: 400 }
        )
      }

      // Validate each permission
      const validSections = Object.keys(ADMIN_SECTIONS) as AdminSection[]
      const invalidPermissions = permissions.filter(
        (p: string) => p !== '*' && !validSections.includes(p as AdminSection)
      )
      if (invalidPermissions.length > 0) {
        return NextResponse.json(
          { error: `Invalid permissions: ${invalidPermissions.join(', ')}` },
          { status: 400 }
        )
      }
    }

    // Get current user info
    const userResult = await query<{
      id: string
      email: string
      is_super_admin: boolean
    }>(
      `SELECT id, email, is_super_admin FROM ${TABLE_NAMES.USERS} WHERE id = $1`,
      [id]
    )

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const targetUser = userResult.rows[0]

    // Prevent demoting users who are in the hardcoded super admin list
    if (newSuperAdminStatus === false && SUPER_ADMIN_EMAILS.includes(targetUser.email.toLowerCase() as typeof SUPER_ADMIN_EMAILS[number])) {
      return NextResponse.json(
        { error: 'Cannot demote a user who is in the core super admin list' },
        { status: 400 }
      )
    }

    // Prevent self-demotion
    if (newSuperAdminStatus === false && targetUser.id === session.user.id) {
      return NextResponse.json(
        { error: 'You cannot demote yourself' },
        { status: 400 }
      )
    }

    // Build the update query
    const updates: string[] = []
    const values: (string | string[] | boolean)[] = []
    let paramIndex = 1

    if (permissions !== undefined) {
      updates.push(`staff_permissions = $${paramIndex}`)
      values.push(permissions)
      paramIndex++

      // Also set is_staff = true if granting permissions
      if (permissions.length > 0) {
        updates.push(`is_staff = true`)
      }
    }

    if (newSuperAdminStatus !== undefined) {
      updates.push(`is_super_admin = $${paramIndex}`)
      values.push(newSuperAdminStatus)
      paramIndex++
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No updates provided' },
        { status: 400 }
      )
    }

    values.push(id)

    await query(
      `UPDATE ${TABLE_NAMES.USERS}
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex}`,
      values
    )

    return NextResponse.json({
      success: true,
      message: 'User permissions updated successfully',
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update user permissions' },
      { status: 500 }
    )
  }
}
