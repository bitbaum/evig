/**
 * The server leg of the chat microphone (chatkit `Composer voice.transcribe`).
 *
 * chatkit's own `transcribeUrl` posts bare multipart; evig's proxy rejects a
 * state-changing API call without the double-submit CSRF header, so the
 * request is built here with `withClientCsrfHeader`, the same SSOT every
 * other client-side POST uses. The route is `/api/hirn/transcribe`
 * (signed-in users; Groq Whisper first, local faster-whisper fallback).
 */

import { withClientCsrfHeader } from '@/lib/api/csrf-client';

export const HIRN_TRANSCRIBE_URL = '/api/hirn/transcribe';

export async function transcribeForHirn(audio: Blob, locale: string): Promise<string> {
  const body = new FormData();
  body.append('audio', audio, 'take.webm');
  body.append('locale', locale);
  const res = await fetch(HIRN_TRANSCRIBE_URL, {
    method: 'POST',
    headers: withClientCsrfHeader({}, 'POST'),
    body,
  });
  const data = (await res.json().catch(() => ({}))) as { text?: unknown; error?: unknown };
  if (!res.ok) {
    throw new Error(typeof data.error === 'string' ? data.error : `HTTP ${res.status}`);
  }
  return typeof data.text === 'string' ? data.text.trim() : '';
}
