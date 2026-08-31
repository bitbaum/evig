/**
 * Generate a URL-safe slug from a string.
 * Converts Swiss German umlauts (ä→ae, ö→oe, ü→ue), lowercases,
 * strips non-alphanumeric characters, and trims leading/trailing hyphens.
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[äöüÄÖÜ]/g, (match) => {
      const map: Record<string, string> = {
        ä: 'ae',
        ö: 'oe',
        ü: 'ue',
        Ä: 'ae',
        Ö: 'oe',
        Ü: 'ue',
      };
      return map[match] || match;
    })
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
