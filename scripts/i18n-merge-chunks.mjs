#!/usr/bin/env node
/**
 * Merge messages/_missing/<locale>-chunk-*.json back into
 * messages/_missing/<locale>.json. Preserves translations the agents wrote.
 *
 *   node scripts/i18n-merge-chunks.mjs <locale>
 */

import { readFileSync, writeFileSync, readdirSync, unlinkSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const MISSING_DIR = join(__dirname, '..', 'messages', '_missing')

const locale = process.argv[2]
if (!locale) {
  console.error('Usage: node scripts/i18n-merge-chunks.mjs <locale>')
  process.exit(1)
}

const chunkRegex = new RegExp(`^${locale}-chunk-(\\d+)\\.json$`)
const chunkFiles = readdirSync(MISSING_DIR)
  .filter((f) => chunkRegex.test(f))
  .sort((a, b) => parseInt(a.match(chunkRegex)[1], 10) - parseInt(b.match(chunkRegex)[1], 10))

if (chunkFiles.length === 0) {
  console.error(`No chunks found for locale=${locale}`)
  process.exit(1)
}

const merged = {}
for (const f of chunkFiles) {
  const data = JSON.parse(readFileSync(join(MISSING_DIR, f), 'utf8'))
  Object.assign(merged, data)
}

const outPath = join(MISSING_DIR, `${locale}.json`)
writeFileSync(outPath, JSON.stringify(merged, null, 2) + '\n')
console.log(`merged ${chunkFiles.length} chunks (${Object.keys(merged).length} keys) → ${outPath}`)

for (const f of chunkFiles) unlinkSync(join(MISSING_DIR, f))
console.log(`cleaned up ${chunkFiles.length} chunk files`)
