#!/usr/bin/env node
/**
 * i18n staleness detector.
 *
 * Problem: when a canonical DE string is rewritten, the translations in other
 * locales silently keep their OLD text — the key still exists, so the DE
 * deep-merge fallback never kicks in, and users see stale content (e.g. an
 * out-of-date call-to-action). Missing-key audits can't catch this; the key is
 * present, just outdated.
 *
 * Mechanism: a per-locale baseline records a hash of the DE source each
 * translation was made from (`messages/_source-baseline.json`). The check
 * compares the recorded hash against the CURRENT DE value: if DE changed since
 * the translation was snapshotted, that locale's translation of that key is
 * flagged stale.
 *
 * Usage:
 *   node scripts/i18n-stale.mjs               # check — report stale translations (exit 1 if any)
 *   node scripts/i18n-stale.mjs --update      # snapshot current DE hashes as fresh (all locales)
 *   node scripts/i18n-stale.mjs --update ru   # snapshot a single locale (after re-translating it)
 *   node scripts/i18n-stale.mjs --check --max 0   # CI gate: fail on ANY stale (default behaviour)
 *
 * Workflow: after translating/updating a locale, run `--update <locale>` to mark
 * it fresh and commit the baseline. A later DE edit re-flags the affected keys.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const MESSAGES_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'messages')
const BASELINE_PATH = join(MESSAGES_DIR, '_source-baseline.json')
const SOURCE_LOCALE = 'de'

const sha1 = (s) => createHash('sha1').update(s, 'utf8').digest('hex').slice(0, 12)

/** Flatten an object tree to { 'a.b.c': value } for STRING leaves only. */
function flatten(obj, prefix, out) {
  if (obj === null || typeof obj !== 'object') return out
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k
    if (typeof v === 'string') out[key] = v
    else if (v && typeof v === 'object') flatten(v, key, out)
  }
  return out
}

function loadLocale(locale) {
  return flatten(JSON.parse(readFileSync(join(MESSAGES_DIR, `${locale}.json`), 'utf8')), '', {})
}

const localeFiles = (await import('node:fs')).readdirSync(MESSAGES_DIR)
  .filter((f) => /^[a-z]{2}\.json$/.test(f) && f !== `${SOURCE_LOCALE}.json`)
  .map((f) => f.replace('.json', ''))

const de = loadLocale(SOURCE_LOCALE)
const args = process.argv.slice(2)
const isUpdate = args.includes('--update')
const updateLocale = isUpdate ? args[args.indexOf('--update') + 1]?.replace(/^--/, '') || null : null

const baseline = existsSync(BASELINE_PATH) ? JSON.parse(readFileSync(BASELINE_PATH, 'utf8')) : {}

if (isUpdate) {
  const targets = updateLocale && !updateLocale.startsWith('-') ? [updateLocale] : localeFiles
  for (const locale of targets) {
    const loc = loadLocale(locale)
    const snap = {}
    // Record DE hash for every key this locale actually defines (i.e. translates),
    // and whose value differs from DE (a real translation, not a copied fallback).
    for (const key of Object.keys(loc)) {
      if (key in de && loc[key] !== de[key]) snap[key] = sha1(de[key])
    }
    baseline[locale] = snap
    console.log(`  ${locale}: snapshotted ${Object.keys(snap).length} translated keys as fresh`)
  }
  writeFileSync(BASELINE_PATH, JSON.stringify(baseline, null, 2) + '\n', 'utf8')
  console.log(`\nWrote ${BASELINE_PATH}`)
  process.exit(0)
}

// Check mode
let totalStale = 0
const report = []
for (const locale of localeFiles) {
  const recorded = baseline[locale]
  if (!recorded) continue
  const loc = loadLocale(locale)
  const stale = []
  for (const [key, recordedHash] of Object.entries(recorded)) {
    if (!(key in de)) continue // DE removed the key — not stale, just gone
    if (!(key in loc)) continue // locale dropped its translation — falls back to DE
    if (sha1(de[key]) !== recordedHash) stale.push(key)
  }
  if (stale.length) {
    report.push({ locale, stale })
    totalStale += stale.length
  }
}

if (totalStale === 0) {
  console.log('✓ No stale translations — every recorded translation still matches its DE source.')
  process.exit(0)
}

console.error(`✗ ${totalStale} stale translation(s) — DE source changed since these were translated:\n`)
for (const { locale, stale } of report) {
  console.error(`  ${locale}: ${stale.length} stale`)
  for (const key of stale.slice(0, 12)) console.error(`     • ${key}`)
  if (stale.length > 12) console.error(`     … and ${stale.length - 12} more`)
}
console.error(`\nRe-translate the keys above, then run: node scripts/i18n-stale.mjs --update <locale>`)
process.exit(1)
