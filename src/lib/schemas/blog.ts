import { z } from 'zod'

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
