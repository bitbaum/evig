/**
 * API: AI Blog Post Refinement
 *
 * POST /api/admin/blog/refine
 * Refines an existing blog post using AI based on instructions.
 */

import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/api/middleware'
import { canAccessSection } from '@/lib/permissions'
import { logger } from '@/lib/logger'
import { apiSuccess, apiError, apiForbidden, apiBadRequest } from '@/lib/api/helpers'
import { BLOG_PROMPTS, fillPromptTemplate } from '@/lib/ai/config/prompts'
import { callWithFallback } from '@/lib/ai/providers'
import { robustJsonExtract } from '@/lib/ai/extract'

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

export const POST = withAdmin(async (request, session) => {
  try {
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

    // Build the refinement prompt
    const userPrompt = fillPromptTemplate(BLOG_PROMPTS.refine, {
      title: currentContent.title,
      excerpt: currentContent.excerpt || '',
      content: currentContent.content,
      tags: (currentContent.tags || []).join(', '),
      instruction: instruction,
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
    const parsed = robustJsonExtract<RefinedBlogPost>(content)

    let refined: RefinedBlogPost
    if (parsed && parsed.title && parsed.content) {
      refined = {
        title: parsed.title || currentContent.title,
        excerpt: parsed.excerpt || currentContent.excerpt || '',
        content: parsed.content || currentContent.content,
        tags: Array.isArray(parsed.tags) ? parsed.tags : (currentContent.tags || []),
        seoTitle: parsed.seoTitle || parsed.title || currentContent.title,
        seoDescription: parsed.seoDescription || parsed.excerpt || '',
      }
    } else {
      logger.error('Failed to parse AI response', {
        content: content.substring(0, 500),
      })
      return apiError(
        new Error('Invalid AI response format'),
        'Fehler beim Verarbeiten der KI-Antwort. Bitte versuchen Sie es erneut.'
      )
    }

    logger.info('Blog post refined with AI', {
      instruction: instruction.substring(0, 100),
      userId: session.user.id,
      provider: result.provider,
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
})
