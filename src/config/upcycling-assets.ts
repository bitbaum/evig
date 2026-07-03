/**
 * Monitor-Upcycling public assets — SSOT
 *
 * All paths under `public/projects/upcycling/`. Verify with:
 *   find public/projects/upcycling -type f
 */

import { UPCYCLING_BASE, UPCYCLING_GALLERY_ASSET_BASE } from '@/config/upcycling-routes'

const BUSINESSPLAN = `${UPCYCLING_BASE}/businessplan` as const
const LENOVO = `${UPCYCLING_BASE}/lenovo-l2251pwd` as const
const INSTALLS = `${UPCYCLING_BASE}/installs` as const
const SZENARIEN = `${UPCYCLING_BASE}/szenarien` as const

/** Real installation + engineering photography (Juli 2026) — see upcycling-installations.ts */
const INSTALL_ASSETS = {
  curvedRepairhub: `${INSTALLS}/curved-repairhub.jpg`,
  eingangLaden: `${INSTALLS}/eingang-laden.jpg`,
  werkbankCurved1: `${INSTALLS}/werkbank-curved-1.jpg`,
  werkbankCurved2: `${INSTALLS}/werkbank-curved-2.jpg`,
  werkbankCurved3: `${INSTALLS}/werkbank-curved-3.jpg`,
  ladenDecke1: `${INSTALLS}/laden-decke-1.jpg`,
  ladenDecke2: `${INSTALLS}/laden-decke-2.jpg`,
  ladenWand1: `${INSTALLS}/laden-wand-1.jpg`,
  ladenWand2: `${INSTALLS}/laden-wand-2.jpg`,
  /** Der Standby-Fix: Spannungsteiler-Stecker im 3D-gedruckten Gehäuse. */
  standbyDongle: `${INSTALLS}/standby-dongle.jpg`,
  /** 3D-CAD der Deckenhalterung (druckbar, offene Hardware). */
  deckenhalterungCad: `${INSTALLS}/deckenhalterung-3d-cad.png`,
  /** Elektronik-Arbeitsplatz — Controller-Boards + Lupe. */
  werkstattElektronik: `${INSTALLS}/werkstatt-elektronik.jpg`,
  /** Neuware-Vergleich: 24-W-LED-Panel im Laden, CHF 79.95. */
  ledPanelVergleich: `${INSTALLS}/led-panel-vergleich.jpg`,
  /** Werkraum4 — Deckenleuchten, ~20 Stück seit einem Jahr täglich im Einsatz. */
  werkraum4Decke1: `${INSTALLS}/werkraum4-1.jpg`,
  werkraum4Decke2: `${INSTALLS}/werkraum4-2.jpg`,
  /** HSLU-Modul «Local Loops»: Studierende entwerfen eigene Leuchten-Builds. */
  hsluWorkshop1: `${INSTALLS}/hslu-workshop-1.jpg`,
  /** Kreativ-Prototyp mit Textilschirm, gebaut von HSLU-Studierenden. */
  hsluKreativ1: `${INSTALLS}/hslu-kreativ-1.jpg`,
  /** Kreativ-Leuchte aus der Werkstatt. */
  kreativLeuchte1: `${INSTALLS}/kreativ-leuchte-1.jpg`,
} as const

/**
 * Szenarien-Kompositionen — VISUALISIERUNGEN, keine echten Fotos.
 * Überall, wo diese Bilder erscheinen, MÜSSEN sie als «Visualisierung»
 * gekennzeichnet sein (Ehrlichkeits-Disziplin des Mini-Site-Audits).
 */
const SZENARIEN_ASSETS = {
  schaufenster: `${SZENARIEN}/schaufenster.jpg`,
  garage: `${SZENARIEN}/garage.jpg`,
  party: `${SZENARIEN}/party.jpg`,
  treppenhaus: `${SZENARIEN}/treppenhaus.jpg`,
  vorlesung: `${SZENARIEN}/vorlesung.jpg`,
  buero: `${SZENARIEN}/buero.jpg`,
  korridor: `${SZENARIEN}/korridor.jpg`,
  werkstatt: `${SZENARIEN}/werkstatt.jpg`,
} as const

export const UPCYCLING_ASSETS = {
  installs: INSTALL_ASSETS,
  szenarien: SZENARIEN_ASSETS,
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
    applications: INSTALL_ASSETS.eingangLaden,
    gallery: INSTALL_ASSETS.curvedRepairhub,
    buildYourOwn: INSTALL_ASSETS.standbyDongle,
  },
} as const
