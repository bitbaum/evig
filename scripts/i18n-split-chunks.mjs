#!/usr/bin/env node
/**
 * Split messages/_missing/<locale>.json into N chunks for parallel
 * translation. Each chunk is written as messages/_missing/<locale>-chunk-N.json
 * preserving the same shape ({ key: { de, translation } }).
 *
 *   node scripts/i18n-split-chunks.mjs <locale> <n>
 *
 * Companion: i18n-merge-chunks.mjs reassembles them after translation.
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const MISSING_DIR = join(__dirname, '..', 'messages', '_missing')

const locale = process.argv[2]
const n = parseInt(process.argv[3], 10)

if (!locale || !Number.isFinite(n) || n < 1) {
  console.error('Usage: node scripts/i18n-split-chunks.mjs <locale> <n>')
  process.exit(1)
}

const data = JSON.parse(readFileSync(join(MISSING_DIR, `${locale}.json`), 'utf8'))
const keys = Object.keys(data)
const chunkSize = Math.ceil(keys.length / n)

for (let i = 0; i < n; i++) {
  const slice = keys.slice(i * chunkSize, (i + 1) * chunkSize)
  const chunk = Object.fromEntries(slice.map((k) => [k, data[k]]))
  const out = join(MISSING_DIR, `${locale}-chunk-${i + 1}.json`)
  writeFileSync(out, JSON.stringify(chunk, null, 2) + '\n')
  console.log(`chunk ${i + 1}/${n}: ${slice.length} keys → ${out}`)
}
