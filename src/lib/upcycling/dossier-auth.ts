import 'server-only'
import { createHash, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'

/**
 * Zugangsschutz für das interne Monitor-Upcycling-Dossier.
 *
 * Bewusst leichtgewichtig: Es handelt sich um geschäftliche Kontaktdaten,
 * nicht um Geheimnisse — der Schutz hält die Daten lediglich aus dem
 * öffentlichen, indexierbaren HTML heraus. Geprüft wird serverseitig; das
 * Cookie speichert nur ein Hash-Token, nie das Passwort im Klartext.
 *
 * Passwort kommt aus `UPCYCLING_DOSSIER_PASSWORD` (Default `revamp`), damit
 * kein Klartext-Geheimnis im Repo liegt und die Phrase ohne Deploy änderbar ist.
 */

export const DOSSIER_COOKIE = 'upc_dossier'
const DOSSIER_PASSWORD = process.env.UPCYCLING_DOSSIER_PASSWORD ?? 'revamp'

function tokenFor(password: string): string {
  return createHash('sha256').update(`upcycling-dossier::${password}`).digest('hex')
}

/** Token, das ein gültiges Cookie tragen muss. */
export const EXPECTED_TOKEN = tokenFor(DOSSIER_PASSWORD)

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ab.length !== bb.length) return false
  return timingSafeEqual(ab, bb)
}

export function passwordMatches(input: string): boolean {
  return safeEqual(tokenFor(input.trim()), EXPECTED_TOKEN)
}

export async function isDossierUnlocked(): Promise<boolean> {
  const store = await cookies()
  const token = store.get(DOSSIER_COOKIE)?.value
  return typeof token === 'string' && safeEqual(token, EXPECTED_TOKEN)
}
