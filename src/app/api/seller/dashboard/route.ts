/**
 * Seller Dashboard API
 * GET /api/seller/dashboard - Get seller dashboard stats and products
 */

import { NextRequest } from 'next/server'
import { apiError, apiSuccess, apiUnauthorized } from '@/lib/api/helpers'
import { withAuth } from '@/lib/api/middleware'
import { ROLES } from '@/lib/constants'
import { getSellerDashboard } from '@/lib/services/seller-service'

export const GET = withAuth(async (request, session) => {
  try {
    const userRole = session.user.role as string

    const hasAccess = userRole === ROLES.SELLER || session.user.isStaff

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
})
