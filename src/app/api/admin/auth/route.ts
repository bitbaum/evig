import { auth } from '@/auth'
import { apiSuccess, apiUnauthorized } from '@/lib/api/helpers'

export const dynamic = 'force-dynamic'

/**
 * Admin auth check — delegates to Auth.js session.
 * Legacy CMS JWT login has been removed. Use /auth/signin instead.
 */
export async function GET() {
  const session = await auth()

  if (!session?.user?.id) {
    return apiUnauthorized('Not authenticated')
  }

  return apiSuccess({
    authenticated: true,
    user: {
      email: session.user.email,
      role: session.user.isStaff ? 'admin' : 'user',
    },
  })
}
