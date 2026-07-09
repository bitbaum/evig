/**
 * GET  /api/listings/[id]/questions — Public Q&A for a listing
 * POST /api/listings/[id]/questions — Ask a public question (auth required)
 */

import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { withAuth, ValidSession } from '@/lib/api/middleware';
import { apiSuccess, apiError, apiNotFound, apiBadRequest, apiForbidden } from '@/lib/api/helpers';
import { db } from '@/db';
import { listings, listingQuestions, users } from '@/db/schema';
import { eq, and, ne, desc } from 'drizzle-orm';
import { LISTING_STATUS, LISTING_QUESTION_STATUS } from '@/config/marketplace';
import { logger } from '@/lib/logger';
import { validateBody, AskListingQuestionSchema } from '@/lib/schemas';
import { rateLimiters } from '@/lib/security/rate-limit';
import { sendCustomEmail } from '@/lib/email';
import { newListingQuestion } from '@/lib/email/templates/marketplace';
import { createNotification } from '@/lib/services/notifications';
import { NOTIFICATION_TYPES } from '@/config/notifications';
import { APP_URL } from '@/config/urls';
import { ROUTES } from '@/config/routes';

async function getListingOr404(listingId: string) {
  const [listing] = await db
    .select({
      id: listings.id,
      sellerId: listings.sellerId,
      title: listings.title,
      status: listings.status,
      sellerEmail: users.email,
      sellerName: users.name,
    })
    .from(listings)
    .innerJoin(users, eq(listings.sellerId, users.id))
    .where(eq(listings.id, listingId))
    .limit(1);

  return listing ?? null;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: listingId } = await params;
    if (!listingId) return apiNotFound('Inserat');

    const listing = await getListingOr404(listingId);
    if (!listing) return apiNotFound('Inserat');

    const session = await auth();
    const userId = session?.user?.id;
    const isOwner = userId === listing.sellerId;

    const rows = await db
      .select({
        id: listingQuestions.id,
        question: listingQuestions.question,
        answer: listingQuestions.answer,
        status: listingQuestions.status,
        createdAt: listingQuestions.createdAt,
        answeredAt: listingQuestions.answeredAt,
        askerId: listingQuestions.askerId,
        askerName: users.name,
      })
      .from(listingQuestions)
      .innerJoin(users, eq(listingQuestions.askerId, users.id))
      .where(
        and(
          eq(listingQuestions.listingId, listingId),
          ne(listingQuestions.status, LISTING_QUESTION_STATUS.HIDDEN),
        ),
      )
      .orderBy(desc(listingQuestions.createdAt));

    return apiSuccess({
      questions: rows.map((q) => ({
        id: q.id,
        question: q.question,
        answer: q.answer,
        status: q.status,
        created_at: q.createdAt,
        answered_at: q.answeredAt,
        asker_id: q.askerId,
        asker_name: q.askerName || 'Nutzer',
        can_answer: isOwner && q.status === LISTING_QUESTION_STATUS.OPEN,
      })),
      can_ask:
        !!userId &&
        userId !== listing.sellerId &&
        listing.status === LISTING_STATUS.ACTIVE,
    });
  } catch (error) {
    return apiError(error, 'Fehler beim Laden der Fragen');
  }
}

export const POST = withAuth<{ id: string }>(async (
  request: NextRequest,
  session: ValidSession,
  context?: { params?: { id: string } },
) => {
  try {
    const listingId = context?.params?.id;
    if (!listingId) return apiNotFound('Inserat');

    if (!rateLimiters.listingQuestion(`${session.user.id}:listing-question`)) {
      return apiBadRequest('Zu viele Fragen gesendet. Bitte warte 1 Stunde.');
    }

    const body = await request.json();
    const validation = validateBody(AskListingQuestionSchema, body);
    if (!validation.success) return validation.error;
    const { question } = validation.data;

    const listing = await getListingOr404(listingId);
    if (!listing) return apiNotFound('Inserat');

    if (listing.status !== LISTING_STATUS.ACTIVE) {
      return apiBadRequest('Dieses Inserat ist nicht mehr verfügbar');
    }

    if (listing.sellerId === session.user.id) {
      return apiForbidden('Du kannst auf deinem eigenen Inserat keine Frage stellen');
    }

    const [created] = await db
      .insert(listingQuestions)
      .values({
        listingId,
        askerId: session.user.id,
        question: question.trim(),
        status: LISTING_QUESTION_STATUS.OPEN,
      })
      .returning({
        id: listingQuestions.id,
        createdAt: listingQuestions.createdAt,
      });

    const listingUrl = `${APP_URL}${ROUTES.public.marketplaceListing(listingId)}`;

    // In-app bell only; the styled newListingQuestion email below is the single
    // email for this event (skipEmail avoids a 2nd generic one).
    createNotification(listing.sellerId, {
      type: NOTIFICATION_TYPES.MARKETPLACE,
      title: 'Neue Frage zu deinem Inserat',
      content: `"${listing.title}": ${question.trim().substring(0, 120)}`,
    }, { skipEmail: true }).catch((err) =>
      logger.warn('Failed to notify seller of listing question', { error: err, listingId }),
    );

    if (listing.sellerEmail) {
      sendCustomEmail(
        listing.sellerEmail,
        newListingQuestion({
          recipientName: listing.sellerName || 'Verkäufer',
          askerName: session.user.name || 'Nutzer',
          listingTitle: listing.title,
          questionPreview: question.trim().substring(0, 200),
          listingUrl,
        }),
      )
        .then((r) => {
          if (!r.success) {
            logger.warn('Listing question email failed (resolved)', { error: r.error, listingId });
          }
        })
        .catch((err) =>
          logger.warn('Listing question email failed (rejected)', { error: err, listingId }),
        );
    }

    return apiSuccess({
      id: created.id,
      created_at: created.createdAt,
    });
  } catch (error) {
    return apiError(error, 'Fehler beim Stellen der Frage');
  }
});
