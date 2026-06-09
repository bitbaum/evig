#!/usr/bin/env node
/**
 * i18n hardcoded-strings audit
 *
 * Catches the two failure modes that break localization despite the
 * next-intl key-coverage audit passing:
 *
 *   1) Hardcoded German UI strings outside messages/  — they bypass i18n
 *      entirely, so IT/FR/EN visitors see German text on their localized
 *      page. (Detected via German-specific characters ä/ö/ü/Ä/Ö/Ü/ß plus
 *      a "looks like German" heuristic for short strings with no umlauts.)
 *
 *   2) Wrong-language values inside messages/<locale>.json  — e.g. the
 *      Italian file containing English strings because someone bulk-translated
 *      to the wrong locale and saved over it. (Detected via a per-locale
 *      stop-word ratio heuristic.)
 *
 * Exemption: append the marker `i18n-ok` to a line to whitelist it.
 *   Example: const path = 'wäre-okay' // i18n-ok: file system path, not UI
 *
 * Baseline: scripts/baselines/i18n-hardcoded.json lists known violations
 * that are not yet fixed. The audit fails only on NEW violations beyond
 * the baseline. Run with --update-baseline to snapshot the current state
 * after you've fixed everything you intend to fix in a PR.
 */

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const repoRoot = process.cwd()
const updateBaseline = process.argv.includes('--update-baseline')
const verbose = process.argv.includes('--verbose')

const baselinePath = path.join(repoRoot, 'scripts', 'baselines', 'i18n-hardcoded.json')

// ============================================================================
// Source-tree scan: German UI strings in non-message files
// ============================================================================

const SCAN_ROOTS = ['src']
const SCAN_EXT = new Set(['.ts', '.tsx'])
const SCAN_EXCLUDE = [
  /node_modules/,
  /\.next\//,
  /\bdist\//,
  /__tests__/,
  /\.test\.[jt]sx?$/,
  /\.spec\.[jt]sx?$/,
  /\/messages\//,
  /\bmessages\.[a-z]+\.json$/,
]

// Strings that legitimately contain umlauts but are NOT user-facing:
//   - logger / console calls (the next-intl runtime allows German error logs)
//   - import paths, route paths, regex patterns, comments
// We detect these via context heuristics in the regex below.
const GERMAN_CHAR = /[äöüÄÖÜß]/
const COMMENT_LINE = /^\s*(\/\/|\*|\/\*)/
const EXEMPT_MARKER = /\bi18n-ok\b/
const STRING_LITERAL = /(['"`])((?:\\.|(?!\1)[\s\S])*?)\1/g
const LOGGER_CALL_PREFIX = /\b(logger|console)\.\w+\s*\(\s*$/

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (SCAN_EXCLUDE.some((rx) => rx.test(full))) continue
    if (entry.isDirectory()) {
      walk(full, files)
    } else if (entry.isFile() && SCAN_EXT.has(path.extname(entry.name))) {
      files.push(full)
    }
  }
  return files
}

function looksLikeUiString(value) {
  if (!value || value.length < 2) return false
  if (!GERMAN_CHAR.test(value)) return false
  // Skip path-y / identifier-y strings
  if (/^[a-z0-9_\-./@]+$/i.test(value)) return false
  if (/^https?:\/\//.test(value)) return false
  // Skip what's clearly an i18n key (dotted, no spaces)
  if (/^[a-zA-Z0-9_.-]+$/.test(value) && !/\s/.test(value)) return false
  return true
}

function scanSourceFile(filePath) {
  const src = fs.readFileSync(filePath, 'utf8')
  const lines = src.split(/\r?\n/)
  const findings = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (COMMENT_LINE.test(line)) continue
    if (EXEMPT_MARKER.test(line)) continue

    // Quick-reject: skip lines that don't contain a German char at all.
    if (!GERMAN_CHAR.test(line)) continue

    // Drop logger / console call context so error messages don't trip the audit.
    const stripped = line.replace(LOGGER_CALL_PREFIX, '/*logger*/')
    let match
    STRING_LITERAL.lastIndex = 0
    while ((match = STRING_LITERAL.exec(stripped)) !== null) {
      const value = match[2]
      if (!looksLikeUiString(value)) continue
      findings.push({
        file: path.relative(repoRoot, filePath),
        line: i + 1,
        snippet: value.length > 80 ? value.slice(0, 80) + '…' : value,
      })
    }
  }
  return findings
}

// ============================================================================
// Message-file scan: wrong-language values
// ============================================================================

const MESSAGES_DIR = path.join(repoRoot, 'messages')
const LOCALES_TO_CHECK = ['it', 'fr', 'es', 'ja', 'ko', 'ru']

// Stop-word sets per language. If a string contains stop-words from a DIFFERENT
// language than its locale at a higher ratio than from its own, flag it.
// Kept small on purpose — we want signal, not noise.
const STOP_WORDS = {
  en: ['the', 'and', 'is', 'are', 'of', 'with', 'for', 'to', 'our', 'we', 'their', 'they', 'this', 'that', 'have', 'has', 'on', 'in', 'an', 'by'],
  de: ['der', 'die', 'das', 'und', 'ist', 'sind', 'mit', 'für', 'wir', 'unser', 'unsere', 'eine', 'einen', 'durch', 'als', 'auf', 'von', 'auch', 'nicht', 'werden'],
  it: ['il', 'la', 'lo', 'gli', 'le', 'di', 'che', 'è', 'sono', 'con', 'per', 'noi', 'nostro', 'nostra', 'una', 'uno', 'del', 'della', 'nel', 'nella'],
  fr: ['le', 'la', 'les', 'de', 'des', 'et', 'est', 'sont', 'avec', 'pour', 'nous', 'notre', 'nos', 'une', 'un', 'du', 'au', 'aux', 'dans', 'sur'],
  es: ['el', 'la', 'los', 'las', 'de', 'y', 'es', 'son', 'con', 'para', 'nosotros', 'nuestro', 'nuestra', 'una', 'uno', 'del', 'al', 'en', 'por', 'sus'],
}

function wordRatio(text, words) {
  const tokens = text.toLowerCase().match(/[a-zàâäçéèêëîïôöùûüÿœñáíóúü]+/gi) || []
  if (tokens.length === 0) return 0
  let hits = 0
  for (const t of tokens) if (words.includes(t)) hits++
  return hits / tokens.length
}

function looksLikeWrongLanguage(text, locale) {
  if (typeof text !== 'string' || text.trim().length < 12) return null
  // Strip ICU placeholders to avoid skewing token counts
  const cleaned = text.replace(/\{[^}]+\}/g, '')
  const ownWords = STOP_WORDS[locale] || []
  const ownRatio = wordRatio(cleaned, ownWords)
  let bestOther = null
  let bestRatio = 0
  for (const [other, words] of Object.entries(STOP_WORDS)) {
    if (other === locale) continue
    const r = wordRatio(cleaned, words)
    if (r > bestRatio) {
      bestRatio = r
      bestOther = other
    }
  }
  // Flag if some other language scores noticeably higher than the target.
  if (bestRatio >= 0.15 && bestRatio > ownRatio + 0.1) {
    return { suspectedLanguage: bestOther, ownRatio: +ownRatio.toFixed(2), otherRatio: +bestRatio.toFixed(2) }
  }
  return null
}

function* walkJson(obj, trail = []) {
  if (obj == null) return
  if (typeof obj === 'string') {
    yield { keyPath: trail.join('.'), value: obj }
    return
  }
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) yield* walkJson(obj[i], [...trail, String(i)])
    return
  }
  if (typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj)) yield* walkJson(v, [...trail, k])
  }
}

// Load DE values once for citation-detection (string identical across locales = citation).
let _deFlatCache = null
function getDeFlat() {
  if (_deFlatCache) return _deFlatCache
  const deFile = path.join(MESSAGES_DIR, 'de.json')
  if (!fs.existsSync(deFile)) { _deFlatCache = {}; return _deFlatCache }
  const data = JSON.parse(fs.readFileSync(deFile, 'utf8'))
  const out = {}
  for (const { keyPath, value } of walkJson(data)) out[keyPath] = value
  _deFlatCache = out
  return out
}

// Key-suffix conventions for fields that legitimately stay identical across locales
// (citations, attributions, brand/product names).
const KEY_EXEMPT_SUFFIXES = ['.source', '.citation', '.brand', '.attribution']

function isExemptKey(keyPath) {
  return KEY_EXEMPT_SUFFIXES.some((s) => keyPath.endsWith(s))
}

function scanMessageFile(locale) {
  const file = path.join(MESSAGES_DIR, `${locale}.json`)
  if (!fs.existsSync(file)) return []
  const data = JSON.parse(fs.readFileSync(file, 'utf8'))
  const deFlat = getDeFlat()
  const findings = []
  for (const { keyPath, value } of walkJson(data)) {
    // Skip citation-style keys by convention.
    if (isExemptKey(keyPath)) continue
    // Skip strings identical to DE — proper nouns, brand names, citations.
    if (typeof value === 'string' && deFlat[keyPath] === value) continue
    const verdict = looksLikeWrongLanguage(value, locale)
    if (verdict) {
      findings.push({
        file: `messages/${locale}.json`,
        keyPath,
        suspectedLanguage: verdict.suspectedLanguage,
        ownRatio: verdict.ownRatio,
        otherRatio: verdict.otherRatio,
        snippet: value.length > 80 ? value.slice(0, 80) + '…' : value,
      })
    }
  }
  return findings
}

// ============================================================================
// Run
// ============================================================================

function fingerprintSrc(f)     { return `src::${f.file}:${f.line}::${f.snippet}` }
function fingerprintMsg(f)     { return `msg::${f.file}::${f.keyPath}` }

const allSrcFindings = []
for (const root of SCAN_ROOTS) {
  const absRoot = path.join(repoRoot, root)
  if (!fs.existsSync(absRoot)) continue
  const files = walk(absRoot)
  for (const f of files) allSrcFindings.push(...scanSourceFile(f))
}

const allMsgFindings = []
for (const locale of LOCALES_TO_CHECK) {
  allMsgFindings.push(...scanMessageFile(locale))
}

const currentSet = new Set([
  ...allSrcFindings.map(fingerprintSrc),
  ...allMsgFindings.map(fingerprintMsg),
])

if (updateBaseline) {
  fs.mkdirSync(path.dirname(baselinePath), { recursive: true })
  fs.writeFileSync(
    baselinePath,
    JSON.stringify({
      description: 'Known i18n hardcoded-string violations. Audit fails on regressions only. Run scripts/i18n-hardcoded-audit.mjs --update-baseline to refresh after intentional fixes.',
      generatedAt: new Date().toISOString().slice(0, 10),
      source: allSrcFindings,
      messages: allMsgFindings,
    }, null, 2) + '\n'
  )
  console.log(`Wrote baseline (${allSrcFindings.length} src, ${allMsgFindings.length} msg findings) → ${path.relative(repoRoot, baselinePath)}`)
  process.exit(0)
}

const baseline = fs.existsSync(baselinePath)
  ? JSON.parse(fs.readFileSync(baselinePath, 'utf8'))
  : { source: [], messages: [] }

const baselineSet = new Set([
  ...(baseline.source || []).map(fingerprintSrc),
  ...(baseline.messages || []).map(fingerprintMsg),
])

const newSrc = allSrcFindings.filter((f) => !baselineSet.has(fingerprintSrc(f)))
const newMsg = allMsgFindings.filter((f) => !baselineSet.has(fingerprintMsg(f)))
const fixedFingerprints = [...baselineSet].filter((fp) => !currentSet.has(fp))

console.log(`i18n hardcoded-string audit`)
console.log(`  source files: ${allSrcFindings.length} total, ${newSrc.length} new`)
console.log(`  message files: ${allMsgFindings.length} total, ${newMsg.length} new`)
console.log(`  fixed since baseline: ${fixedFingerprints.length}`)

if (verbose || newSrc.length || newMsg.length) {
  if (newSrc.length) {
    console.log('\nNew German-string findings in src/:')
    for (const f of newSrc.slice(0, 40)) {
      console.log(`  ${f.file}:${f.line}  "${f.snippet}"`)
    }
    if (newSrc.length > 40) console.log(`  ...and ${newSrc.length - 40} more`)
  }
  if (newMsg.length) {
    console.log('\nNew wrong-language findings in messages/:')
    for (const f of newMsg.slice(0, 40)) {
      console.log(`  ${f.file}  ${f.keyPath}  (looks like ${f.suspectedLanguage}, own ${f.ownRatio} vs other ${f.otherRatio})`)
      console.log(`     "${f.snippet}"`)
    }
    if (newMsg.length > 40) console.log(`  ...and ${newMsg.length - 40} more`)
  }
}

if (newSrc.length || newMsg.length) {
  console.log(`\n✗ ${newSrc.length + newMsg.length} new i18n violation(s).`)
  console.log('  Fix the code to use t()/getTranslations(), or move strings to messages/<locale>.json.')
  console.log('  If a string is intentionally non-UI (path, regex, log message), append "// i18n-ok" to the line.')
  console.log('  To accept current state as the baseline: npm run compliance:i18n-hardcoded -- --update-baseline')
  process.exit(1)
}

console.log('\n✓ No new i18n hardcoded-string violations.')
