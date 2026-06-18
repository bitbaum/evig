'use server'

import { cookies } from 'next/headers'
import {
  DOSSIER_COOKIE,
  EXPECTED_TOKEN,
  passwordMatches,
} from '@/lib/upcycling/dossier-auth'

export interface UnlockState {
  ok: boolean
  error?: string
}

const THIRTY_DAYS = 60 * 60 * 24 * 30

export async function unlockDossier(
  _prev: UnlockState,
  formData: FormData,
): Promise<UnlockState> {
  const password = String(formData.get('password') ?? '')

  if (!passwordMatches(password)) {
    return { ok: false, error: 'Falsches Passwort. Bitte erneut versuchen.' }
  }

  const store = await cookies()
  store.set(DOSSIER_COOKIE, EXPECTED_TOKEN, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: THIRTY_DAYS,
  })

  return { ok: true }
}

export async function lockDossier(): Promise<void> {
  const store = await cookies()
  store.delete(DOSSIER_COOKIE)
}
