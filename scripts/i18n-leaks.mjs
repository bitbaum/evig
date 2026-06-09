#!/usr/bin/env node
/**
 * Detect "leak" keys per locale: entries that exist but contain English (or
 * German) source text identical to en.json (or de.json), indicating the key
 * was never translated and only happens to render because the file has a
 * non-empty value.
 *
 * Writes messages/_missing/<locale>-leaks.json shaped like:
 *   { "key.path": { "de": "...", "current": "english leak", "translation": null } }
 *
 * Filters out values that look like:
 *   - Pure ICU placeholders ("{count}", "{name}")
 *   - Brand/proper-noun lines ("Linux", "RevampIT")
 *   - URLs/slugs/paths
 *   - Less than 2 alphabetic words
 *
 *   node scripts/i18n-leaks.mjs
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const MESSAGES_DIR = join(ROOT, 'messages')
const OUT_DIR = join(MESSAGES_DIR, '_missing')

const LOCALES = ['fr', 'es', 'it', 'ja', 'ko', 'ru']

function flatten(obj, prefix = '') {
  const out = {}
  for (const [k, v] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${k}` : k
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      Object.assign(out, flatten(v, p))
    } else if (typeof v === 'string') {
      out[p] = v
    }
  }
  return out
}

const stripPlaceholders = (s) => s.replace(/\{[^}]+\}/g, '').replace(/<[^>]+>/g, '')

/**
 * A "real content" leak is a value where:
 *   - The DE source has actual translatable text
 *   - The locale value equals the EN value (or DE value) exactly
 *   - After stripping placeholders/tags, there are ≥2 alphabetic words
 *   - It contains at least one lowercase letter (avoids pure-uppercase brand text)
 *   - It's not a URL/path
 */
function isRealContentLeak(deValue, leakValue) {
  if (!deValue || typeof deValue !== 'string' || deValue.trim() === '') return false
  if (typeof leakValue !== 'string' || leakValue.trim() === '') return false
  const cleaned = stripPlaceholders(leakValue).trim()
  if (cleaned.length < 6) return false
  if (/^https?:\/\//.test(cleaned)) return false
  if (/^[A-Z][a-zA-Z]+(-[A-Z][a-zA-Z]+)*$/.test(cleaned)) return false // "Revamp-IT"
  const words = cleaned.match(/[A-Za-zÀ-ÿ]+/g) || []
  if (words.length < 2) return false
  if (!/[a-z]/.test(cleaned)) return false
  return true
}

const de = flatten(JSON.parse(readFileSync(join(MESSAGES_DIR, 'de.json'), 'utf8')))
const en = flatten(JSON.parse(readFileSync(join(MESSAGES_DIR, 'en.json'), 'utf8')))

if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true })

let total = 0
for (const loc of LOCALES) {
  const data = flatten(JSON.parse(readFileSync(join(MESSAGES_DIR, `${loc}.json`), 'utf8')))
  const leaks = {}
  for (const [k, v] of Object.entries(data)) {
    const deV = de[k]
    const enV = en[k]
    if (!deV) continue
    // Identical to EN translation (and EN differs from DE — otherwise it's the
    // same brand/proper-noun across locales, not a leak)
    const isEnLeak = enV && v === enV && enV !== deV
    // Identical to DE source (DE leaked into the locale instead of translating)
    const isDeLeak = v === deV && /[ÄÖÜäöüß]|sind|der|die|das|und|für/.test(deV)
    if ((isEnLeak || isDeLeak) && isRealContentLeak(deV, v)) {
      leaks[k] = { de: deV, current: v, translation: null }
    }
  }
  const count = Object.keys(leaks).length
  total += count
  const outPath = join(OUT_DIR, `${loc}-leaks.json`)
  writeFileSync(outPath, JSON.stringify(leaks, null, 2) + '\n', 'utf8')
  console.log(`  ${loc}: ${count} leak(s) → ${outPath.replace(ROOT + '/', '')}`)
}
console.log(`\nTotal leaks across ${LOCALES.length} locales: ${total}`)
