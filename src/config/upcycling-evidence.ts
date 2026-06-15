/**
 * Monitor-Upcycling — which evidence sources belong on the public site.
 *
 * The project archive (e.g. Kreislaufnutzung_IT / 2023 application folders)
 * contains many historical documents. Only keys listed here may be cited
 * on /projects/upcycling/businessplan. Enforced in content + i18n parity.
 */

export const UPCYCLING_ACTIVE_CITATION_KEYS = [
  'cit01_innolink',
  'cit02_swico_feb2026',
  'cit03_swico_oct2025',
  'cit04_kurzbericht_e1',
  'cit05_zhaw_gantt',
  'cit08_modelle_md',
  'cit09_brilliant_jumbo',
  'cit10_film',
  'cit11_vesa',
  'cit12_oshwa',
  'cit13_ohwr',
  'cit14_swico_recycling',
  'cit15_erz',
  'cit16_klimast',
  'cit17_innosuisse',
  'cit18_iso14044',
  'cit19_werkraum4',
] as const

export type UpcyclingCitationKey = (typeof UPCYCLING_ACTIVE_CITATION_KEYS)[number]

/** Deliberately excluded from public citations (2023 application archive). */
export const UPCYCLING_ARCHIVED_CITATION_KEYS = [
  'cit06_qa_swico_2023',
  'cit07_klimast_2023',
] as const
