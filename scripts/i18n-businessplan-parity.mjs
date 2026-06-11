#!/usr/bin/env node
/**
 * SSOT parity check for projects.upcycling.businessPlan.
 *
 * Why this exists: the businessPlan block is referenced by name in
 * src/app/[locale]/projects/upcycling/businessplan/page.tsx via t.raw().
 * If one locale's shape drifts from DE (missing key, extra key, wrong
 * shape, divergent numeric value, divergent proper noun, divergent URL)
 * the page breaks or silently shows the wrong thing in one language.
 *
 * This script enforces:
 *   1. **Shape parity**: every locale has the same key set at every depth.
 *   2. **Invariant parity**: numeric values, dates, proper nouns and URLs
 *      that should NEVER differ across locales are byte-identical.
 *
 * Run via `npm run i18n:businessplan` (added to package.json).
 * Exits 0 on success, 1 on any drift.
 */

import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const LOCALES = ['de', 'en', 'fr', 'it', 'es', 'ja', 'ko', 'ru']
const CANONICAL = 'de'

/** Strings that must be byte-identical across every locale. Add to this
 *  list whenever a new invariant (proper noun, URL, date, CHF amount)
 *  shows up in the businessPlan content. */
const INVARIANT_PATTERNS = [
  // Project identifiers (registered IDs, never change)
  /^132\.351 INNO-EE$/,
  /^Verein revamp-it$/,
  /^Corinna Baumgartner, ZHAW$/,
  // Pure money values — must terminate at CHF, no trailing prose
  /^[\d'.,]+\s*CHF$/,
  /^[\d'.,]+\s*[\u2013-]\s*[\d'.,]+\s*CHF$/,
  /^\u2212\s*[\d'.,]+\s*CHF$/,
  // ISO-ish dates dd.mm.yyyy
  /^\d{2}\.\d{2}\.\d{4}$/,
  /^\d{2}\.\d{2}\.\d{4},\s*\d{2}:\d{2}$/,
  /^\d{2}\.\d{2}\.\s*[\u2013-]\s*\d{2}\.\d{2}\.\d{4}$/,
  // Photo asset paths
  /^\/projects\/upcycling\/(businessplan|competitor-benchmark)\/.+$/,
  // External URLs (must terminate at URL with no trailing prose)
  /^https?:\/\/[^\s]+$/,
  // Internal route
  /^\/get-involved\/donate$/,
]

function isInvariantString(s) {
  if (typeof s !== 'string') return false
  return INVARIANT_PATTERNS.some(p => p.test(s))
}

/** Mailto links: recipient invariant, subject locale-specific. Compare
 *  only the part before "?" (scheme + recipient). */
function comparableMailto(s) {
  return typeof s === 'string' && s.startsWith('mailto:') ? s.split('?')[0] : null
}


function loadBlock(lc) {
  const p = resolve(ROOT, 'messages', `${lc}.json`)
  const d = JSON.parse(readFileSync(p, 'utf8'))
  const bp = d?.projects?.upcycling?.businessPlan
  if (!bp) throw new Error(`messages/${lc}.json has no projects.upcycling.businessPlan`)
  return bp
}

function shapeOf(o, prefix = '') {
  const out = new Map()
  if (o === null || o === undefined) return out
  if (Array.isArray(o)) {
    out.set(prefix, `array(${o.length})`)
    o.forEach((v, i) => {
      for (const [k, t] of shapeOf(v, `${prefix}[${i}]`)) out.set(k, t)
    })
  } else if (typeof o === 'object') {
    out.set(prefix, 'object')
    for (const [k, v] of Object.entries(o)) {
      for (const [kk, t] of shapeOf(v, prefix ? `${prefix}.${k}` : k)) out.set(kk, t)
    }
  } else {
    out.set(prefix, typeof o)
  }
  return out
}

function walkInvariants(o, prefix = '', out = new Map()) {
  if (o === null || o === undefined) return out
  if (Array.isArray(o)) {
    o.forEach((v, i) => walkInvariants(v, `${prefix}[${i}]`, out))
  } else if (typeof o === 'object') {
    for (const [k, v] of Object.entries(o)) {
      walkInvariants(v, prefix ? `${prefix}.${k}` : k, out)
    }
  } else if (isInvariantString(o)) {
    out.set(prefix, o)
  } else {
    const m = comparableMailto(o)
    if (m) out.set(prefix + ' (mailto-recipient)', m)
  }
  return out
}

let failed = false
const canon = loadBlock(CANONICAL)
const canonShape = shapeOf(canon)
const canonInv = walkInvariants(canon)

for (const lc of LOCALES) {
  if (lc === CANONICAL) continue
  const block = loadBlock(lc)

  // Shape parity
  const s = shapeOf(block)
  const allPaths = new Set([...canonShape.keys(), ...s.keys()])
  const shapeDrift = []
  for (const k of allPaths) {
    const a = canonShape.get(k)
    const b = s.get(k)
    if (a !== b) shapeDrift.push(`${k}: de=${a ?? 'MISSING'} ${lc}=${b ?? 'MISSING'}`)
  }
  if (shapeDrift.length) {
    failed = true
    console.error(`✗ ${lc}: shape drift (${shapeDrift.length} path(s))`)
    for (const m of shapeDrift.slice(0, 15)) console.error('    ' + m)
    if (shapeDrift.length > 15) console.error(`    (and ${shapeDrift.length - 15} more)`)
  }

  // Invariant parity
  const inv = walkInvariants(block)
  const invDrift = []
  for (const [path, want] of canonInv) {
    const got = inv.get(path)
    if (got !== want) invDrift.push(`${path}: de=${JSON.stringify(want)} ${lc}=${JSON.stringify(got)}`)
  }
  if (invDrift.length) {
    failed = true
    console.error(`✗ ${lc}: invariant drift (${invDrift.length} value(s) differ from DE)`)
    for (const m of invDrift.slice(0, 15)) console.error('    ' + m)
    if (invDrift.length > 15) console.error(`    (and ${invDrift.length - 15} more)`)
  }

  if (shapeDrift.length === 0 && invDrift.length === 0) {
    console.log(`✓ ${lc}: ${canonShape.size} paths, ${canonInv.size} invariants — identical to DE`)
  }
}

if (failed) {
  console.error('\nbusinessPlan SSOT check FAILED — fix drift and rerun.')
  process.exit(1)
} else {
  console.log(`\n✓ businessPlan SSOT parity OK across ${LOCALES.length} locales.`)
}
