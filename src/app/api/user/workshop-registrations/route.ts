import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getUserWorkshopRegistrations } from '@/lib/auth/db'

export async function GET() {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    // Get user's workshop registrations
    const registrations = await getUserWorkshopRegistrations(session.user.id)

    return NextResponse.json({
      success: true,
      registrations: registrations.map(reg => ({
        ...reg,
        created_at: reg.created_at.toISOString(),
        updated_at: reg.updated_at.toISOString(),
        confirmed_at: reg.confirmed_at?.toISOString() || null,
        cancelled_at: reg.cancelled_at?.toISOString() || null,
      }))
    })

  } catch (error) {
    console.error('Error fetching workshop registrations:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}







