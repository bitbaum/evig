import 'server-only'
import { createHash, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'

/**
 * Shared-password gate for UNLISTED ("closed") blog posts.
 *
 * Not real authentication: unlisted posts carry internal-ops content (e.g. the
 * Mastodon runbook, which exposes a server IP) that we want to share by link but
 * keep out of casual/public view. The gate keeps the body out of the rendered
 * HTML until the password is entered. Checked server-side; the cookie stores
 * only a hash token, never the password in clear text.
 *
 * Password comes from `BLOG_UNLISTED_PASSWORD` (default `revamp`) so the phrase
 * is changeable without a deploy and no plaintext secret lives in the repo.
 * Mirrors the upcycling-dossier gate (src/lib/upcycling/dossier-auth.ts).
 */
export const BLOG_UNLISTED_COOKIE = 'blog_unlisted'
const BLOG_UNLISTED_PASSWORD = process.env.BLOG_UNLISTED_PASSWORD ?? 'revamp'

function tokenFor(password: string): string {
  return createHash('sha256').update(`blog-unlisted::${password}`).digest('hex')
}

/** Token a valid cookie must carry. */
export const EXPECTED_TOKEN = tokenFor(BLOG_UNLISTED_PASSWORD)

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ab.length !== bb.length) return false
  return timingSafeEqual(ab, bb)
}

export function passwordMatches(input: string): boolean {
  return safeEqual(tokenFor(input.trim()), EXPECTED_TOKEN)
}

export async function isUnlistedUnlocked(): Promise<boolean> {
  const store = await cookies()
  const token = store.get(BLOG_UNLISTED_COOKIE)?.value
  return typeof token === 'string' && safeEqual(token, EXPECTED_TOKEN)
}
