/**
 * Monitor-Upcycling gallery — data SSOT
 *
 * Model list maintained in-repo (workshop SSOT). Gallery photos only where
 * documented on site under `public/projects/upcycling/gallery/`.
 * Photography workflow: public/projects/upcycling/gallery/REAL_PHOTOS.md
 */

import { UPCYCLING_ROUTES } from '@/config/upcycling-routes'

export type UpcyclingGalleryPlaceholderVariant = 'functional' | 'warm' | 'cool' | 'art'

export type UpcyclingGalleryTier = 'functional' | 'decor'

export interface UpcyclingGalleryPiece {
  id: string
  model: string
  tier: UpcyclingGalleryTier
  variant: UpcyclingGalleryPlaceholderVariant
  seed: number
  /** Filename under public/projects/upcycling/gallery/ */
  image?: string
  /** Optional mp4 demo; `image` serves as poster. */
  video?: string
  /** Present when a model-specific guide exists. */
  guideHref?: string
}

export const UPCYCLING_GALLERY_PIECES: UpcyclingGalleryPiece[] = [
  {
    id: 'lenovo-l2251pwd',
    model: 'Lenovo L2251pwd',
    tier: 'functional',
    variant: 'functional',
    seed: 101,
    image: 'lenovo-l2251pwd-finished-poster.jpg',
    video: 'lenovo-l2251pwd-finished.mp4',
    guideHref: UPCYCLING_ROUTES.lenovoL2251pwd,
  },
  { id: 'nec-multisync-e233-wmi', model: 'NEC Multisync E233 WMi', tier: 'functional', variant: 'functional', seed: 102 },
  { id: 'lenovo-t2254a', model: 'Lenovo T2254A', tier: 'functional', variant: 'functional', seed: 103 },
  { id: 'lenovo-24', model: 'Lenovo 24"', tier: 'functional', variant: 'functional', seed: 104 },
  { id: 'dell-u2312hmt', model: 'DELL U2312HMt', tier: 'functional', variant: 'cool', seed: 105 },
  { id: 'dell-u2412m', model: 'DELL U2412M', tier: 'functional', variant: 'cool', seed: 106 },
  { id: 'dell-u2713hb', model: 'DELL U2713Hb', tier: 'functional', variant: 'cool', seed: 107 },
  { id: 'dell-p2418d', model: 'DELL P2418D', tier: 'functional', variant: 'cool', seed: 108 },
  { id: 'hp-elite-display-e242', model: 'HP EliteDisplay E242', tier: 'functional', variant: 'warm', seed: 109 },
  { id: 'hp-e24i-g4', model: 'HP E24i G4', tier: 'functional', variant: 'warm', seed: 110 },
  { id: 'hp-e243m', model: 'HP E243m', tier: 'functional', variant: 'warm', seed: 111 },
  { id: 'asus-v247', model: 'ASUS V247', tier: 'decor', variant: 'warm', seed: 112 },
  { id: 'eizo-ev2315w', model: 'EIZO EV2315W', tier: 'decor', variant: 'cool', seed: 113 },
]

export function splitUpcyclingGalleryPieces(
  pieces: UpcyclingGalleryPiece[] = UPCYCLING_GALLERY_PIECES,
) {
  return {
    documented: pieces.filter((p) => !!p.image),
    queued: pieces.filter((p) => !p.image),
  }
}
