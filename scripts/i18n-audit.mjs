#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const repoRoot = process.cwd()
const messagesDir = path.join(repoRoot, 'messages')
const baselinePath = path.join(repoRoot, 'scripts', 'baselines', 'i18n-missing.json')
const defaultLocale = 'de'
const locales = ['fr', 'en', 'it', 'es', 'ja', 'ko', 'ru']
const updateBaseline = process.argv.includes('--update-baseline')

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function flattenKeys(value, prefix = '') {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return [prefix]
  }

  return Object.entries(value).flatMap(([key, nested]) => {
    const nextPrefix = prefix ? `${prefix}.${key}` : key
    return flattenKeys(nested, nextPrefix)
  })
}

function uniqueSorted(values) {
  return [...new Set(values)].sort()
}

const baseMessages = readJson(path.join(messagesDir, `${defaultLocale}.json`))
const baseKeys = new Set(flattenKeys(baseMessages))

const currentMissing = Object.fromEntries(
  locales.map((locale) => {
    const localeMessages = readJson(path.join(messagesDir, `${locale}.json`))
    const localeKeys = new Set(flattenKeys(localeMessages))
    return [locale, uniqueSorted([...baseKeys].filter((key) => !localeKeys.has(key)))]
  })
)

if (updateBaseline) {
  fs.mkdirSync(path.dirname(baselinePath), { recursive: true })
  fs.writeFileSync(
    baselinePath,
    `${JSON.stringify({
      description: 'Known missing translation keys. The audit fails only on regressions beyond this baseline.',
      defaultLocale,
      locales,
      missing: currentMissing,
    }, null, 2)}\n`
  )
  console.log(`Updated i18n baseline: ${baselinePath}`)
  process.exit(0)
}

const baseline = fs.existsSync(baselinePath)
  ? readJson(baselinePath).missing ?? {}
  : {}

let hasRegression = false

for (const locale of locales) {
  const baselineMissing = new Set(baseline[locale] ?? [])
  const missing = currentMissing[locale] ?? []
  const newMissing = missing.filter((key) => !baselineMissing.has(key))
  const fixedMissing = [...baselineMissing].filter((key) => !missing.includes(key))

  console.log(`${locale}: ${missing.length} missing keys (${newMissing.length} new, ${fixedMissing.length} fixed since baseline)`)

  if (newMissing.length > 0) {
    hasRegression = true
    for (const key of newMissing.slice(0, 25)) {
      console.log(`  new missing: ${key}`)
    }
    if (newMissing.length > 25) {
      console.log(`  ...and ${newMissing.length - 25} more`)
    }
  }
}

if (hasRegression) {
  console.error('i18n audit failed: update locale files or intentionally refresh scripts/baselines/i18n-missing.json.')
  process.exit(1)
}

console.log('i18n audit passed: no missing-key regressions beyond baseline.')
