/**
 * Hirn Document Chunking
 *
 * Smart chunking strategies that preserve semantic meaning:
 * - Code: Extracts complete functions, classes, interfaces
 * - Markdown: Respects document structure and headers
 * - Text: Splits at natural boundaries with overlap
 *
 * Key improvements:
 * - Keeps complete code units together (no split functions)
 * - Preserves JSDoc/comments with their code
 * - Creates file summaries for high-level context
 * - Maintains import context
 */

export interface ChunkOptions {
  maxChunkSize?: number      // Maximum characters per chunk
  chunkOverlap?: number      // Overlap between chunks
  separators?: string[]      // Preferred split points (in order of preference)
  includeFileSummary?: boolean // Create a summary chunk for the file
}

export interface Chunk {
  content: string
  index: number
  metadata?: Record<string, unknown>
}

const DEFAULT_OPTIONS: Required<ChunkOptions> = {
  maxChunkSize: 1500,        // Increased for better context
  chunkOverlap: 100,         // Reduced - we preserve complete units
  separators: [
    '\n## ',      // Markdown h2
    '\n### ',     // Markdown h3
    '\n#### ',    // Markdown h4
    '\n\n',       // Paragraph
    '\n',         // Line break
    '. ',         // Sentence
    ', ',         // Clause
    ' ',          // Word
  ],
  includeFileSummary: true,
}

/**
 * Split text into chunks with semantic awareness
 */
export function chunkText(text: string, options: ChunkOptions = {}): Chunk[] {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const chunks: Chunk[] = []
  let remaining = text.trim()
  let index = 0

  while (remaining.length > 0) {
    if (remaining.length <= opts.maxChunkSize) {
      chunks.push({ content: remaining.trim(), index })
      break
    }

    // Find the best split point
    let splitPoint = opts.maxChunkSize
    let foundSeparator = false

    // Try each separator in order of preference
    for (const separator of opts.separators) {
      const searchEnd = Math.min(opts.maxChunkSize, remaining.length)
      const lastIndex = remaining.lastIndexOf(separator, searchEnd)

      if (lastIndex > opts.maxChunkSize * 0.3) {
        splitPoint = lastIndex + separator.length
        foundSeparator = true
        break
      }
    }

    // If no good separator found, just split at maxChunkSize
    if (!foundSeparator) {
      splitPoint = opts.maxChunkSize
    }

    const chunk = remaining.slice(0, splitPoint).trim()
    if (chunk.length > 0) {
      chunks.push({ content: chunk, index })
      index++
    }

    // Apply overlap
    const overlapStart = Math.max(0, splitPoint - opts.chunkOverlap)
    remaining = remaining.slice(overlapStart).trim()
  }

  return chunks
}

/**
 * Chunk a markdown document with header awareness
 * Preserves document structure and creates hierarchical chunks
 */
export function chunkMarkdown(content: string, options: ChunkOptions = {}): Chunk[] {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const chunks: Chunk[] = []
  let index = 0

  // Extract document title and create summary if enabled
  const titleMatch = content.match(/^#\s+(.+?)(?:\n|$)/m)
  const title = titleMatch ? titleMatch[1] : null

  if (opts.includeFileSummary && title) {
    // Create a summary chunk with title and first paragraph
    const summaryEnd = content.indexOf('\n## ')
    const summaryContent = summaryEnd > 0
      ? content.slice(0, summaryEnd).trim()
      : content.slice(0, 500).trim()

    if (summaryContent.length > 50) {
      chunks.push({
        content: summaryContent,
        index,
        metadata: { type: 'summary', title },
      })
      index++
    }
  }

  // Split by headers
  const sections = content.split(/(?=^#{1,4}\s)/m)

  for (const section of sections) {
    if (!section.trim()) continue

    // Extract header if present
    const headerMatch = section.match(/^(#{1,4})\s+(.+?)(?:\n|$)/)
    const headerLevel = headerMatch ? headerMatch[1].length : 0
    const headerText = headerMatch ? headerMatch[2].trim() : ''
    const header = headerMatch ? headerMatch[0].trim() : ''
    const body = headerMatch ? section.slice(headerMatch[0].length) : section

    // If section fits in one chunk, keep it together
    if (section.length <= opts.maxChunkSize) {
      chunks.push({
        content: section.trim(),
        index,
        metadata: {
          header: headerText,
          headerLevel,
          type: 'section',
        },
      })
      index++
      continue
    }

    // Otherwise, chunk the body and prepend header to each
    const bodyChunks = chunkText(body, { ...opts, includeFileSummary: false })
    for (const bodyChunk of bodyChunks) {
      const chunkContent = header
        ? `${header}\n\n${bodyChunk.content}`
        : bodyChunk.content

      chunks.push({
        content: chunkContent.trim(),
        index,
        metadata: {
          header: headerText,
          headerLevel,
          type: 'section-part',
        },
      })
      index++
    }
  }

  return chunks
}

/**
 * Extract code units (functions, classes, interfaces) from TypeScript/JavaScript
 * Returns complete, self-contained code blocks
 */
interface CodeUnit {
  type: 'import' | 'export' | 'function' | 'class' | 'interface' | 'type' | 'const' | 'other'
  name: string
  content: string
  docComment?: string
  startLine: number
  endLine: number
}

function extractTypeScriptUnits(content: string): CodeUnit[] {
  const units: CodeUnit[] = []
  const lines = content.split('\n')

  // First pass: collect imports as a group
  const importLines: string[] = []
  let importEndLine = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.match(/^import\s/) || (importLines.length > 0 && line.match(/^\s*[{}]|^\s*\w+,?\s*$/))) {
      importLines.push(line)
      importEndLine = i
    } else if (importLines.length > 0 && !line.trim()) {
      // Allow blank lines between imports
      if (lines[i + 1]?.match(/^import\s/)) {
        importLines.push(line)
        continue
      }
      break
    } else if (importLines.length > 0) {
      break
    }
  }

  if (importLines.length > 0) {
    units.push({
      type: 'import',
      name: 'imports',
      content: importLines.join('\n'),
      startLine: 0,
      endLine: importEndLine,
    })
  }

  // Second pass: extract code units using brace matching
  let i = importEndLine + 1
  let currentDocComment = ''

  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()

    // Collect JSDoc comments
    if (trimmed.startsWith('/**')) {
      const docStart = i
      while (i < lines.length && !lines[i].includes('*/')) {
        i++
      }
      currentDocComment = lines.slice(docStart, i + 1).join('\n')
      i++
      continue
    }

    // Skip single-line comments
    if (trimmed.startsWith('//')) {
      currentDocComment = trimmed
      i++
      continue
    }

    // Match function/class/interface/type declarations
    const patterns: Array<{ regex: RegExp; type: CodeUnit['type'] }> = [
      { regex: /^export\s+(?:async\s+)?function\s+(\w+)/, type: 'function' },
      { regex: /^export\s+default\s+(?:async\s+)?function\s*(\w*)/, type: 'function' },
      { regex: /^(?:async\s+)?function\s+(\w+)/, type: 'function' },
      { regex: /^export\s+class\s+(\w+)/, type: 'class' },
      { regex: /^class\s+(\w+)/, type: 'class' },
      { regex: /^export\s+interface\s+(\w+)/, type: 'interface' },
      { regex: /^interface\s+(\w+)/, type: 'interface' },
      { regex: /^export\s+type\s+(\w+)/, type: 'type' },
      { regex: /^type\s+(\w+)/, type: 'type' },
      { regex: /^export\s+const\s+(\w+)/, type: 'const' },
      { regex: /^const\s+(\w+)/, type: 'const' },
    ]

    let matched = false
    for (const { regex, type } of patterns) {
      const match = trimmed.match(regex)
      if (match) {
        const name = match[1] || 'anonymous'
        const startLine = i

        // Find the end of this unit using brace matching
        let braceCount = 0
        let foundStart = false
        let endLine = i

        for (let j = i; j < lines.length; j++) {
          const checkLine = lines[j]

          // Count braces
          for (const char of checkLine) {
            if (char === '{' || char === '(') {
              braceCount++
              foundStart = true
            } else if (char === '}' || char === ')') {
              braceCount--
            }
          }

          endLine = j

          // End conditions
          if (foundStart && braceCount === 0) {
            break
          }

          // Type aliases end with semicolon or newline
          if (type === 'type' && checkLine.includes('=') && (checkLine.endsWith(';') || !checkLine.includes('{'))) {
            break
          }
        }

        const unitContent = lines.slice(startLine, endLine + 1).join('\n')

        units.push({
          type,
          name,
          content: currentDocComment ? `${currentDocComment}\n${unitContent}` : unitContent,
          docComment: currentDocComment || undefined,
          startLine,
          endLine,
        })

        currentDocComment = ''
        i = endLine + 1
        matched = true
        break
      }
    }

    if (!matched) {
      currentDocComment = ''
      i++
    }
  }

  return units
}

/**
 * Create a file summary for code files
 */
function createCodeSummary(filePath: string, units: CodeUnit[]): string {
  const exports = units.filter(u => u.content.includes('export'))
  const functions = units.filter(u => u.type === 'function')
  const classes = units.filter(u => u.type === 'class')
  const interfaces = units.filter(u => u.type === 'interface')
  const types = units.filter(u => u.type === 'type')

  const parts: string[] = [
    `File: ${filePath}`,
    '',
  ]

  if (exports.length > 0) {
    parts.push(`Exports: ${exports.map(e => e.name).join(', ')}`)
  }
  if (functions.length > 0) {
    parts.push(`Functions: ${functions.map(f => f.name).join(', ')}`)
  }
  if (classes.length > 0) {
    parts.push(`Classes: ${classes.map(c => c.name).join(', ')}`)
  }
  if (interfaces.length > 0) {
    parts.push(`Interfaces: ${interfaces.map(i => i.name).join(', ')}`)
  }
  if (types.length > 0) {
    parts.push(`Types: ${types.map(t => t.name).join(', ')}`)
  }

  return parts.join('\n')
}

/**
 * Chunk TypeScript/JavaScript code preserving complete units
 */
export function chunkTypeScript(
  content: string,
  filePath: string,
  options: ChunkOptions = {}
): Chunk[] {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const chunks: Chunk[] = []
  let index = 0

  const units = extractTypeScriptUnits(content)

  // Create file summary as first chunk
  if (opts.includeFileSummary && units.length > 0) {
    const summary = createCodeSummary(filePath, units)
    chunks.push({
      content: summary,
      index,
      metadata: { type: 'file-summary', filePath },
    })
    index++
  }

  // Group imports into one chunk
  const imports = units.filter(u => u.type === 'import')
  if (imports.length > 0) {
    const importContent = imports.map(u => u.content).join('\n')
    if (importContent.length <= opts.maxChunkSize) {
      chunks.push({
        content: `// File: ${filePath}\n// Imports\n\n${importContent}`,
        index,
        metadata: { type: 'imports', filePath },
      })
      index++
    }
  }

  // Process other units
  const codeUnits = units.filter(u => u.type !== 'import')
  let currentChunk = ''
  let currentUnits: string[] = []

  for (const unit of codeUnits) {
    const unitWithContext = `// ${unit.type}: ${unit.name}\n${unit.content}`

    // If single unit exceeds max size, chunk it (shouldn't happen often)
    if (unitWithContext.length > opts.maxChunkSize) {
      // Save current accumulated chunk first
      if (currentChunk) {
        chunks.push({
          content: `// File: ${filePath}\n\n${currentChunk}`,
          index,
          metadata: { type: 'code', units: currentUnits, filePath },
        })
        index++
        currentChunk = ''
        currentUnits = []
      }

      // Split large unit (rare case)
      const subChunks = chunkText(unitWithContext, { ...opts, includeFileSummary: false })
      for (const sub of subChunks) {
        chunks.push({
          content: `// File: ${filePath}\n// ${unit.type}: ${unit.name} (part ${sub.index + 1})\n\n${sub.content}`,
          index,
          metadata: { type: unit.type, name: unit.name, part: sub.index + 1, filePath },
        })
        index++
      }
      continue
    }

    // Check if adding this unit would exceed max size
    if (currentChunk.length + unitWithContext.length + 2 > opts.maxChunkSize) {
      // Save current chunk and start new one
      if (currentChunk) {
        chunks.push({
          content: `// File: ${filePath}\n\n${currentChunk}`,
          index,
          metadata: { type: 'code', units: currentUnits, filePath },
        })
        index++
      }
      currentChunk = unitWithContext
      currentUnits = [unit.name]
    } else {
      // Add to current chunk
      currentChunk = currentChunk ? `${currentChunk}\n\n${unitWithContext}` : unitWithContext
      currentUnits.push(unit.name)
    }
  }

  // Don't forget the last chunk
  if (currentChunk) {
    chunks.push({
      content: `// File: ${filePath}\n\n${currentChunk}`,
      index,
      metadata: { type: 'code', units: currentUnits, filePath },
    })
  }

  return chunks
}

/**
 * Chunk code with function/class awareness
 * Delegates to language-specific chunkers
 */
export function chunkCode(
  content: string,
  language: string,
  options: ChunkOptions & { filePath?: string } = {}
): Chunk[] {
  const { filePath = 'unknown', ...opts } = options

  // Use smart chunking for TypeScript/JavaScript
  if (['typescript', 'javascript'].includes(language)) {
    return chunkTypeScript(content, filePath, opts)
  }

  // For other languages, use separator-based chunking
  const codeSeparators: Record<string, string[]> = {
    python: [
      '\ndef ',
      '\nclass ',
      '\nasync def ',
      '\n\n',
      '\n',
    ],
    sql: [
      ';\n\nCREATE',
      ';\n\nALTER',
      ';\n\nINSERT',
      ';\n\n--',
      ';\n\n',
      ';\n',
      '\n\n',
      '\n',
    ],
  }

  const separators = codeSeparators[language] || DEFAULT_OPTIONS.separators

  return chunkText(content, { ...opts, separators })
}

/**
 * Chunk SQL with statement awareness
 */
export function chunkSQL(content: string, filePath: string, options: ChunkOptions = {}): Chunk[] {
  const opts = { ...DEFAULT_OPTIONS, ...options, maxChunkSize: 2000 }
  const chunks: Chunk[] = []
  let index = 0

  // Split by major SQL statements
  const statements = content.split(/(?=(?:^|\n)(?:CREATE|ALTER|DROP|INSERT|UPDATE|DELETE|SELECT|--\s*={3,}|--\s*\d+\.))/gm)

  let currentChunk = ''

  for (const statement of statements) {
    if (!statement.trim()) continue

    // Extract statement type from first line
    const typeMatch = statement.match(/^\s*(CREATE|ALTER|DROP|INSERT|UPDATE|DELETE|SELECT|--)/i)
    const stmtType = typeMatch ? typeMatch[1].toUpperCase() : 'OTHER'

    if (currentChunk.length + statement.length > opts.maxChunkSize) {
      if (currentChunk) {
        chunks.push({
          content: `-- File: ${filePath}\n\n${currentChunk.trim()}`,
          index,
          metadata: { type: 'sql', filePath },
        })
        index++
      }
      currentChunk = statement
    } else {
      currentChunk = currentChunk ? `${currentChunk}\n${statement}` : statement
    }
  }

  if (currentChunk.trim()) {
    chunks.push({
      content: `-- File: ${filePath}\n\n${currentChunk.trim()}`,
      index,
      metadata: { type: 'sql', filePath },
    })
  }

  return chunks
}

/**
 * Estimate token count (rough approximation)
 * Average: ~4 characters per token for English text
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}
