/**
 * Serialize a JSON-LD object for safe embedding inside an inline
 * <script type="application/ld+json"> tag.
 *
 * `JSON.stringify` alone is unsafe: a literal `</script>` substring inside
 * a string value (e.g. an admin-entered product description) would close
 * the script tag prematurely and let following content execute as HTML.
 *
 * Replacing `<` with its JSON unicode escape stays valid JSON for
 * crawlers but stops the HTML parser from treating the byte as markup.
 */
export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}
