/**
 * Decision narrative API
 *
 * POST /api/decisions/[id]/narrative — generate the AI Beschluss text for a
 * closed decision. Runs only when a staff member clicks for it: closing a
 * decision (by hand or by the deadline cron) no longer calls the model.
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAdmin, ValidSession } from '@/lib/api/middleware';
import {
  apiSuccess,
  apiError,
  apiNotFound,
  apiBadRequest,
  apiRateLimited,
} from '@/lib/api/helpers';
import { getDbUserId } from '@/lib/api/task-helpers';
import { rateLimiters } from '@/lib/security/rate-limit';
import { writeOutcomeNarrative } from '@/lib/services/decisions-narrative';
import { ERROR_MESSAGES } from '@/config/error-messages';

type RouteParams = { id: string };

export const POST = withAdmin<RouteParams>(
  async (_request: NextRequest, session: ValidSession, context) => {
    try {
      const decisionId = context?.params?.id;
      if (!decisionId) return apiBadRequest(ERROR_MESSAGES.DECISION_ID_REQUIRED);

      const userLookup = await getDbUserId(session);
      if ('error' in userLookup) return userLookup.error;
      if (!rateLimiters.decisionNarrative(userLookup.dbUserId)) return apiRateLimited();

      const result = await writeOutcomeNarrative(decisionId);
      if ('error' in result) {
        if (result.error === 'not_found') return apiNotFound('Entscheidung');
        if (result.error === 'not_closed')
          return apiBadRequest('Nur abgeschlossene Entscheidungen haben einen Beschluss.');
        return NextResponse.json(
          { success: false, error: ERROR_MESSAGES.AI_UNAVAILABLE },
          { status: 503 },
        );
      }
      return apiSuccess({ narrative: result.narrative });
    } catch (error) {
      return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR);
    }
  },
);
