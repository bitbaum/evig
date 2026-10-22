/**
 * API: Hirn chat dictation
 *
 * POST /api/hirn/transcribe — multipart { audio, locale } → { text }
 *
 * The server leg of chatkit's microphone for every Hirn chat (public panel,
 * staff chat, deliverable Q&A). Chromium without Google's speech service
 * accepts `start()` and then says nothing; this is what keeps the mic from
 * being a dead button there. Same pipeline as protocol audio
 * (`@/lib/transcription/transcribe`): Groq Whisper, local faster-whisper
 * fallback. Signed-in users only — every take is a billed call.
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/middleware';
import { apiBadRequest, apiError, apiRateLimited } from '@/lib/api/helpers';
import { rateLimiters } from '@/lib/security/rate-limit';
import { transcribeAudio } from '@/lib/transcription/transcribe';
import { ERROR_MESSAGES } from '@/config/error-messages';
import { logger } from '@/lib/logger';

/** Groq's upload cap with headroom; a chat take is seconds long anyway. */
const MAX_AUDIO_BYTES = 24 * 1024 * 1024;
const LOCALE_RE = /^[a-z]{2}$/;

export const POST = withAuth(async (request: NextRequest, session) => {
  if (!rateLimiters.hirnTranscribe(`${session.user.id}:hirn-transcribe`)) {
    return apiRateLimited(ERROR_MESSAGES.RATE_LIMITED);
  }

  const form = await request.formData().catch(() => null);
  const audio = form?.get('audio');
  if (!(audio instanceof Blob) || audio.size === 0) {
    return apiBadRequest(ERROR_MESSAGES.NO_AUDIO_RECEIVED);
  }
  if (audio.size > MAX_AUDIO_BYTES) {
    return apiBadRequest(ERROR_MESSAGES.AUDIO_TOO_LARGE);
  }
  const rawLocale = String(form?.get('locale') ?? '')
    .toLowerCase()
    .slice(0, 2);
  const language = LOCALE_RE.test(rawLocale) ? rawLocale : 'de';
  const filename = audio instanceof File && audio.name ? audio.name : 'take.webm';

  try {
    const result = await transcribeAudio(audio, { language, filename });
    logger.info('Hirn dictation transcribed', {
      userId: session.user.id,
      provider: result.provider,
      bytes: audio.size,
      language,
    });
    // chatkit reads `{ text }` at the top level — not the apiSuccess envelope.
    return NextResponse.json({ text: result.text });
  } catch (error) {
    return apiError(error, ERROR_MESSAGES.TRANSCRIPTION_FAILED);
  }
});
