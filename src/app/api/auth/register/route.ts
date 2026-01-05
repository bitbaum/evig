/**
 * User Registration API
 * POST /api/auth/register
 */

import { Request } from 'next/server'
import { registerUser } from '@/auth'
import { apiError, apiSuccess, apiBadRequest } from '@/lib/api/helpers'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password, name, role } = body

    if (!email || !password) {
      return apiBadRequest('E-Mail und Passwort sind erforderlich')
    }

    try {
      const result = await registerUser({ email, password, name, role })

      if (!result.success) {
        return apiBadRequest(
          result.error || 'Registration failed',
          result.errors
        )
      }

      return apiSuccess({
        message: 'Konto erfolgreich erstellt',
        user: result.user,
      })
    } catch (dbError) {
      // Handle database connection errors gracefully
      const errorMessage = dbError instanceof Error ? dbError.message : String(dbError)
      if (errorMessage.includes('connect') || errorMessage.includes('ECONNREFUSED') || errorMessage.includes('timeout')) {
        return apiError(
          new Error('Database connection failed'),
          'Datenbankverbindung fehlgeschlagen. Bitte versuchen Sie es später erneut.',
          503
        )
      }
      throw dbError
    }
  } catch (error) {
    return apiError(error, 'Ein unerwarteter Fehler ist aufgetreten')
  }
}


