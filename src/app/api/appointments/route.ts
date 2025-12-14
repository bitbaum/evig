import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { query } from '@/lib/auth/db'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    const { serviceSlug, description, urgency = 'normal' } = await request.json()

    if (!serviceSlug) {
      return NextResponse.json({ error: 'Service-Slug erforderlich' }, { status: 400 })
    }

    // Find the service type
    const services = await query(
      'SELECT id, name, requires_approval FROM service_types WHERE slug = $1',
      [serviceSlug]
    )

    if (services.rows.length === 0) {
      return NextResponse.json({ error: 'Service nicht gefunden' }, { status: 404 })
    }

    const service = services.rows[0]

    // Create the appointment
    const appointmentResult = await query(
      `INSERT INTO service_appointments (user_id, service_type_id, description, urgency, status)
       VALUES ($1, $2, $3, $4, 'requested')
       RETURNING id, created_at`,
      [session.user.id, service.id, description || null, urgency]
    )

    return NextResponse.json({
      success: true,
      message: service.requires_approval
        ? 'Terminanfrage eingereicht. Wir kontaktieren Sie bald für die Terminbestätigung.'
        : 'Termin erfolgreich gebucht!',
      appointmentId: appointmentResult.rows[0].id,
      serviceName: service.name,
      requiresApproval: service.requires_approval
    })

  } catch (error) {
    console.error('Service appointment error:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}

export async function GET() {
  try {
    // Check authentication
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    // Get user's appointments
    const appointments = await query(
      `SELECT
         sa.*,
         st.name as service_name,
         st.slug as service_slug,
         st.duration_minutes,
         st.price_cents
       FROM service_appointments sa
       JOIN service_types st ON sa.service_type_id = st.id
       WHERE sa.user_id = $1
       ORDER BY sa.created_at DESC`,
      [session.user.id]
    )

    return NextResponse.json({
      success: true,
      appointments: appointments.rows.map(apt => ({
        ...apt,
        created_at: apt.created_at.toISOString(),
        preferred_date: apt.preferred_date?.toISOString() || null,
        confirmed_date: apt.confirmed_date?.toISOString() || null,
        updated_at: apt.updated_at.toISOString(),
      }))
    })

  } catch (error) {
    console.error('Error fetching appointments:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}







