/**
 * POST /api/listings/[id]/contact — Send message to listing seller
 *
 * Creates or reuses a marketplace conversation and sends the initial message.
 * Uses existing messaging system with context_type='marketplace'.
 */

import { NextRequest } from 'next/server';
import { withAuth, ValidSession } from '@/lib/api/middleware';
import { apiSuccess, apiError, apiNotFound, apiBadRequest } from '@/lib/api/helpers';
import { query } from '@/lib/auth/db';
import { TABLE_NAMES, CONVERSATION_TYPES } from '@/config/database';
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
    const listingResult = await query<{ seller_id: string; title: string; status: string; seller_email: string; seller_name: string }>(
      `SELECT l.seller_id, l.title, l.status, u.email as seller_email, u.name as seller_name
       FROM ${TABLE_NAMES.LISTINGS} l
       JOIN ${TABLE_NAMES.USERS} u ON l.seller_id = u.id
       WHERE l.id = $1`,
      [id]
    );

    if (listingResult.rows.length === 0) return apiNotFound('Inserat');
    const listing = listingResult.rows[0];

    if (listing.status !== 'active') {
      return apiBadRequest('Dieses Inserat ist nicht mehr verfügbar');
    }

    if (listing.seller_id === session.user.id) {
      return apiBadRequest('Sie können sich nicht selbst kontaktieren');
    }

    // Consistent participant ordering (lower UUID first)
    const participant_1 = session.user.id < listing.seller_id ? session.user.id : listing.seller_id;
    const participant_2 = session.user.id < listing.seller_id ? listing.seller_id : session.user.id;

    // Find or create marketplace conversation for this listing
    const existingConv = await query<{ id: string }>(
      `SELECT id FROM ${TABLE_NAMES.CONVERSATIONS}
       WHERE participant_1 = $1 AND participant_2 = $2
       AND type = $3 AND context_id = $4`,
      [participant_1, participant_2, CONVERSATION_TYPES.MARKETPLACE, id]
    );

    let conversationId: string;

    if (existingConv.rows.length > 0) {
      conversationId = existingConv.rows[0].id;
    } else {
      // Create new marketplace conversation
      const createResult = await query<{ id: string }>(
        `INSERT INTO ${TABLE_NAMES.CONVERSATIONS} (
          participant_1, participant_2, type, context_id, title, last_message_preview
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id`,
        [
          participant_1,
          participant_2,
          CONVERSATION_TYPES.MARKETPLACE,
          id,
          listing.title,
          message.substring(0, 100),
        ]
      );
      conversationId = createResult.rows[0].id;
    }

    // Send the message
    const messageResult = await query<{ id: string; created_at: string }>(
      `INSERT INTO ${TABLE_NAMES.MESSAGES} (conversation_id, sender_id, recipient_id, content)
       VALUES ($1, $2, $3, $4)
       RETURNING id, created_at`,
      [conversationId, session.user.id, listing.seller_id, message]
    );

    // Update conversation metadata
    const unreadField = session.user.id === participant_1 ? 'unread_count_2' : 'unread_count_1';
    await query(
      `UPDATE ${TABLE_NAMES.CONVERSATIONS} SET
        last_message_at = CURRENT_TIMESTAMP,
        last_message_preview = $1,
        ${unreadField} = ${unreadField} + 1,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [message.substring(0, 100), conversationId]
    );

    logger.info('Marketplace message sent', {
      conversationId,
      listingId: id,
      senderId: session.user.id,
      sellerId: listing.seller_id,
    });

    // Fire-and-forget: email notification to seller
    if (listing.seller_email) {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      sendCustomEmail(
        listing.seller_email,
        newMarketplaceMessage({
          recipientName: listing.seller_name || 'Verkäufer',
          senderName: session.user.name || 'Nutzer',
          listingTitle: listing.title,
          messagePreview: message.substring(0, 200),
          conversationUrl: `${baseUrl}/dashboard/messages`,
        })
      ).catch(err => logger.error('Failed to send marketplace message notification', { error: err, listingId: id }));
    }

    return apiSuccess({
      conversation_id: conversationId,
      message_id: messageResult.rows[0].id,
    });
  } catch (error) {
    return apiError(error, 'Fehler beim Senden der Nachricht');
  }
});
