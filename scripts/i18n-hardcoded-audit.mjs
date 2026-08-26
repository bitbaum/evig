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

// KNOWN BLIND SPOT (found by mutation-testing this gate, 2026-08):
// only QUOTED string literals are scanned. A German sentence written as JSX
// TEXT — `<p>Keine Einträge gefunden</p>` — is not detected, because it never
// appears inside quotes. Planting one produces "0 new" and a green gate.
// Attribute values, props and variables ARE caught. Closing this needs a JSX
// text-node pass (parse, or a `>…<` scan that excludes expressions); until
// then, do not read a green run as "no hardcoded German in components".
//
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
//
// A HOLE in one list is worse than a short list: it makes CORRECT text look
// foreign. "Trovare un tecnico" is unimpeachable Italian, but `un` was listed
// only under fr (it had `una`/`uno` and not the masculine `un`), so it scored
// Italian 0.00 / French 0.33 and was flagged three separate times. Likewise
// "Encontrar a quien lo repare" — es was missing both `lo` and `a`, while it
// had `lo`. Every entry below is a function word; if you add one to a list,
// check whether its siblings need it too.
const STOP_WORDS = {
  en: ['the', 'and', 'is', 'are', 'of', 'with', 'for', 'to', 'our', 'we', 'their', 'they', 'this', 'that', 'have', 'has', 'on', 'in', 'an', 'by',
       'a', 'or', 'but', 'if', 'as', 'at', 'from', 'it', 'its', 'be', 'you', 'your', 'not', 'can', 'what', 'who'],
  de: ['der', 'die', 'das', 'und', 'ist', 'sind', 'mit', 'für', 'wir', 'unser', 'unsere', 'eine', 'einen', 'durch', 'als', 'auf', 'von', 'auch', 'nicht', 'werden',
       'in', 'zu', 'den', 'dem', 'ein', 'sich', 'oder', 'aber', 'wenn', 'wie', 'mehr', 'hat', 'haben', 'sein', 'was', 'wer', 'man', 'nur'],
  it: ['il', 'la', 'lo', 'gli', 'le', 'di', 'che', 'è', 'sono', 'con', 'per', 'noi', 'nostro', 'nostra', 'una', 'uno', 'del', 'della', 'nel', 'nella',
       'un', 'in', 'e', 'a', 'da', 'non', 'si', 'come', 'più', 'anche', 'ma', 'se', 'ha', 'hanno', 'essere', 'questo', 'questa', 'chi', 'o', 'ai'],
  fr: ['le', 'la', 'les', 'de', 'des', 'et', 'est', 'sont', 'avec', 'pour', 'nous', 'notre', 'nos', 'une', 'un', 'du', 'au', 'aux', 'dans', 'sur',
       'à', 'en', 'que', 'qui', 'ne', 'pas', 'ce', 'cette', 'ou', 'si', 'plus', 'comme', 'a', 'ont', 'être', 'par', 'son', 'se'],
  es: ['el', 'la', 'los', 'las', 'de', 'y', 'es', 'son', 'con', 'para', 'nosotros', 'nuestro', 'nuestra', 'una', 'uno', 'del', 'al', 'en', 'por', 'sus',
       'lo', 'a', 'que', 'quien', 'se', 'un', 'no', 'su', 'como', 'más', 'pero', 'ha', 'han', 'ser', 'este', 'esta', 'o', 'si'],
}

/**
 * Below this many tokens the verdict is noise, not signal.
 *
 * The heuristic's resolution is 1/N: on a three-word string a single shared
 * article moves the ratio by 0.33, which clears the 0.15 threshold on its own.
 * Guessing a language from three words is not something this check can do, so
 * it declines to instead of guessing wrong.
 */
const MIN_TOKENS_FOR_LANGUAGE_GUESS = 6

/**
 * The only languages this check claims to detect.
 *
 * A bag-of-stop-words comparison CANNOT separate sibling Romance languages,
 * and pretending otherwise cost real time: across three PRs it flagged
 * "Trovare un tecnico", "Encontrar a quien lo repare", "LO QUE HACEMOS" and
 * seven more — every one of them correct in its own language, none of them a
 * real defect. The words simply overlap (`un`, `su`, `e`, `non`, `nos`,
 * `lo`), and widening the dictionaries only moves the contamination around:
 * teaching es the word `su` immediately made correct Italian look Spanish.
 *
 * What it detects reliably is untranslated **English or German** sitting in a
 * translated file, because those function words barely overlap with Romance
 * or CJK ones — and that is the leak that actually happens here, since DE is
 * the source language and EN the pivot. Restricted to that, the check found
 * ~28 genuine leaks across six locales on its first run.
 *
 * KNOWN AND ACCEPTED GAP: French text sitting in es.json will not be caught.
 * We have never observed one; we had observed ten false alarms. If that
 * changes, the fix is a real language-identification library, not more
 * stop-words.
 */
const LEAK_SOURCES = ['en', 'de']

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
  const tokenCount = (cleaned.toLowerCase().match(/[a-zàâäçéèêëîïôöùûüÿœñáíóúü]+/gi) || []).length
  if (tokenCount < MIN_TOKENS_FOR_LANGUAGE_GUESS) return null

  // For ja/ko/ru the tokenizer only ever sees the LATIN fragments — brand
  // names, product names, a stray article. A Korean sentence containing
  // "evig" and "Revamp-IT" would score as English on those crumbs alone.
  // Only judge a string whose letters are overwhelmingly Latin; anything
  // written in its own script is, by construction, not an English leak.
  // \p{L} is required here: JavaScript's \w (and therefore [^\W\d_]) is
  // ASCII-only even under the /u flag, so Hangul, kana and Cyrillic all
  // counted as ZERO letters and this guard silently did nothing.
  const latin = (cleaned.match(/[a-zàâäçéèêëîïôöùûüÿœñáíóúü]/gi) || []).length
  const nonLatin = (cleaned.match(/\p{L}/gu) || []).length - latin
  if (nonLatin > latin * 0.25) return null
  const ownWords = STOP_WORDS[locale] || []
  const ownRatio = wordRatio(cleaned, ownWords)
  let bestOther = null
  let bestRatio = 0
  for (const other of LEAK_SOURCES) {
    if (other === locale) continue
    const r = wordRatio(cleaned, STOP_WORDS[other])
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

// Deliberately WITHOUT the line number. Keying a known violation to file:line
// meant that editing anything ABOVE it shifted the line and the same untouched
// string reported as a NEW violation — so an unrelated PR could turn the gate
// red and the only cheap answer was to re-snapshot the baseline. A gate that
// cries wolf on every refactor is a gate that gets removed. file + snippet
// identifies the violation; the line is display only.
function fingerprintSrc(f)     { return `src::${f.file}::${f.snippet}` }
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
