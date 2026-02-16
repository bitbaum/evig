/**
 * API: AI Blog Post Generation
 *
 * POST /api/admin/blog/generate
 * Generates a blog post using AI based on a topic/prompt.
 *
 * Uses SSOT prompts from /src/lib/ai/config/prompts.ts
 */

import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/api/middleware'
import { canAccessSection } from '@/lib/permissions'
import { logger } from '@/lib/logger'
import { apiSuccess, apiError, apiForbidden, apiBadRequest } from '@/lib/api/helpers'
import { BLOG_PROMPTS, fillPromptTemplate } from '@/lib/ai/config/prompts'

const GROQ_API_KEY = process.env.GROQ_API_KEY || ''
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'llama-3.3-70b-versatile'

interface GeneratedBlogPost {
  title: string
  excerpt: string
  content: string
  tags: string[]
  seoTitle: string
  seoDescription: string
}

export const POST = withAdmin(async (request, session) => {
  try {
    // Check blog/content permission
    const user = {
      email: session.user.email,
      is_staff: session.user.isStaff,
      staff_permissions: session.user.staffPermissions,
      is_super_admin: session.user.isSuperAdmin,
    }

    // Allow access if user can access dashboard (all staff) since blog is content creation
    if (!canAccessSection(user, 'dashboard')) {
      return apiForbidden('Keine Berechtigung für Blog-Erstellung')
    }

    const body = await request.json()
    const { topic, category } = body

    if (!topic || typeof topic !== 'string') {
      return apiBadRequest('Thema ist erforderlich')
    }

    if (!GROQ_API_KEY) {
      return apiError(
        new Error('AI-Service nicht konfiguriert'),
        'KI-Service nicht verfügbar. Bitte GROQ_API_KEY konfigurieren.',
        503
      )
    }

    // Build the prompt using SSOT prompts
    const topicWithCategory = category
      ? `${topic} (Kategorie: ${category})`
      : topic

    const userPrompt = fillPromptTemplate(BLOG_PROMPTS.generate, {
      topic: topicWithCategory,
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
        'Fehler bei der KI-Generierung. Bitte versuchen Sie es erneut.'
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
    let generated: GeneratedBlogPost
    try {
      // Helper to extract string value between quotes after a key
      const extractField = (text: string, key: string): string => {
        // Match the key and capture everything until the next key or closing brace
        const keyPattern = new RegExp(`"${key}"\\s*:\\s*"`, 'i')
        const keyMatch = text.match(keyPattern)
        if (!keyMatch) return ''

        const startIdx = keyMatch.index! + keyMatch[0].length
        let depth = 0
        let inString = true
        let result = ''

        for (let i = startIdx; i < text.length; i++) {
          const char = text[i]
          const prevChar = i > 0 ? text[i - 1] : ''

          if (char === '"' && prevChar !== '\\') {
            // End of string value
            break
          }
          result += char
        }

        // Unescape any escaped quotes
        return result.replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\t/g, '\t')
      }

      // Extract array field (tags)
      const extractArrayField = (text: string, key: string): string[] => {
        const pattern = new RegExp(`"${key}"\\s*:\\s*\\[([^\\]]*?)\\]`, 'i')
        const match = text.match(pattern)
        if (!match) return []

        // Extract individual strings from the array
        const items: string[] = []
        const itemPattern = /"([^"]+)"/g
        let itemMatch
        while ((itemMatch = itemPattern.exec(match[1])) !== null) {
          items.push(itemMatch[1])
        }
        return items
      }

      // Extract fields using the helper
      const title = extractField(content, 'title')
      const excerpt = extractField(content, 'excerpt')
      const seoTitle = extractField(content, 'seoTitle')
      const seoDescription = extractField(content, 'seoDescription')
      const tags = extractArrayField(content, 'tags')

      // Content is special - it may contain markdown with newlines
      // Find content field and extract everything until the closing quote before "tags"
      const contentStart = content.indexOf('"content"')
      const tagsStart = content.indexOf('"tags"')
      if (contentStart === -1) {
        throw new Error('Content field not found')
      }

      let contentValue = ''
      if (tagsStart > contentStart) {
        // Extract between content and tags
        const segment = content.substring(contentStart, tagsStart)
        const colonIdx = segment.indexOf(':')
        if (colonIdx !== -1) {
          let inner = segment.substring(colonIdx + 1).trim()
          // Remove leading quote
          if (inner.startsWith('"')) inner = inner.substring(1)
          // Remove trailing quote and comma
          inner = inner.replace(/",?\s*$/, '')
          contentValue = inner.replace(/\\n/g, '\n').replace(/\\"/g, '"')
        }
      }

      generated = {
        title,
        excerpt,
        content: contentValue,
        tags,
        seoTitle,
        seoDescription,
      }
    } catch (parseError) {
      logger.error('Failed to parse AI response', {
        content: content.substring(0, 500),
        error: parseError instanceof Error ? parseError.message : 'Unknown parse error'
      })
      return apiError(
        new Error('Invalid AI response format'),
        'Fehler beim Verarbeiten der KI-Antwort. Bitte versuchen Sie es erneut.'
      )
    }

    // Validate required fields
    if (!generated.title || !generated.content) {
      return apiError(
        new Error('Missing required fields in AI response'),
        'Unvollständige KI-Antwort. Bitte versuchen Sie es erneut.'
      )
    }

    logger.info('Blog post generated with AI', {
      topic,
      userId: session.user.id,
      titleLength: generated.title.length,
      contentLength: generated.content.length,
    })

    return apiSuccess({
      generated: {
        title: generated.title,
        excerpt: generated.excerpt || '',
        content: generated.content,
        tags: Array.isArray(generated.tags) ? generated.tags : [],
        seoTitle: generated.seoTitle || generated.title,
        seoDescription: generated.seoDescription || generated.excerpt || '',
      },
    })
  } catch (error) {
    logger.error('Failed to generate blog post', { error })
    return apiError(error, 'Blog-Generierung fehlgeschlagen')
  }
})
