#!/usr/bin/env tsx
/**
 * Merges partial namespace message files into the main locale JSON files.
 *
 * Partial files live in messages/partials/{namespace}.{locale}.json
 * Main files are messages/{locale}.json
 *
 * Run: npx tsx scripts/merge-messages.ts
 */

import fs from 'fs'
import path from 'path'

const MESSAGES_DIR = path.join(process.cwd(), 'messages')
const PARTIALS_DIR = path.join(MESSAGES_DIR, 'partials')
const LOCALES = ['de', 'fr', 'en', 'it', 'es', 'ja', 'ko']

function deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
  const result = { ...target }
  for (const key in source) {
    const sv = source[key]
    const tv = result[key]
    if (sv && typeof sv === 'object' && !Array.isArray(sv) &&
        tv && typeof tv === 'object' && !Array.isArray(tv)) {
      result[key] = deepMerge(tv as Record<string, unknown>, sv as Record<string, unknown>)
    } else if (sv !== undefined) {
      result[key] = sv
    }
  }
  return result
}

function loadJson(filePath: string): Record<string, unknown> {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  } catch {
    return {}
  }
}

function main() {
  if (!fs.existsSync(PARTIALS_DIR)) {
    console.log('No partials directory found. Nothing to merge.')
    return
  }

  const partialFiles = fs.readdirSync(PARTIALS_DIR).filter(f => f.endsWith('.json'))

  if (partialFiles.length === 0) {
    console.log('No partial files found. Nothing to merge.')
    return
  }

  console.log(`Found ${partialFiles.length} partial files to merge.\n`)

  for (const locale of LOCALES) {
    const mainPath = path.join(MESSAGES_DIR, `${locale}.json`)
    let main = loadJson(mainPath)

    const localePartials = partialFiles.filter(f => f.endsWith(`.${locale}.json`))

    if (localePartials.length === 0) {
      console.log(`  [${locale}] No partials — skipping`)
      continue
    }

    for (const partialFile of localePartials.sort()) {
      const partialPath = path.join(PARTIALS_DIR, partialFile)
      const partial = loadJson(partialPath)
      const namespace = partialFile.replace(`.${locale}.json`, '')
      main = deepMerge(main, partial)
      console.log(`  [${locale}] Merged: ${partialFile} → namespace "${namespace}"`)
    }

    fs.writeFileSync(mainPath, JSON.stringify(main, null, 2) + '\n', 'utf-8')
    console.log(`  [${locale}] ✓ Written to messages/${locale}.json\n`)
  }

  console.log('Merge complete.')
}

main()
