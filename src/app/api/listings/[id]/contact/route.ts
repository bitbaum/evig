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
import { listings, users, conversations, messages } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { CONVERSATION_TYPES } from '@/config/database';
import { LISTING_STATUS } from '@/config/marketplace';
import { logger } from '@/lib/logger';
import { validateBody, ContactSellerSchema } from '@/lib/schemas';
import { sendCustomEmail } from '@/lib/email';
import { newMarketplaceMessage } from '@/lib/email/templates/marketplace';
import { rateLimiters } from '@/lib/security/rate-limit';

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
      return apiBadRequest('Sie können sich nicht selbst kontaktieren');
    }

    // Consistent participant ordering (lower UUID first)
    const participant_1 = session.user.id < listing.sellerId ? session.user.id : listing.sellerId;
    const participant_2 = session.user.id < listing.sellerId ? listing.sellerId : session.user.id;

    // Find or create marketplace conversation for this listing
    const [existingConv] = await db
      .select({ id: conversations.id })
      .from(conversations)
      .where(and(
        eq(conversations.participant1, participant_1),
        eq(conversations.participant2, participant_2),
        eq(conversations.type, CONVERSATION_TYPES.MARKETPLACE),
        eq(conversations.contextId, id)
      ));

    let conversationId: string;

    if (existingConv) {
      conversationId = existingConv.id;
    } else {
      // Create new marketplace conversation
      const [newConv] = await db
        .insert(conversations)
        .values({
          participant1: participant_1,
          participant2: participant_2,
          type: CONVERSATION_TYPES.MARKETPLACE,
          contextId: id,
          title: listing.title,
          lastMessagePreview: message.substring(0, 100),
        })
        .returning({ id: conversations.id });
      conversationId = newConv.id;
    }

    // Send the message
    const [newMessage] = await db
      .insert(messages)
      .values({
        conversationId,
        senderId: session.user.id,
        recipientId: listing.sellerId,
        content: message,
      })
      .returning({ id: messages.id, createdAt: messages.createdAt });

    // Update conversation metadata
    const unreadField = session.user.id === participant_1 ? 'unread_count_2' : 'unread_count_1';
    await db
      .update(conversations)
      .set({
        lastMessageAt: sql`CURRENT_TIMESTAMP`,
        lastMessagePreview: message.substring(0, 100),
        ...(unreadField === 'unread_count_2'
          ? { unreadCount2: sql`${conversations.unreadCount2} + 1` }
          : { unreadCount1: sql`${conversations.unreadCount1} + 1` }),
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(eq(conversations.id, conversationId));

    logger.info('Marketplace message sent', {
      conversationId,
      listingId: id,
      senderId: session.user.id,
      sellerId: listing.sellerId,
    });

    // Fire-and-forget: email notification to seller
    if (listing.sellerEmail) {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      sendCustomEmail(
        listing.sellerEmail,
        newMarketplaceMessage({
          recipientName: listing.sellerName || 'Verkäufer',
          senderName: session.user.name || 'Nutzer',
          listingTitle: listing.title,
          messagePreview: message.substring(0, 200),
          conversationUrl: `${baseUrl}/dashboard/messages`,
        })
      ).catch(err => logger.error('Failed to send marketplace message notification', { error: err, listingId: id }));
    }

    return apiSuccess({
      conversation_id: conversationId,
      message_id: newMessage.id,
    });
  } catch (error) {
    return apiError(error, 'Fehler beim Senden der Nachricht');
  }
});
