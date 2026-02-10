/**
 * Seller Dashboard API
 * GET /api/seller/dashboard - Get seller dashboard stats and products
 */

import { NextRequest } from 'next/server'
import { apiError, apiSuccess, apiUnauthorized } from '@/lib/api/helpers'
import { auth } from '@/auth'
import { ROLES } from '@/lib/constants'
import { hasAdminAccessUnified, type UnifiedUser } from '@/lib/auth/unified-permissions'
import { getSellerDashboard } from '@/lib/services/seller-service'

export async function GET(request: NextRequest) {
  try {
    // 1. Auth check
    const session = await auth()

    if (!session?.user) {
      return apiUnauthorized('Anmeldung erforderlich')
    }

    const userRole = session.user.role as string

    const user: UnifiedUser = {
      email: session.user.email || '',
      role: userRole,
      isStaff: session.user.isStaff,
      staffPermissions: session.user.staffPermissions,
      isSuperAdmin: session.user.isSuperAdmin,
    }

    const hasAccess = userRole === ROLES.SELLER || hasAdminAccessUnified(user)

    if (!hasAccess) {
      return apiUnauthorized('Seller-Berechtigung erforderlich')
    }

    // 2. Call service
    const data = await getSellerDashboard(session.user.id)

    // 3. Return response
    return apiSuccess(data)
  } catch (error) {
    return apiError(error, 'Dashboard konnte nicht geladen werden')
  }
}
