/**
 * API: AI Blog Post Generation
 *
 * POST /api/admin/blog/generate
 * Generates a blog post using AI based on a topic/prompt.
 */

import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { canAccessSection } from '@/lib/permissions'
import { logger } from '@/lib/logger'
import { apiSuccess, apiError, apiUnauthorized, apiForbidden, apiBadRequest } from '@/lib/api/helpers'

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

const SYSTEM_PROMPT = `Du bist ein erfahrener Blog-Autor für RevampIT, einen Schweizer Non-Profit-Verein für nachhaltige IT.
Du schreibst auf Deutsch mit Schweizer Schreibweise (verwende "ss" statt "ß", z.B. "Strasse" statt "Straße").

RevampIT's Mission:
- Förderung von nachhaltiger Technologie und Kreislaufwirtschaft
- Reparatur statt Wegwerfen
- Refurbished Hardware als Alternative zu Neugeräten
- Open-Source Software und Hardware
- Digitale Inklusion und Community-Building

Dein Schreibstil:
- Informativ aber zugänglich
- Nicht zu formell, aber professionell
- Praktische Tipps und Anleitungen wenn passend
- Umweltbewusst ohne belehrend zu sein
- Positiv und lösungsorientiert

Formatiere den Artikel in Markdown mit:
- Überschriften (##, ###)
- Aufzählungen wo sinnvoll
- Hervorhebungen (**fett** für wichtige Begriffe)
- Kurze, lesbare Absätze

Die Artikel sollten 400-800 Wörter lang sein.`

const GENERATION_PROMPT = `Basierend auf dem folgenden Thema/Prompt, generiere einen kompletten Blog-Artikel:

THEMA: {topic}

Antworte im folgenden JSON-Format:
{
  "title": "Aussagekräftiger Titel",
  "excerpt": "Kurze Zusammenfassung in 1-2 Sätzen (max 160 Zeichen)",
  "content": "Der vollständige Artikel in Markdown",
  "tags": ["tag1", "tag2", "tag3"],
  "seoTitle": "SEO-optimierter Titel (kann gleich wie title sein)",
  "seoDescription": "SEO-Beschreibung für Suchmaschinen (max 160 Zeichen)"
}

Wichtig:
- Antworte NUR mit dem JSON, kein zusätzlicher Text
- Verwende Schweizer Deutsch (ss statt ß)
- Der Artikel sollte 400-800 Wörter umfassen
- Tags sollten relevant und auf Deutsch sein`

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

    // Build the prompt
    const topicWithCategory = category
      ? `${topic} (Kategorie: ${category})`
      : topic

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: GENERATION_PROMPT.replace('{topic}', topicWithCategory) },
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

    // Parse the JSON response
    let generated: GeneratedBlogPost
    try {
      // Extract JSON from the response (handle potential markdown code blocks)
      let jsonStr = content
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (jsonMatch) {
        jsonStr = jsonMatch[1]
      }
      generated = JSON.parse(jsonStr.trim())
    } catch {
      logger.error('Failed to parse AI response', { content })
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
}
