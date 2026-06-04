/**
 * German plural rule helper.
 *
 * German plural inflection isn't expressible cleanly inline in JSX
 * (`{count} Aktionspunkt{count === 1 ? '' : 'e'}`) because the rule —
 * and which suffix or stem change applies — varies per noun. This
 * helper isolates the choice so callers stay declarative.
 *
 * Usage:
 *   `${count} ${pluralDe(count, 'Aktionspunkt', 'Aktionspunkte')}`
 *   `${count} ${pluralDe(count, 'Entscheidung', 'Entscheidungen')}`
 *
 * For user-facing locale-aware text on the public side, use next-intl's
 * ICU plural format in messages JSON. This helper is for admin-side
 * German strings that aren't currently in the message catalog (admin UI
 * is hardcoded German per the codebase's convention).
 */
export function pluralDe(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural
}
