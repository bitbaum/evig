import { NextRequest, NextResponse } from 'next/server'
import { getUserByEmail, query } from '@/lib/auth/db'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email) {
      return NextResponse.json({ error: 'E-Mail erforderlich' }, { status: 400 })
    }

    const user = await getUserByEmail(email)
    if (!user) {
      return NextResponse.json({
        ok: true,
        exists: false,
        reason: 'EMAIL_NOT_FOUND'
      })
    }

    // Check lockout (DB-backed)
    let locked = false
    let lockedUntil: string | null = null
    try {
      const res = await query<{ locked_until: Date | null }>(
        'SELECT locked_until FROM user_lockouts WHERE user_id = $1',
        [user.id]
      )
      const rec = res.rows[0]
      if (rec?.locked_until && new Date(rec.locked_until) > new Date()) {
        locked = true
        lockedUntil = new Date(rec.locked_until).toISOString()
      }
    } catch {}

    return NextResponse.json({
      ok: true,
      exists: true,
      emailVerified: !!user.emailVerified,
      hasPassword: !!user.password_hash,
      locked,
      lockedUntil,
    })
  } catch (e) {
    return NextResponse.json({ error: 'Statusprüfung fehlgeschlagen' }, { status: 500 })
  }
}

