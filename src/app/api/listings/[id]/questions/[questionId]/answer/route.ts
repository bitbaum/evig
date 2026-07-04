/**
 * POST /api/listings/[id]/questions/[questionId]/answer
 * Seller answers a public listing question.
 */

import { NextRequest } from 'next/server';
import { withAuth, ValidSession } from '@/lib/api/middleware';
import { apiSuccess, apiError, apiNotFound, apiBadRequest, apiForbidden } from '@/lib/api/helpers';
import { db } from '@/db';
import { listings, listingQuestions } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { LISTING_QUESTION_STATUS } from '@/config/marketplace';
import { validateBody, AnswerListingQuestionSchema } from '@/lib/schemas';

type RouteContext = { params?: { id: string; questionId: string } };

export const POST = withAuth<{ id: string; questionId: string }>(async (
  request: NextRequest,
  session: ValidSession,
  context?: RouteContext,
) => {
  try {
    const listingId = context?.params?.id;
    const questionId = context?.params?.questionId;
    if (!listingId || !questionId) return apiNotFound('Frage');

    const body = await request.json();
    const validation = validateBody(AnswerListingQuestionSchema, body);
    if (!validation.success) return validation.error;
    const { answer } = validation.data;

    const [row] = await db
      .select({
        questionId: listingQuestions.id,
        status: listingQuestions.status,
        sellerId: listings.sellerId,
      })
      .from(listingQuestions)
      .innerJoin(listings, eq(listingQuestions.listingId, listings.id))
      .where(
        and(
          eq(listingQuestions.id, questionId),
          eq(listingQuestions.listingId, listingId),
        ),
      )
      .limit(1);

    if (!row) return apiNotFound('Frage');

    if (row.sellerId !== session.user.id) {
      return apiForbidden('Nur der Verkäufer kann diese Frage beantworten');
    }

    if (row.status !== LISTING_QUESTION_STATUS.OPEN) {
      return apiBadRequest('Diese Frage wurde bereits beantwortet');
    }

    const now = new Date().toISOString();

    const [updated] = await db
      .update(listingQuestions)
      .set({
        answer: answer.trim(),
        answeredAt: now,
        answeredBy: session.user.id,
        status: LISTING_QUESTION_STATUS.ANSWERED,
        updatedAt: now,
      })
      .where(eq(listingQuestions.id, questionId))
      .returning({
        id: listingQuestions.id,
        answer: listingQuestions.answer,
        answeredAt: listingQuestions.answeredAt,
        status: listingQuestions.status,
      });

    return apiSuccess({
      id: updated.id,
      answer: updated.answer,
      answered_at: updated.answeredAt,
      status: updated.status,
    });
  } catch (error) {
    return apiError(error, 'Fehler beim Speichern der Antwort');
  }
});
