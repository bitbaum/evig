import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { query } from '@/lib/auth/db'

// Cancel a service appointment (set status = 'cancelled')
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })
    }

    const { id } = params
    let body: any = null
    try {
      body = await req.json()
    } catch {
      body = null
    }

    if (body && (body.description !== undefined || body.preferred_date !== undefined)) {
      // Allow editing details only while requested
      const updates: string[] = []
      const paramsArr: any[] = []
      let p = 1

      if (body.description !== undefined) {
        updates.push(`description = $${p++}`)
        paramsArr.push(String(body.description))
      }
      if (body.preferred_date !== undefined) {
        const d = new Date(body.preferred_date)
        if (isNaN(d.getTime())) {
          return NextResponse.json({ error: 'Ungültiges Datum' }, { status: 400 })
        }
        updates.push(`preferred_date = $${p++}`)
        paramsArr.push(d)
      }

      paramsArr.push(id, session.user.id)
      const resUpdate = await query(
        `UPDATE service_appointments
         SET ${updates.join(', ')}, updated_at = NOW()
         WHERE id = $${p++} AND user_id = $${p} AND status = 'requested'
         RETURNING id`,
        paramsArr
      )
      if (resUpdate.rowCount === 0) {
        return NextResponse.json({ error: 'Termin nicht bearbeitbar' }, { status: 400 })
      }
      return NextResponse.json({ ok: true })
    }

    const res = await query(
      `UPDATE service_appointments
       SET status = 'cancelled', updated_at = NOW()
       WHERE id = $1 AND user_id = $2 AND status != 'cancelled'
       RETURNING id`,
      [id, session.user.id]
    )

    if (res.rowCount === 0) {
      return NextResponse.json({ error: 'Termin nicht gefunden oder bereits storniert' }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Cancel appointment error', e)
    return NextResponse.json({ error: 'Stornierung fehlgeschlagen' }, { status: 500 })
  }
}
