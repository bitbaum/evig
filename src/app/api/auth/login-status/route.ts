import { NextRequest, NextResponse } from 'next/server'
import { getUserByEmail, query } from '@/lib/auth/db'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email) {
      return NextResponse.json({ error: 'E-Mail erforderlich' }, { status: 400 })
    }

    try {
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
      } catch {
        // Lockout table might not exist, ignore
      }

      return NextResponse.json({
        ok: true,
        exists: true,
        emailVerified: !!user.emailVerified,
        hasPassword: !!user.password_hash,
        locked,
        lockedUntil,
      })
    } catch (dbError) {
      // Handle database connection errors gracefully
      const errorMessage = dbError instanceof Error ? dbError.message : String(dbError)
      if (errorMessage.includes('connect') || errorMessage.includes('ECONNREFUSED') || errorMessage.includes('timeout')) {
        return NextResponse.json({ 
          error: 'Datenbankverbindung fehlgeschlagen. Bitte versuchen Sie es später erneut.',
          dbError: true 
        }, { status: 503 })
      }
      throw dbError
    }
  } catch (e) {
    logger.error('Login status check error', { error: e })
    return NextResponse.json({ error: 'Statusprüfung fehlgeschlagen' }, { status: 500 })
  }
}

