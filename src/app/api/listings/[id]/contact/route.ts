/**
 * POST /api/listings/[id]/contact — Send message to listing seller
 *
 * Creates or reuses a marketplace conversation and sends the initial message.
 * Uses existing messaging system with context_type='marketplace'.
 */

import { NextRequest } from 'next/server';
import { withAuth, ValidSession } from '@/lib/api/middleware';
import { apiSuccess, apiError, apiNotFound, apiBadRequest } from '@/lib/api/helpers';
import { db } from '@/db';
import { listings, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { CONVERSATION_TYPES } from '@/config/database';
import { LISTING_STATUS } from '@/config/marketplace';
import { logger } from '@/lib/logger';
import { validateBody, ContactSellerSchema } from '@/lib/schemas';
import { sendCustomEmail } from '@/lib/email';
import { newMarketplaceMessage } from '@/lib/email/templates/marketplace';
import { rateLimiters } from '@/lib/security/rate-limit';
import { APP_URL } from '@/config/urls';
import { sendMessageInConversation } from '@/lib/messaging/send-message';

type RouteContext = { params?: { id: string } };

export const POST = withAuth<{ id: string }>(async (
  request: NextRequest,
  session: ValidSession,
  context?: RouteContext
) => {
  try {
    const id = context?.params?.id;
    if (!id) return apiNotFound('Inserat');

    // SECURITY: Rate limiting — 10 contact messages per hour per user
    if (!rateLimiters.contactSeller(`${session.user.id}:contact-seller`)) {
      return apiBadRequest('Zu viele Nachrichten gesendet. Bitte warte 1 Stunde.');
    }

    const body = await request.json();
    const validation = validateBody(ContactSellerSchema, body);
    if (!validation.success) return validation.error;
    const { message } = validation.data;

    // Get listing and seller info
    const [listing] = await db
      .select({
        sellerId: listings.sellerId,
        title: listings.title,
        status: listings.status,
        sellerEmail: users.email,
        sellerName: users.name,
      })
      .from(listings)
      .innerJoin(users, eq(listings.sellerId, users.id))
      .where(eq(listings.id, id));

    if (!listing) return apiNotFound('Inserat');

    if (listing.status !== LISTING_STATUS.ACTIVE) {
      return apiBadRequest('Dieses Inserat ist nicht mehr verfügbar');
    }

    if (listing.sellerId === session.user.id) {
      return apiBadRequest('Du kannst dich nicht selbst kontaktieren');
    }

    // Send message via shared service (handles transaction, metadata, participant ordering)
    const { conversationId, messageId } = await sendMessageInConversation({
      senderId: session.user.id,
      recipientId: listing.sellerId,
      content: message,
      type: CONVERSATION_TYPES.MARKETPLACE,
      contextId: id,
      title: listing.title,
    });

    // Fire-and-forget: email notification to seller. Deep-link into the
    // specific conversation (?conversation=<id>) so the seller doesn't
    // have to find the new thread in their inbox list — matches the
    // /api/messages route shape fixed in 0b773948 (the dashboard page
    // at /dashboard/messages reads `conversation` from searchParams to
    // auto-select the thread).
    // sendCustomEmail resolves {success:false} on SMTP/Listmonk failure
    // (bare-catch misses that mode). Canonical .then/.catch shape; same
    // fix class as a4f2d601 / 7ef4fd75 / 0caff6ba.
    if (listing.sellerEmail) {
      sendCustomEmail(
        listing.sellerEmail,
        newMarketplaceMessage({
          recipientName: listing.sellerName || 'Verkäufer',
          senderName: session.user.name || 'Nutzer',
          listingTitle: listing.title,
          messagePreview: message.substring(0, 200),
          conversationUrl: `${APP_URL}/dashboard/messages?conversation=${conversationId}`,
        })
      )
        .then(r => {
          if (!r.success) {
            logger.warn('Failed to send marketplace message notification (resolved)', { error: r.error, listingId: id });
          }
        })
        .catch(err => logger.warn('Failed to send marketplace message notification (rejected)', { error: err, listingId: id }));
    }

    return apiSuccess({
      conversation_id: conversationId,
      message_id: messageId,
    });
  } catch (error) {
    return apiError(error, 'Fehler beim Senden der Nachricht');
  }
});
