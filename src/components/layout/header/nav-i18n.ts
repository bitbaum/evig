/**
 * Nav label resolution — dropdown keys live under nav.items.* (SSOT).
 * Some legacy keys also exist at nav.* top level; we fall back when needed.
 */

export type NavTranslator = (key: string, ...args: unknown[]) => string

function looksLikeMissingKey(result: string, key: string): boolean {
  return (
    result === key
    || result === `nav.${key}`
    || result === `items.${key}`
    || result.endsWith(`.${key}`)
  )
}

/** Resolve a navigation item label from nameKey. */
export function navItemLabel(t: NavTranslator, nameKey: string): string {
  const itemsKey = `items.${nameKey}`
  const fromItems = t(itemsKey)
  if (!looksLikeMissingKey(fromItems, itemsKey) && !looksLikeMissingKey(fromItems, nameKey)) {
    return fromItems
  }
  const fromTop = t(nameKey)
  if (!looksLikeMissingKey(fromTop, nameKey)) {
    return fromTop
  }
  return nameKey
}

/** Resolve a navigation item description from descriptionKey. */
export function navItemDescription(t: NavTranslator, descriptionKey: string): string {
  const itemsKey = `items.${descriptionKey}`
  const fromItems = t(itemsKey)
  if (!looksLikeMissingKey(fromItems, itemsKey) && !looksLikeMissingKey(fromItems, descriptionKey)) {
    return fromItems
  }
  return descriptionKey
}
