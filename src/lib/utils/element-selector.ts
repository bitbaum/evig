/**
 * Generates a CSS selector string for a DOM element.
 * Prefers id, falls back to tag+classes (excluding suggestion-* internals).
 */
export function generateSelector(element: Element): string {
  if (element.id) return `#${element.id}`
  if (element.className) {
    const classes = element.className.split(' ').filter(c => c && !c.startsWith('suggestion-'))
    if (classes.length > 0) {
      return `${element.tagName.toLowerCase()}.${classes.slice(0, 2).join('.')}`
    }
  }
  return element.tagName.toLowerCase()
}
