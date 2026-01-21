#!/usr/bin/env npx tsx
/**
 * Auto-document and ingest API routes into HIRN
 * Scans Next.js app/api directory and extracts route information
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
        process.env[key] = value
      }
    }
  }
}

interface RouteInfo {
  path: string
  methods: string[]
  filePath: string
  description: string
  parameters: string[]
  authentication: string
  codeSnippet: string
}

function extractRouteInfo(filePath: string, content: string): RouteInfo {
  const relativePath = path.relative(process.cwd(), filePath)

  // Extract API path from file path
  // src/app/api/shop/inventory/route.ts -> /api/shop/inventory
  // src/app/api/shop/inventory/[id]/route.ts -> /api/shop/inventory/[id]
  const apiMatch = relativePath.match(/src\/app(\/api\/.*)\/route\.ts/)
  const apiPath = apiMatch ? apiMatch[1] : relativePath

  // Extract HTTP methods
  const methods: string[] = []
  if (content.includes('export async function GET') || content.includes('export function GET')) {
    methods.push('GET')
  }
  if (content.includes('export async function POST') || content.includes('export function POST')) {
    methods.push('POST')
  }
  if (content.includes('export async function PUT') || content.includes('export function PUT')) {
    methods.push('PUT')
  }
  if (content.includes('export async function PATCH') || content.includes('export function PATCH')) {
    methods.push('PATCH')
  }
  if (content.includes('export async function DELETE') || content.includes('export function DELETE')) {
    methods.push('DELETE')
  }

  // Extract JSDoc comment at the top
  const docMatch = content.match(/\/\*\*\s*\n([\s\S]*?)\*\//)
  let description = ''
  if (docMatch) {
    description = docMatch[1]
      .split('\n')
      .map(line => line.replace(/^\s*\*\s?/, '').trim())
      .filter(line => line && !line.startsWith('@'))
      .join(' ')
  }

  // Extract dynamic parameters from path
  const paramMatches = apiPath.match(/\[([^\]]+)\]/g)
  const parameters = paramMatches ? paramMatches.map(p => p.slice(1, -1)) : []

  // Detect authentication
  let authentication = 'None'
  if (content.includes('auth()') || content.includes('getServerSession')) {
    authentication = 'Session required'
  }
  if (content.includes('session?.user') || content.includes('!session?.user')) {
    authentication = 'Authenticated users'
  }
  if (content.includes('isStaff') || content.includes('staffPermissions')) {
    authentication = 'Staff only'
  }
  if (content.includes('isSuperAdmin')) {
    authentication = 'Super admin only'
  }

  // Extract a simplified code snippet (first function signature + 10 lines)
  let codeSnippet = ''
  for (const method of methods) {
    const funcMatch = content.match(new RegExp(`export (?:async )?function ${method}[\\s\\S]*?\\{([\\s\\S]*?)(?=export|$)`, 'm'))
    if (funcMatch) {
      const funcBody = funcMatch[0]
      const lines = funcBody.split('\n').slice(0, 15)
      codeSnippet += `\n${lines.join('\n')}...\n`
    }
  }

  return {
    path: apiPath,
    methods,
    filePath: relativePath,
    description: description || `API endpoint at ${apiPath}`,
    parameters,
    authentication,
    codeSnippet: codeSnippet.trim(),
  }
}

function findApiRoutes(dir: string): string[] {
  const routes: string[] = []

  function scan(currentDir: string) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name)

      if (entry.isDirectory()) {
        scan(fullPath)
      } else if (entry.name === 'route.ts' || entry.name === 'route.tsx') {
        routes.push(fullPath)
      }
    }
  }

  scan(dir)
  return routes
}

function generateApiDocumentation(routes: RouteInfo[]): string {
  // Group routes by category
  const categories = new Map<string, RouteInfo[]>()

  for (const route of routes) {
    // Extract category from path (e.g., /api/shop/... -> shop)
    const categoryMatch = route.path.match(/^\/api\/([^/]+)/)
    const category = categoryMatch ? categoryMatch[1] : 'other'

    const existing = categories.get(category) || []
    existing.push(route)
    categories.set(category, existing)
  }

  let markdown = `# RevampIT API Documentation

This document describes all API endpoints available in the RevampIT platform.
Auto-generated from source code analysis.

## Overview

Total endpoints: ${routes.length}
Categories: ${Array.from(categories.keys()).join(', ')}

## Authentication

Most API endpoints use session-based authentication via Auth.js:
- \`auth()\` - Get current session
- Returns 401 if authentication required but not provided
- Staff endpoints require \`@revamp-it.ch\` email

## Endpoints by Category

`

  // Sort categories
  const sortedCategories = Array.from(categories.keys()).sort()

  for (const category of sortedCategories) {
    const categoryRoutes = categories.get(category) || []

    markdown += `### ${category.charAt(0).toUpperCase() + category.slice(1)}\n\n`

    // Sort routes by path
    categoryRoutes.sort((a, b) => a.path.localeCompare(b.path))

    for (const route of categoryRoutes) {
      markdown += `#### \`${route.methods.join(', ')} ${route.path}\`\n\n`
      markdown += `${route.description}\n\n`

      markdown += `| Property | Value |\n`
      markdown += `|----------|-------|\n`
      markdown += `| File | \`${route.filePath}\` |\n`
      markdown += `| Auth | ${route.authentication} |\n`

      if (route.parameters.length > 0) {
        markdown += `| Params | ${route.parameters.map(p => `\`${p}\``).join(', ')} |\n`
      }

      markdown += `\n`

      if (route.codeSnippet) {
        markdown += `<details>\n<summary>Code Preview</summary>\n\n`
        markdown += `\`\`\`typescript\n${route.codeSnippet}\n\`\`\`\n\n`
        markdown += `</details>\n\n`
      }
    }
  }

  // Add quick reference table
  markdown += `## Quick Reference\n\n`
  markdown += `| Method | Path | Auth | Description |\n`
  markdown += `|--------|------|------|-------------|\n`

  for (const route of routes.sort((a, b) => a.path.localeCompare(b.path))) {
    const desc = route.description.slice(0, 50) + (route.description.length > 50 ? '...' : '')
    markdown += `| ${route.methods.join('/')} | \`${route.path}\` | ${route.authentication} | ${desc} |\n`
  }

  return markdown
}

async function main() {
  const apiDir = path.join(process.cwd(), 'src', 'app', 'api')

  console.log('Scanning API routes...')
  const routeFiles = findApiRoutes(apiDir)
  console.log(`Found ${routeFiles.length} route files`)

  const routes: RouteInfo[] = []

  for (const filePath of routeFiles) {
    const content = fs.readFileSync(filePath, 'utf-8')
    const routeInfo = extractRouteInfo(filePath, content)

    if (routeInfo.methods.length > 0) {
      routes.push(routeInfo)
    }
  }

  console.log(`Extracted ${routes.length} API endpoints`)

  // Generate documentation
  const documentation = generateApiDocumentation(routes)

  // Save to docs folder
  const outputPath = path.join(process.cwd(), 'docs', 'API_DOCUMENTATION.md')
  fs.writeFileSync(outputPath, documentation)
  console.log(`Documentation saved to ${outputPath}`)

  // Also save a copy for HIRN ingestion
  const hirnPath = path.join(process.cwd(), 'docs', 'hirn', 'api-documentation.md')
  fs.mkdirSync(path.dirname(hirnPath), { recursive: true })
  fs.writeFileSync(hirnPath, documentation)
  console.log(`Documentation saved to ${hirnPath}`)

  // Now ingest into HIRN
  console.log('\nIngesting API documentation into HIRN...')
  const { ingestDocument } = await import('../src/lib/hirn/ingestion')

  await ingestDocument({
    sourcePath: 'docs://api-documentation',
    sourceType: 'documentation',
    title: 'RevampIT API Documentation',
    content: documentation,
    metadata: {
      type: 'api-docs',
      description: 'Auto-generated API endpoint documentation',
      routeCount: routes.length,
    },
  })

  console.log('API documentation ingested successfully!')
}

main().catch(console.error).finally(() => process.exit(0))
