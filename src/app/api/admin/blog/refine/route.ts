/**
 * API: AI Blog Post Refinement
 *
 * POST /api/admin/blog/refine
 * Refines an existing blog post using AI based on instructions.
 */

import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { canAccessSection } from '@/lib/permissions'
import { logger } from '@/lib/logger'
import { apiSuccess, apiError, apiUnauthorized, apiForbidden, apiBadRequest } from '@/lib/api/helpers'
import { BLOG_PROMPTS, fillPromptTemplate } from '@/lib/ai/config/prompts'

const GROQ_API_KEY = process.env.GROQ_API_KEY || ''
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'llama-3.3-70b-versatile'

interface RefinedBlogPost {
  title: string
  excerpt: string
  content: string
  tags: string[]
  seoTitle: string
  seoDescription: string
}

interface RefineRequest {
  currentContent: {
    title: string
    excerpt: string
    content: string
    tags: string[]
  }
  instruction: string
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return apiUnauthorized()
    }

    // Check blog/content permission
    const user = {
      email: session.user.email,
      is_staff: session.user.isStaff,
      staff_permissions: session.user.staffPermissions,
      is_super_admin: session.user.isSuperAdmin,
    }

    if (!canAccessSection(user, 'dashboard')) {
      return apiForbidden('Keine Berechtigung für Blog-Bearbeitung')
    }

    const body: RefineRequest = await request.json()
    const { currentContent, instruction } = body

    if (!currentContent || !instruction) {
      return apiBadRequest('currentContent und instruction sind erforderlich')
    }

    if (!currentContent.content || !currentContent.title) {
      return apiBadRequest('Titel und Inhalt des aktuellen Artikels sind erforderlich')
    }

    if (!GROQ_API_KEY) {
      return apiError(
        new Error('AI-Service nicht konfiguriert'),
        'KI-Service nicht verfügbar. Bitte GROQ_API_KEY konfigurieren.',
        503
      )
    }

    // Build the refinement prompt
    const userPrompt = fillPromptTemplate(BLOG_PROMPTS.refine, {
      title: currentContent.title,
      excerpt: currentContent.excerpt || '',
      content: currentContent.content,
      tags: (currentContent.tags || []).join(', '),
      instruction: instruction,
    })

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: BLOG_PROMPTS.system },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 4096,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      logger.error('Groq API error', { status: response.status, error: errorText })
      return apiError(
        new Error(`AI API error: ${response.status}`),
        'Fehler bei der KI-Verarbeitung. Bitte versuchen Sie es erneut.'
      )
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      return apiError(
        new Error('Empty AI response'),
        'Keine Antwort vom KI-Service erhalten'
      )
    }

    // Parse the JSON response - LLMs often return malformed JSON with literal newlines
    let refined: RefinedBlogPost

    // Strip markdown code block wrapper if present
    let cleanContent = content
    const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (codeBlockMatch) {
      cleanContent = codeBlockMatch[1].trim()
    }

    // Helper to extract string value between quotes after a key
    const extractField = (text: string, key: string): string => {
      const keyPattern = new RegExp(`"${key}"\\s*:\\s*"`, 'i')
      const keyMatch = text.match(keyPattern)
      if (!keyMatch) return ''

      const startIdx = keyMatch.index! + keyMatch[0].length
      let result = ''
      let escaped = false

      for (let i = startIdx; i < text.length; i++) {
        const char = text[i]

        if (escaped) {
          result += char
          escaped = false
          continue
        }

        if (char === '\\') {
          escaped = true
          result += char
          continue
        }

        if (char === '"') {
          break
        }
        result += char
      }

      return result.replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\t/g, '\t')
    }

    // Extract array field (tags)
    const extractArrayField = (text: string, key: string): string[] => {
      const pattern = new RegExp(`"${key}"\\s*:\\s*\\[([^\\]]*?)\\]`, 'i')
      const match = text.match(pattern)
      if (!match) return []

      const items: string[] = []
      const itemPattern = /"([^"]+)"/g
      let itemMatch
      while ((itemMatch = itemPattern.exec(match[1])) !== null) {
        items.push(itemMatch[1])
      }
      return items
    }

    // Extract multiline content field (handles literal newlines in JSON)
    const extractContentField = (text: string): string => {
      // Find "content": position
      const contentMatch = text.match(/"content"\s*:\s*"/)
      if (!contentMatch || contentMatch.index === undefined) return ''

      const startIdx = contentMatch.index + contentMatch[0].length

      // Find the end - look for ",\n followed by another field or }\n for end
      // We need to find the closing quote that's followed by a comma or end of object
      let depth = 0
      let result = ''
      let i = startIdx

      while (i < text.length) {
        const char = text[i]
        const nextChars = text.substring(i, i + 20)

        // Check for end patterns: ", followed by field name or end of object
        if (char === '"' && depth === 0) {
          // Check what follows the quote
          const afterQuote = text.substring(i + 1).trim()
          if (afterQuote.startsWith(',') || afterQuote.startsWith('}')) {
            break
          }
          // Check for field patterns like: ",\n  "tags" or similar
          if (/^",?\s*(\n\s*)?"[a-zA-Z]/.test(text.substring(i, i + 30))) {
            break
          }
        }

        result += char
        i++
      }

      return result.replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\t/g, '\t')
    }

    // Try standard JSON parse first
    let parsed: Record<string, unknown> | null = null
    try {
      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0])
      }
    } catch {
      // JSON parse failed - will use field extraction
    }

    if (parsed && typeof parsed.title === 'string' && typeof parsed.content === 'string') {
      // Standard JSON parse worked
      refined = {
        title: parsed.title || currentContent.title,
        excerpt: (parsed.excerpt as string) || currentContent.excerpt || '',
        content: parsed.content || currentContent.content,
        tags: Array.isArray(parsed.tags) ? parsed.tags as string[] : (currentContent.tags || []),
        seoTitle: (parsed.seoTitle as string) || parsed.title || currentContent.title,
        seoDescription: (parsed.seoDescription as string) || (parsed.excerpt as string) || '',
      }
    } else {
      // Fall back to field-by-field extraction for malformed JSON
      const title = extractField(cleanContent, 'title')
      const excerpt = extractField(cleanContent, 'excerpt')
      const seoTitle = extractField(cleanContent, 'seoTitle')
      const seoDescription = extractField(cleanContent, 'seoDescription')
      const tags = extractArrayField(cleanContent, 'tags')
      const contentValue = extractContentField(cleanContent)

      refined = {
        title: title || currentContent.title,
        excerpt: excerpt || currentContent.excerpt || '',
        content: contentValue || currentContent.content,
        tags: tags.length > 0 ? tags : (currentContent.tags || []),
        seoTitle: seoTitle || title || currentContent.title,
        seoDescription: seoDescription || excerpt || '',
      }

      logger.info('Used fallback JSON extraction', {
        titleExtracted: !!title,
        contentExtracted: !!contentValue,
        excerptExtracted: !!excerpt,
      })
    }

    // Validate required fields
    if (!refined.title || !refined.content) {
      return apiError(
        new Error('Missing required fields in AI response'),
        'Unvollständige KI-Antwort. Bitte versuchen Sie es erneut.'
      )
    }

    logger.info('Blog post refined with AI', {
      instruction: instruction.substring(0, 100),
      userId: session.user.id,
      titleChanged: refined.title !== currentContent.title,
      contentLengthBefore: currentContent.content.length,
      contentLengthAfter: refined.content.length,
    })

    return apiSuccess({
      refined: {
        title: refined.title,
        excerpt: refined.excerpt,
        content: refined.content,
        tags: refined.tags,
        seoTitle: refined.seoTitle,
        seoDescription: refined.seoDescription,
      },
    })
  } catch (error) {
    logger.error('Failed to refine blog post', { error })
    return apiError(error, 'Blog-Verbesserung fehlgeschlagen')
  }
}
