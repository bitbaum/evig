/**
 * User Registration API
 * POST /api/auth/register
 */

import { NextResponse } from 'next/server'
import { registerUser } from '@/auth'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password, name, role } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'E-Mail und Passwort sind erforderlich' },
        { status: 400 }
      )
    }

    const result = await registerUser({ email, password, name, role })

    if (!result.success) {
      return NextResponse.json(
        { 
          error: result.error,
          errors: result.errors 
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Konto erfolgreich erstellt',
      user: result.user,
    })
  } catch (error) {
    console.error('Registration API error:', error)
    return NextResponse.json(
      { error: 'Ein unerwarteter Fehler ist aufgetreten' },
      { status: 500 }
    )
  }
}


