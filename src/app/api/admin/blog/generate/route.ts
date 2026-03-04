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
import { logger } from '@/lib/logger'
import { apiSuccess, apiError, apiBadRequest } from '@/lib/api/helpers'
import { BLOG_PROMPTS, fillPromptTemplate } from '@/lib/ai/config/prompts'
import { callWithFallback, buildFailureMessage } from '@/lib/ai/providers'
import { robustJsonExtract } from '@/lib/ai/extract'

interface GeneratedBlogPost {
  title: string
  excerpt: string
  content: string
  tags: string[]
  seoTitle: string
  seoDescription: string
}

export const POST = withAdmin('content', async (request, session) => {
  try {
    const body = await request.json()
    const { topic, category } = body

    if (!topic || typeof topic !== 'string') {
      return apiBadRequest('Thema ist erforderlich')
    }

    // Build the prompt using SSOT prompts
    const topicWithCategory = category
      ? `${topic} (Kategorie: ${category})`
      : topic

    const userPrompt = fillPromptTemplate(BLOG_PROMPTS.generate, {
      topic: topicWithCategory,
    })

    const result = await callWithFallback({
      systemPrompt: BLOG_PROMPTS.system,
      userPrompt,
      temperature: 0.7,
      maxTokens: 4096,
    })

    if (!result) {
      return apiError(
        new Error('All AI providers failed'),
        'KI-Service nicht verfügbar. Bitte später erneut versuchen.',
        503
      )
    }

    const content = result.text
    if (!content) {
      return apiError(
        new Error('Empty AI response'),
        'Keine Antwort vom KI-Service erhalten'
      )
    }

    // Parse the JSON response using robust extractor
    const parsed = robustJsonExtract<GeneratedBlogPost>(content)
    if (!parsed) {
      logger.error('Failed to parse AI response', {
        content: content.substring(0, 500),
      })
      return apiError(
        new Error('Invalid AI response format'),
        'Fehler beim Verarbeiten der KI-Antwort. Bitte versuchen Sie es erneut.'
      )
    }

    // Validate required fields
    if (!parsed.title || !parsed.content) {
      return apiError(
        new Error('Missing required fields in AI response'),
        'Unvollständige KI-Antwort. Bitte versuchen Sie es erneut.'
      )
    }

    logger.info('Blog post generated with AI', {
      topic,
      userId: session.user.id,
      provider: result.provider,
      titleLength: parsed.title.length,
      contentLength: parsed.content.length,
    })

    return apiSuccess({
      generated: {
        title: parsed.title,
        excerpt: parsed.excerpt || '',
        content: parsed.content,
        tags: Array.isArray(parsed.tags) ? parsed.tags : [],
        seoTitle: parsed.seoTitle || parsed.title,
        seoDescription: parsed.seoDescription || parsed.excerpt || '',
      },
    })
  } catch (error) {
    logger.error('Failed to generate blog post', { error })
    return apiError(error, 'Blog-Generierung fehlgeschlagen')
  }
})
