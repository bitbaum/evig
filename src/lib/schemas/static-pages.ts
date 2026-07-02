import { z } from 'zod'

/**
 * Static pages (admin CMS) — validation for /api/admin/pages.
 * Field names mirror the admin UI payloads (snake_case, matches PageData in
 * useEditStaticPage / the new-page form).
 */
export const StaticPageSchema = z.object({
  title: z.string().min(1, 'Titel ist erforderlich').max(200),
  slug: z
    .string()
    .min(1, 'URL-Slug ist erforderlich')
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug darf nur Kleinbuchstaben, Zahlen und Bindestriche enthalten'),
  content: z.string().default(''),
  is_published: z.boolean().default(false),
  seo_title: z.string().max(200).optional().nullable(),
  seo_description: z.string().max(500).optional().nullable(),
})

export type StaticPageInput = z.infer<typeof StaticPageSchema>
