import type { Metadata } from 'next'
import { isDossierUnlocked } from '@/lib/upcycling/dossier-auth'
import { DossierGate } from './DossierGate'
import { DossierView } from './DossierView'

/**
 * /projects/upcycling/dossier — interner, passwortgeschützter Bereich.
 *
 * Enthält die an Andreas übergebenen Akquise-Kontakte (Hersteller, Kunden,
 * Förderer, Vertrieb, Grossverteiler) sowie Projektstand, Aufgaben und
 * Meilensteine. Inhalte werden nur serverseitig gerendert, wenn das
 * Zugangscookie gültig ist — andernfalls erscheint die Passwortschranke.
 *
 * `cookies()` macht die Route automatisch dynamisch; `noindex` hält sie
 * aus Suchmaschinen heraus.
 */
export const metadata: Metadata = {
  title: 'Projektdossier — intern · Monitor-Upcycling',
  robots: { index: false, follow: false },
}

export default async function DossierPage() {
  const unlocked = await isDossierUnlocked()
  return unlocked ? <DossierView /> : <DossierGate />
}
