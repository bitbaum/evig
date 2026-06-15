/**
 * Monitor-Upcycling public assets — SSOT
 *
 * All paths under `public/projects/upcycling/`. Verify with:
 *   find public/projects/upcycling -type f
 */

import { UPCYCLING_BASE, UPCYCLING_GALLERY_ASSET_BASE } from '@/config/upcycling-routes'

const BUSINESSPLAN = `${UPCYCLING_BASE}/businessplan` as const
const LENOVO = `${UPCYCLING_BASE}/lenovo-l2251pwd` as const

export const UPCYCLING_ASSETS = {
  gallery: {
    lenovoPoster: `${UPCYCLING_GALLERY_ASSET_BASE}/lenovo-l2251pwd-finished-poster.jpg`,
    lenovoVideo: `${UPCYCLING_GALLERY_ASSET_BASE}/lenovo-l2251pwd-finished.mp4`,
  },
  businessplan: {
    heroPoster: `${BUSINESSPLAN}/hero-finished-poster.jpg`,
    heroVideo: `${BUSINESSPLAN}/hero-finished.mp4`,
    backCoverOpened: `${BUSINESSPLAN}/02-back-cover-opened.jpg`,
    lcdRemoved: `${BUSINESSPLAN}/03-lcd-panel-removed.jpg`,
    electronicsSpread: `${BUSINESSPLAN}/04-electronics-spread.jpg`,
    standbyBypass: `${BUSINESSPLAN}/05-standby-bypass-spannungsteiler.jpg`,
    sourceLabel: `${BUSINESSPLAN}/06-source-monitor-label.jpg`,
  },
  lenovoGuide: {
    heroPoster: `${LENOVO}/hero-poster.jpg`,
    heroVideo: `${LENOVO}/hero.mp4`,
    stepFrameRemoved: `${LENOVO}/step-1-frame-removed.jpg`,
  },
  /** Thumbnails for landing explore cards — real local photography only. */
  explore: {
    applications: `${BUSINESSPLAN}/hero-finished-poster.jpg`,
    gallery: `${UPCYCLING_GALLERY_ASSET_BASE}/lenovo-l2251pwd-finished-poster.jpg`,
    buildYourOwn: `${BUSINESSPLAN}/03-lcd-panel-removed.jpg`,
  },
} as const
