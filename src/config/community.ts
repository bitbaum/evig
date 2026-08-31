/**
 * Shared shape for the get-involved page components.
 *
 * This file used to be 644 lines: INVOLVEMENT_OPTIONS, PARTNER_INSTITUTIONS,
 * GET_INVOLVED_CONFIG and seven full PageContent objects — VOLUNTEER_PAGE,
 * DONATE_PAGE, TECHNICAL_EXPERTS_PAGE, INTERNSHIPS_PAGE, PARTNERSHIPS_PAGE,
 * IT_HILFE_TECHNIKER_PAGE, WORK_REINTEGRATION_PAGE — every one of them holding
 * German titles, descriptions and CTA labels.
 *
 * All of it was a SECOND COPY of `getInvolved.*` in messages/de.json, which is
 * what the pages actually render, and none of it was imported by anything. The
 * only live export was the `ListItem` type below. So the file was a 644-line
 * German content tree that could drift from the real copy indefinitely without
 * anyone noticing, because nothing read it.
 *
 * Translatable strings belong in messages/, structure belongs in config/, and
 * a config file holding German sentences is the smell. Removed.
 */

export interface ListItem {
  text: string;
}
