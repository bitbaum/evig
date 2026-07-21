// Post-build: Node's ESM loader needs explicit file extensions on relative
// imports, but tsc (moduleResolution "bundler") emits them extensionless. The
// source stays extensionless so the monorepo app can consume it via its
// bundler; only the PUBLISHED dist needs the extensions. Rewrite relative
// import/export specifiers in dist/*.js and dist/*.d.ts to add `.js`.
import { readdir, readFile, writeFile } from 'node:fs/promises'

const distUrl = new URL('../dist/', import.meta.url)
const files = (await readdir(distUrl)).filter((f) => f.endsWith('.js') || f.endsWith('.d.ts'))
const SPEC = /(\bfrom\s+["'])(\.\.?\/[^"']+?)(["'])/g

for (const file of files) {
  const url = new URL(file, distUrl)
  const before = await readFile(url, 'utf8')
  const after = before.replace(SPEC, (match, pre, spec, post) =>
    /\.(js|json|mjs|cjs)$/.test(spec) ? match : `${pre}${spec}.js${post}`,
  )
  if (after !== before) await writeFile(url, after)
}
