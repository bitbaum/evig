/**
 * Monitor-Upcycling — real-world installations (data SSOT)
 *
 * Every entry traces to the Swico Abschlussbericht (Projekt 2023-02-01,
 * Nextcloud: Kreislaufnutzung_IT/Abschlussbericht_Projekt_2023-02-01.odt).
 * Structure lives here (ids, photos, order); the translatable caption/story
 * strings live in messages under `projects.upcycling.applications.installs`
 * keyed by `id` (i18n SSOT: messages = strings only).
 *
 * `image` is optional on purpose: installations without photography yet are
 * still listed honestly as text entries (same discipline as the gallery's
 * documented-vs-queued split).
 */

import { UPCYCLING_ASSETS } from '@/config/upcycling-assets'

export interface UpcyclingInstallation {
  /** i18n key under projects.upcycling.applications.installs.items */
  id: string
  /** Primary photo (public path); absent → text-only entry. */
  image?: string
  /** Additional photos for the same installation. */
  extraImages?: string[]
}

export const UPCYCLING_INSTALLATIONS: UpcyclingInstallation[] = [
  {
    id: 'repairhub',
    image: UPCYCLING_ASSETS.installs.werkbankCurved1,
    extraImages: [UPCYCLING_ASSETS.installs.curvedRepairhub],
  },
  {
    id: 'laden',
    image: UPCYCLING_ASSETS.installs.eingangLaden,
    extraImages: [
      UPCYCLING_ASSETS.installs.ladenWand1,
      UPCYCLING_ASSETS.installs.ladenDecke1,
    ],
  },
  {
    id: 'werkraum4',
    image: UPCYCLING_ASSETS.installs.werkraum4Decke1,
    extraImages: [UPCYCLING_ASSETS.installs.werkraum4Decke2],
  },
  { id: 'recreazzz' },
  { id: 'ambossrampe' },
]
