/**
 * API: Staff Permission Request
 *
 * POST /api/admin/permissions/request
 * Allows staff to request access to admin sections they don't have.
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { query } from '@/lib/auth/db'
import { isStaffEmail, ADMIN_SECTIONS, type AdminSection } from '@/lib/permissions'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only staff can request permissions
    if (!session.user.isStaff && !isStaffEmail(session.user.email)) {
      return NextResponse.json(
        { error: 'Only staff members can request permissions' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { sections, reason } = body

    // Validate sections
    if (!Array.isArray(sections) || sections.length === 0) {
      return NextResponse.json(
        { error: 'At least one section is required' },
        { status: 400 }
      )
    }

    // Validate that all sections are valid
    const validSections = Object.keys(ADMIN_SECTIONS) as AdminSection[]
    const invalidSections = sections.filter((s: string) => !validSections.includes(s as AdminSection))
    if (invalidSections.length > 0) {
      return NextResponse.json(
        { error: `Invalid sections: ${invalidSections.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate reason
    if (!reason || typeof reason !== 'string' || reason.trim().length < 10) {
      return NextResponse.json(
        { error: 'Please provide a reason (at least 10 characters)' },
        { status: 400 }
      )
    }

    // Check if user already has a pending request for any of these sections
    const existingResult = await query<{ id: string }>(
      `SELECT id FROM staff_permission_requests
       WHERE user_id = $1
       AND status = 'pending'
       AND requested_sections && $2`,
      [session.user.id, sections]
    )

    if (existingResult.rows.length > 0) {
      return NextResponse.json(
        { error: 'You already have a pending request for one or more of these sections' },
        { status: 400 }
      )
    }

    // Create the permission request
    const result = await query<{ id: string }>(
      `INSERT INTO staff_permission_requests (user_id, requested_sections, reason)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [session.user.id, sections, reason.trim()]
    )

    return NextResponse.json({
      success: true,
      requestId: result.rows[0].id,
      message: 'Permission request submitted. A super admin will review it.',
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to submit permission request' },
      { status: 500 }
    )
  }
}
