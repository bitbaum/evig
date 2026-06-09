#!/usr/bin/env node
/**
 * Merge filled-in leak translations from messages/_missing/<locale>-leaks.json
 * back into messages/<locale>.json.
 *
 * Unlike i18n-apply.mjs, this script FORCE-OVERWRITES the existing value when
 * a non-empty translation is provided. Leaks are by definition pre-existing
 * wrong-language content that needs to be replaced.
 *
 *   node scripts/i18n-apply-leaks.mjs <locale>
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const MESSAGES_DIR = join(ROOT, 'messages')
const VALID_LOCALES = ['en', 'fr', 'es', 'it', 'ja', 'ko', 'ru']

const locale = process.argv[2]

if (!locale || !VALID_LOCALES.includes(locale)) {
  console.error(`Usage: node scripts/i18n-apply-leaks.mjs <locale>`)
  console.error(`  locale must be one of: ${VALID_LOCALES.join(', ')}`)
  process.exit(1)
}

const inputPath = join(MESSAGES_DIR, '_missing', `${locale}-leaks.json`)
const targetPath = join(MESSAGES_DIR, `${locale}.json`)

if (!existsSync(inputPath)) {
  console.error(`Missing input: ${inputPath}`)
  process.exit(1)
}

const input = JSON.parse(readFileSync(inputPath, 'utf8'))
const target = JSON.parse(readFileSync(targetPath, 'utf8'))

function setByPath(obj, dottedPath, value) {
  const parts = dottedPath.split('.')
  let cur = obj
  for (let i = 0; i < parts.length - 1; i++) {
    const k = parts[i]
    if (cur[k] == null || typeof cur[k] !== 'object' || Array.isArray(cur[k])) {
      cur[k] = {}
    }
    cur = cur[k]
  }
  cur[parts[parts.length - 1]] = value
}

let applied = 0
let skippedEmpty = 0

for (const [key, entry] of Object.entries(input)) {
  let translation = entry?.translation
  if (typeof translation === 'string') translation = translation.trim()
  if (!translation) {
    skippedEmpty++
    continue
  }
  setByPath(target, key, translation)
  applied++
}

writeFileSync(targetPath, JSON.stringify(target, null, 2) + '\n', 'utf8')

console.log(`\n  ${locale}:`)
console.log(`    Applied (overwrote leaks): ${applied}`)
console.log(`    Skipped (empty):           ${skippedEmpty}`)
console.log(`\n  Wrote: messages/${locale}.json`)
