/**
 * Validation schemas for the public Hirn chat (/api/hirn/chat).
 *
 * The admin variant (HirnChatSchema) lives in admin.ts — the public schema
 * is stricter: no temperature/maxTokens knobs, message length capped, and
 * the conversation history is client-held (no server-side session storage).
 */

import { z } from 'zod';

export const PublicHirnChatSchema = z.object({
  message: z.string().min(1, 'Nachricht ist erforderlich').max(2000),
  pathname: z.string().max(300),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().max(4000),
      })
    )
    .max(20)
    .optional(),
});

export type PublicHirnChatInput = z.infer<typeof PublicHirnChatSchema>;
