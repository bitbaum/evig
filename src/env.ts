/**
 * Environment-variable validation
 *
 * Validates required env vars at module-import time. Throws a clear
 * error listing every missing var, instead of failing later with
 * confusing "undefined" runtime errors deep inside the auth/db layer.
 *
 * Server-only — never imported by client components.
 *
 * Importing this file once at app startup (e.g. from src/app/layout.tsx
 * or any server-side entry) is sufficient. The Zod parse runs once and
 * its result is cached for the lifetime of the process.
 */

import 'server-only'
import { z } from 'zod'

// =============================================================================
// Empty-string handling
// =============================================================================
// Vercel's env-var UI saves "" when you clear a field instead of removing the
// variable. Zod's `.optional()` treats undefined as absent but "" as present
// (and invalid for typed fields like .email() or .regex). Strip empty strings
// to undefined before schema validation so optional fields behave intuitively.

const rawEnv: Record<string, unknown> = {}
for (const [k, v] of Object.entries(process.env)) {
  rawEnv[k] = typeof v === 'string' && v.trim() === '' ? undefined : v
}

// =============================================================================
// Schema — REQUIRED vars are validated; OPTIONAL vars get type-safe defaults.
// =============================================================================

const serverEnvSchema = z.object({
  // --- Auth ------------------------------------------------------------------
  // AUTH_SECRET is the canonical name; NEXTAUTH_SECRET kept for backwards-compat.
  AUTH_SECRET: z.string().min(32, 'AUTH_SECRET must be at least 32 chars').optional(),
  NEXTAUTH_SECRET: z.string().min(32).optional(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 chars'),

  // --- Database --------------------------------------------------------------
  // One of DATABASE_URL (Neon / production) or DB_HOST+DB_NAME+DB_USER+DB_PASSWORD
  // (local Docker development) must be set. PRESENCE-only validation;
  // getDbConfig parses the URL/host and reports a clearer error if malformed.
  DATABASE_URL: z.string().optional(),
  DB_HOST: z.string().optional(),
  DB_PORT: z.string().optional(),
  DB_NAME: z.string().optional(),
  DB_USER: z.string().optional(),
  DB_PASSWORD: z.string().optional(),

  // --- Email -----------------------------------------------------------------
  // Email is required for password reset, verification, donations confirmations.
  // Without it, those flows silently fail (we already log the failures, but the
  // user never gets the email). We validate PRESENCE only, not format —
  // production environments may have legitimately weird shapes (e.g.
  // `EMAIL_FROM=noreply` for relays that prepend a domain, or `EMAIL_PORT`
  // set as an integer rather than string in some platforms). The email
  // transport code in src/lib/email/* validates the values at use-time.
  EMAIL_HOST: z.string().min(1, 'EMAIL_HOST required for outbound email'),
  EMAIL_USER: z.string().min(1, 'EMAIL_USER required for outbound email'),
  EMAIL_PASS: z.string().min(1, 'EMAIL_PASS required for outbound email'),
  EMAIL_FROM: z.string().optional(),
  EMAIL_PORT: z.string().optional(),
  EMAIL_SECURE: z.string().optional(),

  // --- App URL ---------------------------------------------------------------
  // PRESENCE only — we used to enforce .url() but Vercel project envs sometimes
  // hold values like `${VERCEL_URL}` that are valid at runtime but fail Zod's
  // strict URL check at build time. Runtime consumers (next.config, metadata
  // generators) handle malformed URLs gracefully.
  NEXT_PUBLIC_SITE_URL: z.string().min(1, 'NEXT_PUBLIC_SITE_URL required'),
  NEXT_PUBLIC_API_URL: z.string().optional(),

  // --- Optional integrations -------------------------------------------------
  // Presence-only. Runtime code validates connectivity at first use.
  GROQ_API_KEY: z.string().optional(),
  OLLAMA_URL: z.string().optional(),
  OLLAMA_MODEL: z.string().optional(),
  TRANSCRIPTION_URL: z.string().optional(),
  REBOOT_CONTENT_TOKEN: z.string().optional(),

  // Sentry — when set, src/instrumentation.ts loads the Sentry SDK and
  // wires server + edge runtimes. When absent/empty, Sentry never loads
  // (zero bundle impact, zero startup cost). See sentry.*.config.ts.
  SENTRY_DSN: z.string().optional(),

  // --- Runtime ---------------------------------------------------------------
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

// =============================================================================
// Runtime parse with friendly error formatting
// =============================================================================

function parseEnv(): z.infer<typeof serverEnvSchema> {
  const parsed = serverEnvSchema.safeParse(rawEnv)
  if (parsed.success) {
    // Cross-check: at least one auth secret + at least one DB target must be set.
    const authOk = !!(parsed.data.AUTH_SECRET || parsed.data.NEXTAUTH_SECRET)
    const dbOk = !!(parsed.data.DATABASE_URL || (parsed.data.DB_HOST && parsed.data.DB_NAME))
    const crossErrors: string[] = []
    if (!authOk) crossErrors.push('AUTH_SECRET (or NEXTAUTH_SECRET) is required')
    if (!dbOk) crossErrors.push('DATABASE_URL (or DB_HOST + DB_NAME + DB_USER + DB_PASSWORD) is required')
    if (crossErrors.length > 0) {
      throw new Error(`Environment configuration error:\n  ${crossErrors.join('\n  ')}`)
    }
    return parsed.data
  }

  const issues = parsed.error.issues
    .map(i => `  ${i.path.join('.') || '(root)'}: ${i.message}`)
    .join('\n')
  throw new Error(`Environment configuration error — missing or invalid:\n${issues}`)
}

export const env = parseEnv()
export type ServerEnv = typeof env
