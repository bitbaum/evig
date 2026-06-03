#!/usr/bin/env node
/**
 * Generate per-locale "missing translation keys" inventory files.
 *
 * Reads messages/de.json (the canonical source), compares to every other
 * locale, and writes messages/_missing/<locale>.json containing every key
 * present in DE but absent (or empty) in the target locale.
 *
 * Output shape is translator-friendly:
 *   {
 *     "about.team": { "de": "Das Team", "translation": null },
 *     "shop.foo":   { "de": "Foo",      "translation": null }
 *   }
 *
 * Workflow:
 *   1. npm run i18n:missing
 *   2. Send messages/_missing/<locale>.json to a translator
 *   3. Translator fills in "translation" values
 *   4. npm run i18n:apply <locale>  (see scripts/i18n-apply.mjs)
 *      merges them back into messages/<locale>.json
 *
 * Until step 4 runs, missing keys gracefully fall back to DE via the
 * deepMerge in src/i18n/request.ts — so non-DE users see DE text rather
 * than literal keys. Acceptable interim state, not silent failure.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const MESSAGES_DIR = join(ROOT, 'messages')
const OUT_DIR = join(MESSAGES_DIR, '_missing')
const LOCALES = ['en', 'fr', 'es', 'it', 'ja', 'ko']

function flatten(obj, prefix = '') {
  const out = {}
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      Object.assign(out, flatten(v, path))
    } else {
      out[path] = v
    }
  }
  return out
}

const de = flatten(JSON.parse(readFileSync(join(MESSAGES_DIR, 'de.json'), 'utf8')))
const deKeys = new Set(Object.keys(de))

if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true })

let totalMissing = 0
const summary = []

for (const loc of LOCALES) {
  const path = join(MESSAGES_DIR, `${loc}.json`)
  const data = flatten(JSON.parse(readFileSync(path, 'utf8')))
  const localeKeys = new Set(Object.keys(data))

  const missing = {}
  for (const k of deKeys) {
    if (!localeKeys.has(k) || data[k] === '' || data[k] === null) {
      missing[k] = { de: de[k], translation: null }
    }
  }

  const count = Object.keys(missing).length
  totalMissing += count
  summary.push({ locale: loc, missing: count })

  const outPath = join(OUT_DIR, `${loc}.json`)
  writeFileSync(outPath, JSON.stringify(missing, null, 2), 'utf8')
  console.log(`  ${loc}: ${count} missing → ${outPath.replace(ROOT + '/', '')}`)
}

console.log(`\nTotal missing across ${LOCALES.length} locales: ${totalMissing}`)
console.log(`\nNext: send messages/_missing/<locale>.json files to a translator.`)
