#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const repoRoot = process.cwd()
const sourceRoots = ['src/app', 'src/components', 'src/features', 'src/lib', 'src/config']
const sourceExtensions = new Set(['.ts', '.tsx', '.css'])
const runtimeDdlPattern = /\b(CREATE|ALTER|DROP)\s+(TABLE|INDEX|VIEW|TRIGGER|FUNCTION)\b/i
const hardcodedContentPattern = /hardcoded-content/i
const rawColorPattern = /(?<!&)#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/g

const rawColorAllowed = [
  'src/config/ui-colors.ts',
  'src/app/api/payments/payrexx-mock-redirect/route.ts',
  'src/app/global-error.tsx',
  'src/app/globals.css',
  'src/components/about/AsSeenInLogos.tsx',
  'src/components/blog/ShareButtons.tsx',
  'src/lib/email/templates/',
  'src/lib/invoices/pdf-template.ts',
  'src/features/floating-ui/styles/',
]

function walk(dir) {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.next') return []
      return walk(fullPath)
    }
    return sourceExtensions.has(path.extname(entry.name)) ? [fullPath] : []
  })
}

function rel(filePath) {
  return path.relative(repoRoot, filePath)
}

const files = sourceRoots.flatMap((root) => walk(path.join(repoRoot, root)))
const failures = []
const warnings = []

for (const file of files) {
  const relative = rel(file)
  const text = fs.readFileSync(file, 'utf8')

  if (relative.startsWith('src/app/api/') && runtimeDdlPattern.test(text)) {
    failures.push(`${relative}: runtime DDL belongs in Drizzle schema/migrations, not API routes.`)
  }

  if (hardcodedContentPattern.test(relative) || hardcodedContentPattern.test(text)) {
    failures.push(`${relative}: remove hardcoded-content naming; content modules must not advertise hardcoding.`)
  }

  if (
    !relative.includes('/__tests__/') &&
    !rawColorAllowed.some((allowed) => relative.startsWith(allowed)) &&
    rawColorPattern.test(text)
  ) {
    warnings.push(`${relative}: raw color literal found; move it to the design token/color config layer.`)
  }
}

if (warnings.length > 0) {
  console.log(`SSOT audit warnings: ${warnings.length}`)
  for (const warning of warnings.slice(0, 50)) {
    console.log(`  ${warning}`)
  }
  if (warnings.length > 50) {
    console.log(`  ...and ${warnings.length - 50} more warnings`)
  }
}

if (failures.length > 0) {
  console.error(`SSOT audit failed: ${failures.length} blocking issue(s)`)
  for (const failure of failures) {
    console.error(`  ${failure}`)
  }
  process.exit(1)
}

console.log('SSOT audit passed: no blocking runtime DDL or hardcoded-content violations.')
