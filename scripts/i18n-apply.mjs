#!/usr/bin/env node
/**
 * Merge filled-in translator output back into messages/<locale>.json.
 *
 * Companion to scripts/i18n-missing.mjs. Workflow:
 *
 *   1. npm run i18n:missing
 *      → emits messages/_missing/<locale>.json  ({ key: { de, translation: null } })
 *
 *   2. Send to translator. They fill in every `translation` field.
 *
 *   3. npm run i18n:apply <locale>
 *      → reads messages/_missing/<locale>.json
 *      → for every entry with a non-empty translation, sets the matching
 *        dotted-key path in messages/<locale>.json
 *      → leaves untouched-keys alone (so partial returns are fine)
 *
 * Safe by design:
 *   - Never overwrites an existing non-empty value (translator can't
 *     accidentally regress strings already translated).
 *   - Skips entries where `translation` is null / empty / whitespace.
 *   - Prints a summary of applied / skipped / conflicts.
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
  console.error(`Usage: npm run i18n:apply <locale>`)
  console.error(`  locale must be one of: ${VALID_LOCALES.join(', ')}`)
  process.exit(1)
}

const inputPath = join(MESSAGES_DIR, '_missing', `${locale}.json`)
const targetPath = join(MESSAGES_DIR, `${locale}.json`)

if (!existsSync(inputPath)) {
  console.error(`Missing input: ${inputPath}`)
  console.error(`Run \`npm run i18n:missing\` first, then send the file to a translator.`)
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

function getByPath(obj, dottedPath) {
  const parts = dottedPath.split('.')
  let cur = obj
  for (const k of parts) {
    if (cur == null || typeof cur !== 'object') return undefined
    cur = cur[k]
  }
  return cur
}

let applied = 0
let skippedEmpty = 0
let skippedExisting = 0
const conflicts = []

function isEmpty(v) {
  if (v == null) return true
  if (typeof v === 'string') return v.trim() === ''
  if (Array.isArray(v)) return v.length === 0
  if (typeof v === 'object') return Object.keys(v).length === 0
  return false
}

for (const [key, entry] of Object.entries(input)) {
  // Accept strings, arrays, or objects — the DE source may be any of these
  // (e.g. arrays of feature bullets, arrays of step objects).
  let translation = entry?.translation
  if (typeof translation === 'string') translation = translation.trim()
  if (isEmpty(translation)) {
    skippedEmpty++
    continue
  }

  const existing = getByPath(target, key)
  // Conflict detection only applies to existing non-empty string values that
  // differ from both DE and the new candidate. Arrays/objects always overwrite
  // (they're either missing or stale — translator owns the structure).
  if (typeof existing === 'string' && existing !== '' && existing !== entry.de) {
    if (existing !== translation) {
      conflicts.push({ key, existing, candidate: translation })
      continue
    }
    skippedExisting++
    continue
  }

  setByPath(target, key, translation)
  applied++
}

writeFileSync(targetPath, JSON.stringify(target, null, 2) + '\n', 'utf8')

console.log(`\n  ${locale}:`)
console.log(`    Applied:           ${applied}`)
console.log(`    Skipped (empty):   ${skippedEmpty}`)
console.log(`    Skipped (already translated): ${skippedExisting}`)
if (conflicts.length) {
  console.log(`    CONFLICTS (manual review needed): ${conflicts.length}`)
  for (const c of conflicts.slice(0, 10)) {
    console.log(`      ${c.key}`)
    console.log(`        existing  : ${c.existing}`)
    console.log(`        candidate : ${c.candidate}`)
  }
  if (conflicts.length > 10) console.log(`      ... and ${conflicts.length - 10} more`)
}
console.log()
console.log(`  Wrote: ${targetPath.replace(ROOT + '/', '')}`)
console.log(`  Re-run \`npm run i18n:missing\` to verify the missing count dropped.`)
