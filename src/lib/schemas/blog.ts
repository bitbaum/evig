import { z } from 'zod'
import { locales, defaultLocale } from '@/i18n/routing'

// Non-default locales are the only valid translation targets — the German base
// lives on blog_posts itself, so a `de` translation row is rejected (SSOT: one
// place for the canonical text).
const translatableLocales = locales.filter((l) => l !== defaultLocale) as [string, ...string[]]

export const BlogTranslationSchema = z.object({
  locale: z.enum(translatableLocales),
  title: z.string().min(1, 'Titel ist erforderlich'),
  excerpt: z.string().optional().nullable(),
  content: z.string().min(1, 'Inhalt ist erforderlich'),
  seoTitle: z.string().optional().nullable(),
  seoDescription: z.string().optional().nullable(),
})

export type BlogTranslationInput = z.infer<typeof BlogTranslationSchema>

/** Full set of translations submitted with a post; one row per locale. */
export const BlogTranslationsSchema = z
  .array(BlogTranslationSchema)
  .max(locales.length - 1, 'Zu viele Übersetzungen')
  .refine(
    (arr) => new Set(arr.map((t) => t.locale)).size === arr.length,
    'Doppelte Sprache in den Übersetzungen',
  )

export const BlogSubmissionSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich'),
  email: z.string().email('Ungültige E-Mail-Adresse'),
  title: z.string().min(1, 'Titel ist erforderlich').max(200, 'Titel darf maximal 200 Zeichen lang sein'),
  content: z.string().min(1, 'Inhalt ist erforderlich'),
  category: z.string().optional().nullable(),
  submissionType: z.string().default('draft'),
  tags: z.array(z.string()).optional().default([]),
})

export type BlogSubmissionInput = z.infer<typeof BlogSubmissionSchema>
