/**
 * User Profile API
 * GET /api/user/profile - Get current user's profile
 * PUT /api/user/profile - Update current user's profile
 */

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getOrCreateProfile, updateProfile } from '@/lib/auth/db'

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    const profile = await getOrCreateProfile(session.user.id)

    return NextResponse.json({ profile })
  } catch (error) {
    console.error('Get profile error:', error)
    return NextResponse.json(
      { error: 'Profil konnte nicht geladen werden' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Validate and sanitize input
    const allowedFields = [
      'first_name',
      'last_name',
      'company_name',
      'phone',
      'mobile',
      'address_line1',
      'address_line2',
      'postal_code',
      'city',
      'canton',
      'country',
      'preferred_language',
      'newsletter_subscribed',
      'interests',
    ]

    const updateData: Record<string, any> = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    const updatedProfile = await updateProfile(session.user.id, updateData)

    return NextResponse.json({
      success: true,
      profile: updatedProfile,
    })
  } catch (error: any) {
    console.error('Update profile error:', error)
    const devDetail = process.env.NODE_ENV !== 'production' ? String(error?.message || error) : undefined
    return NextResponse.json(
      { error: 'Profil konnte nicht aktualisiert werden', detail: devDetail },
      { status: 500 }
    )
  }
}







