import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { query } from '@/lib/auth/db'

// Cancel workshop registration (set status = 'cancelled')
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

    if (body && (body.feedback !== undefined || body.rating !== undefined)) {
      const updates: string[] = []
      const paramsArr: any[] = []
      let p = 1

      if (body.feedback !== undefined) {
        updates.push(`feedback = $${p++}`)
        paramsArr.push(String(body.feedback))
      }
      if (body.rating !== undefined) {
        const r = Number(body.rating)
        if (!Number.isFinite(r) || r < 1 || r > 5) {
          return NextResponse.json({ error: 'Ungültige Bewertung (1-5)' }, { status: 400 })
        }
        updates.push(`rating = $${p++}`)
        paramsArr.push(Math.round(r))
      }

      paramsArr.push(id, session.user.id)
      const res = await query(
        `UPDATE workshop_registrations
         SET ${updates.join(', ')}, updated_at = NOW()
         WHERE id = $${p++} AND user_id = $${p}
         RETURNING id`,
        paramsArr
      )

      if (res.rowCount === 0) {
        return NextResponse.json({ error: 'Anmeldung nicht gefunden' }, { status: 404 })
      }
      return NextResponse.json({ ok: true })
    }

    // Default action: cancel registration if not already cancelled
    const res = await query(
      `UPDATE workshop_registrations
       SET status = 'cancelled', cancelled_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND user_id = $2 AND status != 'cancelled'
       RETURNING id` ,
      [id, session.user.id]
    )

    if (res.rowCount === 0) {
      return NextResponse.json({ error: 'Anmeldung nicht gefunden oder bereits storniert' }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Cancel registration error', e)
    return NextResponse.json({ error: 'Stornierung fehlgeschlagen' }, { status: 500 })
  }
}
