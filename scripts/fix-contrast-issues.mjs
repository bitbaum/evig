#!/usr/bin/env node

/**
 * Contrast Fix Utility
 * 
 * Identifies and suggests fixes for contrast issues
 * 
 * Created: 2025-12-17
 */

import { readFileSync, writeFileSync } from 'fs'
import { glob } from 'glob'

// Patterns that indicate contrast issues
const problematicPatterns = [
  // White text on white background
  /text-white[^"]*bg-white|bg-white[^"]*text-white/,
  // Dark text on dark background  
  /text-gray-900[^"]*bg-gray-900|bg-gray-900[^"]*text-gray-900/,
  // Very light text on light background
  /text-gray-100[^"]*bg-gray-50|bg-gray-50[^"]*text-gray-100/,
  /text-gray-200[^"]*bg-white|bg-white[^"]*text-gray-200/,
]

async function findContrastIssues() {
  const files = await glob('src/**/*.{tsx,ts}', { ignore: ['**/node_modules/**', '**/.next/**'] })
  
  const issues = []
  
  for (const file of files) {
    try {
      const content = readFileSync(file, 'utf-8')
      const lines = content.split('\n')
      
      lines.forEach((line, index) => {
        problematicPatterns.forEach(pattern => {
          if (pattern.test(line)) {
            issues.push({
              file,
              line: index + 1,
              content: line.trim(),
              pattern: pattern.toString()
            })
          }
        })
      })
    } catch (error) {
      console.error(`Error reading ${file}:`, error.message)
    }
  }
  
  return issues
}

async function main() {
  console.log('🔍 Scanning for contrast issues...\n')
  const issues = await findContrastIssues()
  
  if (issues.length === 0) {
    console.log('✅ No obvious contrast issues found!')
    return
  }
  
  console.log(`Found ${issues.length} potential contrast issues:\n`)
  
  // Group by file
  const byFile = {}
  issues.forEach(issue => {
    if (!byFile[issue.file]) {
      byFile[issue.file] = []
    }
    byFile[issue.file].push(issue)
  })
  
  // Print summary
  Object.entries(byFile).forEach(([file, fileIssues]) => {
    console.log(`📄 ${file} (${fileIssues.length} issues)`)
    fileIssues.slice(0, 3).forEach(issue => {
      console.log(`   Line ${issue.line}: ${issue.content.substring(0, 80)}...`)
    })
    if (fileIssues.length > 3) {
      console.log(`   ... and ${fileIssues.length - 3} more`)
    }
    console.log()
  })
  
  console.log(`\n💡 Tip: Use design system utilities (getTextColor, getBackgroundColor) for proper contrast`)
}

main().catch(console.error)



