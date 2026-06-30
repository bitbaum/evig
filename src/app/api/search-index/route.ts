import { NextRequest } from 'next/server'
import { withAuth, ValidSession } from '@/lib/api/middleware'
import { db } from '@/db'
import { sql } from 'drizzle-orm'
import { TABLE_NAMES } from '@/config/database'
import { logger } from '@/lib/logger'
import { apiSuccess, apiError } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'

/**
 * GET /api/search-index — compact, user-scoped index for the command palette.
 *
 * Mirrors the admin search-index route: every query runs through
 * Promise.allSettled so one failing entity degrades to an empty array
 * rather than 500-ing the whole palette. Table names come from TABLE_NAMES
 * (sql.raw, never bound); the session user id is always a bound parameter.
 */
export const GET = withAuth(async (_request: NextRequest, session: ValidSession) => {
  try {
    const userId = session.user.id

    const [
      myListingsResult,
      myOrdersResult,
      favoritesResult,
      marketplaceResult,
      workshopsResult,
    ] = await Promise.allSettled([
      // 1. My own listings (any status except removed), newest first
      db.execute(sql`
        SELECT id, title, status
        FROM ${sql.raw(TABLE_NAMES.LISTINGS)}
        WHERE seller_id = ${userId}
          AND status != 'removed'
        ORDER BY created_at DESC
        LIMIT 25
      `),
      // 2. My orders as buyer OR seller. Single-item orders carry the listing
      //    title; cart orders (listing_id null) fall back to the first item's
      //    title — same COALESCE join /api/marketplace/orders uses.
      db.execute(sql`
        SELECT mo.id AS id,
               COALESCE(l.title, (
                 SELECT it.title
                 FROM ${sql.raw(TABLE_NAMES.MARKETPLACE_ORDER_ITEMS)} it
                 WHERE it.order_id = mo.id
                 ORDER BY it.created_at
                 LIMIT 1
               )) AS title,
               mo.status AS status
        FROM ${sql.raw(TABLE_NAMES.MARKETPLACE_ORDERS)} mo
        LEFT JOIN ${sql.raw(TABLE_NAMES.LISTINGS)} l ON mo.listing_id = l.id
        WHERE mo.buyer_id = ${userId} OR mo.seller_id = ${userId}
        ORDER BY mo.created_at DESC
        LIMIT 25
      `),
      // 3. Favorited listings, newest favorite first
      db.execute(sql`
        SELECT l.id AS id, l.title AS title
        FROM ${sql.raw(TABLE_NAMES.LISTING_FAVORITES)} f
        JOIN ${sql.raw(TABLE_NAMES.LISTINGS)} l ON f.listing_id = l.id
        WHERE f.user_id = ${userId}
        ORDER BY f.created_at DESC
        LIMIT 25
      `),
      // 4. Recent public active listings — for client-side palette filtering
      db.execute(sql`
        SELECT id, title, price_chf
        FROM ${sql.raw(TABLE_NAMES.LISTINGS)}
        WHERE status = 'active'
        ORDER BY created_at DESC
        LIMIT 50
      `),
      // 5. Published workshops (is_active is the public visibility flag — same
      //    filter /api/workshops uses; workshop dates live on workshop_instances,
      //    not on the workshop row itself).
      db.execute(sql`
        SELECT id, slug, title
        FROM ${sql.raw(TABLE_NAMES.WORKSHOPS)}
        WHERE is_active = true
        ORDER BY created_at DESC
        LIMIT 25
      `),
    ])

    type Row = Record<string, unknown>

    const myListings = myListingsResult.status === 'fulfilled'
      ? (myListingsResult.value.rows as Row[]).map(r => ({
          id: String(r.id ?? ''),
          title: String(r.title ?? ''),
          status: String(r.status ?? ''),
        }))
      : []

    const myOrders = myOrdersResult.status === 'fulfilled'
      ? (myOrdersResult.value.rows as Row[]).map(r => ({
          id: String(r.id ?? ''),
          title: String(r.title ?? ''),
          status: String(r.status ?? ''),
        }))
      : []

    const favorites = favoritesResult.status === 'fulfilled'
      ? (favoritesResult.value.rows as Row[]).map(r => ({
          id: String(r.id ?? ''),
          title: String(r.title ?? ''),
        }))
      : []

    const marketplace = marketplaceResult.status === 'fulfilled'
      ? (marketplaceResult.value.rows as Row[]).map(r => ({
          id: String(r.id ?? ''),
          title: String(r.title ?? ''),
          price_chf: r.price_chf == null ? null : String(r.price_chf),
        }))
      : []

    const workshops = workshopsResult.status === 'fulfilled'
      ? (workshopsResult.value.rows as Row[]).map(r => ({
          id: String(r.id ?? ''),
          slug: String(r.slug ?? ''),
          title: String(r.title ?? ''),
        }))
      : []

    if (myListingsResult.status === 'rejected') {
      logger.warn('search-index: myListings query failed', { error: myListingsResult.reason })
    }
    if (myOrdersResult.status === 'rejected') {
      logger.warn('search-index: myOrders query failed', { error: myOrdersResult.reason })
    }
    if (favoritesResult.status === 'rejected') {
      logger.warn('search-index: favorites query failed', { error: favoritesResult.reason })
    }
    if (marketplaceResult.status === 'rejected') {
      logger.warn('search-index: marketplace query failed', { error: marketplaceResult.reason })
    }
    if (workshopsResult.status === 'rejected') {
      logger.warn('search-index: workshops query failed', { error: workshopsResult.reason })
    }

    return apiSuccess({ myListings, myOrders, favorites, marketplace, workshops })
  } catch (error) {
    logger.error('search-index GET failed', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})
