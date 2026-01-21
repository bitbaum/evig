#!/usr/bin/env npx tsx
/**
 * Hirn Document Ingestion CLI
 *
 * Usage:
 *   npx tsx scripts/hirn-ingest.ts [options]
 *
 * Options:
 *   --dir <path>     Directory to ingest (default: ./docs)
 *   --file <path>    Single file to ingest
 *   --extensions     File extensions to include (default: .md,.mdx,.ts,.tsx,.js,.jsx,.py,.sql,.txt)
 *   --exclude        Directories to exclude (default: node_modules,.git,dist,build,.next)
 *   --stats          Show current ingestion stats
 *   --help           Show this help message
 *
 * Examples:
 *   npx tsx scripts/hirn-ingest.ts --dir ./docs
 *   npx tsx scripts/hirn-ingest.ts --file ./README.md
 *   npx tsx scripts/hirn-ingest.ts --stats
 */

import * as path from 'path'
import * as fs from 'fs'

// Load environment variables from .env.local
const envPath = path.join(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8')
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=')
      if (key && valueParts.length > 0) {
        process.env[key] = valueParts.join('=')
      }
    }
  }
}

async function main() {
  const args = process.argv.slice(2)

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Hirn Document Ingestion CLI

Usage:
  npx tsx scripts/hirn-ingest.ts [options]

Options:
  --dir <path>       Directory to ingest (default: ./docs)
  --file <path>      Single file to ingest
  --extensions <ext> File extensions (comma-separated, default: .md,.mdx,.ts,.tsx)
  --exclude <dirs>   Directories to exclude (comma-separated)
  --stats            Show current ingestion stats
  --help             Show this help message

Examples:
  npx tsx scripts/hirn-ingest.ts --dir ./docs
  npx tsx scripts/hirn-ingest.ts --file ./README.md
  npx tsx scripts/hirn-ingest.ts --dir ./src/lib --extensions .ts,.tsx
  npx tsx scripts/hirn-ingest.ts --stats
`)
    process.exit(0)
  }

  // Dynamic import to avoid loading modules before env is set
  const { ingestFile, ingestDirectory, getIngestionStats } = await import('../src/lib/hirn/ingestion')

  // Show stats
  if (args.includes('--stats')) {
    console.log('Fetching ingestion stats...\n')
    const stats = await getIngestionStats()
    console.log('=== Hirn Ingestion Stats ===')
    console.log(`Total Documents: ${stats.totalDocuments}`)
    console.log(`Total Chunks: ${stats.totalChunks}`)
    console.log(`Last Indexed: ${stats.lastIndexed ? stats.lastIndexed.toISOString() : 'Never'}`)
    console.log('\nBy Type:')
    Object.entries(stats.byType).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`)
    })
    process.exit(0)
  }

  // Parse options
  const dirIndex = args.indexOf('--dir')
  const fileIndex = args.indexOf('--file')
  const extensionsIndex = args.indexOf('--extensions')
  const excludeIndex = args.indexOf('--exclude')

  const dir = dirIndex !== -1 ? args[dirIndex + 1] : null
  const file = fileIndex !== -1 ? args[fileIndex + 1] : null
  const extensions = extensionsIndex !== -1
    ? args[extensionsIndex + 1].split(',')
    : ['.md', '.mdx', '.ts', '.tsx', '.js', '.jsx', '.py', '.sql', '.txt']
  const exclude = excludeIndex !== -1
    ? args[excludeIndex + 1].split(',')
    : ['node_modules', '.git', 'dist', 'build', '.next', '__pycache__', '.cache']

  // Ingest single file
  if (file) {
    const filePath = path.resolve(process.cwd(), file)
    console.log(`Ingesting file: ${filePath}`)
    try {
      const result = await ingestFile(filePath)
      console.log(`\n✓ Document ID: ${result.documentId}`)
      console.log(`  Chunks created: ${result.chunksCreated}`)
      console.log(`  Updated: ${result.wasUpdated}`)
    } catch (error) {
      console.error(`\n✗ Error: ${error instanceof Error ? error.message : String(error)}`)
      process.exit(1)
    }
    process.exit(0)
  }

  // Ingest directory
  const targetDir = dir ? path.resolve(process.cwd(), dir) : path.join(process.cwd(), 'docs')
  console.log(`Ingesting directory: ${targetDir}`)
  console.log(`Extensions: ${extensions.join(', ')}`)
  console.log(`Excluding: ${exclude.join(', ')}`)
  console.log('')

  try {
    const result = await ingestDirectory(targetDir, {
      extensions,
      exclude,
      recursive: true,
    })

    console.log('\n=== Ingestion Complete ===')
    console.log(`Total files found: ${result.total}`)
    console.log(`Ingested/Updated: ${result.ingested}`)
    console.log(`Skipped (unchanged): ${result.skipped}`)

    if (result.errors.length > 0) {
      console.log(`\nErrors (${result.errors.length}):`)
      result.errors.forEach(err => console.log(`  - ${err}`))
    }
  } catch (error) {
    console.error(`\n✗ Error: ${error instanceof Error ? error.message : String(error)}`)
    process.exit(1)
  }
}

main().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
