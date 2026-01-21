#!/usr/bin/env npx tsx
/**
 * Ingest database schema into HIRN for RAG context
 * This helps the AI understand the database structure
 */
import * as path from 'path'
import * as fs from 'fs'
import { Pool } from 'pg'

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
        process.env[key] = value
      }
    }
  }
}

interface TableInfo {
  table_name: string
  table_comment: string | null
}

interface ColumnInfo {
  table_name: string
  column_name: string
  data_type: string
  is_nullable: string
  column_default: string | null
  column_comment: string | null
}

interface IndexInfo {
  table_name: string
  index_name: string
  index_definition: string
}

interface ForeignKeyInfo {
  table_name: string
  constraint_name: string
  column_name: string
  foreign_table: string
  foreign_column: string
}

async function extractSchema(): Promise<string> {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5433', 10),
    database: process.env.DB_NAME || 'revampit_cms',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false },
  })

  try {
    // Get all tables
    const tablesResult = await pool.query<TableInfo>(`
      SELECT
        t.table_name,
        pg_catalog.obj_description(c.oid, 'pg_class') as table_comment
      FROM information_schema.tables t
      LEFT JOIN pg_catalog.pg_class c ON c.relname = t.table_name
      WHERE t.table_schema = 'public'
        AND t.table_type = 'BASE TABLE'
      ORDER BY t.table_name
    `)

    // Get all columns with comments
    const columnsResult = await pool.query<ColumnInfo>(`
      SELECT
        c.table_name,
        c.column_name,
        c.data_type,
        c.is_nullable,
        c.column_default,
        pg_catalog.col_description(
          (SELECT oid FROM pg_class WHERE relname = c.table_name),
          c.ordinal_position
        ) as column_comment
      FROM information_schema.columns c
      WHERE c.table_schema = 'public'
      ORDER BY c.table_name, c.ordinal_position
    `)

    // Get foreign keys
    const fkResult = await pool.query<ForeignKeyInfo>(`
      SELECT
        tc.table_name,
        tc.constraint_name,
        kcu.column_name,
        ccu.table_name AS foreign_table,
        ccu.column_name AS foreign_column
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
      ORDER BY tc.table_name
    `)

    // Get indexes
    const indexResult = await pool.query<IndexInfo>(`
      SELECT
        tablename as table_name,
        indexname as index_name,
        indexdef as index_definition
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname
    `)

    // Build schema documentation
    const tables = tablesResult.rows
    const columns = columnsResult.rows
    const foreignKeys = fkResult.rows
    const indexes = indexResult.rows

    // Group data by table
    const columnsByTable = new Map<string, ColumnInfo[]>()
    const fksByTable = new Map<string, ForeignKeyInfo[]>()
    const indexesByTable = new Map<string, IndexInfo[]>()

    for (const col of columns) {
      const existing = columnsByTable.get(col.table_name) || []
      existing.push(col)
      columnsByTable.set(col.table_name, existing)
    }

    for (const fk of foreignKeys) {
      const existing = fksByTable.get(fk.table_name) || []
      existing.push(fk)
      fksByTable.set(fk.table_name, existing)
    }

    for (const idx of indexes) {
      const existing = indexesByTable.get(idx.table_name) || []
      existing.push(idx)
      indexesByTable.set(idx.table_name, existing)
    }

    // Generate markdown documentation
    let markdown = `# RevampIT Database Schema

This document describes the PostgreSQL database schema for the RevampIT platform.

## Overview

The database contains ${tables.length} tables across several domains:
- **Authentication**: Users, sessions, accounts
- **Content Management**: Pages, blog posts, translations
- **E-Commerce**: Products, orders, inventory
- **AI/HIRN**: Document embeddings, chat history
- **Team/Staff**: Team members, profiles

## Tables

`

    for (const table of tables) {
      const tableCols = columnsByTable.get(table.table_name) || []
      const tableFks = fksByTable.get(table.table_name) || []
      const tableIndexes = indexesByTable.get(table.table_name) || []

      markdown += `### ${table.table_name}\n\n`

      if (table.table_comment) {
        markdown += `${table.table_comment}\n\n`
      }

      // Columns table
      markdown += `| Column | Type | Nullable | Default | Description |\n`
      markdown += `|--------|------|----------|---------|-------------|\n`

      for (const col of tableCols) {
        const nullable = col.is_nullable === 'YES' ? '✓' : ''
        const defaultVal = col.column_default ? `\`${col.column_default.slice(0, 30)}\`` : ''
        const comment = col.column_comment || ''
        markdown += `| ${col.column_name} | ${col.data_type} | ${nullable} | ${defaultVal} | ${comment} |\n`
      }

      // Foreign keys
      if (tableFks.length > 0) {
        markdown += `\n**Foreign Keys:**\n`
        for (const fk of tableFks) {
          markdown += `- \`${fk.column_name}\` → \`${fk.foreign_table}.${fk.foreign_column}\`\n`
        }
      }

      // Notable indexes (skip primary keys and simple indexes)
      const notableIndexes = tableIndexes.filter(idx =>
        !idx.index_name.endsWith('_pkey') &&
        (idx.index_definition.includes('UNIQUE') ||
         idx.index_definition.includes('gin') ||
         idx.index_definition.includes('gist') ||
         idx.index_definition.includes('vector'))
      )

      if (notableIndexes.length > 0) {
        markdown += `\n**Notable Indexes:**\n`
        for (const idx of notableIndexes) {
          markdown += `- \`${idx.index_name}\`: ${idx.index_definition.includes('UNIQUE') ? 'UNIQUE' : ''} ${idx.index_definition.includes('vector') ? 'VECTOR (HNSW)' : ''}\n`
        }
      }

      markdown += `\n`
    }

    // Add relationship diagram (text-based)
    markdown += `## Key Relationships

\`\`\`
users
  ├── accounts (OAuth providers)
  ├── sessions (active sessions)
  ├── user_content_submissions (content awaiting approval)
  ├── technician_profiles (repair skills)
  └── seller_profiles (seller info)

ai_extracted_products
  ├── product_images
  ├── product_customer_profiles
  └── inventory_items
       └── inventory_reservations

hirn_documents
  └── hirn_chunks (with vector embeddings)

hirn_conversations
  └── hirn_messages
\`\`\`

## Vector Search

The \`hirn_chunks\` table uses pgvector for semantic search:
- Embedding dimension: 768 (nomic-embed-text)
- Index type: HNSW (Hierarchical Navigable Small World)
- Distance metric: Cosine similarity

`

    await pool.end()
    return markdown
  } catch (error) {
    await pool.end()
    throw error
  }
}

async function main() {
  console.log('Extracting database schema...')
  const schema = await extractSchema()

  // Save to docs folder
  const outputPath = path.join(process.cwd(), 'docs', 'DATABASE_SCHEMA.md')
  fs.writeFileSync(outputPath, schema)
  console.log(`Schema saved to ${outputPath}`)

  // Also save a copy for HIRN ingestion
  const hirnPath = path.join(process.cwd(), 'docs', 'hirn', 'database-schema.md')
  fs.mkdirSync(path.dirname(hirnPath), { recursive: true })
  fs.writeFileSync(hirnPath, schema)
  console.log(`Schema saved to ${hirnPath}`)

  // Now ingest into HIRN
  console.log('\nIngesting schema into HIRN...')
  const { ingestDocument } = await import('../src/lib/hirn/ingestion')

  await ingestDocument({
    sourcePath: 'database://schema',
    sourceType: 'database',
    title: 'RevampIT Database Schema',
    content: schema,
    metadata: {
      type: 'database-schema',
      description: 'Complete PostgreSQL database schema documentation',
    },
  })

  console.log('Schema ingested successfully!')
}

main().catch(console.error).finally(() => process.exit(0))
