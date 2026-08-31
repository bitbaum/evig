import { and, eq, inArray, sql } from 'drizzle-orm';
import { listings, marketplaceOrderItems, marketplaceOrders, sellerProfiles } from '@/db/schema';
import { LISTING_STATUS, ORDER_STATUS } from '@/config/marketplace';

/**
 * Everything that must happen when a marketplace order completes.
 *
 * Completion had three writers that did different things:
 *
 *   confirm-receipt   status + deliveredAt + completedAt + listings SOLD + totalSold++
 *   orders PATCH      status only
 *   Payrexx webhook   status only
 *
 * So the outcome depended on which path a buyer happened to take. The webhook
 * case is the damaging one: on a successful Payrexx capture the order became
 * COMPLETED while the listing stayed RESERVED — permanently locked, unbuyable by
 * anyone else and un-relistable by the seller, with no way for the seller to
 * see why. That is the exact failure the CANCELLED branch two cases below
 * carries a long comment about fixing; the success path never got the same
 * treatment.
 *
 * One function, called inside the caller's transaction, so the order row, the
 * listings and the seller's counter always move together.
 */

type Tx = Parameters<Parameters<typeof import('@/db').db.transaction>[0]>[0];

/** Listing ids belonging to an order: single-item orders carry listingId, cart orders use order items. */
export async function listingIdsForOrder(
  tx: Tx,
  order: { id: string; listingId: string | null },
): Promise<string[]> {
  if (order.listingId) return [order.listingId];
  const items = await tx
    .select({ listingId: marketplaceOrderItems.listingId })
    .from(marketplaceOrderItems)
    .where(eq(marketplaceOrderItems.orderId, order.id));
  return items.map((i) => i.listingId);
}

/**
 * Mark the order completed and apply every side effect that goes with it.
 *
 * `deliveredAt` is only filled if it is still null — an order delivered earlier
 * keeps its real delivery time rather than being stamped with the completion
 * time.
 */
export async function applyOrderCompletion(
  tx: Tx,
  params: { orderId: string; sellerId: string; listingIds: string[] },
): Promise<void> {
  const { orderId, sellerId, listingIds } = params;

  await tx
    .update(marketplaceOrders)
    .set({
      status: ORDER_STATUS.COMPLETED,
      deliveredAt: sql`COALESCE(${marketplaceOrders.deliveredAt}, NOW())`,
      completedAt: sql`NOW()`,
      updatedAt: sql`NOW()`,
    })
    .where(eq(marketplaceOrders.id, orderId));

  if (listingIds.length === 0) return;

  // Only RESERVED listings flip to SOLD: a listing the seller already resolved
  // by hand must not be dragged back by a late webhook.
  await tx
    .update(listings)
    .set({ status: LISTING_STATUS.SOLD })
    .where(and(inArray(listings.id, listingIds), eq(listings.status, LISTING_STATUS.RESERVED)));

  await tx
    .update(sellerProfiles)
    .set({ totalSold: sql`COALESCE(${sellerProfiles.totalSold}, 0) + ${listingIds.length}` })
    .where(eq(sellerProfiles.userId, sellerId));
}
