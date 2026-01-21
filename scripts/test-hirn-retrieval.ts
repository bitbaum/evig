#!/usr/bin/env npx tsx
/**
 * Test script for HIRN retrieval
 */
import * as path from 'path'
import * as fs from 'fs'

// Load environment variables from .env.local BEFORE any other imports
const envPath = path.join(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8')
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=')
      const value = valueParts.join('=')
      if (key && value !== undefined) {
        // Always overwrite to ensure our env vars take precedence
        process.env[key] = value
      }
    }
  }
}

// Now import the retrieval module (after env vars are set)
async function test() {
  // Dynamic import to ensure env vars are loaded first
  const { searchSimilar } = await import('../src/lib/hirn/retrieval')

  const query = process.argv[2] || 'Wie funktioniert die Authentifizierung?'

  console.log(`Testing retrieval: "${query}"`)
  console.log('---')

  const results = await searchSimilar(query, {
    topK: 5,
    minSimilarity: 0.3,
  })

  console.log(`Found ${results.length} results:\n`)

  for (const r of results) {
    console.log(`[${(r.similarity * 100).toFixed(1)}%] ${r.document.title || r.document.sourcePath}`)
    console.log(`  ${r.content.slice(0, 200).replace(/\n/g, ' ')}...\n`)
  }
}

test().catch(console.error).finally(() => process.exit(0))
