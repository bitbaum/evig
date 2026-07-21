/**
 * BRAND — single source of truth for the product name.
 *
 * Rename the whole product by editing this one object: the README, the landing
 * site, and every user-facing string read from here. Nothing else hardcodes the
 * name. (The npm package name in package.json is separate — change it there.)
 */
export const BRAND = {
  /** Product name, shown everywhere. */
  name: 'Saldo',
  /** Short taglines (marketed in DACH + English). */
  tagline: {
    en: 'Time tracking that balances.',
    de: 'Zeiterfassung, die aufgeht.',
  },
  /** One-line description. */
  description: {
    en: 'A dependency-free engine for Soll/Ist time balances, vacation, and honest monthly reports.',
    de: 'Ein abhängigkeitsfreier Motor für Soll-/Ist-Saldi, Ferien und ehrliche Monatsrapporte.',
  },
} as const

export type Brand = typeof BRAND
