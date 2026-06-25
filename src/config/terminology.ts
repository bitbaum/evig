/**
 * User-facing persona labels — SSOT.
 *
 * DB tables/API fields may still use "repairer"; UI and user messages use Techniker.
 * Admin repairer-application flows may reference Bewerbung (application) context.
 */

export const TECHNICIAN_LABEL = 'Techniker'
export const TECHNICIAN_LABEL_PLURAL = 'Techniker'

/** Genitive / "Nur der …" phrasing */
export const TECHNICIAN_LABEL_DATIVE = 'Techniker'

export function technicianNotFoundMessage(): string {
  return `${TECHNICIAN_LABEL} nicht gefunden`
}

export function onlyTechnicianMessage(verb: string): string {
  return `Nur der ${TECHNICIAN_LABEL_DATIVE} kann ${verb}`
}
