import { NextResponse } from 'next/server'
import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import { LISTING_STATUS } from '@/config/marketplace'
import { logger } from '@/lib/logger'

export const revalidate = 300 // Cache for 5 minutes

export async function GET() {
  try {
    const [users, listings, repairs, workshops] = await Promise.all([
      query<{ count: string }>(`SELECT COUNT(*) as count FROM ${TABLE_NAMES.USERS}`),
      query<{ count: string }>(`SELECT COUNT(*) as count FROM ${TABLE_NAMES.MARKETPLACE_LISTINGS} WHERE status = $1`, [LISTING_STATUS.ACTIVE]),
      query<{ count: string }>(`SELECT COUNT(*) as count FROM ${TABLE_NAMES.IT_HILFE_REQUESTS}`),
      query<{ count: string }>(`SELECT COUNT(*) as count FROM ${TABLE_NAMES.WORKSHOPS} WHERE is_active = true`),
    ])

    return NextResponse.json({
      success: true,
      data: {
        users: Number(users.rows[0]?.count || 0),
        listings: Number(listings.rows[0]?.count || 0),
        repairs: Number(repairs.rows[0]?.count || 0),
        workshops: Number(workshops.rows[0]?.count || 0),
      },
    })
  } catch (error) {
    logger.error('Failed to fetch community stats', { error })
    return NextResponse.json({ success: false, error: 'Failed to load stats' }, { status: 500 })
  }
}
