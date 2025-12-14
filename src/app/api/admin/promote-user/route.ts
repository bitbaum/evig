/**
 * Promote User to Admin API
 * POST /api/admin/promote-user
 */

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { query } from '@/lib/auth/db'

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { userId, email } = body

    if (!userId && !email) {
      return NextResponse.json(
        { error: 'User ID or email required' },
        { status: 400 }
      )
    }

    // Find user by ID or email
    let userIdToPromote = userId
    if (email && !userId) {
      const userResult = await query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      )
      if (userResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }
      userIdToPromote = userResult.rows[0].id
    }

    // Update user role to admin
    const updateResult = await query(
      'UPDATE users SET role = $1, "updatedAt" = NOW() WHERE id = $2',
      ['admin', userIdToPromote]
    )

    if (updateResult.rowCount === 0) {
      return NextResponse.json(
        { error: 'User not found or already admin' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'User promoted to admin successfully',
      userId: userIdToPromote,
    })
  } catch (error) {
    console.error('Promote user error:', error)
    return NextResponse.json(
      { error: 'Failed to promote user' },
      { status: 500 }
    )
  }
}






