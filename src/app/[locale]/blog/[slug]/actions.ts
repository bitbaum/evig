'use server'

import { cookies } from 'next/headers'
import {
  BLOG_UNLISTED_COOKIE,
  EXPECTED_TOKEN,
  passwordMatches,
} from '@/lib/blog-unlisted-auth'

export interface UnlockState {
  ok: boolean
  error?: 'wrong'
}

const THIRTY_DAYS = 60 * 60 * 24 * 30

/** Verify the shared password for unlisted posts and set the unlock cookie. */
export async function unlockUnlistedPost(
  _prev: UnlockState,
  formData: FormData,
): Promise<UnlockState> {
  const password = String(formData.get('password') ?? '')

  if (!passwordMatches(password)) {
    return { ok: false, error: 'wrong' }
  }

  const store = await cookies()
  store.set(BLOG_UNLISTED_COOKIE, EXPECTED_TOKEN, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: THIRTY_DAYS,
  })

  return { ok: true }
}
