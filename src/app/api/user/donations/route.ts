import { NextRequest } from 'next/server'
import { withAuth, ValidSession } from '@/lib/api/middleware'
import { db } from '@/db'
import {
  donations,
  inventoryItems,
  marketplaceListings,
  aiExtractedProducts,
} from '@/db/schema'
import { eq, desc, inArray } from 'drizzle-orm'
import { apiError, apiSuccess } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import {
  DONATION_TYPES,
  DONATION_JOURNEY_STAGES,
  DONATION_JOURNEY_STAGE_ORDER,
  type DonationJourneyStage,
} from '@/config/donations'
import { INTAKE_TIERS } from '@/config/intake-checklist'
import { MARKETPLACE_STATUS, INVENTORY_ITEM_STATUS } from '@/config/marketplace-status'

/**
 * GET /api/user/donations
 * Fetch current user's donation history. For device donations, joins linked
 * inventory items + marketplace listings to surface the device journey
 * (received → refurbished → listed → rehomed). Privacy: never exposes
 * buyer info, exact sold price, or recipient identity.
 */

interface JourneyItem {
  stage: DonationJourneyStage
  listing_url: string | null
  sold_at: string | null
}

interface Journey {
  total_items: number
  items: JourneyItem[]
}

function deriveStage(row: {
  intakeTier: string | null
  checklistComplete: boolean | null
  inventoryStatus: string | null
  listingStatus: string | null
}): DonationJourneyStage {
  // Rehomed wins over everything — actual hardware reached someone.
  // marketplace_listings has no SOLD status (PUBLISHED/DRAFT only); the
  // inventory_items.status flips to 'sold' when checkout completes — that's
  // the canonical signal here.
  if (row.inventoryStatus === INVENTORY_ITEM_STATUS.SOLD) {
    return DONATION_JOURNEY_STAGES.REHOMED
  }
  if (row.listingStatus === MARKETPLACE_STATUS.PUBLISHED) {
    return DONATION_JOURNEY_STAGES.LISTED
  }
  if (row.checklistComplete) {
    if (row.intakeTier === INTAKE_TIERS.PARTS) return DONATION_JOURNEY_STAGES.PARTS
    if (row.intakeTier === INTAKE_TIERS.RECYCLE) return DONATION_JOURNEY_STAGES.RECYCLED
    return DONATION_JOURNEY_STAGES.REFURBISHED
  }
  return DONATION_JOURNEY_STAGES.RECEIVED
}

export const GET = withAuth(async (_request: NextRequest, session: ValidSession) => {
  try {
    const rows = await db
      .select({
        id: donations.id,
        donation_type: donations.donationType,
        amount_cents: donations.amountCents,
        currency: donations.currency,
        payment_method: donations.paymentMethod,
        device_category: donations.deviceCategory,
        device_description: donations.deviceDescription,
        device_brand: donations.deviceBrand,
        device_model: donations.deviceModel,
        device_condition: donations.deviceCondition,
        estimated_value_cents: donations.estimatedValueCents,
        status: donations.status,
        receipt_requested: donations.receiptRequested,
        receipt_sent: donations.receiptSent,
        created_at: donations.createdAt,
      })
      .from(donations)
      .where(eq(donations.userId, session.user.id))
      .orderBy(desc(donations.createdAt))

    const deviceDonationIds = rows
      .filter(r => r.donation_type === DONATION_TYPES.DEVICE)
      .map(r => r.id)

    const journeysByDonation = new Map<string, Journey>()

    if (deviceDonationIds.length > 0) {
      // One row per (inventory item × listing). Inventory items without listings
      // appear once with listingId=null. Multiple listings per item collapse in
      // the loop below by keeping the most-advanced stage per inventory item.
      const linked = await db
        .select({
          donationId: inventoryItems.sourceDonationId,
          inventoryId: inventoryItems.id,
          inventoryStatus: inventoryItems.status,
          intakeTier: inventoryItems.intakeTier,
          checklistComplete: inventoryItems.checklistComplete,
          itemUuid: aiExtractedProducts.itemUuid,
          listingStatus: marketplaceListings.status,
          listingSoldAt: marketplaceListings.soldAt,
        })
        .from(inventoryItems)
        .leftJoin(aiExtractedProducts, eq(aiExtractedProducts.id, inventoryItems.aiProductId))
        .leftJoin(marketplaceListings, eq(marketplaceListings.inventoryItemId, inventoryItems.id))
        .where(inArray(inventoryItems.sourceDonationId, deviceDonationIds))

      // Collapse to one record per inventory item, taking the highest-stage listing.
      const byInventory = new Map<string, JourneyItem & { donationId: string }>()
      for (const r of linked) {
        if (!r.donationId || !r.inventoryId) continue
        const stage = deriveStage({
          intakeTier: r.intakeTier,
          checklistComplete: r.checklistComplete,
          inventoryStatus: r.inventoryStatus,
          listingStatus: r.listingStatus,
        })
        const listingUrl =
          r.listingStatus === MARKETPLACE_STATUS.PUBLISHED && r.itemUuid
            ? `/shop/product/${r.itemUuid}`
            : null
        const existing = byInventory.get(r.inventoryId)
        if (
          !existing ||
          DONATION_JOURNEY_STAGE_ORDER[stage] > DONATION_JOURNEY_STAGE_ORDER[existing.stage]
        ) {
          byInventory.set(r.inventoryId, {
            donationId: r.donationId,
            stage,
            listing_url: listingUrl,
            sold_at: stage === DONATION_JOURNEY_STAGES.REHOMED ? r.listingSoldAt : null,
          })
        }
      }

      for (const item of byInventory.values()) {
        const existing = journeysByDonation.get(item.donationId)
        const journeyItem: JourneyItem = {
          stage: item.stage,
          listing_url: item.listing_url,
          sold_at: item.sold_at,
        }
        if (existing) {
          existing.items.push(journeyItem)
          existing.total_items += 1
        } else {
          journeysByDonation.set(item.donationId, { total_items: 1, items: [journeyItem] })
        }
      }
    }

    const enriched = rows.map(r => {
      if (r.donation_type !== DONATION_TYPES.DEVICE) return r
      const journey = journeysByDonation.get(r.id) ?? { total_items: 0, items: [] }
      return { ...r, journey }
    })

    return apiSuccess(enriched)
  } catch (error) {
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})
